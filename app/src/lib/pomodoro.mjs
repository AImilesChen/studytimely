import {elapsedMs,formatTime,human,validateSettings} from './model.mjs';
export const POMODORO_TIMING=['studyMinutes','shortBreak','longBreak','longEvery','cycleLimit','subject'];
export const POMODORO_PRESETS=[[25,5],[50,10],[15,3]];
export function pomodoroDraft(settings){return Object.fromEntries([...POMODORO_TIMING,'autoBreak','autoStudy','sound','volume'].map(k=>[k,settings[k]]));}
export function pomodoroPatch(draft){const out={...draft};for(const k of ['studyMinutes','shortBreak','longBreak','longEvery','cycleLimit','volume']){if(!/^\d+$/.test(String(out[k])))throw Error('Use whole numbers for durations, round counts and volume.');out[k]=Number(out[k]);}validateSettings(out);return Object.fromEntries([...POMODORO_TIMING,'autoBreak','autoStudy','sound','volume'].map(k=>[k,out[k]]));}
export function pomodoroPlan(s){
 const count=s.cycleLimit||s.longEvery,rows=[];let studyMinutes=0,breakMinutes=0,lastStudyEnd=0;
 for(let i=1;i<=count;i++){studyMinutes+=s.studyMinutes;rows.push({key:`study-${i}`,label:`Study ${i}`,phase:'Study',minutes:s.studyMinutes,endMinutes:studyMinutes+breakMinutes});lastStudyEnd=studyMinutes+breakMinutes;if(i<count||!s.cycleLimit){const long=i%s.longEvery===0,minutes=long?s.longBreak:s.shortBreak;breakMinutes+=minutes;rows.push({key:`break-${i}`,label:long?'Long break':'Short break',phase:long?'Long break':'Short break',minutes,endMinutes:studyMinutes+breakMinutes});}}
 return {count,rows,studyMinutes,breakMinutes,lastStudyEnd,totalMinutes:studyMinutes+breakMinutes,continuous:!s.cycleLimit};
}
export function pomodoroView(t,s,now,sessions=[]){
 const completed=t?.completedStudies||0,phase=t?.phase||'Study',status=t?.status||'ready',elapsed=t?elapsedMs(t,now):0,duration=t?.durationSeconds||s.studyMinutes*60;
 const round=s.cycleLimit?Math.min(completed+1,s.cycleLimit):completed%s.longEvery+1;
 const next=phase==='Study'?(s.cycleLimit&&completed+1>=s.cycleLimit?'Routine complete':(completed+1)%s.longEvery===0?'Long break':'Short break'):'Study';
 const nextMinutes=next==='Study'?s.studyMinutes:next==='Long break'?s.longBreak:next==='Short break'?s.shortBreak:0;
 const records=t?sessions.filter(x=>x.mode==='pomodoro'&&x.id.startsWith(t.rootId+':')):[];
 return {phase,status,completed,round,roundTarget:s.cycleLimit||s.longEvery,next,nextMinutes,parts:formatTime(Math.max(0,Math.ceil(duration-elapsed/1000))),elapsed,records,seconds:records.reduce((n,r)=>n+r.durationSeconds,0),partialCount:records.filter(r=>r.status==='Ended early').length};
}
export const pomodoroMinutes=minutes=>human(minutes*60);
