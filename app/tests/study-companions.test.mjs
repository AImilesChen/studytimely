import test from 'node:test';
import assert from 'node:assert/strict';
import {setupCommunity as setup,reviewResult} from './helpers/community.mjs';
import {companionState,companionSeconds} from '../src/lib/companion-model.mjs';
import {communityMaintenance} from '../server/community.mjs';
const path=r=>'/rooms/'+r.id;
const send=(s,r,a,data)=>s.call(path(r)+'/messages','POST',{id:crypto.randomUUID(),...data},a);
const interact=(s,r,a,b,kind='tap',extra={})=>s.call(path(r)+'/interactions','POST',{id:crypto.randomUUID(),targetId:b.profileId,kind,...extra},a);
async function join(s,r,a){assert.equal((await s.call(path(r)+'/join','POST',{accepted:true,code:r.code},a)).status,200);}
const online=s=>s.db.prepare('UPDATE community_members SET last_seen=?').run(s.now);

test('free capacity is server-enforced, includes owner/offline members, and concurrent joins cannot overfill',async()=>{
 const s=await setup();try{const a=await s.user('owner');assert.equal((await s.call('/rooms','POST',{id:crypto.randomUUID(),name:'Free room',visibility:'public',capacity:8,goalMinutes:60,paid:true,memberLimit:24},a)).status,403);
  const r=await s.room(a,'public'),people=await Promise.all(['one','two','three','four'].map(n=>s.user(n)));
  const replies=await Promise.all(people.map(b=>s.call(path(r)+'/join','POST',{accepted:true},b)));assert.equal(replies.filter(r=>r.status===200).length,3);assert.equal(replies.filter(r=>r.status===409).length,1);
  const view=await s.call(path(r),'GET',undefined,a);assert.equal(view.members.length,4);assert.equal(view.joinLimit,4);assert.equal(view.ownerMemberLimit,4);assert.ok(view.members.every(m=>m.state==='offline'));
  assert.equal((await s.call(path(r)+'/settings','PATCH',{name:'Free room',capacity:24,goalMinutes:60,invitationsOpen:true,version:1,paid:true},a)).status,403);
 }finally{s.close();}
});

test('capacity belongs to owner; free guests can join larger entitled rooms; expiry preserves existing members',async()=>{
 const s=await setup();try{const a=await s.user('owner');s.subscribe(a,{memberLimit:8});const r=await s.room(a,'public',8),people=[];for(let i=0;i<4;i++){const b=await s.user('guest'+i);people.push(b);await join(s,r,b);}
  assert.equal((await s.call('/me','GET',undefined,people[0])).entitlements.freeText,false);
  s.db.prepare('DELETE FROM community_entitlements WHERE account_id=?').run(a.id);const view=await s.call(path(r),'GET',undefined,a);assert.equal(view.members.length,5);assert.equal(view.room.capacity,8);assert.equal(view.joinLimit,4);
  const extra=await s.user('extra');assert.equal((await s.call(path(r)+'/join','POST',{accepted:true},extra)).status,409);
  assert.equal((await s.call(path(r)+'/settings','PATCH',{name:'Keep existing members',capacity:8,goalMinutes:60,invitationsOpen:true,version:1},a)).status,200);
  assert.equal((await s.call(path(r)+'/members','PATCH',{profileId:people[0].profileId,action:'remove'},a)).status,200);assert.equal((await s.call(path(r)+'/members','PATCH',{profileId:people[0].profileId,action:'restore'},a)).status,409);
  s.subscribe(a,{memberLimit:8,freeText:false});assert.equal((await s.call(path(r)+'/members','PATCH',{profileId:people[0].profileId,action:'restore'},a)).status,200);await join(s,r,extra);
 }finally{s.close();}
});

test('free quick text works without review; subscription is required for any appended/free text and cannot be forged',async()=>{
 let reviews=0;const s=await setup({reviewFetch:async()=>{reviews++;return reviewResult();}});try{const a=await s.user('owner'),b=await s.user('member'),r=await s.room(a,'public');await join(s,r,b);
  for(const body of [{text:'Explain this chapter',paid:true},{templateId:'help',text:'Explain this chapter'},{text:'Explain this chapter',freeText:true}]){s.advance(11000);assert.equal((await send(s,r,a,body)).error.code,'SUBSCRIPTION_REQUIRED');}assert.equal(reviews,0);
  s.env.COMMUNITY_REVIEW_ENABLED='false';s.advance(11000);assert.equal((await send(s,r,a,{templateId:'thanks'})).status,201);assert.equal((await s.call(path(r),'GET',undefined,b)).messages.at(-1).quick_id,'thanks');assert.equal(reviews,0);
  assert.equal(s.db.prepare('SELECT count(*) n FROM community_timers').get().n,0);assert.equal(s.db.prepare('SELECT count(*) n FROM community_daily').get().n,0);
  s.subscribe(a);s.env.COMMUNITY_REVIEW_ENABLED='true';s.advance(11000);assert.equal((await send(s,r,a,{text:'Let us review algebra.'})).status,201);assert.equal(reviews,1);assert.equal((await s.call(path(r),'GET',undefined,b)).messages.at(-1).text,'Let us review algebra.');
 }finally{s.close();}
});

test('subscription expiry during review prevents publication, while existing messages remain readable',async()=>{
 let resolve,started;const ready=new Promise(r=>started=r),s=await setup({reviewFetch:()=>{started();return new Promise(r=>resolve=r);}});try{const a=await s.user('owner'),r=await s.room(a,'public');s.subscribe(a,{expiresAt:s.now+30000});const pending=send(s,r,a,{text:'Review one practice question.'});await ready;s.advance(31000);resolve(reviewResult());assert.equal((await pending).status,403);assert.equal(s.db.prepare('SELECT count(*) n FROM community_messages').get().n,0);}finally{s.close();}
});

test('availability comes from checked timers; rest pauses own timer and quick messages never set timer state',async()=>{
 const s=await setup();try{const a=await s.user('owner'),r=await s.room(a,'public');online(s);assert.equal((await s.call(path(r))).members[0].state,'ready');
  await send(s,r,a,{templateId:'starting'});assert.equal((await s.call(path(r))).members[0].state,'ready');
  const t=(await s.call('/timer/start','POST',{roomId:r.id},a)).timer;s.advance(20000);const running=(await s.call(path(r),'GET',undefined,a)).members[0];assert.equal(running.state,'studying');assert.equal(companionSeconds(running,s.now),20);
  assert.equal((await s.call(path(r)+'/presence','POST',{state:'break'},a)).status,409);assert.equal((await s.call(path(r)+'/presence','POST',{state:'studying'},a)).status,400);
  assert.equal((await s.call(path(r)+'/presence','POST',{state:'break',lease:t.lease},a)).status,200);assert.equal((await s.call(path(r))).members[0].state,'break');assert.equal(s.db.prepare('SELECT seconds FROM community_daily').get().seconds,20);
  await s.call(path(r)+'/presence','POST',{state:'ready'},a);assert.equal((await s.call(path(r))).members[0].state,'ready');s.advance(76000);assert.equal((await s.call(path(r))).members[0].state,'offline');
  assert.equal(companionState({last_seen:s.now,timer_status:'running',timer_last_at:s.now-91000,timer_check_at:s.now+10000},s.now),'check');
 }finally{s.close();}
});

test('fixed interactions reach only the recipient, retry once, expire quickly and create no AI or study credit',async()=>{
 let reviews=0;const s=await setup({reviewFetch:async()=>{reviews++;return reviewResult();}});try{const a=await s.user('owner'),b=await s.user('member'),r=await s.room(a,'public');await join(s,r,b);online(s);const id=crypto.randomUUID();assert.equal((await interact(s,r,a,b,'cheer',{id})).status,201);assert.equal((await interact(s,r,a,b,'cheer',{id})).status,200);
  assert.equal((await s.call(path(r),'GET',undefined,a)).interactions.length,0);const received=(await s.call(path(r),'GET',undefined,b)).interactions;assert.equal(received.length,1);assert.equal(received[0].sender,'owner');assert.equal(received[0].kind,'cheer');assert.equal((await interact(s,r,a,b,'tap',{id})).status,409);
  assert.equal(reviews,0);for(const table of ['community_messages','community_timers','community_credits','community_daily','community_review_attempts'])assert.equal(s.db.prepare('SELECT count(*) n FROM '+table).get().n,0);
  s.advance(11000);assert.equal((await s.call(path(r),'GET',undefined,b)).interactions.length,0);s.advance(600000);await communityMaintenance(s.env,s.now);assert.equal(s.db.prepare('SELECT count(*) n FROM community_interactions').get().n,0);
 }finally{s.close();}
});

test('interactions respect focus, opt-out, offline, mute, blocks, membership, CSRF and fixed payloads',async()=>{
 const s=await setup();try{const a=await s.user('owner'),b=await s.user('member'),outside=await s.user('outside'),r=await s.room(a,'public');await join(s,r,b);online(s);
  assert.equal((await interact(s,r,outside,b)).status,403);assert.equal((await interact(s,r,a,a)).status,400);assert.equal((await interact(s,r,a,b,'tap',{text:'injected text'})).status,400);assert.equal((await interact(s,r,{...a,csrf:''},b)).status,403);
  const t=(await s.call('/timer/start','POST',{roomId:r.id},b)).timer;assert.equal((await interact(s,r,a,b)).error.code,'DO_NOT_DISTURB');await s.call('/timer/pause','POST',{lease:t.lease},b);
  await s.call(path(r)+'/presence','POST',{allowNudges:false},b);assert.equal((await interact(s,r,a,b)).error.code,'DO_NOT_DISTURB');await s.call(path(r)+'/presence','POST',{allowNudges:true},b);
  await s.call('/blocks','POST',{profileId:a.profileId},b);assert.equal((await interact(s,r,a,b)).status,403);await s.call('/blocks','POST',{profileId:a.profileId,block:false},b);
  s.db.prepare('UPDATE community_members SET muted_until=? WHERE profile_id=?').run(s.now+60000,a.profileId);assert.equal((await interact(s,r,a,b)).status,403);s.db.prepare('UPDATE community_members SET muted_until=0,last_seen=0').run();assert.equal((await interact(s,r,a,b)).error.code,'NOT_ONLINE');
  assert.equal(s.db.prepare('SELECT count(*) n FROM community_interactions').get().n,0);
 }finally{s.close();}
});

test('atomic rolling cooldowns protect the pair, receiver and sender across rooms and races',async()=>{
 const s=await setup();try{const a=await s.user('owner'),b=await s.user('second'),c=await s.user('third'),d=await s.user('fourth'),r=await s.room(a,'public');for(const u of [b,c,d])await join(s,r,u);online(s);
  const race=await Promise.all([interact(s,r,a,b),interact(s,r,c,b)]);assert.deepEqual(race.map(r=>r.status).sort(),[201,429]);const winner=race[0].status===201?a:c;
  s.advance(61000);online(s);assert.equal((await interact(s,r,winner,b)).error.code,'INTERACTION_COOLDOWN');
  assert.equal((await interact(s,r,b,a)).status,201);assert.equal((await interact(s,r,b,c)).status,201);assert.equal((await interact(s,r,b,d)).error.code,'INTERACTION_LIMIT');
  s.advance(300000);online(s);assert.equal((await interact(s,r,winner,b)).status,201);
 }finally{s.close();}
});

test('an interaction cannot publish after target opt-out or session revocation during the final write',async()=>{
 for(const change of [(s,a,b)=>s.db.prepare('UPDATE community_members SET allow_nudges=0 WHERE profile_id=?').run(b.profileId),(s,a)=>s.db.prepare('DELETE FROM sessions WHERE account_id=?').run(a.id)]){
  const s=await setup();try{const a=await s.user('owner'),b=await s.user('member'),r=await s.room(a,'public');await join(s,r,b);online(s);const batch=s.env.DB.batch.bind(s.env.DB);s.env.DB.batch=async statements=>{change(s,a,b);return batch(statements);};assert.equal((await interact(s,r,a,b)).status,409);assert.equal(s.db.prepare('SELECT count(*) n FROM community_interactions').get().n,0);}finally{s.close();}
 }
});
import {createAccountsApi} from '../server/accounts.mjs';
test('account export is limited to own preferences/effects and deletion cascades new companion records',async()=>{
 const s=await setup();try{const a=await s.user('owner'),b=await s.user('member'),c=await s.user('other'),r=await s.room(a,'public');await join(s,r,b);await join(s,r,c);online(s);s.subscribe(b,{memberLimit:8});assert.equal((await interact(s,r,a,b)).status,201);s.advance(61000);online(s);assert.equal((await interact(s,r,a,c)).status,201);
 const api=createAccountsApi({now:()=>s.now}),request=(path,method='GET',data)=>new Request('https://study.test'+path,{method,headers:{origin:'https://study.test',cookie:b.cookie,'x-csrf-token':b.csrf,'content-type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
 const response=await api(request('/api/account/export'),s.env,true);assert.equal(response.status,200);const exported=await response.json();assert.equal(exported.community.interactions.length,1);assert.equal(exported.community.interactions[0].recipient_id,b.profileId);assert.equal(exported.community.entitlements.member_limit,8);assert.equal(exported.community.memberships[0].allow_nudges,1);
 assert.equal((await api(request('/api/account','DELETE',{confirm:'DELETE'}),s.env,true)).status,200);assert.equal(s.db.prepare('SELECT count(*) n FROM community_entitlements WHERE account_id=?').get(b.id).n,0);assert.equal(s.db.prepare('SELECT count(*) n FROM community_interactions WHERE sender_id=? OR recipient_id=?').get(b.profileId,b.profileId).n,0);assert.equal(s.db.prepare('SELECT count(*) n FROM community_interactions WHERE recipient_id=?').get(c.profileId).n,1);assert.equal(s.db.prepare('PRAGMA foreign_key_check').all().length,0);
 }finally{s.close();}
});
test('restoring a member rechecks owner capacity atomically after entitlement revocation',async()=>{
 const s=await setup();try{const a=await s.user('owner');s.subscribe(a,{memberLimit:8});const r=await s.room(a,'public',8),people=[];for(let i=0;i<4;i++){const b=await s.user('guest'+i);people.push(b);await join(s,r,b);}assert.equal((await s.call(path(r)+'/members','PATCH',{profileId:people[0].profileId,action:'remove'},a)).status,200);
 const prepare=s.env.DB.prepare.bind(s.env.DB);s.env.DB.prepare=sql=>{if(sql.startsWith('UPDATE community_members SET banned=CASE'))s.db.prepare('DELETE FROM community_entitlements WHERE account_id=?').run(a.id);return prepare(sql);};assert.equal((await s.call(path(r)+'/members','PATCH',{profileId:people[0].profileId,action:'restore'},a)).error.code,'ROOM_FULL');assert.equal(s.db.prepare('SELECT count(*) n FROM community_members WHERE room_id=? AND banned=0 AND left_at=0').get(r.id).n,4);
 }finally{s.close();}
});
