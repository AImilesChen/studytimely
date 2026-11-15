import {dailyTotals} from './model.mjs';

export function shiftPlannerDay(day,offset){const d=new Date(day+'T12:00:00');d.setDate(d.getDate()+offset);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function plannerWeek(day,offset=0){if(!day)return {start:'',end:'',days:[]};const d=new Date(day+'T12:00:00'),start=shiftPlannerDay(day,-((d.getDay()+6)%7)+offset*7);return {start,end:shiftPlannerDay(start,6),days:Array.from({length:7},(_,i)=>shiftPlannerDay(start,i))};}
export function plannerWeekOffset(today,day){return Math.round((Date.parse(plannerWeek(day).start+'T12:00:00Z')-Date.parse(plannerWeek(today).start+'T12:00:00Z'))/(7*86400000));}
export function plannerDate(day,options={}){if(!day)return '…';return new Intl.DateTimeFormat('en',{month:'short',day:'numeric',...options}).format(new Date(day+'T12:00:00'));}
export function comparePlannerTasks(a,b){const date=d=>d||'9999-99-99';return date(a.dueDate).localeCompare(date(b.dueDate))||({high:0,normal:1,low:2}[a.priority]-{high:0,normal:1,low:2}[b.priority])||date(a.plannedDate).localeCompare(date(b.plannedDate))||a.title.localeCompare(b.title)||a.id.localeCompare(b.id);}
export function plannerGroups(tasks,{view='day',today,selectedDate=today,week=plannerWeek(today),query='',subject=''}={}){
 if(!today)return [];
 const q=query.trim().toLowerCase(),items=tasks.filter(t=>!t.deletedAt&&(!q||[t.title,t.subject].some(v=>(v||'').toLowerCase().includes(q)))&&(!subject||t.subject===subject)).sort(comparePlannerTasks),open=items.filter(t=>!t.done),groups=[],seen=new Set();
 const add=(id,title,rows)=>{const fresh=rows.filter(t=>!seen.has(t.id));if(fresh.length){fresh.forEach(t=>seen.add(t.id));groups.push({id,title,tasks:fresh});}};
 if(view==='day'){
  if(selectedDate===today)add('overdue','Past due · choose a next step',open.filter(t=>t.dueDate&&t.dueDate<today));
  add('scheduled','Scheduled for '+plannerDate(selectedDate,{weekday:'long'}),open.filter(t=>t.plannedDate===selectedDate));
  add('due','Due '+(selectedDate===today?'today':plannerDate(selectedDate))+' · review your deadline',open.filter(t=>t.dueDate===selectedDate));
 }else if(view==='week'){
  for(const date of week.days)add(date,plannerDate(date,{weekday:'long'}),open.filter(t=>t.plannedDate===date));
  add('deadlines','Deadlines this week · no study date in this week',open.filter(t=>t.dueDate>=week.start&&t.dueDate<=week.end&&(!t.plannedDate||t.plannedDate<week.start||t.plannedDate>week.end)));
 }else if(view==='unscheduled')add('unscheduled','Unscheduled · choose a study date when ready',open.filter(t=>!t.plannedDate));
 else if(view==='overdue')add('overdue','Past due · original deadlines are kept',open.filter(t=>t.dueDate&&t.dueDate<today));
 else if(view==='completed')add('completed','Completed tasks',items.filter(t=>t.done));
 else add('all','All open tasks',open);
 return groups;
}
export function plannerOverview(tasks,sessions,today){
 const alive=tasks.filter(t=>!t.deletedAt),open=alive.filter(t=>!t.done),due=open.filter(t=>t.plannedDate===today||t.dueDate===today),recordedByTask={};
 for(const s of sessions)if(s.taskId)recordedByTask[s.taskId]=(recordedByTask[s.taskId]||0)+s.durationSeconds;
 return {todayCount:due.length,estimateMinutes:due.reduce((sum,t)=>sum+t.estimateMinutes,0),recordedSeconds:dailyTotals(sessions.filter(s=>s.taskId))[today]||0,overdueCount:open.filter(t=>t.dueDate&&t.dueDate<today).length,unscheduledCount:open.filter(t=>!t.plannedDate).length,completedCount:alive.filter(t=>t.done).length,recordedByTask};
}
export function plannerSaveView(task,today){return task.done?{view:'completed'}:task.plannedDate?{view:'day',selectedDate:task.plannedDate,offset:plannerWeekOffset(today,task.plannedDate)}:{view:'unscheduled'};}
