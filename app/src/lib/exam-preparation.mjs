import {validateExam,examInstant} from './exams.mjs';
import {dayBoundary,zonedDay} from './study-analysis.mjs';
import {shiftPlannerDay as shiftDay} from './planner.mjs';
import {syllabusLeaves} from './syllabus.mjs';
import {recordTask} from './learning-history.mjs';
const live=xs=>(xs||[]).filter(x=>!x.deletedAt),bad=m=>{throw Error(m);};
export const preparationFor=(data,goalId)=>live(data.workspace.planning?.examPlans).find(p=>p.id===goalId);
export function preparationExam(data,prep){return prep&&live(data.workspace.planning.goals).some(g=>g.id===prep.id)&&live(data.workspace.exams).find(e=>e.id===prep.examId&&!e.archived&&e.status!=='taken');}
export function preparationDeadline(data,prep){const e=preparationExam(data,prep);return e?(e.time?examInstant(e):dayBoundary(e.date,data.workspace.planning.settings.zone)):0;}
export function preparationSignature(data){
 const p=data.workspace.planning,s=p.settings,v=JSON.stringify([[s.zone,s.strategy,s.maxDailyMinutes,s.focusMinutes,s.minMinutes,s.breakMinutes,s.bufferMinutes],live(p.availability).map(w=>[w.id,w.weekday,w.start,w.end]),live(p.exceptions).map(e=>[e.id,e.date,e.kind,e.start,e.end]),live(data.workspace.blocks).map(b=>[b.id,b.weekday,b.start,b.end,b.kind]),live(data.workspace.exams).map(e=>[e.id,e.date,e.time,e.zone,e.fold,e.archived,e.status]),live(p.examPlans).map(e=>[e.id,e.importance,e.topics.map(t=>[t.id,t.confidence])]),live(p.rules).map(r=>[r.id,r.remainingMinutes,r.dependsOn,r.earliestDate,r.prep&&[r.prep.topicId,r.prep.stage,r.prep.round,r.prep.gapDays,r.prep.whole,r.prep.omitted===true]]),live(data.workspace.tasks).map(t=>[t.id,t.done,t.dueDate,t.estimateMinutes])]);let hash=2166136261;for(let i=0;i<v.length;i++)hash=Math.imul(hash^v.charCodeAt(i),16777619);return(hash>>>0).toString(16);
}
export function preparationPhases(data,prep){
 const exam=preparationExam(data,prep);if(!exam)return[];const days=Math.max(1,Math.round((Date.parse(exam.date)-Date.parse(prep.startDate))/86400000)),review=shiftDay(exam.date,-Math.min(7,Math.max(1,Math.floor(days/3)))),mock=shiftDay(exam.date,-Math.min(3,Math.max(1,Math.floor(days/6))));
 return[{id:'learn',title:'Study & practise',start:prep.startDate,end:review},{id:'review',title:'Review',start:review,end:mock},{id:'mock',title:'Mock & reflect',start:mock,end:exam.date}];
}
export function createExamPreparation(state,draft,{id,now,time=now}){
 const w=state.workspace,p=w.planning;if(!draft||typeof id!=='string'||id.length>70||!/^[-a-zA-Z0-9:]+$/.test(id))bad('Reopen the preparation form.');
 if(p.goals.some(g=>g.id===id))bad('This preparation is already saved. Open it from Plans.');
 let exam=draft.examId&&live(w.exams).find(e=>e.id===draft.examId);if(draft.examId&&!exam)bad('This exam changed. Choose a current exam.');
 if(!exam){exam=validateExam({...draft.exam,zone:draft.exam?.time?draft.exam.zone:'',fold:draft.exam?.time?draft.exam.fold||'':'',id:id+':exam',status:'upcoming',archived:false,updatedAt:time,deletedAt:0});w.exams.push(exam);}
 if(live(p.examPlans).some(e=>e.examId===exam.id&&live(p.goals).some(g=>g.id===e.id)))bad('This exam already has a preparation. Open it in Plans.');
 if(exam.archived||exam.status==='taken')bad('Choose an upcoming exam.');
 const today=zonedDay(now,p.settings.zone);if(exam.date<=today&&!exam.time||exam.time&&examInstant(exam)<=now)bad('Choose a future exam date or exact time.');
 if(exam.date>shiftDay(today,366))bad('Prepare for an exam within the next 12 months.');
 if(!Array.isArray(draft.topics)||!draft.topics.length||draft.topics.length>100)bad('Choose between 1 and 100 topics.');
 if(![0,1,2].includes(draft.rounds)||!Number.isInteger(draft.gapDays)||draft.gapDays<0||draft.gapDays>30)bad('Check the review settings.');
 if(![0,30,60,90,120,180].includes(draft.mockMinutes))bad('Choose a supported mock duration.');
 if(!['normal','high'].includes(draft.importance||'normal'))bad('Choose an exam priority.');
 p.version=2;p.examPlans??=[];
 p.goals.push({id,title:exam.title,subject:exam.subject,deadline:exam.date,kind:'exam',examId:exam.id,updatedAt:time,deletedAt:0});
 const prep={id,examId:exam.id,startDate:today,importance:draft.importance||'normal',rounds:draft.rounds,gapDays:draft.gapDays,lastInputs:'',lastAppliedAt:0,topics:[],updatedAt:time,deletedAt:0},keys=new Set();p.examPlans.push(prep);
 function activity(taskId,title,minutes,topic,stage,round=0,parent='',gapDays=0,earliestDate='',whole=false){
  const t={id:taskId,title:title.slice(0,140),subject:exam.subject||live(w.plans).find(p=>p.id===topic?.sourcePlanId)?.chapters.find(c=>c.id===topic?.sourceChapterId)?.subject||'',estimateMinutes:minutes,plannedDate:'',dueDate:'',priority:'normal',done:false,updatedAt:time,deletedAt:0};w.tasks.push(t);recordTask(state,t,now,taskId);
  p.rules.push({id:taskId,goalId:id,remainingMinutes:minutes,earliestDate,dependsOn:parent?[parent]:[],sourcePlanId:topic?.sourcePlanId||'',sourceChapterId:topic?.sourceChapterId||'',prep:{topicId:topic?.id||'',stage,round,gapDays,whole},updatedAt:time,deletedAt:0});return taskId;
 }
 draft.topics.forEach((value,i)=>{
  if(typeof value.title!=='string'||!value.title.trim()||value.title.length>140||!Number.isInteger(value.minutes)||value.minutes<5||value.minutes>480||!['new','weak','confident'].includes(value.confidence))bad('Give each topic a name, estimate and self-assessment.');
  const key=value.sourceChapterId?value.sourcePlanId+'|'+value.sourceChapterId:value.title.trim().toLowerCase();if(keys.has(key))bad('A topic is selected twice.');keys.add(key);
  let leaf;if(value.sourceChapterId){leaf=syllabusLeaves(live(w.plans).find(s=>s.id===value.sourcePlanId)).find(c=>c.id===value.sourceChapterId);if(!leaf)bad('A syllabus topic changed. Choose it again.');}
  const topic={id:id+':topic'+i,title:leaf?.title||value.title.trim(),minutes:value.minutes,confidence:value.confidence,sourcePlanId:leaf?value.sourcePlanId:'',sourceChapterId:leaf?.id||'',learnTaskId:'',updatedAt:time,deletedAt:0};prep.topics.push(topic);
  let parent='';if(topic.confidence==='new'){parent=activity(topic.id+':learn',topic.title,value.minutes,topic,'learn');topic.learnTaskId=parent;}
  for(let round=1;round<=draft.rounds;round++){const gap=parent?(round===1?draft.gapDays:Math.max(1,draft.gapDays+3)):0;parent=activity(topic.id+':r'+round,'Review: '+topic.title,Math.max(10,Math.min(30,Math.ceil(value.minutes/2/5)*5)),topic,'review',round,parent,gap);}
 });
 if(draft.mockMinutes){const earliestDate=shiftDay(exam.date,-Math.min(3,Math.max(1,Math.floor((Date.parse(exam.date)-Date.parse(today))/86400000/6)))),task=activity(id+':mock','Timed practice paper',draft.mockMinutes,null,'mock',0,'',0,earliestDate,true);activity(id+':reflect','Check the paper and review mistakes',30,null,'reflect',0,task);}
 if(!p.rules.some(r=>r.goalId===id))bad('Add a review round or a topic you still need to study.');
 return prep;
}

export function preparationEarliest(data,rule,finished,allTasks,now){
 if(!rule?.prep)return 0;let earliest=0;
 for(const id of rule.dependsOn||[]){const task=allTasks.get(id);const completed=task?.done?Math.max(0,...data.workspace.planning.feedback.filter(f=>f.taskId===id&&f.done&&!f.deletedAt).map(f=>f.updatedAt))||task.updatedAt:finished.get(id);if(completed&&rule.prep.gapDays)earliest=Math.max(earliest,dayBoundary(shiftDay(zonedDay(completed,data.workspace.planning.settings.zone),rule.prep.gapDays),data.workspace.planning.settings.zone));}
 return earliest;
}
