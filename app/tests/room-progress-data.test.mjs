import test from 'node:test';
import assert from 'node:assert/strict';
import {setupCommunity} from './helpers/community.mjs';
import {createWorker} from '../server/cloudflare.mjs';
import {metadata} from '../src/lib/site.mjs';

test('room totals count recorded participants including a former member and expose only aggregate retained dates',async()=>{
 const s=await setupCommunity();try{
  const owner=await s.user('progress-owner'),guest=await s.user('progress-guest'),room=await s.room(owner);
  assert.equal((await s.call('/rooms/'+room.id+'/join','POST',{code:room.code,accepted:true},guest)).status,200);
  const day=new Date(s.now).toISOString().slice(0,10);
  for(const [id,seconds] of [[owner.profileId,30],[guest.profileId,60]])s.db.prepare('INSERT INTO community_room_daily(room_id,profile_id,day,seconds) VALUES(?,?,?,?)').run(room.id,id,day,seconds);
  assert.equal((await s.call('/rooms/'+room.id+'/leave','POST',{},guest)).status,200);
  const r=await s.call('/rooms/'+room.id,'GET',undefined,owner);
  assert.equal(r.totals.today_seconds,90);assert.equal(r.totals.today_members,2);assert.equal(r.members.length,1);
  assert.equal(r.totals.retained_from,day);assert.equal(r.totals.retained_to,day);
  const values={name:r.room.name,capacity:r.room.capacity,goalMinutes:80,invitationsOpen:r.room.invitationsOpen,version:r.room.version};
  assert.equal((await s.call('/rooms/'+room.id+'/settings','PATCH',values,owner)).status,200);
  assert.equal((await s.call('/rooms/'+room.id+'/settings','PATCH',{...values,goalMinutes:90},owner)).status,409);
  assert.equal((await s.call('/rooms/'+room.id,'GET',undefined,owner)).totals.today_seconds,90);
 }finally{s.close();}
});
test('members cannot alter the room goal and a new UTC day has zero participating members',async()=>{
 const s=await setupCommunity();try{
  const owner=await s.user('goal-owner'),guest=await s.user('goal-member'),room=await s.room(owner);
  await s.call('/rooms/'+room.id+'/join','POST',{code:room.code,accepted:true},guest);
  const r=await s.call('/rooms/'+room.id,'GET',undefined,guest);
  assert.equal((await s.call('/rooms/'+room.id+'/settings','PATCH',{name:r.room.name,capacity:4,goalMinutes:10,invitationsOpen:true,version:r.room.version},guest)).status,403);
  s.db.prepare('INSERT INTO community_room_daily(room_id,profile_id,day,seconds) VALUES(?,?,?,?)').run(room.id,owner.profileId,new Date(s.now).toISOString().slice(0,10),30);
  s.advance(86400000);const next=await s.call('/rooms/'+room.id,'GET',undefined,owner);
  assert.equal(next.totals.today_seconds,0);assert.equal(next.totals.today_members,0);assert.equal(next.totals.total_seconds,30);
 }finally{s.close();}
});
test('private HTML robots matches its noindex/no-store response without changing the public landing asset',async()=>{
 const html='<html><head><meta name="robots" content="index,follow"/></head><body>Public guide</body></html>';
 const env={ASSETS:{fetch:async()=>new Response(html,{headers:{'Content-Type':'text/html','Content-Length':String(html.length),'ETag':'public-asset'}})}};
 const worker=createWorker({indexable:true});
 for(const query of ['room=example','invite=example','activity=example']){
  const r=await worker.fetch(new Request('https://example.test/study-groups?'+query),env);
  assert.equal(r.headers.get('cache-control'),'no-store');assert.match(r.headers.get('x-robots-tag'),/noindex/);
  assert.match(await r.text(),/name="robots" content="noindex,nofollow"/);assert.equal(r.headers.get('etag'),null);
 }
 const publicPage=await worker.fetch(new Request('https://example.test/study-groups'),env);assert.match(await publicPage.text(),/content="index,follow"/);
 const head=await worker.fetch(new Request('https://example.test/study-groups?room=example',{method:'HEAD'}),env);assert.equal(await head.text(),'');assert.equal(head.headers.get('cache-control'),'no-store');
});
test('client metadata retains private noindex on all group query variants and restores public landing indexing',()=>{
 const config={indexable:true,origin:'https://studytimely.com'};
 for(const search of ['?room=example','?invite=example','?activity=example','?room='])assert.equal(metadata('/study-groups',config,search).robots,'noindex,nofollow');
 assert.equal(metadata('/study-groups',config,'').robots,'index,follow');
 assert.equal(metadata('/study-groups',config,'?campaign=example').robots,'index,follow');
});
