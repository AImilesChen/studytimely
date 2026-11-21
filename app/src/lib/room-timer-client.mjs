// Shared wire protocol for the room page and the Study Center. Credit stays on the server.
export const ROOM_LEASE_KEY='studytimely-room-lease';
export function readRoomLease(storage){try{return storage?.getItem(ROOM_LEASE_KEY)||'';}catch{return '';}}
export async function beginRoomTimer(request,storage,{roomId,joinRound=false,activityId}){
 const result=await request('/timer/start','POST',{roomId,joinRound,...(activityId?{activityId}:{})});
 try{storage?.setItem(ROOM_LEASE_KEY,result.timer.lease);}catch{}
 return result;
}
export const pauseRoomTimer=(request,lease)=>request('/timer/pause','POST',{lease});
export function roomHeartbeat({request,lease,onResult,onError,schedule=setInterval,cancel=clearInterval}){
 let stopped=false,inFlight=false;
 const beat=async()=>{if(stopped||inFlight)return;inFlight=true;try{const result=await request('/timer/heartbeat','POST',{lease});if(!stopped)onResult(result);}catch(e){if(!stopped)onError(e);}finally{inFlight=false;}};
 const timer=schedule(beat,30000);return()=>{stopped=true;cancel(timer);};
}
export function roomClock(timer,lease,at,roomId){
 const owns=!!timer&&!!lease&&timer.lease===lease,live=at>0&&timer?.status==='running'&&at>=timer.last_at&&at-timer.last_at<=90000&&at<timer.check_at;
 const inRoom=timer?.room_id===roomId,confirmed=Math.max(0,timer?.credited_seconds||0);
 const provisional=live?Math.max(0,Math.floor((Math.min(at,timer.check_at)-timer.last_at)/1000)):0;
 return{owns,live,inRoom,seconds:inRoom?confirmed+provisional:0,needsCheck:!!timer&&(timer.status==='check'||timer.status==='running'&&!live)};
}
