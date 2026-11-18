import {taskRemaining} from './planning-engine.mjs';
const live=rows=>(rows||[]).filter(row=>!row.deletedAt);

export function studyPlanSummaries(data){
 const p=data.workspace.planning,rules=new Map(live(p.rules).map(r=>[r.id,r.goalId])),counts=new Map();
 for(const t of live(data.workspace.tasks)){const id=rules.get(t.id);if(!id)continue;const c=counts.get(id)||{total:0,done:0};c.total++;if(t.done)c.done++;counts.set(id,c);}
 return live(p.goals).map(goal=>({goal,...(counts.get(goal.id)||{total:0,done:0})}));
}

// One source for the plan list, summary, next action and task rows.
export function studyPlanDetail(data,selectedId,now,simulations={}){
 const p=data.workspace.planning,goals=live(p.goals),goal=goals.find(g=>g.id===selectedId)||goals[0];
 if(!goal)return null;
 const rules=new Map(live(p.rules).map(r=>[r.id,r])),blocks=new Map(),activeIds=new Set(),feedbackIds=new Set();
 for(const b of live(p.blocks)){if(b.status!=='planned')continue;const list=blocks.get(b.taskId)||[];list.push(b);blocks.set(b.taskId,list);}
 for(const list of blocks.values())list.sort((a,b)=>a.startAt-b.startAt);
 if(data.timer?.planningBlockId&&['running','paused','review'].includes(data.timer.status))activeIds.add(data.timer.planningBlockId);
 for(const [id,s] of Object.entries(simulations)){if(s.status==='running')activeIds.add(id);if(s.status==='finished')feedbackIds.add(id);}
 for(const s of data.sessions||[])if(s.planningBlockId&&s.durationSeconds>0)feedbackIds.add(s.planningBlockId);
 const rows=live(data.workspace.tasks).filter(t=>rules.get(t.id)?.goalId===goal.id).map(task=>{
  const sessions=blocks.get(task.id)||[];
  const active=sessions.find(b=>activeIds.has(b.id)),feedback=sessions.find(b=>feedbackIds.has(b.id)),upcoming=sessions.filter(b=>b.endAt>now),next=active||feedback||upcoming[0]||null;
  const state=task.done?'complete':active?'active':feedback?'feedback':upcoming.length?'scheduled':sessions.length?'replan':'unscheduled';
  return{task,remaining:taskRemaining(task,rules.get(task.id)),state,next,upcoming};
 });
 const done=rows.filter(r=>r.task.done).length,unknown=rows.filter(r=>r.remaining===null).length,remaining=rows.reduce((n,r)=>n+(r.remaining||0),0),upcoming=rows.filter(r=>!r.task.done).flatMap(r=>r.upcoming).sort((a,b)=>a.startAt-b.startAt);
 const nextRow=rows.find(r=>r.state==='active')||rows.find(r=>r.state==='feedback')||rows.filter(r=>!r.task.done&&r.next).sort((a,b)=>a.next.startAt-b.next.startAt)[0]||null;
 return{goal,rows,done,unknown,remaining,upcoming,nextRow,planned:upcoming.reduce((n,b)=>n+(b.endAt-b.startAt)/60000,0),complete:rows.length>0&&done===rows.length};
}
