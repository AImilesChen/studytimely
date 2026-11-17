import test from 'node:test';
import assert from 'node:assert/strict';
import {setupCommunity as setup,reviewResult} from './helpers/community.mjs';
import {roomThemeInput} from '../src/lib/room-theme.mjs';
import {stickerForMessage} from '../src/lib/study-stickers.mjs';
const input=(theme='',version=1)=>({subject:'maths',announcement:'quiet',customTheme:theme,version});
const save=(s,r,h,data)=>s.call('/rooms/'+r.id+'/home','PATCH',data,h);
const stored=(s,r)=>s.db.prepare('SELECT custom_theme,study_subject,version FROM community_rooms WHERE id=?').get(r.id);
test('room theme validation normalises plain text and rejects controls, markup and excessive length',()=>{
 assert.equal(roomThemeInput('  ＩＥＬＴＳ   partners '),'IELTS partners');
 for(const text of ['x','a'.repeat(41),'math\nnotes','math\u200bnotes','<math>'])assert.throws(()=>roomThemeInput(text));
 assert.equal(roomThemeInput(''),'');
 assert.equal(stickerForMessage('completed').type,'complete');
 assert.equal(stickerForMessage({text:'Well done!'}),null);
 assert.equal(stickerForMessage({quick_id:'made-up'}),null);
});
test('free owners save reviewed themes; members see them without any study credit',async()=>{
 let calls=0;const s=await setup({reviewFetch:async()=>{calls++;return reviewResult();}});try{
 const h=await s.user('host'),m=await s.user('learner'),r=await s.room(h,'public');
 await s.call('/rooms/'+r.id+'/join','POST',{code:r.code,accepted:true},m);
 assert.equal((await save(s,r,m,input('IELTS partners'))).status,403);
 assert.equal((await save(s,r,{cookie:h.cookie},input('IELTS partners'))).status,403);
 assert.equal((await save(s,r,h,input('IELTS partners'))).status,200);
 assert.equal(calls,1);const detail=await s.call('/rooms/'+r.id,'GET',undefined,m);assert.equal(detail.room.customTheme,'IELTS partners');assert.equal(detail.customThemesAvailable,true);
 assert.equal((await s.call('/rooms')).rooms.find(x=>x.id===r.id).customTheme,'IELTS partners');
 assert.equal(s.db.prepare('SELECT count(*) n FROM community_daily').get().n,0);
 assert.equal(s.db.prepare('SELECT count(*) n FROM community_timers').get().n,0);
 assert.equal((await save(s,r,h,input('IELTS partners'))).status,200);assert.equal(calls,1);
 delete s.env.AZURE_CONTENT_SAFETY_KEY;
 assert.equal((await save(s,r,h,{subject:'maths',announcement:'kind',version:2})).status,200);
 assert.equal(stored(s,r).custom_theme,'IELTS partners');
 assert.equal((await save(s,r,h,input('',3))).status,200);assert.equal(stored(s,r).custom_theme,'');
 }finally{s.close();}
});
test('presets work while custom review is disabled; blocked and unavailable themes never change the room',async()=>{
 let calls=0;const s=await setup({reviewFetch:async()=>{calls++;return reviewResult(6);}});try{
 const h=await s.user('host'),r=await s.room(h);
 assert.equal((await save(s,r,h,input('add me on discord'))).status,422);assert.equal(calls,0);
 assert.equal((await save(s,r,h,input('Unsafe test theme'))).status,422);assert.equal(calls,1);assert.equal(stored(s,r).version,1);
 delete s.env.AZURE_CONTENT_SAFETY_KEY;
 assert.equal((await save(s,r,h,input('IELTS partners'))).status,503);
 assert.equal((await save(s,r,h,input())) .status,200);
 assert.equal(stored(s,r).custom_theme,'');
 assert.equal((await s.call('/rooms/'+r.id,'GET',undefined,h)).customThemesAvailable,false);
 assert.equal((await save(s,r,h,input('',0))).status,400);
 }finally{s.close();}
});
test('provider failures fail closed and missing moderation never sends a draft externally',async()=>{
 let calls=0;const s=await setup({reviewFetch:async()=>{calls++;throw Error('synthetic outage');}});try{
 const h=await s.user('host'),r=await s.room(h);
 assert.equal((await save(s,r,h,input('IELTS partners'))).status,503);assert.equal(calls,1);assert.equal(stored(s,r).custom_theme,'');
 s.env.COMMUNITY_ADMIN_EMAILS='';assert.equal((await save(s,r,h,input('Revision partners'))).status,503);assert.equal(calls,1);
 }finally{s.close();}
});
test('stale versions are rejected before review and asynchronous competing saves cannot overwrite a preset',async()=>{
 let finish,entered;const ready=new Promise(r=>entered=r);let calls=0;const s=await setup({reviewFetch:async()=>{calls++;entered();return new Promise(r=>finish=r);}});try{
 const h=await s.user('host'),r=await s.room(h);
 assert.equal((await save(s,r,h,input('IELTS partners',2))).status,409);assert.equal(calls,0);
 const pending=save(s,r,h,input('IELTS partners'));await ready;
 assert.equal((await save(s,r,h,input())).status,200);finish(reviewResult());assert.equal((await pending).status,409);
 assert.equal(stored(s,r).custom_theme,'');assert.equal(stored(s,r).study_subject,'maths');
 }finally{s.close();}
});
for(const revoke of ['logout','mute','close','ban','expire','review-off'])test('theme access is rechecked after review: '+revoke,async()=>{
 let finish,entered;const ready=new Promise(r=>entered=r);const s=await setup({reviewFetch:async()=>{entered();return new Promise(r=>finish=r);}});try{
 const h=await s.user('host'),r=await s.room(h),pending=save(s,r,h,input('IELTS partners'));await ready;
 if(revoke==='logout')s.db.prepare('DELETE FROM sessions WHERE account_id=?').run(h.id);
 if(revoke==='expire')s.advance(31*86400000);
 if(revoke==='mute')s.db.prepare('UPDATE community_members SET muted_until=? WHERE room_id=?').run(s.now+60000,r.id);
 if(revoke==='ban')s.db.prepare('UPDATE community_members SET banned=1 WHERE room_id=?').run(r.id);
 if(revoke==='close')s.db.prepare('UPDATE community_rooms SET closed_at=? WHERE id=?').run(s.now,r.id);
 if(revoke==='review-off')s.env.COMMUNITY_REVIEW_ENABLED='false';
 finish(reviewResult());assert.ok([409,503].includes((await pending).status));assert.equal(stored(s,r).custom_theme,'');
 }finally{s.close();}
});
test('new custom themes are bounded to six review attempts per room per hour',async()=>{
 let calls=0;const s=await setup({reviewFetch:async()=>{calls++;return reviewResult();}});try{
 const h=await s.user('host'),r=await s.room(h);for(let i=1;i<=6;i++){s.advance(1100);assert.equal((await save(s,r,h,input('Revision group '+i,i))).status,200);}
 assert.equal((await save(s,r,h,input('Revision group seven',7))).status,429);assert.equal(calls,6);assert.equal(stored(s,r).custom_theme,'Revision group 6');
 }finally{s.close();}
});

test('revoked administrative rights cannot authorise another owner’s theme after review',async()=>{
 let finish,entered;const ready=new Promise(r=>entered=r),s=await setup({reviewFetch:async()=>{entered();return new Promise(r=>finish=r);}});try{
 const h=await s.user('host'),admin=await s.user('admin'),r=await s.room(h);await s.call('/rooms/'+r.id+'/join','POST',{accepted:true,code:r.code},admin);
 const pending=save(s,r,admin,input('IELTS partners'));await ready;s.env.COMMUNITY_ADMIN_EMAILS='replacement@example.invalid';finish(reviewResult());assert.equal((await pending).status,409);assert.equal(stored(s,r).custom_theme,'');
 }finally{s.close();}
});
