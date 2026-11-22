import {weeklyInput} from './ai-weekly.mjs';
import {weeklyFacts} from './ai-weekly-contract.mjs';
import {analysisRange,studyAnalysis,comparisonRange,zonedDay} from './study-analysis.mjs';
import {shiftPlannerDay as shiftDay} from './planner.mjs';
import {generateStudySchedule,planningFingerprint,planningTaskDeadline} from './planning-engine.mjs';
import {validatePlanning} from './planning-schema.mjs';

const live=xs=>(xs||[]).filter(x=>!x.deletedAt);
const history=data=>(data.workspace?.learning?.events||[]).filter(e=>['task','baseline'].includes(e.kind));
// Keep the mapping on this device. Uploaded facts contain stable-in-report aliases only.
export function detailedPlanning(data,{at=Date.now(),subjectNames=[]}={}){
 const p=validatePlanning(data.workspace?.planning),start=zonedDay(at,p.settings.zone),end=shiftDay(start,6);
 const all=data.workspace?.tasks||[],ordered=[...all].sort((a,b)=>a.id.localeCompare(b.id)),refs=new Map(ordered.map((t,i)=>[t.id,'T'+(i+1)])),local=new Map(ordered.map(t=>[refs.get(t.id),t.id]));
 const sub=name=>{const i=subjectNames.indexOf(name);return i<0?null:'subject-'+i;},rules=new Map(live(p.rules).map(r=>[r.id,r]));
 const open=live(all).filter(t=>!t.done&&!rules.get(t.id)?.prep?.omitted);
 const remaining=t=>{const rule=rules.get(t.id);if(rule?.remainingMinutes!==null&&rule?.remainingMinutes!==undefined)return rule.remainingMinutes;return (data.sessions||[]).some(s=>s.taskId===t.id&&s.durationSeconds>0&&!Object.hasOwn(data.workspace?.deletedSessions||{},s.id))?null:t.estimateMinutes>0?t.estimateMinutes:null;};
 // A date-only exam provides no safe preparation time on the exam day.
 const adjustedExams=(data.workspace?.exams||[]).map(e=>!e.deletedAt&&!e.time?{...e,date:shiftDay(e.date,-1)}:e);
 const clone={...data,workspace:{...data.workspace,exams:adjustedExams,tasks:all.map(t=>({...t,estimateMinutes:remaining(t)??0})),planning:{...p,rules:p.rules.map(r=>({...r,remainingMinutes:remaining(all.find(t=>t.id===r.id)||{})}))}}};
 let schedule=null,issue='';
 if(open.length>40)issue='More than 40 unfinished tasks. Reduce or archive the backlog before requesting a detailed schedule.';
 else try{schedule=generateStudySchedule(clone,{start,days:7},at);if(schedule.blocks.length>80){schedule=null;issue='The proposed schedule exceeds 80 sessions. Use fewer tasks or longer focus sessions.';}}catch(e){issue=e.message;}
 const tasks=open.slice(0,40).map(t=>{const deadline=planningTaskDeadline(t,rules.get(t.id),clone.workspace.planning,clone);return {ref:refs.get(t.id),subject:sub(t.subject),remaining:remaining(t),deadline:Number.isFinite(deadline)?zonedDay(deadline-1,p.settings.zone):'',priority:t.priority||'normal'};});
 const exams=live(data.workspace?.exams).filter(e=>!e.archived&&e.status!=='taken'&&e.date>=start&&e.date<=shiftDay(end,7)).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,10).map((e,i)=>({ref:'X'+(i+1),subject:sub(e.subject),date:e.date,timeKnown:!!e.time}));
 const days=schedule?.capacity.days.map(d=>({date:d.date,capacity:d.capacity,buffer:d.buffer,free:d.free}))||Array.from({length:7},(_,i)=>({date:shiftDay(start,i),capacity:0,buffer:0,free:0}));
 const knownAvailability=live(p.availability).length>0||live(p.exceptions).some(e=>e.kind==='study'&&e.date>=start&&e.date<=end);
 const candidate=schedule?.blocks.length&&knownAvailability?{id:'P1',scheduled:schedule.plannedMinutes,replacementCount:schedule.replaceIds.length,keptCount:live(p.blocks).filter(b=>b.status==='planned'&&!schedule.replaceIds.includes(b.id)&&b.endAt>at).length,slots:schedule.blocks.map(b=>({ref:refs.get(b.taskId),date:zonedDay(b.startAt,p.settings.zone),minutes:(b.endAt-b.startAt)/60000,startAt:b.startAt,endAt:b.endAt})),unplaced:schedule.unscheduled.map(u=>({ref:refs.get(u.taskId),minutes:u.minutes,reason:u.reason,deadlineRisk:!!u.deadlineRisk}))}:null;
 return {facts:{at,basis:planningFingerprint(data),start,end,zone:p.settings.zone,knownAvailability,tasks,exams,days,capacity:days.reduce((a,d)=>a+d.capacity,0),buffer:days.reduce((a,d)=>a+d.buffer,0),breakMinutes:p.settings.breakMinutes,candidate,issue},schedule,local,refs};
}
export function detailedWeeklyInput(data,options){
 options={period:'last-week',...options};
 const base=weeklyInput(data,options),range=analysisRange(options),report=studyAnalysis(data,range,options),events=history(data),subjectNames=report.subjects.map(s=>s.name),sub=name=>{const i=subjectNames.indexOf(name);return i<0?null:'subject-'+i;};
 const planning=detailedPlanning(data,{at:options.planningAt??options.now,subjectNames}),weekly=(data.workspace?.learning?.events||[]).filter(e=>e.kind==='weekly-goal'),atStart=weekly.filter(e=>e.at<=range.startAt).at(-1);
 if(planning.facts.issue)throw Error(planning.facts.issue);
 const selected=!!options.subject||!!options.mode,minutes=!selected&&atStart?.minutes>0?atStart.minutes:null;
 const states=new Map();for(const e of events)if(e.at<=range.startAt)states.set(e.taskId,e);
 const matches=t=>!options.subject||(options.subject==='none'?!t.subject:t.subject===options.subject),original=[...states.values()].filter(t=>!t.deleted&&!t.done&&matches(t)&&t.plannedDate>=range.start&&t.plannedDate<=range.end);
 const known=!!data.workspace?.learning?.startedAt&&data.workspace.learning.startedAt<=range.startAt&&!options.mode;
 const first=new Map();for(const e of events)if(!first.has(e.taskId))first.set(e.taskId,e);
 const pairs=report.tasks.rows.filter(t=>{const initial=first.get(t.id),firstWork=Math.min(...(data.sessions||[]).filter(s=>s.taskId===t.id&&['study','focus','pomodoro'].includes(s.mode)&&!Object.hasOwn(data.workspace?.deletedSessions||{},s.id)).flatMap(s=>s.segments.map(r=>r[0])));return t.completedInPeriod&&t.actualSeconds>0&&!t.unknownCompletion&&initial?.estimateMinutes>0&&!initial.done&&!initial.deleted&&initial.at<=firstWork;}).slice(0,12).map(t=>({ref:planning.refs.get(t.id),subject:sub(t.subject),estimated:first.get(t.id).estimateMinutes,actual:t.actualSeconds}));
 const weeks=[];let r=range;for(let i=0;i<4;i++){const a=studyAnalysis(data,r,options);weeks.unshift({start:r.start,end:r.end,seconds:a.total,count:a.count,activeDays:a.activeDays,partial:range.partial});r=comparisonRange({...r,period:'week'});}
 const follow=[];const allEvents=data.workspace?.learning?.events||[];
 for(const e of allEvents.filter(e=>e.kind==='ai-plan'&&e.at<range.endAt).slice(-8)){
  const undone=allEvents.some(x=>x.kind==='ai-plan-undone'&&x.adoptionId===e.id&&x.at<range.endAt);
  for(const link of e.links){const state=events.filter(x=>x.taskId===link.taskId&&x.at<range.endAt).at(-1);follow.push({ref:'A'+(follow.length+1),subject:state?sub(state.subject):null,status:undone?'undone':!state?'unknown':state.deleted?'removed':state.done?'completed':'open',remaining:null});if(follow.length===8)break;}if(follow.length===8)break;
 }
 return weeklyFacts({...base,version:2,detail:{target:{minutes,knownAtStart:minutes!==null,changes:selected?0:weekly.filter(e=>e.at>range.startAt&&e.at<range.endAt).length},baseline:{known,planned:known?original.length:null,completed:known?original.filter(t=>report.tasks.rows.some(x=>x.id===t.taskId&&x.completedInPeriod)).length:null,added:[...first.values()].filter(e=>e.kind==='task'&&e.at>range.startAt&&e.at<range.endAt&&matches(e)).length,unknownCompletions:report.tasks.unknown},pairs,weeks,planning:planning.facts,follow}});
}
