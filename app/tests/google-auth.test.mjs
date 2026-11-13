import test from 'node:test';
import assert from 'node:assert/strict';
import {testDatabase} from './helpers/d1.mjs';
import {createGoogleAuth,verifyGoogleIdToken} from '../server/google-auth.mjs';
import {issueSession} from '../server/auth-shared.mjs';
const encode=data=>Buffer.from(typeof data==='string'?data:JSON.stringify(data)).toString('base64url');
const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk={...await crypto.subtle.exportKey('jwk',pair.publicKey),kid:'synthetic-google-test',use:'sig'};
const at=Date.UTC(2026,10,13,12);
async function jwt(claims){const data=encode({alg:'RS256',kid:jwk.kid})+'.'+encode({iss:'https://accounts.google.com',aud:'synthetic-client.apps.googleusercontent.com',sub:'synthetic-subject',email:'google@example.invalid',email_verified:true,iat:at/1000,exp:at/1000+3600,nonce:'fixture-nonce',...claims});const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(data));return data+'.'+Buffer.from(signature).toString('base64url');}
async function setup(){const db=testDatabase(),env={DB:db.DB,AUTH_HMAC:'synthetic-auth-secret-only-for-unit-tests',GOOGLE_CLIENT_ID:'synthetic-client.apps.googleusercontent.com',GOOGLE_CLIENT_SECRET:'synthetic-client-secret-not-production'};let clock=at,claims={},exchange=null,nonce='';
 const api=createGoogleAuth({now:()=>clock,keys:[jwk],fetcher:async(url,options)=>{assert.equal(url,'https://oauth2.googleapis.com/token');exchange=new URLSearchParams(options.body);return Response.json({id_token:await jwt({nonce,...claims})});}});
 const call=(path,method='GET',data,cookie='',csrf='')=>api(new Request('https://study.test'+path,{method,headers:{origin:'https://study.test','content-type':'application/json',cookie,'x-csrf-token':csrf},body:data?JSON.stringify(data):undefined}),env);
 async function start(data={accepted:true},auth={}){const r=await call('/api/auth/google/start','POST',data,auth.cookie,auth.csrf);assert.equal(r.status,200,JSON.stringify(await r.clone().json()));const url=new URL((await r.json()).url);nonce=url.searchParams.get('nonce');return {url,binder:r.headers.get('set-cookie').split(';')[0]};}
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
 const response=await s.callback(flow);assert.equal(response.status,303);assert.equal(response.headers.get('location'),'https://study.test/study-groups');assert.ok(response.headers.getSetCookie().some(c=>c.startsWith('__Host-studytimely-session=')&&c.includes('HttpOnly')&&c.includes('Secure')));assert.equal(s.db.prepare('SELECT google_sub FROM accounts').get().google_sub,'synthetic-subject');assert.equal(s.exchange.get('code_verifier'),stored.verifier);assert.equal(s.db.prepare('SELECT count(*) n FROM oauth_states').get().n,0);assert.match((await s.callback(flow)).headers.get('location'),/expired$/);
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
 const s=await setup();try{let f=await s.start({accepted:true,returnTo:'https://evil.test'});s.advance(601000);assert.match((await s.callback(f)).headers.get('location'),/expired$/);assert.equal(s.db.prepare('SELECT count(*) n FROM accounts').get().n,0);s.advance(-601000);f=await s.start();s.setClaims({nonce:'wrong'});assert.match((await s.callback(f)).headers.get('location'),/failed$/);assert.equal(s.db.prepare('SELECT count(*) n FROM accounts').get().n,0);
 f=await s.start();const r=await s.call('/api/auth/google/callback?state='+f.url.searchParams.get('state')+'&error=access_denied','GET',undefined,f.binder);assert.match(r.headers.get('location'),/cancelled$/);assert.equal(s.db.prepare('SELECT count(*) n FROM sessions').get().n,0);
 }finally{s.close();}
});
