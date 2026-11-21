import test from 'node:test';
import assert from 'node:assert/strict';
import {setupCommunity as setup,reviewResult} from './helpers/community.mjs';
const details=(name,version=1)=>({name,subject:'maths',customTheme:'',announcement:'quiet',version});
const settings=(s,r,owner,values)=>s.call('/rooms/'+r.id+'/settings','PATCH',values,owner);
const row=(s,r)=>s.db.prepare('SELECT * FROM community_rooms WHERE id=?').get(r.id);

test('one details save atomically updates name/theme/notice without overwriting invitation, capacity or daily goal',async()=>{
 const s=await setup();try{
  const owner=await s.user('owner'),r=await s.room(owner),before=row(s,r);
  const result=await s.call('/rooms/'+r.id+'/home','PATCH',details('Maths revision partners'),owner);
  assert.equal(result.status,200,JSON.stringify(result));const after=row(s,r);
  assert.equal(after.name,'Maths revision partners');assert.equal(after.study_subject,'maths');assert.equal(after.announcement_key,'quiet');assert.equal(after.version,2);
  for(const key of ['capacity','goal_minutes','invite_token','invitations_open','closed_at'])assert.equal(after[key],before[key],key);
  assert.equal((await s.call('/rooms/'+r.id+'/home','PATCH',details('Stale edit'),owner)).status,409);
  assert.equal(row(s,r).name,'Maths revision partners');
 }finally{s.close();}
});

test('blocked custom text or invalid room name never partially saves details',async()=>{
 const s=await setup({reviewFetch:async()=>reviewResult(6)});try{
  const owner=await s.user('owner'),r=await s.room(owner),original=row(s,r).name;
  assert.equal((await s.call('/rooms/'+r.id+'/home','PATCH',{...details('New name'),customTheme:'Unsafe sample title'},owner)).status,422);
  assert.equal(row(s,r).name,original);assert.equal(row(s,r).version,1);
  assert.equal((await s.call('/rooms/'+r.id+'/home','PATCH',details('x'),owner)).status,400);
  const member=await s.user('member');await s.call('/rooms/'+r.id+'/join','POST',{accepted:true,code:r.code},member);
  assert.equal((await s.call('/rooms/'+r.id+'/home','PATCH',details('Other edit'),member)).status,403);
  assert.equal((await s.call('/rooms/'+r.id+'/home','PATCH',details('No csrf'),{cookie:owner.cookie})).status,403);
 }finally{s.close();}
});

test('independent invitation mutations retain other settings and reject cross-section fields',async()=>{
 const s=await setup();try{
  const owner=await s.user('owner'),member=await s.user('member'),r=await s.room(owner);
  await s.call('/rooms/'+r.id+'/join','POST',{accepted:true,code:r.code},member);
  const before=row(s,r);
  assert.equal((await settings(s,r,owner,{section:'invitation',invitationsOpen:false,version:1})).status,200);
  const after=row(s,r);assert.equal(after.invitations_open,0);
  for(const key of ['name','capacity','goal_minutes','invite_token','study_subject','closed_at'])assert.equal(after[key],before[key],key);
  assert.equal((await settings(s,r,owner,{section:'invitation',rotateInvite:true,version:1})).status,409);
  assert.equal((await settings(s,r,owner,{section:'invitation',rotateInvite:true,version:2})).status,200);
  assert.notEqual(row(s,r).invite_token,before.invite_token);assert.equal(row(s,r).invitations_open,0);
  assert.equal((await s.call('/rooms/'+r.id,'GET',undefined,member)).member,true);
  for(const invalid of [{name:'Overwrite'},{goalMinutes:999},{close:true},{invitationsOpen:'yes'}])assert.equal((await settings(s,r,owner,{section:'invitation',version:3,...invalid})).status,400);
  assert.equal((await settings(s,r,member,{section:'invitation',invitationsOpen:true,version:3})).status,403);
  assert.equal((await settings(s,r,owner,{section:'invitation',invitationsOpen:true,version:3})).status,200);
  const newcomer=await s.user('newcomer');
  assert.equal((await s.call('/rooms/'+r.id+'/join','POST',{accepted:true,code:r.code},newcomer)).status,404);
  assert.equal((await s.call('/rooms/'+r.id+'/join','POST',{accepted:true,code:row(s,r).invite_token},newcomer)).status,200);
 }finally{s.close();}
});

test('capacity and closing keep validation, permissions, CAS and unrelated fields',async()=>{
 const s=await setup();try{
  const owner=await s.user('owner'),r=await s.room(owner),before=row(s,r);
  assert.equal((await settings(s,r,owner,{section:'capacity',capacity:8,version:1})).status,403);
  assert.equal((await settings(s,r,owner,{section:'capacity',capacity:3,version:1})).status,200);
  assert.equal(row(s,r).capacity,3);assert.equal(row(s,r).goal_minutes,before.goal_minutes);assert.equal(row(s,r).invitations_open,1);
  assert.equal((await settings(s,r,owner,{section:'close',close:false,version:2})).status,400);
  assert.equal((await settings(s,r,owner,{section:'close',close:true,version:1})).status,409);
  assert.equal((await settings(s,r,owner,{section:'close',close:true,version:2})).status,200);
  assert.ok(row(s,r).closed_at>0);assert.equal(row(s,r).invitations_open,0);assert.equal(row(s,r).name,before.name);
  assert.equal((await settings(s,r,owner,{section:'invitation',invitationsOpen:true,version:3})).status,403);
 }finally{s.close();}
});

test('room report queries filter before the limit and leave owner reports in platform moderation',async()=>{
 const s=await setup();try{
  const admin=await s.user('admin'),member=await s.user('member'),r=await s.room(admin),other=await s.room(member);
  const add=(room,subject)=>{const id=crypto.randomUUID();s.db.prepare("INSERT INTO community_reports(id,room_id,reporter_id,subject_id,reason,excerpt,detail,created_at) VALUES(?,?,?,?,?,?,?,?)").run(id,room.id,member.profileId,subject,'spam','Synthetic reported content','',s.now);return id;};
  const relevant=add(r,member.profileId),ownerReport=add(r,admin.profileId);add(other,admin.profileId);
  const filtered=await s.call('/moderation?room='+r.id,'GET',undefined,admin);
  assert.equal(filtered.status,200,JSON.stringify(filtered));assert.deepEqual(filtered.reports.map(report=>report.id),[relevant]);
  assert.ok((await s.call('/moderation','GET',undefined,admin)).reports.some(report=>report.id===ownerReport));
  assert.deepEqual((await s.call('/moderation?room='+r.id,'GET',undefined,member)).reports,[]);
  assert.equal((await s.call('/moderation?room=invalid','GET',undefined,admin)).status,400);
 }finally{s.close();}
});
