import {transition} from './model.mjs';
import {generateStudySchedule,planningCapacity,planningFingerprint,taskRemaining} from './planning-engine.mjs';
import {preparationFor,preparationExam,preparationDeadline,preparationPhases,preparationSignature} from './exam-preparation.mjs';
import {zonedDay,dayBoundary} from './study-analysis.mjs';
import {shiftPlannerDay as shiftDay} from './planner.mjs';
const live=xs=>(xs||[]).filter(x=>!x.deletedAt);
export function previewPreparation(data,draft,id,now){
 const basis=planningFingerprint(data),prepared=transition(data,{type:'planning-preparation',epoch:data.epoch,expectedRevision:data.workspace.planning.revision,basis,draftId:id,draft,apply:false},{now,id:id+':preview',owner:'preview'}).state;
 const recipe={start:zonedDay(now,prepared.workspace.planning.settings.zone),days:14,goalId:''},schedule=generateStudySchedule(prepared,recipe,now);
 return{data:prepared,basis,draftId:id,draft,schedule,budget:examPreparationReport(prepared,id,now)};
}
export function previewRestDay(data,date,now){
 const draft=structuredClone(data),p=draft.workspace.planning;
 if(!live(p.exceptions).some(e=>e.date===date&&e.kind==='off'))p.exceptions.push({id:'rest-preview',date,kind:'off',start:0,end:1440,updatedAt:now,deletedAt:0});
 const schedule=generateStudySchedule(draft,{start:zonedDay(now,p.settings.zone),days:14,goalId:''},now);
 return{...schedule,fingerprint:planningFingerprint(data),restDate:date,changes:planningChanges(data,schedule)};
}
export function planningChanges(data,result){
 const previous=data.workspace.planning.blocks.filter(b=>result.replaceIds.includes(b.id)),left=[...previous],fresh=[];let same=0;
 for(const b of result.blocks){const i=left.findIndex(x=>x.taskId===b.taskId&&x.startAt===b.startAt&&x.endAt===b.endAt);if(i>=0){left.splice(i,1);same++;}else fresh.push(b);}
 let moved=0,added=0;for(const b of fresh){const i=left.findIndex(x=>x.taskId===b.taskId);if(i>=0){left.splice(i,1);moved++;}else added++;}
 return{same,moved,added,removed:left.length,protected:live(data.workspace.planning.blocks).filter(b=>b.status==='planned'&&(b.locked||data.timer?.planningBlockId===b.id)).length};
}
export function examPreparationReport(data,goalId,now){
 const p=data.workspace.planning,prep=preparationFor(data,goalId);if(!prep)return null;
 const exam=preparationExam(data,prep),deadline=preparationDeadline(data,prep),today=zonedDay(now,p.settings.zone),tasks=new Map(live(data.workspace.tasks).map(t=>[t.id,t])),rules=live(p.rules),mine=rules.filter(r=>r.goalId===goalId),topics=live(prep.topics);
 const covered=topics.filter(t=>t.confidence!=='new'||tasks.get(t.learnTaskId)?.done).length,stages=['learn','review','mock'].map(stage=>{const list=mine.filter(r=>!r.prep?.omitted).filter(r=>stage==='mock'?['mock','reflect'].includes(r.prep?.stage):r.prep?.stage===stage);return{stage,total:list.length,done:list.filter(r=>tasks.get(r.id)?.done).length};});
 const result={prep,exam,deadline,paused:!exam||deadline<=now,covered,total:topics.length,stages,phases:preparationPhases(data,prep),stale:!!prep.lastAppliedAt&&prep.lastInputs!==preparationSignature(data),remaining:mine.reduce((n,r)=>n+(taskRemaining(tasks.get(r.id)||{done:true},r)||0),0),available:0,required:0,shortfall:0,otherExams:0,warnings:[]};
 if(result.paused)return result;
 const active=live(p.examPlans).filter(e=>live(p.goals).some(g=>g.id===e.id)&&preparationDeadline(data,e)>now),ids=new Set(active.map(e=>e.id)),cutoffs=new Map(active.map(e=>[e.id,preparationDeadline(data,e)])),ruleById=new Map(rules.map(r=>[r.id,r])),keep=live(p.blocks).filter(b=>b.status==='planned'&&!ids.has(ruleById.get(b.taskId)?.goalId)),last=zonedDay(deadline-1,p.settings.zone),days=Math.min(367,Math.max(1,Math.round((Date.parse(last)-Date.parse(today))/86400000)+1)),capacity=planningCapacity(data,{start:today,days,now,keep});
 result.available=capacity.days.reduce((n,d)=>n+d.slots.reduce((m,s)=>m+Math.max(0,Math.min(s.endAt,deadline)-s.startAt)/60000,0),0);
 result.required=rules.filter(r=>ids.has(r.goalId)&&cutoffs.get(r.goalId)<=deadline).reduce((n,r)=>n+(taskRemaining(tasks.get(r.id)||{done:true},r)||0),0);
 result.shortfall=Math.max(0,Math.ceil(result.required-result.available));result.otherExams=active.length-1;result.warnings=capacity.warnings;
 result.overdue=live(p.blocks).some(b=>b.status==='planned'&&b.endAt<now&&mine.some(r=>r.id===b.taskId&&!r.prep?.omitted&&!tasks.get(r.id)?.done)&&!(data.sessions||[]).some(s=>s.planningBlockId===b.id));
 return result;
}
