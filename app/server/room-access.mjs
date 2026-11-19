import {groupGrantSQL,groupLimitSQL,ownerEntitlements} from './community-entitlements.mjs';
import {fail} from './auth-shared.mjs';
const q=(env,sql,...args)=>env.DB.prepare(sql).bind(...args);
const clock=at=>{if(!Number.isSafeInteger(Math.floor(at))||at<0)throw Error('Invalid access clock');return Math.floor(at);};
// All expressions are internal SQL identifiers. No request text is interpolated.
export function activeGrantSQL(r,at){return groupGrantSQL(r+'.owner_id',clock(at));}
export function freeRoomSQL(r){return `COALESCE((SELECT pref.free_room_id FROM community_room_preferences pref JOIN community_rooms chosen ON chosen.id=pref.free_room_id AND chosen.owner_id=pref.owner_id AND chosen.closed_at=0 WHERE pref.owner_id=${r}.owner_id),(SELECT first.id FROM community_rooms first WHERE first.owner_id=${r}.owner_id AND first.closed_at=0 ORDER BY first.created_at,first.id LIMIT 1))`;}
export function roomActiveSQL(r,at){return `(${r}.closed_at=0 AND CASE WHEN ${activeGrantSQL(r,at)} THEN (SELECT count(*) FROM community_rooms ranked WHERE ranked.owner_id=${r}.owner_id AND ranked.closed_at=0 AND (ranked.created_at<${r}.created_at OR (ranked.created_at=${r}.created_at AND ranked.id<=${r}.id)))<=10 ELSE ${r}.id=${freeRoomSQL(r)} END)`;}
export function participationSQL(roomExpr,profileExpr,at){
 const paid=activeGrantSQL('access_room',at),rank=`(SELECT count(*) FROM community_members prior WHERE prior.room_id=access_m.room_id AND prior.banned=0 AND prior.left_at=0 AND prior.profile_id<>access_room.owner_id AND (prior.joined_at<access_m.joined_at OR (prior.joined_at=access_m.joined_at AND prior.profile_id<=access_m.profile_id)))`,capacity=`MIN(access_room.capacity,${groupLimitSQL('access_room.owner_id',clock(at))})-1`;
 return `EXISTS(SELECT 1 FROM community_rooms access_room JOIN community_members access_m ON access_m.room_id=access_room.id WHERE access_room.id=${roomExpr} AND access_m.profile_id=${profileExpr} AND access_m.left_at=0 AND access_m.banned=0 AND ${roomActiveSQL('access_room',at)} AND (access_m.profile_id=access_room.owner_id OR CASE WHEN ${paid} THEN ${rank}<=${capacity} WHEN access_room.free_seats_chosen_at>0 THEN EXISTS(SELECT 1 FROM json_each(access_room.free_member_ids) selected WHERE selected.value=access_m.profile_id) ELSE ${rank}<=${capacity} END))`;
}
export async function roomAccess(env,roomId,profileId,at){
 const room=await q(env,`SELECT r.*,${roomActiveSQL('r',at)} room_active,${freeRoomSQL('r')} free_room_id FROM community_rooms r WHERE r.id=?`,roomId).first();
 if(!room)return{roomActive:false,canParticipate:false,memberLimit:4,expiresAt:0};
 const rights=await ownerEntitlements(env,room.owner_id,at);
 const seat=profileId?await q(env,`SELECT ${participationSQL('m.room_id','m.profile_id',at)} can_participate FROM community_members m WHERE m.room_id=? AND m.profile_id=?`,roomId,profileId).first():null;
 return{roomActive:!!room.room_active,canParticipate:!!seat?.can_participate,memberLimit:Math.min(room.capacity,rights.memberLimit),freeRoomId:room.free_room_id,expiresAt:rights.expiresAt||0,subscriptionActive:rights.source==='subscription',advancedActive:rights.advanced,source:rights.source,freeMemberIds:JSON.parse(room.free_member_ids),seatsVersion:room.version};
}
export function requireParticipation(access){if(!access.canParticipate)fail(403,'ROOM_READ_ONLY',access.roomActive?'Your place is read only under the owner’s current plan. The owner can choose the active places.':'This room is read only under the owner’s current plan. Choose it as the free room or restore the subscription.');}
