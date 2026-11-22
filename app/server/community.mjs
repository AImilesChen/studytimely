import {groupAdvanced,advancedPreview,maintainGroupAdvanced,isGroupManager,quietChatSQL} from './group-advanced.mjs';
import {settleRoomTimer} from './room-timer.mjs';
import {accessSelection} from './room-access-actions.mjs';
import {roomAccess,participationSQL,roomActiveSQL,requireParticipation} from './room-access.mjs';
import {ApiError,fail,result,body,identity,rateLimit,randomToken} from './auth-shared.mjs';
import {COMMUNITY,utcDay,weekStart,nickname,cleanText,roomInput,communityRules} from '../src/lib/community-model.mjs';
import {reviewConfiguration,reviewAvailability,enforceLocalContent,reviewChat} from './chat-review.mjs';
import {companionAction} from './companion-actions.mjs';
import {communityEntitlements,ownerEntitlements,checkRoomCapacity,ownerLimitSQL,groupLimitSQL,groupManagerSQL,previewSQL} from './community-entitlements.mjs';
import {companionState} from '../src/lib/companion-model.mjs';
import {legacyStudyMessage,studyMessage} from '../src/lib/study-messages.mjs';
import {reviewBudgetStatus} from './review-budget.mjs';
import {publicRanking,personalRanking} from './leaderboard.mjs';
import {roomActivities,saveRoomHome,finishDueActivities,activityTimerContext,withdrawRoomActivities} from './group-activities.mjs';
import {ACTIVITY_SUBJECTS} from '../src/lib/group-activities.mjs';
const uuid=value=>typeof value==='string'&&/^[a-f0-9-]{36}$/.test(value);
const admins=env=>(env.COMMUNITY_ADMIN_EMAILS||'').toLowerCase().split(/[\s,;]+/).filter(Boolean);
const q=(env,sql,...args)=>env.DB.prepare(sql).bind(...args);
const rows=async statement=>(await statement.all()).results||[];
export async function communityMaintenance(env,at=Date.now()){
 if(!env.DB)return;const today=utcDay(at),yesterday=utcDay(at-86400000),year=utcDay(at-365*86400000);
 for(const current of await rows(q(env,"SELECT * FROM community_timers WHERE status='running'")))if(!(await roomAccess(env,current.room_id,current.profile_id,at)).canParticipate)await settleRoomTimer(env,current,at,true);
 await env.DB.batch([
  q(env,`INSERT INTO community_rank_history(day,profile_id,rank,seconds)
   SELECT ?,d.profile_id,RANK() OVER (ORDER BY d.seconds DESC),d.seconds FROM community_daily d JOIN community_profiles p ON p.id=d.profile_id WHERE d.day=? AND p.public_ranking=1 AND d.seconds>0
   ON CONFLICT(day,profile_id) DO UPDATE SET rank=excluded.rank,seconds=excluded.seconds`,yesterday,yesterday),
  q(env,'DELETE FROM community_messages WHERE created_at<?',at-30*86400000),
  q(env,'DELETE FROM community_reports WHERE created_at<?',at-90*86400000),
  q(env,'DELETE FROM community_credits WHERE created_at<?',at-30*86400000),
  q(env,"UPDATE community_timers SET status='paused' WHERE activity_id IN (SELECT id FROM community_activities WHERE MAX(starts_at,started_at,ended_at)<?)",at-90*86400000),
  q(env,'DELETE FROM community_activities WHERE MAX(starts_at,started_at,ended_at)<?',at-90*86400000),
  q(env,'DELETE FROM community_interactions WHERE expires_at<=?',at),
  q(env,'DELETE FROM community_review_cache WHERE expires_at<=?',at),
  q(env,'DELETE FROM community_review_budgets WHERE expires_at<?',at),
  q(env,'DELETE FROM community_rank_history WHERE day<?',year),
  q(env,'DELETE FROM community_daily WHERE day<?',year),
  q(env,'DELETE FROM community_room_daily WHERE day<?',year),
  q(env,'DELETE FROM pending_google_registrations WHERE expires_at<=?',at),q(env,'DELETE FROM oauth_states WHERE expires_at<?',at),q(env,'DELETE FROM rate_limits WHERE expires_at<?',at),q(env,'DELETE FROM sessions WHERE expires_at<?',at),q(env,'DELETE FROM login_codes WHERE expires_at<?',at),
  q(env,'UPDATE community_members SET last_seen=0 WHERE last_seen<?',at-90000),
  q(env,`UPDATE community_timers SET status='paused' WHERE status='check' AND NOT ${participationSQL('community_timers.room_id','community_timers.profile_id',at)}`),
  q(env,"UPDATE community_timers SET status='check' WHERE status='running' AND last_at<?",at-90000)
 ]);await maintainGroupAdvanced(env,at);return {day:today,snapshot:yesterday};
}
export function createCommunityApi({now=Date.now,reviewFetch=fetch,reviewTimeoutMs=5000}={}){
 return async(request,env,enabled=true,ctx)=>{
  const url=new URL(request.url),path=url.pathname.replace('/api/community',''),method=request.method,at=Math.floor(now()/1000)*1000,day=utcDay(at);
  let availability;const review=()=>availability??=reviewAvailability(env,at);
  try{
   if(!enabled||!env.DB)fail(503,'COMMUNITY_UNAVAILABLE','Study groups are not available here yet. Local tools still work.');
   const user=await identity(request,env,at,false),profile=user?await q(env,'SELECT * FROM community_profiles WHERE account_id=?',user.id).first():null,isAdmin=!!user?.google_sub&&admins(env).includes(user.email.toLowerCase());
   let rights;const permissions=()=>rights??=communityEntitlements(env,user?.id,at);
   const requireUser=()=>{if(!user)fail(401,'NO_AUTH','Sign in with Google to participate.');if(!user.google_sub)fail(403,'GOOGLE_REQUIRED','Link Google in Account before joining study groups.');};
   const requireProfile=()=>{requireUser();if(!profile)fail(409,'PROFILE_REQUIRED','Choose your community nickname first.');};
   const signal=async(room,metrics=false)=>{if(!env.ROOMS)return;await env.ROOMS.get(env.ROOMS.idFromName(room)).fetch('https://room.internal/notify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({metrics})}).catch(()=>{});};
   const timer=()=>profile?q(env,'SELECT * FROM community_timers WHERE profile_id=?',profile.id).first():null;
   const settle=(current,pause=false)=>settleRoomTimer(env,current,at,pause);
   async function roomContext(id,owner=false){
    if(!uuid(id))fail(404,'NOT_FOUND','This room is not available.');const room=await q(env,'SELECT * FROM community_rooms WHERE id=?',id).first();
    const membership=profile?await q(env,'SELECT * FROM community_members WHERE room_id=? AND profile_id=?',id,profile.id).first():null;
    const member=membership&&!membership.banned&&!membership.left_at;
    if(!room||room.closed_at&&room.owner_id!==profile?.id&&!isAdmin||room.visibility==='private'&&!member&&!isAdmin)fail(404,'NOT_FOUND','This room is not available.');
    if(owner&&room.owner_id!==profile?.id&&!isAdmin)fail(403,'FORBIDDEN','Only the room owner can manage this room.');return {room,membership,member,access:await roomAccess(env,id,profile?.id,at)};
   }
   const requireMember=r=>{requireProfile();if(!r.member||r.room.closed_at)fail(403,'MEMBERSHIP','Join an open room to use this action.');};
   if(path==='/me'&&method==='GET'){
    const mine=profile?await rows(q(env,`SELECT r.id,r.name,r.visibility,r.owner_id,r.closed_at,r.capacity,r.study_subject AS subject,r.custom_theme AS customTheme,r.created_at,MIN(r.capacity,${groupLimitSQL('r.owner_id',at)}) AS place_limit,${roomActiveSQL('r',at)} AS room_active,${participationSQL('r.id','m.profile_id',at)} AS can_participate,(SELECT count(*) FROM community_members rm WHERE rm.room_id=r.id AND rm.banned=0 AND rm.left_at=0) AS member_count FROM community_rooms r JOIN community_members m ON m.room_id=r.id WHERE m.profile_id=? AND m.banned=0 AND m.left_at=0 ORDER BY (r.closed_at>0) ASC,r.created_at DESC LIMIT 30`,profile.id)):[];
    const history=profile?await rows(q(env,'SELECT day,rank,seconds FROM community_rank_history WHERE profile_id=? ORDER BY day DESC LIMIT 30',profile.id)):[];
    const blocks=profile?await rows(q(env,'SELECT b.blocked_id AS id,p.nickname FROM community_blocks b JOIN community_profiles p ON p.id=b.blocked_id WHERE b.blocker_id=?',profile.id)):[];
    const entitlements=await permissions();
    return result({roomOwnership:{limit:entitlements.roomLimit,openCount:profile?(await q(env,'SELECT count(*) AS n FROM community_rooms WHERE owner_id=? AND closed_at=0',profile.id).first()).n:0},entitlements,freeRoomSelection:profile?await q(env,'SELECT free_room_id AS roomId,version FROM community_room_preferences WHERE owner_id=?',profile.id).first():null,profile:profile?{id:profile.id,nickname:profile.nickname,publicRanking:!!profile.public_ranking,version:profile.version}:null,rooms:mine,history,blocks,timer:await timer(),serverNow:at,creditedToday:profile?(await q(env,'SELECT seconds FROM community_daily WHERE profile_id=? AND day=?',profile.id,day).first())?.seconds||0:0,moderator:isAdmin,moderationAvailable:admins(env).length>0,chatReviewAvailable:(await review()).available,review:await review(),rules:communityRules()});
   }
   if(path==='/group-preview'&&method==='POST'){requireProfile();return await advancedPreview({request,env,profile,user,at,now,settle,signal});}
   if(path==='/room-access'&&method==='PATCH'){requireProfile();return await accessSelection({request,env,profile,user,permissions,at,settle,signal});}
   if(path==='/profile'&&method==='PUT'){
    requireUser();const input=await body(request);if((!profile&&input.accepted!==true)||typeof input.publicRanking!=='boolean')fail(400,'COMMUNITY_POLICY','Confirm the community rules and choose whether to join public rankings.');
    const name=nickname(input.nickname);enforceLocalContent(name);await rateLimit(env,'profile',user.id,20,3600000,at);
    const version=profile?input.version:0;if(!Number.isInteger(version)||version<0)fail(400,'VERSION','Reload your community profile before saving.');
    const saved=profile?await q(env,'UPDATE community_profiles SET nickname=?,public_ranking=?,version=version+1 WHERE account_id=? AND version=? RETURNING id,version',name,input.publicRanking?1:0,user.id,version).first():await q(env,'INSERT INTO community_profiles(id,account_id,nickname,public_ranking,accepted_at,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(account_id) DO NOTHING RETURNING id,version',crypto.randomUUID(),user.id,name,input.publicRanking?1:0,at,at).first();
    if(!saved)fail(409,'CONFLICT','Your community profile changed elsewhere. Reload it before saving.');
    if(!input.publicRanking&&profile)await q(env,'DELETE FROM community_rank_history WHERE profile_id=?',profile.id).run();return result({saved:true,version:saved.version});
   }
   if(path==='/rooms'&&method==='GET'){
    const list=await rows(q(env,`SELECT ${roomActiveSQL('r',at)} AS room_active,r.id,r.name,r.study_subject AS subject,r.custom_theme AS customTheme,r.goal_minutes,r.capacity,MIN(r.capacity,${groupLimitSQL('r.owner_id',at)}) AS join_limit,p.nickname AS host,
     (SELECT count(*) FROM community_members m WHERE m.room_id=r.id AND m.banned=0 AND m.left_at=0) AS members,
     (SELECT count(*) FROM community_members m WHERE m.room_id=r.id AND m.banned=0 AND m.left_at=0 AND m.last_seen>? AND ${participationSQL('m.room_id','m.profile_id',at)}) AS online,
     (SELECT count(*) FROM community_members m JOIN community_timers t ON t.profile_id=m.profile_id AND t.room_id=m.room_id WHERE m.room_id=r.id AND m.banned=0 AND m.left_at=0 AND m.last_seen>? AND t.status='running' AND t.last_at>=? AND t.check_at>? AND ${participationSQL('m.room_id','m.profile_id',at)}) AS studying,
     COALESCE((SELECT sum(seconds) FROM community_room_daily d WHERE d.room_id=r.id AND d.day=?),0) AS today_seconds
     FROM community_rooms r JOIN community_profiles p ON p.id=r.owner_id LEFT JOIN community_entitlements e ON e.account_id=p.account_id AND e.expires_at>? WHERE r.visibility='public' AND r.closed_at=0 ORDER BY r.created_at DESC LIMIT 30`,at-75000,at-75000,at-COMMUNITY.maxHeartbeatGapMs,at,day,at));
    return result({rooms:list.map(r=>({...r,readOnly:!r.room_active,joinLimit:r.join_limit,capacity:Math.max(r.members,r.join_limit)}))});
   }
   if(path==='/rooms'&&method==='POST'){
    requireProfile();const input=await body(request),data=roomInput(input);enforceLocalContent(data.name);if(!uuid(input.id))fail(400,'INVALID','Provide a new room request ID.');
    const subject=input.subject??'general';if(!Object.hasOwn(ACTIVITY_SUBJECTS,subject))fail(400,'INVALID','Choose a supported room study theme.');
    const exists=await q(env,'SELECT owner_id FROM community_rooms WHERE id=?',input.id).first();if(exists){if(exists.owner_id!==profile.id)fail(409,'CONFLICT','Choose a new room request.');return result({id:input.id});}
    const entitlements=await permissions();
    if((await q(env,'SELECT count(*) AS n FROM community_rooms WHERE owner_id=? AND closed_at=0',profile.id).first()).n>=entitlements.roomLimit)fail(409,'ROOM_LIMIT','Your open-room limit is reached. Free accounts can own one room; active subscriptions allow up to ten. Open an existing room or close one before creating another.');
    checkRoomCapacity(data.capacity,entitlements);
    await rateLimit(env,'room-create',profile.id,10,86400000,at);await rateLimit(env,'room-create-ip',request.headers.get('cf-connecting-ip')||'local',20,86400000,at);
    await env.DB.batch([q(env,'INSERT INTO community_rooms(id,owner_id,name,visibility,goal_minutes,capacity,invite_token,created_at,study_subject) VALUES(?,?,?,?,?,?,?,?,?)',input.id,profile.id,data.name,data.visibility,data.goalMinutes,data.capacity,randomToken().slice(0,24),now(),subject),q(env,'INSERT INTO community_members(room_id,profile_id,joined_at) VALUES(?,?,?)',input.id,profile.id,at)]);
    return result({id:input.id},201);
   }
   if(path==='/invite'&&method==='POST'){
    requireProfile();const input=await body(request),code=String(input.code||'').trim().toLowerCase();await rateLimit(env,'invite-lookup',user.id,30,3600000,at);await rateLimit(env,'invite-ip',request.headers.get('cf-connecting-ip')||'local',60,3600000,at);
    if(!/^[a-f0-9]{24}$/.test(code))fail(404,'INVITE','This invitation is invalid or closed.');const room=await q(env,'SELECT id,name,owner_id,visibility,capacity,(SELECT count(*) FROM community_members m WHERE m.room_id=community_rooms.id AND m.banned=0 AND m.left_at=0) AS members,EXISTS(SELECT 1 FROM community_members m WHERE m.room_id=community_rooms.id AND m.profile_id=? AND m.banned=0 AND m.left_at=0) AS alreadyMember FROM community_rooms WHERE invite_token=? AND invitations_open=1 AND closed_at=0',profile.id,code).first();
    if(!room)fail(404,'INVITE','This invitation is invalid or closed.');const entitlement=await ownerEntitlements(env,room.owner_id,at),limit=Math.min(room.capacity,entitlement.memberLimit),readOnly=!(await roomAccess(env,room.id,null,at)).roomActive;delete room.owner_id;return result({room:{...room,readOnly,joinLimit:limit,capacity:Math.max(limit,room.members)}});
   }
   const advancedMatch=path.match(/^\/rooms\/([a-f0-9-]{36})\/advanced(?:\/([a-z-]+))?$/);
   if(advancedMatch){requireProfile();const r=await roomContext(advancedMatch[1]);return await groupAdvanced({request,env,at,r,profile,user,endpoint:advancedMatch[2]||'',now,signal,reviewFetch,reviewTimeoutMs});}
   const match=path.match(/^\/rooms\/([a-f0-9-]{36})(?:\/(join|leave|settings|round|members|messages|reports|socket|home|activities|presence|interactions|seats)(?:\/([a-f0-9-]{36})(?:\/(start|end|cancel|participation|withdraw|checkout))?)?)?$/);
   if(match){
    const id=match[1],action=match[2]||'';
    // Invitation possession is checked in the join transaction path, before exposing private content.
    if(action==='join'&&method==='POST'){
     requireProfile();const input=await body(request);if(input.accepted!==true)fail(400,'CONSENT','Confirm what room members can see before joining.');
     const room=await q(env,`SELECT *,MIN(capacity,${ownerLimitSQL}) join_limit FROM community_rooms WHERE id=? AND closed_at=0`,at,id).first();if(!room)fail(404,'NOT_FOUND','Room unavailable.');if(!(await roomAccess(env,id,null,at)).roomActive)fail(403,'ROOM_READ_ONLY','This room is read only under its owner’s current plan.');
     if(!room.invitations_open)fail(403,'INVITES_CLOSED','The owner has closed invitations.');if(room.visibility==='private'&&(!input.code||room.invite_token!==String(input.code).trim().toLowerCase()))fail(404,'NOT_FOUND','Use the private invitation link.');
     const old=await q(env,'SELECT * FROM community_members WHERE room_id=? AND profile_id=?',id,profile.id).first();if(old?.banned)fail(403,'BANNED','The owner has blocked you from rejoining this room.');if(old&&!old.left_at)return result({joined:true,id});
     if(old?.left_at&&await q(env,`SELECT count(*) AS n FROM community_members m JOIN community_rooms r ON r.id=m.room_id WHERE m.profile_id=? AND m.left_at=0 AND m.banned=0 AND r.closed_at=0 AND r.owner_id<>?`,profile.id,profile.id).first().then(x=>x.n>=10))fail(409,'MEMBERSHIP_LIMIT','Leave another room before joining.');
     await rateLimit(env,'join',profile.id,30,3600000,at);
     const joined=await q(env,`INSERT INTO community_members(room_id,profile_id,joined_at) SELECT ?,?,? WHERE (SELECT count(*) FROM community_members WHERE room_id=? AND banned=0 AND left_at=0)<(SELECT MIN(capacity,${ownerLimitSQL}) FROM community_rooms WHERE id=?) AND EXISTS(SELECT 1 FROM community_rooms join_room WHERE join_room.id='${id}' AND ${roomActiveSQL('join_room',Math.floor(now()))}) ON CONFLICT(room_id,profile_id) DO UPDATE SET left_at=0,joined_at=excluded.joined_at WHERE community_members.banned=0 RETURNING profile_id`,id,profile.id,at,id,at,id).first();
     if(!joined){const existing=await q(env,'SELECT 1 FROM community_members WHERE room_id=? AND profile_id=? AND banned=0 AND left_at=0',id,profile.id).first();if(!existing)fail(409,'ROOM_FULL','This room has reached its current member limit.');}await signal(id);return result({joined:true,id});
    }
    const r=await roomContext(id,action==='settings'||action==='round'||action==='seats');
    if(method!=='GET'&&!(action==='messages'&&method==='DELETE')&&!['leave','reports','members','settings','seats','activities'].includes(action)){requireProfile();requireParticipation(r.access);}
    if(action==='seats'&&method==='PATCH'){requireProfile();return await accessSelection({request,env,profile,user,room:r.room,permissions,at,settle,signal});}
    if(['presence','interactions'].includes(action)&&method==='POST'){requireMember(r);return await companionAction({action,request,env,r,profile,user,at,timer,settle,signal,now});}
    if(action==='activities')return await roomActivities({request,env,at,r,profile,user,requireProfile,isAdmin,activityId:match[3],operation:match[4],settle,signal,reviewFetch,reviewTimeoutMs,now});
    if(action==='home'&&method==='PATCH')return await saveRoomHome({request,env,at,r,profile,user,isAdmin,signal,now,reviewFetch,reviewTimeoutMs});
    if(!action&&method==='GET'){
     for(const active of await rows(q(env,"SELECT * FROM community_timers WHERE room_id=? AND status='running'",id)))if(!(await roomAccess(env,id,active.profile_id,at)).canParticipate)await settle(active,true);
     await finishDueActivities(env,id,at,settle);
     const members=await rows(q(env,`SELECT ${participationSQL('m.room_id','p.id',at)} AS can_participate,p.id,p.nickname,m.joined_at,m.last_seen,m.muted_until,m.focus_state,m.allow_nudges,
      COALESCE((SELECT seconds FROM community_room_daily d WHERE d.room_id=? AND d.profile_id=p.id AND d.day=?),0) AS today_seconds,
      COALESCE((SELECT sum(seconds) FROM community_room_daily d WHERE d.room_id=? AND d.profile_id=p.id),0) AS total_seconds,
      (SELECT MAX(day) FROM community_room_daily d WHERE d.room_id=m.room_id AND d.profile_id=p.id AND d.seconds>0) AS last_study_day,
      t.credited_seconds AS session_seconds,t.status AS timer_status,t.activity_id,t.last_at AS timer_last_at,t.check_at AS timer_check_at FROM community_members m JOIN community_profiles p ON p.id=m.profile_id LEFT JOIN community_timers t ON t.profile_id=p.id AND t.room_id=m.room_id
      WHERE m.room_id=? AND m.banned=0 AND m.left_at=0 ORDER BY today_seconds DESC,p.nickname LIMIT 24`,id,day,id,id));
     const totals=await q(env,'SELECT COALESCE(sum(seconds),0) AS total_seconds,COALESCE(sum(CASE WHEN day=? THEN seconds ELSE 0 END),0) AS today_seconds,count(DISTINCT CASE WHEN day=? AND seconds>0 THEN profile_id END) AS today_members,MIN(CASE WHEN seconds>0 THEN day END) AS retained_from,MAX(CASE WHEN seconds>0 THEN day END) AS retained_to FROM community_room_daily WHERE room_id=?',day,day,id).first();
     const retainedReportWeeks=r.member?(await rows(q(env,'SELECT week FROM community_group_reports WHERE room_id=? AND week>=? AND week<=? ORDER BY week DESC LIMIT 12',id,weekStart(at-77*86400000),weekStart(at)))).map(row=>row.week):[];
     const messages=r.member?await rows(q(env,`SELECT m.id,m.author_id,p.nickname,m.text,m.template_id,m.quick_id,m.created_at FROM community_messages m JOIN community_profiles p ON p.id=m.author_id WHERE m.room_id=? AND m.hidden=0 AND m.created_at>=? AND NOT EXISTS(SELECT 1 FROM community_blocks b WHERE b.blocker_id=? AND b.blocked_id=m.author_id) ORDER BY m.created_at DESC,m.id DESC LIMIT 50`,id,at-30*86400000,profile.id)):[];
     const ownerRights=await ownerEntitlements(env,r.room.owner_id,at),myRights=await permissions(),canManage=await isGroupManager(env,id,profile?.id,at),cohosts=await rows(q(env,'SELECT profile_id FROM community_group_roles WHERE room_id=?',id));
     const interactions=r.member&&r.access.canParticipate?await rows(q(env,`SELECT x.id,x.kind,x.sender_id,p.nickname sender,x.created_at FROM community_interactions x JOIN community_profiles p ON p.id=x.sender_id WHERE x.room_id=? AND x.recipient_id=? AND x.created_at>? AND x.expires_at>? AND NOT EXISTS(SELECT 1 FROM community_blocks b WHERE (b.blocker_id=? AND b.blocked_id=x.sender_id) OR (b.blocker_id=x.sender_id AND b.blocked_id=?)) ORDER BY x.created_at LIMIT 10`,id,profile.id,at-10000,at,profile.id,profile.id)):[];
     const cooldowns=r.member?await rows(q(env,'SELECT recipient_id,MAX(created_at)+300000 AS until_at FROM community_interactions WHERE sender_id=? AND created_at>? GROUP BY recipient_id',profile.id,at-300000)):[];
     return result({canManage,cohosts:cohosts.map(c=>c.profile_id),ownerAdvanced:ownerRights.advanced,ownerSource:ownerRights.source,quietChat:!!await q(env,`SELECT 1 FROM community_rooms r WHERE r.id=? AND ${quietChatSQL('r.id',at)}`,id).first(),access:{...r.access,freeRoomId:r.room.owner_id===profile?.id?r.access.freeRoomId:undefined,freeMemberIds:r.room.owner_id===profile?.id?r.access.freeMemberIds:undefined},entitlements:myRights,ownerMemberLimit:ownerRights.memberLimit,joinLimit:Math.min(r.room.capacity,ownerRights.memberLimit),interactions,interactionCooldowns:Object.fromEntries(cooldowns.map(c=>[c.recipient_id,c.until_at])),room:{id,name:r.room.name,subject:r.room.study_subject,customTheme:r.room.custom_theme||'',announcement:r.room.announcement_key,visibility:r.room.visibility,host:members.find(m=>m.id===r.room.owner_id)?.nickname||'Room owner',ownerId:r.room.owner_id,goalMinutes:r.room.goal_minutes,capacity:r.room.capacity,invitationsOpen:!!r.room.invitations_open,roundEndsAt:r.room.round_ends_at,closed:!!r.room.closed_at,version:r.room.version,freeSeatsChosen:r.room.free_seats_chosen_at>0,...(r.room.owner_id===profile?.id?{inviteCode:r.room.invite_token}:{})},members:members.map(({last_study_day,can_participate,...m})=>{const access={canParticipate:!!can_participate};return {...m,readOnly:!access.canParticipate,...(r.member?{last_study_day}:{}),session_seconds:r.member?m.session_seconds||0:0,state:access.canParticipate?companionState(m,at):'offline',online:access.canParticipate&&m.last_seen>at-75000,studying:access.canParticipate&&m.last_seen>at-75000&&m.timer_status==='running'&&m.timer_last_at>=at-COMMUNITY.maxHeartbeatGapMs&&m.timer_check_at>at};}),totals,retainedReportWeeks,messages:messages.reverse(),member:!!r.member,accessState:r.membership?.banned?'blocked':r.membership?.left_at?'left':'available',owner:r.room.owner_id===profile?.id,mutedUntil:r.membership?.muted_until||0,removedMembers:r.room.owner_id===profile?.id?await rows(q(env,'SELECT p.id,p.nickname FROM community_members m JOIN community_profiles p ON p.id=m.profile_id WHERE m.room_id=? AND m.banned=1',id)):[],moderationAvailable:admins(env).length>0,chatReviewAvailable:(await review()).available,customThemesAvailable:admins(env).length>0&&(await review()).available,review:await review(),serverNow:at});
    }
    if(action==='leave'&&method==='POST'){
     requireMember(r);if(r.room.owner_id===profile.id)fail(409,'OWNER','Close the room before leaving as its owner.');
     await env.DB.batch([q(env,'UPDATE community_members SET left_at=?,last_seen=0 WHERE room_id=? AND profile_id=?',at,id,profile.id),q(env,"UPDATE community_timers SET status='paused' WHERE profile_id=? AND room_id=?",profile.id,id)]);await q(env,'DELETE FROM community_group_roles WHERE room_id=? AND profile_id=?',id,profile.id).run();await withdrawRoomActivities(env,id,profile.id,at);await signal(id);return result({left:true});
    }
    if(action==='settings'&&method==='PATCH'){
     requireProfile();const supplied=await body(request);let input=supplied;
     if(Object.hasOwn(supplied,'section')){
      const allowed={invitation:['section','version','invitationsOpen','rotateInvite'],capacity:['section','version','capacity'],close:['section','version','close']};
      if(!Object.hasOwn(allowed,supplied.section)||Object.keys(supplied).some(k=>!allowed[supplied.section].includes(k)))fail(400,'INVALID','Choose one room setting to change.');
      if(supplied.section==='invitation'&&((!Object.hasOwn(supplied,'invitationsOpen')&&supplied.rotateInvite!==true)||(Object.hasOwn(supplied,'invitationsOpen')&&typeof supplied.invitationsOpen!=='boolean')||(Object.hasOwn(supplied,'rotateInvite')&&supplied.rotateInvite!==true)))fail(400,'INVALID','Choose whether invitations are open or replace the invitation code.');
      if(supplied.section==='capacity'&&!Object.hasOwn(supplied,'capacity')||supplied.section==='close'&&supplied.close!==true)fail(400,'INVALID','Choose a valid room setting.');
      input={name:r.room.name,goalMinutes:r.room.goal_minutes,capacity:r.room.capacity,invitationsOpen:!!r.room.invitations_open,...supplied,...(supplied.section==='close'?{invitationsOpen:false}:{})};
     }
     const data=roomInput({...input,visibility:r.room.visibility});enforceLocalContent(data.name);checkRoomCapacity(data.capacity,await ownerEntitlements(env,r.room.owner_id,at),r.room.capacity);if(!Number.isInteger(input.version))fail(400,'VERSION','Reload the room before saving settings.');if(!r.access.canParticipate&&input.close!==true)requireParticipation(r.access);
     const count=await q(env,'SELECT count(*) AS n FROM community_members WHERE room_id=? AND banned=0 AND left_at=0',id).first();if(data.capacity<count.n)fail(409,'CAPACITY','Capacity cannot be smaller than current membership.');
     const updated=await q(env,'UPDATE community_rooms SET name=?,goal_minutes=?,capacity=?,invitations_open=?,invite_token=?,closed_at=?,round_ends_at=CASE WHEN ? THEN 0 ELSE round_ends_at END,version=version+1 WHERE id=? AND version=? RETURNING version',data.name,data.goalMinutes,data.capacity,input.invitationsOpen===true?1:0,input.rotateInvite===true?randomToken().slice(0,24):r.room.invite_token,input.close===true?at:r.room.closed_at,input.close===true?1:0,id,input.version).first();if(!updated)fail(409,'CONFLICT','Room settings changed. Reload and review before saving again.');
     if(input.close===true)await env.DB.batch([q(env,"UPDATE community_timers SET status='paused' WHERE room_id=?",id),q(env,"UPDATE community_activities SET status=CASE WHEN status='running' THEN 'ended' ELSE 'cancelled' END,ended_at=?,updated_at=?,version=version+1 WHERE room_id=? AND status IN ('running','scheduled')",at,at,id)]);await signal(id);return result({saved:true,version:updated.version});
    }
    if(action==='round'&&method==='POST'){
     requireMember(r);const input=await body(request),minutes=Number(input.minutes);if(!Number.isInteger(minutes)||minutes<0||minutes>25)fail(400,'INVALID','Choose 1–25 minutes, or cancel the round.');
     await q(env,'UPDATE community_rooms SET round_ends_at=? WHERE id=?',minutes?at+minutes*60000:0,id).run();await signal(id);return result({saved:true});
    }
    if(action==='members'&&method==='PATCH'){
     requireMember(r);if(!isAdmin&&!await isGroupManager(env,id,profile.id,at))fail(403,'FORBIDDEN','Only the owner or a current co-host can manage members.');const input=await body(request);if(r.room.owner_id!==profile.id&&!isAdmin&&await q(env,'SELECT 1 FROM community_group_roles WHERE room_id=? AND profile_id=?',id,input.profileId).first())fail(403,'FORBIDDEN','Only the owner can manage another co-host.');if(!uuid(input.profileId)||input.profileId===r.room.owner_id)fail(400,'TARGET','The room owner cannot be removed or muted.');
     if(!['mute','unmute','remove','restore','evict','ban','unban'].includes(input.action))fail(400,'INVALID','Choose a member action.');
     const departing=['remove','ban','evict'].includes(input.action),blocking=['remove','ban'].includes(input.action),leaving=['evict','unban'].includes(input.action),finishedAt=now(),stillAdmin=isAdmin&&admins(env).includes(user.email.toLowerCase());
     const updatedMember=await q(env,`UPDATE community_members SET banned=CASE WHEN ? THEN 1 WHEN ? THEN 0 ELSE banned END,
      left_at=CASE WHEN ? THEN ? ELSE left_at END,
      muted_until=CASE WHEN ? THEN ? WHEN ? THEN 0 ELSE muted_until END,last_seen=CASE WHEN ? THEN 0 ELSE last_seen END
      WHERE room_id=? AND profile_id=? AND profile_id<>(SELECT owner_id FROM community_rooms WHERE id=?)
      AND (?<>'evict' OR (banned=0 AND left_at=0)) AND (?<>'unban' OR banned=1)
      AND (?<>'restore' OR (banned=0 AND left_at=0) OR (SELECT count(*) FROM community_members WHERE room_id=? AND banned=0 AND left_at=0)<(SELECT MIN(capacity,${ownerLimitSQL}) FROM community_rooms WHERE id=?))
      AND EXISTS(SELECT 1 FROM community_members editor JOIN community_rooms managed ON managed.id=editor.room_id JOIN community_profiles p ON p.id=editor.profile_id JOIN sessions session ON session.account_id=p.account_id
       WHERE editor.room_id=? AND editor.profile_id=? AND editor.banned=0 AND editor.left_at=0 AND managed.closed_at=0 AND (${groupManagerSQL('managed','editor.profile_id',''+finishedAt)} OR ?=1) AND (managed.owner_id=editor.profile_id OR ?=1 OR NOT EXISTS(SELECT 1 FROM community_group_roles gr WHERE gr.room_id=managed.id AND gr.profile_id=community_members.profile_id)) AND session.token_hash=? AND session.expires_at>?)
      RETURNING profile_id`,blocking?1:0,['restore','unban'].includes(input.action)?1:0,leaving?1:0,finishedAt,input.action==='mute'?1:0,finishedAt+3600000,['unmute','unban'].includes(input.action)?1:0,departing||input.action==='unban'?1:0,id,input.profileId,id,input.action,input.action,input.action,id,finishedAt,id,id,profile.id,stillAdmin?1:0,stillAdmin?1:0,user.sessionHash,finishedAt).first();
     if(!updatedMember)fail(409,input.action==='restore'?'ROOM_FULL':'MEMBER_CHANGED',input.action==='restore'?'The member cannot be restored beyond the current room limit.':'The member or your room access changed. Refresh before trying again.');
     if(departing){await q(env,'DELETE FROM community_group_roles WHERE room_id=? AND profile_id=?',id,input.profileId).run();await q(env,"UPDATE community_timers SET status='paused' WHERE profile_id=? AND room_id=?",input.profileId,id).run();await withdrawRoomActivities(env,id,input.profileId,finishedAt);}await signal(id);return result({saved:true});
    }
    if(action==='messages'&&method==='DELETE'){
     requireMember(r);const input=await body(request);if(!uuid(input.id))fail(400,'INVALID','Choose a message.');const message=await q(env,'SELECT author_id FROM community_messages WHERE id=? AND room_id=?',input.id,id).first();if(!message)fail(404,'NOT_FOUND','Message unavailable.');
     if(message.author_id===profile.id)await q(env,'DELETE FROM community_messages WHERE id=? AND author_id=?',input.id,profile.id).run();else if(isAdmin||await isGroupManager(env,id,profile.id,Math.floor(now()))){const hidden=await q(env,`UPDATE community_messages SET hidden=1 WHERE id=? AND room_id=? AND EXISTS(SELECT 1 FROM community_rooms mr JOIN community_members mm ON mm.room_id=mr.id JOIN community_profiles mp ON mp.id=mm.profile_id JOIN sessions ms ON ms.account_id=mp.account_id WHERE mr.id=? AND mm.profile_id=? AND mm.banned=0 AND mm.left_at=0 AND mr.closed_at=0 AND (${groupManagerSQL('mr','mm.profile_id',Math.floor(now()))} OR ?=1) AND ms.token_hash=? AND ms.expires_at>?) RETURNING id`,input.id,id,id,profile.id,isAdmin?1:0,user.sessionHash,Math.floor(now())).first();if(!hidden)fail(409,'CONFLICT','Your room moderation access changed. Refresh before trying again.');}else fail(403,'FORBIDDEN','Only the author or a room moderator can remove this message.');await signal(id);return result({removed:true});
    }
    if(action==='messages'&&method==='POST'){
     requireMember(r);if(!admins(env).length)fail(503,'MODERATION_UNAVAILABLE','Chat opens after a platform moderator has been configured.');if(r.membership.muted_until>at)fail(403,'MUTED','You are currently muted in this room.');
     const input=await body(request);
     const hasTemplate=Object.hasOwn(input,'templateId'),template=hasTemplate?studyMessage(input.templateId):null;
     if(hasTemplate&&!template)fail(400,'INVALID','Choose an available study message.');
     if(Object.hasOwn(input,'text')&&typeof input.text!=='string')fail(400,'INVALID','Message text must be text.');
     const extra=typeof input.text==='string'?input.text.trim():'';
     const fixed=!!template&&!extra,quickId=fixed?template.id:null,templateId=fixed?legacyStudyMessage(template.id):null;
     const text=cleanText(template?template.text+(extra?' '+extra:''):input.text,{max:500,label:'Message'});
     if(!uuid(input.id))fail(400,'INVALID','Provide a message request ID.');
     const prior=await q(env,'SELECT author_id,room_id,text,template_id,quick_id FROM community_messages WHERE id=?',input.id).first();if(prior){if(prior.author_id!==profile.id||prior.room_id!==id||prior.text!==text||(prior.quick_id||prior.template_id||null)!==quickId)fail(409,'CONFLICT','Use a new message request ID.');return result({sent:true,id:input.id});}
     await rateLimit(env,'chat-fast',profile.id,3,10000,at);await rateLimit(env,'chat-hour',profile.id,30,3600000,at);
     if(!fixed&&await q(env,`SELECT 1 FROM community_rooms r WHERE r.id=? AND ${quietChatSQL('r.id',at)}`,id).first())fail(409,'QUIET_FOCUS','An activity is focusing. Use a quick message or wait for the break.');
     if(!fixed&&!(await permissions()).freeText)fail(403,'SUBSCRIPTION_REQUIRED','Free rooms use quick messages and reactions. Subscriber text chat will be available when subscriptions open.');
     if(fixed)enforceLocalContent(text);else await reviewChat(text,env,{at,fetcher:reviewFetch,timeoutMs:reviewTimeoutMs});
     const finishedAt=Math.floor(now()/1000)*1000;
     // Review can take seconds. Re-check membership, mute, room and session before publishing.
     const written=await q(env,`INSERT INTO community_messages(id,room_id,author_id,text,template_id,quick_id,created_at) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM community_members m JOIN community_rooms r ON r.id=m.room_id JOIN community_profiles p ON p.id=m.profile_id JOIN sessions s ON s.account_id=p.account_id WHERE m.room_id=? AND m.profile_id=? AND m.banned=0 AND m.left_at=0 AND m.muted_until<=? AND r.closed_at=0 AND ${participationSQL('r.id','m.profile_id',finishedAt)} AND s.token_hash=? AND s.expires_at>? AND (?=1 OR EXISTS(SELECT 1 FROM account_entitlement_sources e WHERE e.account_id=p.account_id AND e.free_text=1 AND e.expires_at>?) OR ${previewSQL('p.id',finishedAt)}) AND (?=1 OR NOT ${quietChatSQL('r.id',finishedAt)})) ON CONFLICT(id) DO NOTHING RETURNING id`,input.id,id,profile.id,text,templateId,quickId,finishedAt,id,profile.id,finishedAt,user.sessionHash,finishedAt,fixed?1:0,finishedAt,fixed?1:0).first();
     if(!written){const duplicate=await q(env,'SELECT author_id,room_id,text,template_id,quick_id FROM community_messages WHERE id=?',input.id).first();if(duplicate?.author_id===profile.id&&duplicate.room_id===id&&duplicate.text===text&&(duplicate.quick_id||duplicate.template_id||null)===quickId)return result({sent:true,id:input.id});if(duplicate)fail(409,'CONFLICT','Use a new message request ID.');fail(403,'MEMBERSHIP','Your room permissions changed.');}await signal(id);return result({sent:true,id:input.id},201);
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
   if(path==='/review-status'&&method==='GET'){
    requireProfile();if(!isAdmin)fail(403,'FORBIDDEN','Only platform moderators can view safety capacity.');
    const review=await reviewAvailability(env,at),budget=reviewConfiguration(env)?.provider==='cloudflare'?await reviewBudgetStatus(env,at):null;return result({review,budget});
   }
   if(path==='/moderation'&&method==='GET'){
    requireProfile();const reportRoom=url.searchParams.get('room');if(reportRoom&&!uuid(reportRoom))fail(400,'INVALID','Choose a valid room.');const list=await rows(q(env,`SELECT x.id,x.room_id,r.name AS room_name,r.owner_id,p.nickname AS author,x.subject_id,x.reason,x.detail,x.excerpt,x.created_at FROM community_reports x JOIN community_rooms r ON r.id=x.room_id LEFT JOIN community_profiles p ON p.id=x.subject_id WHERE x.status='open' AND (? IS NULL OR x.room_id=?) AND (? IS NULL OR COALESCE(x.subject_id,'')<>r.owner_id) AND (?=1 OR (r.owner_id=? AND COALESCE(x.subject_id,'')<>?)) ORDER BY x.created_at DESC LIMIT 100`,reportRoom,reportRoom,reportRoom,isAdmin?1:0,profile.id,profile.id));return result({reports:list,platformModerator:isAdmin});
   }
   if(path==='/moderation'&&method==='POST'){
    requireProfile();const input=await body(request);if(!uuid(input.id)||!['dismiss','hide','mute','remove'].includes(input.action))fail(400,'INVALID','Choose a report and review action.');
    const report=await q(env,'SELECT x.*,r.owner_id FROM community_reports x JOIN community_rooms r ON r.id=x.room_id WHERE x.id=?',input.id).first();if(!report||(!isAdmin&&(report.owner_id!==profile.id||report.subject_id===profile.id)))fail(403,'FORBIDDEN','This report needs an authorised reviewer.');
    const statements=[q(env,"UPDATE community_reports SET status=?,reviewed_at=?,reviewer_id=? WHERE id=? AND status='open'",input.action==='dismiss'?'dismissed':'actioned',at,profile.id,input.id)];
    if(input.action==='hide'&&report.message_id)statements.push(q(env,'UPDATE community_messages SET hidden=1 WHERE id=?',report.message_id));
    if(['mute','remove'].includes(input.action)&&report.subject_id){if(report.subject_id===report.owner_id&&!isAdmin)fail(403,'FORBIDDEN','A platform moderator must review the owner.');statements.push(q(env,'UPDATE community_members SET muted_until=?,banned=CASE WHEN ? THEN 1 ELSE banned END WHERE room_id=? AND profile_id=?',at+86400000,input.action==='remove'?1:0,report.room_id,report.subject_id));if(input.action==='remove')statements.push(q(env,"UPDATE community_timers SET status='paused' WHERE profile_id=? AND room_id=?",report.subject_id,report.room_id));}
    if(input.action==='remove'&&report.subject_id===report.owner_id){statements.push(q(env,'UPDATE community_rooms SET closed_at=?,invitations_open=0,round_ends_at=0,version=version+1 WHERE id=?',at,report.room_id),q(env,"UPDATE community_timers SET status='paused' WHERE room_id=?",report.room_id),q(env,"UPDATE community_activities SET status=CASE WHEN status='running' THEN 'ended' ELSE 'cancelled' END,ended_at=?,updated_at=?,version=version+1 WHERE room_id=? AND status IN ('running','scheduled')",at,at,report.room_id));}
    await env.DB.batch(statements);await signal(report.room_id);return result({reviewed:true});
   }
   if(path==='/leaderboard/me'&&method==='GET'){
    requireUser();return result(await personalRanking(env,url.searchParams.get('period'),at,profile));
   }
   if(path==='/leaderboard'&&method==='GET')return result({...await publicRanking(env,url.searchParams.get('period'),at),rules:communityRules()});
   if(path.startsWith('/timer')&&method==='POST'){
    requireProfile();const input=await body(request);await rateLimit(env,'timer',profile.id,400,3600000,at);
    if(path==='/timer/start'){
     const r=await roomContext(input.roomId);requireMember(r);requireParticipation(r.access);const old=await timer();
     if(old?.status==='running'&&at-old.last_at<=90000&&old.check_at>at)fail(409,'ACTIVE_TIMER','Pause the active room timer on the other tab or device first.');
     if(old?.status==='running')await settle(old);const today=await q(env,'SELECT seconds FROM community_daily WHERE profile_id=? AND day=?',profile.id,day).first();if((today?.seconds||0)>=COMMUNITY.dailyCapSeconds)fail(409,'DAILY_CAP','Your 8-hour UTC daily ranking limit is reached. Local tools remain available.');
     if(input.activityId&&!uuid(input.activityId))fail(400,'INVALID','Choose a valid study activity.');
     const activity=input.activityId?await activityTimerContext(env,input.activityId,profile.id,r.room.id,at):null;
     const lease=randomToken(),checkAt=Math.min(input.joinRound===true&&r.room.round_ends_at>at?r.room.round_ends_at:Infinity,activity?activity.started_at+activity.focus_minutes*60000:Infinity,at+COMMUNITY.checkInMs,r.access.subscriptionActive?r.access.expiresAt:Infinity);
     const allowed=`${participationSQL('\''+r.room.id+'\'','\''+profile.id+'\'',Math.floor(now()))} AND EXISTS(SELECT 1 FROM community_members m JOIN community_rooms r ON r.id=m.room_id WHERE r.id=? AND m.profile_id=? AND r.closed_at=0 AND m.left_at=0 AND m.banned=0) AND (? IS NULL OR EXISTS(SELECT 1 FROM community_activities a JOIN community_activity_members p ON p.activity_id=a.id WHERE a.id=? AND a.room_id=? AND a.status='running' AND a.started_at+a.focus_minutes*60000>? AND p.profile_id=? AND p.withdrawn_at=0 AND p.checked_out_at=0))`;
     const args=[r.room.id,profile.id,activity?.id||null,activity?.id||null,r.room.id,at,profile.id];
     const saved=await q(env,`INSERT INTO community_timers(profile_id,room_id,lease,status,started_at,last_at,check_at,activity_id) SELECT ?,?,?,'running',?,?,?,? WHERE ${allowed} ON CONFLICT(profile_id) DO UPDATE SET room_id=excluded.room_id,lease=excluded.lease,status='running',started_at=excluded.started_at,last_at=excluded.last_at,check_at=excluded.check_at,activity_id=excluded.activity_id,credited_seconds=0 WHERE (community_timers.status<>'running' OR community_timers.last_at<?) AND ${allowed} RETURNING *`,profile.id,r.room.id,lease,at,at,checkAt,activity?.id||null,...args,at-90000,...args).first();if(!saved)fail(409,'ACTIVE_TIMER','The room, activity or active timer changed. Refresh before starting.');
     await q(env,"UPDATE community_members SET focus_state='ready',state_updated_at=? WHERE room_id=? AND profile_id=?",at,r.room.id,profile.id).run();
     if(activity)await q(env,'UPDATE community_activity_members SET first_started_at=CASE WHEN first_started_at=0 THEN ? ELSE first_started_at END WHERE activity_id=? AND profile_id=?',at,activity.id,profile.id).run();await signal(r.room.id);return result({timer:saved,serverNow:at});
    }
    if(!['/timer/heartbeat','/timer/pause'].includes(path))fail(404,'NOT_FOUND','Unknown timer action.');
    const current=await timer();if(!current||typeof input.lease!=='string'||input.lease!==current.lease)fail(409,'LEASE','This timer belongs to another tab or device. Refresh before continuing.');
    const r=await roomContext(current.room_id);requireMember(r);if(current.status!=='running')return result({timer:current,serverNow:at});
    const settled=await settle(current,path==='/timer/pause');if(path==='/timer/pause')await q(env,"UPDATE community_members SET focus_state='break',state_updated_at=? WHERE room_id=? AND profile_id=?",at,current.room_id,profile.id).run();await signal(current.room_id,path==='/timer/heartbeat');return result(settled);
   }
   fail(404,'NOT_FOUND','This community endpoint does not exist.');
  }catch(error){
   if(error instanceof ApiError)return result({error:{code:error.code,message:error.message}},error.status);
   const message=String(error?.message||'');for(const [code,text] of [['INTERACTION_COOLDOWN','Wait five minutes before reminding this person again.'],['INTERACTION_BUSY','This person has just received a reminder. Try again later.'],['INTERACTION_LIMIT','You can send at most two interactions per minute.']])if(message.includes(code))return result({error:{code,message:text}},429);for(const [key,text]of [['GROUP_ROLE_LIMIT','Choose up to two co-hosts.'],['GROUP_TASK_LIMIT','Archive a shared task before adding another (maximum 50).'],['GROUP_SERIES_LIMIT','Keep up to five active repeating activities.'],['community_group_challenges.room_id','Finish the current challenge before starting another.'],['ACTIVITY_LIMIT','Keep no more than 20 scheduled activities per room.'],['community_activities.room_id','End the current activity before starting another.'],['CAPACITY_INVALID','Choose 2–24 places, at least the current number of members.'],['ROOM_FULL','This room is full.'],['ROOM_LIMIT','Your open-room limit is reached. Free accounts can own one room; active subscriptions allow up to ten. Open an existing room or close one before creating another.'],['MEMBERSHIP_LIMIT','Leave another room before joining.'],['DAILY_CAP','The daily credited-time limit has been reached.']])if(message.includes(key))return result({error:{code:key==='community_activities.room_id'?'ACTIVITY_ACTIVE':key,message:text}},409);
   if(error?.constructor===Error&&!/SQL|D1|constraint|database|syntax|no such|FOREIGN KEY/i.test(message)&&/must|Choose|nickname|required|characters|Use a/.test(message))return result({error:{code:'INVALID',message}},400);
   return result({error:{code:'UNAVAILABLE',message:'The community service is temporarily unavailable. Your local tools still work.'}},503);
  }
 };
}
