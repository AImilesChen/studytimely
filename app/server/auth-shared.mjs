export class ApiError extends Error { constructor(status,code,message){super(message);Object.assign(this,{status,code});} }
export const fail=(status,code,message)=>{throw new ApiError(status,code,message);};
const encoder=new TextEncoder();
export const randomToken=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
export async function digest(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value))),v=>v.toString(16).padStart(2,'0')).join('');}
export async function hmac(secret,value){const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(value))),v=>v.toString(16).padStart(2,'0')).join('');}
export function equal(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
export function result(data,status=200,extra={}){return Response.json(data,{status,headers:{'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer',...extra}});}
export function sessionCookieName(request){return new URL(request.url).protocol==='https:'?'__Host-studytimely-session':'studytimely-local-session';}
export function readCookie(request,name=sessionCookieName(request)){return(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1)||'';}
export function cookie(request,token,seconds,name=sessionCookieName(request)){return `${name}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${seconds}${new URL(request.url).protocol==='https:'?'; Secure':''}`;}
export function sameOrigin(request){const u=new URL(request.url);if(u.protocol!=='https:'&&!['127.0.0.1','localhost','[::1]'].includes(u.hostname))fail(400,'HTTPS_REQUIRED','Use HTTPS.');if(request.headers.get('sec-fetch-site')==='cross-site'||(!['GET','HEAD'].includes(request.method)&&request.headers.get('origin')!==u.origin))fail(403,'ORIGIN','Use this action from StudyTimely.');}
export async function body(request,limit=4096){
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))fail(415,'CONTENT_TYPE','Use JSON for this request.');
 if(Number(request.headers.get('content-length')||0)>limit)fail(413,'TOO_LARGE','The request is too large.');
 const reader=request.body?.getReader();if(!reader)fail(400,'INVALID','A JSON request body is required.');let bytes=0;const chunks=[];
 while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>limit){await reader.cancel();fail(413,'TOO_LARGE','The request is too large.');}chunks.push(value);}
 const data=new Uint8Array(bytes);let offset=0;for(const c of chunks){data.set(c,offset);offset+=c.length;}
 try{const value=JSON.parse(new TextDecoder().decode(data));if(!value||typeof value!=='object'||Array.isArray(value))throw Error();return value;}catch{fail(400,'INVALID','Provide a valid JSON object.');}
}
export async function identity(request,env,at=Date.now(),required=true,csrf=true){
 sameOrigin(request);if(!env.DB||!env.AUTH_HMAC||env.AUTH_HMAC.length<32)fail(503,'NOT_CONFIGURED','The account service is not configured.');
 const token=readCookie(request),hash=/^[a-f0-9]{64}$/.test(token)?await digest(token):'';
 const user=hash?await env.DB.prepare('SELECT a.id,a.email,a.google_sub,a.created_at,a.policy_accepted_at,a.policy_version,s.expires_at FROM sessions s JOIN accounts a ON a.id=s.account_id WHERE s.token_hash=? AND s.expires_at>?').bind(hash,at).first():null;
 if(!user){if(required)fail(401,'NO_AUTH','Sign in with Google to continue.');return null;}
 const anti=await hmac(env.AUTH_HMAC,'csrf:'+token);if(csrf&&!['GET','HEAD'].includes(request.method)&&!equal(request.headers.get('x-csrf-token'),anti))fail(403,'CSRF','Refresh the page and try again.');
 return {...user,sessionHash:hash,csrf:anti};
}
export async function rateLimit(env,kind,key,max,period,at=Date.now()){
 const bucket=kind+':'+Math.floor(at/period)+':'+await hmac(env.AUTH_HMAC,key);
 const row=await env.DB.prepare('INSERT INTO rate_limits(bucket,count,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').bind(bucket,at+period*2).first();
 if(row.count>max)fail(429,'RATE_LIMIT','Too many requests. Please wait and try again.');
}
export async function issueSession(request,env,account,at=Date.now()){
 const token=randomToken();await env.DB.prepare('INSERT INTO sessions(token_hash,account_id,expires_at) VALUES(?,?,?)').bind(await digest(token),account.id,at+30*86400000).run();
 return {token,csrf:await hmac(env.AUTH_HMAC,'csrf:'+token),cookie:cookie(request,token,30*86400)};
}
