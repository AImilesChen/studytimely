import {calendarMonthRange} from './study-calendar.mjs';
import {shiftPlannerDay as shiftDay} from './planner.mjs';
import {trackerDuration} from './tracker.mjs';
export {trackerDuration as duration};
const formats=new Map(),boundariesCache=new Map(),dayNumber=d=>Date.parse(d+'T12:00:00Z');
const formatter=zone=>{if(!formats.has(zone))formats.set(zone,new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}));return formats.get(zone);};
export function zonedParts(at,zone){return Object.fromEntries(formatter(zone).formatToParts(at).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));}
export function zonedDay(at,zone){const p=zonedParts(at,zone);return `${p.year}-${p.month}-${p.day}`;}
export function dayBoundary(day,zone){
 const key=zone+':'+day;if(boundariesCache.has(key))return boundariesCache.get(key);
 const center=Date.parse(day+'T00:00:00Z');let lo=center-2*86400000,hi=center+2*86400000;
 while(hi-lo>1){const mid=Math.floor((lo+hi)/2);if(zonedDay(mid,zone)<day)lo=mid;else hi=mid;}if(boundariesCache.size>4096)boundariesCache.clear();boundariesCache.set(key,hi);return hi;
}
export function analysisRange({period='week',start='',end='',month='',zone='UTC',now=Date.now()}){
 formatter(zone);const today=zonedDay(now,zone),monday=d=>shiftDay(d,1-(new Date(d+'T12:00:00Z').getUTCDay()||7));
 if(period==='today')start=end=today;
 else if(period==='week'){start=monday(today);end=today;}
 else if(period==='last-week'){start=shiftDay(monday(today),-7);end=shiftDay(start,6);}
 else if(period==='month'){start=today.slice(0,7)+'-01';end=today;}
 else if(period==='last-month'){end=shiftDay(today.slice(0,7)+'-01',-1);start=end.slice(0,7)+'-01';}
 else if(period==='calendar'){const dates=calendarMonthRange(month,today);start=dates.start;end=dates.end;}
 else if(period==='year'){start=today.slice(0,4)+'-01-01';end=today;}
 else if(period==='7'||period==='30'){end=today;start=shiftDay(end,1-Number(period));}
 else if(period!=='custom')throw Error('Choose a report period.');
 const valid=d=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&new Date(dayNumber(d)).toISOString().slice(0,10)===d;
 if(!valid(start)||!valid(end)||start<'1970-01-01'||start>end||end>today)throw Error('Choose valid dates through today, with the start before the end.');
 const calendarDays=Math.round((dayNumber(end)-dayNumber(start))/86400000)+1;if(calendarDays>366)throw Error('Choose up to 366 days per analysis.');
 const startAt=dayBoundary(start,zone),fullEnd=dayBoundary(shiftDay(end,1),zone),endAt=Math.min(now,fullEnd);
 return {period,start,end,zone,today,calendarDays,startAt,endAt,partial:endAt<fullEnd};
}
export function comparisonRange(range,kind='previous'){
 if(kind==='none')return null;
 const {start,end,zone}=range;let previousStart,previousEnd;
 if(['week','last-week'].includes(range.period)){previousStart=shiftDay(start,-7);previousEnd=shiftDay(end,-7);}
 else if(['month','last-month','calendar'].includes(range.period)){
  const last=shiftDay(start.slice(0,7)+'-01',-1);previousStart=last.slice(0,7)+'-01';previousEnd=previousStart.slice(0,8)+String(Math.min(Number(end.slice(-2)),Number(last.slice(-2)))).padStart(2,'0');
 }else if(range.period==='year'){const year=Number(start.slice(0,4))-1;previousStart=year+'-01-01';previousEnd=year+end.slice(4);if(previousEnd.endsWith('02-29'))previousEnd=year+'-02-28';}else{previousStart=shiftDay(start,-range.calendarDays);previousEnd=shiftDay(end,-range.calendarDays);}
 let endAt=dayBoundary(shiftDay(previousEnd,1),zone);
 if(range.partial){const p=zonedParts(range.endAt,zone),wall=Date.parse(previousEnd+'T'+p.hour+':'+p.minute+':'+p.second+'Z');let candidate=wall;for(let i=0;i<4;i++){const q=zonedParts(candidate,zone),seen=Date.parse(`${q.year}-${q.month}-${q.day}T${q.hour}:${q.minute}:${q.second}Z`);candidate+=wall-seen;}endAt=Math.min(endAt,candidate+(range.endAt%1000));}
 return {period:'comparison',start:previousStart,end:previousEnd,zone,calendarDays:Math.round((dayNumber(previousEnd)-dayNumber(previousStart))/86400000)+1,startAt:dayBoundary(previousStart,zone),endAt,partial:range.partial};
}
export function delta(current,previous){return previous>0?{difference:current-previous,percent:(current-previous)/previous*100}:{difference:current-previous,percent:null};}
const learningSession=s=>['study','focus','pomodoro'].includes(s.mode);
const filterSession=(s,subject,mode)=>learningSession(s)&&(!subject||(subject==='none'?!s.subject:s.subject===subject))&&(!mode||s.mode===mode);
function intersect(s,start,end){return s.segments.map(([a,b])=>[Math.max(a,start),Math.min(b,end)]).filter(([a,b])=>b>a);}
const seconds=segments=>segments.reduce((n,[a,b])=>n+(b-a)/1000,0);
const daysIn=r=>Array.from({length:r.calendarDays},(_,i)=>shiftDay(r.start,i));
function taskStateAt(events,taskId,at){return events.filter(e=>e.taskId===taskId&&e.at<=at).at(-1)||null;}
export function taskAnalysis(data,range,subject=''){
 const events=data.workspace?.learning?.events||[],all=data.workspace?.tasks||[],sessions=data.sessions||[];
 const matches=t=>!subject||(subject==='none'?!t.subject:t.subject===subject),last=new Map(),atStart=new Map(),atEnd=new Map(),first=new Map(),everCompleted=new Set(),completed=new Map();
 for(const e of events){if(!e.taskId)continue;const previous=last.get(e.taskId);if(!first.has(e.taskId))first.set(e.taskId,e);
  if(e.kind==='task'&&e.done&&!e.deleted&&!previous?.done){everCompleted.add(e.taskId);if(e.at>=range.startAt&&e.at<range.endAt&&matches(e))completed.set(e.taskId,e);}
  if(e.at<=range.startAt)atStart.set(e.taskId,e);if(e.at<range.endAt)atEnd.set(e.taskId,e);last.set(e.taskId,e);
 }
 const lifetime=new Map(),period=new Map();for(const s of sessions.filter(learningSession))if(s.taskId){lifetime.set(s.taskId,(lifetime.get(s.taskId)||0)+seconds(intersect(s,0,range.endAt)));period.set(s.taskId,(period.get(s.taskId)||0)+seconds(intersect(s,range.startAt,range.endAt)));}
 const unknown=all.filter(t=>!t.deletedAt&&t.done&&!everCompleted.has(t.id)&&matches(t)).length;
 const rows=all.filter(t=>!t.deletedAt||t.deletedAt>=range.startAt).map(t=>{
  const observed=atEnd.get(t.id),initial=atStart.get(t.id)||first.get(t.id),original=initial?.at<range.endAt?initial:null,evidence=observed||t,completion=completed.get(t.id),inPeriod=period.get(t.id)||0;
  return {id:t.id,title:evidence.title,subject:evidence.subject,done:evidence.done,deleted:!!t.deletedAt,completedInPeriod:!!completion,completionAt:completion?.at||null,unknownCompletion:evidence.done&&!everCompleted.has(t.id),estimateMinutes:original?.estimateMinutes??null,actualSeconds:lifetime.get(t.id)||0,periodSeconds:inPeriod,plannedDate:original?.plannedDate||'',dueDate:original?.dueDate||'',historyKnown:!!original};
 }).filter(matches).filter(t=>t.periodSeconds>0||t.completedInPeriod||t.plannedDate>=range.start&&t.plannedDate<=range.end||t.dueDate>=range.start&&t.dueDate<=range.end);
 const planned=rows.filter(t=>t.plannedDate>=range.start&&t.plannedDate<=range.end),overdue=rows.filter(t=>!t.done&&t.dueDate&&t.dueDate<range.end);
 return {rows,completed:completed.size,unknown,planned:planned.length,completedPlanned:planned.filter(t=>t.completedInPeriod).length,overdue:overdue.length,coverageSince:data.workspace?.learning?.startedAt||0};
}
export function goalAnalysis(data,range,series){
 const events=data.workspace?.learning?.events||[],goals=events.filter(e=>e.kind==='daily-goal'),weekly=events.filter(e=>e.kind==='weekly-goal');
 const days=series.map(d=>{const at=dayBoundary(shiftDay(d.date,1),range.zone)-1,e=goals.filter(e=>e.at<=Math.min(at,range.endAt)).at(-1);return {...d,target:e?.minutes??null,reached:e?.minutes>0?d.seconds>=e.minutes*60:null};});
 const w=weekly.filter(e=>e.at<=range.endAt).at(-1),weeks=new Map();
 for(const day of series){const monday=shiftDay(day.date,1-(new Date(day.date+'T12:00:00Z').getUTCDay()||7));const row=weeks.get(monday)||{start:monday,end:shiftDay(monday,6),seconds:0};row.seconds+=day.seconds;weeks.set(monday,row);}
 const weeklyRows=[...weeks.values()].map(row=>{const end=Math.min(range.endAt,dayBoundary(shiftDay(row.end,1),range.zone)),e=weekly.filter(e=>e.at<end).at(-1);return {...row,target:e?.minutes??null,partial:row.start<range.start||row.end>range.end||range.partial&&row.end===range.end};});
 return {days,scope:'all subjects and learning modes',eligible:days.filter(d=>d.target>0).length,reached:days.filter(d=>d.reached).length,unknown:days.filter(d=>d.target===null).length,weeklyMinutes:w?.minutes??null,weeks:weeklyRows};
}
function goalSeries(data,range){const totals=new Map(),boundaries=new Map();for(const s of new Map((data.sessions||[]).map(s=>[s.id,s])).values())if(learningSession(s)&&!Object.hasOwn(data.workspace?.deletedSessions||{},s.id))for(const [a,b]of intersect(s,range.startAt,range.endAt)){let at=a;while(at<b){const day=zonedDay(at,range.zone);if(!boundaries.has(day))boundaries.set(day,dayBoundary(shiftDay(day,1),range.zone));const stop=Math.min(b,boundaries.get(day));totals.set(day,(totals.get(day)||0)+(stop-at)/1000);at=stop;}}return daysIn(range).map(date=>({date,seconds:totals.get(date)||0}));}
export function recordRows(report,selection){
 if(!selection)return report.rows;
 return report.rows.map(row=>{
  let segments;
  if(selection.start){const start=dayBoundary(selection.start,report.range.zone),end=dayBoundary(shiftDay(selection.end,1),report.range.zone);segments=row.segments.map(([a,b])=>[Math.max(a,start),Math.min(b,end)]).filter(([a,b])=>b>a);}
  else{segments=[];for(const [a,b]of row.segments){let at=a;while(at<b){const p=zonedParts(at,report.range.zone),day=`${p.year}-${p.month}-${p.day}`,stop=Math.min(b,at+((60-Number(p.minute))*60-Number(p.second))*1000-at%1000,(Math.floor(at/900000)+1)*900000);if((new Date(day+'T12:00:00Z').getUTCDay()+6)%7===selection.weekday&&Number(p.hour)===selection.hour)segments.push([at,stop]);at=stop;}}}
  return {...row,segments,seconds:seconds(segments)};
 }).filter(row=>row.seconds>0);
}
export function studyAnalysis(data,range,{subject='',mode=''}={}){
 const filtered=[...new Map((data.sessions||[]).filter(s=>!Object.hasOwn(data.workspace?.deletedSessions||{},s.id)&&filterSession(s,subject,mode)).map(s=>[s.id,s])).values()];
 const rows=[],dayTotals=new Map(),subjects=new Map(),hours=Array.from({length:7},()=>Array(24).fill(0)),lengths=Array(5).fill(0);
 for(const s of filtered){const segments=intersect(s,range.startAt,range.endAt),counted=seconds(segments);if(!counted)continue;
  rows.push({session:s,segments,seconds:counted});subjects.set(s.subject,(subjects.get(s.subject)||0)+counted);
  for(const [a,b]of segments){const mins=(b-a)/60000;lengths[mins<15?0:mins<30?1:mins<60?2:mins<90?3:4]++;
   let at=a;while(at<b){const p=zonedParts(at,range.zone),nextHour=at+((60-Number(p.minute))*60-Number(p.second))*1000-(at%1000),stop=Math.min(b,nextHour,(Math.floor(at/900000)+1)*900000),n=(stop-at)/1000,day=`${p.year}-${p.month}-${p.day}`,weekday=(new Date(day+'T12:00:00Z').getUTCDay()+6)%7;
    dayTotals.set(day,(dayTotals.get(day)||0)+n);hours[weekday][Number(p.hour)]+=n;at=stop;
   }
  }
 }
 rows.sort((a,b)=>b.session.endedAt-a.session.endedAt||a.session.id.localeCompare(b.session.id));
 const series=daysIn(range).map(date=>({date,seconds:dayTotals.get(date)||0})),total=rows.reduce((n,r)=>n+r.seconds,0),activeDays=series.filter(d=>d.seconds>0).length;
 const pairs=[...subjects].map(([name,value])=>({name,seconds:value,share:total?value/total:0})).sort((a,b)=>b.seconds-a.seconds||a.name.localeCompare(b.name));
 const tasks=taskAnalysis({...data,sessions:filtered},range,subject),goals=goalAnalysis(data,range,subject||mode?goalSeries(data,range):series),insights=[];
 if(pairs.length)insights.push({kind:'subject',text:`${pairs[0].name||'Unlabelled study'} accounts for ${Math.round(pairs[0].share*100)}% of recorded time.`,subject:pairs[0].name});
 if(activeDays>=7){const totals=Array.from({length:24},(_,h)=>hours.reduce((n,d)=>n+d[h],0)),hour=totals.indexOf(Math.max(...totals));insights.push({kind:'pattern',text:`Your most recorded hour was ${String(hour).padStart(2,'0')}:00–${String(hour+1).padStart(2,'0')}:00, across ${activeDays} study days. This describes timing, not learning quality.`});}
 if(tasks.overdue)insights.push({kind:'task',text:`${tasks.overdue} unfinished task${tasks.overdue===1?' has':'s have'} a deadline before the end of this period. Review the next step before rescheduling.`});
 return {version:1,range,subject,mode,total,count:rows.length,activeDays,average:activeDays?total/activeDays:null,rows,series,subjects:pairs,hours,lengths,tasks,goals,insights};
}
export function reportSnapshot(report){
 return {version:1,total:report.total,count:report.count,activeDays:report.activeDays,average:report.average,subjects:report.subjects,series:report.series,tasks:report.tasks.rows.slice(0,100),taskCount:report.tasks.rows.length,completed:report.tasks.completed,unknownCompletion:report.tasks.unknown,goals:report.goals,insights:report.insights};
}
export function analysisFingerprint(data){
 // A change detector, not a security hash. Covers record deletion/editing and planning evidence.
 const s=JSON.stringify({sessions:data.sessions,tasks:data.workspace?.tasks,events:data.workspace?.learning?.events});let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16);
}
export function newReview(report,data,period,now){const previous=studyAnalysis(data,comparisonRange({...report.range,period:period==='month'?'month':'week'}),{subject:report.subject,mode:report.mode});return {period,start:report.range.start,end:report.range.end,zone:report.range.zone,subject:report.subject,mode:report.mode,generatedAt:now,fingerprint:analysisFingerprint(data),snapshot:{...reportSnapshot(report),comparison:{start:previous.range.start,end:previous.range.end,total:previous.total,activeDays:previous.activeDays,subjects:previous.subjects,delta:delta(report.total,previous.total)}},good:'',difficulty:'',next:''};}
export function exampleAnalysisData(now,zone='UTC'){
 const sessions=[],tasks=[],events=[],today=zonedDay(now,zone),start=shiftDay(today,-35);let n=0;
 for(let i=0;i<35;i++){const date=shiftDay(start,i),weekday=new Date(date+'T12:00:00Z').getUTCDay();if(weekday===0)continue;
  for(let j=0;j<2;j++){const mins=j?25:40+(i%3)*5,at=dayBoundary(date,zone)+(9+j*10)*3600000,taskId='demo-task-'+i;if(at+mins*60000>now)continue;sessions.push({id:'analysis-example-'+(++n),mode:j?'pomodoro':'focus',subject:j?'Biology':'Maths',startedAt:at,endedAt:at+mins*60000,durationSeconds:mins*60,status:'Completed',segments:[[at,at+mins*60000]],...(j?{}:{taskId,taskTitle:'Practise algebra '+(i+1)})});
   if(!j){const t={id:taskId,title:'Practise algebra '+(i+1),subject:'Maths',estimateMinutes:30,plannedDate:date,dueDate:date,done:true,updatedAt:at+mins*60000,deletedAt:0};tasks.push(t);const fields={taskId,title:t.title,subject:t.subject,plannedDate:date,dueDate:date,estimateMinutes:30,deleted:false};events.push({id:taskId+':start',kind:'task',at:at-3600000,...fields,done:false},{id:taskId+':done',kind:'task',at:t.updatedAt,...fields,done:true});}
  }
 }
 events.push({id:'demo-goal',at:dayBoundary(start,zone),kind:'daily-goal',minutes:60},{id:'demo-week',at:dayBoundary(start,zone),kind:'weekly-goal',minutes:300});
 return {sessions,subjects:['Maths','Biology'],dailyGoal:60,workspace:{tasks,weeklyGoal:300,learning:{version:1,startedAt:dayBoundary(start,zone),events:events.sort((a,b)=>a.at-b.at),reviews:[],zone,zoneUpdatedAt:now},deletedSessions:{}}};
}
