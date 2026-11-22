import {ApiError,fail,hmac,equal,randomToken,digest,cookie,sameOrigin,rateLimit,result} from './auth-shared.mjs';
import {billingConfig} from './stripe-client.mjs';

// Operator-issued, expiring credentials for the isolated payment acceptance site.
// This is deliberately independent of Google OAuth and production identities.
export function sandboxSiteAllowed(request,env){
 const u=new URL(request.url);
 return u.protocol==='https:'&&u.origin===env.BILLING_ORIGIN&&env.SANDBOX_SITE_ENABLED==='true'&&env.BILLING_TEST_ISOLATED==='true'&&billingConfig(env,request).ready&&!!env.DB&&typeof env.AUTH_HMAC==='string'&&env.AUTH_HMAC.length>=32;
}
export async function signSandboxAccess(payload,secret){
 const encoded=btoa(JSON.stringify(payload)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
 return encoded+'.'+await hmac(secret,'sandbox-access:'+encoded);
}
export async function verifySandboxAccess(value,env,at){
 if(typeof value!=='string'||value.length>1800)fail(401,'SANDBOX_ACCESS','Use a valid unexpired payment-test access code.');
 const parts=value.split('.');
 if(parts.length!==2||!/^[A-Za-z0-9_-]+$/.test(parts[0])||!/^[a-f0-9]{64}$/.test(parts[1])||!equal(parts[1],await hmac(env.AUTH_HMAC,'sandbox-access:'+parts[0])))fail(401,'SANDBOX_ACCESS','Use a valid unexpired payment-test access code.');
 let p;try{p=JSON.parse(atob(parts[0].replaceAll('-','+').replaceAll('_','/')));}catch{fail(401,'SANDBOX_ACCESS','Invalid payment-test access code.');}
 if(p.purpose!=='payment-sandbox-access'||p.origin!==env.BILLING_ORIGIN||!/^sandbox-[a-f0-9-]{36}$/.test(p.id||'')||!/^payment-[a-z0-9-]+@studytimely\.invalid$/.test(p.email||'')||!Number.isSafeInteger(p.issuedAt)||!Number.isSafeInteger(p.expiresAt)||p.issuedAt>at||p.expiresAt<=at||p.expiresAt-p.issuedAt>7*86400000)fail(401,'SANDBOX_ACCESS','Use a valid unexpired payment-test access code.');
 return p;
}
const page=()=>new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Payment test access · StudyTimely</title><style>body{margin:0;background:#f4f2e9;color:#292b24;font:16px/1.6 system-ui}main{max-width:520px;margin:10vh auto;padding:32px;background:#fffaf2;border:1px solid #d6b7a0;border-top:4px solid #b84322;border-radius:14px}h1{font:32px Georgia;margin:8px 0}label{display:block;font-weight:650;margin-top:24px}input,button{box-sizing:border-box;width:100%;padding:14px;border:1px solid #bd8f73;border-radius:8px;font:inherit}input{margin:8px 0 16px}button{background:#b84322;color:white;font-weight:700;cursor:pointer}small{display:block;margin:16px 0;color:#685c52}a{color:#9f381d}</style><main><small>STRIPE SANDBOX · NO REAL CHARGES</small><h1>Sign in to payment testing</h1><p>Use your private access code to test checkout and automatic Plus activation. These accounts and payments are separate from StudyTimely.</p><form method="post" action="/sandbox/sign-in"><label for="code">Payment-test access code</label><input id="code" name="code" type="password" required maxlength="1800" autocomplete="off"><button type="submit">Sign in to test account</button></form><small>Google sign-in and real AI generation are not part of this test. Use Stripe test card details only.</small><a href="/pricing">Back to test pricing →</a></main></html>`,{headers:{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store, private','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'same-origin','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"}});
export function createSandboxAccess({now=Date.now}={}){return async(request,env)=>{
 try{
  if(!sandboxSiteAllowed(request,env))fail(403,'ISOLATION','Payment testing is unavailable on this host.');
  if(request.method==='GET')return page();
  if(request.method!=='POST')return result({error:{code:'METHOD',message:'Use GET or POST.'}},405);
  sameOrigin(request);
  if(!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded'))fail(415,'CONTENT_TYPE','Use the payment-test sign-in form.');
  const at=now();await rateLimit(env,'sandbox-access',request.headers.get('cf-connecting-ip')||'unknown',8,15*60000,at);
  const reader=request.body?.getReader();let text='',bytes=0;if(!reader)fail(400,'INVALID','Enter your access code.');
  while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>4096){await reader.cancel();fail(413,'TOO_LARGE','The access code is too long.');}text+=new TextDecoder().decode(value,{stream:true});}
  const p=await verifySandboxAccess(new URLSearchParams(text).get('code'),env,at);
  await env.DB.prepare('INSERT OR IGNORE INTO accounts(id,email,created_at) VALUES(?,?,?)').bind(p.id,p.email,at).run();
  const account=await env.DB.prepare('SELECT id,email FROM accounts WHERE id=?').bind(p.id).first();
  if(account?.email!==p.email)fail(409,'SANDBOX_IDENTITY','This test identity is unavailable.');
  const token=randomToken(),seconds=Math.max(1,Math.floor(Math.min(8*3600000,p.expiresAt-at)/1000));
  await env.DB.prepare('INSERT INTO sessions(token_hash,account_id,expires_at) VALUES(?,?,?)').bind(await digest(token),account.id,at+seconds*1000).run();
  return new Response(null,{status:303,headers:{Location:'/pricing','Set-Cookie':cookie(request,token,seconds),'Cache-Control':'no-store, private','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'}});
 }catch(e){return result({error:{code:e instanceof ApiError?e.code:'SANDBOX_UNAVAILABLE',message:e instanceof ApiError?e.message:'Payment-test access is temporarily unavailable.'}},e instanceof ApiError?e.status:503);}
};}
