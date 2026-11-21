import {participationSQL} from './room-access.mjs';
import {body,fail,result,rateLimit} from './auth-shared.mjs';
import {reviewAvailability,reviewConfiguration,reviewChat,enforceLocalContent} from './chat-review.mjs';
import {ACTIVITY_SUBJECTS,ROOM_NOTICES} from '../src/lib/group-activities.mjs';
import {roomThemeInput} from '../src/lib/room-theme.mjs';
import {roomInput} from '../src/lib/community-model.mjs';
const q=(env,sql,...args)=>env.DB.prepare(sql).bind(...args);
const moderated=env=>(env.COMMUNITY_ADMIN_EMAILS||'').split(/[\s,;]+/).filter(Boolean).length>0;
export async function saveRoomHome({request,env,at,r,profile,user,isAdmin,signal,now=Date.now,reviewFetch,reviewTimeoutMs}){
 if(!profile||!r.member||(r.room.owner_id!==profile.id&&!isAdmin))fail(403,'FORBIDDEN','Only the room owner can edit the room theme.');
 if(r.room.closed_at)fail(409,'ROOM_CLOSED','This room is closed. Its theme is read only.');
 if(r.membership?.muted_until>at)fail(403,'MUTED','You are currently muted in this room.');
 const input=await body(request);
 if(Object.keys(input).some(k=>!['name','subject','announcement','customTheme','version'].includes(k))||!Object.hasOwn(ACTIVITY_SUBJECTS,input.subject)||!Object.hasOwn(ROOM_NOTICES,input.announcement)||!Number.isInteger(input.version)||input.version<1)fail(400,'INVALID','Choose a room theme and study notice, then refresh if needed.');
 let name=r.room.name;
 if(Object.hasOwn(input,'name')){try{name=roomInput({name:input.name,capacity:r.room.capacity,goalMinutes:r.room.goal_minutes,visibility:r.room.visibility}).name;}catch(e){fail(400,'INVALID',e.message);}enforceLocalContent(name);}
 let custom;try{custom=roomThemeInput(input.customTheme===undefined?r.room.custom_theme||'':input.customTheme);}catch(e){fail(400,'INVALID',e.message);}
 const unchanged=name===r.room.name&&input.subject===r.room.study_subject&&input.announcement===r.room.announcement_key&&custom===(r.room.custom_theme||'');
 if(unchanged&&input.version<=r.room.version)return result({saved:true,version:r.room.version});
 if(input.version!==r.room.version)fail(409,'CONFLICT','The room changed. Review the latest version before saving.');
 try{if(custom)enforceLocalContent(custom);}catch(e){if(e.code==='CONTENT_BLOCKED')fail(422,e.code,'This theme was blocked; nothing was saved. Do not include unsafe content, advertising or contact details.');throw e;}
 await rateLimit(env,'room-overview',profile.id,20,3600000,at);
 const needsReview=!!custom&&custom!==(r.room.custom_theme||'');
 if(needsReview){
  if(!moderated(env))fail(503,'REVIEW_UNAVAILABLE','Custom themes need platform moderation. Preset themes still work.');
  const availability=await reviewAvailability(env,at);
  if(!availability.available)fail(503,availability.state==='capacity'?'REVIEW_LIMIT':'REVIEW_UNAVAILABLE','Custom theme review is temporarily paused. Choose a preset or try again later.');
  await rateLimit(env,'room-theme',r.room.id,6,3600000,at);
  try{await reviewChat(custom,env,{at,fetcher:reviewFetch,timeoutMs:reviewTimeoutMs});}catch(e){if(e.code==='CONTENT_BLOCKED')fail(422,e.code,'This theme was blocked; nothing was saved. Keep the room focused on learning.');if(e.code?.startsWith('REVIEW_'))fail(503,e.code,'Custom theme review is temporarily unavailable. Nothing was saved. Choose a preset or try again later.');throw e;}
  if(!moderated(env)||!reviewConfiguration(env))fail(503,'REVIEW_UNAVAILABLE','Custom theme review was paused. Nothing was saved.');
 }
 const finishedAt=now(),stillAdmin=isAdmin&&(env.COMMUNITY_ADMIN_EMAILS||'').toLowerCase().split(/[\s,;]+/).includes(user.email.toLowerCase());
 // Recheck access, exact session, mute, closure and version after asynchronous review.
 const saved=await q(env,`UPDATE community_rooms SET name=?,study_subject=?,announcement_key=?,custom_theme=?,version=version+1
  WHERE id=? AND version=? AND closed_at=0 AND (owner_id=? OR ?=1)
  AND EXISTS(SELECT 1 FROM community_members m JOIN community_profiles p ON p.id=m.profile_id JOIN sessions s ON s.account_id=p.account_id
   WHERE m.room_id=community_rooms.id AND m.profile_id=? AND m.left_at=0 AND m.banned=0 AND m.muted_until<=? AND ${participationSQL('m.room_id','m.profile_id',finishedAt)} AND s.token_hash=? AND s.expires_at>?)
  RETURNING version`,name,input.subject,input.announcement,custom,r.room.id,input.version,profile.id,stillAdmin?1:0,profile.id,finishedAt,user.sessionHash,finishedAt).first();
 if(!saved)fail(409,'CONFLICT','The room or your access changed. Refresh before saving.');
 await signal(r.room.id);return result({saved:true,version:saved.version});
}
