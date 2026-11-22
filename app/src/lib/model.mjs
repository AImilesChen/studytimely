import {focusConfig,focusTimerPatch} from './focus-space.mjs';
import {recordGoal} from './learning-history.mjs';
import {reminderAction} from './reminder.mjs';
import {MUSIC_TRACKS,MUSIC_REPEAT,musicTrack,validateMusicList} from './music-catalog.mjs';
import {DEFAULT_MIXES,validateMix,validateMixes} from './sound-settings.mjs';
import {cityFor} from './world-clock.mjs';
import {PREFERENCE_KEYS,pickPreferences} from './preferences.mjs';
import {emptyWorkspace,validateWorkspace,workspaceAction,mergeWorkspace} from './workspace.mjs';
export const SCHEMA=1;
export const MAX_GAP=30*60*1000;
export const MAX_RUN=24*60*60*1000;
export const MODES=['study','pomodoro','focus','countdown','stopwatch','clock','alarm'];
const EXTRA_LAST_PAGES={alarm:'/alarm-clock',tracker:'/study-tracker',planner:'/study-planner',schedule:'/study-schedule-maker',habits:'/study-habit-tracker',syllabus:'/syllabus-tracker',exam:'/exam-countdown',aesthetic:'/aesthetic-timer',calculator:'/study-time-calculator'};
export const DEFAULT_SETTINGS={musicFavorites:[],musicQueue:[],theme:'dark',spaceTheme:'default',ambient:{},ambientVolume:60,ambientPresets:DEFAULT_MIXES,timerSize:'medium',musicTrack:MUSIC_TRACKS[0].id,musicVolume:35,musicRepeat:'all',worldClockCities:[],lastTool:'study',lastPage:'',reducedMotion:false,rememberPreferences:true,sound:false,volume:40,clock24:true,showSeconds:true,showDate:true,studyMinutes:25,shortBreak:5,longBreak:15,longEvery:4,cycleLimit:0,autoBreak:false,autoStudy:false,focusSeconds:1500,countdownSeconds:1500,subject:'',analytics:false};
export function emptyState(epoch='initial'){return{schema:SCHEMA,epoch,revision:0,settings:structuredClone(DEFAULT_SETTINGS),subjects:[],dailyGoal:0,sessions:[],timer:null,reminder:null,workspace:emptyWorkspace()};}
export class DomainError extends Error{constructor(code,message){super(message);this.code=code;}}
const fail=(code,message)=>{throw new DomainError(code,message);};
export const isStudy=mode=>['study','focus','pomodoro'].includes(mode);
export const isTimed=mode=>['focus','pomodoro','countdown'].includes(mode);
export const elapsedMs=(t,now)=>!t?0:Math.min(MAX_RUN,Math.max(0,t.baseMs+(t.status==='running'?Math.max(0,now-t.since):0)));
export const hasProgress=t=>!!t&&(t.status==='running'||(t.status==='paused'&&t.baseMs>0)||t.status==='review');
export const durationFor=(mode,phase,s)=>mode==='pomodoro'?(phase==='Study'?s.studyMinutes:phase==='Long break'?s.longBreak:s.shortBreak)*60:mode==='focus'?s.focusSeconds:mode==='countdown'?s.countdownSeconds:0;
export function makeTimer(mode,s,id,now,owner){return{id:id+':0',rootId:id,sequence:0,mode,phase:'Study',status:'ready',owner,baseMs:0,since:null,startedAt:null,lastObserved:now,segments:[],durationSeconds:durationFor(mode,'Study',s),subject:s.subject||'',completedStudies:0,laps:[]};}
export function takeIntervals(intervals,limit=Infinity){const out=[];let left=Math.max(0,limit);for(const [start,end] of intervals){const ms=Math.min(left,Math.max(0,end-start));if(ms>0)out.push([start,start+ms]);left-=ms;if(left<=0)break;}return out;}
const sumIntervals=xs=>xs.reduce((sum,[a,b])=>sum+Math.max(0,b-a),0);
export function intervalsAt(t,now){return takeIntervals([...t.segments,...(t.status==='running'?[[t.since,Math.max(t.since,now)]]:[])],t.durationSeconds?t.durationSeconds*1000:MAX_RUN);}
function pauseTimer(t,now){t.segments=intervalsAt(t,now);t.baseMs=sumIntervals(t.segments);t.since=null;t.status='paused';t.lastObserved=now;}
function record(state,t,now,status){
 if(!isStudy(t.mode)||t.phase!=='Study')return false;
 const intervals=intervalsAt(t,now),seconds=Math.floor(sumIntervals(intervals)/1000);
 if(seconds<1||state.sessions.some(s=>s.id===t.id))return false;
 const segments=takeIntervals(intervals,seconds*1000);
 state.sessions.unshift({id:t.id,mode:t.mode,subject:t.subject,startedAt:segments[0][0],endedAt:segments.at(-1)[1],durationSeconds:seconds,status,segments,...Object.fromEntries(['taskId','taskTitle','planId','chapterId','chapterTitle','planningBlockId'].filter(k=>t[k]).map(k=>[k,t[k]]))});
 return true;
}
function review(t,now,reason){
 const candidate=intervalsAt(t,now);const last=Math.min(now,t.lastObserved);
 pauseTimer(t,last);t.status='review';t.reviewReason=reason;t.reviewSegments=candidate;t.reviewMaxSeconds=Math.floor(sumIntervals(candidate)/1000);t.lastObserved=now;
}
function nextPomodoro(state,t,now,phase,completed=t.completedStudies,run=false){
 state.timer={...makeTimer('pomodoro',state.settings,t.rootId,now,t.owner),...(t.studioAudio?{studioAudio:t.studioAudio}:{}),...Object.fromEntries(['taskId','taskTitle','planId','chapterId','chapterTitle','planningBlockId'].filter(k=>t[k]).map(k=>[k,t[k]])),id:t.rootId+':'+(t.sequence+1),sequence:t.sequence+1,phase,completedStudies:completed,durationSeconds:durationFor('pomodoro',phase,state.settings),subject:t.subject,status:run?'running':'ready',since:run?now:null,startedAt:run?now:null};
}
function settle(state,now){
 const t=state.timer;if(!t||t.status!=='running')return null;
 if(t.mode==='alarm'){t.lastObserved=now;if(now>=t.alarmAt){t.status='completed';t.since=null;return'completed';}return null;}
 if(t.mode==='stopwatch'){
  if(now<t.lastObserved-1000){pauseTimer(t,t.lastObserved);t.lastObserved=now;return'stopwatch-clock';}
  if(elapsedMs(t,now)>=MAX_RUN){pauseTimer(t,t.since+Math.max(0,MAX_RUN-t.baseMs));t.status='completed';t.lastObserved=now;return'stopwatch-limit';}
  t.lastObserved=now;return null;
 }
 // General countdowns measure elapsed duration, not verified study. Delayed
 // callbacks settle at the original deadline and never ask for study credit.
 if(t.mode==='countdown'){
  if(now<t.lastObserved-1000){pauseTimer(t,t.lastObserved);t.lastObserved=now;return'countdown-clock';}
  if(elapsedMs(t,now)>=t.durationSeconds*1000){pauseTimer(t,now);t.status='completed';return'completed';}
  t.lastObserved=now;return null;
 }
 const resting=t.mode==='pomodoro'&&t.phase!=='Study';
 if(now<t.lastObserved-1000){if(resting){pauseTimer(t,t.lastObserved);t.lastObserved=now;return'pomodoro-break-clock';}review(t,now,'clock');return'review';}
 if(!resting&&(now-t.lastObserved>MAX_GAP||elapsedMs(t,now)>=MAX_RUN)){review(t,now,'gap');return'review';}
 if(!t.durationSeconds||elapsedMs(t,now)<t.durationSeconds*1000){t.lastObserved=now;return null;}
 const saved=record(state,t,now,'Completed');
 if(t.mode!=='pomodoro') {pauseTimer(t,now);t.status='completed';return saved?'saved':'completed';}
 const completed=t.completedStudies+(t.phase==='Study'?1:0);
 if(t.phase==='Study'&&state.settings.cycleLimit&&completed>=state.settings.cycleLimit){pauseTimer(t,now);t.completedStudies=completed;t.status='completed';return'saved';}
 const phase=t.phase==='Study'?(completed%state.settings.longEvery===0?'Long break':'Short break'):'Study';
 const auto=phase==='Study'?state.settings.autoStudy:state.settings.autoBreak;
 nextPomodoro(state,t,now,phase,completed,auto);
 // A delayed browser callback never fabricates a chain of unattended sessions.
 return phase==='Study'?'next-study':'break';
}
function ownerGuard(state,owner){if(hasProgress(state.timer)&&state.timer.owner!==owner)fail('OTHER_TAB','This session is controlled in another tab. Move it here before changing it.');}
function integer(n,min,max,label){if(!Number.isInteger(n)||n<min||n>max)fail('INVALID',`${label} must be a whole number from ${min} to ${max}.`);return n;}
export function validateSettings(input){
 const s={...DEFAULT_SETTINGS,...input};
 // Preserve the legacy six-mode setting so older open tabs can still validate state.
 if(EXTRA_LAST_PAGES[s.lastTool]){s.lastPage=s.lastPage||EXTRA_LAST_PAGES[s.lastTool];s.lastTool='study';}
 if(!MODES.includes(s.lastTool)||s.lastTool==='alarm')fail('INVALID','Choose a supported last tool.');
 if(typeof s.lastPage!=='string'||s.lastPage.length>100)fail('INVALID','Invalid last page.');
 if(!['dark','light'].includes(s.theme))fail('INVALID','Choose a supported theme.');
 if(!['default','midnight','sand','rain','forest','coffee','desk','terracotta','paper','rose'].includes(s.spaceTheme))fail('INVALID','Choose a supported study space.');
 try{s.ambient=validateMix(s.ambient);s.ambientPresets=validateMixes(s.ambientPresets);}catch(e){fail('INVALID',e.message);}
 integer(s.ambientVolume,0,100,'Ambient volume');
 integer(s.musicVolume,0,100,'Music volume');
 try{s.musicFavorites=validateMusicList(s.musicFavorites);s.musicQueue=validateMusicList(s.musicQueue);}catch(e){fail('INVALID',e.message);}
 if(!musicTrack(s.musicTrack)||!MUSIC_REPEAT.includes(s.musicRepeat))fail('INVALID','Choose a supported music track and repeat setting.');
 if(!['small','medium','large'].includes(s.timerSize))fail('INVALID','Choose a supported timer size.');
 for(const k of ['reducedMotion','rememberPreferences','sound','clock24','showSeconds','showDate','autoBreak','autoStudy','analytics'])if(typeof s[k]!=='boolean')fail('INVALID','Invalid preference.');
 integer(s.volume,0,100,'Volume');integer(s.studyMinutes,1,240,'Study duration');integer(s.shortBreak,1,60,'Short break');integer(s.longBreak,1,120,'Long break');integer(s.longEvery,2,12,'Long-break interval');integer(s.cycleLimit,0,100,'Cycle limit');integer(s.focusSeconds,1,14400,'Focus duration');integer(s.countdownSeconds,1,86399,'Countdown duration');
 if(!Array.isArray(s.worldClockCities)||s.worldClockCities.length>6||new Set(s.worldClockCities).size!==s.worldClockCities.length||s.worldClockCities.some(id=>typeof id!=='string'||!cityFor(id)))fail('INVALID','Choose up to six supported world-clock cities.');
 if(typeof s.subject!=='string'||s.subject.length>40)fail('INVALID','Use a subject label of up to 40 characters.');
 return Object.fromEntries(Object.keys(DEFAULT_SETTINGS).map(k=>[k,s[k]]));
}
export function transition(previous,action,{now,owner,id}){
 if(action.epoch!==previous.epoch)fail('STALE','Site data changed in another tab. Review the current state and try again.');
 let state=structuredClone(previous),event=null;state.workspace=validateWorkspace(state.workspace);
 if(action.type==='clear')return{state:{...emptyState(id),revision:previous.revision+1},event:'cleared'};
 if(['start','pause','finish','reset','lap','phase','tick','review','clock-change'].includes(action.type)||action.type.startsWith('pomodoro-'))ownerGuard(state,owner);
 if(action.type.startsWith('pomodoro-')&&state.timer?.mode==='pomodoro'&&state.timer.completedStudies>0&&state.timer.owner!==owner)fail('OTHER_TAB','Move this Pomodoro routine here before changing it.');
 if(action.timerId&&state.timer?.id!==action.timerId)fail('STALE','The timer changed. Review its current phase.');
 if(action.type==='studio-note-task'){
  if(typeof action.noteId!=='string'||!/^[a-zA-Z0-9-]{1,100}$/.test(action.noteId))fail('INVALID','Choose a saved thought.');
  const taskId='focus-note:'+action.noteId;
  if(state.workspace.tasks.some(t=>t.id===taskId))return {state,event:'workspace-saved'};
  return transition(state,{type:'task-save',epoch:state.epoch,title:action.title,subject:'',estimateMinutes:0},{now,owner,id:taskId});
 }
 if(action.type==='studio-break'){
  if(hasProgress(state.timer))fail('BUSY','Finish the current timer before taking a break.');
  integer(action.minutes,1,60,'Break duration');
  state.timer={...makeTimer('countdown',state.settings,id,now,owner),studioBreak:true,durationSeconds:action.minutes*60,status:'running',since:now,startedAt:now};state.revision++;return {state,event:'studio-break'};
 }
 if(action.type==='studio-start'){
  if(hasProgress(state.timer))fail('BUSY','Finish or reset your current session before choosing a new task or duration.');
  let config;try{config=focusConfig(action.config);}catch(e){fail('INVALID',e.message);}
  const ctx={now,owner,id},epoch=state.epoch;
  state=transition(state,{type:'settings',patch:focusTimerPatch(config),epoch},ctx).state;
  state.timer=makeTimer(config.mode,state.settings,id,now,owner);
  let taskId=action.taskId||'';
  if(taskId&&!state.workspace.tasks.some(t=>t.id===taskId&&!t.deletedAt&&!t.done))fail('INVALID','Choose a current unfinished task.');
  if(!taskId&&action.title?.trim()){
   state=transition(state,{type:'task-save',title:action.title,subject:action.subject||'',estimateMinutes:config.minutes,epoch},{...ctx,id:id+':task'}).state;taskId=id+':task';
  }
  const started=transition(state,{type:taskId?'workspace-start':'start',mode:config.mode,...(taskId?{taskId}:{}),epoch},ctx);started.state.timer.studioAudio=config.endSound;return started;
 }
 if(action.type.startsWith('reminder-')){try{event=reminderAction(state,action,{now,owner,id});}catch(e){fail(e.code||'INVALID',e.message);}state.revision++;return {state,event};}
 if(workspaceAction(state,action,{now,owner,id})){state.revision++;return{state,event:action.type==='workspace-start'?'task-started':action.type==='habit-prepare'?'habit-prepared':'workspace-saved'};}
 switch(action.type){
 case 'alarm-arm':{if(hasProgress(state.timer)&&state.timer.mode!=='alarm')fail('BUSY','Finish or reset the active timer first.');if(!Number.isFinite(action.at)||action.at<=now||action.at>now+MAX_RUN)fail('INVALID','Choose an alarm within the next 24 hours.');state.timer={...makeTimer('alarm',state.settings,id,now,owner),alarmAt:action.at,status:'running',since:now,startedAt:now};event='alarm-set';break;}

 case 'start':{
   if(!MODES.includes(action.mode)||action.mode==='clock')fail('INVALID','Choose a timing tool.');
   if(hasProgress(state.timer)&&state.timer.mode!==action.mode)fail('BUSY','Finish or reset the active timer before switching tools.');
   if(!state.timer||state.timer.mode!==action.mode||state.timer.status==='completed')state.timer=makeTimer(action.mode,state.settings,id,now,owner);
   const t=state.timer;if(t.status==='review')fail('REVIEW','Review the recorded time before continuing.');
   if(t.status!=='running'){t.owner=owner;t.since=now;t.startedAt??=now;t.status='running';t.lastObserved=now;}break;
 }
 case 'pause':event=settle(state,now);if(state.timer?.status==='running')pauseTimer(state.timer,now);break;
 case 'tick':event=settle(state,now);break;
 case 'clock-change':if(state.timer?.mode==='alarm'){event=settle(state,now);break;}if(state.timer?.status==='running'){if(['countdown','stopwatch'].includes(state.timer.mode)||(state.timer.mode==='pomodoro'&&state.timer.phase!=='Study')){const mode=state.timer.mode;pauseTimer(state.timer,state.timer.lastObserved);state.timer.lastObserved=now;event=mode==='pomodoro'?'pomodoro-break-clock':mode+'-clock';}else{review(state.timer,now,'clock');event='review';}}break;
 case 'claim':{
   if(!state.timer)break;
   if(state.timer.mode==='stopwatch'&&state.timer.status==='review'){
    const t=state.timer,kept=Math.min(MAX_RUN,Math.max(t.baseMs,t.laps.at(-1)?.totalMs||0));t.segments=takeIntervals(t.reviewSegments||t.segments,kept);t.baseMs=kept;t.since=null;t.status=kept>=MAX_RUN?'completed':'paused';t.lastObserved=now;delete t.reviewSegments;delete t.reviewReason;delete t.reviewMaxSeconds;
   }
   event=settle(state,now);if(state.timer.status==='running'&&!['alarm','countdown','stopwatch'].includes(state.timer.mode))pauseTimer(state.timer,now);state.timer.owner=owner;event=event||(state.timer.mode==='alarm'?'alarm-moved':state.timer.mode==='countdown'?'countdown-moved':state.timer.mode==='stopwatch'?'stopwatch-moved':'moved');break;
 }
 case 'review':{
   const t=state.timer;if(t?.status!=='review')fail('STALE','There is no time review pending.');
   const seconds=integer(action.seconds,0,t.reviewMaxSeconds,'Recorded seconds');
   t.segments=takeIntervals(t.reviewSegments,seconds*1000);t.baseMs=seconds*1000;t.status='paused';t.since=null;t.lastObserved=now;
   delete t.reviewSegments;delete t.reviewReason;delete t.reviewMaxSeconds;event='reviewed';break;
 }
 case 'finish':{
   const t=state.timer;if(t?.status==='review')fail('REVIEW','Review your time before saving it.');
   const saved=t?record(state,t,now,t.durationSeconds&&elapsedMs(t,now)>=t.durationSeconds*1000?'Completed':'Ended early'):false;
   state.timer=makeTimer(action.mode||t?.mode||'study',state.settings,id,now,owner);event=saved?'saved':'no-study';break;
 }
 case 'reset':state.timer=makeTimer(action.mode||state.timer?.mode||'study',state.settings,id,now,owner);event='reset';break;
 case 'lap':{
   const t=state.timer;if(t?.mode!=='stopwatch')fail('INVALID','Laps are available on Stopwatch.');
   if(t.status!=='running')fail('INVALID','Resume the stopwatch before marking another lap.');
   event=settle(state,now);if(t.status!=='running')break;
   const total=Math.floor(elapsedMs(t,now));const last=t.laps.at(-1)?.totalMs||0;
   if(total>last)t.laps.push({number:t.laps.length+1,totalMs:total,splitMs:total-last});break;
 }
 case 'phase':{
   if(hasProgress(state.timer))fail('BUSY','Finish or reset before changing periods.');
   if(!['Study','Short break','Long break'].includes(action.phase))fail('INVALID','Choose a supported period.');
   const t=makeTimer('pomodoro',state.settings,id,now,owner);t.phase=action.phase;t.durationSeconds=durationFor('pomodoro',t.phase,state.settings);state.timer=t;break;
 }
 case 'pomodoro-end':case 'pomodoro-skip':case 'pomodoro-reset':case 'pomodoro-restart':case 'pomodoro-phase':case 'pomodoro-keep-break':{
   const t=state.timer;if(t&&t.mode!=='pomodoro'&&hasProgress(t))fail('BUSY','Finish or reset your active timer first.');
   if(action.type==='pomodoro-restart'){if(t?.mode==='pomodoro')settle(state,now);state.timer=makeTimer('pomodoro',state.settings,id,now,owner);event='pomodoro-restarted';break;}
   if(action.type==='pomodoro-phase'){
    if(!['Study','Short break','Long break'].includes(action.phase))fail('INVALID','Choose a supported period.');
    if(t&&(hasProgress(t)||t.baseMs>0||t.status==='completed'))fail('BUSY','Finish or reset this period before choosing another phase.');
    if(t?.mode==='pomodoro'){nextPomodoro(state,t,now,action.phase);state.timer.owner=owner;}else{state.timer=makeTimer('pomodoro',state.settings,id,now,owner);state.timer.phase=action.phase;state.timer.durationSeconds=durationFor('pomodoro',action.phase,state.settings);}event='pomodoro-phase';break;
   }
   if(t?.mode!=='pomodoro')fail('STALE','Open an existing Pomodoro routine first.');
   if(action.type==='pomodoro-keep-break'){
    if(t.status!=='review'||t.phase==='Study')fail('INVALID','Only an interrupted break can use this action.');t.status='paused';t.since=null;t.lastObserved=now;delete t.reviewSegments;delete t.reviewMaxSeconds;delete t.reviewReason;event='pomodoro-break-kept';break;
   }
   if(action.type==='pomodoro-reset'){
    if(t.status==='completed')fail('INVALID','Start a new routine after completing this one.');
    event=settle(state,now);if(state.timer.id!==t.id||state.timer.status==='completed')break;
    nextPomodoro(state,t,now,t.phase);event='pomodoro-reset';break;
   }
   if(t.status==='review')fail('REVIEW','Review your study time before saving or continuing.');
   if(t.status==='completed')fail('INVALID','This routine is already complete.');
   if(action.type==='pomodoro-end'&&t.phase!=='Study')fail('INVALID','Only a study period can be ended and saved.');
   if(action.type==='pomodoro-skip'&&t.phase==='Study')fail('INVALID','Use the study finish action to save actual learning time.');
   event=settle(state,now);if(state.timer.id!==t.id||state.timer.status==='completed'||state.timer.status==='review')break;
   if(action.type==='pomodoro-end'){const saved=record(state,t,now,'Ended early');nextPomodoro(state,t,now,'Short break');event=saved?'saved':'pomodoro-no-study';}
   else{nextPomodoro(state,t,now,'Study');event='pomodoro-break-skipped';}break;
 }
 case 'pomodoro-settings':{
   const t=state.timer;if(t&&t.mode!=='pomodoro'&&hasProgress(t))fail('BUSY','Finish or reset your active timer first.');
   const label=String(action.newSubject||'').trim();if(label.length>40)fail('INVALID','Use a subject label of up to 40 characters.');
   const existing=state.subjects.find(x=>x.toLowerCase()===label.toLowerCase());
   const patch={...action.patch,...(label?{subject:existing||label}:{})};const next=validateSettings({...state.settings,...patch});
   const timing=['studyMinutes','shortBreak','longBreak','longEvery','cycleLimit','subject'],changed=timing.some(k=>next[k]!==state.settings[k]);
   if(t?.mode==='pomodoro'&&(hasProgress(t)||t.baseMs>0||t.completedStudies>0||t.status==='completed')&&changed)fail('BUSY','Restart the routine before changing durations, target or subject.');
   state.settings=next;if(label&&!existing)state.subjects.push(label);if(PREFERENCE_KEYS.some(k=>JSON.stringify(next[k])!==JSON.stringify(previous.settings[k])))state.preferencesUpdatedAt=now;
   if(t?.mode==='pomodoro'&&changed){nextPomodoro(state,t,now,t.phase);state.timer.subject=next.subject;state.timer.owner=owner;}event='pomodoro-settings';break;
 }
 case 'focus-settings':
 case 'settings':{
   const focusSettings=action.type==='focus-settings';
   if(focusSettings&&hasProgress(state.timer))fail('BUSY','Finish or reset the session before changing its timing or subject.');
   const label=focusSettings?String(action.newSubject||'').trim():'';
   if(label.length>40)fail('INVALID','Use a subject label of up to 40 characters.');
   if(focusSettings&&Object.keys(action.patch||{}).some(k=>!['focusSeconds','subject'].includes(k)))fail('INVALID','Only focus duration and subject can be changed here.');
   const existing=label&&state.subjects.find(x=>x.toLowerCase()===label.toLowerCase());
   const patch={...action.patch,...(label?{subject:existing||label}:{})};
   const next=validateSettings({...state.settings,...patch});
   const timedKeys=['studyMinutes','shortBreak','longBreak','longEvery','cycleLimit','focusSeconds','countdownSeconds','subject'];
   if(hasProgress(state.timer)&&timedKeys.some(k=>next[k]!==state.settings[k]))fail('BUSY','Finish or reset the session before changing its timing or subject.');
   const timingChanged=timedKeys.some(k=>next[k]!==state.settings[k]);state.settings=next;if(PREFERENCE_KEYS.some(k=>JSON.stringify(next[k])!==JSON.stringify(previous.settings[k])))state.preferencesUpdatedAt=now;
   if(state.timer&&!hasProgress(state.timer)&&timingChanged){const previous=state.timer;state.timer=makeTimer(previous.mode,next,id,now,owner);if(previous.status==='ready'){state.timer.phase=previous.phase;state.timer.completedStudies=previous.completedStudies;state.timer.durationSeconds=durationFor(previous.mode,previous.phase,next);}}
   if(label&&!existing)state.subjects.push(label);
   event=focusSettings?'focus-settings':'settings';break;
 }
 case 'subject':{
   const label=String(action.label||'').trim();if(!label||label.length>40)fail('INVALID','Enter a subject label from 1 to 40 characters.');
   if(state.subjects.some(s=>s.toLowerCase()===label.toLowerCase()))fail('INVALID','That subject already exists.');
   state.subjects.push(label);if(!hasProgress(state.timer))state.settings.subject=label;event='subject';break;
 }
 case 'goal':recordGoal(state,'daily-goal',integer(action.minutes,0,1440,'Daily goal'),now,id);state.dailyGoal=action.minutes;event='goal';break;
 case 'delete':state.sessions=state.sessions.filter(s=>s.id!==action.recordId);state.workspace.deletedSessions[action.recordId]=now;event='deleted';break;
 case 'import':{
   if(action.expected&&(action.expected.epoch!==state.epoch||action.expected.revision!==state.revision))fail('STALE_PREVIEW','Saved data changed after the import preview. Preview the backup again.');
   if(hasProgress(state.timer))fail('BUSY','Finish or reset the current timer before importing.');
   const data=validateBackup(action.backup);if(action.applyPreferences&&data.preferences){state.settings=validateSettings({...state.settings,...data.preferences.values});state.preferencesUpdatedAt=data.preferences.updatedAt;}state.workspace=mergeWorkspace(state.workspace,action.backup.workspace);const seen=new Set(state.sessions.map(s=>s.id));
   state.sessions.push(...data.sessions.filter(s=>!seen.has(s.id)));
   state.sessions=state.sessions.filter(s=>!Object.hasOwn(state.workspace.deletedSessions,s.id));
   state.sessions.sort((a,b)=>b.endedAt-a.endedAt);
   for(const s of data.subjects)if(!state.subjects.some(v=>v.toLowerCase()===s.toLowerCase()))state.subjects.push(s);
   if(!state.dailyGoal&&data.dailyGoal)state.dailyGoal=data.dailyGoal;
    if(state.workspace.learning.startedAt&&state.workspace.learning.events.filter(e=>e.kind==='daily-goal').at(-1)?.minutes!==state.dailyGoal)recordGoal(state,'daily-goal',state.dailyGoal,now,id);
   event='imported';break;
 }
 default:fail('INVALID','Unknown action.');
 }
 state.revision++;return{state,event};
}
export function parseDuration(h,m,s){const fields=[h,m,s];if(fields.some(v=>String(v).trim()===''||!/^\d+$/.test(String(v))))fail('INVALID','Use whole numbers for hours, minutes, and seconds.');const [hours,minutes,seconds]=fields.map(Number);integer(hours,0,23,'Hours');integer(minutes,0,59,'Minutes');integer(seconds,0,59,'Seconds');const total=hours*3600+minutes*60+seconds;if(total===0)fail('INVALID','Enter a duration greater than zero.');return total;}
export function formatTime(seconds){const n=Math.max(0,Math.floor(seconds));return[Math.floor(n/3600),Math.floor(n/60)%60,n%60].map(v=>String(v).padStart(2,'0'));}
export function human(seconds){const n=Math.max(0,Math.floor(seconds));return n>=3600?`${Math.floor(n/3600)}h ${Math.floor(n%3600/60)}m`:n>=60?`${Math.floor(n/60)} min`:`${n} sec`;}
export function validateBackup(b,{internal=false}={}){
 if(!b||b.app!=='StudyTimely'||b.schema!==SCHEMA||!Array.isArray(b.sessions)||!Array.isArray(b.subjects)||(!internal&&(b.sessions.length>20000||b.subjects.length>500)))fail('INVALID','This is not a supported StudyTimely backup.');
 const seen=new Set();const sessions=b.sessions.map(s=>{
   if(!s||typeof s.id!=='string'||s.id.length>150||seen.has(s.id)||!isStudy(s.mode)||typeof s.subject!=='string'||s.subject.length>40||!['Completed','Ended early'].includes(s.status)||!Array.isArray(s.segments)||s.segments.length>10000)fail('INVALID','The backup contains an invalid or duplicate record.');
   integer(s.durationSeconds,1,86400,'Session duration');
   if(!Number.isFinite(s.startedAt)||!Number.isFinite(s.endedAt)||s.startedAt<0||s.endedAt<s.startedAt)fail('INVALID','The backup contains an invalid date.');
   let end=0;const segments=s.segments.map(xs=>{if(!Array.isArray(xs)||xs.length!==2||xs.some(n=>!Number.isFinite(n)||n<0)||xs[1]<xs[0]||xs[0]<end)fail('INVALID','The backup contains invalid time intervals.');end=xs[1];return[xs[0],xs[1]];});
   if(!segments.length||sumIntervals(segments)!==s.durationSeconds*1000||segments[0][0]!==s.startedAt||segments.at(-1)[1]!==s.endedAt)fail('INVALID','The backup duration does not match its time intervals.');
   const target={};for(const key of ['taskId','taskTitle','planId','chapterId','chapterTitle','planningBlockId'])if(s[key]!==undefined){if(typeof s[key]!=='string'||s[key].length>150)fail('INVALID','Invalid study target.');target[key]=s[key];}
   seen.add(s.id);return{id:s.id,mode:s.mode,subject:s.subject,startedAt:s.startedAt,endedAt:s.endedAt,durationSeconds:s.durationSeconds,status:s.status,segments,...target};
 });
 const subjects=b.subjects.map(s=>{if(typeof s!=='string'||!s.trim()||s.length>40)fail('INVALID','The backup contains an invalid subject.');return s.trim();});
 const dailyGoal=b.dailyGoal===undefined?0:integer(b.dailyGoal,0,1440,'Daily goal');
 let preferences;if(b.preferences!==undefined){const p=b.preferences;if(!p||!Number.isFinite(p.updatedAt)||p.updatedAt<0||p.updatedAt>Date.now()+86400000||!p.values||typeof p.values!=='object'||Array.isArray(p.values))fail('INVALID','Invalid synced preferences.');preferences={updatedAt:p.updatedAt,values:pickPreferences(validateSettings({...DEFAULT_SETTINGS,...Object.fromEntries(PREFERENCE_KEYS.filter(k=>Object.hasOwn(p.values,k)).map(k=>[k,p.values[k]]))}))};}
 return{sessions,subjects,dailyGoal,workspace:validateWorkspace(b.workspace),...(preferences?{preferences}:{})};
}
export function dayKey(at){const d=new Date(at);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function dailyTotals(sessions){const days={};for(const s of sessions)for(const [start,end] of s.segments){let at=start;while(at<end){const date=new Date(at);date.setHours(24,0,0,0);const boundary=Math.min(end,date.getTime());days[dayKey(at)]=(days[dayKey(at)]||0)+(boundary-at)/1000;at=boundary;}}return days;}
export function statistics(sessions,now=Date.now()){
 const days=dailyTotals(sessions),today=dayKey(now),date=new Date(now),weekStart=new Date(now);weekStart.setHours(0,0,0,0);weekStart.setDate(weekStart.getDate()-(weekStart.getDay()+6)%7);
 const monthPrefix=today.slice(0,7),total=sessions.reduce((n,s)=>n+s.durationSeconds,0),subjects=Object.create(null);for(const s of sessions)subjects[s.subject||'No subject']=(subjects[s.subject||'No subject']||0)+s.durationSeconds;
 const keys=Object.keys(days).sort();let best=0,streak=0,prev=null;for(const k of keys){const d=new Date(k+'T12:00:00');if(prev){const next=new Date(prev);next.setDate(next.getDate()+1);streak=dayKey(next)===k?streak+1:1;}else streak=1;best=Math.max(best,streak);prev=d;}
 let current=0,cursor=new Date(now);if(!days[today])cursor.setDate(cursor.getDate()-1);while(days[dayKey(cursor)]){current++;cursor.setDate(cursor.getDate()-1);}
 return{days,today:days[today]||0,total,count:sessions.length,average:sessions.length?total/sessions.length:0,week:keys.filter(k=>k>=dayKey(weekStart)&&k<=today).reduce((n,k)=>n+days[k],0),month:keys.filter(k=>k.startsWith(monthPrefix)&&k<=today).reduce((n,k)=>n+days[k],0),subjects,currentStreak:current,bestStreak:best,date};
}
