import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import {learningFeatures} from '../server/learning-features.mjs';
import {digest} from '../server/auth-shared.mjs';
import {createAccountsApi} from '../server/accounts.mjs';
import {emptyState,transition} from '../src/lib/model.mjs';
import {backupOf} from '../src/lib/storage.mjs';
import {planningFingerprint} from '../src/lib/planning-engine.mjs';
const at=Date.UTC(2026,10,18,12),token='a'.repeat(64),secret='synthetic-learning-test-secret-not-a-real-credential';
function setup(){
 const db=new DatabaseSync(':memory:');for(const f of fs.readdirSync(new URL('../migrations/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort())db.exec(fs.readFileSync(new URL('../migrations/'+f,import.meta.url),'utf8'));
 const DB={prepare(sql){return {bind(...v){return {first:async()=>db.prepare(sql).get(...v)||null,all:async()=>({results:db.prepare(sql).all(...v)}),run:async()=>({meta:db.prepare(sql).run(...v)})};}};},batch:async statements=>{db.exec('BEGIN');try{const r=[];for(const s of statements)r.push(await s.run());db.exec('COMMIT');return r;}catch(e){db.exec('ROLLBACK');throw e;}}};
 return {db,env:{DB,AUTH_HMAC:secret}};
}
const req=(patch={})=>new Request('https://study.test/api/learning/features',{headers:patch,...{}});
test('public free preview works without account, is no-store/noindex and supports a fixed expiry',async()=>{
 const response=await learningFeatures(req(),{}, {advancedAnalyticsPreview:true},at);assert.equal((await response.json()).analytics.source,'preview');assert.match(response.headers.get('Cache-Control'),/no-store/);assert.match(response.headers.get('X-Robots-Tag'),/noindex/);
 const expired=await learningFeatures(req(),{}, {advancedAnalyticsPreview:true,advancedAnalyticsPreviewEndsAt:at-1},at);assert.equal((await expired.json()).analytics.allowed,false);
});
test('subscription access follows the authenticated account and both session and grant expiry',async()=>{
 const s=setup();try{s.db.prepare('INSERT INTO accounts(id,email,created_at) VALUES(?,?,?)').run('a','a@example.invalid',at);s.db.prepare('INSERT INTO accounts(id,email,created_at) VALUES(?,?,?)').run('b','b@example.invalid',at);s.db.prepare('INSERT INTO sessions(token_hash,account_id,expires_at) VALUES(?,?,?)').run(await digest(token),'a',at+1000);s.db.prepare('INSERT INTO community_entitlements(account_id,member_limit,free_text,expires_at,updated_at) VALUES(?,?,?,?,?)').run('b',12,0,at+10000,at);
  const request=req({cookie:'__Host-studytimely-session='+token}),config={accountsEnabled:true,advancedAnalyticsPreview:false};assert.equal((await(await learningFeatures(request,s.env,config,at)).json()).analytics.allowed,false);
  s.db.prepare('INSERT INTO community_entitlements(account_id,member_limit,free_text,expires_at,updated_at) VALUES(?,?,?,?,?)').run('a',8,0,at+500,at);assert.equal((await(await learningFeatures(request,s.env,config,at)).json()).analytics.source,'subscription');assert.equal((await(await learningFeatures(request,s.env,config,at+500)).json()).analytics.allowed,false);
  s.db.prepare('UPDATE community_entitlements SET expires_at=? WHERE account_id=?').run(at+10000,'a');assert.equal((await(await learningFeatures(request,s.env,config,at+1000)).json()).analytics.allowed,false);
 }finally{s.db.close();}
});
test('feature discovery is read-only and refuses cross-site browser requests',async()=>{
 assert.equal((await learningFeatures(new Request('https://study.test/api/learning/features',{method:'POST'}),{}, {},at)).status,405);
 assert.equal((await learningFeatures(req({'sec-fetch-site':'cross-site'}),{}, {},at)).status,403);
});
test('older cloud clients cannot erase planning evidence, and the stored workspace is preserved',async()=>{
 const s=setup();try{s.db.prepare('INSERT INTO accounts(id,email,created_at) VALUES(?,?,?)').run('a','a@example.invalid',at);s.db.prepare('INSERT INTO sessions(token_hash,account_id,expires_at) VALUES(?,?,?)').run(await digest(token),'a',at+10000);
  const api=createAccountsApi({now:()=>at}),cookie='__Host-studytimely-session='+token,call=(path,method='GET',data,csrf='')=>api(new Request('https://study.test'+path,{method,headers:{origin:'https://study.test',cookie,'x-csrf-token':csrf,'content-type':'application/json'},body:data?JSON.stringify(data):undefined}),s.env);
  const auth=await(await call('/api/auth/me')).json();let state=emptyState('a');state=transition(state,{type:'task-save',epoch:'a',title:'Private task',estimateMinutes:25},{id:'task',now:at,owner:'local'}).state;const document=backupOf(state);
  assert.equal((await call('/api/workspace','PUT',{version:0,document},auth.csrf)).status,200);const old=structuredClone(document);delete old.workspace.learning;
  const rejected=await call('/api/workspace','PUT',{version:1,document:old},auth.csrf);assert.equal(rejected.status,400);assert.equal((await rejected.json()).error.code,'UPDATE_REQUIRED');const saved=await(await call('/api/workspace')).json();assert.equal(saved.document.workspace.learning.events.length,document.workspace.learning.events.length);
 }finally{s.db.close();}
});

test('older clients cannot strip advanced goals from the cloud snapshot',async()=>{
 const s=setup();try{s.db.prepare('INSERT INTO accounts(id,email,created_at) VALUES(?,?,?)').run('a','a@example.invalid',at);s.db.prepare('INSERT INTO sessions(token_hash,account_id,expires_at) VALUES(?,?,?)').run(await digest(token),'a',at+10000);
  const api=createAccountsApi({now:()=>at}),cookie='__Host-studytimely-session='+token,call=(path,method='GET',data,csrf='')=>api(new Request('https://study.test'+path,{method,headers:{origin:'https://study.test',cookie,'x-csrf-token':csrf,'content-type':'application/json'},body:data?JSON.stringify(data):undefined}),s.env);
  const auth=await(await call('/api/auth/me')).json();let state=emptyState('a');state=transition(state,{type:'planning-goal',epoch:'a',expectedRevision:0,title:'Private goal',deadline:'2026-12-01',kind:'custom'},{id:'task',now:at,owner:'local'}).state;const document=backupOf(state);
  assert.equal((await call('/api/workspace','PUT',{version:0,document},auth.csrf)).status,200);const old=structuredClone(document);delete old.workspace.planning;
  const rejected=await call('/api/workspace','PUT',{version:1,document:old},auth.csrf);assert.equal(rejected.status,400);assert.equal((await rejected.json()).error.code,'UPDATE_REQUIRED');const saved=await(await call('/api/workspace')).json();assert.equal(saved.document.workspace.planning.goals.length,document.workspace.planning.goals.length);
 }finally{s.db.close();}
});

test('planning preview has its own policy, expires correctly and shares trusted subscription access',async()=>{const response=await learningFeatures(req(),{}, {advancedPlanningPreview:true},at);const data=await response.json();assert.equal(data.planning.source,'preview');assert.equal(data.analytics.allowed,false);const expired=await learningFeatures(req(),{}, {advancedPlanningPreview:true,advancedPlanningPreviewEndsAt:at-1},at);assert.equal((await expired.json()).planning.allowed,false);});

test('an older cloud client cannot downgrade a saved exam preparation to the basic planning format',async()=>{
 const s=setup();try{s.db.prepare('INSERT INTO accounts(id,email,created_at) VALUES(?,?,?)').run('a','a@example.invalid',at);s.db.prepare('INSERT INTO sessions(token_hash,account_id,expires_at) VALUES(?,?,?)').run(await digest(token),'a',at+10000);
  const api=createAccountsApi({now:()=>at}),cookie='__Host-studytimely-session='+token,call=(path,method='GET',data,csrf='')=>api(new Request('https://study.test'+path,{method,headers:{origin:'https://study.test',cookie,'x-csrf-token':csrf,'content-type':'application/json'},body:data?JSON.stringify(data):undefined}),s.env),auth=await(await call('/api/auth/me')).json();let state=emptyState('a');
  state=transition(state,{type:'planning-preparation',epoch:'a',expectedRevision:0,basis:planningFingerprint(state),draftId:'prep',draft:{exam:{title:'Private exam',date:'2026-12-02'},topics:[{title:'Private topic',minutes:30,confidence:'new'}],rounds:1,gapDays:2,mockMinutes:0,importance:'normal'},apply:false},{now:at,id:'create',owner:'test'}).state;
  const document=backupOf(state);assert.equal((await call('/api/workspace','PUT',{version:0,document},auth.csrf)).status,200);const old=structuredClone(document);old.workspace.planning.version=1;old.workspace.planning.examPlans=[];old.workspace.planning.rules.forEach(r=>delete r.prep);
  const rejected=await call('/api/workspace','PUT',{version:1,document:old},auth.csrf);assert.equal(rejected.status,400);assert.equal((await rejected.json()).error.code,'UPDATE_REQUIRED');assert.equal((await(await call('/api/workspace')).json()).document.workspace.planning.examPlans[0].topics[0].title,'Private topic');
 }finally{s.db.close();}
});
