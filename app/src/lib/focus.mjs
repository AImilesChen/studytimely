import {elapsedMs,formatTime,parseDuration,validateSettings} from './model.mjs';

export const FOCUS_PRESETS=[15,25,45,60];
export function focusPatch(parts,subject,settings){
 const focusSeconds=parseDuration(...parts);
 validateSettings({...settings,focusSeconds,subject});
 return {focusSeconds,subject};
}
export function focusView(timer,settings,now,sessions=[]){
 const t=timer?.mode==='focus'?timer:null,seconds=t?.durationSeconds||settings.focusSeconds;
 const elapsed=Math.floor(elapsedMs(t,now)/1000);
 return {status:t?.status||'ready',elapsed,parts:formatTime(Math.max(0,seconds-elapsed)),record:t?sessions.find(r=>r.id===t.id&&r.mode==='focus'):null};
}
