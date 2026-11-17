import test from 'node:test';
import assert from 'node:assert/strict';
import {MODERATION_CORPUS} from './fixtures/moderation-corpus.mjs';
import {localContentIssue} from '../src/lib/community-safety.mjs';
import {reviewChat,reviewConfiguration,reviewAvailability,cloudflareReviewInput,parseCloudflareReview,CF_REVIEW_MODEL} from '../server/chat-review.mjs';
import {reserveReview,settleReview,reviewBudgetStatus} from '../server/review-budget.mjs';
import {setupSubscribedCommunity as setup} from './helpers/community.mjs';
import {communityMaintenance} from '../server/community.mjs';
const answer=(safe=true,patch={})=>({response:{safe,categories:safe?[]:['S1']},usage:{prompt_tokens:230,completion_tokens:6,neurons:10.14},...patch});
function useCF(s,run=async()=>answer()){Object.assign(s.env,{COMMUNITY_REVIEW_PROVIDER:'cloudflare',AI:{run}});return s;}
const post=(s,r,a,text='Finished the algebra exercise')=>s.call('/rooms/'+r.id+'/messages','POST',{id:crypto.randomUUID(),text},a);

test('200 local-rule cases retain normal educational contexts and block targeted policy variants',()=>{
 assert.equal(MODERATION_CORPUS.length,200);assert.equal(new Set(MODERATION_CORPUS.map(c=>c.id)).size,200);
 for(const c of MODERATION_CORPUS){if(c.expected==='allow')assert.equal(localContentIssue(c.text),null,c.id);else if(c.local)assert.ok(localContentIssue(c.text),c.id);}
 for(const text of ['别复习啦，来聊涩涩的，互发没穿衣服的自拍。','我的微·信是 study_demo_123，咱们出去聊。','学习先放一边，有单身的小姐姐愿意和我谈恋爱吗？'])assert.ok(localContentIssue(text));
});
test('CF requires explicit selection, binding, enabled flag and a bounded daily configuration',()=>{
 const env={COMMUNITY_REVIEW_PROVIDER:'cloudflare',COMMUNITY_REVIEW_ENABLED:'true',AI:{run(){}}};assert.equal(reviewConfiguration(env).provider,'cloudflare');
 for(const patch of [{COMMUNITY_REVIEW_ENABLED:'false'},{AI:null},{COMMUNITY_REVIEW_PROVIDER:'other'},{COMMUNITY_REVIEW_DAILY_NEURONS:'0'},{COMMUNITY_REVIEW_DAILY_NEURONS:'9000'},{COMMUNITY_REVIEW_DAILY_NEURONS:'NaN'}])assert.equal(reviewConfiguration({...env,...patch}),null);
 const payload=cloudflareReviewInput('One task');assert.equal(payload.max_tokens,24);assert.equal(payload.messages.at(-1).content,'One task');assert.throws(()=>cloudflareReviewInput('x'.repeat(501)));
 for(const invalid of [{},answer(true,{response:{safe:true,categories:['S1']}}),answer(false,{response:{safe:false,categories:[]}}),answer(false,{response:{safe:false,categories:['S99']}}),answer(false,{response:{safe:false,categories:['S1','S1']}}),answer(true,{usage:{prompt_tokens:1,completion_tokens:25}}),answer(true,{usage:{prompt_tokens:1,completion_tokens:1,neurons:NaN}})])assert.throws(()=>parseCloudflareReview(invalid));
});
test('CF-approved chat retains original text, avoids identity in payload, and settles actual usage once',async()=>{
 let payload;const s=useCF(await setup(),async(model,input)=>{payload={model,input};return answer();});
 try{const a=await s.user('learner'),r=await s.room(a,'public');assert.equal((await post(s,r,a,'📚 Finished chapter TWO')).status,201);assert.equal(payload.model,CF_REVIEW_MODEL);assert.equal(payload.input.messages.at(-1).content,'📚 Finished chapter TWO');assert.ok(!JSON.stringify(payload).includes(a.id));assert.equal((await s.call('/rooms/'+r.id,'GET',undefined,a)).messages[0].text,'📚 Finished chapter TWO');const b=await reviewBudgetStatus(s.env,s.now);assert.equal(b.allowed,1);assert.equal(b.reserved,0);assert.equal(b.spent,11);assert.equal(b.actualNeurons,10.14);const row=s.db.prepare('SELECT * FROM community_review_attempts').get();await settleReview(s.env,{id:row.id,bucket:row.bucket,reservation:300},'allowed',10.14,s.now);assert.equal((await reviewBudgetStatus(s.env,s.now)).spent,11);}finally{s.close();}
});
test('CF rejected, malformed, unavailable, over-reservation and timed-out calls never publish',async()=>{
 const fixtures=[async()=>answer(false),async()=>({}),async()=>{throw Error('private provider error');},async()=>answer(true,{usage:{prompt_tokens:230,completion_tokens:6,neurons:400}}),()=>new Promise(()=>{})];
 for(const run of fixtures){const s=useCF(await setup({reviewTimeoutMs:15}),run);try{const a=await s.user('learner'),r=await s.room(a,'public'),reply=await post(s,r,a);assert.equal(reply.status,run===fixtures[0]?422:503);assert.ok(!JSON.stringify(reply).includes('private provider'));assert.equal(s.db.prepare('SELECT count(*) n FROM community_messages').get().n,0);const b=await reviewBudgetStatus(s.env,s.now);assert.equal(b.reserved,0);assert.ok(b.spent>0);if(run!==fixtures[0])assert.equal(b.failed,1);assert.equal((await s.call('/timer/start','POST',{roomId:r.id},a)).status,200);}finally{s.close();}}
});
test('concurrent budget reservations cannot overspend and unavailable calls retain full charged reservation',async()=>{
 const s=useCF(await setup());s.env.COMMUNITY_REVIEW_DAILY_NEURONS='300';try{const tickets=await Promise.allSettled([reserveReview(s.env,s.now),reserveReview(s.env,s.now)]);assert.equal(tickets.filter(x=>x.status==='fulfilled').length,1);const ticket=tickets.find(x=>x.status==='fulfilled').value;assert.equal((await reviewAvailability(s.env,s.now)).state,'capacity');await settleReview(s.env,ticket,'failed',undefined,s.now);assert.equal((await reviewBudgetStatus(s.env,s.now)).spent,300);s.advance(61000);await assert.rejects(()=>reserveReview(s.env,s.now),e=>e.code==='REVIEW_LIMIT');s.advance(86400000);assert.equal((await reviewBudgetStatus(s.env,s.now)).spent,0);assert.equal((await reviewAvailability(s.env,s.now)).available,true);}finally{s.close();}
});
test('pending crash reservations survive, successful calls release unused reservation, and metadata expires',async()=>{
 const s=useCF(await setup());s.env.COMMUNITY_REVIEW_DAILY_NEURONS='600';try{const a=await reserveReview(s.env,s.now);await reserveReview(s.env,s.now);assert.equal((await reviewBudgetStatus(s.env,s.now)).reserved,600);await settleReview(s.env,a,'allowed',10,s.now);assert.equal((await reviewBudgetStatus(s.env,s.now)).reserved,300);assert.equal((await reviewBudgetStatus(s.env,s.now)).spent,10);assert.equal((await reviewAvailability(s.env,s.now)).available,false);s.advance(9*86400000);await communityMaintenance(s.env,s.now);assert.equal(s.db.prepare('SELECT count(*) n FROM community_review_attempts').get().n,0);assert.equal(s.db.prepare('SELECT count(*) n FROM community_review_budgets').get().n,0);}finally{s.close();}
});
test('capacity details are platform-moderator-only and do not contain rejected message text',async()=>{
 const s=useCF(await setup());try{const a=await s.user('learner'),admin=await s.user('admin');assert.equal((await s.call('/review-status')).status,401);assert.equal((await s.call('/review-status','GET',undefined,a)).status,403);const data=await s.call('/review-status','GET',undefined,admin);assert.equal(data.status,200);assert.equal(data.review.provider,'Cloudflare Workers AI');assert.equal(data.budget.limit,5000);assert.equal(data.budget.attempts,0);}finally{s.close();}
});
test('provider failure opens a one-minute circuit without disabling independent room timers',async()=>{
 let calls=0;const s=useCF(await setup(),async()=>{calls++;throw Error('synthetic quota');});try{const a=await s.user('learner'),r=await s.room(a,'public');assert.equal((await post(s,r,a)).status,503);assert.equal((await reviewAvailability(s.env,s.now)).state,'unavailable');assert.equal((await post(s,r,a)).status,503);assert.equal(calls,1);s.advance(61000);assert.equal((await post(s,r,a)).status,503);assert.equal(calls,2);assert.equal((await reviewBudgetStatus(s.env,s.now)).spent,600);assert.equal((await s.call('/timer/start','POST',{roomId:r.id},a)).status,200);}finally{s.close();}
});
test('late CF completion after timeout cannot publish or release an unknown reservation',async()=>{
 let resolve;const s=useCF(await setup({reviewTimeoutMs:5}),()=>new Promise(r=>resolve=r));try{const a=await s.user('learner'),r=await s.room(a,'public');assert.equal((await post(s,r,a)).status,503);resolve(answer());await new Promise(r=>setImmediate(r));const b=await reviewBudgetStatus(s.env,s.now);assert.equal(b.spent,300);assert.equal(b.failed,1);assert.equal(b.allowed,0);assert.equal(s.db.prepare('SELECT count(*) n FROM community_messages').get().n,0);}finally{s.close();}
});
test('CF still rechecks membership and logout while a review is in flight',async()=>{
 let resolve,started;const ready=new Promise(r=>started=r);const s=useCF(await setup(),()=>{started();return new Promise(r=>resolve=r);});try{const a=await s.user('owner'),b=await s.user('member'),r=await s.room(a,'public');await s.call('/rooms/'+r.id+'/join','POST',{accepted:true},b);const pending=post(s,r,b);await ready;s.db.prepare('UPDATE community_members SET banned=1 WHERE profile_id=?').run(b.profileId);resolve(answer());assert.equal((await pending).status,403);assert.equal(s.db.prepare('SELECT count(*) n FROM community_messages').get().n,0);assert.equal((await reviewBudgetStatus(s.env,s.now)).allowed,1);}finally{s.close();}
});
test('newly observed Chinese threat variants cannot reach CF or member chat',async()=>{
 let calls=0;const s=useCF(await setup(),async()=>{calls++;return answer();});try{const a=await s.user('learner'),r=await s.room(a,'public');for(const c of MODERATION_CORPUS.filter(c=>c.base==='block-21')){s.advance(11000);assert.equal((await post(s,r,a,c.text)).status,422);}assert.equal(calls,0);assert.equal(s.db.prepare('SELECT count(*) n FROM community_messages').get().n,0);assert.equal((await reviewBudgetStatus(s.env,s.now)).attempts,0);}finally{s.close();}
});
