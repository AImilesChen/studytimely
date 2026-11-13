import {emptyWorkspace,validateWorkspace,workspaceAction,mergeWorkspace} from './workspace.mjs';
export const SCHEMA=1;
export const MAX_GAP=30*60*1000;
export const MAX_RUN=24*60*60*1000;
export const MODES=['study','pomodoro','focus','countdown','stopwatch','clock'];
export const DEFAULT_SETTINGS={theme:'dark',spaceTheme:'default',ambient:{},lastTool:'study',reducedMotion:false,rememberPreferences:true,sound:false,volume:40,clock24:true,showSeconds:true,showDate:true,studyMinutes:25,shortBreak:5,longBreak:15,longEvery:4,cycleLimit:0,autoBreak:false,autoStudy:false,focusSeconds:1500,countdownSeconds:1500,subject:'',analytics:false};
export function emptyState(epoch='initial'){return{schema:SCHEMA,epoch,revision:0,settings:structuredClone(DEFAULT_SETTINGS),subjects:[],dailyGoal:0,sessions:[],timer:null,workspace:emptyWorkspace()};}
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
 state.sessions.unshift({id:t.id,mode:t.mode,subject:t.subject,startedAt:segments[0][0],endedAt:segments.at(-1)[1],durationSeconds:seconds,status,segments,...Object.fromEntries(['taskId','taskTitle','planId','chapterId','chapterTitle'].filter(k=>t[k]).map(k=>[k,t[k]]))});
 return true;
}
function review(t,now,reason){
 const candidate=intervalsAt(t,now);const last=Math.min(now,t.lastObserved);
 pauseTimer(t,last);t.status='review';t.reviewReason=reason;t.reviewSegments=candidate;t.reviewMaxSeconds=Math.floor(sumIntervals(candidate)/1000);t.lastObserved=now;
}
function settle(state,now){
 const t=state.timer;if(!t||t.status!=='running')return null;
 if(now<t.lastObserved-1000){review(t,now,'clock');return'review';}
 if(now-t.lastObserved>MAX_GAP||elapsedMs(t,now)>=MAX_RUN){review(t,now,'gap');return'review';}
 if(!t.durationSeconds||elapsedMs(t,now)<t.durationSeconds*1000){t.lastObserved=now;return null;}
 const saved=record(state,t,now,'Completed');
 if(t.mode!=='pomodoro') {pauseTimer(t,now);t.status='completed';return saved?'saved':'completed';}
 const completed=t.completedStudies+(t.phase==='Study'?1:0);
 if(t.phase==='Study'&&state.settings.cycleLimit&&completed>=state.settings.cycleLimit){pauseTimer(t,now);t.completedStudies=completed;t.status='completed';return'saved';}
 const phase=t.phase==='Study'?(completed%state.settings.longEvery===0?'Long break':'Short break'):'Study';
 const auto=phase==='Study'?state.settings.autoStudy:state.settings.autoBreak;
 state.timer={...makeTimer('pomodoro',state.settings,t.rootId,now,t.owner),...Object.fromEntries(['taskId','taskTitle','planId','chapterId','chapterTitle'].filter(k=>t[k]).map(k=>[k,t[k]])),id:t.rootId+':'+(t.sequence+1),sequence:t.sequence+1,phase,completedStudies:completed,durationSeconds:durationFor('pomodoro',phase,state.settings),subject:t.subject,status:auto?'running':'ready',since:auto?now:null,startedAt:auto?now:null};
 // A delayed browser callback never fabricates a chain of unattended sessions.
 return phase==='Study'?'next-study':'break';
}
function ownerGuard(state,owner){if(hasProgress(state.timer)&&state.timer.owner!==owner)fail('OTHER_TAB','This session is controlled in another tab. Move it here before changing it.');}
function integer(n,min,max,label){if(!Number.isInteger(n)||n<min||n>max)fail('INVALID',`${label} must be a whole number from ${min} to ${max}.`);return n;}
export function validateSettings(input){
 const s={...DEFAULT_SETTINGS,...input};
 if(!MODES.includes(s.lastTool))fail('INVALID','Choose a supported last tool.');
 if(!['dark','light'].includes(s.theme))fail('INVALID','Choose a supported theme.');
 if(!['default','midnight','sand','rain','forest','coffee','desk'].includes(s.spaceTheme))fail('INVALID','Choose a supported study space.');
 if(!s.ambient||typeof s.ambient!=='object'||Array.isArray(s.ambient))fail('INVALID','Invalid ambient sound settings.');
 s.ambient=Object.fromEntries(Object.entries(s.ambient).map(([k,v])=>{if(!['rain','cafe','forest','white','waves','nature'].includes(k))fail('INVALID','Unsupported ambient sound.');return[k,integer(v,0,100,'Sound volume')];}));
 for(const k of ['reducedMotion','rememberPreferences','sound','clock24','showSeconds','showDate','autoBreak','autoStudy','analytics'])if(typeof s[k]!=='boolean')fail('INVALID','Invalid preference.');
 integer(s.volume,0,100,'Volume');integer(s.studyMinutes,1,240,'Study duration');integer(s.shortBreak,1,60,'Short break');integer(s.longBreak,1,120,'Long break');integer(s.longEvery,2,12,'Long-break interval');integer(s.cycleLimit,0,100,'Cycle limit');integer(s.focusSeconds,1,14400,'Focus duration');integer(s.countdownSeconds,1,86399,'Countdown duration');
 if(typeof s.subject!=='string'||s.subject.length>40)fail('INVALID','Use a subject label of up to 40 characters.');
 return Object.fromEntries(Object.keys(DEFAULT_SETTINGS).map(k=>[k,s[k]]));
}
export function transition(previous,action,{now,owner,id}){
 if(action.epoch!==previous.epoch)fail('STALE','Site data changed in another tab. Review the current state and try again.');
 let state=structuredClone(previous),event=null;state.workspace=validateWorkspace(state.workspace);
 if(action.type==='clear')return{state:{...emptyState(id),revision:previous.revision+1},event:'cleared'};
 if(['start','pause','finish','reset','lap','phase','tick','review','clock-change'].includes(action.type))ownerGuard(state,owner);
 if(action.timerId&&state.timer?.id!==action.timerId)fail('STALE','The timer changed. Review its current phase.');
 if(workspaceAction(state,action,{now,owner,id})){state.revision++;return{state,event:action.type==='workspace-start'?'task-started':'workspace-saved'};}
 switch(action.type){
 case 'start':{
   if(!MODES.includes(action.mode)||action.mode==='clock')fail('INVALID','Choose a timing tool.');
   if(hasProgress(state.timer)&&state.timer.mode!==action.mode)fail('BUSY','Finish or reset the active timer before switching tools.');
   if(!state.timer||state.timer.mode!==action.mode||state.timer.status==='completed')state.timer=makeTimer(action.mode,state.settings,id,now,owner);
   const t=state.timer;if(t.status==='review')fail('REVIEW','Review the recorded time before continuing.');
   if(t.status!=='running'){t.owner=owner;t.since=now;t.startedAt??=now;t.status='running';t.lastObserved=now;}break;
 }
 case 'pause':event=settle(state,now);if(state.timer?.status==='running')pauseTimer(state.timer,now);break;
 case 'tick':event=settle(state,now);break;
 case 'clock-change':if(state.timer?.status==='running'){review(state.timer,now,'clock');event='review';}break;
 case 'claim':{
   if(!state.timer)break;
   event=settle(state,now);if(state.timer.status==='running')pauseTimer(state.timer,now);state.timer.owner=owner;event=event||'moved';break;
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
   const total=Math.floor(elapsedMs(t,now));const last=t.laps.at(-1)?.totalMs||0;
   if(total>last)t.laps.push({number:t.laps.length+1,totalMs:total,splitMs:total-last});break;
 }
 case 'phase':{
   if(hasProgress(state.timer))fail('BUSY','Finish or reset before changing periods.');
   if(!['Study','Short break','Long break'].includes(action.phase))fail('INVALID','Choose a supported period.');
   const t=makeTimer('pomodoro',state.settings,id,now,owner);t.phase=action.phase;t.durationSeconds=durationFor('pomodoro',t.phase,state.settings);state.timer=t;break;
 }
 case 'settings':{
   const next=validateSettings({...state.settings,...action.patch});
   const timedKeys=['studyMinutes','shortBreak','longBreak','longEvery','cycleLimit','focusSeconds','countdownSeconds','subject'];
   if(hasProgress(state.timer)&&timedKeys.some(k=>next[k]!==state.settings[k]))fail('BUSY','Finish or reset the session before changing its timing or subject.');
   const timingChanged=timedKeys.some(k=>next[k]!==state.settings[k]);state.settings=next;
   if(state.timer&&!hasProgress(state.timer)&&timingChanged){const previous=state.timer;state.timer=makeTimer(previous.mode,next,id,now,owner);if(previous.status==='ready'){state.timer.phase=previous.phase;state.timer.completedStudies=previous.completedStudies;state.timer.durationSeconds=durationFor(previous.mode,previous.phase,next);}}
   event='settings';break;
 }
 case 'subject':{
   const label=String(action.label||'').trim();if(!label||label.length>40)fail('INVALID','Enter a subject label from 1 to 40 characters.');
   if(state.subjects.some(s=>s.toLowerCase()===label.toLowerCase()))fail('INVALID','That subject already exists.');
   state.subjects.push(label);if(!hasProgress(state.timer))state.settings.subject=label;event='subject';break;
 }
 case 'goal':state.dailyGoal=integer(action.minutes,0,1440,'Daily goal');event='goal';break;
 case 'delete':state.sessions=state.sessions.filter(s=>s.id!==action.recordId);state.workspace.deletedSessions[action.recordId]=now;event='deleted';break;
 case 'import':{
   if(hasProgress(state.timer))fail('BUSY','Finish or reset the current timer before importing.');
   const data=validateBackup(action.backup);state.workspace=mergeWorkspace(state.workspace,data.workspace);const seen=new Set(state.sessions.map(s=>s.id));
   state.sessions.push(...data.sessions.filter(s=>!seen.has(s.id)));
   state.sessions=state.sessions.filter(s=>!Object.hasOwn(state.workspace.deletedSessions,s.id));
   state.sessions.sort((a,b)=>b.endedAt-a.endedAt);
   for(const s of data.subjects)if(!state.subjects.some(v=>v.toLowerCase()===s.toLowerCase()))state.subjects.push(s);
   if(!state.dailyGoal&&data.dailyGoal)state.dailyGoal=data.dailyGoal;
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
   const target={};for(const key of ['taskId','taskTitle','planId','chapterId','chapterTitle'])if(s[key]!==undefined){if(typeof s[key]!=='string'||s[key].length>150)fail('INVALID','Invalid study target.');target[key]=s[key];}
   seen.add(s.id);return{id:s.id,mode:s.mode,subject:s.subject,startedAt:s.startedAt,endedAt:s.endedAt,durationSeconds:s.durationSeconds,status:s.status,segments,...target};
 });
 const subjects=b.subjects.map(s=>{if(typeof s!=='string'||!s.trim()||s.length>40)fail('INVALID','The backup contains an invalid subject.');return s.trim();});
 const dailyGoal=b.dailyGoal===undefined?0:integer(b.dailyGoal,0,1440,'Daily goal');
 return{sessions,subjects,dailyGoal,workspace:validateWorkspace(b.workspace)};
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
