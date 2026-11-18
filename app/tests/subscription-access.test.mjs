import test from 'node:test';import assert from 'node:assert/strict';
import {setupCommunity as setup,reviewResult} from './helpers/community.mjs';
import {communityMaintenance} from '../server/community.mjs';
import {createAccountsApi} from '../server/accounts.mjs';
const get=(s,r,a)=>s.call('/rooms/'+r.id,'GET',undefined,a);
const send=(s,r,a)=>s.call('/rooms/'+r.id+'/messages','POST',{id:crypto.randomUUID(),templateId:'thanks'},a);
const select=(s,a,r,version=0)=>s.call('/room-access','PATCH',{roomId:r.id,version},a);
const seats=(s,a,r,ids,version)=>s.call('/rooms/'+r.id+'/seats','PATCH',{profileIds:ids,version},a);
const join=(s,r,a)=>s.call('/rooms/'+r.id+'/join','POST',{accepted:true,code:r.code},a);
test('expiry locks extra rooms, cuts timer credit at expiry and retains readable records and safety actions',async()=>{
 const s=await setup();try{const h=await s.user('host'),m=await s.user('member');s.subscribe(h,{memberLimit:8});const first=await s.room(h);s.advance(1000);const extra=await s.room(h,'private',8);await join(s,extra,m);
 const message=await s.call('/rooms/'+extra.id+'/messages','POST',{id:crypto.randomUUID(),templateId:'thanks'},h);assert.equal(message.status,201);
 s.subscribe(h,{memberLimit:8,expiresAt:s.now+20000});const timer=(await s.call('/timer/start','POST',{roomId:extra.id},h)).timer;s.advance(10000);await s.call('/timer/heartbeat','POST',{lease:timer.lease},h);s.advance(20000);
 const beat=await s.call('/timer/heartbeat','POST',{lease:timer.lease},h);assert.equal(beat.timer.status,'paused');assert.equal(beat.timer.credited_seconds,20);assert.equal(s.db.prepare('SELECT seconds FROM community_room_daily WHERE room_id=?').get(extra.id).seconds,20);
 const retained=await get(s,extra,h);assert.equal(retained.access.roomActive,false);assert.equal(retained.member,true);assert.equal(retained.messages.length,1);assert.equal((await get(s,first,h)).access.canParticipate,true);
 assert.equal((await s.call('/timer/start','POST',{roomId:extra.id},h)).error.code,'ROOM_READ_ONLY');assert.equal((await send(s,extra,h)).error.code,'ROOM_READ_ONLY');
 assert.equal((await s.call('/rooms/'+extra.id+'/round','POST',{minutes:25},h)).error.code,'ROOM_READ_ONLY');assert.equal((await join(s,extra,await s.user('guest'))).error.code,'ROOM_READ_ONLY');
 assert.equal((await s.call('/rooms/'+extra.id+'/activities','POST',{id:crypto.randomUUID()},h)).error.code,'ROOM_READ_ONLY');
 assert.equal((await s.call('/rooms/'+extra.id+'/reports','POST',{messageId:message.id,reason:'other'},m)).status,200);
 assert.equal((await s.call('/blocks','POST',{profileId:h.profileId},m)).status,200);assert.equal((await s.call('/rooms/'+extra.id+'/leave','POST',{},m)).status,200);
 const chosen=await select(s,h,extra);assert.equal(chosen.status,200);assert.equal((await get(s,extra,h)).access.canParticipate,true);assert.equal((await get(s,first,h)).access.roomActive,false);
 assert.equal((await select(s,h,first,0)).status,409);assert.equal((await select(s,m,first)).status,403);
 s.subscribe(h,{memberLimit:8});assert.equal((await get(s,first,h)).access.canParticipate,true);assert.equal((await get(s,extra,h)).access.canParticipate,true);
 }finally{s.close();}
});
test('free places include the owner and selected three members; other members stay read only and renew automatically',async()=>{
 const s=await setup();try{const h=await s.user('host');s.subscribe(h,{memberLimit:12});const r=await s.room(h,'private',12),people=[];for(let i=0;i<5;i++){const m=await s.user('member'+i);await join(s,r,m);people.push(m);s.advance(1000);}
 const view=await get(s,r,h),chosen=people.slice(1,4).map(m=>m.profileId);assert.equal((await seats(s,h,r,chosen,view.room.version)).status,200);
 s.db.prepare('UPDATE community_entitlements SET expires_at=? WHERE account_id=?').run(s.now-1,h.id);
 assert.equal((await get(s,r,h)).access.canParticipate,true);
 for(const m of people){const access=(await get(s,r,m)).access.canParticipate;assert.equal(access,chosen.includes(m.profileId));if(!access){assert.equal((await send(s,r,m)).error.code,'ROOM_READ_ONLY');assert.equal((await s.call('/rooms/'+r.id+'/presence','POST',{state:'ready'},m)).error.code,'ROOM_READ_ONLY');}}
 const final=await get(s,r,h);assert.equal(final.members.length,6);assert.equal(final.members.filter(m=>!m.readOnly).length,4);
 assert.equal((await seats(s,people[0],r,[],final.room.version)).status,403);assert.equal((await seats(s,h,r,people.slice(0,4).map(m=>m.profileId),final.room.version)).status,400);
 s.subscribe(h,{memberLimit:12});assert.equal((await get(s,r,h)).members.filter(m=>!m.readOnly).length,6);
 }finally{s.close();}
});
test('an expired reviewed message cannot publish to a now read-only extra room',async()=>{
 let release,started;const ready=new Promise(r=>started=r),s=await setup({reviewFetch:()=>{started();return new Promise(r=>release=r);}});
 try{const h=await s.user('host');s.subscribe(h);await s.room(h);s.advance(1000);const extra=await s.room(h);s.subscribe(h,{expiresAt:s.now+10000});const pending=s.call('/rooms/'+extra.id+'/messages','POST',{id:crypto.randomUUID(),text:'Review algebra.'},h);await ready;s.advance(11000);release(reviewResult());assert.equal((await pending).status,403);assert.equal(s.db.prepare('SELECT count(*) n FROM community_messages').get().n,0);
 }finally{s.close();}
});
test('expiry between invite validation and insertion cannot add a member to a read-only room',async()=>{
 const s=await setup();try{const h=await s.user('host'),m=await s.user('member');s.subscribe(h);await s.room(h);s.advance(1000);const extra=await s.room(h),prepare=s.env.DB.prepare.bind(s.env.DB);let changed=false;
 s.env.DB.prepare=sql=>{if(!changed&&sql.startsWith('INSERT INTO community_members(room_id,profile_id,joined_at) SELECT')){changed=true;s.db.prepare('UPDATE community_entitlements SET expires_at=? WHERE account_id=?').run(s.now-1,h.id);}return prepare(sql);};
 assert.equal((await join(s,extra,m)).status,409);assert.equal(s.db.prepare('SELECT count(*) n FROM community_members WHERE profile_id=?').get(m.profileId).n,0);
 }finally{s.close();}
});
test('free-room preferences are owner scoped, exported and deleted with the account',async()=>{
 const s=await setup();try{const h=await s.user('host'),m=await s.user('other'),r=await s.room(h);assert.equal((await select(s,h,r)).status,200);
 assert.equal((await s.call('/room-access','PATCH',{roomId:r.id,version:0},{cookie:h.cookie})).status,403);assert.equal((await select(s,m,r)).status,403);
 const api=createAccountsApi({now:()=>s.now}),response=await api(new Request('https://study.test/api/account/export',{headers:{cookie:h.cookie}}),s.env,true);assert.equal(response.status,200);assert.equal((await response.json()).community.roomAccessPreference.free_room_id,r.id);
 s.db.prepare('DELETE FROM accounts WHERE id=?').run(h.id);assert.equal(s.db.prepare('SELECT count(*) n FROM community_room_preferences').get().n,0);
 }finally{s.close();}
});
test('maintenance settles at expiry and renewal cannot backfill an expired timer interval',async()=>{
 const s=await setup();try{const h=await s.user('host');s.subscribe(h);await s.room(h);s.advance(1000);const extra=await s.room(h);s.subscribe(h,{expiresAt:s.now+10000});const t=(await s.call('/timer/start','POST',{roomId:extra.id},h)).timer;
 assert.equal(t.check_at,s.now+10000);s.advance(15000);await communityMaintenance(s.env,s.now);assert.equal(s.db.prepare('SELECT status FROM community_timers').get().status,'paused');assert.equal(s.db.prepare('SELECT seconds FROM community_room_daily WHERE room_id=?').get(extra.id).seconds,10);
 s.subscribe(h);s.advance(10000);await s.call('/timer/heartbeat','POST',{lease:t.lease},h);assert.equal(s.db.prepare('SELECT seconds FROM community_room_daily WHERE room_id=?').get(extra.id).seconds,10);
 }finally{s.close();}
});
test('revocation at final credit insertion cannot inflate either ledger or session counter',async()=>{
 const s=await setup();try{const h=await s.user('host');s.subscribe(h);await s.room(h);s.advance(1000);const extra=await s.room(h),t=(await s.call('/timer/start','POST',{roomId:extra.id},h)).timer;s.advance(10000);
 const prepare=s.env.DB.prepare.bind(s.env.DB);let changed=false;s.env.DB.prepare=sql=>{if(!changed&&sql.startsWith('INSERT INTO community_credits(')){changed=true;s.db.prepare('DELETE FROM community_entitlements WHERE account_id=?').run(h.id);}return prepare(sql);};
 const beat=await s.call('/timer/heartbeat','POST',{lease:t.lease},h);assert.equal(beat.timer.status,'paused');assert.equal(beat.timer.credited_seconds,0);assert.equal(s.db.prepare('SELECT count(*) n FROM community_credits').get().n,0);
 }finally{s.close();}
});
for(const capacity of [8,12,24])test('active owner subscription supports '+capacity+' participating places, reverting to four after expiry',async()=>{
 const s=await setup();try{const h=await s.user('host');s.subscribe(h,{memberLimit:capacity});const r=await s.room(h,'private',capacity);
 for(let i=1;i<capacity;i++)assert.equal((await join(s,r,await s.user('member'+i))).status,200);
 const active=await get(s,r,h);assert.equal(active.access.memberLimit,capacity);assert.equal(active.members.filter(m=>!m.readOnly).length,capacity);
 s.db.prepare('UPDATE community_entitlements SET expires_at=? WHERE account_id=?').run(s.now-1,h.id);const expired=await get(s,r,h);assert.equal(expired.members.length,capacity);assert.equal(expired.members.filter(m=>!m.readOnly).length,4);
 }finally{s.close();}
});
