import {fail} from './auth-shared.mjs';
export const FREE_ROOM_MEMBERS=4;
export const FREE_OWNED_ROOMS=1,SUBSCRIBER_OWNED_ROOMS=10;
export const previewSQL=(owner,at)=>`EXISTS(SELECT 1 FROM community_group_previews gp JOIN community_profiles p ON p.account_id=gp.account_id JOIN community_group_policy pol ON pol.id=1 WHERE p.id=${owner} AND gp.enabled=1 AND pol.enabled=1 AND (pol.ends_at=0 OR pol.ends_at>${at}))`;
export const paidSQL=(owner,at)=>`EXISTS(SELECT 1 FROM account_entitlement_sources e JOIN community_profiles p ON p.account_id=e.account_id WHERE p.id=${owner} AND e.expires_at>${at})`;
export const groupGrantSQL=(owner,at)=>`(${paidSQL(owner,at)} OR ${previewSQL(owner,at)})`;
export const groupLimitSQL=(owner,at)=>`COALESCE((SELECT MAX(e.member_limit) FROM account_entitlement_sources e JOIN community_profiles p ON p.account_id=e.account_id WHERE p.id=${owner} AND e.expires_at>${at}),CASE WHEN ${previewSQL(owner,at)} THEN 24 ELSE 4 END)`;
export async function communityEntitlements(env,accountId,at){
 const row=accountId?await env.DB.prepare('SELECT MAX(CASE WHEN expires_at>? THEN member_limit END) AS member_limit,MAX(CASE WHEN expires_at>? THEN free_text END) AS free_text,MAX(expires_at) AS expires_at FROM account_entitlement_sources WHERE account_id=?').bind(at,at,accountId).first():null;
 const policy=await env.DB.prepare('SELECT enabled,ends_at FROM community_group_policy WHERE id=1').bind().first(),available=!!policy?.enabled&&(!policy.ends_at||policy.ends_at>at);
 const preview=accountId?await env.DB.prepare('SELECT enabled FROM community_group_previews WHERE account_id=?').bind(accountId).first():null;
 const paid=row&&row.expires_at>at,source=paid?'subscription':available&&preview?.enabled?'preview':'free',advanced=source!=='free';
 return {memberLimit:paid?row.member_limit:(advanced?24:4),freeText:paid?row.free_text===1:source==='preview',roomLimit:advanced?10:1,advanced,source,previewAvailable:available,previewEnabled:available&&!!preview?.enabled,expiresAt:source==='preview'?policy.ends_at:source==='subscription'?row.expires_at:Math.max(row?.expires_at||0,preview?.enabled&&policy?.ends_at<=at?policy.ends_at:0)};
}
export async function ownerEntitlements(env,profileId,at){const row=await env.DB.prepare('SELECT account_id FROM community_profiles WHERE id=?').bind(profileId).first();return communityEntitlements(env,row?.account_id,at);}
export function checkRoomCapacity(capacity,entitlements,existingCapacity=0){if(capacity>entitlements.memberLimit&&capacity!==existingCapacity)fail(403,'CAPACITY_ENTITLEMENT','Free rooms have up to four members, including the owner. Enable the advanced preview or use an active subscription for a larger room.');}
export const ownerLimitSQL=`(SELECT ${groupLimitSQL('community_rooms.owner_id','clock.at')} FROM (SELECT ? AS at) clock)`;
export const groupManagerSQL=(room,person,at)=>`(${room}.owner_id=${person} OR (${groupGrantSQL(room+'.owner_id',at)} AND EXISTS(SELECT 1 FROM community_group_roles gr WHERE gr.room_id=${room}.id AND gr.profile_id=${person}) AND ${room}.closed_at=0 AND EXISTS(SELECT 1 FROM community_members cm WHERE cm.room_id=${room}.id AND cm.profile_id=${person} AND cm.banned=0 AND cm.left_at=0 AND (SELECT count(*) FROM community_members prior WHERE prior.room_id=cm.room_id AND prior.banned=0 AND prior.left_at=0 AND prior.profile_id<>${room}.owner_id AND (prior.joined_at<cm.joined_at OR (prior.joined_at=cm.joined_at AND prior.profile_id<=cm.profile_id)))<MIN(${room}.capacity,${groupLimitSQL(room+'.owner_id',at)}))))`;
