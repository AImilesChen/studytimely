import {pendingRegistration,registration} from './registration.mjs';
import {ApiError,fail,result,body,randomToken,digest,equal,readCookie,cookie,sameOrigin,identity,issueSession,rateLimit} from './auth-shared.mjs';
const AUTH='https://accounts.google.com/o/oauth2/v2/auth',TOKEN='https://oauth2.googleapis.com/token',CERTS='https://www.googleapis.com/oauth2/v3/certs';
const b64=bytes=>btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
const decode=value=>Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
const json=value=>JSON.parse(new TextDecoder().decode(decode(value)));
const binderName=req=>new URL(req.url).protocol==='https:'?'__Host-studytimely-oauth':'studytimely-local-oauth';
// Keep native fetch attached to its global receiver when passed between helpers.
const runtimeFetch=(...args)=>globalThis.fetch(...args);
export async function verifyGoogleIdToken(token,{clientId,nonce,now=Date.now(),fetcher=runtimeFetch,keys}={}){
 try{
  if(typeof token!=='string'||token.length>16000)throw Error();const parts=token.split('.');if(parts.length!==3)throw Error();const header=json(parts[0]),claims=json(parts[1]);
  if(header.alg!=='RS256'||typeof header.kid!=='string')throw Error();
  if(!keys){const r=await fetcher(CERTS,{redirect:'manual',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error();keys=(await r.json()).keys;}
  const jwk=keys?.find(k=>k.kid===header.kid&&k.kty==='RSA'&&(!k.use||k.use==='sig'));if(!jwk)throw Error();
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1])))throw Error();
  const seconds=Math.floor(now/1000);
  if(!['https://accounts.google.com','accounts.google.com'].includes(claims.iss)||claims.aud!==clientId||(claims.azp&&claims.azp!==clientId)||!Number.isFinite(claims.exp)||claims.exp<=seconds||!Number.isFinite(claims.iat)||claims.iat>seconds+60||claims.iat<seconds-600||!equal(claims.nonce,nonce)||claims.email_verified!==true||typeof claims.sub!=='string'||!/^\S{1,255}$/.test(claims.sub)||typeof claims.email!=='string'||claims.email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(claims.email))throw Error();
  return{sub:claims.sub,email:claims.email.toLowerCase()};
 }catch{fail(400,'GOOGLE_TOKEN','Google sign-in could not be verified. Please start again.');}
}
export function createGoogleAuth({now=Date.now,fetcher=runtimeFetch,keys}={}){
 return async(request,env)=>{
  const url=new URL(request.url),at=now(),callback=url.origin+'/api/auth/google/callback';
  let returnPath='/account',failure='failed';
  const redirect=(code,session,registrationCookie)=>{const headers=new Headers({'Location':url.origin+(code==='success'&&returnPath==='/study-groups'?returnPath:'/account?signin='+code),'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'});headers.append('Set-Cookie',cookie(request,'',0,binderName(request)));if(session)headers.append('Set-Cookie',session.cookie);if(registrationCookie)headers.append('Set-Cookie',registrationCookie);return new Response(null,{status:303,headers});};
  try{
   if(!env.DB||!env.AUTH_HMAC||env.AUTH_HMAC.length<32)fail(503,'NOT_CONFIGURED','The account service is not configured.');
   if(url.pathname==='/api/auth/google/registration')return await registration(request,env,at);
   if(!env.GOOGLE_CLIENT_ID||!env.GOOGLE_CLIENT_SECRET)fail(503,'GOOGLE_NOT_CONFIGURED','Google sign-in is not configured yet. Anonymous tools still work.');
   if(url.pathname==='/api/auth/google/start'&&request.method==='POST'){
    sameOrigin(request);const input=await body(request);
    await rateLimit(env,'google-start',request.headers.get('cf-connecting-ip')||'local',30,3600000,at);
    const linked=input.link===true?await identity(request,env,at):null;
    const state=randomToken(),binder=randomToken(),verifier=randomToken(),nonce=randomToken();
    await env.DB.batch([env.DB.prepare('DELETE FROM oauth_states WHERE expires_at<?').bind(at),env.DB.prepare('INSERT INTO oauth_states(state_hash,binder_hash,verifier,nonce,expires_at,link_account,link_session_hash,return_path) VALUES(?,?,?,?,?,?,?,?)').bind(await digest(state),await digest(binder),verifier,nonce,at+600000,linked?.id||null,linked?.sessionHash||null,input.returnTo==='/study-groups'?'/study-groups':'/account')]);
    const auth=new URL(AUTH);auth.search=new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,redirect_uri:callback,response_type:'code',scope:'openid email',state,nonce,code_challenge:b64(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)))),code_challenge_method:'S256',prompt:'select_account'}).toString();
    return result({url:auth.href},200,{'Set-Cookie':cookie(request,binder,600,binderName(request))});
   }
   if(url.pathname!== '/api/auth/google/callback'||request.method!=='GET')return result({error:{code:'METHOD',message:'Unsupported sign-in action.'}},405);
   const state=url.searchParams.get('state')||'',binder=readCookie(request,binderName(request));if(!/^[a-f0-9]{64}$/.test(state)||!/^[a-f0-9]{64}$/.test(binder))return redirect('expired');
   const saved=await env.DB.prepare('DELETE FROM oauth_states WHERE state_hash=? AND binder_hash=? AND expires_at>? RETURNING verifier,nonce,link_account,link_session_hash,return_path').bind(await digest(state),await digest(binder),at).first();if(!saved)return redirect('expired');returnPath=saved.return_path;
   if(url.searchParams.has('error'))return redirect('cancelled');const code=url.searchParams.get('code');if(!code||code.length>4096)return redirect('expired');
   failure='exchange_unavailable';
   const exchanged=await fetcher(TOKEN,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,redirect_uri:callback,grant_type:'authorization_code',code_verifier:saved.verifier}),redirect:'manual',signal:AbortSignal.timeout(10000)});
   failure='exchange_failed';
   if(!exchanged.ok){const reason=(await exchanged.json().catch(()=>({}))).error;const stages={invalid_client:'provider_config',unauthorized_client:'provider_config',invalid_grant:'exchange_rejected',invalid_request:'exchange_request'};return redirect(Object.hasOwn(stages,reason)?stages[reason]:'exchange_failed');}failure='verification_failed';const claims=await verifyGoogleIdToken((await exchanged.json()).id_token,{clientId:env.GOOGLE_CLIENT_ID,nonce:saved.nonce,now:at,fetcher,keys});
   failure='storage_failed';
   let account=await env.DB.prepare('SELECT id,email,google_sub FROM accounts WHERE google_sub=?').bind(claims.sub).first();
   if(saved.link_account){
    const active=await env.DB.prepare('SELECT account_id FROM sessions WHERE token_hash=? AND account_id=? AND expires_at>?').bind(saved.link_session_hash,saved.link_account,at).first();
    if(!active||!equal(await digest(readCookie(request)),saved.link_session_hash)||account&&account.id!==saved.link_account)return redirect('link_failed');
    const existing=await env.DB.prepare('SELECT id,email,google_sub FROM accounts WHERE id=?').bind(saved.link_account).first();
    if(!existing||existing.email!==claims.email||existing.google_sub&&existing.google_sub!==claims.sub)return redirect('link_failed');
    await env.DB.prepare('UPDATE accounts SET google_sub=? WHERE id=? AND (google_sub IS NULL OR google_sub=?)').bind(claims.sub,existing.id,claims.sub).run();account=existing;
   }else if(!account){
    if(await env.DB.prepare('SELECT id FROM accounts WHERE email=?').bind(claims.email).first())return redirect('link_required');
    return redirect('register',null,await pendingRegistration(request,env,claims,returnPath,at));
   }
   if(!account)return redirect('failed');
   if(account.email!==claims.email){if(await env.DB.prepare('SELECT id FROM accounts WHERE email=? AND id<>?').bind(claims.email,account.id).first())return redirect('link_failed');await env.DB.prepare('UPDATE accounts SET email=? WHERE id=?').bind(claims.email,account.id).run();account.email=claims.email;}
   return redirect('success',await issueSession(request,env,account,at));
  }catch(error){if(url.pathname.endsWith('/callback'))return redirect(failure);return result({error:{code:error instanceof ApiError?error.code:'UNAVAILABLE',message:error instanceof ApiError?error.message:'Sign-in is temporarily unavailable.'}},error instanceof ApiError?error.status:503);}
 };
}
