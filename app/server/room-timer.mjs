import {COMMUNITY,utcDay,creditWindow} from '../src/lib/community-model.mjs';
import {roomAccess,participationSQL} from './room-access.mjs';
const q=(env,sql,...args)=>env.DB.prepare(sql).bind(...args);
export async function settleRoomTimer(env,current,at,pause=false){
 const day=utcDay(at);
    let bounded=current;
    if(current.activity_id){const activity=await q(env,'SELECT a.*,m.checked_out_at,m.withdrawn_at FROM community_activities a JOIN community_activity_members m ON m.activity_id=a.id AND m.profile_id=? WHERE a.id=?',current.profile_id,current.activity_id).first();
     const end=activity?Math.min(activity.started_at+activity.focus_minutes*60000,activity.ended_at||Infinity,activity.checked_out_at||Infinity,activity.withdrawn_at||Infinity):current.last_at;
     bounded={...current,check_at:Math.min(current.check_at,end)};
    }
    const access=await roomAccess(env,current.room_id,current.profile_id,at);
    if(!access.canParticipate){const end=access.expiresAt>0&&access.expiresAt<=at?access.expiresAt:current.last_at;bounded={...bounded,check_at:Math.min(bounded.check_at,end)};pause=true;}
    const window=creditWindow(bounded,at),statements=[],creditIds=[];let capReached=false;
    for(const [i,segment] of window.segments.entries()){
     const daily=await q(env,'SELECT seconds FROM community_daily WHERE profile_id=? AND day=?',current.profile_id,segment.day).first();const seconds=Math.min(segment.seconds,Math.max(0,COMMUNITY.dailyCapSeconds-(daily?.seconds||0)));if(segment.day===day&&(daily?.seconds||0)+seconds>=COMMUNITY.dailyCapSeconds)capReached=true;if(!seconds)continue;creditIds.push(current.lease+':'+current.last_at+':'+i);
     statements.push(q(env,`INSERT INTO community_credits(id,profile_id,room_id,day,seconds,created_at,activity_id) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM community_timers t JOIN community_members m ON m.profile_id=t.profile_id AND m.room_id=t.room_id JOIN community_rooms r ON r.id=t.room_id WHERE t.profile_id=? AND t.lease=? AND t.last_at=? AND t.status='running' AND m.banned=0 AND m.left_at=0 AND r.closed_at=0 AND ${participationSQL('r.id','m.profile_id',Math.max(current.last_at,Math.min(at,bounded.check_at)-1))}) ON CONFLICT(id) DO NOTHING`,current.lease+':'+current.last_at+':'+i,current.profile_id,current.room_id,segment.day,seconds,at,current.activity_id||null,current.profile_id,current.lease,current.last_at));
    }
    const status=pause?'paused':window.needsCheck||capReached?'check':'running';
    const creditedSQL=creditIds.length?`COALESCE((SELECT sum(seconds) FROM community_credits WHERE id IN (${creditIds.map(()=>'?').join(',')})),0)`:'0';
    statements.push(q(env,`UPDATE community_timers SET last_at=?,status=CASE WHEN ${participationSQL('community_timers.room_id','community_timers.profile_id',at)} THEN ? ELSE 'paused' END,credited_seconds=credited_seconds+${creditedSQL} WHERE profile_id=? AND lease=? AND last_at=? AND status='running'`,at,status,...creditIds,current.profile_id,current.lease,current.last_at));
    await env.DB.batch(statements);return {timer:await q(env,'SELECT * FROM community_timers WHERE profile_id=?',current.profile_id).first(),serverNow:at,needsCheck:window.needsCheck,capReached};
}
