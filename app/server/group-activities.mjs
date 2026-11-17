import {body,fail,result,rateLimit} from './auth-shared.mjs';
import {reviewConfiguration,reviewChat,enforceLocalContent} from './chat-review.mjs';
import {activityInput,ACTIVITY_SUBJECTS,ACTIVITY_OUTCOMES,ROOM_NOTICES} from '../src/lib/group-activities.mjs';
const q=(env,sql,...args)=>env.DB.prepare(sql).bind(...args);
const rows=async s=>(await s.all()).results||[];
const uuid=v=>typeof v==='string'&&/^[a-f0-9-]{36}$/.test(v);
export const activityRecord=a=>({id:a.id,roomId:a.room_id,title:a.title,subject:a.subject,kind:a.kind,startsAt:a.starts_at,zone:a.zone,focusMinutes:a.focus_minutes,breakMinutes:a.break_minutes,status:a.status,startedAt:a.started_at,endedAt:a.ended_at,version:a.version});
export function withdrawRoomActivities(env,roomId,profileId,at){return q(env,`UPDATE community_activity_members SET withdrawn_at=?,version=version+1 WHERE profile_id=? AND withdrawn_at=0 AND checked_out_at=0 AND activity_id IN (SELECT id FROM community_activities WHERE room_id=? AND status IN ('scheduled','running'))`,at,profileId,roomId).run();}
export async function finishDueActivities(env,roomId,at,settle){
 const due=await rows(q(env,"SELECT * FROM community_activities WHERE room_id=? AND status='running' AND started_at+(focus_minutes+break_minutes)*60000<=?",roomId,at));
 for(const a of due){await q(env,"UPDATE community_activities SET status='ended',ended_at=started_at+(focus_minutes+break_minutes)*60000,updated_at=?,version=version+1 WHERE id=? AND status='running'",at,a.id).run();for(const timer of await rows(q(env,"SELECT * FROM community_timers WHERE activity_id=? AND status='running'",a.id)))await settle(timer,true);}
}
export async function activityTimerContext(env,id,profileId,roomId,at){
 const a=await q(env,'SELECT a.*,m.checked_out_at,m.withdrawn_at FROM community_activities a JOIN community_activity_members m ON m.activity_id=a.id WHERE a.id=? AND a.room_id=? AND m.profile_id=?',id,roomId,profileId).first();
 if(!a||a.status!=='running'||a.withdrawn_at||a.checked_out_at||at>=a.started_at+a.focus_minutes*60000)fail(409,'ACTIVITY_TIMER','Join an active focus activity before starting its timer.');return a;
}
export async function roomActivities({request,env,at,r,profile,requireProfile,isAdmin,activityId,operation,settle,signal,reviewFetch,reviewTimeoutMs}){
 requireProfile();if(!r.member)fail(403,'MEMBERSHIP','Join this room before opening its activities.');
 const roomId=r.room.id,method=request.method;
 const owner=()=>{if(r.room.owner_id!==profile.id&&!isAdmin)fail(403,'FORBIDDEN','Only the room owner can organise activities.');};
 const writable=()=>{if(r.room.closed_at)fail(409,'ROOM_CLOSED','This room is closed. Its retained activities are read only.');};
 await finishDueActivities(env,roomId,at,settle);
 const get=async()=>{if(!uuid(activityId))fail(404,'NOT_FOUND','Activity unavailable.');const a=await q(env,'SELECT * FROM community_activities WHERE id=? AND room_id=?',activityId,roomId).first();if(!a)fail(404,'NOT_FOUND','Activity unavailable.');return a;};
 const mine=()=>q(env,'SELECT * FROM community_activity_members WHERE activity_id=? AND profile_id=?',activityId,profile.id).first();
 const version=(input,a)=>{if(!Number.isInteger(input.version)||input.version!==a.version)fail(409,'CONFLICT','This activity changed. Refresh it and review the latest version.');};
 const validate=async(input,previous)=>{let data;try{data=activityInput(input,at);}catch(e){fail(400,'INVALID',e.message);}enforceLocalContent(data.title);if(data.customTitle&&data.customTitle!==previous?.title)await reviewChat(data.customTitle,env,{at,fetcher:reviewFetch,timeoutMs:reviewTimeoutMs});return data;};
 if(!activityId&&method==='GET'){
  const list=await rows(q(env,`SELECT a.*, (SELECT count(*) FROM community_activity_members m WHERE m.activity_id=a.id AND m.withdrawn_at=0) AS reservations,
   (SELECT count(*) FROM community_activity_members m WHERE m.activity_id=a.id AND m.profile_id=? AND m.withdrawn_at=0) AS joined
   FROM community_activities a WHERE a.room_id=? AND MAX(a.starts_at,a.started_at,a.ended_at)>=? ORDER BY CASE WHEN a.status='running' THEN 0 WHEN a.status='scheduled' THEN 1 ELSE 2 END,CASE WHEN a.status='scheduled' THEN a.starts_at ELSE -a.created_at END,a.id LIMIT 100`,profile.id,roomId,at-90*86400000));
  return result({activities:list.map(a=>({...activityRecord(a),reservations:a.reservations,joined:!!a.joined})),serverNow:at});
 }
 if(!activityId&&method==='POST'){
  owner();writable();const input=await body(request);if(!uuid(input.id))fail(400,'INVALID','Provide a new activity request ID.');
  const prior=await q(env,'SELECT room_id FROM community_activities WHERE id=?',input.id).first();if(prior){if(prior.room_id!==roomId)fail(409,'CONFLICT','Use a new activity request ID.');return result({id:input.id});}
  const d=await validate(input);await rateLimit(env,'activity-create',profile.id,10,86400000,at);
  const created=await q(env,`INSERT INTO community_activities(id,room_id,title,subject,kind,starts_at,zone,focus_minutes,break_minutes,created_at,updated_at)
   SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM community_rooms WHERE id=? AND closed_at=0) ON CONFLICT(id) DO NOTHING RETURNING id`,input.id,roomId,d.title,d.subject,d.kind,d.startsAt,d.zone,d.focusMinutes,d.breakMinutes,at,at,roomId).first();
  if(!created)fail(409,'CONFLICT','Room or activity changed. Refresh before trying again.');await signal(roomId);return result({id:created.id},201);
 }
 const a=await get();
 if(!operation&&method==='GET'){
  const participants=await rows(q(env,`SELECT m.profile_id,p.nickname,m.subject,m.seconds,m.first_started_at,m.checked_out_at,m.outcome,m.withdrawn_at
   FROM community_activity_members m JOIN community_profiles p ON p.id=m.profile_id WHERE m.activity_id=? ORDER BY m.joined_at,p.nickname`,a.id));
  const own=await mine(),active=participants.filter(m=>!m.withdrawn_at),summary={reserved:active.length,attended:participants.filter(m=>m.first_started_at>0).length,seconds:participants.reduce((n,m)=>n+m.seconds,0),checkedOut:active.filter(m=>m.checked_out_at>0).length,completed:active.filter(m=>m.outcome==='completed').length,partial:active.filter(m=>m.outcome==='partial').length,notStarted:active.filter(m=>m.outcome==='not_started').length};
  return result({activity:activityRecord(a),participants,own:own?{version:own.version,task:own.task_text,subject:own.subject,reflection:own.reflection,outcome:own.outcome,checkedOutAt:own.checked_out_at,withdrawnAt:own.withdrawn_at,seconds:own.seconds}:null,summary,serverNow:at,customTitlesAvailable:!!reviewConfiguration(env)});
 }
 writable();const input=await body(request);await rateLimit(env,'activity-action',profile.id,120,3600000,at);
 if(!operation&&method==='PATCH'){
  owner();version(input,a);if(a.status!=='scheduled')fail(409,'ACTIVITY_STATE','Only an activity that has not started can be edited.');const d=await validate(input,a);
  const changed=await q(env,`UPDATE community_activities SET title=?,subject=?,kind=?,starts_at=?,zone=?,focus_minutes=?,break_minutes=?,version=version+1,updated_at=? WHERE id=? AND version=? AND status='scheduled' AND EXISTS(SELECT 1 FROM community_rooms WHERE id=? AND closed_at=0) RETURNING version`,d.title,d.subject,d.kind,d.startsAt,d.zone,d.focusMinutes,d.breakMinutes,at,a.id,a.version,roomId).first();if(!changed)fail(409,'CONFLICT','This activity changed. Refresh before saving.');await signal(roomId);return result({saved:true,version:changed.version});
 }
 if(['start','end','cancel'].includes(operation)&&method==='POST'){
  owner();const target={start:'running',end:'ended',cancel:'cancelled'}[operation];if(a.status===target)return result({saved:true,id:a.id});version(input,a);
  if(operation==='start'&&a.status!=='scheduled'||operation==='end'&&a.status!=='running'||operation==='cancel'&&a.status!=='scheduled')fail(409,'ACTIVITY_STATE','This action is no longer available for the activity.');
  const changed=await q(env,`UPDATE community_activities SET status=?,started_at=CASE WHEN ?='running' THEN ? ELSE started_at END,ended_at=CASE WHEN ? IN ('ended','cancelled') THEN ? ELSE 0 END,updated_at=?,version=version+1 WHERE id=? AND version=? AND status=? AND EXISTS(SELECT 1 FROM community_rooms WHERE id=? AND closed_at=0) RETURNING id`,target,target,at,target,at,at,a.id,a.version,a.status,roomId).first();if(!changed)fail(409,'CONFLICT','This activity changed. Refresh it.');
  if(operation==='end')for(const timer of await rows(q(env,"SELECT * FROM community_timers WHERE activity_id=? AND status='running'",a.id)))await settle(timer,true);
  await signal(roomId);return result({saved:true,id:a.id});
 }
 if(operation==='participation'&&method==='PUT'){
  if(!['scheduled','running'].includes(a.status)||a.status==='running'&&at>=a.started_at+a.focus_minutes*60000)fail(409,'ACTIVITY_STATE','Registration for this activity has finished.');
  const subject=input.subject,task=typeof input.task==='string'?input.task.trim():'';if(!Object.hasOwn(ACTIVITY_SUBJECTS,subject)||!task||task.length>240)fail(400,'INVALID','Choose a subject and write a personal task of 1–240 characters.');enforceLocalContent(task);
  const old=await mine();if(old?.checked_out_at)fail(409,'ACTIVITY_STATE','You have already checked out. Your original result is retained.');if(old&&old.version!==input.version)fail(409,'CONFLICT','Your task changed on another tab. Refresh it.');
  const allowed=`EXISTS(SELECT 1 FROM community_activities a JOIN community_rooms r ON r.id=a.room_id JOIN community_members m ON m.room_id=r.id WHERE a.id=? AND m.profile_id=? AND m.left_at=0 AND m.banned=0 AND r.closed_at=0 AND (a.status='scheduled' OR (a.status='running' AND a.started_at+a.focus_minutes*60000>?)))`;
  const saved=old?await q(env,`UPDATE community_activity_members SET task_text=?,subject=?,withdrawn_at=0,version=version+1 WHERE activity_id=? AND profile_id=? AND version=? AND checked_out_at=0 AND ${allowed} RETURNING version`,task,subject,a.id,profile.id,old.version,a.id,profile.id,at).first():await q(env,`INSERT INTO community_activity_members(activity_id,profile_id,task_text,subject,joined_at) SELECT ?,?,?,?,? WHERE ${allowed} ON CONFLICT DO NOTHING RETURNING version`,a.id,profile.id,task,subject,at,a.id,profile.id,at).first();if(!saved)fail(409,'CONFLICT','Your participation or activity changed. Refresh it.');await signal(roomId);return result({saved:true,version:saved.version});
 }
 if(operation==='withdraw'&&method==='POST'){
  const m=await mine();if(!m||m.withdrawn_at)return result({saved:true});if(m.version!==input.version)fail(409,'CONFLICT','Your participation changed. Refresh it.');if(!['scheduled','running'].includes(a.status)||m.checked_out_at)fail(409,'ACTIVITY_STATE','This activity is finished. Keep the original result.');
  const timer=await q(env,"SELECT * FROM community_timers WHERE activity_id=? AND profile_id=? AND status='running'",a.id,profile.id).first();if(timer)await settle(timer,true);
  await q(env,'UPDATE community_activity_members SET withdrawn_at=?,version=version+1 WHERE activity_id=? AND profile_id=? AND version=?',at,a.id,profile.id,m.version).run();await signal(roomId);return result({saved:true});
 }
 if(operation==='checkout'&&method==='POST'){
  const m=await mine();if(!m||m.withdrawn_at||!['running','ended'].includes(a.status))fail(409,'ACTIVITY_STATE','Join and start an activity before checking out.');if(m.version!==input.version)fail(409,'CONFLICT','Your result changed on another tab. Refresh it.');
  const reflection=typeof input.reflection==='string'?input.reflection.trim():'';if(!Object.hasOwn(ACTIVITY_OUTCOMES,input.outcome)||reflection.length>500)fail(400,'INVALID','Choose a completion status and keep your private note within 500 characters.');enforceLocalContent(reflection);
  const timer=await q(env,"SELECT * FROM community_timers WHERE activity_id=? AND profile_id=? AND status='running'",a.id,profile.id).first();if(timer)await settle(timer,true);
  const saved=await q(env,`UPDATE community_activity_members SET outcome=?,reflection=?,checked_out_at=CASE WHEN checked_out_at=0 THEN ? ELSE checked_out_at END,version=version+1 WHERE activity_id=? AND profile_id=? AND version=? AND withdrawn_at=0 AND EXISTS(SELECT 1 FROM community_members m JOIN community_rooms r ON r.id=m.room_id JOIN community_activities a ON a.room_id=r.id WHERE a.id=? AND a.status IN ('running','ended') AND m.profile_id=? AND m.left_at=0 AND m.banned=0 AND r.closed_at=0) RETURNING version`,input.outcome,reflection,at,a.id,profile.id,m.version,a.id,profile.id).first();if(!saved)fail(409,'CONFLICT','Your result or permissions changed. Refresh before saving.');await signal(roomId);return result({saved:true,version:saved.version});
 }
 fail(405,'METHOD','This activity action is not supported.');
}
export async function saveRoomHome({request,env,at,r,profile,isAdmin,signal}){
 if(!profile||!r.member||(r.room.owner_id!==profile.id&&!isAdmin))fail(403,'FORBIDDEN','Only the room owner can edit the room overview.');
 const input=await body(request);if(!Object.hasOwn(ACTIVITY_SUBJECTS,input.subject)||!Object.hasOwn(ROOM_NOTICES,input.announcement))fail(400,'INVALID','Choose a room subject and a study notice.');
 const saved=await q(env,'UPDATE community_rooms SET study_subject=?,announcement_key=?,version=version+1 WHERE id=? AND version=? AND closed_at=0 RETURNING version',input.subject,input.announcement,r.room.id,input.version).first();if(!saved)fail(409,'CONFLICT','Room settings changed. Refresh before saving.');await signal(r.room.id);return result({saved:true,version:saved.version});
}
