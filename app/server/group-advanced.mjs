import {activityWall} from '../src/lib/group-activities.mjs';
import {body,fail,result,rateLimit} from './auth-shared.mjs';
import {reviewChat,enforceLocalContent,reviewAvailability} from './chat-review.mjs';
import {participationSQL,roomAccess,roomActiveSQL} from './room-access.mjs';
import {groupGrantSQL,groupManagerSQL,ownerEntitlements} from './community-entitlements.mjs';
import {GROUP_TASK_TEMPLATES,ACTIVITY_SUBJECTS,ACTIVITY_KINDS,seriesInput,seriesDates,seriesDraft,occurrenceId,reportWeek,challengeInput,dayPlus} from '../src/lib/group-advanced.mjs';
import {utcDay} from '../src/lib/community-model.mjs';
import {FOCUS_SCENES} from '../src/lib/focus-space.mjs';
import {MUSIC_TRACKS} from '../src/lib/music-catalog.mjs';
const q=(env,sql,...args)=>env.DB.prepare(sql).bind(...args),rows=async s=>(await s.all()).results||[];
const uuid=v=>typeof v==='string'&&/^[a-f0-9-]{36}$/.test(v);
export const quietChatSQL=(room,at)=>`EXISTS(SELECT 1 FROM community_rooms qr LEFT JOIN community_group_settings qs ON qs.room_id=qr.id WHERE qr.id=${room} AND COALESCE(qs.quiet_chat,1)=1 AND ${groupGrantSQL('qr.owner_id',at)} AND EXISTS(SELECT 1 FROM community_activities a WHERE a.room_id=qr.id AND a.status='running' AND a.started_at+a.focus_minutes*60000>${at}))`;
export async function isGroupManager(env,room,person,at){if(!person)return false;return !!await q(env,`SELECT 1 AS ok FROM community_rooms r JOIN community_members m ON m.room_id=r.id WHERE r.id=? AND m.profile_id=? AND m.banned=0 AND m.left_at=0 AND ${groupManagerSQL('r','m.profile_id',at)}`,room,person).first();}
// Used in every advanced mutation after asynchronous checks; the final write rechecks session, role and room access.
function guard(room,person,at,manage=false){return `EXISTS(SELECT 1 FROM community_rooms ar JOIN community_members am ON am.room_id=ar.id JOIN community_profiles ap ON ap.id=am.profile_id JOIN sessions ss ON ss.account_id=ap.account_id WHERE ar.id='${room}' AND am.profile_id='${person}' AND am.banned=0 AND am.left_at=0 AND ar.closed_at=0 AND ${participationSQL('ar.id','am.profile_id',at)} AND ${groupGrantSQL('ar.owner_id',at)} ${manage?'AND '+groupManagerSQL('ar','am.profile_id',at):''} AND ss.token_hash=? AND ss.expires_at>${at})`;}
export async function generateSeries(env,s,at){
 const rights=await ownerEntitlements(env,(await q(env,'SELECT owner_id FROM community_rooms WHERE id=?',s.room_id).first())?.owner_id,at);
 if(!s.enabled)return;if(!rights.advanced||!(await roomAccess(env,s.room_id,null,at)).roomActive){await q(env,'UPDATE community_group_series SET enabled=0,version=version+1,updated_at=? WHERE id=? AND enabled=1',at,s.id).run();await q(env,"UPDATE community_activities SET status='cancelled',ended_at=?,updated_at=?,version=version+1 WHERE series_id=? AND status='scheduled' AND starts_at>=?",at,at,s.id,at).run();return;}
 const {days}=seriesDates({...seriesDraft(s),date:s.local_date<activityWall(at,s.zone).date?activityWall(at,s.zone).date:s.local_date},at);
 for(const d of days){const id=await occurrenceId(s.id,s.version,d.startsAt),title=ACTIVITY_SUBJECTS[s.subject]+' · '+ACTIVITY_KINDS[s.kind];
 await q(env,`INSERT INTO community_activities(id,room_id,title,subject,kind,starts_at,zone,focus_minutes,break_minutes,created_at,updated_at,series_id,series_version) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM community_group_series ser JOIN community_rooms r ON r.id=ser.room_id WHERE ser.id=? AND ser.enabled=1 AND ser.version=? AND ${roomActiveSQL('r',at)} AND ${groupGrantSQL('r.owner_id',at)}) AND (SELECT count(*) FROM community_activities WHERE room_id=? AND status='scheduled')<20 ON CONFLICT(id) DO NOTHING`,id,s.room_id,title,s.subject,s.kind,d.startsAt,s.zone,s.focus_minutes,s.break_minutes,at,at,s.id,s.version,s.id,s.version,s.room_id).run();
 }
}
export async function maintainGroupAdvanced(env,at){
 const list=await rows(q(env,"SELECT * FROM community_group_series WHERE enabled=1 ORDER BY updated_at,id LIMIT 20"));
 for(const s of list)try{await generateSeries(env,s,at);}catch(e){if(!/No upcoming occurrence/.test(e.message))throw e;}finally{await q(env,'UPDATE community_group_series SET updated_at=? WHERE id=? AND version=?',at,s.id,s.version).run();}
 await env.DB.batch([q(env,'DELETE FROM community_group_reports WHERE updated_at<?',at-90*86400000),q(env,'DELETE FROM community_group_tasks WHERE archived=1 AND updated_at<?',at-90*86400000),q(env,'DELETE FROM community_group_roles WHERE NOT EXISTS(SELECT 1 FROM community_members m WHERE m.room_id=community_group_roles.room_id AND m.profile_id=community_group_roles.profile_id AND m.banned=0 AND m.left_at=0)')]);
}
export async function groupReport(env,room,week,at){
 const end=dayPlus(week,6),list=await rows(q(env,'SELECT day,sum(seconds) seconds,count(DISTINCT profile_id) members FROM community_room_daily WHERE room_id=? AND day>=? AND day<=? GROUP BY day',room,week,end));
 const days=Array.from({length:7},(_,i)=>{const day=dayPlus(week,i),d=list.find(r=>r.day===day);return {day,seconds:d?.seconds||0,members:d?.members||0};});
 const totals=await q(env,'SELECT COALESCE(sum(seconds),0) seconds,count(DISTINCT CASE WHEN seconds>0 THEN profile_id END) members FROM community_room_daily WHERE room_id=? AND day>=? AND day<=?',room,week,end).first();
 const acts=await rows(q(env,`SELECT a.id,a.title,a.starts_at,a.started_at,a.status,count(DISTINCT CASE WHEN m.first_started_at>0 THEN m.profile_id END) attended FROM community_activities a LEFT JOIN community_activity_members m ON m.activity_id=a.id WHERE a.room_id=? AND a.started_at>=? AND a.started_at<? AND a.status IN ('running','ended') GROUP BY a.id ORDER BY a.started_at`,room,Date.parse(week+'T00:00:00Z'),Date.parse(dayPlus(end,1)+'T00:00:00Z')));
 const report={week,end,days,seconds:totals.seconds,members:totals.members,activities:acts,activityCount:acts.filter(a=>a.attended>0).length,asOf:at};
 await q(env,`INSERT INTO community_group_reports(room_id,week,body,updated_at) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM community_rooms r WHERE r.id=? AND ${groupGrantSQL('r.owner_id',at)} AND ${roomActiveSQL('r',at)}) ON CONFLICT(room_id,week) DO UPDATE SET body=excluded.body,updated_at=excluded.updated_at WHERE community_group_reports.updated_at<excluded.updated_at-60000`,room,week,JSON.stringify(report),at,room).run();return report;
}
export async function advancedPreview({request,env,profile,user,at,now,settle,signal}){
 const input=await body(request);if(typeof input.enabled!=='boolean')fail(400,'INVALID','Choose whether to enable the advanced preview.');
 const policy=await q(env,'SELECT * FROM community_group_policy WHERE id=1').first();if(input.enabled&&(!policy?.enabled||policy.ends_at&&policy.ends_at<=at))fail(403,'PREVIEW_CLOSED','The advanced preview is not available. Your records are kept.');
 await rateLimit(env,'group-preview',profile.id,20,86400000,at);
 const saved=await q(env,`INSERT INTO community_group_previews(account_id,enabled,updated_at) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM sessions WHERE token_hash=? AND expires_at>?) AND (?=0 OR EXISTS(SELECT 1 FROM community_group_policy WHERE id=1 AND enabled=1 AND (ends_at=0 OR ends_at>?))) ON CONFLICT(account_id) DO UPDATE SET enabled=excluded.enabled,updated_at=excluded.updated_at,version=community_group_previews.version+1 RETURNING account_id`,user.id,input.enabled?1:0,at,user.sessionHash,now(),input.enabled?1:0,now()).first();if(!saved)fail(409,'CONFLICT','Your session or preview availability changed. Refresh before trying again.');
 if(!input.enabled)await q(env,'UPDATE community_group_series SET enabled=0,version=version+1,updated_at=? WHERE room_id IN (SELECT id FROM community_rooms WHERE owner_id=?) AND enabled=1',at,profile.id).run();
 if(!input.enabled)await q(env,"UPDATE community_activities SET status='cancelled',ended_at=?,updated_at=?,version=version+1 WHERE series_id IN (SELECT id FROM community_group_series WHERE room_id IN (SELECT id FROM community_rooms WHERE owner_id=?)) AND status='scheduled' AND starts_at>=?",at,at,profile.id,at).run();
 const timers=await rows(q(env,"SELECT t.* FROM community_timers t JOIN community_rooms r ON r.id=t.room_id WHERE r.owner_id=? AND t.status IN ('running','check')",profile.id));
 for(const t of timers)if(!(await roomAccess(env,t.room_id,t.profile_id,now())).canParticipate){await settle(t,true);await signal(t.room_id);}
 return result({saved:true});
}
export async function groupAdvanced({request,env,at,r,profile,user,endpoint='',itemId,now,signal,reviewFetch,reviewTimeoutMs}){
 if(!r.member)fail(403,'MEMBERSHIP','Join this room to use its shared tools.');
 const room=r.room.id,method=request.method,rights=await ownerEntitlements(env,r.room.owner_id,at),manager=await isGroupManager(env,room,profile.id,at),active=rights.advanced&&r.access.canParticipate&&!r.room.closed_at;
 if(method==='GET'&&!endpoint){
  for(const s of await rows(q(env,'SELECT * FROM community_group_series WHERE room_id=? AND enabled=1',room)))await generateSeries(env,s,at);
  let week;try{week=reportWeek(new URL(request.url).searchParams.get('week'),at);}catch(e){fail(400,'INVALID',e.message);}
  const cached=await q(env,'SELECT body FROM community_group_reports WHERE room_id=? AND week=?',room,week).first();
  const report=active?await groupReport(env,room,week,at):cached?{...JSON.parse(cached.body),snapshot:true}:null;
  const tasks=await rows(q(env,`SELECT t.*, (SELECT count(*) FROM community_group_task_claims c WHERE c.task_id=t.id) participants,(SELECT count(*) FROM community_group_task_claims c WHERE c.task_id=t.id AND status='done') completed FROM community_group_tasks t WHERE t.room_id=? AND t.archived=0 ORDER BY t.created_at DESC LIMIT 50`,room));
  const claims=await rows(q(env,'SELECT c.task_id,c.status,c.version FROM community_group_task_claims c JOIN community_group_tasks t ON t.id=c.task_id WHERE t.room_id=? AND c.profile_id=?',room,profile.id));
  const challenge=await q(env,'SELECT * FROM community_group_challenges WHERE room_id=? AND archived=0',room).first();let challengeProgress=null;
  if(challenge&&active){if(challenge.kind==='minutes')challengeProgress=Math.floor((await q(env,'SELECT COALESCE(sum(seconds),0) n FROM community_room_daily WHERE room_id=? AND day>=? AND day<=?',room,challenge.start_day,challenge.end_day).first()).n/60);else challengeProgress=(await q(env,`SELECT count(*) n FROM community_activities a WHERE room_id=? AND a.status IN ('running','ended') AND a.started_at>=? AND a.started_at<? AND EXISTS(SELECT 1 FROM community_activity_members m WHERE m.activity_id=a.id AND m.first_started_at>0)`,room,Date.parse(challenge.start_day+'T00:00:00Z'),Date.parse(dayPlus(challenge.end_day,1)+'T00:00:00Z')).first()).n;}
  return result({active,canManage:manager&&active,source:rights.source,week,report,tasks:tasks.map(t=>({...t,own:claims.find(c=>c.task_id===t.id)||null})),series:await rows(q(env,'SELECT * FROM community_group_series WHERE room_id=? ORDER BY created_at DESC LIMIT 20',room)),roles:await rows(q(env,'SELECT gr.profile_id,p.nickname FROM community_group_roles gr JOIN community_profiles p ON p.id=gr.profile_id WHERE gr.room_id=?',room)),environment:await q(env,'SELECT * FROM community_group_settings WHERE room_id=?',room).first()||{scene:'mist-lake',music:'meditation-01',quiet_chat:1,version:0},challenge:challenge?{...challenge,progress:challengeProgress}:null,reviewAvailable:(await reviewAvailability(env,at)).available,serverNow:at});
 }
 if(!['POST','PATCH','DELETE'].includes(method))fail(405,'METHOD','Unsupported group tool action.');
 const input=await body(request),version=Number(input.version),fresh=()=>Math.floor(now()),manage=()=>{if(!manager)fail(403,'FORBIDDEN','Only the owner or a current co-host can organise this room.');};
 const validId=id=>{if(!uuid(id))fail(400,'INVALID','Use a valid request ID.');};
 // Revoking co-host access is a basic owner safety action, even after preview expiry.
 if(endpoint==='roles'){
  if(r.room.owner_id!==profile.id)fail(403,'FORBIDDEN','Only the owner can assign co-hosts.');validId(input.profileId);if(input.profileId===profile.id||typeof input.enabled!=='boolean')fail(400,'INVALID','Choose another current member.');
  if(!input.enabled){await q(env,'DELETE FROM community_group_roles WHERE room_id=? AND profile_id=? AND EXISTS(SELECT 1 FROM community_rooms rr JOIN community_profiles p ON p.id=rr.owner_id JOIN sessions s ON s.account_id=p.account_id WHERE rr.id=? AND rr.owner_id=? AND s.token_hash=? AND s.expires_at>?)',room,input.profileId,room,profile.id,user.sessionHash,fresh()).run();}
  else{if(!active)fail(403,'GROUP_ADVANCED','Enable advanced room tools first.');const exists=await q(env,'SELECT 1 ok FROM community_group_roles WHERE room_id=? AND profile_id=?',room,input.profileId).first();if(exists)return result({saved:true});const added=await q(env,`INSERT INTO community_group_roles(room_id,profile_id,created_at) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM community_members WHERE room_id=? AND profile_id=? AND banned=0 AND left_at=0 AND ${participationSQL("'"+room+"'","'"+input.profileId+"'",fresh())}) AND ${guard(room,profile.id,fresh(),true)} ON CONFLICT DO NOTHING RETURNING profile_id`,room,input.profileId,at,room,input.profileId,user.sessionHash).first();if(!added)fail(409,'CONFLICT','The member or your access changed.');}await signal(room);return result({saved:true});
 }
 if(!active)fail(403,'GROUP_ADVANCED','Advanced room tools are paused. Retained content is read only.');
 await rateLimit(env,'group-tools-write',profile.id,100,3600000,at);
 let changed;
 if(endpoint==='environment'){
  manage();if(!FOCUS_SCENES.some(s=>s.id===input.scene)||!MUSIC_TRACKS.some(t=>t.id===input.music)||typeof input.quietChat!=='boolean')fail(400,'INVALID','Choose an available scene, soundtrack and chat option.');
  if(version===0)changed=await q(env,`INSERT INTO community_group_settings(room_id,scene,music,quiet_chat) SELECT ?,?,?,? WHERE ${guard(room,profile.id,fresh(),true)} ON CONFLICT DO NOTHING RETURNING version`,room,input.scene,input.music,input.quietChat?1:0,user.sessionHash).first();else changed=await q(env,`UPDATE community_group_settings SET scene=?,music=?,quiet_chat=?,version=version+1 WHERE room_id=? AND version=? AND ${guard(room,profile.id,fresh(),true)} RETURNING version`,input.scene,input.music,input.quietChat?1:0,room,version,user.sessionHash).first();
 }else if(endpoint==='tasks'){
  manage();validId(input.id);const preset=GROUP_TASK_TEMPLATES[input.template],custom=typeof input.title==='string'?input.title.trim():'';
  if(!Object.hasOwn(ACTIVITY_SUBJECTS,input.subject)||!Object.hasOwn(GROUP_TASK_TEMPLATES,input.template)||custom.length>120)fail(400,'INVALID','Choose a task template and subject; keep a custom title within 120 characters.');const title=custom||preset;enforceLocalContent(title);
  const prior=await q(env,'SELECT * FROM community_group_tasks WHERE id=?',input.id).first();if(prior&&prior.room_id!==room)fail(409,'CONFLICT','Use a new task request.');
  if(custom&&custom!==prior?.title)await reviewChat(custom,env,{at,fetcher:reviewFetch,timeoutMs:reviewTimeoutMs});
  if(!prior)changed=await q(env,`INSERT INTO community_group_tasks(id,room_id,title,subject,created_by,created_at,updated_at) SELECT ?,?,?,?,?,?,? WHERE ${guard(room,profile.id,fresh(),true)} ON CONFLICT DO NOTHING RETURNING version`,input.id,room,title,input.subject,profile.id,at,at,user.sessionHash).first();
  else if(method==='POST'&&version===0&&prior.created_by===profile.id&&prior.title===title&&prior.subject===input.subject)return result({saved:true,id:input.id});
  else changed=await q(env,`UPDATE community_group_tasks SET title=?,subject=?,updated_at=?,version=version+1 WHERE id=? AND room_id=? AND version=? AND archived=0 AND ${guard(room,profile.id,fresh(),true)} RETURNING version`,title,input.subject,at,input.id,room,version,user.sessionHash).first();
 }else if(endpoint==='archive-task'){
  manage();validId(input.id);changed=await q(env,`UPDATE community_group_tasks SET archived=1,updated_at=?,version=version+1 WHERE id=? AND room_id=? AND version=? AND archived=0 AND ${guard(room,profile.id,fresh(),true)} RETURNING version`,at,input.id,room,version,user.sessionHash).first();
 }else if(endpoint==='claim'){
  validId(input.id);if(!['working','done','leave'].includes(input.status))fail(400,'INVALID','Choose a task status.');const task=await q(env,'SELECT * FROM community_group_tasks WHERE id=? AND room_id=? AND archived=0',input.id,room).first();if(!task)fail(404,'NOT_FOUND','This shared task is unavailable.');
  const old=await q(env,'SELECT * FROM community_group_task_claims WHERE task_id=? AND profile_id=?',input.id,profile.id).first();if(old&&old.version!==version)fail(409,'CONFLICT','Your participation changed. Refresh first.');
  const taskGuard=`EXISTS(SELECT 1 FROM community_group_tasks t WHERE t.id='${input.id}' AND t.archived=0) AND ${guard(room,profile.id,fresh())}`;
  if(input.status==='leave')changed=await q(env,`DELETE FROM community_group_task_claims WHERE task_id=? AND profile_id=? AND version=? AND ${taskGuard} RETURNING version`,input.id,profile.id,version,user.sessionHash).first();
  else if(!old){if(input.status==='done')fail(409,'TASK_STATE','Join this task before marking your part done.');changed=await q(env,`INSERT INTO community_group_task_claims(task_id,profile_id,status,updated_at) SELECT ?,?,?,? WHERE ${taskGuard} ON CONFLICT DO NOTHING RETURNING version`,input.id,profile.id,input.status,at,user.sessionHash).first();}
  else changed=await q(env,`UPDATE community_group_task_claims SET status=?,updated_at=?,version=version+1 WHERE task_id=? AND profile_id=? AND version=? AND ${taskGuard} RETURNING version`,input.status,at,input.id,profile.id,version,user.sessionHash).first();
 }else if(endpoint==='challenge'){
  manage();validId(input.id);if(input.archive===true)changed=await q(env,`UPDATE community_group_challenges SET archived=1,version=version+1 WHERE id=? AND room_id=? AND version=? AND ${guard(room,profile.id,fresh(),true)} RETURNING version`,input.id,room,version,user.sessionHash).first();else{let d;try{d=challengeInput(input,at);}catch(e){fail(400,'INVALID',e.message);}changed=await q(env,`INSERT INTO community_group_challenges(id,room_id,kind,goal,start_day,end_day,created_at) SELECT ?,?,?,?,?,?,? WHERE ${guard(room,profile.id,fresh(),true)} ON CONFLICT(id) DO NOTHING RETURNING version`,input.id,room,d.kind,d.goal,d.startDay,d.endDay,at,user.sessionHash).first();}
 }else if(endpoint==='series-preview'){
  manage();try{return result(seriesDates(input,at));}catch(e){fail(400,'INVALID',e.message);}
 }else if(endpoint==='series'){
  manage();validId(input.id);const old=await q(env,'SELECT * FROM community_group_series WHERE id=? AND room_id=?',input.id,room).first();
  if(input.pause===true){if(!old)fail(404,'NOT_FOUND','Series unavailable.');changed=await q(env,`UPDATE community_group_series SET enabled=0,version=version+1,updated_at=? WHERE id=? AND version=? AND ${guard(room,profile.id,fresh(),true)} RETURNING version`,at,input.id,version,user.sessionHash).first();}
  else{let d;try{d=seriesInput(input,at);seriesDates(input,at);}catch(e){fail(400,'INVALID',e.message);}if(!old){if((await q(env,'SELECT count(*) n FROM community_group_series WHERE room_id=? AND enabled=1',room).first()).n>=5)fail(409,'SERIES_LIMIT','Keep up to five active repeating activities per room.');changed=await q(env,`INSERT INTO community_group_series(id,room_id,subject,kind,local_date,local_time,zone,fold,weekdays,focus_minutes,break_minutes,created_at,updated_at) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,? WHERE ${guard(room,profile.id,fresh(),true)} ON CONFLICT DO NOTHING RETURNING version`,input.id,room,d.subject,d.kind,d.date,d.time,d.zone,d.fold,JSON.stringify(d.weekdays),d.focusMinutes,d.breakMinutes,at,at,user.sessionHash).first();}
   else changed=await q(env,`UPDATE community_group_series SET subject=?,kind=?,local_date=?,local_time=?,zone=?,fold=?,weekdays=?,focus_minutes=?,break_minutes=?,enabled=1,version=version+1,updated_at=? WHERE id=? AND room_id=? AND version=? AND ${guard(room,profile.id,fresh(),true)} RETURNING version`,d.subject,d.kind,d.date,d.time,d.zone,d.fold,JSON.stringify(d.weekdays),d.focusMinutes,d.breakMinutes,at,input.id,room,version,user.sessionHash).first();
  }
  if(changed){await q(env,`UPDATE community_activities SET status='cancelled',ended_at=?,updated_at=?,version=version+1 WHERE series_id=? AND series_version<? AND status='scheduled' AND starts_at>=?`,at,at,input.id,changed.version,at).run();const series=await q(env,'SELECT * FROM community_group_series WHERE id=?',input.id).first();if(series.enabled)await generateSeries(env,series,at);}
 }else fail(404,'NOT_FOUND','Group tool unavailable.');
 if(!changed)fail(409,'CONFLICT','This item or your access changed. Refresh and review before retrying.');await signal(room);return result({saved:true,version:changed.version});
}
