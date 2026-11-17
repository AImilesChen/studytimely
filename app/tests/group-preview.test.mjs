import test from 'node:test';
import assert from 'node:assert/strict';
import {groupPreview} from './fixtures/group-preview.mjs';
import {setupCommunity} from './helpers/community.mjs';
test('guided preview is localhost-only, explicitly synthetic and does not create records on GET',async()=>{
 const s=await setupCommunity();try{s.env.FIXTURE_ACTIVITIES_QA='true';const r=await groupPreview(new Request('http://localhost/__test/group-preview'),s.env);assert.equal(r.status,200);assert.match(r.headers.get('x-robots-tag'),/noindex/);assert.ok((await r.text()).includes('不用重新创建房间'));assert.equal(s.db.prepare('SELECT count(*) n FROM accounts').get().n,0);
 assert.equal((await groupPreview(new Request('https://studytimely.com/__test/group-preview'),s.env)).status,404);delete s.env.FIXTURE_ACTIVITIES_QA;assert.equal((await groupPreview(new Request('http://localhost/__test/group-preview'),s.env)).status,404);
 }finally{s.close();}
});
test('guided preview creates only synthetic empty learning records, reuses the room and requires matching origin',async()=>{
 const s=await setupCommunity();try{s.env.FIXTURE_ACTIVITIES_QA='true';const post=(role,origin='http://localhost')=>groupPreview(new Request('http://localhost/__test/group-preview',{method:'POST',headers:{origin,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({role})}),s.env);
 assert.equal((await post('owner','https://evil.invalid')).status,403);assert.equal((await post('admin')).status,400);const owner=await post('owner');assert.equal(owner.status,303);assert.match(owner.headers.get('location'),/^\/study-groups\?room=/);assert.ok(owner.headers.get('set-cookie'));const learner=await post('learner');assert.match(learner.headers.get('location'),/^\/study-groups\?invite=/);await post('owner');assert.equal(s.db.prepare('SELECT count(*) n FROM community_rooms').get().n,1);assert.equal(s.db.prepare('SELECT count(*) n FROM community_activities').get().n,1);assert.equal(s.db.prepare('SELECT count(*) n FROM community_credits').get().n,0);assert.equal(s.db.prepare('SELECT count(*) n FROM community_timers').get().n,0);
 }finally{s.close();}
});
