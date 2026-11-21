// Isolated local Worker/D1 verification. Never run against a public origin.
import assert from 'node:assert/strict';
const base=process.env.PREVIEW_ORIGIN||'http://127.0.0.1:4310';
if(!['127.0.0.1','localhost'].includes(new URL(base).hostname))throw Error('Local synthetic origin required');
const run=crypto.randomUUID().slice(0,8),checks=[];
async function call(path,method='GET',data,auth={}){const response=await fetch(base+path,{method,signal:AbortSignal.timeout(15000),headers:{origin:base,'content-type':'application/json',...(auth.cookie?{cookie:auth.cookie}:{}),...(auth.csrf?{'x-csrf-token':auth.csrf}:{})},body:data===undefined?undefined:JSON.stringify(data)});return{status:response.status,...await response.json()};}
async function login(role){const response=await fetch(base+'/__test/sign-in',{method:'POST',signal:AbortSignal.timeout(15000),headers:{origin:base,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({email:role+'-'+run+'@studytimely.invalid'}),redirect:'manual'});assert.equal(response.status,303);const cookie=response.headers.get('set-cookie').split(';')[0],me=await call('/api/auth/me','GET',undefined,{cookie});return{cookie,csrf:me.csrf};}
const owner=await login('owner'),member=await login('learner'),id=crypto.randomUUID(),root='/api/community/rooms/'+id;
assert.equal((await call('/api/community/rooms','POST',{id,name:'Manage local QA '+run,visibility:'private',capacity:4,goalMinutes:120},owner)).status,201);
let selected=await call(root,'GET',undefined,owner);const originalCode=selected.room.inviteCode;
assert.equal((await call(root+'/join','POST',{accepted:true,code:originalCode},member)).status,200);
checks.push('free private room and invited member created in isolated local D1');
let result=await call(root+'/home','PATCH',{name:'Reading local QA '+run,subject:'maths',customTheme:'',announcement:'quiet',version:selected.room.version},owner);
assert.equal(result.status,200,JSON.stringify(result));selected=await call(root,'GET',undefined,owner);
assert.equal(selected.room.name,'Reading local QA '+run);assert.equal(selected.room.subject,'maths');assert.equal(selected.room.inviteCode,originalCode);assert.equal(selected.room.goalMinutes,120);assert.equal(selected.room.capacity,4);
checks.push('one details save updates name/theme/notice and preserves independent settings');
assert.equal((await call(root+'/settings','PATCH',{section:'invitation',invitationsOpen:false,version:selected.room.version},owner)).status,200);
assert.equal((await call(root,'GET',undefined,member)).member,true);selected=await call(root,'GET',undefined,owner);
assert.equal(selected.room.invitationsOpen,false);assert.equal(selected.room.name,'Reading local QA '+run);
assert.equal((await call(root+'/settings','PATCH',{section:'invitation',rotateInvite:true,version:selected.room.version-1},owner)).status,409);
assert.equal((await call(root+'/settings','PATCH',{section:'invitation',rotateInvite:true,version:selected.room.version},owner)).status,200);
selected=await call(root,'GET',undefined,owner);assert.notEqual(selected.room.inviteCode,originalCode);assert.equal(selected.room.invitationsOpen,false);
checks.push('invitation pause/rotation retain memberships and reject stale versions');
assert.equal((await call(root+'/settings','PATCH',{section:'invitation',invitationsOpen:true,version:selected.room.version},member)).status,403);
assert.equal((await call(root+'/home','PATCH',{name:'Not permitted',subject:'general',customTheme:'',announcement:'welcome',version:selected.room.version},member)).status,403);
assert.equal((await call(root+'/settings','PATCH',{section:'invitation',invitationsOpen:true,version:selected.room.version},{cookie:owner.cookie})).status,403);
checks.push('ordinary members and missing CSRF cannot edit owner settings');
const profile=(await call('/api/community/me','GET',undefined,member)).profile.id;
assert.equal((await call(root+'/seats','PATCH',{profileIds:[profile],version:selected.room.version},owner)).status,200);
selected=await call(root,'GET',undefined,owner);assert.equal(selected.room.freeSeatsChosen,true);assert.ok(selected.access.freeMemberIds.includes(profile));
assert.equal((await call('/api/community/moderation?room='+id,'GET',undefined,owner)).reports.length,0);
checks.push('free-place selection and room-filtered report query work on compiled Worker');
assert.equal((await call(root+'/settings','PATCH',{section:'close',close:true,version:selected.room.version},owner)).status,200);
selected=await call(root,'GET',undefined,owner);assert.equal(selected.room.closed,true);assert.equal(selected.room.invitationsOpen,false);
checks.push('synthetic room closed with invitations disabled after verification');
console.log(JSON.stringify({checks:checks.length,passed:checks},null,2));
