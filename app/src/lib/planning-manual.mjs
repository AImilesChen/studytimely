import {planningCapacity,planningTaskDeadline,taskRemaining} from './planning-engine.mjs';
import {zonedDay} from './study-analysis.mjs';
import {preparationFor,preparationExam,preparationEarliest} from './exam-preparation.mjs';

const live=xs=>(xs||[]).filter(x=>!x.deletedAt);
const bad=message=>{throw Error(message);};

export function editablePlanningBlock(state,block){
 if(!block||block.status!=='planned')bad('Choose a current planned session.');
 if(state.timer?.planningBlockId===block.id&&['running','paused','review'].includes(state.timer.status))bad('Finish or reset this timer before changing its session.');
 if((state.sessions||[]).some(s=>s.planningBlockId===block.id&&s.durationSeconds>0))bad('Save the remaining-work feedback before changing this session.');
}

// Shared by direct calendar creation and movement. This never writes study time.
export function checkManualSession(state,{taskId,startAt,endAt,itemId},now){
 const p=state.workspace.planning,task=live(state.workspace.tasks).find(t=>t.id===taskId),rule=live(p.rules).find(r=>r.id===taskId);
 if(!task||task.done)bad('Choose an unfinished task.');
 const prep=preparationFor(state,rule?.goalId);
 if(rule?.prep?.omitted||prep&&!preparationExam(state,prep))bad('This preparation is paused or the activity was left out.');
 if(!Number.isSafeInteger(startAt)||!Number.isSafeInteger(endAt)||startAt<now||endAt<=startAt||(endAt-startAt)%60000)bad('Choose a future session with a whole-minute duration.');
 const date=zonedDay(startAt,p.settings.zone),others=live(p.blocks).filter(b=>b.id!==itemId&&b.status==='planned'),length=(endAt-startAt)/60000;
 if(endAt>planningTaskDeadline(task,rule,p,state))bad('This session ends after its deadline.');
 if(rule?.earliestDate&&date<rule.earliestDate)bad('This is before the task start date.');
 if(others.some(b=>startAt<b.endAt&&endAt>b.startAt))bad('This time overlaps another planned session.');
 const remaining=taskRemaining(task,rule),reserved=others.filter(b=>b.taskId===taskId&&b.endAt>now).reduce((n,b)=>n+Math.max(0,b.endAt-Math.max(now,b.startAt))/60000,0);
 if(remaining===null)bad('Set this task’s remaining-time estimate first.');
 if(length+reserved>remaining+.001)bad('This exceeds the task’s unarranged work. Shorten the session or edit its remaining work.');
 const capacity=planningCapacity(state,{start:date,days:1,now,keep:others}),day=capacity.days[0];
 const windows=day.continuous||[];
 if(!windows.some(w=>startAt>=w.startAt&&endAt<=w.endAt))bad('Choose a time inside an available focus window, clear of commitments and rest.');
 if(!rule?.prep?.whole&&length>p.settings.focusMinutes)bad('Keep this session within your preferred focus length, or update Available time.');
 if(p.settings.breakMinutes>0){
  const run=[...others.map(b=>({...b,selected:false})),{startAt,endAt,selected:true}].sort((a,b)=>a.startAt-b.startAt);let group=[];
  const check=()=>{if(group.some(b=>b.selected)&&group.length>1&&(rule?.prep?.whole||group.reduce((n,b)=>n+(b.endAt-b.startAt)/60000,0)>p.settings.focusMinutes))bad('Leave your configured break between focus sessions.');};
  for(const b of run){if(group.length&&b.startAt-group.at(-1).endAt>=p.settings.breakMinutes*60000){check();group=[];}group.push(b);}check();
 }
 const daily=others.reduce((n,b)=>n+(zonedDay(b.startAt,p.settings.zone)===date?(b.endAt-b.startAt)/60000:0),0);
 if(daily+length>p.settings.maxDailyMinutes)bad('This exceeds your daily focused limit.');
 const tasks=new Map(live(state.workspace.tasks).map(t=>[t.id,t])),finished=new Map();
 for(const dep of rule?.dependsOn||[]){
  const t=tasks.get(dep);if(!t)bad('A prerequisite task was removed.');
  if(!t.done){const r=live(p.rules).find(r=>r.id===dep),need=taskRemaining(t,r),slots=others.filter(b=>b.taskId===dep&&b.endAt<=startAt&&b.endAt>now);if(!need||slots.reduce((n,b)=>n+(b.endAt-Math.max(now,b.startAt))/60000,0)<need)bad('Schedule or complete the prerequisite first.');}
  finished.set(dep,Math.max(0,...others.filter(b=>b.taskId===dep&&b.endAt<=startAt).map(b=>b.endAt)));
 }
 if(rule?.prep?.whole&&length!==remaining)bad('Keep the timed paper in one continuous session matching its remaining work.');
 if(startAt<preparationEarliest(state,rule,finished,tasks,now))bad('Keep the review interval after its prerequisite.');
 // Moving a prerequisite must not leave an already arranged review before it.
 const proposed=[...others,{taskId,startAt,endAt}];
 for(const dependent of live(p.rules).filter(r=>r.dependsOn.includes(taskId))){
  for(const b of others.filter(b=>b.taskId===dependent.id&&b.startAt>=now)){
   const before=proposed.filter(x=>x.taskId===taskId&&x.endAt<=b.startAt&&x.endAt>now),total=before.reduce((n,x)=>n+(x.endAt-Math.max(now,x.startAt))/60000,0);
   if(!task.done&&total<remaining)bad('This would move a prerequisite after an arranged review. Adjust that review first.');
   const ends=new Map([[taskId,Math.max(0,...before.map(x=>x.endAt))]]);
   if(dependent.prep&&b.startAt<preparationEarliest(state,dependent,ends,tasks,now))bad('This would shorten an arranged review interval. Adjust that review first.');
  }
 }
 return {task,rule};
}
