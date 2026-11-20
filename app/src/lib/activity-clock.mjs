import {activityPhase} from './group-activities.mjs';
// Presentation only. Credits, leases and heartbeat settlement remain server-owned.
export function activityClock(activity,timer,now){
 const phase=activityPhase(activity,now),focusEnd=activity.startedAt+activity.focusMinutes*60000;
 const end=phase==='focus'?focusEnd:focusEnd+activity.breakMinutes*60000;
 const remaining=['focus','break'].includes(phase)?Math.max(0,Math.ceil((end-now)/1000)):0;
 const matches=!!timer&&timer.activity_id===activity.id&&timer.room_id===activity.roomId;
 const fresh=matches&&timer.status==='running'&&now-timer.last_at<=90000&&now<timer.check_at&&phase==='focus';
 const saved=matches?Math.max(0,Number(timer.credited_seconds)||0):0;
 const tail=fresh?Math.max(0,Math.floor((Math.min(now,timer.check_at,focusEnd)-timer.last_at)/1000)):0;
 return {phase,remaining,matches,running:fresh,seconds:saved+tail,needsCheck:matches&&(timer.status==='check'||timer.status==='running'&&!fresh&&phase==='focus')};
}
export const activityClockText=seconds=>{const s=Math.max(0,Math.floor(seconds||0));return [Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(n=>String(n).padStart(2,'0')).join(':');};
