import {fail} from './auth-shared.mjs';
export const FREE_ROOM_MEMBERS=4;
export async function communityEntitlements(env,accountId,at){
 const row=accountId?await env.DB.prepare('SELECT member_limit,free_text FROM community_entitlements WHERE account_id=? AND expires_at>?').bind(accountId,at).first():null;
 return {memberLimit:row?.member_limit||FREE_ROOM_MEMBERS,freeText:row?.free_text===1};
}
export async function ownerEntitlements(env,profileId,at){
 const row=await env.DB.prepare('SELECT account_id FROM community_profiles WHERE id=?').bind(profileId).first();
 return communityEntitlements(env,row?.account_id,at);
}
export function checkRoomCapacity(capacity,entitlements,existingCapacity=0){
 if(capacity>entitlements.memberLimit&&capacity!==existingCapacity)fail(403,'CAPACITY_ENTITLEMENT','Free rooms have up to four members, including the owner. Larger rooms will be available with subscriptions.');
}
// Use inside the membership write so concurrent joins/restores cannot bypass the owner's limit.
export const ownerLimitSQL=`COALESCE((SELECT e.member_limit FROM community_entitlements e JOIN community_profiles p ON p.account_id=e.account_id WHERE p.id=community_rooms.owner_id AND e.expires_at>?),4)`;
