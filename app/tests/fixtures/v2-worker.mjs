// Explicit, localhost-only V2 fixture. Never imported by production code.
import worker,{StudyRoom} from '../../dist/cloudflare/worker.mjs';
import {issueSession} from '../../server/auth-shared.mjs';
import {pendingRegistration} from '../../server/registration.mjs';
export {StudyRoom};
const emails=['owner@studytimely.invalid','learner@studytimely.invalid','admin@studytimely.invalid'];
export default {async fetch(request,env,ctx){
 const url=new URL(request.url);if(!['127.0.0.1','localhost','[::1]'].includes(url.hostname))return new Response('Local synthetic fixture only',{status:403});
 const fixture={...env,COMMUNITY_ADMIN_EMAILS:'admin@studytimely.invalid'};
 if(url.pathname==='/__test/registration'&&request.method==='POST'){if(request.headers.get('origin')!==url.origin)return new Response('Forbidden',{status:403});const id=crypto.randomUUID();const proof=await pendingRegistration(request,env,{sub:'synthetic-new-google:'+id,email:'new-'+id.slice(0,8)+'@studytimely.invalid'},'/account',Date.now());return new Response(null,{status:303,headers:{Location:'/account?signin=register','Set-Cookie':proof,'Cache-Control':'no-store'}});}
 if(url.pathname==='/__test/notify'&&request.method==='POST'){const {roomId}=await request.json();if(!/^[a-f0-9-]{36}$/.test(roomId||''))return new Response('Invalid fixture room',{status:400});return env.ROOMS.get(env.ROOMS.idFromName(roomId)).fetch('https://room.internal/notify',{method:'POST'});}
 if(url.pathname==='/__test/sign-in'){
  if(request.method==='GET')return new Response('<!doctype html><html lang="en"><head><title>V2 local synthetic sign-in</title><meta name="robots" content="noindex,nofollow"></head><body><h1>V2 local synthetic sign-in</h1><p>Disposable local accounts only. This does not authenticate with Google or accept a real Google agreement. Production uses Google OAuth.</p><form method="post"><label>Test account<select name="email">'+emails.map(e=>e.startsWith('admin@')?e:e.replace('@','-'+crypto.randomUUID().slice(0,8)+'@')).map(e=>`<option>${e}</option>`).join('')+'</select></label><button>Sign in to local fixture</button></form><form method="post" action="/__test/registration"><button>Preview new-account setup</button></form></body></html>',{headers:{'Content-Type':'text/html','Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
  if(request.method!=='POST'||request.headers.get('origin')!==url.origin)return new Response('Forbidden',{status:403});
  const input=await request.formData(),email=input.get('email');if(typeof email!=='string'||!(/^(owner|learner|admin)(?:-[a-f0-9]{8})?@studytimely\.invalid$/.test(email)))return new Response('Synthetic accounts only',{status:400});
  await env.DB.prepare('INSERT INTO accounts(id,email,google_sub,created_at) VALUES(?,?,?,?) ON CONFLICT(email) DO NOTHING').bind(crypto.randomUUID(),email,'synthetic-local-google:'+email,Date.now()).run();
  const account=await env.DB.prepare('SELECT id FROM accounts WHERE email=?').bind(email).first(),session=await issueSession(request,env,account);
  return new Response(null,{status:303,headers:{'Location':'/study-groups','Set-Cookie':session.cookie,'Cache-Control':'no-store'}});
 }
 return worker.fetch(request,fixture,ctx);
}};
