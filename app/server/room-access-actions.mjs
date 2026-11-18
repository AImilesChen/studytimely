import {roomAccess} from './room-access.mjs';
import {body,fail,result,rateLimit} from './auth-shared.mjs';
const q=(env,sql,...args)=>env.DB.prepare(sql).bind(...args),uuid=v=>typeof v==='string'&&/^[a-f0-9-]{36}$/.test(v);
export async function accessSelection({request,env,profile,user,room,permissions,at,settle,signal}){
 const input=await body(request);if(!Number.isInteger(input.version)||input.version<0)fail(400,'VERSION','Refresh before choosing the free room or places.');
 await rateLimit(env,'room-access-selection',profile.id,60,3600000,at);
 const rights=await permissions();
 if(!room){
  if(!uuid(input.roomId))fail(400,'INVALID','Choose one of your open rooms.');
  const owned=await q(env,'SELECT id FROM community_rooms WHERE id=? AND owner_id=? AND closed_at=0',input.roomId,profile.id).first();if(!owned)fail(403,'FORBIDDEN','Choose one of your own open rooms.');
  const previous=await q(env,'SELECT version FROM community_room_preferences WHERE owner_id=?',profile.id).first();if((previous?.version||0)!==input.version)fail(409,'CONFLICT','The room selection changed. Refresh before choosing again.');
  if(rights.roomLimit===1&&(await roomAccess(env,input.roomId,profile.id,at)).freeRoomId!==input.roomId){const timers=(await q(env,"SELECT t.* FROM community_timers t JOIN community_rooms r ON r.id=t.room_id WHERE r.owner_id=? AND t.status='running'",profile.id).all()).results||[];for(const timer of timers)await settle(timer,true);}
  const saved=await q(env,`INSERT INTO community_room_preferences(owner_id,free_room_id,updated_at) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM community_rooms r JOIN community_profiles p ON p.id=r.owner_id JOIN sessions s ON s.account_id=p.account_id WHERE r.id=? AND r.owner_id=? AND r.closed_at=0 AND s.token_hash=? AND s.expires_at>?) AND (?=0 OR EXISTS(SELECT 1 FROM community_room_preferences WHERE owner_id=? AND version=?)) ON CONFLICT(owner_id) DO UPDATE SET free_room_id=excluded.free_room_id,updated_at=excluded.updated_at,version=version+1 WHERE community_room_preferences.version=? RETURNING version`,profile.id,input.roomId,at,input.roomId,profile.id,user.sessionHash,at,input.version,profile.id,input.version,input.version).first();
  if(!saved)fail(409,'CONFLICT','The room selection or your access changed. Refresh before choosing again.');
  for(const r of (await q(env,'SELECT id FROM community_rooms WHERE owner_id=?',profile.id).all()).results||[])await signal(r.id);return result({saved:true,version:saved.version});
 }
 if(room.owner_id!==profile.id||room.closed_at)fail(403,'FORBIDDEN','Only the owner can choose free places in an open room.');
 if(!Array.isArray(input.profileIds)||input.profileIds.length>Math.min(4,room.capacity)-1||new Set(input.profileIds).size!==input.profileIds.length||input.profileIds.some(id=>!uuid(id)||id===profile.id))fail(400,'INVALID','Choose up to three other members; the owner always keeps a place.');
 if(input.version!==room.version)fail(409,'CONFLICT','The room changed. Refresh before saving places.');
 const members=(await q(env,'SELECT profile_id FROM community_members WHERE room_id=? AND left_at=0 AND banned=0',room.id).all()).results||[];
 if(input.profileIds.some(id=>!members.some(m=>m.profile_id===id)))fail(400,'INVALID','Choose current members of this room.');
 if(rights.roomLimit===1){const timers=(await q(env,"SELECT * FROM community_timers WHERE room_id=? AND status='running'",room.id).all()).results||[];for(const timer of timers)if(timer.profile_id!==profile.id&&!input.profileIds.includes(timer.profile_id))await settle(timer,true);}
 const ids=JSON.stringify(input.profileIds);
 const saved=await q(env,`UPDATE community_rooms SET free_member_ids=?,free_seats_chosen_at=?,version=version+1 WHERE id=? AND owner_id=? AND closed_at=0 AND version=? AND NOT EXISTS(SELECT 1 FROM json_each(?) selected WHERE NOT EXISTS(SELECT 1 FROM community_members m WHERE m.room_id=community_rooms.id AND m.profile_id=selected.value AND m.left_at=0 AND m.banned=0)) AND EXISTS(SELECT 1 FROM community_profiles p JOIN sessions s ON s.account_id=p.account_id WHERE p.id=? AND s.token_hash=? AND s.expires_at>?) RETURNING version`,ids,at,room.id,profile.id,input.version,ids,profile.id,user.sessionHash,at).first();
 if(!saved)fail(409,'CONFLICT','The member list or your access changed. Refresh before saving places.');await signal(room.id);return result({saved:true,version:saved.version});
}
