export function calculateStudy({minutes,days,weeks,session,rest}){
 for(const [k,v,max]of [['minutes',minutes,1440],['days',days,7],['weeks',weeks,520],['session',session,240],['rest',rest,120]])if(!Number.isInteger(v)||v<(k==='rest'?0:1)||v>max)throw Error(`Choose a valid whole number for ${k}.`);
 const sessionsPerDay=Math.ceil(minutes/session),breakMinutesPerDay=Math.max(0,sessionsPerDay-1)*rest;
 if(minutes+breakMinutesPerDay>1440)throw Error('Study and breaks must fit within one day.');
 return{weeklyStudyMinutes:minutes*days,totalStudyMinutes:minutes*days*weeks,sessionsPerDay,breakMinutesPerDay,totalScheduledMinutes:(minutes+breakMinutesPerDay)*days*weeks};
}

const DAY=86400000;
const integer=(value,min,max,label)=>{if(!Number.isInteger(value)||value<min||value>max)throw Error(`${label} must be a whole number from ${min} to ${max}.`);return value;};
const stamp=value=>{if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw Error('Choose a valid date.');const [y,m,d]=value.split('-').map(Number),at=Date.UTC(y,m-1,d);if(y<1900||new Date(at).toISOString().slice(0,10)!==value)throw Error('Choose a valid date.');return at;};
const dateKey=at=>new Date(at).toISOString().slice(0,10);
export const localCalculatorDate=now=>{const d=new Date(now);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export function sessionSummary(minutes,session,rest){
 integer(minutes,0,5256000,'Study minutes');integer(session,1,240,'Session length');integer(rest,0,120,'Break length');
 const sessions=Math.ceil(minutes/session),breakMinutes=Math.max(0,sessions-1)*rest;
 return {sessions,fullSessions:Math.floor(minutes/session),lastSessionMinutes:minutes?minutes%session||session:0,breakMinutes,elapsedMinutes:minutes+breakMinutes};
}
export function studyCapacity(available,session,rest){
 integer(available,0,1440,'Available minutes');sessionSummary(0,session,rest);let lo=0,hi=available;
 while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(sessionSummary(mid,session,rest).elapsedMinutes<=available)lo=mid;else hi=mid-1;}return lo;
}
export function calculateStudyPlan(input,{today}={}){
 const start=stamp(today),{mode,basis='study',minutes=60,weeks=4,session=25,rest=5,deadline='',includeToday=true,totalMinutes=1200,available=null}=input;
 if(!['budget','deadline'].includes(mode))throw Error('Choose a calculation mode.');
 if(!['study','elapsed'].includes(basis))throw Error('Choose whether your budget includes breaks.');
 sessionSummary(0,session,rest);
 if(!Array.isArray(input.weekdays)||!input.weekdays.length||new Set(input.weekdays).size!==input.weekdays.length||input.weekdays.some(n=>!Number.isInteger(n)||n<1||n>7))throw Error('Select at least one study day.');
 const weekdays=[...input.weekdays].sort((a,b)=>a-b);if(typeof includeToday!=='boolean')throw Error('Choose whether to include today.');
 if(available!==null)integer(available,1,1440,'Daily available minutes');
 let end,first=start,daily;
 if(mode==='budget'){
  integer(weeks,1,520,'Number of weeks');integer(minutes,1,1440,'Daily time budget');end=start+weeks*7*DAY;
  daily=basis==='study'?minutes:studyCapacity(minutes,session,rest);
  if(sessionSummary(daily,session,rest).elapsedMinutes>1440)throw Error('Study and breaks exceed 24 hours per day. Reduce your daily target or break length.');
 }else{
  integer(totalMinutes,1,5256000,'Total study minutes');end=stamp(deadline);
  if(end<=start)throw Error('Choose a deadline after today. The deadline day is excluded.');
  if(end-start>3650*DAY)throw Error('Choose a deadline within the next ten years.');
  if(!includeToday)first+=DAY;
 }
 const dates=[];for(let at=first;at<end;at+=DAY)if(weekdays.includes((new Date(at).getUTCDay()+6)%7+1))dates.push(dateKey(at));
 if(!dates.length)throw Error('None of your selected weekdays occur before the deadline. Choose another day or a later deadline.');
 const totalStudyMinutes=mode==='budget'?daily*dates.length:totalMinutes,q=Math.floor(totalStudyMinutes/dates.length),extra=totalStudyMinutes%dates.length;
 const days=dates.map((date,i)=>{const studyMinutes=q+(i<extra?1:0);return {date,studyMinutes,...sessionSummary(studyMinutes,session,rest)};});
 const maxStudyMinutes=Math.max(...days.map(d=>d.studyMinutes)),minStudyMinutes=Math.min(...days.map(d=>d.studyMinutes)),maxElapsedMinutes=Math.max(...days.map(d=>d.elapsedMinutes));
 const totalBreakMinutes=days.reduce((sum,d)=>sum+d.breakMinutes,0),effectiveAvailable=mode==='budget'&&basis==='elapsed'?minutes:available;
 const capacity=effectiveAvailable===null?null:studyCapacity(effectiveAvailable,session,rest),totalCapacity=capacity===null?null:capacity*days.length;
 const feasible=maxElapsedMinutes>1440?false:totalCapacity===null?null:totalStudyMinutes<=totalCapacity;
 const shortfall=totalCapacity===null?null:Math.max(0,totalStudyMinutes-totalCapacity);
 return {mode,basis,session,rest,weekdays,today,deadline:mode==='deadline'?deadline:'',includeToday:mode==='budget'||includeToday,weeks:mode==='budget'?weeks:null,days,calendarDays:(end-first)/DAY,studyDayCount:days.length,totalStudyMinutes,totalBreakMinutes,totalElapsedMinutes:totalStudyMinutes+totalBreakMinutes,maxStudyMinutes,minStudyMinutes,maxElapsedMinutes,weeklyStudyMinutes:maxStudyMinutes*weekdays.length,dailyAvailable:effectiveAvailable,dailyCapacity:capacity,totalCapacity,feasible,shortfall,extraStudyDays:shortfall&&capacity?Math.ceil(shortfall/capacity):null};
}
export function calculatorTaskDraft(result){const first=result.days.find(d=>d.studyMinutes>0);if(!first||result.feasible===false)throw Error('Adjust your plan before making a study task.');return {title:'Study block from calculator',plannedDate:first.date,dueDate:result.deadline||'',estimateMinutes:first.studyMinutes,priority:'normal',subject:'',done:false};}
export function calculatorFocusMinutes(result){const first=result.days.find(d=>d.studyMinutes>0);if(!first||result.feasible===false)throw Error('Adjust your plan before opening a focus timer.');return Math.min(result.session,first.studyMinutes);}
export const calculatorDuration=value=>{const m=Math.round(value);return `${Math.floor(m/60)?Math.floor(m/60)+'h ':''}${m%60||!m?m%60+'m':''}`.trim();};
export function calculatorPlanText(r){return ['StudyTimely study estimate',r.mode==='deadline'?`Deadline: ${r.deadline} (deadline day excluded)`:`Budget: ${r.weeks} weeks`,`${r.studyDayCount} study days; ${r.weekdays.map(n=>['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][n-1]).join(', ')}`,`Daily study: ${r.minStudyMinutes===r.maxStudyMinutes?calculatorDuration(r.maxStudyMinutes):calculatorDuration(r.minStudyMinutes)+'–'+calculatorDuration(r.maxStudyMinutes)}`,`Daily time including breaks: up to ${calculatorDuration(r.maxElapsedMinutes)}`,r.dailyAvailable!==null?`Daily available time including breaks: ${calculatorDuration(r.dailyAvailable)}`:'',`Total study: ${calculatorDuration(r.totalStudyMinutes)}`,`Total breaks: ${calculatorDuration(r.totalBreakMinutes)}`,`Total time including breaks: ${calculatorDuration(r.totalElapsedMinutes)}`,`Selected dates: ${r.days[0].date} to ${r.days.at(-1).date}`,`Capacity check: ${r.feasible===false?'needs more time':r.feasible===true?'fits the entered budget':'daily availability not entered'}`, `Sessions: up to ${r.session} minutes; breaks: ${r.rest} minutes; no break after the last session.`,r.shortfall?`Study-time shortfall: ${calculatorDuration(r.shortfall)}.`:'',`Calculation only. Planned time does not add to recorded study history.`].filter(Boolean).join('\n');}
