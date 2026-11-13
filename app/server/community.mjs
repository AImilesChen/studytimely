import {ApiError,fail,result,body,identity,rateLimit,randomToken} from './auth-shared.mjs';
import {COMMUNITY,utcDay,weekStart,nickname,cleanText,roomInput,creditWindow,communityRules} from '../src/lib/community-model.mjs';
const uuid=value=>typeof value==='string'&&/^[a-f0-9-]{36}$/.test(value);
const admins=env=>(env.COMMUNITY_ADMIN_EMAILS||'').toLowerCase().split(/[\s,;]+/).filter(Boolean);
const q=(env,sql,...args)=>env.DB.prepare(sql).bind(...args);
const rows=async statement=>(await statement.all()).results||[];
export async function communityMaintenance(env,at=Date.now()){
 if(!env.DB)return;const today=utcDay(at),yesterday=utcDay(at-86400000),year=utcDay(at-365*86400000);
 await env.DB.batch([
  q(env,`INSERT INTO community_rank_history(day,profile_id,rank,seconds)
   SELECT ?,d.profile_id,RANK() OVER (ORDER BY d.seconds DESC),d.seconds FROM community_daily d JOIN community_profiles p ON p.id=d.profile_id WHERE d.day=? AND p.public_ranking=1 AND d.seconds>0
   ON CONFLICT(day,profile_id) DO UPDATE SET rank=excluded.rank,seconds=excluded.seconds`,yesterday,yesterday),
  q(env,'DELETE FROM community_messages WHERE created_at<?',at-30*86400000),
  q(env,'DELETE FROM community_reports WHERE created_at<?',at-90*86400000),
  q(env,'DELETE FROM community_credits WHERE created_at<?',at-30*86400000),
  q(env,'DELETE FROM community_rank_history WHERE day<?',year),
  q(env,'DELETE FROM community_daily WHERE day<?',year),
  q(env,'DELETE FROM community_room_daily WHERE day<?',year),
  q(env,'DELETE FROM oauth_states WHERE expires_at<?',at),q(env,'DELETE FROM rate_limits WHERE expires_at<?',at),q(env,'DELETE FROM sessions WHERE expires_at<?',at),q(env,'DELETE FROM login_codes WHERE expires_at<?',at),
  q(env,'UPDATE community_members SET last_seen=0 WHERE last_seen<?',at-90000),
  q(env,"UPDATE community_timers SET status='check' WHERE status='running' AND last_at<?",at-90000)
 ]);return {day:today,snapshot:yesterday};
}
export function createCommunityApi({now=Date.now}={}){
 return async(request,env,enabled=true,ctx)=>{
  const url=new URL(request.url),path=url.pathname.replace('/api/community',''),method=request.method,at=Math.floor(now()/1000)*1000,day=utcDay(at);
  try{
   if(!enabled||!env.DB)fail(503,'COMMUNITY_UNAVAILABLE','Study groups are not available here yet. Local tools still work.');
   const user=await identity(request,env,at,false),profile=user?await q(env,'SELECT * FROM community_profiles WHERE account_id=?',user.id).first():null,isAdmin=!!user?.google_sub&&admins(env).includes(user.email.toLowerCase());
   const requireUser=()=>{if(!user)fail(401,'NO_AUTH','Sign in with Google to participate.');if(!user.google_sub)fail(403,'GOOGLE_REQUIRED','Link Google in Account before joining study groups.');};
   const requireProfile=()=>{requireUser();if(!profile)fail(409,'PROFILE_REQUIRED','Choose your community nickname first.');};
   const signal=async(room,metrics=false)=>{if(!env.ROOMS)return;await env.ROOMS.get(env.ROOMS.idFromName(room)).fetch('https://room.internal/notify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({metrics})}).catch(()=>{});};
   const timer=()=>profile?q(env,'SELECT * FROM community_timers WHERE profile_id=?',profile.id).first():null;
   async function settle(current,pause=false){
    const window=creditWindow(current,at),statements=[];let credited=0,capReached=false;
    for(const [i,segment] of window.segments.entries()){
     const daily=await q(env,'SELECT seconds FROM community_daily WHERE profile_id=? AND day=?',profile.id,segment.day).first();const seconds=Math.min(segment.seconds,Math.max(0,COMMUNITY.dailyCapSeconds-(daily?.seconds||0)));if(segment.day===day&&(daily?.seconds||0)+seconds>=COMMUNITY.dailyCapSeconds)capReached=true;if(!seconds)continue;credited+=seconds;
     statements.push(q(env,`INSERT INTO community_credits(id,profile_id,room_id,day,seconds,created_at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM community_timers t JOIN community_members m ON m.profile_id=t.profile_id AND m.room_id=t.room_id JOIN community_rooms r ON r.id=t.room_id WHERE t.profile_id=? AND t.lease=? AND t.last_at=? AND t.status='running' AND m.banned=0 AND m.left_at=0 AND r.closed_at=0) ON CONFLICT(id) DO NOTHING`,current.lease+':'+current.last_at+':'+i,profile.id,current.room_id,segment.day,seconds,at,profile.id,current.lease,current.last_at));
    }
    const status=pause?'paused':window.needsCheck||capReached?'check':'running';
    statements.push(q(env,"UPDATE community_timers SET last_at=?,status=?,credited_seconds=credited_seconds+? WHERE profile_id=? AND lease=? AND last_at=? AND status='running'",at,status,credited,profile.id,current.lease,current.last_at));
    await env.DB.batch(statements);return {timer:await timer(),serverNow:at,needsCheck:window.needsCheck,capReached};
   }
   async function roomContext(id,owner=false){
    if(!uuid(id))fail(404,'NOT_FOUND','This room is not available.');const room=await q(env,'SELECT * FROM community_rooms WHERE id=?',id).first();
    const membership=profile?await q(env,'SELECT * FROM community_members WHERE room_id=? AND profile_id=?',id,profile.id).first():null;
    const member=membership&&!membership.banned&&!membership.left_at;
    if(!room||room.closed_at&&room.owner_id!==profile?.id&&!isAdmin||room.visibility==='private'&&!member&&!isAdmin)fail(404,'NOT_FOUND','This room is not available.');
    if(owner&&room.owner_id!==profile?.id&&!isAdmin)fail(403,'FORBIDDEN','Only the room owner can manage this room.');return {room,membership,member};
   }
   const requireMember=r=>{requireProfile();if(!r.member||r.room.closed_at)fail(403,'MEMBERSHIP','Join an open room to use this action.');};
   if(path==='/me'&&method==='GET'){
    const mine=profile?await rows(q(env,`SELECT r.id,r.name,r.visibility,r.owner_id,r.closed_at FROM community_rooms r JOIN community_members m ON m.room_id=r.id WHERE m.profile_id=? AND m.banned=0 AND m.left_at=0 ORDER BY (r.closed_at>0) ASC,r.created_at DESC LIMIT 10`,profile.id)):[];
    const history=profile?await rows(q(env,'SELECT day,rank,seconds FROM community_rank_history WHERE profile_id=? ORDER BY day DESC LIMIT 30',profile.id)):[];
    const blocks=profile?await rows(q(env,'SELECT b.blocked_id AS id,p.nickname FROM community_blocks b JOIN community_profiles p ON p.id=b.blocked_id WHERE b.blocker_id=?',profile.id)):[];
    return result({profile:profile?{id:profile.id,nickname:profile.nickname,publicRanking:!!profile.public_ranking,version:profile.version}:null,rooms:mine,history,blocks,timer:await timer(),serverNow:at,creditedToday:profile?(await q(env,'SELECT seconds FROM community_daily WHERE profile_id=? AND day=?',profile.id,day).first())?.seconds||0:0,moderator:isAdmin,moderationAvailable:admins(env).length>0,rules:communityRules()});
   }
   if(path==='/profile'&&method==='PUT'){
    requireUser();const input=await body(request);if(input.accepted!==true||typeof input.publicRanking!=='boolean')fail(400,'COMMUNITY_POLICY','Confirm the community rules and choose whether to join public rankings.');
    const name=nickname(input.nickname);await rateLimit(env,'profile',user.id,20,3600000,at);
    const version=profile?input.version:0;if(!Number.isInteger(version)||version<0)fail(400,'VERSION','Reload your community profile before saving.');
    const saved=profile?await q(env,'UPDATE community_profiles SET nickname=?,public_ranking=?,version=version+1 WHERE account_id=? AND version=? RETURNING id,version',name,input.publicRanking?1:0,user.id,version).first():await q(env,'INSERT INTO community_profiles(id,account_id,nickname,public_ranking,accepted_at,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(account_id) DO NOTHING RETURNING id,version',crypto.randomUUID(),user.id,name,input.publicRanking?1:0,at,at).first();
    if(!saved)fail(409,'CONFLICT','Your community profile changed elsewhere. Reload it before saving.');
    if(!input.publicRanking&&profile)await q(env,'DELETE FROM community_rank_history WHERE profile_id=?',profile.id).run();return result({saved:true,version:saved.version});
   }
   if(path==='/rooms'&&method==='GET'){
    const list=await rows(q(env,`SELECT r.id,r.name,r.goal_minutes,r.capacity,p.nickname AS host,
     (SELECT count(*) FROM community_members m WHERE m.room_id=r.id AND m.banned=0 AND m.left_at=0) AS members,
     (SELECT count(*) FROM community_members m WHERE m.room_id=r.id AND m.banned=0 AND m.left_at=0 AND m.last_seen>?) AS online,
     COALESCE((SELECT sum(seconds) FROM community_room_daily d WHERE d.room_id=r.id AND d.day=?),0) AS today_seconds
     FROM community_rooms r JOIN community_profiles p ON p.id=r.owner_id WHERE r.visibility='public' AND r.closed_at=0 ORDER BY r.created_at DESC LIMIT 30`,at-75000,day));
    return result({rooms:list});
   }
   if(path==='/rooms'&&method==='POST'){
    requireProfile();const input=await body(request),data=roomInput(input);if(!uuid(input.id))fail(400,'INVALID','Provide a new room request ID.');
    const exists=await q(env,'SELECT owner_id FROM community_rooms WHERE id=?',input.id).first();if(exists){if(exists.owner_id!==profile.id)fail(409,'CONFLICT','Choose a new room request.');return result({id:input.id});}
    await rateLimit(env,'room-create',profile.id,5,86400000,at);await rateLimit(env,'room-create-ip',request.headers.get('cf-connecting-ip')||'local',20,86400000,at);
    await env.DB.batch([q(env,'INSERT INTO community_rooms(id,owner_id,name,visibility,goal_minutes,capacity,invite_token,created_at) VALUES(?,?,?,?,?,?,?,?)',input.id,profile.id,data.name,data.visibility,data.goalMinutes,data.capacity,randomToken().slice(0,24),at),q(env,'INSERT INTO community_members(room_id,profile_id,joined_at) VALUES(?,?,?)',input.id,profile.id,at)]);
    return result({id:input.id},201);
   }
   if(path==='/invite'&&method==='POST'){
    requireProfile();const input=await body(request),code=String(input.code||'').trim().toLowerCase();await rateLimit(env,'invite-lookup',user.id,30,3600000,at);await rateLimit(env,'invite-ip',request.headers.get('cf-connecting-ip')||'local',60,3600000,at);
    if(!/^[a-f0-9]{24}$/.test(code))fail(404,'INVITE','This invitation is invalid or closed.');const room=await q(env,'SELECT id,name,visibility FROM community_rooms WHERE invite_token=? AND invitations_open=1 AND closed_at=0',code).first();
    if(!room)fail(404,'INVITE','This invitation is invalid or closed.');return result({room});
   }
   const match=path.match(/^\/rooms\/([a-f0-9-]{36})(?:\/(join|leave|settings|round|members|messages|reports|socket))?$/);
   if(match){
    const id=match[1],action=match[2]||'';
    // Invitation possession is checked in the join transaction path, before exposing private content.
    if(action==='join'&&method==='POST'){
     requireProfile();const input=await body(request);if(input.accepted!==true)fail(400,'CONSENT','Confirm what room members can see before joining.');
     const room=await q(env,'SELECT * FROM community_rooms WHERE id=? AND closed_at=0',id).first();if(!room)fail(404,'NOT_FOUND','Room unavailable.');
     if(!room.invitations_open)fail(403,'INVITES_CLOSED','The owner has closed invitations.');if(room.visibility==='private'&&(!input.code||room.invite_token!==String(input.code).trim().toLowerCase()))fail(404,'NOT_FOUND','Use the private invitation link.');
     const old=await q(env,'SELECT * FROM community_members WHERE room_id=? AND profile_id=?',id,profile.id).first();if(old?.banned)fail(403,'BANNED','The owner has removed your access.');if(old&&!old.left_at)return result({joined:true,id});
     if(old?.left_at&&await q(env,`SELECT count(*) AS n FROM community_members m JOIN community_rooms r ON r.id=m.room_id WHERE m.profile_id=? AND m.left_at=0 AND m.banned=0 AND r.closed_at=0`,profile.id).first().then(x=>x.n>=10))fail(409,'MEMBERSHIP_LIMIT','Leave another room before joining.');
     await rateLimit(env,'join',profile.id,30,3600000,at);
     await q(env,'INSERT INTO community_members(room_id,profile_id,joined_at) VALUES(?,?,?) ON CONFLICT(room_id,profile_id) DO UPDATE SET left_at=0,joined_at=excluded.joined_at WHERE community_members.banned=0',id,profile.id,at).run();await signal(id);return result({joined:true,id});
    }
    const r=await roomContext(id,action==='settings'||action==='round'||action==='members');
    if(!action&&method==='GET'){
     const members=await rows(q(env,`SELECT p.id,p.nickname,m.last_seen,m.muted_until,
      COALESCE((SELECT seconds FROM community_room_daily d WHERE d.room_id=? AND d.profile_id=p.id AND d.day=?),0) AS today_seconds,
      COALESCE((SELECT sum(seconds) FROM community_room_daily d WHERE d.room_id=? AND d.profile_id=p.id),0) AS total_seconds,
      t.status AS timer_status FROM community_members m JOIN community_profiles p ON p.id=m.profile_id LEFT JOIN community_timers t ON t.profile_id=p.id AND t.room_id=m.room_id
      WHERE m.room_id=? AND m.banned=0 AND m.left_at=0 ORDER BY today_seconds DESC,p.nickname LIMIT 24`,id,day,id,id));
     const totals=await q(env,'SELECT COALESCE(sum(seconds),0) AS total_seconds,COALESCE(sum(CASE WHEN day=? THEN seconds ELSE 0 END),0) AS today_seconds FROM community_room_daily WHERE room_id=?',day,id).first();
     const messages=r.member?await rows(q(env,`SELECT m.id,m.author_id,p.nickname,m.text,m.created_at FROM community_messages m JOIN community_profiles p ON p.id=m.author_id WHERE m.room_id=? AND m.hidden=0 AND m.created_at>=? AND NOT EXISTS(SELECT 1 FROM community_blocks b WHERE b.blocker_id=? AND b.blocked_id=m.author_id) ORDER BY m.created_at DESC,m.id DESC LIMIT 50`,id,at-30*86400000,profile.id)):[];
     return result({room:{id,name:r.room.name,visibility:r.room.visibility,host:members.find(m=>m.id===r.room.owner_id)?.nickname||'Room owner',ownerId:r.room.owner_id,goalMinutes:r.room.goal_minutes,capacity:r.room.capacity,invitationsOpen:!!r.room.invitations_open,roundEndsAt:r.room.round_ends_at,closed:!!r.room.closed_at,version:r.room.version,...(r.room.owner_id===profile?.id?{inviteCode:r.room.invite_token}:{})},members:members.map(m=>({...m,online:m.last_seen>at-75000})),totals,messages:messages.reverse(),member:!!r.member,owner:r.room.owner_id===profile?.id,mutedUntil:r.membership?.muted_until||0,removedMembers:r.room.owner_id===profile?.id?await rows(q(env,'SELECT p.id,p.nickname FROM community_members m JOIN community_profiles p ON p.id=m.profile_id WHERE m.room_id=? AND m.banned=1',id)):[],moderationAvailable:admins(env).length>0,serverNow:at});
    }
    if(action==='leave'&&method==='POST'){
     requireMember(r);if(r.room.owner_id===profile.id)fail(409,'OWNER','Close the room before leaving as its owner.');
     await env.DB.batch([q(env,'UPDATE community_members SET left_at=?,last_seen=0 WHERE room_id=? AND profile_id=?',at,id,profile.id),q(env,"UPDATE community_timers SET status='paused' WHERE profile_id=? AND room_id=?",profile.id,id)]);await signal(id);return result({left:true});
    }
    if(action==='settings'&&method==='PATCH'){
     requireProfile();const input=await body(request),data=roomInput({...input,visibility:r.room.visibility});if(!Number.isInteger(input.version))fail(400,'VERSION','Reload the room before saving settings.');
     const count=await q(env,'SELECT count(*) AS n FROM community_members WHERE room_id=? AND banned=0 AND left_at=0',id).first();if(data.capacity<count.n)fail(409,'CAPACITY','Capacity cannot be smaller than current membership.');
     const updated=await q(env,'UPDATE community_rooms SET name=?,goal_minutes=?,capacity=?,invitations_open=?,invite_token=?,closed_at=?,round_ends_at=CASE WHEN ? THEN 0 ELSE round_ends_at END,version=version+1 WHERE id=? AND version=? RETURNING version',data.name,data.goalMinutes,data.capacity,input.invitationsOpen===true?1:0,input.rotateInvite===true?randomToken().slice(0,24):r.room.invite_token,input.close===true?at:r.room.closed_at,input.close===true?1:0,id,input.version).first();if(!updated)fail(409,'CONFLICT','Room settings changed. Reload and review before saving again.');
     if(input.close===true)await q(env,"UPDATE community_timers SET status='paused' WHERE room_id=?",id).run();await signal(id);return result({saved:true,version:updated.version});
    }
    if(action==='round'&&method==='POST'){
     requireMember(r);const input=await body(request),minutes=Number(input.minutes);if(!Number.isInteger(minutes)||minutes<0||minutes>25)fail(400,'INVALID','Choose 1–25 minutes, or cancel the round.');
     await q(env,'UPDATE community_rooms SET round_ends_at=? WHERE id=?',minutes?at+minutes*60000:0,id).run();await signal(id);return result({saved:true});
    }
    if(action==='members'&&method==='PATCH'){
     requireMember(r);const input=await body(request);if(!uuid(input.profileId)||input.profileId===r.room.owner_id)fail(400,'TARGET','The room owner cannot be removed or muted.');
     if(!['mute','unmute','remove','restore'].includes(input.action))fail(400,'INVALID','Choose a moderation action.');
     await q(env,'UPDATE community_members SET banned=CASE WHEN ? THEN 1 WHEN ? THEN 0 ELSE banned END,muted_until=CASE WHEN ? THEN ? WHEN ? THEN 0 ELSE muted_until END,last_seen=CASE WHEN ? THEN 0 ELSE last_seen END WHERE room_id=? AND profile_id=?',input.action==='remove'?1:0,input.action==='restore'?1:0,input.action==='mute'?1:0,at+3600000,input.action==='unmute'?1:0,input.action==='remove'?1:0,id,input.profileId).run();
     if(input.action==='remove')await q(env,"UPDATE community_timers SET status='paused' WHERE profile_id=? AND room_id=?",input.profileId,id).run();await signal(id);return result({saved:true});
    }
    if(action==='messages'&&method==='DELETE'){
     requireMember(r);const input=await body(request);if(!uuid(input.id))fail(400,'INVALID','Choose a message.');const message=await q(env,'SELECT author_id FROM community_messages WHERE id=? AND room_id=?',input.id,id).first();if(!message)fail(404,'NOT_FOUND','Message unavailable.');
     if(message.author_id===profile.id)await q(env,'DELETE FROM community_messages WHERE id=? AND author_id=?',input.id,profile.id).run();else if(r.room.owner_id===profile.id||isAdmin)await q(env,'UPDATE community_messages SET hidden=1 WHERE id=?',input.id).run();else fail(403,'FORBIDDEN','Only the author or a room moderator can remove this message.');await signal(id);return result({removed:true});
    }
    if(action==='messages'&&method==='POST'){
     requireMember(r);if(!admins(env).length)fail(503,'MODERATION_UNAVAILABLE','Chat opens after a platform moderator has been configured.');if(r.membership.muted_until>at)fail(403,'MUTED','You are currently muted in this room.');
     const input=await body(request),text=cleanText(input.text,{max:500,label:'Message'});if(!uuid(input.id))fail(400,'INVALID','Provide a message request ID.');
     const prior=await q(env,'SELECT author_id,room_id,text FROM community_messages WHERE id=?',input.id).first();if(prior){if(prior.author_id!==profile.id||prior.room_id!==id||prior.text!==text)fail(409,'CONFLICT','Use a new message request ID.');return result({sent:true,id:input.id});}
     await rateLimit(env,'chat-fast',profile.id,5,10000,at);await rateLimit(env,'chat-hour',profile.id,200,3600000,at);
     const written=await q(env,`INSERT INTO community_messages(id,room_id,author_id,text,created_at) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM community_members WHERE room_id=? AND profile_id=? AND banned=0 AND left_at=0 AND muted_until<=?) RETURNING id`,input.id,id,profile.id,text,at,id,profile.id,at).first();if(!written)fail(403,'MEMBERSHIP','Your room permissions changed.');await signal(id);return result({sent:true,id:input.id},201);
    }
    if(action==='reports'&&method==='POST'){
     requireMember(r);const input=await body(request);if(!['spam','harassment','privacy','other'].includes(input.reason)||!uuid(input.messageId))fail(400,'INVALID','Choose a message and report reason.');
     const message=await q(env,'SELECT * FROM community_messages WHERE id=? AND room_id=?',input.messageId,id).first();if(!message)fail(404,'NOT_FOUND','This message is not available.');
     await rateLimit(env,'report',profile.id,10,86400000,at);await q(env,'INSERT INTO community_reports(id,room_id,reporter_id,subject_id,message_id,reason,detail,excerpt,created_at) VALUES(?,?,?,?,?,?,?,?,?)',crypto.randomUUID(),id,profile.id,message.author_id,message.id,input.reason,typeof input.detail==='string'&&input.detail.trim()?cleanText(input.detail,{max:500,label:'Report details'}):'',message.text,at).run();return result({reported:true});
    }
    if(action==='socket'&&method==='GET'){
     requireMember(r);if(request.headers.get('origin')!==url.origin||request.headers.get('upgrade')?.toLowerCase()!=='websocket')fail(403,'ORIGIN','Open the room connection from StudyTimely.');if(!env.ROOMS)fail(503,'REALTIME_UNAVAILABLE','Live connection unavailable. You can refresh the room.');
     const headers=new Headers({'Upgrade':'websocket','X-Room-Id':id,'X-Profile-Id':profile.id,'X-Session-Hash':user.sessionHash});return env.ROOMS.get(env.ROOMS.idFromName(id)).fetch(new Request('https://room.internal/connect',{headers}));
    }
    fail(405,'METHOD','This room action is not supported.');
   }
   if(path==='/blocks'&&method==='POST'){
    requireProfile();const input=await body(request);if(!uuid(input.profileId)||input.profileId===profile.id)fail(400,'INVALID','Choose another community member.');
    if(input.block===false)await q(env,'DELETE FROM community_blocks WHERE blocker_id=? AND blocked_id=?',profile.id,input.profileId).run();else await q(env,'INSERT INTO community_blocks(blocker_id,blocked_id) VALUES(?,?) ON CONFLICT DO NOTHING',profile.id,input.profileId).run();return result({saved:true});
   }
   if(path==='/moderation'&&method==='GET'){
    requireProfile();const list=await rows(q(env,`SELECT x.id,x.room_id,r.name AS room_name,r.owner_id,p.nickname AS author,x.subject_id,x.reason,x.detail,x.excerpt,x.created_at FROM community_reports x JOIN community_rooms r ON r.id=x.room_id LEFT JOIN community_profiles p ON p.id=x.subject_id WHERE x.status='open' AND (?=1 OR (r.owner_id=? AND COALESCE(x.subject_id,'')<>?)) ORDER BY x.created_at DESC LIMIT 100`,isAdmin?1:0,profile.id,profile.id));return result({reports:list,platformModerator:isAdmin});
   }
   if(path==='/moderation'&&method==='POST'){
    requireProfile();const input=await body(request);if(!uuid(input.id)||!['dismiss','hide','mute','remove'].includes(input.action))fail(400,'INVALID','Choose a report and review action.');
    const report=await q(env,'SELECT x.*,r.owner_id FROM community_reports x JOIN community_rooms r ON r.id=x.room_id WHERE x.id=?',input.id).first();if(!report||(!isAdmin&&(report.owner_id!==profile.id||report.subject_id===profile.id)))fail(403,'FORBIDDEN','This report needs an authorised reviewer.');
    const statements=[q(env,"UPDATE community_reports SET status=?,reviewed_at=?,reviewer_id=? WHERE id=? AND status='open'",input.action==='dismiss'?'dismissed':'actioned',at,profile.id,input.id)];
    if(input.action==='hide'&&report.message_id)statements.push(q(env,'UPDATE community_messages SET hidden=1 WHERE id=?',report.message_id));
    if(['mute','remove'].includes(input.action)&&report.subject_id){if(report.subject_id===report.owner_id&&!isAdmin)fail(403,'FORBIDDEN','A platform moderator must review the owner.');statements.push(q(env,'UPDATE community_members SET muted_until=?,banned=CASE WHEN ? THEN 1 ELSE banned END WHERE room_id=? AND profile_id=?',at+86400000,input.action==='remove'?1:0,report.room_id,report.subject_id));if(input.action==='remove')statements.push(q(env,"UPDATE community_timers SET status='paused' WHERE profile_id=? AND room_id=?",report.subject_id,report.room_id));}
    if(input.action==='remove'&&report.subject_id===report.owner_id){statements.push(q(env,'UPDATE community_rooms SET closed_at=?,invitations_open=0,round_ends_at=0,version=version+1 WHERE id=?',at,report.room_id),q(env,"UPDATE community_timers SET status='paused' WHERE room_id=?",report.room_id));}
    await env.DB.batch(statements);await signal(report.room_id);return result({reviewed:true});
   }
   if(path==='/leaderboard'&&method==='GET'){
    const period=['today','week','streak'].includes(url.searchParams.get('period'))?url.searchParams.get('period'):'today';let list;
    if(period==='streak')list=await rows(q(env,`WITH days AS (SELECT d.profile_id,CAST(julianday(?)-julianday(d.day) AS INTEGER) AS gap,ROW_NUMBER() OVER(PARTITION BY d.profile_id ORDER BY d.day DESC)-1 AS idx FROM community_daily d JOIN community_profiles p ON p.id=d.profile_id WHERE p.public_ranking=1 AND d.seconds>=60 AND d.day<=?),groups AS (SELECT *,MIN(gap) OVER(PARTITION BY profile_id) AS base FROM days),counts AS (SELECT profile_id,count(*) AS score FROM groups WHERE base<=1 AND gap-idx=base GROUP BY profile_id) SELECT p.id,p.nickname,c.score FROM counts c JOIN community_profiles p ON p.id=c.profile_id ORDER BY c.score DESC,p.id LIMIT 100`,day,day));
    else list=await rows(q(env,`SELECT p.id,p.nickname,SUM(d.seconds) AS score FROM community_daily d JOIN community_profiles p ON p.id=d.profile_id WHERE p.public_ranking=1 AND d.day>=? AND d.day<=? GROUP BY p.id,p.nickname HAVING score>0 ORDER BY score DESC,p.id LIMIT 100`,period==='week'?weekStart(at):day,day));
    let rank=0,last=null;return result({period,rows:list.map((r,i)=>{if(r.score!==last)rank=i+1;last=r.score;return {...r,rank};}),rules:communityRules(),day});
   }
   if(path.startsWith('/timer')&&method==='POST'){
    requireProfile();const input=await body(request);await rateLimit(env,'timer',profile.id,400,3600000,at);
    if(path==='/timer/start'){
     const r=await roomContext(input.roomId);requireMember(r);const old=await timer();
     if(old?.status==='running'&&at-old.last_at<=90000&&old.check_at>at)fail(409,'ACTIVE_TIMER','Pause the active room timer on the other tab or device first.');
     if(old?.status==='running')await settle(old);const today=await q(env,'SELECT seconds FROM community_daily WHERE profile_id=? AND day=?',profile.id,day).first();if((today?.seconds||0)>=COMMUNITY.dailyCapSeconds)fail(409,'DAILY_CAP','Your 8-hour UTC daily ranking limit is reached. Local tools remain available.');
     const lease=randomToken(),checkAt=input.joinRound===true&&r.room.round_ends_at>at?Math.min(at+COMMUNITY.checkInMs,r.room.round_ends_at):at+COMMUNITY.checkInMs;
     const saved=await q(env,`INSERT INTO community_timers(profile_id,room_id,lease,status,started_at,last_at,check_at) VALUES(?,?,?,'running',?,?,?) ON CONFLICT(profile_id) DO UPDATE SET room_id=excluded.room_id,lease=excluded.lease,status='running',started_at=excluded.started_at,last_at=excluded.last_at,check_at=excluded.check_at,credited_seconds=0 WHERE community_timers.status<>'running' OR community_timers.last_at<? RETURNING *`,profile.id,r.room.id,lease,at,at,checkAt,at-90000).first();if(!saved)fail(409,'ACTIVE_TIMER','A room timer was started on another device.');await signal(r.room.id);return result({timer:saved,serverNow:at});
    }
    if(!['/timer/heartbeat','/timer/pause'].includes(path))fail(404,'NOT_FOUND','Unknown timer action.');
    const current=await timer();if(!current||typeof input.lease!=='string'||input.lease!==current.lease)fail(409,'LEASE','This timer belongs to another tab or device. Refresh before continuing.');
    const r=await roomContext(current.room_id);requireMember(r);if(current.status!=='running')return result({timer:current,serverNow:at});
    const settled=await settle(current,path==='/timer/pause');await signal(current.room_id,path==='/timer/heartbeat');return result(settled);
   }
   fail(404,'NOT_FOUND','This community endpoint does not exist.');
  }catch(error){
   if(error instanceof ApiError)return result({error:{code:error.code,message:error.message}},error.status);
   const message=String(error?.message||'');for(const [key,text]of [['ROOM_FULL','This room is full.'],['ROOM_LIMIT','You can own up to three open rooms.'],['MEMBERSHIP_LIMIT','Leave another room before joining.'],['DAILY_CAP','The daily credited-time limit has been reached.']])if(message.includes(key))return result({error:{code:key,message:text}},409);
   if(error?.constructor===Error&&!/SQL|D1|constraint|database|syntax|no such|FOREIGN KEY/i.test(message)&&/must|Choose|nickname|required|characters|Use a/.test(message))return result({error:{code:'INVALID',message}},400);
   return result({error:{code:'UNAVAILABLE',message:'The community service is temporarily unavailable. Your local tools still work.'}},503);
  }
 };
}
