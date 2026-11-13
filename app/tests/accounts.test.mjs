import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import {createAccountsApi,MAX_SYNC_BYTES} from '../server/accounts.mjs';
import {emptyState} from '../src/lib/model.mjs';
import {backupOf} from '../src/lib/storage.mjs';
function setup(){
 const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync(new URL('../migrations/0001_accounts.sql',import.meta.url),'utf8'));
 const DB={prepare(sql){return{bind(...values){return{async first(){return db.prepare(sql).get(...values)||null;},async run(){return {meta:db.prepare(sql).run(...values)};}};}};},async batch(statements){db.exec('BEGIN');try{const out=[];for(const s of statements)out.push(await s.run());db.exec('COMMIT');return out;}catch(e){db.exec('ROLLBACK');throw e;}}};
 let at=Date.UTC(2026,10,13,12),sent=[];const env={DB,AUTH_HMAC:'synthetic-local-test-secret-not-a-production-key',EMAIL:{async send(message){sent.push(message);}}};
 const api=createAccountsApi({now:()=>at,makeCode:()=>'123456'});
 const call=(path,method='GET',body,cookie='',csrf='',extra={})=>api(new Request('https://study.test'+path,{method,headers:{origin:'https://study.test','content-type':'application/json',cookie,'x-csrf-token':csrf,...extra},body:body===undefined?undefined:JSON.stringify(body)}),env);
 const login=async(address='qa@example.invalid')=>{assert.equal((await call('/api/auth/request-code','POST',{email:address,accepted:true})).status,202);const r=await call('/api/auth/verify-code','POST',{email:address,code:'123456'});assert.equal(r.status,200);return{cookie:r.headers.get('set-cookie').split(';')[0],csrf:(await r.json()).csrf};};
 return{db,env,sent,call,login,advance:n=>at+=n,close:()=>db.close()};
}
test('OTP is one-use, expires, and session tokens are only hashed in SQL',async()=>{
 const s=setup();try{const auth=await s.login();assert.ok(auth.cookie.startsWith('__Host-'));assert.equal((await s.call('/api/auth/verify-code','POST',{email:'qa@example.invalid',code:'123456'})).status,400);const raw=auth.cookie.split('=')[1];assert.notEqual(s.db.prepare('SELECT token_hash FROM sessions').get().token_hash,raw);const me=await(await s.call('/api/auth/me','GET',undefined,auth.cookie)).json();assert.equal(me.user.email,'qa@example.invalid');s.advance(31*86400000);assert.equal((await(await s.call('/api/auth/me','GET',undefined,auth.cookie)).json()).user,null);}finally{s.close();}
});
test('wrong codes stop after five attempts and expired codes cannot sign in',async()=>{
 const s=setup();try{await s.call('/api/auth/request-code','POST',{email:'bad@example.invalid',accepted:true});for(let i=0;i<5;i++)assert.equal((await s.call('/api/auth/verify-code','POST',{email:'bad@example.invalid',code:'999999'})).status,400);assert.equal((await s.call('/api/auth/verify-code','POST',{email:'bad@example.invalid',code:'123456'})).status,400);s.advance(61000);await s.call('/api/auth/request-code','POST',{email:'expire@example.invalid',accepted:true});s.advance(601000);assert.equal((await s.call('/api/auth/verify-code','POST',{email:'expire@example.invalid',code:'123456'})).status,400);}finally{s.close();}
});
test('concurrent code requests reserve one delivery and both email/IP limits apply',async()=>{
 const s=setup();try{const requests=await Promise.all([1,2].map(()=>s.call('/api/auth/request-code','POST',{email:'qa@example.invalid',accepted:true})));assert.deepEqual(requests.map(r=>r.status).sort(),[202,429]);assert.equal(s.sent.length,1);for(let i=0;i<3;i++){s.advance(61000);await s.call('/api/auth/request-code','POST',{email:'qa@example.invalid',accepted:true});}assert.equal((await s.call('/api/auth/request-code','POST',{email:'qa@example.invalid',accepted:true})).status,429);}finally{s.close();}
});
test('cloud writes require a live session, same origin, CSRF and a matching version',async()=>{
 const s=setup();try{const auth=await s.login(),document=backupOf(emptyState('local'));assert.equal((await s.call('/api/workspace')).status,401);assert.equal((await s.call('/api/workspace','PUT',{version:0,document},auth.cookie,'')).status,403);assert.equal((await s.call('/api/workspace','PUT',{version:0,document},auth.cookie,auth.csrf,{origin:'https://evil.test'})).status,403);assert.equal((await s.call('/api/workspace','PUT',{version:0,document},auth.cookie,auth.csrf)).status,200);assert.equal((await s.call('/api/workspace','PUT',{version:0,document},auth.cookie,auth.csrf)).status,409);const second=await s.login('other@example.invalid');assert.equal((await(await s.call('/api/workspace','GET',undefined,second.cookie)).json()).document,null);assert.equal((await s.call('/api/workspace','PUT',{version:0,document:{...document,app:'Wrong'}},second.cookie,second.csrf)).status,400);}finally{s.close();}
});
test('concurrent cloud CAS writers cannot lose an update; clear advances the version',async()=>{
 const s=setup();try{const a=await s.login(),document=backupOf(emptyState('e'));await s.call('/api/workspace','PUT',{version:0,document},a.cookie,a.csrf);const writes=await Promise.all([1,2].map(()=>s.call('/api/workspace','PUT',{version:1,document},a.cookie,a.csrf)));assert.deepEqual(writes.map(r=>r.status).sort(),[200,409]);const deleted=await s.call('/api/workspace','DELETE',{version:2},a.cookie,a.csrf);assert.equal(deleted.status,200);assert.equal((await(await s.call('/api/workspace','GET',undefined,a.cookie)).json()).version,3);assert.equal((await s.call('/api/workspace','PUT',{version:1,document},a.cookie,a.csrf)).status,409);}finally{s.close();}
});
test('logout revokes the token, account deletion cascades cloud data and all sessions',async()=>{
 const s=setup();try{const a=await s.login();await s.call('/api/workspace','PUT',{version:0,document:backupOf(emptyState('e'))},a.cookie,a.csrf);assert.equal((await s.call('/api/account','DELETE',{confirm:'no'},a.cookie,a.csrf)).status,400);assert.equal((await s.call('/api/account','DELETE',{confirm:'DELETE'},a.cookie,a.csrf)).status,200);assert.equal(s.db.prepare('SELECT count(*) n FROM sessions').get().n,0);assert.equal(s.db.prepare('SELECT count(*) n FROM workspaces').get().n,0);assert.equal((await s.call('/api/workspace','GET',undefined,a.cookie)).status,401);const b=await s.login('logout@example.invalid');await s.call('/api/auth/logout','POST',{},b.cookie,b.csrf);assert.equal((await s.call('/api/workspace','GET',undefined,b.cookie)).status,401);}finally{s.close();}
});
test('oversized bodies, cross-site auth and missing acceptance do not create usable credentials',async()=>{
 const s=setup();try{assert.equal((await s.call('/api/auth/request-code','POST',{email:'qa@example.invalid',accepted:false})).status,400);assert.equal((await s.call('/api/auth/request-code','POST',{email:'qa@example.invalid',accepted:true},'','',{origin:'https://evil.test'})).status,403);assert.equal(s.sent.length,0);const a=await s.login();assert.equal((await s.call('/api/workspace','PUT',{version:0,document:'x'.repeat(MAX_SYNC_BYTES+5000)},a.cookie,a.csrf)).status,413);assert.equal((await s.call('/api/account/export','GET',undefined,a.cookie)).headers.get('cache-control'),'no-store, private');}finally{s.close();}
});
