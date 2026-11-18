import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {setupCommunity as setup} from './helpers/community.mjs';
const create=(s,a,id=crypto.randomUUID(),extra={})=>s.call('/rooms','POST',{id,name:'Quiet revision',visibility:'private',capacity:4,goalMinutes:120,...extra},a);
const count=(s,a)=>s.db.prepare('SELECT count(*) n FROM community_rooms WHERE owner_id=? AND closed_at=0').get(a.profileId).n;

test('free accounts own one room and cannot forge subscription rights; retries remain idempotent',async()=>{
 const s=await setup();try{const a=await s.user('owner'),id=crypto.randomUUID();
 assert.deepEqual((await s.call('/me','GET',undefined,a)).roomOwnership,{limit:1,openCount:0});
 assert.equal((await create(s,a,id)).status,201);assert.equal((await create(s,a,id)).status,200);
 for(const extra of [{},{paid:true,maxRooms:99},{roomLimit:99}]){const r=await create(s,a,crypto.randomUUID(),extra);assert.equal(r.status,409);assert.equal(r.error.code,'ROOM_LIMIT');assert.match(r.error.message,/one room/);}
 assert.equal(count(s,a),1);
 assert.deepEqual((await s.call('/me','GET',undefined,a)).roomOwnership,{limit:1,openCount:1});
 }finally{s.close();}
});

test('trusted active subscription grants ten owned rooms and the granted larger capacity',async()=>{
 const s=await setup();try{const a=await s.user('subscriber');s.subscribe(a,{memberLimit:12});
 for(let i=0;i<10;i++){if(i===5)s.advance(86400001);assert.equal((await create(s,a,crypto.randomUUID(),{capacity:12})).status,201);}
 const me=await s.call('/me','GET',undefined,a);assert.deepEqual(me.roomOwnership,{limit:10,openCount:10});assert.equal(me.entitlements.memberLimit,12);
 assert.equal((await create(s,a)).error.code,'ROOM_LIMIT');assert.equal(count(s,a),10);
 }finally{s.close();}
});

test('subscription expiry preserves owned rooms and members, but blocks new rooms until below free allowance',async()=>{
 const s=await setup();try{const a=await s.user('subscriber');s.subscribe(a);await s.room(a);await s.room(a);
 s.db.prepare('UPDATE community_entitlements SET expires_at=? WHERE account_id=?').run(s.now-1,a.id);
 assert.deepEqual((await s.call('/me','GET',undefined,a)).roomOwnership,{limit:1,openCount:2});assert.equal((await create(s,a)).error.code,'ROOM_LIMIT');
 assert.equal(count(s,a),2);assert.equal(s.db.prepare('SELECT count(*) n FROM community_members WHERE profile_id=?').get(a.profileId).n,2);
 s.subscribe(a);assert.equal((await create(s,a)).status,201);
 }finally{s.close();}
});

for(const change of ['revoked','expired'])test('database checks subscription again at insertion when '+change,async()=>{
 const s=await setup();try{const a=await s.user('subscriber');s.subscribe(a);await s.room(a);const prepare=s.env.DB.prepare.bind(s.env.DB);let changed=false;
 s.env.DB.prepare=sql=>{if(!changed&&sql.startsWith('INSERT INTO community_rooms(')){changed=true;if(change==='revoked')s.db.prepare('DELETE FROM community_entitlements WHERE account_id=?').run(a.id);else s.db.prepare('UPDATE community_entitlements SET expires_at=? WHERE account_id=?').run(s.now-1,a.id);}return prepare(sql);};
 assert.equal((await create(s,a)).error.code,'ROOM_LIMIT');assert.equal(count(s,a),1);assert.equal(s.db.prepare('SELECT count(*) n FROM community_members WHERE profile_id=?').get(a.profileId).n,1);
 }finally{s.close();}
});

test('two simultaneous subscriber creates cannot exceed the tenth place',async()=>{
 const s=await setup();try{const a=await s.user('subscriber');s.subscribe(a);await s.room(a);
 for(let i=0;i<8;i++){const id=crypto.randomUUID();s.db.prepare('INSERT INTO community_rooms(id,owner_id,name,visibility,capacity,invite_token,created_at) VALUES(?,?,?,?,?,?,?)').run(id,a.profileId,'Existing subscribed room','private',4,crypto.randomUUID(),s.now);s.db.prepare('INSERT INTO community_members(room_id,profile_id,joined_at) VALUES(?,?,?)').run(id,a.profileId,s.now);}
 const results=await Promise.all([create(s,a),create(s,a)]);assert.deepEqual(results.map(x=>x.status).sort(),[201,409]);assert.equal(count(s,a),10);
 }finally{s.close();}
});

test('simultaneous creates allocate one room and one owner membership',async()=>{
 const s=await setup();try{const a=await s.user('owner'),results=await Promise.all([create(s,a),create(s,a)]);
 assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);assert.equal(count(s,a),1);
 assert.equal(s.db.prepare('SELECT count(*) n FROM community_members WHERE profile_id=?').get(a.profileId).n,1);
 }finally{s.close();}
});

test('joining someone else does not consume ownership; closing frees creation without deleting history',async()=>{
 const s=await setup();try{const a=await s.user('owner'),b=await s.user('partner'),r=await s.room(b),own=await s.room(a);
 assert.equal((await s.call('/rooms/'+r.id+'/join','POST',{accepted:true,code:r.code},a)).status,200);
 const timer=(await s.call('/timer/start','POST',{roomId:own.id},a)).timer;s.advance(5000);await s.call('/timer/pause','POST',{lease:timer.lease},a);
 const close=await s.call('/rooms/'+own.id+'/settings','PATCH',{name:'Quiet revision',capacity:4,goalMinutes:120,invitationsOpen:false,version:1,close:true},a);assert.equal(close.status,200);
 assert.equal((await create(s,a)).status,201);assert.equal(count(s,a),1);
 assert.equal((await s.call('/rooms/'+own.id,'GET',undefined,a)).room.closed,true);
 assert.equal(s.db.prepare('SELECT seconds FROM community_room_daily WHERE room_id=?').get(own.id).seconds,5);
 assert.equal(s.db.prepare('SELECT count(*) n FROM community_members WHERE room_id=?').get(own.id).n,1);
 }finally{s.close();}
});

test('final database guard catches a competing insert after the API count check',async()=>{
 const s=await setup();try{const a=await s.user('owner'),prepare=s.env.DB.prepare.bind(s.env.DB);let raced=false;
 s.env.DB.prepare=sql=>{if(!raced&&sql.startsWith('INSERT INTO community_rooms(')){raced=true;s.db.prepare('INSERT INTO community_rooms(id,owner_id,name,visibility,capacity,invite_token,created_at) VALUES(?,?,?,?,?,?,?)').run(crypto.randomUUID(),a.profileId,'Other tab','private',4,crypto.randomUUID(),s.now);}return prepare(sql);};
 const result=await create(s,a);assert.equal(result.status,409);assert.equal(result.error.code,'ROOM_LIMIT');assert.equal(count(s,a),1);
 assert.equal(s.db.prepare('SELECT count(*) n FROM community_members').get().n,0);
 }finally{s.close();}
});

test('migration keeps three legacy rooms, membership, theme and totals; guards new ownership and reopening',()=>{
 const db=new DatabaseSync(':memory:');try{
 const folder=new URL('../migrations/',import.meta.url),migration='0011_single_owned_room.sql';
 for(const file of fs.readdirSync(folder).filter(f=>f.endsWith('.sql')&&f<migration).sort())db.exec(fs.readFileSync(new URL(file,folder),'utf8'));
 db.exec("INSERT INTO accounts(id,email,created_at) VALUES('a','legacy@example.invalid',1),('b','other@example.invalid',1); INSERT INTO community_profiles(id,account_id,nickname,accepted_at,created_at) VALUES('p','a','Legacy',1,1),('q','b','Other',1,1);");
 const insert=db.prepare('INSERT INTO community_rooms(id,owner_id,name,visibility,capacity,invite_token,created_at) VALUES(?,?,?,?,?,?,?)');
 for(let i=0;i<3;i++){insert.run('r'+i,'p','Legacy '+i,'private',4,'invite'+i,1);db.prepare('INSERT INTO community_members(room_id,profile_id,joined_at) VALUES(?,?,?)').run('r'+i,'p',1);}
 insert.run('other','q','Other','private',4,'other-invite',1);
 db.exec("UPDATE community_rooms SET custom_theme='Legacy theme' WHERE id='r0'; INSERT INTO community_room_daily(profile_id,room_id,day,seconds) VALUES('p','r0','2026-11-17',60);");
 const before=db.prepare('SELECT * FROM community_rooms ORDER BY id').all();db.exec(fs.readFileSync(new URL(migration,folder),'utf8'));
 assert.deepEqual(db.prepare('SELECT * FROM community_rooms ORDER BY id').all(),before);
 assert.equal(db.prepare('SELECT count(*) n FROM community_members').get().n,3);assert.equal(db.prepare('SELECT seconds FROM community_room_daily').get().seconds,60);
 assert.throws(()=>insert.run('new','p','New','private',4,'new-invite',2),/ROOM_LIMIT/);
 assert.throws(()=>db.prepare('UPDATE community_rooms SET owner_id=? WHERE id=?').run('q','r0'),/ROOM_LIMIT/);
 db.exec("UPDATE community_rooms SET name='Still editable' WHERE id='r0'; UPDATE community_rooms SET closed_at=2 WHERE id='r0';");
 assert.throws(()=>db.exec("UPDATE community_rooms SET closed_at=0 WHERE id='r0'"),/ROOM_LIMIT/);
 for(const id of ['r1','r2']){assert.throws(()=>insert.run('new','p','New','private',4,'new-invite',2),/ROOM_LIMIT/);db.prepare('UPDATE community_rooms SET closed_at=2 WHERE id=?').run(id);}
 insert.run('new','p','New','private',4,'new-invite',2);assert.equal(db.prepare("SELECT count(*) n FROM community_rooms WHERE owner_id='p'").get().n,4);
 assert.equal(db.prepare("SELECT custom_theme FROM community_rooms WHERE id='r0'").get().custom_theme,'Legacy theme');assert.equal(db.prepare('PRAGMA foreign_key_check').all().length,0);
 }finally{db.close();}
});
