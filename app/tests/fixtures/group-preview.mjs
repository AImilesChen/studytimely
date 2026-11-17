// Local synthetic review entry only. Never imported by the production application.
import {issueSession} from '../../server/auth-shared.mjs';
import {createCommunityApi} from '../../server/community.mjs';
import {activityWall} from '../../src/lib/group-activities.mjs';
const headers={'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'"};
const page=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>StudyTimely 群组功能预览</title><style>body{margin:0;background:#101110;color:#f2f0e6;font:17px/1.8 system-ui,sans-serif}main{max-width:760px;margin:8vh auto;padding:28px}h1{font-size:32px;line-height:1.4}p{color:#babcb4}.roles{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:32px 0}form{border:1px solid #40423c;border-radius:18px;padding:24px;background:#20221f}h2{font-size:21px;margin-top:0}button{background:#f2f0e6;color:#101110;border:0;border-radius:25px;padding:14px 20px;font:600 16px system-ui;cursor:pointer;min-height:48px;width:100%}button:focus-visible,a:focus-visible{outline:3px solid #e2be7c;outline-offset:5px}a{color:inherit}.note{border-top:1px solid #40423c;padding-top:24px;font-size:14px}@media(max-width:600px){main{margin:3vh auto;padding:22px}.roles{grid-template-columns:1fr}h1{font-size:27px}}</style></head><body><main><span>STUDYTIMELY · 本地功能预览</span><h1>不用重新创建房间，<br>选择一个测试身份即可查看。</h1><p>预览房间是私人的，需要对应的测试身份才能打开。这里使用虚构账号，不需要 Google 登录，也不会影响你的正式账号。</p><div class="roles"><form method="post"><input type="hidden" name="role" value="owner"><h2>查看房主功能</h2><p>进入已有示例房间，查看活动、学习总结，体验预约、编辑和管理。</p><button>以房主身份打开示例</button></form><form method="post"><input type="hidden" name="role" value="learner"><h2>体验成员流程</h2><p>查看邀请，加入活动，填写个人任务、计时并提交结束打卡。</p><button>以成员身份体验</button></form></div><p class="note">仅操作隔离的本地测试数据，不是真实用户活动。若测试数据库为空，入口会准备一个空白示例房间和预约；不会伪造学习时长或成果。<br><a href="/study-groups">查看未登录的群组首页</a></p></main></body></html>`;
export async function groupPreview(request,env){
 const url=new URL(request.url);
 if(env.FIXTURE_ACTIVITIES_QA!=='true'||!['localhost','127.0.0.1','[::1]'].includes(url.hostname))return new Response('Local synthetic preview only',{status:404});
 if(request.method==='GET')return new Response(page,{headers});
 if(request.method!=='POST')return new Response('Method not allowed',{status:405,headers:{Allow:'GET, POST'}});
 if(request.headers.get('origin')!==url.origin)return new Response('Forbidden',{status:403});
 const input=await request.formData(),role=input.get('role');if(!['owner','learner'].includes(role))return new Response('Choose a preview role',{status:400});
 const api=createCommunityApi(),at=Date.now();
 async function prepare(kind){
  const email=kind+'@studytimely.invalid';await env.DB.prepare('INSERT INTO accounts(id,email,google_sub,created_at) VALUES(?,?,?,?) ON CONFLICT(email) DO NOTHING').bind(crypto.randomUUID(),email,'synthetic-local-google:'+email,at).run();
  const account=await env.DB.prepare('SELECT id FROM accounts WHERE email=?').bind(email).first();
  // Explicitly synthetic fixture acceptance, not a user's age or contractual declaration.
  await env.DB.prepare('INSERT INTO community_profiles(id,account_id,nickname,public_ranking,accepted_at,created_at) VALUES(?,?,?,0,?,?) ON CONFLICT(account_id) DO NOTHING').bind(crypto.randomUUID(),account.id,kind==='owner'?'QA Host':'QA Learner',at,at).run();
  const profile=await env.DB.prepare('SELECT id FROM community_profiles WHERE account_id=?').bind(account.id).first(),session=await issueSession(request,env,account);
  return{profileId:profile.id,session};
 }
 const owner=await prepare('owner');
 async function call(path,method,data){const response=await api(new Request(url.origin+'/api/community'+path,{method,headers:{origin:url.origin,'Content-Type':'application/json',cookie:owner.session.cookie.split(';')[0],'X-CSRF-Token':owner.session.csrf},body:JSON.stringify(data)}),env,true);if(!response.ok)throw Error('Synthetic preview preparation failed');return response.json();}
 let room=await env.DB.prepare('SELECT id,invite_token FROM community_rooms WHERE owner_id=? AND closed_at=0 ORDER BY created_at LIMIT 1').bind(owner.profileId).first();
 if(!room){const id=crypto.randomUUID();await call('/rooms','POST',{id,name:'Preview study group',visibility:'private',capacity:4,goalMinutes:120});room=await env.DB.prepare('SELECT id,invite_token FROM community_rooms WHERE id=?').bind(id).first();}
 let activity=await env.DB.prepare("SELECT id FROM community_activities WHERE room_id=? ORDER BY CASE WHEN status='ended' THEN 0 WHEN status='running' THEN 1 WHEN status='scheduled' THEN 2 ELSE 3 END,created_at DESC LIMIT 1").bind(room.id).first();
 if(!activity){const id=crypto.randomUUID();await call('/rooms/'+room.id+'/activities','POST',{id,subject:'general',kind:'focus',...activityWall(at+15*60000,'UTC'),zone:'UTC',focusMinutes:25,breakMinutes:5});activity={id};}
 if(env.FIXTURE_MEMBERS_QA==='true'&&role==='owner'){
  const partner=await prepare('learner'),existing=await env.DB.prepare('SELECT 1 AS found FROM community_members WHERE room_id=? AND profile_id=?').bind(room.id,partner.profileId).first();
  if(!existing){const response=await api(new Request(url.origin+'/api/community/rooms/'+room.id+'/join',{method:'POST',headers:{origin:url.origin,'Content-Type':'application/json',cookie:partner.session.cookie.split(';')[0],'X-CSRF-Token':partner.session.csrf},body:JSON.stringify({accepted:true,code:room.invite_token})}),env,true);if(!response.ok)throw Error('Synthetic member preparation failed');}
 }
 const viewer=role==='owner'?owner:await prepare('learner'),membership=await env.DB.prepare('SELECT 1 AS joined FROM community_members WHERE room_id=? AND profile_id=? AND banned=0 AND left_at=0').bind(room.id,viewer.profileId).first();
 const destination=new URL('/study-groups',url.origin);if(membership)destination.searchParams.set('room',room.id);else destination.searchParams.set('invite',room.invite_token);destination.searchParams.set('activity',activity.id);
 return new Response(null,{status:303,headers:{Location:destination.pathname+destination.search,'Set-Cookie':viewer.session.cookie,'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});
}
