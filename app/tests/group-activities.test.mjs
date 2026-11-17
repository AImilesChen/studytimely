import test from 'node:test';
import assert from 'node:assert/strict';
import {setupCommunity as setup,reviewResult} from './helpers/community.mjs';
import {activityInput,activityPhase,activityWall} from '../src/lib/group-activities.mjs';
import {communityMaintenance} from '../server/community.mjs';
const payload=(s,patch={})=>({id:crypto.randomUUID(),subject:'maths',kind:'practice',...activityWall(s.now+600000,'Europe/London'),zone:'Europe/London',focusMinutes:25,breakMinutes:5,...patch});
async function create(s,r,owner,patch={}){const input=payload(s,patch),reply=await s.call('/rooms/'+r.id+'/activities','POST',input,owner);assert.equal(reply.status,201,JSON.stringify(reply));return input.id;}
const route=(r,id,suffix='')=>'/rooms/'+r.id+'/activities/'+id+suffix;
const detail=(s,r,id,a)=>s.call(route(r,id),'GET',undefined,a);
const join=(s,r,id,a,patch={})=>s.call(route(r,id,'/participation'),'PUT',{subject:'maths',task:'Practise ten algebra questions',...patch},a);
async function start(s,r,id,a){const d=await detail(s,r,id,a);const reply=await s.call(route(r,id,'/start'),'POST',{version:d.activity.version},a);assert.equal(reply.status,200,JSON.stringify(reply));}
async function member(s,r,a){assert.equal((await s.call('/rooms/'+r.id+'/join','POST',{code:r.code,accepted:true},a)).status,200);}
test('activity wall times reject DST gaps, require repeated-time choice and preserve date across zones',()=>{
 const now=Date.UTC(2026,9,1),base={subject:'maths',kind:'practice',zone:'America/New_York',date:'2026-11-01',time:'01:30',focusMinutes:25,breakMinutes:5};
 assert.throws(()=>activityInput(base,now),/occurs twice/);const first=activityInput({...base,fold:'earlier'},now),second=activityInput({...base,fold:'later'},now);assert.equal(second.startsAt-first.startsAt,3600000);
 assert.throws(()=>activityInput({...base,date:'2027-03-14',time:'02:30'},Date.UTC(2027,2,1)),/does not exist/);
 assert.deepEqual(activityWall(Date.UTC(2026,10,17,23,45),'Asia/Shanghai'),{date:'2026-11-18',time:'07:45'});
 assert.throws(()=>activityInput({...base,focusMinutes:121},now),/5–120/);assert.throws(()=>activityInput({...base,zone:'invalid'},now),/time zone/);
 assert.equal(activityPhase({status:'running',startedAt:0,focusMinutes:5,breakMinutes:5},300000),'break');
});
test('two members reserve, start their own timers, check out and receive a private-safe accurate summary',async()=>{
 const s=await setup();try{const host=await s.user('host'),learner=await s.user('learner'),r=await s.room(host);await member(s,r,learner);const id=await create(s,r,host);
 assert.equal((await join(s,r,id,host,{task:'Host private task'})).status,200);assert.equal((await join(s,r,id,learner,{task:'Learner private task'})).status,200);await start(s,r,id,host);
 let d=await detail(s,r,id,host);assert.equal(d.summary.attended,0);assert.equal(d.summary.seconds,0);assert.equal(d.own.task,'Host private task');assert.ok(!JSON.stringify(d).includes('Learner private task'));assert.equal(s.db.prepare('SELECT count(*) n FROM community_timers').get().n,0);
 const timer1=await s.call('/timer/start','POST',{roomId:r.id,activityId:id},host);assert.equal(timer1.status,200);s.advance(30000);assert.equal((await s.call('/timer/heartbeat','POST',{lease:timer1.timer.lease},host)).status,200);
 const timer2=await s.call('/timer/start','POST',{roomId:r.id,activityId:id},learner);assert.equal(timer2.status,200);s.advance(30000);
 const checked=await s.call(route(r,id,'/checkout'),'POST',{version:1,outcome:'partial',reflection:'Private result',seconds:999999},learner);assert.equal(checked.status,200);assert.equal((await s.call('/timer/start','POST',{roomId:r.id,activityId:id},learner)).status,409);
 assert.equal((await s.call(route(r,id,'/end'),'POST',{version:2},host)).status,200);d=await detail(s,r,id,host);assert.equal(d.activity.status,'ended');assert.equal(d.summary.seconds,90);assert.equal(d.summary.attended,2);assert.equal(d.summary.checkedOut,1);assert.ok(!JSON.stringify(d).includes('Private result'));
 const own=await detail(s,r,id,learner);assert.equal(own.own.reflection,'Private result');assert.equal(own.own.seconds,30);assert.equal((await s.call(route(r,id,'/checkout'),'POST',{version:2,outcome:'completed',reflection:'Updated private result'},learner)).status,200);assert.equal((await detail(s,r,id,host)).summary.seconds,90);
 assert.equal(s.db.prepare('SELECT sum(seconds) n FROM community_daily').get().n,90);assert.equal(s.db.prepare('SELECT sum(seconds) n FROM community_room_daily').get().n,90);
 }finally{s.close();}
});
test('activities require membership, protect other rooms, reject member organisation and enforce CSRF',async()=>{
 const s=await setup();try{const host=await s.user('host'),learner=await s.user('learner'),outsider=await s.user('outsider'),r=await s.room(host),other=await s.room(outsider);await member(s,r,learner);const id=await create(s,r,host);
 assert.equal((await detail(s,r,id,{})).status,404);assert.equal((await detail(s,r,id,outsider)).status,404);assert.equal((await detail(s,other,id,outsider)).status,404);
 assert.equal((await s.call('/rooms/'+r.id+'/activities','POST',payload(s),learner)).status,403);
 assert.equal((await s.call(route(r,id,'/start'),'POST',{version:1},learner)).status,403);
 assert.equal((await s.call(route(r,id,'/participation'),'PUT',{subject:'maths',task:'Private task'},{cookie:learner.cookie})).status,403);
 assert.equal((await s.call('/rooms/'+r.id+'/home','PATCH',{subject:'maths',announcement:'quiet',version:1},learner)).status,403);
 assert.equal((await s.call('/rooms/'+r.id+'/members','PATCH',{profileId:learner.profileId,action:'remove'},host)).status,200);assert.equal((await detail(s,r,id,learner)).status,404);
 }finally{s.close();}
});
test('safe standard activities work without a review provider; free public text never bypasses review',async()=>{
 let requests=0;const s=await setup({reviewFetch:async()=>{requests++;return reviewResult();}});try{const host=await s.user('host'),r=await s.room(host);delete s.env.AZURE_CONTENT_SAFETY_KEY;
 const id=await create(s,r,host);assert.equal((await s.call('/rooms/'+r.id+'/activities','POST',payload(s,{customTitle:'Our special revision'}),host)).status,503);
 assert.equal((await s.call('/rooms/'+r.id+'/activities','POST',payload(s,{customTitle:'add me on discord'}),host)).status,422);
 assert.equal((await s.call('/rooms/'+r.id+'/home','PATCH',{subject:'maths',announcement:'my arbitrary public text',version:1},host)).status,400);
 assert.equal((await join(s,r,id,host)).status,200);assert.equal((await s.call('/rooms/'+r.id+'/messages','POST',{id:crypto.randomUUID(),text:'hello'},host)).status,503);assert.equal(requests,0);assert.equal((await detail(s,r,id,host)).customTitlesAvailable,false);
 }finally{s.close();}
});
test('edits use versions, cancel is retained, duplicate creation is idempotent and only one activity runs',async()=>{
 const s=await setup();try{const host=await s.user('host'),r=await s.room(host),input=payload(s),created=await s.call('/rooms/'+r.id+'/activities','POST',input,host);assert.equal(created.status,201);assert.equal((await s.call('/rooms/'+r.id+'/activities','POST',input,host)).status,200);
 const id=input.id;assert.equal((await s.call(route(r,id),'PATCH',{...payload(s),version:1,focusMinutes:50},host)).status,200);assert.equal((await s.call(route(r,id),'PATCH',{...payload(s),version:1},host)).status,409);
 await start(s,r,id,host);const next=await create(s,r,host);assert.equal((await s.call(route(r,next,'/start'),'POST',{version:1},host)).error.code,'ACTIVITY_ACTIVE');
 assert.equal((await s.call(route(r,next,'/cancel'),'POST',{version:1},host)).status,200);assert.equal((await s.call(route(r,next,'/cancel'),'POST',{version:1},host)).status,200);assert.equal((await detail(s,r,next,host)).activity.status,'cancelled');assert.equal((await join(s,r,next,host)).status,409);
 }finally{s.close();}
});
test('activity accounting splits UTC midnight, excludes breaks, preserves cap and never fills an offline gap',async()=>{
 const s=await setup();try{s.setTime(Date.UTC(2026,10,13,23,59,30));const host=await s.user('host'),r=await s.room(host),id=await create(s,r,host,{focusMinutes:5,breakMinutes:5});await join(s,r,id,host);await start(s,r,id,host);
 const startReply=await s.call('/timer/start','POST',{roomId:r.id,activityId:id},host),lease=startReply.timer.lease;s.advance(60000);await s.call('/timer/heartbeat','POST',{lease},host);assert.deepEqual(s.db.prepare('SELECT day,seconds FROM community_daily ORDER BY day').all().map(x=>({...x})),[{day:'2026-11-13',seconds:30},{day:'2026-11-14',seconds:30}]);
 s.advance(91000);await s.call('/timer/heartbeat','POST',{lease},host);assert.equal((await detail(s,r,id,host)).summary.seconds,60);
 const resumed=await s.call('/timer/start','POST',{roomId:r.id,activityId:id},host);assert.equal(resumed.status,200);s.advance(60000);await s.call('/timer/heartbeat','POST',{lease:resumed.timer.lease},host);s.advance(60000);await s.call('/timer/heartbeat','POST',{lease:resumed.timer.lease},host);s.advance(60000);await s.call('/timer/heartbeat','POST',{lease:resumed.timer.lease},host);
 assert.equal((await detail(s,r,id,host)).summary.seconds,209);assert.equal((await s.call('/timer/start','POST',{roomId:r.id,activityId:id},host)).status,409);s.advance(300000);const ended=await detail(s,r,id,host);assert.equal(ended.activity.status,'ended');assert.equal(ended.summary.seconds,209);
 }finally{s.close();}
});
test('withdrawal pauses credit, versions reject stale task/result edits, and rejoin does not duplicate a person',async()=>{
 const s=await setup();try{const host=await s.user('host'),r=await s.room(host),id=await create(s,r,host);await join(s,r,id,host);assert.equal((await join(s,r,id,host,{version:0})).status,409);await start(s,r,id,host);
 const t=await s.call('/timer/start','POST',{roomId:r.id,activityId:id},host);s.advance(30000);assert.equal((await s.call(route(r,id,'/withdraw'),'POST',{version:1},host)).status,200);assert.equal((await detail(s,r,id,host)).summary.seconds,30);assert.equal(s.db.prepare('SELECT status FROM community_timers').get().status,'paused');assert.equal((await s.call('/timer/start','POST',{roomId:r.id,activityId:id},host)).status,409);
 assert.equal((await join(s,r,id,host,{version:2})).status,200);assert.equal((await detail(s,r,id,host)).summary.reserved,1);assert.equal((await s.call(route(r,id,'/checkout'),'POST',{version:2,outcome:'completed'},host)).status,409);assert.equal(t.status,200);
 }finally{s.close();}
});
test('closing a room ends activities without starting members and retained owner summaries are readable',async()=>{
 const s=await setup();try{const host=await s.user('host'),r=await s.room(host),id=await create(s,r,host),next=await create(s,r,host);await start(s,r,id,host);
 const closed=await s.call('/rooms/'+r.id+'/settings','PATCH',{name:'Closed room',goalMinutes:120,capacity:8,invitationsOpen:false,close:true,version:1},host);assert.equal(closed.status,200);assert.equal((await detail(s,r,id,host)).activity.status,'ended');assert.equal((await detail(s,r,next,host)).activity.status,'cancelled');assert.equal((await join(s,r,next,host)).status,409);
 }finally{s.close();}
});
test('90-day retention keeps future appointments, removes old private notes and cascades account deletion',async()=>{
 const s=await setup();try{const host=await s.user('host'),r=await s.room(host),future=await create(s,r,host,{...activityWall(s.now+120*86400000,'Europe/London')}),old=await create(s,r,host);await join(s,r,old,host,{task:'Private old task'});
 s.db.prepare("UPDATE community_activities SET starts_at=?,status='ended',ended_at=? WHERE id=?").run(s.now-91*86400000,s.now-91*86400000,old);await communityMaintenance(s.env,s.now);
 assert.equal((await detail(s,r,old,host)).status,404);assert.equal((await detail(s,r,future,host)).status,200);assert.equal(s.db.prepare('SELECT count(*) n FROM community_activity_members').get().n,0);
 s.db.prepare('DELETE FROM accounts WHERE id=?').run(host.id);assert.equal(s.db.prepare('SELECT count(*) n FROM community_activities').get().n,0);
 }finally{s.close();}
});
test('concurrent joins are one participant, activity start races cannot leave a timer running after end',async()=>{
 const s=await setup();try{const host=await s.user('host'),learner=await s.user('learner'),r=await s.room(host);await member(s,r,learner);const id=await create(s,r,host);
 const joined=await Promise.all([join(s,r,id,learner),join(s,r,id,learner)]);assert.equal(joined.filter(x=>x.status===200).length,1);assert.equal((await detail(s,r,id,host)).summary.reserved,1);await start(s,r,id,host);
 const replies=await Promise.all([s.call('/timer/start','POST',{roomId:r.id,activityId:id},learner),s.call(route(r,id,'/end'),'POST',{version:2},host)]);
 assert.ok([200,409].includes(replies[0].status));assert.equal(replies[1].status,200);const timer=s.db.prepare('SELECT status FROM community_timers WHERE profile_id=?').get(learner.profileId);assert.ok(!timer||timer.status!=='running');assert.equal((await detail(s,r,id,host)).summary.seconds,0);
 }finally{s.close();}
});
test('server-side scheduled-activity bound and repeated heartbeat settlement cannot inflate credit',async()=>{
 const s=await setup();try{const host=await s.user('host'),r=await s.room(host),id=await create(s,r,host);await join(s,r,id,host);await start(s,r,id,host);const t=await s.call('/timer/start','POST',{roomId:r.id,activityId:id},host);s.advance(30000);
 const hearts=await Promise.all([s.call('/timer/heartbeat','POST',{lease:t.timer.lease},host),s.call('/timer/heartbeat','POST',{lease:t.timer.lease},host)]);assert.ok(hearts.every(x=>x.status===200));assert.equal((await detail(s,r,id,host)).summary.seconds,30);assert.equal(s.db.prepare('SELECT seconds FROM community_daily').get().seconds,30);
 for(let i=0;i<20;i++)s.db.prepare('INSERT INTO community_activities(id,room_id,title,subject,kind,starts_at,zone,focus_minutes,break_minutes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(crypto.randomUUID(),r.id,'Quiet focus','general','focus',s.now+60000,'UTC',25,5,s.now,s.now);
 assert.throws(()=>s.db.prepare('INSERT INTO community_activities(id,room_id,title,subject,kind,starts_at,zone,focus_minutes,break_minutes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(crypto.randomUUID(),r.id,'Quiet focus','general','focus',s.now+60000,'UTC',25,5,s.now,s.now),/ACTIVITY_LIMIT/);
 }finally{s.close();}
});
test('leaving and removal withdraw upcoming reservations without erasing already verified results',async()=>{
 const s=await setup();try{const host=await s.user('host'),learner=await s.user('learner'),r=await s.room(host);await member(s,r,learner);const id=await create(s,r,host);await join(s,r,id,learner);
 assert.equal((await s.call('/rooms/'+r.id+'/leave','POST',{},learner)).status,200);assert.equal((await detail(s,r,id,host)).summary.reserved,0);assert.ok((await detail(s,r,id,host)).participants[0].withdrawn_at);
 await member(s,r,learner);assert.equal((await join(s,r,id,learner,{version:2})).status,200);await start(s,r,id,host);const t=await s.call('/timer/start','POST',{roomId:r.id,activityId:id},learner);s.advance(30000);await s.call('/timer/heartbeat','POST',{lease:t.timer.lease},learner);
 await s.call('/rooms/'+r.id+'/members','PATCH',{profileId:learner.profileId,action:'remove'},host);const d=await detail(s,r,id,host);assert.equal(d.summary.reserved,0);assert.equal(d.summary.seconds,30);assert.equal((await detail(s,r,id,learner)).status,404);
 }finally{s.close();}
});
