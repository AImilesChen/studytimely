import {elapsedMs,formatTime} from './model.mjs';
export const COUNTDOWN_PRESETS=[5,10,15,30,45,60];
export function countdownView(timer,seconds,now){
 const t=timer?.mode==='countdown'?timer:null,total=t?.durationSeconds||seconds,elapsed=t?elapsedMs(t,now):0,status=t?.status||'ready';
 const remaining=status==='completed'?0:Math.max(0,Math.ceil(total-elapsed/1000));
 const deadline=status==='running'?t.since+Math.max(0,total*1000-t.baseMs):null;
 const endedAt=status==='completed'?t.segments?.at(-1)?.[1]||null:null;
 return {status,total,remaining,parts:formatTime(remaining),deadline,endedAt};
}
export function countdownCanRing(previous,current,owner,now){
 if(!current||current.mode!=='countdown'||current.status!=='completed'||current.owner!==owner||previous?.id!==current.id||previous.status!=='running')return false;
 const end=current.segments?.at(-1)?.[1];return Number.isFinite(end)&&now>=end&&now-end<=60000;
}
