import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.PREVIEW_ORIGIN||'http://127.0.0.1:4200';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw Error('Synthetic fixture verification is localhost-only.');
const run=crypto.randomUUID().slice(0,8),checks=[];
async function call(path,method='GET',data,a={}){const r=await fetch(base+'/api/community'+path,{method,headers:{origin:base,'Content-Type':'application/json',...(a.cookie?{cookie:a.cookie}:{}),...(a.csrf?{'x-csrf-token':a.csrf}:{})},body:data===undefined?undefined:JSON.stringify(data)});return {status:r.status,...await r.json()};}
async function account(kind){const r=await fetch(base+'/__test/sign-in',{method:'POST',headers:{origin:base,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({email:kind+'-'+crypto.randomUUID().slice(0,8)+'@studytimely.invalid'}),redirect:'manual'});assert.equal(r.status,303);const cookie=r.headers.get('set-cookie').split(';')[0],res=await fetch(base+'/api/auth/me',{headers:{cookie}}),auth=await res.json(),a={cookie,csrf:auth.csrf};assert.equal((await call('/profile','PUT',{nickname:'Safety '+kind+' '+run,accepted:true,publicRanking:false,version:0},a)).status,200);return a;}
const a=await account('owner'),b=await account('learner'),c=await account('learner'),id=crypto.randomUUID();
assert.equal((await call('/rooms','POST',{id,name:'Local QA safety '+run,capacity:2,visibility:'public',goalMinutes:60},a)).status,201);
try{
 const outcomes=await Promise.all([b,c].map(u=>call('/rooms/'+id+'/join','POST',{accepted:true},u)));assert.deepEqual(outcomes.map(x=>x.status).sort(),[200,409]);
 const member=outcomes[0].status===200?b:c,full=await call('/rooms/'+id,'GET',undefined,a);assert.equal(full.members.length,2);assert.ok(full.members.every(x=>!x.online&&!x.studying));checks.push('two simultaneous joins fill only one place; offline members retain capacity');
 const invite=await call('/invite','POST',{code:full.room.inviteCode},outcomes[0].status===200?c:b);assert.equal(invite.room.members,2);assert.equal(invite.room.capacity,2);assert.equal(invite.room.alreadyMember,0);checks.push('invitation preview reports a full room before joining');
 async function send(who,text){return call('/rooms/'+id+'/messages','POST',{id:crypto.randomUUID(),text},who);}
 for(const text of ['Wechat: synthetic-learner','looking for a girlfriend']){const rejected=await send(a,text);assert.equal(rejected.status,422);assert.equal(rejected.error.code,'CONTENT_BLOCKED');assert.match(rejected.error.message,/\*\*\*/);}
 const rejected=await send(member,'synthetic-review-block');assert.equal(rejected.status,422);assert.equal(rejected.error.code,'CONTENT_BLOCKED');
 assert.equal((await send(member,'synthetic-review-unavailable')).status,503);assert.equal((await call('/rooms/'+id,'GET',undefined,a)).messages.length,0);checks.push('local rule rejection, simulated semantic rejection and simulated provider quota failure never reach member chat');
 const accepted=await send(member,'Finished the revision exercise');assert.equal(accepted.status,201);assert.equal((await call('/rooms/'+id,'GET',undefined,a)).messages[0].text,'Finished the revision exercise');checks.push('approved text reaches the other member after simulated review');
 assert.equal((await call('/timer/start','POST',{roomId:id},a)).status,200);const me=await call('/me','GET',undefined,a);assert.equal((await call('/timer/pause','POST',{lease:me.timer.lease},a)).status,200);checks.push('room timer stays usable independently of review failure');
}finally{const latest=(await call('/rooms/'+id,'GET',undefined,a)).room;if(latest)await call('/rooms/'+id+'/settings','PATCH',{name:latest.name,capacity:2,goalMinutes:60,invitationsOpen:false,close:true,version:latest.version},a);}
const report={at:new Date().toISOString(),environment:'localhost Worker/D1 fixture; external moderation simulated',realExternalReview:false,checks,passed:true};
const out=new URL('../../docs/development/evidence/groups-page-2026-11-14/safety-integration.json',import.meta.url);await fs.writeFile(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
