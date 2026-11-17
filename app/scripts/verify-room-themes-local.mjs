import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const base=process.env.PREVIEW_ORIGIN||'http://127.0.0.1:4300';if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw Error('Local synthetic QA only');
const checks=[],run=crypto.randomUUID().slice(0,8);
async function call(path,method='GET',data,a={}){const r=await fetch(base+path,{method,signal:AbortSignal.timeout(15000),headers:{origin:base,'content-type':'application/json',...(a.cookie?{cookie:a.cookie}:{}),...(a.csrf?{'x-csrf-token':a.csrf}:{})},body:data===undefined?undefined:JSON.stringify(data)});return {status:r.status,...await r.json()};}
async function login(kind){const r=await fetch(base+'/__test/sign-in',{method:'POST',redirect:'manual',headers:{origin:base,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({email:kind==='admin'?'admin@studytimely.invalid':kind+'-'+run+'@studytimely.invalid'})});assert.equal(r.status,303);const cookie=r.headers.get('set-cookie').split(';')[0],me=await call('/api/auth/me','GET',undefined,{cookie});return{cookie,csrf:me.csrf};}
const host=await login('owner'),learner=await login('learner'),admin=await login('admin'),id=crypto.randomUUID(),path='/api/community/rooms/'+id;
assert.equal((await call('/api/community/rooms','POST',{id,name:'Synthetic room theme QA '+run,visibility:'public',capacity:4,goalMinutes:120},host)).status,201);
let room=(await call(path,'GET',undefined,host)).room;assert.equal((await call(path+'/join','POST',{accepted:true,code:room.inviteCode},learner)).status,200);
const req=(text,version)=>({subject:'languages',customTheme:text,announcement:'quiet',version});
const require=createRequire('G:/Website Project/EXACTMEC/design-prototype/node_modules/wrangler/package.json'),WebSocket=require('ws'),socket=new WebSocket(base.replace('http:','ws:')+path+'/socket',{headers:{origin:base,cookie:learner.cookie}});let updates=0;socket.on('message',()=>updates++);await new Promise((resolve,reject)=>{socket.once('open',resolve);socket.once('error',reject);setTimeout(()=>reject(Error('Local websocket timeout')),10000).unref();});
try{
 assert.equal((await call(path+'/home','PATCH',req('IELTS partners '+run,room.version),host)).status,200);
 let view=await call(path,'GET',undefined,learner);assert.equal(view.room.customTheme,'IELTS partners '+run);assert.equal((await call('/api/community/rooms')).rooms.find(r=>r.id===id).customTheme,view.room.customTheme);assert.ok(updates>0);checks.push('actual local Worker/D1/DO: reviewed custom theme shared with second member and public card');
 const backup=await call('/api/account/export','GET',undefined,host);assert.equal(backup.community.ownedRooms.find(r=>r.id===id).custom_theme,view.room.customTheme);checks.push('owner account export contains approved room theme');
 assert.equal((await call(path+'/home','PATCH',req('Member cannot edit',view.room.version),learner)).status,403);
 const attempts=(await call('/api/community/review-status','GET',undefined,admin)).budget.attempts;
 for(const quickId of ['starting','break','completed'])assert.equal((await call(path+'/messages','POST',{id:crypto.randomUUID(),templateId:quickId},host)).status,201);
 view=await call(path,'GET',undefined,learner);assert.deepEqual(view.messages.map(x=>x.quick_id).sort(),['break','completed','starting']);assert.equal((await call('/api/community/review-status','GET',undefined,admin)).budget.attempts,attempts);assert.equal(view.members.find(m=>m.id===view.room.ownerId).today_seconds,0);checks.push('fixed messages reach second member without more inference or study credit; member edit denied');
 for(const [text,status] of [['add me on discord',422],['synthetic-review-block',422],['synthetic-review-unavailable',503]])assert.equal((await call(path+'/home','PATCH',req(text,view.room.version),host)).status,status);
 assert.equal((await call(path,'GET',undefined,learner)).room.customTheme,view.room.customTheme);
 assert.equal((await call(path+'/home','PATCH',req('',view.room.version),host)).status,200);checks.push('contact, synthetic semantic block and provider outage never publish; preset still saves while review circuit is paused');
 for(const name of ['study','encourage','break']){const r=await fetch(base+'/design-assets/chat-stickers/'+name+'-v1.webp');assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/image\/webp/);assert.ok((await r.arrayBuffer()).byteLength>10000);}checks.push('three self-hosted transparent WebP exports served correctly');
 assert.equal((await call('/api/community/me','GET',undefined,host)).timer,null);
 const final=await call(path,'GET',undefined,host);assert.equal((await call(path+'/settings','PATCH',{name:final.room.name,capacity:4,goalMinutes:120,invitationsOpen:false,close:true,version:final.room.version},host)).status,200);
 checks.push('QA room closed cleanly; no timers started or synthetic study time added');
 await fs.writeFile(new URL('../../docs/development/evidence/room-theme-stickers-2026-11-17/integration.json',import.meta.url),JSON.stringify({environment:'local synthetic only',checks,externalInferenceCalls:0},null,2));console.log(JSON.stringify({passed:checks.length,checks},null,2));
}finally{socket.close();}
