import {wallCandidates} from './exams.mjs';
import {activityInput,ACTIVITY_SUBJECTS,ACTIVITY_KINDS} from './group-activities.mjs';
import {utcDay,weekStart} from './community-model.mjs';
export const GROUP_TASK_TEMPLATES={read:'Read and summarise a chapter',practice:'Practise a set of questions',review:'Review notes and correct mistakes',mock:'Complete a timed practice paper',write:'Write one section',code:'Complete one coding exercise'};
export const WEEKDAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
export const dayPlus=(day,n)=>utcDay(Date.parse(day+'T00:00:00Z')+n*86400000);
export function seriesInput(input,at){
 if(!input||!Array.isArray(input.weekdays)||!input.weekdays.length||input.weekdays.length>7||input.weekdays.some(d=>!Number.isInteger(d)||d<0||d>6))throw Error('Choose at least one weekday.');
 const anchor=wallCandidates(input.date,input.time,input.zone);if(!anchor.length)throw Error('That local time does not exist. Choose another time.');
 if(!['earlier','later'].includes(input.fold))throw Error('Choose how repeated clock times are handled.');
 if(Date.parse(input.date+'T00:00:00Z')<at-90*86400000)throw Error('Choose a more recent start date.');
 const data=activityInput({...input,customTitle:''},Math.min(at,anchor[0]));
 return {...data,date:input.date,time:input.time,fold:input.fold,weekdays:[...new Set(input.weekdays)].sort()};
}
export function seriesDates(input,at,count=3){
 const d=seriesInput(input,at),days=[],skipped=[];
 for(let day=d.date,i=0;i<180&&days.length<count;i++,day=dayPlus(day,1)){
  if(!d.weekdays.includes(new Date(day+'T00:00:00Z').getUTCDay()))continue;
  const candidates=wallCandidates(day,d.time,d.zone);if(!candidates.length){skipped.push(day);continue;}
  const startsAt=d.fold==='later'?candidates.at(-1):candidates[0];if(startsAt<at||startsAt>at+56*86400000)continue;
  days.push({date:day,startsAt});
 }
 if(!days.length)throw Error('No upcoming occurrence falls within the next eight weeks.');return {days,skipped};
}
export const seriesDraft=s=>({subject:s.subject,kind:s.kind,date:s.local_date,time:s.local_time,zone:s.zone,fold:s.fold,weekdays:JSON.parse(s.weekdays),focusMinutes:s.focus_minutes,breakMinutes:s.break_minutes});
export async function occurrenceId(id,version,at){const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(id+':'+version+':'+at))),h=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;}
export function reportWeek(value,at){const week=value||weekStart(at),current=weekStart(at);if(!/^\d{4}-\d{2}-\d{2}$/.test(week)||weekStart(Date.parse(week+'T12:00:00Z'))!==week||week>current||week<dayPlus(current,-77))throw Error('Choose a week within the last twelve weeks.');return week;}
export function challengeInput(input,at){const start=utcDay(at),end=input.endDay;if(!['minutes','activities'].includes(input.kind)||!Number.isInteger(Number(input.goal))||Number(input.goal)<1||Number(input.goal)>(input.kind==='minutes'?120000:100)||!/^\d{4}-\d{2}-\d{2}$/.test(end||'')||dayPlus(end,0)!==end||end<start||end>dayPlus(start,55))throw Error('Choose a positive goal and an end date within eight weeks.');return {kind:input.kind,goal:Number(input.goal),startDay:start,endDay:end};}
export function groupReportCSV(report){return ['Date,Recorded minutes,Participating members',...report.days.map(d=>`${d.day},${(d.seconds/60).toFixed(2)},${d.members}`)].join('\r\n');}
export {ACTIVITY_SUBJECTS,ACTIVITY_KINDS};
