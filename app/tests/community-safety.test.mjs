import test from 'node:test';
import assert from 'node:assert/strict';
import {localContentIssue} from '../src/lib/community-safety.mjs';
import {reviewConfiguration} from '../server/chat-review.mjs';
import {setupCommunity as setup,reviewResult,syntheticReviewEnv} from './helpers/community.mjs';
const post=(s,r,a,text='Finished chapter two')=>s.call('/rooms/'+r.id+'/messages','POST',{id:crypto.randomUUID(),text},a);
test('local rules catch contact obfuscation/solicitation without blocking ordinary study topics',()=>{
 for(const text of ['reader@example.invalid','reader (at) example (dot) com','https://example.com','ｅｘａｍｐｌｅ．ｃｏｍ','w\u200bechat: reader','微信：abc123','add me on discord','phone +44 7700 900123','13800138000','looking for a girlfriend','找 女 友','send me nudes','I will kill you'])assert.ok(localContentIssue(text),text);
 for(const text of ['Study chapter 4 at 17:30','The French Revolution involved violence.','Biology: sexual reproduction','Dating historical artefacts','Read pages 120–140 on 2026-11-14','Solve 2x + 3 = 11','Please explain self-harm prevention in psychology.','📚 Great progress!'])assert.equal(localContentIssue(text),null,text);
});
test('review requires explicit enablement and a restricted HTTPS Azure endpoint',()=>{
 assert.ok(reviewConfiguration(syntheticReviewEnv));
 for(const endpoint of ['http://synthetic.cognitiveservices.azure.com','https://evil.test','https://synthetic.cognitiveservices.azure.com.evil.test','https://x@y.cognitiveservices.azure.com','https://synthetic.cognitiveservices.azure.com/path','https://synthetic.cognitiveservices.azure.com?key=x'])assert.equal(reviewConfiguration({...syntheticReviewEnv,AZURE_CONTENT_SAFETY_ENDPOINT:endpoint}),null);
 assert.equal(reviewConfiguration({...syntheticReviewEnv,COMMUNITY_REVIEW_ENABLED:'false'}),null);
});
test('prohibited chat/names are rejected before provider, database or broadcast',async()=>{
 let calls=0,signals=0;const s=await setup({reviewFetch:async()=>{calls++;return reviewResult();}});
 try{const a=await s.user('learner'),r=await s.room(a,'public');s.env.ROOMS={idFromName:id=>id,get:()=>({fetch:async()=>{signals++;}})};
  for(const text of ['Wechat: learner123','找女友','I will kill you']){const result=await post(s,r,a,text);assert.equal(result.status,422);assert.equal(result.error.code,'CONTENT_BLOCKED');assert.match(result.error.message,/\*\*\*/);}
  assert.equal(calls,0);assert.equal(signals,0);assert.equal(s.db.prepare('SELECT count(*) n FROM community_messages').get().n,0);
  assert.equal((await s.call('/rooms','POST',{id:crypto.randomUUID(),name:'add me on discord',visibility:'public',capacity:8,goalMinutes:120},a)).status,422);
  assert.equal((await s.call('/profile','PUT',{nickname:'微信：learner',publicRanking:false,version:1},a)).status,422);
 }finally{s.close();}
});
test('safe chat publishes after review with only text and categories in the external payload',async()=>{
 let payload;const s=await setup({reviewFetch:async(url,options)=>{payload={url,...options,body:JSON.parse(options.body)};return reviewResult();}});
 try{const a=await s.user('learner'),r=await s.room(a,'public');assert.equal((await post(s,r,a)).status,201);assert.deepEqual(Object.keys(payload.body).sort(),['categories','outputType','text']);assert.equal(payload.body.text,'Finished chapter two');assert.equal(payload.redirect,'manual');assert.equal(payload.url,'https://synthetic.cognitiveservices.azure.com/contentsafety/text:analyze?api-version=2024-09-01');assert.equal((await s.call('/rooms/'+r.id,'GET',undefined,a)).messages.length,1);}finally{s.close();}
});
test('harmful category results block before storage; contextual low-level violence can pass',async()=>{
 for(const [severity,category,expected] of [[2,'Sexual',422],[4,'Violence',422],[4,'Hate',422],[4,'SelfHarm',422],[2,'Violence',201]]){const s=await setup({reviewFetch:async()=>reviewResult(severity,category)});try{const a=await s.user('learner'),r=await s.room(a,'public');assert.equal((await post(s,r,a)).status,expected);assert.equal(s.db.prepare('SELECT count(*) n FROM community_messages').get().n,expected===201?1:0);}finally{s.close();}}
});
test('missing setup, provider errors, malformed/incomplete results, redirects and timeouts never publish',async()=>{
 const providers=[async()=>new Response('quota',{status:429}),async()=>new Response('',{status:302,headers:{Location:'https://evil.test'}}),async()=>Response.json({}),async()=>Response.json({categoriesAnalysis:[{category:'Sexual',severity:0}]}),async()=>{throw Error('sensitive provider response');},()=>new Promise(()=>{}),async()=>({ok:true,json:()=>new Promise(()=>{})})];
 for(const reviewFetch of providers){const s=await setup({reviewFetch,reviewTimeoutMs:15});try{const a=await s.user('learner'),r=await s.room(a,'public');const out=await post(s,r,a);assert.equal(out.status,503);assert.equal(out.error.code,'REVIEW_UNAVAILABLE');assert.ok(!JSON.stringify(out).includes('sensitive provider'));assert.equal(s.db.prepare('SELECT count(*) n FROM community_messages').get().n,0);}finally{s.close();}}
 const s=await setup();try{const a=await s.user('learner'),r=await s.room(a,'public');delete s.env.AZURE_CONTENT_SAFETY_KEY;assert.equal((await s.call('/rooms/'+r.id,'GET',undefined,a)).chatReviewAvailable,false);assert.equal((await post(s,r,a)).status,503);assert.equal((await s.call('/timer/start','POST',{roomId:r.id},a)).status,200);}finally{s.close();}
});
test('monthly review budget is atomically capped across users, survives failure and resets at UTC month boundary',async()=>{
 let calls=0;const s=await setup({reviewFetch:async()=>{calls++;return reviewResult();}});s.env.COMMUNITY_REVIEW_MONTHLY_LIMIT='1';
 try{const a=await s.user('first'),b=await s.user('second'),r=await s.room(a,'public');await s.call('/rooms/'+r.id+'/join','POST',{accepted:true},b);const out=await Promise.all([post(s,r,a),post(s,r,b)]);assert.deepEqual(out.map(x=>x.status).sort(),[201,503]);assert.equal(calls,1);assert.equal(out.find(x=>x.status===503).error.code,'REVIEW_LIMIT');s.setTime(Date.UTC(2026,11,1));const session=await import('../server/auth-shared.mjs');const issued=await session.issueSession(new Request('https://study.test'),s.env,{id:a.id},s.now);const renewed={...a,cookie:issued.cookie.split(';')[0],csrf:issued.csrf};assert.equal((await post(s,r,renewed)).status,201);assert.equal(calls,2);}finally{s.close();}
 const failed=await setup({reviewFetch:async()=>new Response('',{status:500})});failed.env.COMMUNITY_REVIEW_MONTHLY_LIMIT='1';try{const a=await failed.user('learner'),r=await failed.room(a,'public');assert.equal((await post(failed,r,a)).error.code,'REVIEW_UNAVAILABLE');assert.equal((await post(failed,r,a)).error.code,'REVIEW_LIMIT');}finally{failed.close();}
});
test('muting, removal, closure or sign-out during review prevents publishing; duplicate retries are idempotent',async()=>{
 for(const mutation of ['mute','remove','close','signout']){let release,started;const ready=new Promise(r=>started=r);const s=await setup({reviewFetch:()=>{started();return new Promise(r=>release=r);}});try{const a=await s.user('owner'),b=await s.user('member'),r=await s.room(a,'public');await s.call('/rooms/'+r.id+'/join','POST',{accepted:true},b);const pending=post(s,r,b);await ready;if(mutation==='close')s.db.prepare('UPDATE community_rooms SET closed_at=? WHERE id=?').run(s.now,r.id);else if(mutation==='signout')s.db.prepare('DELETE FROM sessions WHERE account_id=?').run(b.id);else s.db.prepare(mutation==='mute'?'UPDATE community_members SET muted_until=? WHERE profile_id=?':'UPDATE community_members SET banned=1 WHERE profile_id=?').run(...(mutation==='mute'?[s.now+60000,b.profileId]:[b.profileId]));release(reviewResult());assert.equal((await pending).status,403);assert.equal(s.db.prepare('SELECT count(*) n FROM community_messages').get().n,0);}finally{s.close();}}
 const s=await setup();try{const a=await s.user('learner'),r=await s.room(a,'public'),body={id:crypto.randomUUID(),text:'One study update'};const out=await Promise.all([1,2].map(()=>s.call('/rooms/'+r.id+'/messages','POST',body,a)));assert.deepEqual(out.map(x=>x.status).sort(),[200,201]);assert.equal(s.db.prepare('SELECT count(*) n FROM community_messages').get().n,1);}finally{s.close();}
});
test('capacity counts offline memberships, concurrent joins cannot overfill, and resize is guarded in SQL',async()=>{
 const s=await setup();try{const a=await s.user('owner'),b=await s.user('second'),c=await s.user('third'),r=await s.room(a,'public',2);const out=await Promise.all([b,c].map(u=>s.call('/rooms/'+r.id+'/join','POST',{accepted:true},u)));assert.deepEqual(out.map(x=>x.status).sort(),[200,409]);const detail=await s.call('/rooms/'+r.id,'GET',undefined,a);assert.equal(detail.members.length,2);assert.ok(detail.members.every(x=>!x.online&&!x.studying));assert.throws(()=>s.db.prepare('UPDATE community_rooms SET capacity=1 WHERE id=?').run(r.id),/CAPACITY_INVALID/);assert.throws(()=>s.db.prepare('UPDATE community_rooms SET capacity=25 WHERE id=?').run(r.id),/CAPACITY_INVALID/);const member=out[0].status===200?b:c;assert.equal((await s.call('/rooms/'+r.id+'/leave','POST',{},member)).status,200);assert.equal((await s.call('/rooms/'+r.id+'/join','POST',{accepted:true},out[0].status===200?c:b)).status,200);}finally{s.close();}
});
test('presence separates fresh active study from online, expired check-ins and offline membership',async()=>{
 const s=await setup();try{const a=await s.user('learner'),r=await s.room(a,'public');await s.call('/timer/start','POST',{roomId:r.id},a);s.db.prepare('UPDATE community_members SET last_seen=?').run(s.now);assert.equal((await s.call('/rooms')).rooms[0].studying,1);assert.equal((await s.call('/rooms/'+r.id)).members[0].studying,true);s.db.prepare('UPDATE community_timers SET check_at=?').run(s.now-1);assert.equal((await s.call('/rooms')).rooms[0].studying,0);assert.equal((await s.call('/rooms/'+r.id)).members[0].online,true);assert.equal((await s.call('/rooms/'+r.id)).members[0].studying,false);}finally{s.close();}
});
