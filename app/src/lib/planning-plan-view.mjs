import {taskRemaining} from './planning-engine.mjs';
import {preparationFor,preparationExam,preparationDeadline} from './exam-preparation.mjs';
const live=rows=>(rows||[]).filter(row=>!row.deletedAt);

export function studyPlanSummaries(data){
 const p=data.workspace.planning,rules=new Map(live(p.rules).map(r=>[r.id,r])),counts=new Map();
 for(const t of live(data.workspace.tasks)){const rule=rules.get(t.id),id=rule?.goalId;if(!id||rule.prep?.omitted)continue;const c=counts.get(id)||{total:0,done:0};c.total++;if(t.done)c.done++;counts.set(id,c);}
 return live(p.goals).map(goal=>({goal,...(counts.get(goal.id)||{total:0,done:0})}));
}

// One source for the plan list, summary, next action and task rows.
export function studyTaskRows(data,now,simulations={}){
 const p=data.workspace.planning;
 const rules=new Map(live(p.rules).map(r=>[r.id,r])),blocks=new Map(),activeIds=new Set(),feedbackIds=new Set();
 for(const b of live(p.blocks)){if(b.status!=='planned')continue;const list=blocks.get(b.taskId)||[];list.push(b);blocks.set(b.taskId,list);}
 for(const list of blocks.values())list.sort((a,b)=>a.startAt-b.startAt);
 if(data.timer?.planningBlockId&&['running','paused','review'].includes(data.timer.status))activeIds.add(data.timer.planningBlockId);
 for(const [id,s] of Object.entries(simulations)){if(s.status==='running')activeIds.add(id);if(s.status==='finished')feedbackIds.add(id);}
 for(const s of data.sessions||[])if(s.planningBlockId&&s.durationSeconds>0)feedbackIds.add(s.planningBlockId);
 return live(data.workspace.tasks).map(task=>{
  const omitted=rules.get(task.id)?.prep?.omitted,sessions=omitted?[]:blocks.get(task.id)||[];
  const active=sessions.find(b=>activeIds.has(b.id)),feedback=sessions.find(b=>feedbackIds.has(b.id)),upcoming=sessions.filter(b=>b.endAt>now),next=active||feedback||upcoming[0]||null;
  const state=omitted?'omitted':task.done?'complete':active?'active':feedback?'feedback':upcoming.length?'scheduled':sessions.length?'replan':'unscheduled';
  const rule=rules.get(task.id),prep=preparationFor(data,rule?.goalId),paused=!!rule?.prep&&(!preparationExam(data,prep)||preparationDeadline(data,prep)<=now);
   return{task,goalId:rule?.goalId||'',prep:rule?.prep,paused,remaining:taskRemaining(task,rule),state,next,upcoming,missed:sessions.filter(b=>b.endAt<=now&&!activeIds.has(b.id)&&!feedbackIds.has(b.id))};
 });
}
export function studyPlanDetail(data,selectedId,now,simulations={}){
 const p=data.workspace.planning,goals=live(p.goals),goal=goals.find(g=>g.id===selectedId)||goals[0];if(!goal)return null;
 const rows=studyTaskRows(data,now,simulations).filter(r=>r.goalId===goal.id);
 const done=rows.filter(r=>r.state!=='omitted'&&r.task.done).length,unknown=rows.filter(r=>r.remaining===null).length,remaining=rows.reduce((n,r)=>n+(r.remaining||0),0),upcoming=rows.filter(r=>!r.task.done).flatMap(r=>r.upcoming).sort((a,b)=>a.startAt-b.startAt);
 const nextRow=rows.find(r=>r.state==='active')||rows.find(r=>r.state==='feedback')||rows.filter(r=>!r.task.done&&r.next).sort((a,b)=>a.next.startAt-b.next.startAt)[0]||null;
 return{goal,rows,activeTotal:rows.filter(r=>r.state!=='omitted').length,done,unknown,remaining,upcoming,nextRow,planned:upcoming.reduce((n,b)=>n+(b.endAt-b.startAt)/60000,0),complete:rows.some(r=>r.state!=='omitted')&&rows.filter(r=>r.state!=='omitted').length===done};
}

// Group display only: canonical tasks, preparation links and arrangements are untouched.
export function studyTaskGroups(rows,prep=null,{includeEmpty=true}={}){
 const groups=new Map(),topics=new Map(live(prep?.topics).map(t=>[t.id,t]));
 if(includeEmpty)for(const topic of topics.values())groups.set('topic:'+topic.id,{id:'topic:'+topic.id,title:topic.title,topic,kind:'study',rows:[]});
 for(const row of rows){
  const topic=topics.get(row.prep?.topicId),practice=['mock','reflect'].includes(row.prep?.stage);
  const id=topic?'topic:'+topic.id:practice?'practice':'task:'+row.task.id;
  if(!groups.has(id))groups.set(id,{id,title:topic?.title||(practice?'Mock exam & corrections':row.task.title),topic,kind:practice?'mock':'study',rows:[]});
  groups.get(id).rows.push(row);
 }
 return [...groups.values()].map(group=>{
  const rows=group.rows,active=rows.filter(r=>r.state!=='omitted'),done=active.filter(r=>r.task.done).length;
  const nextRow=active.find(r=>r.state==='active')||active.find(r=>r.state==='feedback')||active.filter(r=>!r.task.done&&r.next).sort((a,b)=>a.next.startAt-b.next.startAt)[0]||null;
  return {...group,total:active.length,done,remaining:active.reduce((n,r)=>n+(r.remaining||0),0),unknown:active.some(r=>r.remaining===null),complete:active.length>0&&done===active.length,nextRow,editRow:nextRow||active.find(r=>!r.task.done)||rows[0]||null};
 });
}
