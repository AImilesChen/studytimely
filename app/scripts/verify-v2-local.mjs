import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const base=process.env.PREVIEW_ORIGIN||'http://127.0.0.1:4184';if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw Error('Synthetic verification is localhost-only.');
const checks=[],run=crypto.randomUUID().slice(0,8);
async function call(path,method='GET',data,auth={}){const r=await fetch(base+path,{method,headers:{origin:base,'Content-Type':'application/json',...(auth.cookie?{cookie:auth.cookie}:{}),...(auth.csrf?{'x-csrf-token':auth.csrf}:{})},body:data===undefined?undefined:JSON.stringify(data)});const json=await r.json();return{status:r.status,...json};}
async function login(email){const r=await fetch(base+'/__test/sign-in',{method:'POST',headers:{origin:base,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({email}),redirect:'manual'});assert.equal(r.status,303);const cookie=r.headers.get('set-cookie').split(';')[0],me=await call('/api/auth/me','GET',undefined,{cookie});assert.equal(me.user.googleLinked,true);return{cookie,csrf:me.csrf};}
const owner=await login('owner-'+run+'@studytimely.invalid'),learner=await login('learner-'+run+'@studytimely.invalid');
for(const previous of (await call('/api/community/me','GET',undefined,owner)).rooms.filter(r=>!r.closed_at&&r.name.startsWith('Local QA '))){const old=(await call('/api/community/rooms/'+previous.id,'GET',undefined,owner)).room;await call('/api/community/rooms/'+old.id+'/settings','PATCH',{name:old.name,capacity:old.capacity,goalMinutes:old.goalMinutes,invitationsOpen:false,version:old.version,close:true},owner);}
for(const [a,name]of [[owner,'QA owner '+run],[learner,'QA learner '+run]]){const prior=await call('/api/community/me','GET',undefined,a);assert.equal((await call('/api/community/profile','PUT',{nickname:name,publicRanking:true,accepted:true,version:prior.profile?.version||0},a)).status,200);}
checks.push('synthetic independent Google-linked sessions and nicknames');
const id=crypto.randomUUID();assert.equal((await call('/api/community/rooms','POST',{id,name:'Local QA '+run,visibility:'private',capacity:3,goalMinutes:60},owner)).status,201);
const room=(await call('/api/community/rooms/'+id,'GET',undefined,owner)).room;assert.equal((await call('/api/community/rooms/'+id)).status,404);
assert.equal((await call('/api/community/rooms/'+id+'/join','POST',{accepted:true,code:room.inviteCode},learner)).status,200);checks.push('private invitation, anonymous access denial and member join');
const require=createRequire('G:/Website Project/EXACTMEC/design-prototype/node_modules/wrangler/package.json'),WebSocket=require('ws');
const socket=new WebSocket(base.replace('http:','ws:')+'/api/community/rooms/'+id+'/socket',{headers:{origin:base,cookie:learner.cookie}});
let closedCode=null;socket.on('close',code=>{closedCode=code;});
const initial=new Promise((resolve,reject)=>{socket.once('message',data=>resolve(JSON.parse(String(data))));setTimeout(()=>reject(Error('Initial room update timed out')),10000).unref();});
await new Promise((resolve,reject)=>{socket.once('open',resolve);socket.once('error',reject);setTimeout(()=>reject(Error('WebSocket connection timed out')),10000).unref();});
assert.equal((await initial).type,'refresh');
const refreshed=new Promise((resolve,reject)=>{socket.once('message',data=>resolve(JSON.parse(String(data))));setTimeout(()=>reject(Error('Realtime notification timed out')),10000).unref();});
const messageId=crypto.randomUUID();assert.equal((await call('/api/community/rooms/'+id+'/messages','POST',{id:messageId,text:'Synthetic integration message 📚'},owner)).status,201);assert.equal((await refreshed).type,'refresh');checks.push('actual Durable Object WebSocket upgrade and update broadcast');
const started=await call('/api/community/timer/start','POST',{roomId:id},learner);assert.equal(started.status,200);assert.equal((await call('/api/community/timer/start','POST',{roomId:id},learner)).status,409);
await new Promise(resolve=>setTimeout(resolve,2100));const paused=await call('/api/community/timer/pause','POST',{lease:started.timer.lease,seconds:999999},learner);assert.equal(paused.status,200);assert.ok(paused.timer.credited_seconds>=2&&paused.timer.credited_seconds<30);checks.push('server-clock timer credit with exclusive account lease');
const current=await call('/api/community/rooms/'+id,'GET',undefined,learner);assert.ok(current.messages.some(m=>m.id===messageId));assert.ok(current.members.some(m=>m.nickname.startsWith('QA learner')&&m.online));
await call('/api/community/rooms/'+id+'/reports','POST',{messageId,reason:'spam',detail:'Synthetic moderation test'},learner);assert.equal((await call('/api/community/moderation','GET',undefined,owner)).reports.length,0);
const admin=await login('admin@studytimely.invalid');await call('/api/community/profile','PUT',{nickname:'QA moderator '+run,publicRanking:false,accepted:true,version:(await call('/api/community/me','GET',undefined,admin)).profile?.version||0},admin);const report=(await call('/api/community/moderation','GET',undefined,admin)).reports.find(r=>r.message_id===messageId||r.room_id===id);assert.ok(report);assert.equal((await call('/api/community/moderation','POST',{id:report.id,action:'hide'},admin)).status,200);checks.push('owner-report escalation and authorised platform moderation');
await call('/api/community/rooms/'+id+'/members','PATCH',{profileId:(await call('/api/community/me','GET',undefined,learner)).profile.id,action:'remove'},owner);
const revoked=await call('/__test/notify','POST',{roomId:id});assert.equal(revoked.checked,0);assert.ok(socket.readyState===WebSocket.CLOSING||socket.readyState===WebSocket.CLOSED,'Server must initiate socket closure before responding');
if(closedCode===null)await new Promise(resolve=>{socket.once('close',resolve);setTimeout(resolve,35000).unref();});if(closedCode===null)socket.terminate();assert.equal(closedCode,1008,'Removed members must lose the live socket');assert.equal((await call('/api/community/rooms/'+id,'GET',undefined,learner)).status,404);checks.push('member removal revokes private-room access and live connection');
const exported=await call('/api/account/export','GET',undefined,learner);assert.ok(exported.community?.profile);checks.push('authenticated export includes own community records');
// Close only this run's synthetic room; keep disposable fixture accounts for visual QA.
const latest=(await call('/api/community/rooms/'+id,'GET',undefined,owner)).room;
assert.equal((await call('/api/community/rooms/'+id+'/settings','PATCH',{name:latest.name,capacity:3,goalMinutes:60,invitationsOpen:false,version:latest.version,close:true},owner)).status,200);
const production=await fs.readFile(new URL('../dist/cloudflare/worker.mjs',import.meta.url),'utf8');assert.ok(!production.includes('/__test/sign-in')&&!production.includes('synthetic-local-google:'));
const evidence={at:new Date().toISOString(),environment:'local Worker/D1/Durable Objects',realGoogleAuthentication:false,fixture:'localhost-only synthetic accounts',checks,passed:true};
await fs.mkdir(new URL('../../../docs/development/evidence/v2/',import.meta.url),{recursive:true});await fs.writeFile(new URL('../../../docs/development/evidence/v2/local-worker.json',import.meta.url),JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
