import {body,cookie,digest,equal,fail,hmac,randomToken,readCookie,result,sameOrigin,rateLimit} from './auth-shared.mjs';
import {ACCOUNT_POLICY_VERSION,ACCOUNT_MINIMUM_AGE} from '../src/lib/account-policy.mjs';
export const registrationCookieName=request=>new URL(request.url).protocol==='https:'?'__Host-studytimely-registration':'studytimely-local-registration';
export async function pendingRegistration(request,env,claims,returnPath,at){
 const token=randomToken(),old=readCookie(request,registrationCookieName(request));
 await env.DB.batch([
  env.DB.prepare('DELETE FROM pending_google_registrations WHERE expires_at<=? OR token_hash=?').bind(at,await digest(old)),
  env.DB.prepare('INSERT INTO pending_google_registrations(token_hash,google_sub,email,return_path,expires_at) VALUES(?,?,?,?,?)').bind(await digest(token),claims.sub,claims.email,returnPath==='/study-groups'?returnPath:'/account',at+600000)
 ]);
 return cookie(request,token,600,registrationCookieName(request));
}
export async function registration(request,env,at){
 sameOrigin(request);const name=registrationCookieName(request),token=readCookie(request,name),hash=/^[a-f0-9]{64}$/.test(token)?await digest(token):'';
 const pending=hash?await env.DB.prepare('SELECT * FROM pending_google_registrations WHERE token_hash=? AND expires_at>?').bind(hash,at).first():null;
 const clear={'Set-Cookie':cookie(request,'',0,name)};
 if(request.method==='GET'){
  if(!pending)return result({pending:null,expired:!!token},200,token?clear:{});
  return result({pending:{email:pending.email,expiresAt:pending.expires_at,policyVersion:ACCOUNT_POLICY_VERSION,minimumAge:ACCOUNT_MINIMUM_AGE},csrf:await hmac(env.AUTH_HMAC,'registration:'+token)});
 }
 if(!['POST','DELETE'].includes(request.method))return result({error:{code:'METHOD',message:'Unsupported account setup action.'}},405);
 if(!pending)return result({error:{code:'REGISTRATION_EXPIRED',message:'Account setup expired. Continue with Google again.'}},410,clear);
 if(!equal(request.headers.get('x-csrf-token'),await hmac(env.AUTH_HMAC,'registration:'+token)))fail(403,'CSRF','Refresh account setup and try again.');
 if(request.method==='DELETE'){await env.DB.prepare('DELETE FROM pending_google_registrations WHERE token_hash=?').bind(hash).run();return result({cancelled:true},200,clear);}
 const input=await body(request);if(input.accepted!==true)fail(400,'AGE_POLICY','Confirm the account age and privacy requirements to create an account.');
 if(input.policyVersion!==ACCOUNT_POLICY_VERSION)fail(409,'POLICY_CHANGED','Reload account setup to read the current account requirements.');
 await rateLimit(env,'registration',request.headers.get('cf-connecting-ip')||'local',10,3600000,at);
 const collision=await env.DB.prepare('SELECT google_sub FROM accounts WHERE email=?').bind(pending.email).first();
 if(collision&&collision.google_sub!==pending.google_sub)fail(409,'LINK_REQUIRED','This email has an existing account. Cancel setup, recover that account and link Google.');
 const session=randomToken(),sessionHash=await digest(session);
 // Account creation, session issue and one-use proof consumption are one transaction.
 // A second submission with the same proof cannot issue another session.
 const saved=await env.DB.batch([
  env.DB.prepare(`INSERT INTO accounts(id,email,google_sub,created_at,policy_accepted_at,policy_version)
   SELECT ?,email,google_sub,?,?,? FROM pending_google_registrations WHERE token_hash=? AND expires_at>?
   ON CONFLICT(google_sub) WHERE google_sub IS NOT NULL DO NOTHING`).bind(crypto.randomUUID(),at,at,ACCOUNT_POLICY_VERSION,hash,at),
  env.DB.prepare(`INSERT INTO sessions(token_hash,account_id,expires_at)
   SELECT ?,a.id,? FROM accounts a JOIN pending_google_registrations p ON p.google_sub=a.google_sub WHERE p.token_hash=? AND p.expires_at>?`).bind(sessionHash,at+30*86400000,hash,at),
  env.DB.prepare('DELETE FROM pending_google_registrations WHERE token_hash=?').bind(hash)
 ]);
 if(Number(saved[1]?.meta?.changes)!==1)return result({error:{code:'REGISTRATION_EXPIRED',message:'Account setup has already been completed. Continue with Google to sign in.'}},410,clear);
 const response=result({redirect:pending.return_path==='/study-groups'?'/study-groups':'/account?signin=success'},200,clear);
 response.headers.append('Set-Cookie',cookie(request,session,30*86400));return response;
}
