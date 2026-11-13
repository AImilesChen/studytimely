import test from 'node:test';
import assert from 'node:assert/strict';
import {testDatabase} from './helpers/d1.mjs';
import {createGoogleAuth,verifyGoogleIdToken} from '../server/google-auth.mjs';
import {issueSession} from '../server/auth-shared.mjs';
import {ACCOUNT_POLICY_VERSION} from '../src/lib/account-policy.mjs';
const encode=data=>Buffer.from(typeof data==='string'?data:JSON.stringify(data)).toString('base64url');
const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk={...await crypto.subtle.exportKey('jwk',pair.publicKey),kid:'synthetic-google-test',use:'sig'};
const at=Date.UTC(2026,10,13,12);
async function jwt(claims){const data=encode({alg:'RS256',kid:jwk.kid})+'.'+encode({iss:'https://accounts.google.com',aud:'synthetic-client.apps.googleusercontent.com',sub:'synthetic-subject',email:'google@example.invalid',email_verified:true,iat:at/1000,exp:at/1000+3600,nonce:'fixture-nonce',...claims});const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(data));return data+'.'+Buffer.from(signature).toString('base64url');}
async function setup(exchangeResult){const db=testDatabase(),env={DB:db.DB,AUTH_HMAC:'synthetic-auth-secret-only-for-unit-tests',GOOGLE_CLIENT_ID:'synthetic-client.apps.googleusercontent.com',GOOGLE_CLIENT_SECRET:'synthetic-client-secret-not-production'};let clock=at,claims={},exchange=null,nonce='';
 const api=createGoogleAuth({now:()=>clock,keys:[jwk],fetcher:async(url,options)=>{assert.equal(url,'https://oauth2.googleapis.com/token');exchange=new URLSearchParams(options.body);if(exchangeResult)return exchangeResult();return Response.json({id_token:await jwt({nonce,...claims})});}});
 const call=(path,method='GET',data,cookie='',csrf='',extra={})=>api(new Request('https://study.test'+path,{method,headers:{origin:'https://study.test','content-type':'application/json',cookie,'x-csrf-token':csrf,...extra},body:data?JSON.stringify(data):undefined}),env);
 async function start(data={},auth={}){const r=await call('/api/auth/google/start','POST',data,auth.cookie,auth.csrf);assert.equal(r.status,200,JSON.stringify(await r.clone().json()));const url=new URL((await r.json()).url);nonce=url.searchParams.get('nonce');return {url,binder:r.headers.get('set-cookie').split(';')[0]};}
 async function callback(flow,auth={}){return call('/api/auth/google/callback?state='+flow.url.searchParams.get('state')+'&code=synthetic-code','GET',undefined,[flow.binder,auth.cookie].filter(Boolean).join('; '));}
 return{...db,env,call,start,callback,setClaims:v=>claims=v,advance:v=>clock+=v,get exchange(){return exchange;}};
}
test('Google ID tokens require a valid signature, audience, issuer, nonce, expiry and verified email',async()=>{
 const options={clientId:'synthetic-client.apps.googleusercontent.com',nonce:'fixture-nonce',now:at,keys:[jwk]};assert.equal((await verifyGoogleIdToken(await jwt({}),options)).sub,'synthetic-subject');
 for(const claims of [{aud:'other-client'},{iss:'https://evil.test'},{nonce:'wrong'},{exp:at/1000-1},{email_verified:false},{iat:at/1000+300}])await assert.rejects(verifyGoogleIdToken(await jwt(claims),options));
 const token=await jwt({});await assert.rejects(verifyGoogleIdToken(token.slice(0,-12)+'tampered',options));
});
test('Google authorization code uses PKCE, browser-bound one-time state and a private session cookie',async()=>{
 const s=await setup();try{const flow=await s.start({accepted:true,returnTo:'/study-groups'}),stored=s.db.prepare('SELECT * FROM oauth_states').get();assert.equal(flow.url.origin,'https://accounts.google.com');assert.equal(flow.url.searchParams.get('scope'),'openid email');assert.equal(flow.url.searchParams.get('code_challenge_method'),'S256');assert.notEqual(stored.state_hash,flow.url.searchParams.get('state'));
 const denied=await s.call('/api/auth/google/callback?state='+flow.url.searchParams.get('state')+'&code=x');assert.match(denied.headers.get('location'),/expired$/);assert.equal(s.db.prepare('SELECT count(*) n FROM oauth_states').get().n,1);
 const response=await s.callback(flow);assert.equal(response.status,303);assert.equal(response.headers.get('location'),'https://study.test/account?signin=register');assert.ok(response.headers.getSetCookie().some(c=>c.startsWith('__Host-studytimely-registration=')&&c.includes('HttpOnly')&&c.includes('Secure')));assert.ok(!response.headers.getSetCookie().some(c=>c.startsWith('__Host-studytimely-session=')));assert.equal(s.db.prepare('SELECT count(*) n FROM accounts').get().n,0);assert.equal(s.exchange.get('code_verifier'),stored.verifier);assert.equal(s.db.prepare('SELECT count(*) n FROM oauth_states').get().n,0);assert.match((await s.callback(flow)).headers.get('location'),/expired$/);
 }finally{s.close();}
});
test('Google does not merge an existing account merely because the email matches',async()=>{
 const s=await setup();try{s.db.prepare('INSERT INTO accounts(id,email,created_at) VALUES(?,?,?)').run('legacy','google@example.invalid',at);const flow=await s.start();assert.match((await s.callback(flow)).headers.get('location'),/link_required$/);assert.equal(s.db.prepare('SELECT google_sub FROM accounts').get().google_sub,null);assert.equal(s.db.prepare('SELECT count(*) n FROM sessions').get().n,0);}finally{s.close();}
});
test('explicit same-email linking requires the old session and CSRF, preserving cloud data',async()=>{
 const s=await setup();try{s.db.prepare('INSERT INTO accounts(id,email,created_at) VALUES(?,?,?)').run('legacy','google@example.invalid',at);s.db.prepare('INSERT INTO workspaces VALUES(?,?,?,?)').run('legacy',1,'{"fixture":true}',at);const session=await issueSession(new Request('https://study.test'),s.env,{id:'legacy'},at),auth={cookie:session.cookie.split(';')[0],csrf:session.csrf};
 assert.equal((await s.call('/api/auth/google/start','POST',{accepted:true,link:true},auth.cookie)).status,403);const flow=await s.start({accepted:true,link:true},auth);assert.match((await s.callback(flow,auth)).headers.get('location'),/success$/);assert.equal(s.db.prepare('SELECT google_sub FROM accounts WHERE id=?').get('legacy').google_sub,'synthetic-subject');assert.equal(s.db.prepare('SELECT document FROM workspaces').get().document,'{"fixture":true}');
 }finally{s.close();}
});
test('expired, cancelled and wrong-nonce flows never create an account; arbitrary return URLs are ignored',async()=>{
 const s=await setup();try{let f=await s.start({accepted:true,returnTo:'https://evil.test'});s.advance(601000);assert.match((await s.callback(f)).headers.get('location'),/expired$/);assert.equal(s.db.prepare('SELECT count(*) n FROM accounts').get().n,0);s.advance(-601000);f=await s.start();s.setClaims({nonce:'wrong'});assert.match((await s.callback(f)).headers.get('location'),/verification_failed$/);assert.equal(s.db.prepare('SELECT count(*) n FROM accounts').get().n,0);
 f=await s.start();const r=await s.call('/api/auth/google/callback?state='+f.url.searchParams.get('state')+'&error=access_denied','GET',undefined,f.binder);assert.match(r.headers.get('location'),/cancelled$/);assert.equal(s.db.prepare('SELECT count(*) n FROM sessions').get().n,0);
 }finally{s.close();}
});

async function newSignup(s){const response=await s.callback(await s.start()),cookie=response.headers.getSetCookie().find(c=>c.startsWith('__Host-studytimely-registration=')).split(';')[0],read=await s.call('/api/auth/google/registration','GET',undefined,cookie);assert.equal(read.status,200);return{cookie,...await read.json()};}
test('new accounts require one-time confirmation; existing Google accounts sign in without repeating it',async()=>{
 const s=await setup();try{const form=await newSignup(s);assert.equal(form.pending.minimumAge,16);assert.equal(s.db.prepare('SELECT count(*) n FROM accounts').get().n,0);assert.equal(s.db.prepare('SELECT count(*) n FROM sessions').get().n,0);
 const stored=s.db.prepare('SELECT token_hash FROM pending_google_registrations').get();assert.notEqual(stored.token_hash,form.cookie.split('=')[1]);
 const done=await s.call('/api/auth/google/registration','POST',{accepted:true,policyVersion:form.pending.policyVersion},form.cookie,form.csrf);assert.equal(done.status,200,JSON.stringify(await done.clone().json()));assert.equal((await done.json()).redirect,'/account?signin=success');assert.ok(done.headers.getSetCookie().some(c=>c.startsWith('__Host-studytimely-session=')&&c.includes('Secure')&&c.includes('HttpOnly')));
 assert.deepEqual({...s.db.prepare('SELECT policy_accepted_at,policy_version FROM accounts').get()},{policy_accepted_at:at,policy_version:ACCOUNT_POLICY_VERSION});assert.equal(s.db.prepare('SELECT count(*) n FROM pending_google_registrations').get().n,0);
 const again=await s.callback(await s.start({}));assert.match(again.headers.get('location'),/signin=success$/);assert.ok(again.headers.getSetCookie().some(c=>c.startsWith('__Host-studytimely-session=')));assert.equal(s.db.prepare('SELECT count(*) n FROM accounts').get().n,1);assert.equal(s.db.prepare('SELECT policy_accepted_at FROM accounts').get().policy_accepted_at,at);
 }finally{s.close();}});
test('registration proof requires its browser, CSRF, explicit acceptance and current policy before issuing an account',async()=>{
 const s=await setup();try{const form=await newSignup(s),input={accepted:true,policyVersion:ACCOUNT_POLICY_VERSION};assert.equal((await(await s.call('/api/auth/google/registration')).json()).pending,null);
 assert.equal((await s.call('/api/auth/google/registration','POST',input,'',form.csrf)).status,410);assert.equal((await s.call('/api/auth/google/registration','POST',input,form.cookie,'wrong')).status,403);assert.equal((await s.call('/api/auth/google/registration','POST',input,form.cookie,form.csrf,{origin:'https://evil.test'})).status,403);
 assert.equal((await s.call('/api/auth/google/registration','POST',{...input,accepted:false},form.cookie,form.csrf)).status,400);assert.equal((await s.call('/api/auth/google/registration','POST',{...input,policyVersion:'old'},form.cookie,form.csrf)).status,409);assert.equal(s.db.prepare('SELECT count(*) n FROM accounts').get().n,0);assert.equal(s.db.prepare('SELECT count(*) n FROM sessions').get().n,0);
 const response=await s.call('/api/auth/google/registration','POST',input,form.cookie,form.csrf);assert.equal(response.status,200);assert.equal((await s.call('/api/auth/google/registration','POST',input,form.cookie,form.csrf)).status,410);
 }finally{s.close();}});
test('expired or cancelled first-registration proofs never create an account',async()=>{
 const s=await setup();try{const form=await newSignup(s);s.advance(600001);const r=await s.call('/api/auth/google/registration','GET',undefined,form.cookie);assert.deepEqual(await r.json(),{pending:null,expired:true});assert.match(r.headers.get('set-cookie'),/Max-Age=0/);assert.equal((await s.call('/api/auth/google/registration','POST',{accepted:true,policyVersion:ACCOUNT_POLICY_VERSION},form.cookie,form.csrf)).status,410);assert.equal(s.db.prepare('SELECT count(*) n FROM accounts').get().n,0);}finally{s.close();}
 const c=await setup();try{const form=await newSignup(c);assert.equal((await c.call('/api/auth/google/registration','DELETE',undefined,form.cookie,'wrong')).status,403);assert.equal((await c.call('/api/auth/google/registration','DELETE',undefined,form.cookie,form.csrf)).status,200);assert.equal(c.db.prepare('SELECT count(*) n FROM pending_google_registrations').get().n,0);assert.equal(c.db.prepare('SELECT count(*) n FROM accounts').get().n,0);}finally{c.close();}});
test('concurrent registration submissions issue one account and session; legacy email collisions stay unmerged',async()=>{
 const s=await setup();try{const form=await newSignup(s),input={accepted:true,policyVersion:ACCOUNT_POLICY_VERSION};const responses=await Promise.all([1,2].map(()=>s.call('/api/auth/google/registration','POST',input,form.cookie,form.csrf)));assert.deepEqual(responses.map(r=>r.status).sort(),[200,410]);assert.equal(s.db.prepare('SELECT count(*) n FROM accounts').get().n,1);assert.equal(s.db.prepare('SELECT count(*) n FROM sessions').get().n,1);
 }finally{s.close();}
 const c=await setup();try{const form=await newSignup(c);c.db.prepare('INSERT INTO accounts(id,email,created_at) VALUES(?,?,?)').run('legacy','google@example.invalid',at);assert.equal((await c.call('/api/auth/google/registration','POST',{accepted:true,policyVersion:ACCOUNT_POLICY_VERSION},form.cookie,form.csrf)).status,409);assert.equal(c.db.prepare('SELECT google_sub FROM accounts').get().google_sub,null);assert.equal(c.db.prepare('SELECT count(*) n FROM sessions').get().n,0);assert.equal(c.db.prepare('SELECT count(*) n FROM pending_google_registrations').get().n,1);
 }finally{c.close();}});
test('previously created linked accounts need no fabricated policy timestamp or repeated age checkbox',async()=>{
 const s=await setup();try{s.db.prepare('INSERT INTO accounts(id,email,google_sub,created_at) VALUES(?,?,?,?)').run('existing','google@example.invalid','synthetic-subject',at-86400000);const reply=await s.callback(await s.start({returnTo:'/study-groups'}));assert.equal(reply.headers.get('location'),'https://study.test/study-groups');assert.equal(s.db.prepare('SELECT policy_accepted_at FROM accounts').get().policy_accepted_at,null);assert.equal(s.db.prepare('SELECT count(*) n FROM pending_google_registrations').get().n,0);}finally{s.close();}});

test('exchange failures expose only safe stages, never provider details, codes or credentials',async()=>{
 for(const [reason,stage] of [['invalid_client','provider_config'],['unauthorized_client','provider_config'],['invalid_grant','exchange_rejected'],['invalid_request','exchange_request'],['toString','exchange_failed'],['unexpected private detail','exchange_failed']]){
  const s=await setup(()=>Response.json({error:reason,error_description:'private provider detail'},{status:400}));try{const r=await s.callback(await s.start());assert.equal(r.headers.get('location'),'https://study.test/account?signin='+stage);assert.equal(s.db.prepare('SELECT count(*) n FROM accounts').get().n,0);assert.equal(s.db.prepare('SELECT count(*) n FROM oauth_states').get().n,0);assert.equal(s.db.prepare('SELECT count(*) n FROM pending_google_registrations').get().n,0);}finally{s.close();}
 }
 const s=await setup(()=>{throw Error('private transport detail');});try{const r=await s.callback(await s.start());assert.equal(r.headers.get('location'),'https://study.test/account?signin=exchange_unavailable');}finally{s.close();}
});
