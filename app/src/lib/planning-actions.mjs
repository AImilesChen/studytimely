import {editablePlanningBlock,checkManualSession} from './planning-manual.mjs';
import {validatePlanning,planningSettings,planningDate} from './planning-schema.mjs';
import {generateStudySchedule,planningFingerprint} from './planning-engine.mjs';
import {zonedDay} from './study-analysis.mjs';
import {recordTask} from './learning-history.mjs';
import {detailedPlanning} from './ai-weekly-detailed.mjs';
import {createExamPreparation,preparationSignature,preparationFor} from './exam-preparation.mjs';
const bad=m=>{throw Error(m);},live=xs=>xs.filter(x=>!x.deletedAt);
export function planningAction(state,a,{id,now}){
 const p=state.workspace.planning=validatePlanning(state.workspace.planning),w=state.workspace;
 if(a.expectedRevision!==p.revision)bad('Your plan changed. Reopen it before saving.');
 const time=Math.max(now,...[p.settings.updatedAt,...p.goals.map(x=>x.updatedAt),...p.rules.map(x=>x.updatedAt),...p.blocks.map(x=>x.updatedAt),...(p.examPlans||[]).map(x=>x.updatedAt)])+1;
 const upsert=(key,fields,itemId=a.itemId)=>{const old=itemId?p[key].find(x=>x.id===itemId&&!x.deletedAt):null;if(itemId&&!old)bad('This plan item was removed.');const entry={...old,...fields,id:old?.id||id,updatedAt:time,deletedAt:0};p[key]=old?p[key].map(x=>x.id===old.id?entry:x):[...p[key],entry];return entry;};
 const saveTask=fields=>{
  let task=fields.taskId?live(w.tasks).find(t=>t.id===fields.taskId):null;
  if(!task&&fields.sourceChapterId){const r=live(p.rules).find(r=>r.sourcePlanId===fields.sourcePlanId&&r.sourceChapterId===fields.sourceChapterId);if(r)task=live(w.tasks).find(t=>t.id===r.id);}
  if(fields.sourceChapterId&&!live(w.plans).find(x=>x.id===fields.sourcePlanId)?.chapters.some(c=>c.id===fields.sourceChapterId&&!c.deletedAt))bad('This syllabus topic changed.');
  if(fields.taskId&&!task)bad('Choose a current task.');
  if(fields.reopen!==undefined&&typeof fields.reopen!=='boolean')bad('Choose whether to reopen this task.');
  if(fields.reopen&&(!task?.done||!Number.isSafeInteger(fields.remainingMinutes)||fields.remainingMinutes<1))bad('Reopening needs a completed task and a positive remaining-time estimate.');
  if(fields.remainingMinutes!==null&&(!Number.isSafeInteger(fields.remainingMinutes)||fields.remainingMinutes<0||fields.remainingMinutes>10080))bad('Enter a valid remaining-time estimate.');
  if(fields.goalId&&!live(p.goals).some(g=>g.id===fields.goalId))bad('Choose a current goal.');
  if(task&&fields.reopen){task.done=false;task.updatedAt=time;if(fields.title===undefined)recordTask(state,task,now,id);}
  if(!task){task={id:id+':task',title:fields.title,subject:fields.subject||'',estimateMinutes:fields.remainingMinutes||0,plannedDate:'',dueDate:fields.dueDate||'',priority:fields.priority||'normal',done:false,updatedAt:time,deletedAt:0};w.tasks.push(task);recordTask(state,task,now,id);}
  else if(fields.title!==undefined){if(typeof fields.title!=='string'||!fields.title.trim()||fields.title.length>140||typeof fields.subject!=='string'||fields.subject.length>40)bad('Check the task title and subject.');task.title=fields.title.trim();task.subject=fields.subject;task.updatedAt=time;if(fields.dueDate!==undefined)task.dueDate=fields.dueDate;if(fields.priority!==undefined)task.priority=fields.priority;recordTask(state,task,now,id);}
  const old=p.rules.find(r=>r.id===task.id);const rule={...old,id:task.id,goalId:fields.goalId||'',remainingMinutes:fields.remainingMinutes,earliestDate:fields.earliestDate||'',dependsOn:old?.prep?[...new Set([...(old.dependsOn||[]),...(fields.dependsOn||[])])]:fields.dependsOn||[],sourcePlanId:fields.sourcePlanId||old?.sourcePlanId||'',sourceChapterId:fields.sourceChapterId||old?.sourceChapterId||'',updatedAt:time,deletedAt:0};p.rules=old?p.rules.map(r=>r.id===task.id?rule:r):[...p.rules,rule];
  return task;
 };
 const markApplied=()=>{const signature=preparationSignature(state);for(const e of live(p.examPlans||[])){e.lastInputs=signature;e.lastAppliedAt=now;e.updatedAt=time;}};
 const apply=(result,restChange=null)=>{if(result.blocks.some(b=>b.startAt<now))bad('A proposed time has passed. Generate again.');const before=p.blocks.filter(b=>result.replaceIds.includes(b.id)).map(b=>({...b}));p.blocks=p.blocks.map(b=>result.replaceIds.includes(b.id)?{...b,updatedAt:time,deletedAt:time}:b);const created=result.blocks.map((b,i)=>({...b,id:id+':'+i,source:'generated',locked:false,status:'planned',updatedAt:time,deletedAt:0}));p.blocks.push(...created);p.undo={id,at:now,revision:p.revision+1,before,afterIds:created.map(b=>b.id),...(restChange?{restChange}:{})};markApplied();};
 if(a.type==='planning-settings'){
  p.settings=planningSettings({...a.settings,updatedAt:time});
  if(!Array.isArray(a.windows)||a.windows.length>50)bad('Choose up to 50 weekly study windows.');
  const windows=new Map(p.availability.map(x=>[x.id,{...x,updatedAt:time,deletedAt:time}]));a.windows.forEach((x,i)=>{const key=x.id&&windows.has(x.id)?x.id:id+':'+i;windows.set(key,{...x,id:key,updatedAt:time,deletedAt:0});});p.availability=[...windows.values()];
 }else if(a.type==='planning-preparation'){
  if(a.basis!==planningFingerprint(state))bad('Your exams or available time changed. Refresh the preview.');
  if(a.draft.windows){if(!Array.isArray(a.draft.windows)||a.draft.windows.length>50)bad('Choose up to 50 study windows.');p.settings=planningSettings({...p.settings,...a.draft.settings,updatedAt:time});const old=new Map(p.availability.map(w=>[w.id,{...w,updatedAt:time,deletedAt:time}]));a.draft.windows.forEach((w,i)=>{const key=w.id&&old.has(w.id)?w.id:a.draftId+':w'+i;old.set(key,{...w,id:key,updatedAt:time,deletedAt:0});});p.availability=[...old.values()];}
  createExamPreparation(state,a.draft,{id:a.draftId,now,time});
  validatePlanning(p);
  if(a.apply){if(!Number.isSafeInteger(a.at)||now-a.at>15*60000||a.at>now)bad('This preview expired. Preview again.');apply(generateStudySchedule(state,a.recipe,a.at));}
 }else if(a.type==='planning-prep-omit'){
  const rule=p.rules.find(r=>r.id===a.taskId&&!r.deletedAt);if(!rule?.prep||rule.prep.stage==='learn'||typeof a.omitted!=='boolean')bad('Choose an optional review or practice activity.');
  const affected=new Set([rule.id]);let changed=true;while(changed){changed=false;for(const r of live(p.rules))if(r.prep&&r.dependsOn.some(id=>affected.has(id))&&!affected.has(r.id)){affected.add(r.id);changed=true;}}
  if(live(p.blocks).some(b=>affected.has(b.taskId)&&b.status==='planned'&&(b.locked||state.timer?.planningBlockId===b.id&&['running','paused','review'].includes(state.timer.status))))bad('Unlock or finish these activities before changing the review scope.');
  for(const r of p.rules)if(affected.has(r.id)){r.prep.omitted=a.omitted;r.updatedAt=time;}
  if(a.omitted)for(const b of p.blocks)if(affected.has(b.taskId)&&b.status==='planned'&&b.startAt>=now){b.updatedAt=b.deletedAt=time;}
 }else if(a.type==='planning-prep-topic'){
  const e=live(p.examPlans).find(e=>e.id===a.itemId),topic=e?.topics.find(t=>t.id===a.topicId&&!t.deletedAt);if(!topic)bad('This topic changed. Reopen the plan.');topic.confidence=a.confidence;topic.updatedAt=time;e.updatedAt=time;
  if(a.confidence==='new'&&!topic.learnTaskId){const taskId=topic.id+':learn';if(w.tasks.some(t=>t.id===taskId))bad('This study activity changed. Reopen the plan.');const task={id:taskId,title:topic.title,subject:w.exams.find(x=>x.id===e.examId)?.subject||'',estimateMinutes:topic.minutes,plannedDate:'',dueDate:'',priority:'normal',done:false,updatedAt:time,deletedAt:0};w.tasks.push(task);recordTask(state,task,now,taskId);topic.learnTaskId=taskId;p.rules.push({id:taskId,goalId:e.id,remainingMinutes:topic.minutes,earliestDate:'',dependsOn:[],sourcePlanId:topic.sourcePlanId,sourceChapterId:topic.sourceChapterId,prep:{topicId:topic.id,stage:'learn',round:0,gapDays:0,whole:false,omitted:false},updatedAt:time,deletedAt:0});for(const r of live(p.rules))if(r.goalId===e.id&&r.prep?.topicId===topic.id&&r.prep.stage==='review'&&r.prep.round===1){r.dependsOn=[...new Set([...r.dependsOn,taskId])];r.prep.gapDays=e.gapDays;r.updatedAt=time;}}
 }else if(a.type==='planning-goal'){const prep=preparationFor(state,a.itemId);if(prep&&a.examId!==prep.examId)bad('This preparation keeps its linked exam. Edit the exam from Exam countdown.');upsert('goals',{title:a.title,subject:a.subject||'',deadline:a.deadline,kind:a.kind||'custom',examId:a.examId||''});}
 else if(a.type==='planning-task'){
  saveTask(a);
 }else if(a.type==='planning-session'){
  const b=a.itemId?live(p.blocks).find(b=>b.id===a.itemId):null;
  if(a.itemId&&!b)bad('This session was removed.');if(b)editablePlanningBlock(state,b);
  let task=live(w.tasks).find(t=>t.id===(b?.taskId||a.taskId));
  if((b||a.taskId)&&!task)bad('Choose a current task.');
  if(!task){if(typeof a.title!=='string'||!a.title.trim()||a.title.length>140||typeof a.subject!=='string'||a.subject.length>40)bad('Check the task title and subject.');task=saveTask({title:a.title.trim(),subject:a.subject,remainingMinutes:(a.endAt-a.startAt)/60000,goalId:a.goalId||''});}
  else if(b&&a.title!==undefined){const r=live(p.rules).find(r=>r.id===task.id);saveTask({taskId:task.id,title:a.title,subject:a.subject,dueDate:task.dueDate,priority:task.priority,goalId:r?.goalId||'',remainingMinutes:r?.remainingMinutes??task.estimateMinutes,earliestDate:r?.earliestDate||'',dependsOn:r?.dependsOn||[],sourcePlanId:r?.sourcePlanId||'',sourceChapterId:r?.sourceChapterId||''});}
  if(!b||a.startAt!==b.startAt||a.endAt!==b.endAt)checkManualSession(state,{taskId:task.id,startAt:a.startAt,endAt:a.endAt,itemId:b?.id},now);
  if(b){if(a.startAt!==b.startAt||a.endAt!==b.endAt){b.startAt=a.startAt;b.endAt=a.endAt;b.locked=true;b.source='manual';}b.updatedAt=time;}
  else p.blocks.push({id:id+':slot',taskId:task.id,startAt:a.startAt,endAt:a.endAt,locked:true,source:'manual',status:'planned',updatedAt:time,deletedAt:0});
 }else if(a.type==='planning-exception')upsert('exceptions',{date:a.date,kind:a.kind,start:a.start,end:a.end});
 else if(a.type==='planning-delete'){
  if(!['goals','exceptions'].includes(a.collection))bad('Choose a supported plan item.');const row=live(p[a.collection]).find(x=>x.id===a.itemId);if(!row)bad('This item was removed.');row.updatedAt=row.deletedAt=time;
 }else if(a.type==='planning-apply'){
  if(a.fingerprint!==planningFingerprint(state))bad('Tasks, availability or records changed. Generate a fresh preview.');
  if(!Number.isSafeInteger(a.at)||a.at>now||now-a.at>15*60000)bad('This preview expired. Generate it again.');
  let restChange=null;if(a.restDate){if(!planningDate(a.restDate)||a.restDate<zonedDay(now,p.settings.zone))bad('Choose today or a future rest day.');const existing=live(p.exceptions).find(e=>e.date===a.restDate&&e.kind==='off');if(!existing){const exception={id:id+':rest',date:a.restDate,kind:'off',start:0,end:1440,updatedAt:time,deletedAt:0};p.exceptions.push(exception);restChange={id:exception.id,previous:null};}}
  apply(generateStudySchedule(state,a.recipe,a.at),restChange);
 }else if(a.type==='planning-apply-weekly'){
  const review=w.learning.reviews.find(r=>!r.deletedAt&&r.snapshot?.aiWeek?.id===a.reportId),ai=review?.snapshot?.aiWeek;
  if(ai?.version!==2||!ai.facts.detail.planning.candidate)bad('Choose a saved detailed report with a proposed schedule.');
  if(w.learning.events.some(e=>e.kind==='ai-plan'&&e.reportId===a.reportId))bad('This report schedule was already added. Generate a new report after reviewing your plan.');
  const saved=ai.facts.detail.planning;
  if(saved.basis!==planningFingerprint(state))bad('Your tasks, available time or plan changed. Generate an updated report before adding its schedule.');
  const checked=detailedPlanning(state,{at:saved.at}),candidate=checked.facts.candidate;
  if(!candidate||JSON.stringify(candidate)!==JSON.stringify(saved.candidate))bad('This schedule can no longer be reproduced. Generate an updated report.');
  if(checked.schedule.blocks.some(b=>b.startAt<now))bad('A proposed time has passed. Generate an updated report.');
  apply(checked.schedule);
  const adoptionId=id+':ai-plan';p.undo.aiAdoptionId=adoptionId;
  w.learning.events.push({id:adoptionId,kind:'ai-plan',at:now,order:0,reportId:a.reportId,links:[...new Set(checked.schedule.blocks.map(b=>b.taskId))].map(taskId=>({taskId}))});
 }else if(a.type==='planning-undo'){
  const u=p.undo;if(!u||u.revision!==p.revision)bad('The plan changed after this generation. Undo is no longer available.');
  const active=state.timer?.planningBlockId;if(active&&u.afterIds.includes(active))bad('Finish the linked timer before undoing its plan.');
  if(u.aiAdoptionId)w.learning.events.push({id:id+':ai-undo',kind:'ai-plan-undone',at:now,order:0,adoptionId:u.aiAdoptionId});
  p.blocks=p.blocks.map(b=>u.afterIds.includes(b.id)?{...b,updatedAt:time,deletedAt:time}:b);for(const row of u.before){const old=p.blocks.find(x=>x.id===row.id);if(old)Object.assign(old,row,{updatedAt:time});}if(u.restChange){const e=p.exceptions.find(e=>e.id===u.restChange.id);if(e)Object.assign(e,u.restChange.previous||{deletedAt:time},{updatedAt:time});markApplied();}p.undo=null;
 }else if(a.type==='planning-block'){
  const b=live(p.blocks).find(b=>b.id===a.itemId);if(!b)bad('This session was removed.');
  if(state.timer?.planningBlockId===b.id&&['running','paused','review'].includes(state.timer.status))bad('Finish or reset this timer before changing its session.');
  if(b.status==='planned'&&(state.sessions||[]).some(s=>s.planningBlockId===b.id&&s.durationSeconds>0))bad('Save the remaining-work feedback before changing this session.');
  if(a.locked!==undefined){if(typeof a.locked!=='boolean')bad('Invalid lock.');b.locked=a.locked;}
  if(a.startAt!==undefined){checkManualSession(state,{taskId:b.taskId,startAt:a.startAt,endAt:a.endAt,itemId:b.id},now);b.startAt=a.startAt;b.endAt=a.endAt;b.locked=true;b.source='manual';}
  if(a.status==='skipped')b.status='skipped';b.updatedAt=time;
 }else if(a.type==='planning-feedback'){
  const task=live(w.tasks).find(t=>t.id===a.taskId);if(!task)bad('This task was removed.');
  let rule=p.rules.find(r=>r.id===task.id);if(!rule){rule={id:task.id,goalId:'',remainingMinutes:task.estimateMinutes||null,earliestDate:'',dependsOn:[],sourcePlanId:'',sourceChapterId:'',updatedAt:time,deletedAt:0};p.rules.push(rule);}
  const block=a.blockId?live(p.blocks).find(b=>b.id===a.blockId&&b.taskId===task.id):null;
  if(a.blockId&&!block)bad('This planned session changed.');
  if(block&&state.timer?.planningBlockId===block.id&&['running','paused','review'].includes(state.timer.status))bad('Finish or reset the timer before checking out.');
  rule.remainingMinutes=a.done?0:a.remainingMinutes;rule.updatedAt=time;task.done=!!a.done;task.updatedAt=time;recordTask(state,task,now,id);
  if(block){block.status='reviewed';block.updatedAt=time;}
  p.feedback.push({id,taskId:task.id,blockId:block?.id||'',remainingMinutes:rule.remainingMinutes,done:task.done,updatedAt:time,deletedAt:0});
 }else bad('Unknown planning operation.');
 p.revision++;if(!['planning-apply','planning-apply-weekly','planning-undo','planning-preparation'].includes(a.type))p.undo=null;state.workspace.planning=validatePlanning(p);
}
