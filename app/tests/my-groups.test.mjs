import test from 'node:test';
import assert from 'node:assert/strict';
import {setupCommunity} from './helpers/community.mjs';
import {MyGroupsClient,groupStatus,groupDirectory,selectDefaultGroup,nextGroupActivity} from '../src/lib/my-groups.mjs';
import {roomHeartbeat,roomClock} from '../src/lib/room-timer-client.mjs';
import {readGroupDraft,writeGroupDraft,rememberGroupsReturn,readGroupsReturn} from '../src/lib/group-center-draft.mjs';
const storage=()=>{const values=new Map();return{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};};
function client(s,user,extra={}){const calls=[],request=async(path,method='GET',data)=>{calls.push({path,method,data});const value=await s.call(path,method,data,user);if(value.status>=400)throw Object.assign(Error(value.error.message),{code:value.error.code,status:value.status});return value;};return Object.assign(new MyGroupsClient({request,accountId:user.id,storage:storage(),origin:'https://study.test',now:()=>s.now,...extra}),{calls});}

test('room creation saves a preset theme atomically, retries once and never creates study credit',async()=>{
 const s=await setupCommunity();try{const user=await s.user('host'),c=client(s,user);await c.refresh();assert.equal(c.state.me.rooms.length,0);
 let lost=true;const request=c.request;c.request=async(...args)=>{const result=await request(...args);if(args[0]==='/rooms'&&args[1]==='POST'&&lost){lost=false;throw Object.assign(Error('Connection lost after save'),{code:'OFFLINE'});}return result;};
 const values={name:'Maths friends',subject:'maths',visibility:'private'};assert.equal(await c.create(values),false);assert.match(c.state.error,/Connection lost/);assert.equal(await c.create(values),true);
 assert.equal(c.state.me.rooms.length,1);assert.equal(c.state.detail.room.subject,'maths');assert.equal(c.state.me.rooms[0].place_limit,4);assert.equal(c.state.me.timer,null);assert.equal(s.db.prepare('SELECT count(*) n FROM community_daily').get().n,0);
 const creates=c.calls.filter(r=>r.path==='/rooms'&&r.method==='POST');assert.equal(creates.length,2);assert.equal(creates[0].data.id,creates[1].data.id);assert.equal(s.db.prepare('SELECT study_subject FROM community_rooms').get().study_subject,'maths');
 const bad=await s.call('/rooms','POST',{id:crypto.randomUUID(),name:'Bad theme',subject:'made-up',visibility:'public',capacity:4,goalMinutes:120},user);assert.equal(bad.status,400);
 }finally{s.close();}
});

test('a full invitation is explained before joining; explicit consent and valid invitation are required',async()=>{
 const s=await setupCommunity();try{const host=await s.user('host'),user=await s.user('learner'),room=await s.room(host),c=client(s,user);await c.refresh();
 assert.equal(await c.findInvitation('not a valid code'),false);assert.equal(c.state.invitation,null);
 assert.equal(await c.findInvitation('https://study.test/study-groups?invite='+room.code),true);assert.equal(c.state.invitation.room.id,room.id);assert.equal(await c.join(false),false);assert.equal(c.state.me.rooms.length,0);
 assert.equal(await c.join(true),true);assert.equal(c.state.selectedId,room.id);assert.equal(c.state.detail.owner,false);assert.ok(!('inviteCode' in c.state.detail.room));assert.equal(c.state.me.timer,null);
 const me=await s.call('/me','GET',undefined,user);assert.ok(!JSON.stringify(me.rooms).includes(room.code));assert.equal(me.rooms[0].subject,'general');
 const guests=await Promise.all([s.user('guestone'),s.user('guesttwo')]);for(const a of guests)await s.call('/rooms/'+room.id+'/join','POST',{accepted:true,code:room.code},a);
 const extra=await s.user('latelearner'),last=client(s,extra);await last.refresh();assert.equal(await last.findInvitation(room.code),true);assert.equal(last.state.invitation.room.members,4);assert.equal(await last.join(true),false);assert.match(last.state.error,/no available place/);assert.equal(last.state.me.rooms.length,0);
 }finally{s.close();}
});

test('free-room reasons remain separate from seats; an owner switch is versioned and pauses losing timers',async()=>{
 const s=await setupCommunity();try{const owner=await s.user('owner');s.subscribe(owner);const first=await s.room(owner);s.advance(1);const second=await s.room(owner);s.db.prepare('UPDATE community_entitlements SET expires_at=? WHERE account_id=?').run(s.now-1,owner.id);
 const c=client(s,owner);await c.refresh();assert.equal(c.state.selectedId,first.id);await c.timerStart();const timerId=c.state.me.timer.lease;s.advance(30000);
 await c.select(second.id);assert.equal(c.state.me.timer.lease,timerId);assert.equal(c.state.me.timer.status,'running');assert.equal(groupStatus(c.state.me.rooms.find(r=>r.id===second.id)).key,'room');
 assert.equal(await c.useFreeRoom(false),false);assert.equal(c.state.me.timer.status,'running');assert.equal(await c.useFreeRoom(true),true);assert.equal(c.state.detail.access.canParticipate,true);assert.equal(c.state.me.timer.status,'paused');assert.equal(s.db.prepare('SELECT sum(seconds) n FROM community_credits').get().n,30);
 const learner=await s.user('learner');assert.equal((await s.call('/invite','POST',{code:first.code},learner)).room.readOnly,true);
 assert.equal(groupStatus({room_active:1,can_participate:0}).key,'seat');assert.equal(groupStatus({closed_at:s.now,can_participate:0}).key,'closed');
 }finally{s.close();}
});

test('selecting a different room never transfers a running timer; foreign leases cannot pause it',async()=>{
 const s=await setupCommunity();try{const user=await s.user('host');s.subscribe(user);const first=await s.room(user),second=await s.room(user),c=client(s,user);await c.refresh();await c.select(first.id);assert.equal(await c.timerStart(),true);const before=c.state.me.timer;
 await c.select(second.id);assert.equal(c.state.me.timer.lease,before.lease);assert.equal(await c.timerStart(),false);assert.match(c.state.error,/already running/);assert.equal(c.state.me.timer.room_id,first.id);
 const other=client(s,user);await other.refresh();assert.equal(await other.timerPause(),false);assert.match(other.state.error,/another tab/);assert.equal(other.calls.filter(r=>r.path==='/timer/pause').length,0);
 assert.equal(await c.timerPause(),true);assert.equal(c.state.me.timer.status,'paused');assert.equal(await c.timerStart(),true);assert.equal(c.state.me.timer.room_id,second.id);
 assert.equal(roomClock(c.state.me.timer,c.lease,0,second.id).live,false);
 }finally{s.close();}
});

test('activity reservation keeps the task private and does not start a timer',async()=>{
 const s=await setupCommunity();try{const host=await s.user('host'),learner=await s.user('learner'),room=await s.room(host);await s.call('/rooms/'+room.id+'/join','POST',{code:room.code,accepted:true},learner);const id=crypto.randomUUID();
 const created=await s.call('/rooms/'+room.id+'/activities','POST',{id,subject:'maths',kind:'focus',date:'2026-11-14',time:'12:00',zone:'UTC',focusMinutes:25,breakMinutes:5},host);assert.equal(created.status,201);
 const c=client(s,learner);await c.refresh();const activity=c.state.activities.find(a=>a.id===id);assert.ok(activity);assert.equal(await c.joinActivity(activity,{subject:'maths',task:'My private algebra task'}),true);assert.equal(c.state.activities.find(a=>a.id===id).joined,true);assert.equal(c.state.me.timer,null);
 assert.equal(await c.joinActivity(activity,{subject:'maths',task:'Accidental overwrite'}),false);const detail=await s.call('/rooms/'+room.id+'/activities/'+id,'GET',undefined,learner);assert.equal(detail.own.task,'My private algebra task');const outsider=await s.call('/rooms/'+room.id+'/activities/'+id,'GET',undefined,host);assert.ok(!JSON.stringify(outsider).includes('My private algebra task'));
 }finally{s.close();}
});

test('duplicate mutations are coalesced and disposed or superseded reads cannot restore old room data',async()=>{
 const c=new MyGroupsClient({accountId:'one',request:async()=>({rooms:[]}),storage:storage()});let release,count=0;const first=c.run(async()=>{count++;await new Promise(r=>release=r);return true;});assert.equal(await c.run(()=>{count++;}),false);release();await first;assert.equal(count,1);
 let resolve;const delayed=new MyGroupsClient({accountId:'one',request:()=>new Promise(r=>resolve=r),storage:storage()});const load=delayed.refreshMe();delayed.dispose();resolve({profile:{id:'private'},rooms:[],timer:null,serverNow:1});await load;assert.equal(delayed.state.me,null);
 let latest,old;const ordered=new MyGroupsClient({accountId:'one',request:()=>new Promise(r=>{if(!old)old=r;else latest=r;}),storage:storage()});const a=ordered.refreshMe(),b=ordered.refreshMe();latest({profile:{id:'new'},rooms:[],serverNow:2,timer:null});await b;old({profile:{id:'old'},rooms:[],serverNow:1,timer:null});await a;assert.equal(ordered.state.me.profile.id,'new');
});

test('heartbeat shares the existing lease protocol, coalesces ticks and stops callbacks on unmount',async()=>{
 let tick,complete,calls=0,updates=0,cancelled=false;const stop=roomHeartbeat({lease:'owned',request:async(path,method,data)=>{assert.equal(path,'/timer/heartbeat');assert.equal(method,'POST');assert.deepEqual(data,{lease:'owned'});calls++;return new Promise(r=>complete=r);},onResult:()=>updates++,onError:()=>assert.fail(),schedule:fn=>{tick=fn;return 1;},cancel:()=>cancelled=true});
 const pending=tick();await tick();assert.equal(calls,1);stop();complete({timer:{status:'running'}});await pending;assert.equal(updates,0);assert.equal(cancelled,true);
});

test('drafts are tab-local, account-scoped and expire; directory filters preserve distinct same-name rooms',()=>{
 const s=storage(),now=1000;writeGroupDraft('one',{invite:'privatecode',name:'My room',subject:'maths',visibility:'private'},s,now);assert.equal(readGroupDraft('one',s,now+1).name,'My room');assert.equal(readGroupDraft('two',s,now+1).name,'');assert.equal(readGroupDraft('one',s,now+600001).name,'');rememberGroupsReturn('one','room',s,now);assert.equal(readGroupsReturn('two',s,now+1),null);assert.equal(readGroupsReturn('one',s,now+1).roomId,'room');
 const rooms=[{id:'one',name:'Same',subject:'maths',members:1,capacity:4,joinLimit:4,can_participate:0},{id:'two',name:'Same',subject:'science',members:1,capacity:4,joinLimit:4,can_participate:1},{id:'full',name:'Full',members:4,joinLimit:4}];assert.equal(groupDirectory(rooms).length,2);assert.equal(groupDirectory(rooms,{subject:'maths',available:true}).length,1);assert.equal(selectDefaultGroup(rooms,null),'two');assert.equal(selectDefaultGroup(rooms,{status:'running',room_id:'one'}),'one');assert.equal(nextGroupActivity([{status:'ended'},{id:'next',status:'scheduled',startsAt:2000}],1000).id,'next');
});
