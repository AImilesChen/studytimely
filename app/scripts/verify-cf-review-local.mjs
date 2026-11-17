import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const base=process.env.PREVIEW_ORIGIN||'http://127.0.0.1:4295';
if(!['127.0.0.1','localhost'].includes(new URL(base).hostname))throw Error('Synthetic verification is localhost-only.');
const root=new URL('../',import.meta.url),evidence=new URL('../../docs/development/evidence/cf-review-optimize-2026-11-17/',import.meta.url),checks=[];
async function sql(command){
 const p=spawn(process.execPath,['G:/Website Project/EXACTMEC/design-prototype/node_modules/wrangler/bin/wrangler.js','d1','execute','studytimely-cf-review-synthetic','--local','--config','tests/fixtures/wrangler.cf-review-local.jsonc','--persist-to',fileURLToPath(new URL('.wrangler/cf-review-optimize-2026-11-17',root)),'--command',command,'--json'],{cwd:root,windowsHide:true,env:{...process.env,WRANGLER_SEND_METRICS:'false',WRANGLER_REGISTRY_PATH:fileURLToPath(new URL('.wrangler/cf-review-registry',root)),WRANGLER_LOG_PATH:fileURLToPath(new URL('wrangler-logs/',evidence))},stdio:['ignore','pipe','pipe']});let output='',error='';p.stdout.on('data',b=>output+=b);p.stderr.on('data',b=>error+=b);const code=await new Promise(resolve=>p.on('exit',resolve));if(code)throw Error('Local database fixture control failed: '+error);return JSON.parse(output);
}
async function call(path,method='GET',data,a={}){const r=await fetch(base+'/api/community'+path,{method,headers:{origin:base,'content-type':'application/json',...(a.cookie?{cookie:a.cookie}:{}),...(a.csrf?{'x-csrf-token':a.csrf}:{})},body:data===undefined?undefined:JSON.stringify(data)});return{status:r.status,...await r.json()};}
async function signin(kind){const email=kind==='admin'?'admin@studytimely.invalid':kind+'-'+crypto.randomUUID().slice(0,8)+'@studytimely.invalid';const r=await fetch(base+'/__test/sign-in',{method:'POST',redirect:'manual',headers:{origin:base,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({email})});assert.equal(r.status,303);const cookie=r.headers.get('set-cookie').split(';')[0];const auth=await(await fetch(base+'/api/auth/me',{headers:{cookie}})).json();return{cookie,csrf:auth.csrf};}
const owner=await signin('owner'),member=await signin('learner'),admin=await signin('admin');
const id=crypto.randomUUID();assert.equal((await call('/rooms','POST',{id,name:'Synthetic CF review verification',visibility:'private',capacity:2,goalMinutes:60},owner)).status,201);
const room=await call('/rooms/'+id,'GET',undefined,owner);assert.equal((await call('/rooms/'+id+'/join','POST',{accepted:true,code:room.room.inviteCode},member)).status,200);
const send=(a,text)=>call('/rooms/'+id+'/messages','POST',{id:crypto.randomUUID(),text},a);
const before=await call('/review-status','GET',undefined,admin);assert.equal(before.status,200);assert.equal(before.review.provider,'Cloudflare Workers AI');
assert.equal((await call('/review-status','GET',undefined,member)).status,403);checks.push('platform-only app budget; members see reviewer but no private capacity counters');
assert.equal((await send(owner,'Finished the algebra exercise')).status,201);assert.equal((await call('/rooms/'+id,'GET',undefined,member)).messages[0].text,'Finished the algebra exercise');
const firstBudget=await call('/review-status','GET',undefined,admin);assert.equal((await send(member,'Finished the algebra exercise')).status,201);const cachedBudget=await call('/review-status','GET',undefined,admin);assert.equal(cachedBudget.budget.attempts,firstBudget.budget.attempts);assert.equal(cachedBudget.budget.spent,firstBudget.budget.spent);checks.push('second member shares exact approved text without another synthetic provider call');
assert.equal((await send(owner,'我的微·信是 synthetic_demo，出去聊')).status,422);assert.equal((await call('/rooms/'+id,'GET',undefined,member)).messages.length,2);checks.push('safe original text shared with second member; obfuscated contact blocked before storage');
const snapshot=await call('/review-status','GET',undefined,admin),bucket='cf-review:'+new Date().toISOString().slice(0,10);let temporary=false;
try{
 await sql("UPDATE community_review_budgets SET spent_units=4800 WHERE bucket='"+bucket+"'");temporary=true;
 const blockedRoom=await call('/rooms/'+id,'GET',undefined,owner);assert.equal(blockedRoom.chatReviewAvailable,false);assert.equal(blockedRoom.review.state,'capacity');assert.equal((await send(owner,'Another algebra update')).error.code,'REVIEW_LIMIT');
 await sql("UPDATE community_review_budgets SET spent_units="+snapshot.budget.spent+" WHERE bucket='"+bucket+"'");temporary=false;checks.push('actual local D1 budget exhaustion pauses sending before provider; correct availability metadata');
 await new Promise(resolve=>setTimeout(resolve,11000));
 assert.equal((await send(member,'synthetic-review-block')).status,422);assert.equal((await send(member,'synthetic-review-unavailable')).status,503);assert.equal((await send(member,'A retry during provider outage')).status,503);
 const state=await call('/review-status','GET',undefined,admin);assert.equal(state.budget.failed,before.budget.failed+1);assert.equal(state.budget.reserved,0);assert.equal(state.budget.attempts,firstBudget.budget.attempts+2);assert.equal(state.budget.spent,firstBudget.budget.spent+311);assert.equal((await call('/rooms/'+id,'GET',undefined,member)).messages.length,2);checks.push('simulated CF semantic block/outage/circuit leave messages unchanged; real D1 usage settled and unknown call charged conservatively');
 const quickId=crypto.randomUUID();assert.equal((await call('/rooms/'+id+'/messages','POST',{id:quickId,templateId:'help'},owner)).status,201);
 assert.equal((await call('/rooms/'+id+'/messages','POST',{id:quickId,templateId:'help'},owner)).status,200);
 const memberView=await call('/rooms/'+id,'GET',undefined,member);assert.equal(memberView.messages.at(-1).template_id,'help');assert.equal(memberView.messages.at(-1).text,'I need help with my study task.');
 assert.equal((await call('/rooms/'+id+'/messages','POST',{id:crypto.randomUUID(),templateId:'forged'},owner)).status,400);
 assert.equal((await call('/review-status','GET',undefined,admin)).budget.attempts,state.budget.attempts);checks.push('fixed study update works during circuit pause, resolves on server, is visible to second member and retries once without AI usage');
 assert.equal((await call('/timer/start','POST',{roomId:id},owner)).status,200);const me=await call('/me','GET',undefined,owner);assert.equal((await call('/timer/pause','POST',{lease:me.timer.lease},owner)).status,200);checks.push('independent room timer starts and pauses while review circuit is open');
}finally{if(temporary)await sql("UPDATE community_review_budgets SET spent_units="+snapshot.budget.spent+" WHERE bucket='"+bucket+"'");const current=await call('/rooms/'+id,'GET',undefined,owner);await call('/rooms/'+id+'/settings','PATCH',{name:current.room.name,capacity:2,goalMinutes:60,invitationsOpen:false,close:true,version:current.room.version},owner);}
const report={at:new Date().toISOString(),environment:'isolated local Worker/D1/DO with synthetic CF binding; no external inference',checks,passed:true};await fs.writeFile(new URL('local-integration.json',evidence),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
