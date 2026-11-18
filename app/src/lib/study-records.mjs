import {dayBoundary,zonedDay} from './study-analysis.mjs';
import {shiftPlannerDay as shiftDay} from './planner.mjs';

const learning=s=>['study','focus','pomodoro'].includes(s.mode);
const total=segments=>segments.reduce((n,[a,b])=>n+(b-a)/1000,0);
const matches=(s,subject,mode)=>(!subject||(subject==='none'?!s.subject:s.subject===subject))&&(!mode||s.mode===mode);

// This index is independent of the report dates. Deleted, future and non-learning
// records must not create subject options or make an empty history look populated.
export function learningRecordHistory(data,now){
 const saved=new Map((data.sessions||[]).filter(s=>learning(s)&&!Object.hasOwn(data.workspace?.deletedSessions||{},s.id)).map(s=>[s.id,s]));
 const rows=[...saved.values()].map(session=>{const segments=session.segments.map(([a,b])=>[Math.max(0,a),Math.min(now,b)]).filter(([a,b])=>b>a);return {session,segments,seconds:total(segments)};}).filter(r=>r.seconds>0);
 rows.sort((a,b)=>b.segments.at(-1)[1]-a.segments.at(-1)[1]||a.session.id.localeCompare(b.session.id));
 const subjects=[...new Set([...(data.subjects||[]),...rows.map(r=>r.session.subject)].filter(Boolean))].sort((a,b)=>a.localeCompare(b));
 return {rows,count:rows.length,subjects,hasUnlabelled:rows.some(r=>!r.session.subject)};
}

// No daily/hourly analysis arrays are generated here: Records can read multiple
// years without weakening the 366-day limit for charts, goals and review reports.
export function allHistoryRecords(history,zone,now,{subject='',mode=''}={}){
 const today=zonedDay(now,zone),first=history.rows.reduce((at,r)=>Math.min(at,...r.segments.map(s=>s[0])),now),start=zonedDay(first,zone);
 const rows=history.rows.filter(r=>matches(r.session,subject,mode)),seconds=rows.reduce((n,r)=>n+r.seconds,0);
 return {range:{period:'history',start,end:today,today,zone,startAt:dayBoundary(start,zone),endAt:now},rows,count:rows.length,total:seconds};
}

export function groupRecordDays(rows,zone,limit=100){
 const days=new Map(),boundaries=new Map();
 for(const row of rows)for(const [a,b]of row.segments){let at=a;while(at<b){const date=zonedDay(at,zone);if(!boundaries.has(date))boundaries.set(date,dayBoundary(shiftDay(date,1),zone));const end=Math.min(b,boundaries.get(date));
  const day=days.get(date)||{date,total:0,records:new Map()},entry=day.records.get(row.session.id)||{session:row.session,segments:[],seconds:0};entry.segments.push([at,end]);entry.seconds+=(end-at)/1000;day.total+=(end-at)/1000;day.records.set(row.session.id,entry);days.set(date,day);at=end;
 }}
 const ordered=[...days.values()].sort((a,b)=>b.date.localeCompare(a.date));let remaining=limit,totalEntries=0;
 const groups=ordered.map(day=>{const all=[...day.records.values()].sort((a,b)=>b.segments.at(-1)[1]-a.segments.at(-1)[1]||a.session.id.localeCompare(b.session.id)),records=all.slice(0,remaining);remaining-=records.length;totalEntries+=all.length;return {date:day.date,total:day.total,count:all.length,records};}).filter(day=>day.records.length);
 return {groups,totalEntries,shownEntries:Math.min(limit,totalEntries),dayCount:ordered.length};
}

export function recordsEmptyKind(history,{subject='',mode='',dayView=null}={}){return !history.count?'first':subject||mode||dayView?'filtered':'dates';}
