import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createSandboxAccess,signSandboxAccess,verifySandboxAccess} from '../server/billing-sandbox-access.mjs';
import {createBillingSandboxSite} from '../server/billing-sandbox-site-worker.mjs';
import {identity} from '../server/auth-shared.mjs';
const origin='https://payment-test.example.invalid',at=Date.now(),secret='only-a-unit-test-secret-of-sufficient-length';
function setup(){
 const db=new DatabaseSync(':memory:');for(const f of fs.readdirSync(new URL('../migrations/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync(new URL('../migrations/'+f,import.meta.url),'utf8'));
 const DB={prepare(sql){return {bind(...args){return {first:async()=>db.prepare(sql).get(...args)||null,run:async()=>db.prepare(sql).run(...args)}}}}};
 const env={DB,AUTH_HMAC:secret,BILLING_ENABLED:'true',BILLING_ENV:'test',BILLING_TEST_ISOLATED:'true',BILLING_ORIGIN:origin,SANDBOX_SITE_ENABLED:'true',STRIPE_SECRET_KEY:'sk_test_synthetic',STRIPE_PRICE_PLUS_MONTHLY:'price_m',STRIPE_PRICE_PLUS_ANNUAL:'price_y',STRIPE_WEBHOOK_SECRET:'whsec_synthetic'};
 const payload={purpose:'payment-sandbox-access',origin,id:'sandbox-'+crypto.randomUUID(),email:'payment-monthly@studytimely.invalid',issuedAt:at-1000,expiresAt:at+86400000};
 const access=createSandboxAccess({now:()=>at});
 const post=(code,headers={})=>access(new Request(origin+'/sandbox/sign-in',{method:'POST',headers:{origin,'content-type':'application/x-www-form-urlencoded','cf-connecting-ip':'127.0.0.1',...headers},body:new URLSearchParams({code})}),env);
 return {db,env,payload,access,post};
}
test('private signed access issues a normal secure expiring session without Plus or invented Google acceptance',async()=>{
 const {db,env,payload,post,access}=setup();assert.equal((await access(new Request(origin+'/sandbox/sign-in'),env)).headers.get('referrer-policy'),'same-origin');const code=await signSandboxAccess(payload,secret),r=await post(code);
 assert.equal(r.status,303);assert.equal(r.headers.get('location'),'/pricing');const set=r.headers.get('set-cookie');assert.match(set,/HttpOnly; SameSite=Lax; Max-Age=28800; Secure/);
 const user=await identity(new Request(origin+'/api/auth/me',{headers:{cookie:set.split(';')[0]}}),env,at);
 assert.equal(user.id,payload.id);assert.equal(user.google_sub,null);assert.equal(user.policy_accepted_at,null);assert.equal(db.prepare('SELECT count(*) n FROM billing_grants').get().n,0);
 await assert.rejects(()=>identity(new Request(origin+'/api/billing/checkout',{method:'POST',headers:{origin,cookie:set.split(';')[0]}}),env,at),e=>e.code==='CSRF');
});
test('tampered, expired, wrong-origin and unissued credentials cannot create accounts',async()=>{
 const {db,env,payload,post}=setup();
 for(const code of ['bad',await signSandboxAccess({...payload,expiresAt:at},secret),await signSandboxAccess({...payload,origin:'https://other.invalid'},secret),await signSandboxAccess(payload,'different-secret')])assert.equal((await post(code)).status,401);
 assert.equal(db.prepare('SELECT count(*) n FROM accounts').get().n,0);
});
test('access is isolated, no cross-site forms, rate-limited and never accepts live keys',async()=>{
 const {env,payload,post,access}=setup(),code=await signSandboxAccess(payload,secret);
 assert.equal((await post(code,{origin:'https://evil.invalid'})).status,403);
 for(const changed of [{SANDBOX_SITE_ENABLED:'false'},{STRIPE_SECRET_KEY:'sk_live_synthetic'},{BILLING_ORIGIN:'https://other.invalid'}])assert.equal((await access(new Request(origin+'/sandbox/sign-in'),{...env,...changed})).status,403);
 assert.equal((await access(new Request('https://studytimely.com/sandbox/sign-in'),{...env,BILLING_ORIGIN:'https://studytimely.com'})).status,403);
 for(let i=0;i<8;i++)assert.equal((await post('invalid')).status,401);assert.equal((await post(code)).status,429);
});
test('site wrapper disables previews and AI, preserves webhook, blocks fixture routes and noindexes pages',async()=>{
 const {env}=setup();let seen;
 const worker=createBillingSandboxSite({siteFactory:config=>({fetch:async(req,e)=>{seen={config,env:e};return new Response('site');}}),receiver:{fetch:async()=>new Response('receiver')}});
 assert.equal(await(await worker.fetch(new Request(origin+'/health'),env)).text(),'receiver');
 const r=await worker.fetch(new Request(origin+'/pricing'),env);assert.equal(await r.text(),'site');assert.match(r.headers.get('x-robots-tag'),/noindex/);assert.equal(seen.config.advancedLibraryPreview,false);assert.equal(seen.config.communityEnabled,false);assert.equal(seen.env.AI_WEEKLY_ENABLED,'false');assert.equal(seen.env.SYNC_REQUIRE_PLUS,'true');
 assert.equal((await worker.fetch(new Request(origin+'/__test/enter'),env)).status,404);
});
