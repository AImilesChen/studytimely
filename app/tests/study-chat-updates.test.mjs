import test from 'node:test';
import assert from 'node:assert/strict';
import {setupCommunity as setup} from './helpers/community.mjs';
import {STUDY_MESSAGES} from '../src/lib/study-messages.mjs';
import {reviewChat,reviewConfiguration,CF_REVIEW_MODEL} from '../server/chat-review.mjs';
import {reviewCacheKey,cacheApproval,REVIEW_POLICY_VERSION,REVIEW_CACHE_MS} from '../server/review-cache.mjs';
import {communityMaintenance} from '../server/community.mjs';
const approved=()=>({response:{safe:true,categories:[]},usage:{prompt_tokens:230,completion_tokens:6,neurons:10.14}});
function cf(s,run=async()=>approved()){Object.assign(s.env,{COMMUNITY_REVIEW_PROVIDER:'cloudflare',AI:{run}});return s;}
const send=(s,r,a,body)=>s.call('/rooms/'+r.id+'/messages','POST',{id:crypto.randomUUID(),...body},a);

test('two members exchange trusted updates without AI, timers, task or leaderboard credit',async()=>{
 let calls=0;const s=cf(await setup(),async()=>{calls++;return approved();});
 try{const a=await s.user('owner'),b=await s.user('member'),r=await s.room(a);await s.call('/rooms/'+r.id+'/join','POST',{accepted:true,code:r.code},b);
  s.env.COMMUNITY_REVIEW_ENABLED='false';
  for(const [i,m] of STUDY_MESSAGES.entries()){s.advance(11000);assert.equal((await send(s,r,i%2?a:b,{templateId:m.id})).status,201);}
  const view=await s.call('/rooms/'+r.id,'GET',undefined,b);assert.equal(view.chatReviewAvailable,false);
  assert.deepEqual(view.messages.map(m=>[m.template_id,m.text]),STUDY_MESSAGES.map(m=>[m.id,m.text]));assert.equal(calls,0);
  for(const table of ['community_timers','community_credits','community_daily','community_review_attempts','community_review_cache'])assert.equal(s.db.prepare('SELECT count(*) n FROM '+table).get().n,0,table);
 }finally{s.close();}
});

test('template IDs cannot authorise arbitrary text, unknown IDs or bypass flags',async()=>{
 let calls=0;const s=cf(await setup(),async()=>{calls++;return approved();});try{const a=await s.user('learner'),r=await s.room(a,'public');
  for(const templateId of ['__proto__','made-up',{},null])assert.equal((await send(s,r,a,{templateId})).status,400);
  assert.equal((await send(s,r,a,{templateId:'starting',text:{}})).status,400);
  assert.equal((await send(s,r,a,{templateId:'help',text:'My discord is fake123'})).status,422);assert.equal(calls,0);
  s.advance(11000);assert.equal((await send(s,r,a,{templateId:'help',text:'Please explain algebra.'})).status,201);assert.equal(calls,1);
  let stored=s.db.prepare('SELECT text,template_id FROM community_messages').get();assert.equal(stored.template_id,null);assert.equal(stored.text,'I need help with my study task. Please explain algebra.');
  s.advance(11000);s.env.COMMUNITY_REVIEW_ENABLED='false';assert.equal((await send(s,r,a,{text:'Please explain another exercise.',reviewed:true,bypass:true})).status,503);
  assert.equal((await send(s,r,a,{templateId:'starting',text:'x'.repeat(500)})).status,400);
 }finally{s.close();}
});

test('fixed and free messages share limits, retry IDs and room permissions',async()=>{
 const s=cf(await setup());try{const a=await s.user('owner'),b=await s.user('outsider'),r=await s.room(a,'public'),id=crypto.randomUUID();
  assert.equal((await send(s,r,b,{templateId:'break'})).status,403);
  assert.equal((await send(s,r,a,{id,templateId:'starting'})).status,201);
  assert.equal((await send(s,r,a,{id,templateId:'starting'})).status,200);
  assert.equal((await send(s,r,a,{id,templateId:'completed'})).status,409);
  assert.equal((await send(s,r,a,{text:'Learning algebra today.'})).status,201);
  assert.equal((await send(s,r,a,{templateId:'help'})).status,201);
  assert.equal((await send(s,r,a,{templateId:'break'})).status,429);
  s.advance(11000);s.db.prepare('UPDATE community_members SET muted_until=? WHERE profile_id=?').run(s.now+60000,a.profileId);assert.equal((await send(s,r,a,{templateId:'break'})).status,403);
  s.db.prepare('UPDATE community_members SET muted_until=0,banned=1 WHERE profile_id=?').run(a.profileId);assert.equal((await send(s,r,a,{templateId:'break'})).status,403);
  assert.equal(s.db.prepare('SELECT count(*) n FROM community_messages').get().n,3);
 }finally{s.close();}
});

test('hourly sending cap includes templates even when review is paused',async()=>{
 const s=cf(await setup());try{const a=await s.user('owner'),r=await s.room(a,'public');s.env.COMMUNITY_REVIEW_ENABLED='false';
  for(let i=0;i<30;i++){s.advance(11000);assert.equal((await send(s,r,a,{templateId:'starting'})).status,201);}
  s.advance(11000);assert.equal((await send(s,r,a,{templateId:'break'})).status,429);
 }finally{s.close();}
});

test('exact approved text is shared across members for five minutes without extra AI usage',async()=>{
 let calls=0;const s=cf(await setup(),async()=>{calls++;return approved();});try{const a=await s.user('owner'),b=await s.user('member'),r=await s.room(a,'public');await s.call('/rooms/'+r.id+'/join','POST',{accepted:true},b);
  const text='Finished one algebra exercise.';assert.equal((await send(s,r,a,{text})).status,201);assert.equal((await send(s,r,b,{text})).status,201);assert.equal(calls,1);
  const row=s.db.prepare('SELECT * FROM community_review_cache').get();assert.equal(row.expires_at-row.created_at,REVIEW_CACHE_MS);assert.equal(row.policy_version,REVIEW_POLICY_VERSION);assert.ok(!JSON.stringify(row).includes(text));assert.match(row.cache_key,/^[a-f0-9]{64}$/);
  s.advance(REVIEW_CACHE_MS);assert.equal((await send(s,r,b,{text})).status,201);assert.equal(calls,2);
  assert.equal(s.db.prepare('SELECT attempts FROM community_review_budgets').get().attempts,2);
 }finally{s.close();}
});

test('changed policy, exact text, model or provider cannot reuse old approvals',async()=>{
 let calls=0;const s=cf(await setup(),async()=>{calls++;return approved();});try{
  const text='Please explain the next exercise.';await reviewChat(text,s.env,{at:s.now});
  s.db.prepare('UPDATE community_review_cache SET policy_version=?').run('old-policy');s.advance(1100);await reviewChat(text,s.env,{at:s.now});assert.equal(calls,2);
  s.advance(1100);await reviewChat(text+' Extra context.',s.env,{at:s.now});assert.equal(calls,3);
  const config=reviewConfiguration(s.env),key=await reviewCacheKey(text,s.env,config,CF_REVIEW_MODEL);
  assert.notEqual(key,await reviewCacheKey(text,s.env,config,'new-model'));
  assert.notEqual(key,await reviewCacheKey(text,s.env,{provider:'azure',endpoint:'https://example.invalid'},CF_REVIEW_MODEL));
  assert.notEqual(key,await reviewCacheKey(text,{...s.env,AUTH_HMAC:'another-secret'},config,CF_REVIEW_MODEL));
 }finally{s.close();}
});

test('even a seeded cache entry cannot bypass local rules or a paused review service',async()=>{
 let calls=0;const s=cf(await setup(),async()=>{calls++;return approved();});try{
  const text='My discord is synthetic123',config=reviewConfiguration(s.env);await cacheApproval(s.env,await reviewCacheKey(text,s.env,config,CF_REVIEW_MODEL),s.now);
  await assert.rejects(()=>reviewChat(text,s.env,{at:s.now}),e=>e.code==='CONTENT_BLOCKED');assert.equal(calls,0);
  const safe='Explain a quadratic equation.';await reviewChat(safe,s.env,{at:s.now});s.db.prepare('UPDATE community_review_budgets SET spent_units=4800').run();
  await assert.rejects(()=>reviewChat(safe,s.env,{at:s.now}),e=>e.code==='REVIEW_LIMIT');assert.equal(calls,1);
  s.db.prepare('UPDATE community_review_budgets SET spent_units=0,retry_after=?').run(s.now+60000);
  await assert.rejects(()=>reviewChat(safe,s.env,{at:s.now}),e=>e.code==='REVIEW_UNAVAILABLE');assert.equal(calls,1);
 }finally{s.close();}
});

test('blocked, malformed and unavailable reviews are never cached; cache DB failure requires fresh review',async()=>{
 for(const run of [async()=>({response:{safe:false,categories:['S1']},usage:approved().usage}),async()=>({}),async()=>{throw Error('offline');}]){
  const s=cf(await setup(),run);try{await assert.rejects(()=>reviewChat('Synthetic learning text',s.env,{at:s.now}));assert.equal(s.db.prepare('SELECT count(*) n FROM community_review_cache').get().n,0);}finally{s.close();}
 }
 let calls=0;const s=cf(await setup(),async()=>{calls++;return approved();});try{
  s.db.prepare('DROP TABLE community_review_cache').run();await reviewChat('A normal question',s.env,{at:s.now});s.advance(1100);await reviewChat('A normal question',s.env,{at:s.now});assert.equal(calls,2);
 }finally{s.close();}
});

test('cache expiry is enforced at read and cleanup removes stale keyed records',async()=>{
 const s=cf(await setup());try{await reviewChat('Learning calculus',s.env,{at:s.now});s.advance(REVIEW_CACHE_MS);await communityMaintenance(s.env,s.now);assert.equal(s.db.prepare('SELECT count(*) n FROM community_review_cache').get().n,0);}finally{s.close();}
});

test('closed rooms and revoked sessions cannot send trusted updates or cached text',async()=>{
 const s=cf(await setup());try{const a=await s.user('owner'),r=await s.room(a,'public');await reviewChat('A cached study question',s.env,{at:s.now});
  s.db.prepare('UPDATE community_rooms SET closed_at=? WHERE id=?').run(s.now,r.id);
  assert.equal((await send(s,r,a,{templateId:'help'})).status,403);
  assert.equal((await send(s,r,a,{text:'A cached study question'})).status,403);
  s.db.prepare('UPDATE community_rooms SET closed_at=0 WHERE id=?').run(r.id);s.db.prepare('DELETE FROM sessions WHERE account_id=?').run(a.id);
  assert.equal((await send(s,r,a,{templateId:'help'})).status,401);assert.equal((await send(s,r,a,{text:'A cached study question'})).status,401);
  assert.equal(s.db.prepare('SELECT count(*) n FROM community_messages').get().n,0);
 }finally{s.close();}
});
