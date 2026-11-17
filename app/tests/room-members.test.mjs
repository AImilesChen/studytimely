import test from 'node:test';
import assert from 'node:assert/strict';
import {setupCommunity as setup} from './helpers/community.mjs';
const base=r=>'/rooms/'+r.id;
const manage=(s,r,a,id,action)=>s.call(base(r)+'/members','PATCH',{profileId:id,action},a);
const join=(s,r,a)=>s.call(base(r)+'/join','POST',{accepted:true,code:r.code},a);
const row=(s,r,a)=>s.db.prepare('SELECT banned,left_at FROM community_members WHERE room_id=? AND profile_id=?').get(r.id,a.profileId);
test('removing frees a place and preserves credited time while allowing an explicit invited return',async()=>{
 const s=await setup();try{const h=await s.user('host'),m=await s.user('member'),extra=await s.user('extra'),r=await s.room(h,'private',2);await join(s,r,m);
 const t=await s.call('/timer/start','POST',{roomId:r.id},m);s.advance(30000);await s.call('/timer/heartbeat','POST',{lease:t.timer.lease},m);
 assert.equal((await manage(s,r,h,m.profileId,'evict')).status,200);assert.equal(row(s,r,m).banned,0);assert.ok(row(s,r,m).left_at);assert.equal(s.db.prepare('SELECT status FROM community_timers WHERE profile_id=?').get(m.profileId).status,'paused');assert.equal((await s.call(base(r),'GET',undefined,m)).status,404);
 assert.equal((await join(s,r,extra)).status,200);assert.equal((await join(s,r,m)).status,409);await s.call(base(r)+'/leave','POST',{},extra);assert.equal((await join(s,r,m)).status,200);assert.equal(row(s,r,m).left_at,0);assert.equal(s.db.prepare('SELECT seconds FROM community_room_daily WHERE profile_id=?').get(m.profileId).seconds,30);
 }finally{s.close();}
});
test('block prevents invitation return; allow rejoining never silently restores membership or timer',async()=>{
 const s=await setup();try{const h=await s.user('host'),m=await s.user('member'),extra=await s.user('extra'),r=await s.room(h,'public',2);await join(s,r,m);
 assert.equal((await manage(s,r,h,m.profileId,'ban')).status,200);assert.equal((await join(s,r,m)).error.code,'BANNED');assert.equal((await s.call(base(r),'GET',undefined,m)).accessState,'blocked');assert.equal((await manage(s,r,h,m.profileId,'evict')).status,409);assert.equal(row(s,r,m).banned,1);
 await join(s,r,extra);assert.equal((await manage(s,r,h,m.profileId,'unban')).status,200);assert.equal(row(s,r,m).banned,0);assert.ok(row(s,r,m).left_at);assert.equal((await s.call(base(r),'GET',undefined,m)).member,false);assert.equal((await join(s,r,m)).status,409);
 await s.call(base(r)+'/leave','POST',{},extra);assert.equal((await join(s,r,m)).status,200);assert.equal(s.db.prepare('SELECT count(*) n FROM community_timers').get().n,0);
 }finally{s.close();}
});
test('owner actions reject self, member, cross-room, CSRF and closed-room attempts',async()=>{
 const s=await setup();try{const h=await s.user('host'),m=await s.user('member'),other=await s.user('other'),r=await s.room(h),r2=await s.room(other);await join(s,r,m);
 for(const action of ['evict','ban','unban']){assert.equal((await manage(s,r,m,h.profileId,action)).status,403);assert.equal((await manage(s,r,h,h.profileId,action)).status,400);assert.equal((await manage(s,r2,h,m.profileId,action)).status,404);assert.equal((await manage(s,r,{cookie:h.cookie},m.profileId,action)).status,403);}
 s.db.prepare('UPDATE community_rooms SET closed_at=? WHERE id=?').run(s.now,r.id);assert.equal((await manage(s,r,h,m.profileId,'evict')).status,403);assert.equal(row(s,r,m).left_at,0);
 }finally{s.close();}
});
for(const change of ['logout','closure','ownership'])test('management rechecks final access after '+change,async()=>{
 const s=await setup();try{const h=await s.user('host'),m=await s.user('member'),r=await s.room(h);await join(s,r,m);const prepare=s.env.DB.prepare.bind(s.env.DB);let changed=false;
 s.env.DB.prepare=sql=>{if(!changed&&sql.startsWith('UPDATE community_members SET banned=CASE')){changed=true;if(change==='logout')s.db.prepare('DELETE FROM sessions WHERE account_id=?').run(h.id);if(change==='closure')s.db.prepare('UPDATE community_rooms SET closed_at=? WHERE id=?').run(s.now,r.id);if(change==='ownership')s.db.prepare('UPDATE community_rooms SET owner_id=? WHERE id=?').run(m.profileId,r.id);}return prepare(sql);};
 assert.equal((await manage(s,r,h,m.profileId,'ban')).status,409);assert.equal(row(s,r,m).banned,0);
 }finally{s.close();}
});
test('members see retained last-study date, while public visitors get no new history metadata',async()=>{
 const s=await setup();try{const h=await s.user('host'),m=await s.user('member'),r=await s.room(h,'public');await join(s,r,m);
 let view=await s.call(base(r),'GET',undefined,h);assert.equal(view.members.find(x=>x.id===m.profileId).last_study_day,null);
 const t=await s.call('/timer/start','POST',{roomId:r.id},m);s.advance(30000);await s.call('/timer/heartbeat','POST',{lease:t.timer.lease},m);
 view=await s.call(base(r),'GET',undefined,h);assert.equal(view.members.find(x=>x.id===m.profileId).last_study_day,new Date(s.now).toISOString().slice(0,10));const anonymous=await s.call(base(r));assert.ok(anonymous.members.every(x=>!Object.hasOwn(x,'last_study_day')));
 assert.equal((await s.call(base(r)+'/leave','POST',{},m)).status,200);assert.equal((await join(s,r,m)).status,200);assert.equal((await s.call(base(r),'GET',undefined,h)).members.find(x=>x.id===m.profileId).total_seconds,30);
 }finally{s.close();}
});
test('removed and blocked members are withdrawn from activities; other members retain their reservations',async()=>{
 const s=await setup();try{const h=await s.user('host'),m=await s.user('member'),r=await s.room(h);await join(s,r,m);const id=crypto.randomUUID();
 const {activityWall}=await import('../src/lib/group-activities.mjs');assert.equal((await s.call(base(r)+'/activities','POST',{id,subject:'maths',kind:'practice',...activityWall(s.now+600000,'UTC'),zone:'UTC',focusMinutes:25,breakMinutes:5},h)).status,201);
 for(const a of [h,m])assert.equal((await s.call(base(r)+'/activities/'+id+'/participation','PUT',{subject:'maths',task:'Practise algebra'},a)).status,200);
 assert.equal((await manage(s,r,h,m.profileId,'evict')).status,200);let d=await s.call(base(r)+'/activities/'+id,'GET',undefined,h);assert.equal(d.summary.reserved,1);assert.ok(d.participants.find(x=>x.profile_id===m.profileId).withdrawn_at);
 }finally{s.close();}
});
