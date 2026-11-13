import {validateBackup} from '../src/lib/model.mjs';
import {ApiError,fail,digest,hmac,equal,randomToken,result,cookie,readCookie,body} from './auth-shared.mjs';
export const MAX_SYNC_BYTES=1024*1024;
const AGE=30*86400000,CODE_AGE=10*60000,encoder=new TextEncoder();
const email=value=>{if(typeof value!=='string'||value.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(value.trim()))fail(400,'INVALID','Enter a valid email address.');return value.trim().toLowerCase();};
function randomCode(){let n;do{n=crypto.getRandomValues(new Uint32Array(1))[0];}while(n>=4294000000);return String(n%1000000).padStart(6,'0');}
export function createAccountsApi({now=Date.now,makeCode=randomCode,makeToken=randomToken,makeId=()=>crypto.randomUUID(),emailRecoveryOnly=false}={}){
 return async function handle(request,env,enabled=true){
  const url=new URL(request.url),path=url.pathname,method=request.method,at=now();
  try{
   if(!enabled||!env.DB||!env.AUTH_HMAC||env.AUTH_HMAC.length<32)fail(503,'NOT_CONFIGURED','Optional accounts are not enabled here. Your local tools still work.');
   if(url.protocol!=='https:'&&!['127.0.0.1','localhost','[::1]'].includes(url.hostname))fail(400,'HTTPS_REQUIRED','Use HTTPS to sign in.');
   if(request.headers.get('sec-fetch-site')==='cross-site')fail(403,'ORIGIN','Use this action from StudyTimely.');
   if(!['GET','HEAD'].includes(method)&&request.headers.get('origin')!==url.origin)fail(403,'ORIGIN','Use this action from StudyTimely.');
   const query=(sql,...args)=>env.DB.prepare(sql).bind(...args);
   async function limit(kind,key,max,period){
    const bucket=kind+':'+Math.floor(at/period)+':'+await hmac(env.AUTH_HMAC,key);
    const row=await query('INSERT INTO rate_limits(bucket,count,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count',bucket,at+period*2).first();
    if(row.count>max)fail(429,'RATE_LIMIT','Too many attempts. Please wait before trying again.');
   }
   const ip=request.headers.get('cf-connecting-ip')||'local';
   const publicPaths=['/api/auth/request-code','/api/auth/verify-code'];
   let identity=null,sessionToken=readCookie(request),sessionHash='';
   if(sessionToken&&/^[a-f0-9]{64}$/.test(sessionToken)){
    sessionHash=await digest(sessionToken);
    identity=await query('SELECT a.id,a.email,a.google_sub,a.created_at,s.expires_at FROM sessions s JOIN accounts a ON a.id=s.account_id WHERE s.token_hash=? AND s.expires_at>?',sessionHash,at).first();
   }
   const csrf=identity?await hmac(env.AUTH_HMAC,'csrf:'+sessionToken):'';
   if(path==='/api/auth/me'&&method==='GET')return result({user:identity?{email:identity.email,createdAt:identity.created_at,googleLinked:!!identity.google_sub}:null,csrf:identity?csrf:null,providers:{google:!!(env.GOOGLE_CLIENT_ID&&env.GOOGLE_CLIENT_SECRET)}});
   if(!publicPaths.includes(path)&&!identity)fail(401,'NO_AUTH','Sign in to use cloud data. Anonymous tools remain available.');
   if(identity&&!publicPaths.includes(path)&&!['GET','HEAD'].includes(method)&&!equal(request.headers.get('x-csrf-token'),csrf))fail(403,'CSRF','Refresh your account page and try again.');
   if(path==='/api/auth/request-code'&&method==='POST'){
    const input=await body(request),address=email(input.email);
    if(input.accepted!==true)fail(400,'AGE_POLICY','Confirm the account age and privacy requirements before continuing.');
    await limit('request-ip',ip,20,3600000);await limit('request-email',address,3,900000);
    if(emailRecoveryOnly){const legacy=await query('SELECT google_sub FROM accounts WHERE email=?',address).first();if(!legacy||legacy.google_sub)return result({sent:true,expiresIn:600},202);}
    if(!env.EMAIL?.send)fail(503,'MAIL_UNAVAILABLE','Sign-in email is unavailable. Please try again later.');
    const key=await hmac(env.AUTH_HMAC,'email:'+address);
    const code=makeCode(),nonce=makeToken(),hash=await hmac(env.AUTH_HMAC,key+':'+nonce+':'+code);
    const reserved=await query('INSERT INTO login_codes(email_key,code_hash,nonce,created_at,expires_at,attempts) VALUES(?,?,?,?,?,0) ON CONFLICT(email_key) DO UPDATE SET code_hash=excluded.code_hash,nonce=excluded.nonce,created_at=excluded.created_at,expires_at=excluded.expires_at,attempts=0 WHERE login_codes.created_at<=? RETURNING nonce',key,hash,nonce,at,at+CODE_AGE,at-60000).first();
    if(!reserved)fail(429,'RATE_LIMIT','Wait at least one minute before requesting another code.');
    try{await env.EMAIL.send({from:env.SUPPORT_EMAIL||'support@studytimely.com',to:address,subject:'Your StudyTimely sign-in code',text:`Your StudyTimely sign-in code is ${code}. It expires in 10 minutes and can be used once. If you did not request it, ignore this email. Do not share this code.`});}
    catch{await query('DELETE FROM login_codes WHERE email_key=? AND nonce=?',key,nonce).run();fail(503,'MAIL_UNAVAILABLE','The sign-in email could not be sent. Please try again later.');}
    await env.DB.batch([query('DELETE FROM login_codes WHERE expires_at<?',at),query('DELETE FROM sessions WHERE expires_at<?',at),query('DELETE FROM rate_limits WHERE expires_at<?',at)]);
    return result({sent:true,expiresIn:600},202);
   }
   if(path==='/api/auth/verify-code'&&method==='POST'){
    const input=await body(request),address=email(input.email);if(!/^\d{6}$/.test(input.code||''))fail(400,'INVALID_CODE','Enter the six-digit code from your email.');
    await limit('verify-ip',ip,40,900000);
    const key=await hmac(env.AUTH_HMAC,'email:'+address);
    const saved=await query('UPDATE login_codes SET attempts=attempts+1 WHERE email_key=? AND expires_at>? AND attempts<5 RETURNING code_hash,nonce',key,at).first();
    if(!saved||!equal(saved.code_hash,await hmac(env.AUTH_HMAC,key+':'+saved.nonce+':'+input.code)))fail(400,'INVALID_CODE','The code is incorrect or expired. Request a new code if needed.');
    const consumed=await query('DELETE FROM login_codes WHERE email_key=? AND nonce=? RETURNING email_key',key,saved.nonce).first();if(!consumed)fail(400,'INVALID_CODE','This code has already been used.');
    const linkedGoogle=await query('SELECT google_sub FROM accounts WHERE email=?',address).first();if(emailRecoveryOnly&&!linkedGoogle)fail(400,'INVALID_CODE','The code is incorrect or expired.');if(linkedGoogle?.google_sub)fail(400,'GOOGLE_REQUIRED','Use Google to sign in to this linked account.');
    await query('INSERT INTO accounts(id,email,created_at) VALUES(?,?,?) ON CONFLICT(email) DO NOTHING',makeId(),address,at).run();
    const account=await query('SELECT id,email,created_at FROM accounts WHERE email=?',address).first(),token=makeToken();
    await query('INSERT INTO sessions(token_hash,account_id,expires_at) VALUES(?,?,?)',await digest(token),account.id,at+AGE).run();
    return result({user:{email:account.email,createdAt:account.created_at},csrf:await hmac(env.AUTH_HMAC,'csrf:'+token)},200,{'Set-Cookie':cookie(request,token,AGE/1000)});
   }
   if(path==='/api/auth/logout'&&method==='POST'){await query('DELETE FROM sessions WHERE token_hash=?',sessionHash).run();return result({signedOut:true},200,{'Set-Cookie':cookie(request,'',0)});}
   if(path==='/api/workspace'&&method==='GET'){
    const row=await query('SELECT version,document,updated_at FROM workspaces WHERE account_id=?',identity.id).first();
    return result({version:row?.version||0,document:row?.document?JSON.parse(row.document):null,updatedAt:row?.updated_at||null});
   }
   if(path==='/api/workspace'&&['PUT','DELETE'].includes(method)){
    await limit('sync-account',identity.id,120,3600000);
    const input=await body(request,MAX_SYNC_BYTES+4096);if(!Number.isInteger(input.version)||input.version<0)fail(400,'INVALID','Provide the cloud version you last reviewed.');
    let document=null;
    if(method==='PUT'){
     let valid;try{valid=validateBackup(input.document);}catch(e){fail(400,'INVALID',e.message);}
     document=JSON.stringify({app:'StudyTimely',schema:1,...valid});if(encoder.encode(document).length>MAX_SYNC_BYTES)fail(413,'SYNC_LIMIT','Cloud sync supports up to 1 MiB per workspace. Export a local JSON backup for larger histories.');
    }
    const row=input.version===0?await query('INSERT INTO workspaces(account_id,version,document,updated_at) VALUES(?,1,?,?) ON CONFLICT(account_id) DO NOTHING RETURNING version',identity.id,document,at).first():await query('UPDATE workspaces SET version=version+1,document=?,updated_at=? WHERE account_id=? AND version=? RETURNING version',document,at,identity.id,input.version).first();
    if(!row)fail(409,'CONFLICT','Cloud data changed on another device. Review and merge before saving again.');
    return result({version:row.version,updatedAt:at,cleared:method==='DELETE'});
   }
   if(path==='/api/account/export'&&method==='GET'){
    const row=await query('SELECT version,document,updated_at FROM workspaces WHERE account_id=?',identity.id).first();
    const profile=await query('SELECT id,nickname,public_ranking,accepted_at FROM community_profiles WHERE account_id=?',identity.id).first();
    const community=profile?{profile,ownedRooms:(await query('SELECT id,name,visibility,goal_minutes,capacity,invitations_open,created_at,closed_at FROM community_rooms WHERE owner_id=?',profile.id).all()).results,roomTime:(await query('SELECT room_id,day,seconds FROM community_room_daily WHERE profile_id=?',profile.id).all()).results,rankHistory:(await query('SELECT day,rank,seconds FROM community_rank_history WHERE profile_id=?',profile.id).all()).results,blocks:(await query('SELECT blocked_id FROM community_blocks WHERE blocker_id=?',profile.id).all()).results,memberships:(await query('SELECT room_id,joined_at,left_at,banned FROM community_members WHERE profile_id=?',profile.id).all()).results,daily:(await query('SELECT day,seconds FROM community_daily WHERE profile_id=?',profile.id).all()).results,messages:(await query('SELECT room_id,text,created_at FROM community_messages WHERE author_id=?',profile.id).all()).results,reports:(await query('SELECT room_id,reason,detail,status,created_at FROM community_reports WHERE reporter_id=?',profile.id).all()).results}:null;
    return result({community,account:{email:identity.email,createdAt:identity.created_at,googleSubject:identity.google_sub||null},workspace:row?.document?JSON.parse(row.document):null,version:row?.version||0,exportedAt:new Date(at).toISOString()});
   }
   if(path==='/api/account'&&method==='DELETE'){
    const input=await body(request);if(input.confirm!=='DELETE')fail(400,'CONFIRM','Confirm account deletion explicitly.');
    const key=await hmac(env.AUTH_HMAC,'email:'+identity.email);
    await env.DB.batch([query('DELETE FROM login_codes WHERE email_key=?',key),query('DELETE FROM accounts WHERE id=?',identity.id)]);
    return result({deleted:true},200,{'Set-Cookie':cookie(request,'',0)});
   }
   fail(405,'METHOD','This endpoint does not support that action.');
  }catch(error){if(error instanceof ApiError)return result({error:{code:error.code,message:error.message}},error.status);return result({error:{code:'UNAVAILABLE',message:'The service is temporarily unavailable. Your local data has not been changed.'}},503);}
 };
}
