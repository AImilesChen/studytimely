import {dayKey,dailyTotals} from './model.mjs';
import {validDay} from './workspace.mjs';
import {shiftPlannerDay as shiftDay,plannerDate as formatDay} from './planner.mjs';
export {shiftDay,formatDay};
const DAY=86400000,dateNumber=d=>Date.parse(d+'T12:00:00Z');
export const localDayStart=d=>new Date(d+'T00:00:00').getTime();
export const subjectValue=s=>s?'subject:'+s:'none';
export const subjectName=s=>s||'No subject (unlabelled)';
export function subjectFromValue(value){return value==='none'?'':value.startsWith('subject:')?value.slice(8):null;}
export const matchesSubject=(session,value)=>!value||subjectFromValue(value)===session.subject;
export function trackerDuration(seconds){const n=Math.max(0,Math.floor(seconds));return n===0?'0 min':n<60?`${n} sec`:n<3600?`${Math.floor(n/60)}m${n%60?' '+n%60+'s':''}`:`${Math.floor(n/3600)}h ${Math.floor(n%3600/60)}m${n%60?' '+n%60+'s':''}`;}
export function trackerRange({period='week',start='',end='',today}){
 if(!validDay(today))throw Error('Wait for your device’s local calendar to load.');
 if(period==='today')start=end=today;
 else if(period==='week'){end=today;start=shiftDay(today,1-(new Date(today+'T12:00:00').getDay()||7));}
 else if(period==='7'||period==='30'){end=today;start=shiftDay(today,1-Number(period));}
 else if(period!=='custom')throw Error('Choose a supported reporting period.');
 if(!validDay(start)||!validDay(end)||start<'1970-01-01'||end>today||start>end)throw Error('Choose valid dates from 1 January 1970 through today, with the end on or after the start.');
 const calendarDays=Math.round((dateNumber(end)-dateNumber(start))/DAY)+1;
 if(calendarDays>366)throw Error('Choose a range of up to 366 calendar days. Use smaller ranges for older history, or export a full JSON backup.');
 return{period,start,end,calendarDays,startAt:localDayStart(start),endAt:localDayStart(shiftDay(end,1)),label:start===end?formatDay(start):`${formatDay(start)} – ${formatDay(end)}`};
}
export function trackerReport(sessions,range,subject=''){
 const rows=[];
 for(const session of sessions){if(!matchesSubject(session,subject))continue;const segments=session.segments.map(([a,b])=>[Math.max(a,range.startAt),Math.min(b,range.endAt)]).filter(([a,b])=>b>a),seconds=segments.reduce((n,[a,b])=>n+(b-a)/1000,0);if(seconds>0)rows.push({session,segments,seconds,partial:seconds!==session.durationSeconds});}
 rows.sort((a,b)=>b.segments.at(-1)[1]-a.segments.at(-1)[1]||b.session.startedAt-a.session.startedAt||a.session.id.localeCompare(b.session.id));
 const days=dailyTotals(rows.map(r=>({segments:r.segments}))),subjects=new Map();
 for(const r of rows)subjects.set(r.session.subject,(subjects.get(r.session.subject)||0)+r.seconds);
 const total=rows.reduce((n,r)=>n+r.seconds,0),activeDays=Object.values(days).filter(n=>n>0).length,series=Array.from({length:range.calendarDays},(_,i)=>{const date=shiftDay(range.start,i);return{date,seconds:days[date]||0};});
 const pairs=[...subjects].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([name,seconds])=>({name,value:subjectValue(name),label:subjectName(name),seconds,share:total?seconds/total:0}));
 const buckets=range.calendarDays<=31?series.map(d=>({...d,start:d.date,end:d.date})):Array.from({length:Math.ceil(series.length/7)},(_,i)=>{const part=series.slice(i*7,i*7+7);return {start:part[0].date,end:part.at(-1).date,seconds:part.reduce((n,d)=>n+d.seconds,0)};});
 return{range,subject,rows,total,count:rows.length,activeDays,average:activeDays?total/activeDays:null,days,series,subjects:pairs,buckets};
}
export function mostRecentStudyDay(sessions,today,subject=''){const end=localDayStart(shiftDay(today,1));let latest=-1;for(const s of sessions)if(matchesSubject(s,subject))for(const [a,b]of s.segments){const stop=Math.min(b,end);if(stop>a)latest=Math.max(latest,stop-1);}return latest<0?'':dayKey(latest);}
export function trackerSubjects(sessions){return [...new Set(sessions.map(s=>s.subject))].sort((a,b)=>subjectName(a).localeCompare(subjectName(b))).map(name=>({name,label:subjectName(name),value:subjectValue(name)}));}
export function trackerYear(sessions,today){const monday=shiftDay(today,1-(new Date(today+'T12:00:00').getDay()||7)),start=shiftDay(monday,-51*7),range={startAt:localDayStart(start),endAt:localDayStart(shiftDay(today,1))},report=trackerReport(sessions,{...range,start,end:today,calendarDays:Math.round((dateNumber(today)-dateNumber(start))/DAY)+1});return{start,days:Array.from({length:364},(_,i)=>{const date=shiftDay(start,i);return{date,future:date>today,seconds:report.days[date]||0};}),months:Array.from({length:52},(_,i)=>{const date=shiftDay(start,i*7),previous=i?shiftDay(start,(i-1)*7):'';return{date,label:!i||date.slice(0,7)!==previous.slice(0,7)?formatDay(date,{month:'short',day:undefined}):''};})};}
const csvCell=value=>{let s=String(value??'');if(/^[\s]*[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
export function trackerCSV(report,zone){const headers=['Session ID','Filter start (local date)','Filter end (local date)','Report time zone','Subject','Task','Chapter','Mode','Status','Original started at (UTC)','Original ended at (UTC)','Full session seconds','Seconds in selected range','Counted intervals in selected range (UTC)'];const rows=report.rows.map(r=>{const s=r.session;return [s.id,report.range.start,report.range.end,zone,s.subject,s.taskTitle||'',s.chapterTitle||'',s.mode,s.status,new Date(s.startedAt).toISOString(),new Date(s.endedAt).toISOString(),s.durationSeconds,r.seconds,JSON.stringify(r.segments.map(xs=>xs.map(t=>new Date(t).toISOString())))];});return '\uFEFF'+[headers,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';}
export function exampleTrackerSessions(today){const at=time=>new Date(today+'T'+time+':00').getTime();return [{id:'example-maths-1',subject:'Maths',mode:'focus',status:'Completed',taskTitle:'Practise equations',startedAt:at('09:00'),endedAt:at('09:25'),durationSeconds:1500,segments:[[at('09:00'),at('09:25')]]},{id:'example-maths-2',subject:'Maths',mode:'pomodoro',status:'Completed',startedAt:at('09:30'),endedAt:at('09:55'),durationSeconds:1500,segments:[[at('09:30'),at('09:55')]]},{id:'example-english',subject:'English',mode:'study',status:'Ended early',taskTitle:'Revise one essay paragraph',startedAt:at('10:00'),endedAt:at('10:40'),durationSeconds:2400,segments:[[at('10:00'),at('10:40')]]}];}
