import {validatePlanning,planningSettings} from './planning-schema.mjs';
import {generateStudySchedule,planningFingerprint,planningCapacity,planningTaskDeadline,wallWindow} from './planning-engine.mjs';
import {zonedDay} from './study-analysis.mjs';
import {recordTask} from './learning-history.mjs';
const bad=m=>{throw Error(m);},live=xs=>xs.filter(x=>!x.deletedAt);
export function planningAction(state,a,{id,now}){
 const p=state.workspace.planning=validatePlanning(state.workspace.planning),w=state.workspace;
 if(a.expectedRevision!==p.revision)bad('Your plan changed. Reopen it before saving.');
 const time=Math.max(now,...[p.settings.updatedAt,...p.goals.map(x=>x.updatedAt),...p.rules.map(x=>x.updatedAt),...p.blocks.map(x=>x.updatedAt)])+1;
 const upsert=(key,fields,itemId=a.itemId)=>{const old=itemId?p[key].find(x=>x.id===itemId&&!x.deletedAt):null;if(itemId&&!old)bad('This plan item was removed.');const entry={...old,...fields,id:old?.id||id,updatedAt:time,deletedAt:0};p[key]=old?p[key].map(x=>x.id===old.id?entry:x):[...p[key],entry];return entry;};
 if(a.type==='planning-settings'){
  p.settings=planningSettings({...a.settings,updatedAt:time});
  if(!Array.isArray(a.windows)||a.windows.length>50)bad('Choose up to 50 weekly study windows.');
  const windows=new Map(p.availability.map(x=>[x.id,{...x,updatedAt:time,deletedAt:time}]));a.windows.forEach((x,i)=>{const key=x.id&&windows.has(x.id)?x.id:id+':'+i;windows.set(key,{...x,id:key,updatedAt:time,deletedAt:0});});p.availability=[...windows.values()];
 }else if(a.type==='planning-goal')upsert('goals',{title:a.title,subject:a.subject||'',deadline:a.deadline,kind:a.kind||'custom',examId:a.examId||''});
 else if(a.type==='planning-task'){
  let task=a.taskId?live(w.tasks).find(t=>t.id===a.taskId):null;
  if(!task&&a.sourceChapterId){const r=live(p.rules).find(r=>r.sourcePlanId===a.sourcePlanId&&r.sourceChapterId===a.sourceChapterId);if(r)task=live(w.tasks).find(t=>t.id===r.id);}
  if(a.sourceChapterId&&!live(w.plans).find(x=>x.id===a.sourcePlanId)?.chapters.some(c=>c.id===a.sourceChapterId&&!c.deletedAt))bad('This syllabus topic changed.');
  if(a.taskId&&!task)bad('Choose a current task.');
  if(a.type==='planning-task'&&a.remainingMinutes!==null&&(!Number.isSafeInteger(a.remainingMinutes)||a.remainingMinutes<0||a.remainingMinutes>10080))bad('Enter a valid remaining-time estimate.');
  if(a.goalId&&!live(p.goals).some(g=>g.id===a.goalId))bad('Choose a current goal.');
  if(!task){task={id:id+':task',title:a.title,subject:a.subject||'',estimateMinutes:a.remainingMinutes||0,plannedDate:'',dueDate:a.dueDate||'',priority:a.priority||'normal',done:false,updatedAt:time,deletedAt:0};w.tasks.push(task);recordTask(state,task,now,id);}
  else if(a.title!==undefined){if(typeof a.title!=='string'||!a.title.trim()||a.title.length>140||typeof a.subject!=='string'||a.subject.length>40)bad('Check the task title and subject.');task.title=a.title.trim();task.subject=a.subject;task.updatedAt=time;if(a.dueDate!==undefined)task.dueDate=a.dueDate;if(a.priority!==undefined)task.priority=a.priority;recordTask(state,task,now,id);}
  const old=p.rules.find(r=>r.id===task.id);const rule={...old,id:task.id,goalId:a.goalId||'',remainingMinutes:a.remainingMinutes,earliestDate:a.earliestDate||'',dependsOn:a.dependsOn||[],sourcePlanId:a.sourcePlanId||old?.sourcePlanId||'',sourceChapterId:a.sourceChapterId||old?.sourceChapterId||'',updatedAt:time,deletedAt:0};p.rules=old?p.rules.map(r=>r.id===task.id?rule:r):[...p.rules,rule];
 }else if(a.type==='planning-exception')upsert('exceptions',{date:a.date,kind:a.kind,start:a.start,end:a.end});
 else if(a.type==='planning-delete'){
  if(!['goals','exceptions'].includes(a.collection))bad('Choose a supported plan item.');const row=live(p[a.collection]).find(x=>x.id===a.itemId);if(!row)bad('This item was removed.');row.updatedAt=row.deletedAt=time;
 }else if(a.type==='planning-apply'){
  if(a.fingerprint!==planningFingerprint(state))bad('Tasks, availability or records changed. Generate a fresh preview.');
  if(!Number.isSafeInteger(a.at)||a.at>now||now-a.at>15*60000)bad('This preview expired. Generate it again.');
  const result=generateStudySchedule(state,a.recipe,a.at);if(result.blocks.some(b=>b.startAt<now))bad('A proposed time has passed. Generate again.');
  const before=p.blocks.filter(b=>result.replaceIds.includes(b.id)).map(b=>({...b}));p.blocks=p.blocks.map(b=>result.replaceIds.includes(b.id)?{...b,updatedAt:time,deletedAt:time}:b);
  const created=result.blocks.map((b,i)=>({...b,id:id+':'+i,source:'generated',locked:false,status:'planned',updatedAt:time,deletedAt:0}));p.blocks.push(...created);p.undo={id,at:now,revision:p.revision+1,before,afterIds:created.map(b=>b.id)};
 }else if(a.type==='planning-undo'){
  const u=p.undo;if(!u||u.revision!==p.revision)bad('The plan changed after this generation. Undo is no longer available.');
  const active=state.timer?.planningBlockId;if(active&&u.afterIds.includes(active))bad('Finish the linked timer before undoing its plan.');
  p.blocks=p.blocks.map(b=>u.afterIds.includes(b.id)?{...b,updatedAt:time,deletedAt:time}:b);for(const row of u.before){const old=p.blocks.find(x=>x.id===row.id);if(old)Object.assign(old,row,{updatedAt:time});}p.undo=null;
 }else if(a.type==='planning-block'){
  const b=live(p.blocks).find(b=>b.id===a.itemId);if(!b)bad('This session was removed.');
  if(state.timer?.planningBlockId===b.id&&['running','paused','review'].includes(state.timer.status))bad('Finish or reset this timer before changing its session.');
  if(a.locked!==undefined){if(typeof a.locked!=='boolean')bad('Invalid lock.');b.locked=a.locked;}
  if(a.startAt!==undefined){if(!Number.isSafeInteger(a.startAt)||!Number.isSafeInteger(a.endAt)||a.startAt<now||a.endAt<=a.startAt)bad('Choose a future session.');if(live(p.blocks).some(x=>x.id!==b.id&&x.status==='planned'&&a.startAt<x.endAt&&a.endAt>x.startAt))bad('This time overlaps another planned session.');const capacity=planningCapacity(state,{start:zonedDay(a.startAt,p.settings.zone),days:1,now,keep:live(p.blocks).filter(x=>x.id!==b.id&&x.status==='planned')});if(!capacity.days[0].slots.some(s=>a.startAt>=s.startAt&&a.endAt<=s.endAt))bad('Choose a time inside an available focus window, clear of commitments and rest.');const task=live(w.tasks).find(t=>t.id===b.taskId),rule=p.rules.find(r=>r.id===b.taskId),goal=live(p.goals).find(g=>g.id===rule?.goalId);if(a.endAt>planningTaskDeadline(task||{},rule,p,state))bad('This session ends after its deadline.');if(rule?.earliestDate&&zonedDay(a.startAt,p.settings.zone)<rule.earliestDate)bad('This is before the task start date.');for(const dep of rule?.dependsOn||[]){const t=live(w.tasks).find(t=>t.id===dep);if(!t)bad('A prerequisite task was removed.');if(!t.done){const r=p.rules.find(r=>r.id===dep),need=r?.remainingMinutes??t.estimateMinutes,slots=live(p.blocks).filter(x=>x.taskId===dep&&x.status==='planned'&&x.endAt<=a.startAt&&x.endAt>now);if(!need||slots.reduce((n,x)=>n+(x.endAt-Math.max(now,x.startAt))/60000,0)<need)bad('Schedule or complete the prerequisite first.');}}b.startAt=a.startAt;b.endAt=a.endAt;b.locked=true;b.source='manual';}
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
 p.revision++;if(a.type!=='planning-apply'&&a.type!=='planning-undo')p.undo=null;state.workspace.planning=validatePlanning(p);
}
