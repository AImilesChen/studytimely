import {body,fail,result,rateLimit} from './auth-shared.mjs';
import {INTERACTIONS,companionState} from '../src/lib/companion-model.mjs';
const q=(env,sql,...args)=>env.DB.prepare(sql).bind(...args);
const uuid=value=>typeof value==='string'&&/^[a-f0-9-]{36}$/.test(value);
export async function companionAction({action,request,env,r,profile,user,at,timer,settle,signal}){
 const input=await body(request),roomId=r.room.id;
 if(action==='presence'){
  if(Object.keys(input).some(k=>!['state','allowNudges','lease'].includes(k))||input.state!==undefined&&!['ready','break'].includes(input.state)||input.allowNudges!==undefined&&typeof input.allowNudges!=='boolean'||input.state===undefined&&input.allowNudges===undefined)fail(400,'INVALID','Choose your availability or reminder preference.');
  await rateLimit(env,'companion-presence',profile.id,30,60000,at);
  const current=await timer();
  if(input.state==='break'&&current?.room_id===roomId&&current.status==='running'){
   if(input.lease!==current.lease)fail(409,'LEASE','Pause your active timer before taking a break.');
   await settle(current,true);
  }
  const saved=await q(env,`UPDATE community_members SET focus_state=COALESCE(?,focus_state),allow_nudges=COALESCE(?,allow_nudges),state_updated_at=?,last_seen=? WHERE room_id=? AND profile_id=? AND banned=0 AND left_at=0 AND EXISTS(SELECT 1 FROM community_rooms WHERE id=? AND closed_at=0) AND EXISTS(SELECT 1 FROM sessions WHERE token_hash=? AND expires_at>?) RETURNING profile_id`,input.state??null,input.allowNudges===undefined?null:input.allowNudges?1:0,at,at,roomId,profile.id,roomId,user.sessionHash,at).first();
  if(!saved)fail(403,'MEMBERSHIP','Your room access changed.');await signal(roomId);return result({saved:true});
 }
 if(Object.keys(input).some(k=>!['id','targetId','kind'].includes(k))||!uuid(input.id)||!uuid(input.targetId)||input.targetId===profile.id||!INTERACTIONS.some(k=>k.id===input.kind))fail(400,'INVALID','Choose a room member and a fixed interaction.');
 if(r.membership.muted_until>at)fail(403,'MUTED','You are currently muted in this room.');
 const prior=await q(env,'SELECT room_id,sender_id,recipient_id,kind FROM community_interactions WHERE id=?',input.id).first();
 if(prior){if(prior.room_id!==roomId||prior.sender_id!==profile.id||prior.recipient_id!==input.targetId||prior.kind!==input.kind)fail(409,'CONFLICT','Use a new interaction request.');return result({sent:true,id:input.id});}
 const target=await q(env,`SELECT m.last_seen,m.focus_state,m.allow_nudges,t.status timer_status,t.last_at timer_last_at,t.check_at timer_check_at FROM community_members m LEFT JOIN community_timers t ON t.profile_id=m.profile_id AND t.room_id=m.room_id WHERE m.room_id=? AND m.profile_id=? AND m.banned=0 AND m.left_at=0`,roomId,input.targetId).first();
 const blocked=await q(env,'SELECT 1 FROM community_blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?)',profile.id,input.targetId,input.targetId,profile.id).first();
 if(!target||blocked)fail(403,'INTERACTION_UNAVAILABLE','This member is not available for interactions.');
 if(!target.allow_nudges||companionState(target,at)==='studying')fail(409,'DO_NOT_DISTURB','This member is focusing or has turned off gentle reminders.');
 if(companionState(target,at)==='offline')fail(409,'NOT_ONLINE','This member is offline. Try when they are connected.');
 // All cooldown triggers and the final authorization check run within one atomic batch.
 const out=await env.DB.batch([
  q(env,'DELETE FROM community_interactions WHERE expires_at<=?',at),
  q(env,`INSERT INTO community_interactions(id,room_id,sender_id,recipient_id,kind,created_at,expires_at)
   SELECT ?,?,?,?,?,?,? WHERE EXISTS(
    SELECT 1 FROM community_members s JOIN community_rooms r ON r.id=s.room_id JOIN community_members d ON d.room_id=r.id
    LEFT JOIN community_timers t ON t.profile_id=d.profile_id AND t.room_id=d.room_id
    WHERE r.id=? AND r.closed_at=0 AND s.profile_id=? AND s.banned=0 AND s.left_at=0 AND s.muted_until<=?
    AND d.profile_id=? AND d.banned=0 AND d.left_at=0 AND d.allow_nudges=1 AND d.last_seen>?
    AND NOT(COALESCE(t.status,'')='running' AND t.last_at>=? AND t.check_at>?)
    AND NOT EXISTS(SELECT 1 FROM community_blocks b WHERE (b.blocker_id=s.profile_id AND b.blocked_id=d.profile_id) OR (b.blocker_id=d.profile_id AND b.blocked_id=s.profile_id))
    AND EXISTS(SELECT 1 FROM sessions ss JOIN community_profiles p ON p.account_id=ss.account_id WHERE ss.token_hash=? AND ss.expires_at>? AND p.id=s.profile_id)
   ) ON CONFLICT(id) DO NOTHING RETURNING id`,input.id,roomId,profile.id,input.targetId,input.kind,at,at+600000,roomId,profile.id,at,input.targetId,at-75000,at-90000,at,user.sessionHash,at)
 ]);
 if(!out[1].results?.length){const duplicate=await q(env,'SELECT room_id,sender_id,recipient_id,kind FROM community_interactions WHERE id=?',input.id).first();if(duplicate?.room_id===roomId&&duplicate.sender_id===profile.id&&duplicate.recipient_id===input.targetId&&duplicate.kind===input.kind)return result({sent:true,id:input.id});fail(409,'INTERACTION_UNAVAILABLE','The member’s availability changed. Please refresh.');}
 await signal(roomId);return result({sent:true,id:input.id,cooldownUntil:at+300000},201);
}
