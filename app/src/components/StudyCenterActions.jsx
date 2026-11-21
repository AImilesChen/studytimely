import {useEffect,useRef,useState} from 'react';
import {plannerDate,comparePlannerTasks} from '../lib/planner.mjs';
import {trackerDuration as duration} from '../lib/tracker.mjs';

export function DailyGoal({store,ready,minutes,seconds}){
 const [editing,setEditing]=useState(false),[busy,setBusy]=useState(false),[issue,setIssue]=useState(''),[notice,setNotice]=useState('');
 const trigger=useRef(null),saving=useRef(false);
 useEffect(()=>{if(!editing&&!busy&&notice)trigger.current?.focus();},[editing,busy,notice]);
 async function save(e){
  e.preventDefault();if(saving.current||!ready||store.hasPending)return;
  const value=Number(new FormData(e.currentTarget).get('minutes'));
  saving.current=true;setBusy(true);setIssue('');setNotice('');
  try{const result=await store.command('goal',{minutes:value});if(!result)throw Error('Your goal was not saved. Check the storage message and try again.');setEditing(false);setNotice(value?'Daily goal saved. Only saved study time counts.':'Daily goal removed. Your study records are kept.');trigger.current?.focus();}
  catch(e){setIssue(e.message||'Your goal could not be saved. Try again.');}
  finally{saving.current=false;setBusy(false);}
 }
 return <div className="sc-goal"><span>Daily goal</span><div className="sc-goal-value"><strong>{!ready?'—':minutes?`${Math.floor(seconds/60)} / ${minutes} min`:'Not set'}</strong><button ref={trigger} className="button" disabled={!ready||busy} aria-expanded={editing} onClick={()=>{setEditing(v=>!v);setNotice('');setIssue('');}}>{minutes?'Edit goal':'Set goal'}</button></div>{ready&&minutes>0&&<progress aria-label="Daily saved learning goal" max={minutes*60} value={Math.min(seconds,minutes*60)}/>}{editing&&<form className="sc-goal-form" onSubmit={save}><label className="field">Minutes per day<input name="minutes" type="number" min="0" max="1440" step="1" required defaultValue={minutes||30} disabled={busy} autoFocus/></label><small>Use 0 to remove the goal.</small><div className="sc-form-actions"><button className="button primary" disabled={busy||store.hasPending}>{busy?'Saving…':'Save goal'}</button><button type="button" className="button" disabled={busy} onClick={()=>{setEditing(false);setIssue('');trigger.current?.focus();}}>Cancel</button></div>{issue&&<p className="field-error" role="alert">{issue}</p>}</form>}{notice&&<p className="sc-action-feedback" role="status">{notice}</p>}</div>;
}

export function TodayTasks({store,ready,today,report,onStart,navigate,timerAction}){
 const [showAll,setShowAll]=useState(false);
 const tasks=showAll?(store.data.workspace?.tasks||[]).filter(t=>!t.deletedAt&&!t.done).sort(comparePlannerTasks).map(task=>({task,reason:task.plannedDate?'Planned '+plannerDate(task.plannedDate):'No study date'})):report?.nextTasks.slice(0,3)||[];
 const [adding,setAdding]=useState(false),[moving,setMoving]=useState(null),[busy,setBusy]=useState(false),[feedback,setFeedback]=useState(null);
 const saving=useRef(false),title=useRef(null),addButton=useRef(null);
 useEffect(()=>{if(!busy&&feedback?.target==='new'&&!feedback.error)addButton.current?.focus();},[busy,feedback]);
 async function run(operation,success,target){
  if(saving.current||!ready||store.hasPending)return false;
  saving.current=true;setBusy(true);setFeedback(null);
  try{const result=await operation();if(!result)throw Error('Not saved. Check the storage message and try again.');setFeedback({text:success,target,error:false});return true;}
  catch(e){setFeedback({text:e.message||'Not saved. Your other records are unchanged.',target,error:true});return false;}
  finally{saving.current=false;setBusy(false);}
 }
 async function create(e){
  e.preventDefault();const form=e.currentTarget,f=new FormData(form);
  const result=await run(()=>store.command('task-save',{title:String(f.get('title')||'').trim(),subject:String(f.get('subject')||'').trim(),estimateMinutes:Number(f.get('minutes')||0),plannedDate:today,dueDate:'',priority:'normal',done:false}),'Task added to today. Choose Start this task when you are ready.','new');
  if(result){form.reset();setAdding(false);setShowAll(false);addButton.current?.focus();}
 }
 async function update(task,patch){
  const result=await run(async()=>{const snapshot=await store.getSnapshot(),latest=snapshot.workspace.tasks.find(t=>t.id===task.id&&!t.deletedAt);if(!latest||latest.updatedAt!==task.updatedAt)throw Error('This task changed. Open all tasks to review its latest details.');return store.command('task-save',{...latest,...patch,itemId:task.id,expectedUpdatedAt:task.updatedAt});},patch.done?'Task completed. Saved study time is unchanged.':'Study date saved. The original deadline is unchanged.',task.id);
  if(result)setMoving(null);
 }
 const feedbackFor=target=>feedback?.target===target&&<p className={feedback.error?'field-error sc-action-feedback':'sc-action-feedback'} role={feedback.error?'alert':'status'}>{feedback.text}</p>;
 const blocked=busy||!ready||store.hasPending;
 return <section className="sc-panel sc-today-tasks" aria-labelledby="sc-tasks-title"><div className="sc-section-heading"><div><h2 id="sc-tasks-title">What will you study today?</h2>{ready&&<p>{showAll?'All open tasks · future and unscheduled tasks included':report.todayTasks.length?`${report.completedTodayPlan} of ${report.todayTasks.length} tasks planned or due today completed`:'Choose one small thing to work on.'}</p>}</div><button className="button" disabled={!ready||busy} aria-pressed={showAll} onClick={()=>setShowAll(v=>!v)}>{showAll?'Today’s tasks':'All open tasks'}</button></div>
 {!ready?<p role="status">Loading this browser’s tasks…</p>:<>
 {tasks.length>0&&<div className="sc-task-list">{tasks.map(({task,reason})=><article className="sc-task" key={task.id}><span className="sc-kicker">{reason}{task.subject?' · '+task.subject:''}</span><h3>{task.title}</h3><p>{task.estimateMinutes?`${task.estimateMinutes} min planned`:'No time estimate'}{task.dueDate?' · Due '+plannerDate(task.dueDate):''}</p><div className="sc-task-actions"><button className="button primary" disabled={blocked} onClick={()=>onStart({taskId:task.id,mode:'study'})}>Start this task →</button><button className="button" disabled={blocked} onClick={()=>update(task,{done:true})}>Mark done</button><button className="button" disabled={blocked} aria-expanded={moving?.id===task.id} onClick={()=>setMoving(moving?.id===task.id?null:task)}>Change date</button></div>{moving?.id===task.id&&<form className="sc-reschedule" onSubmit={e=>{e.preventDefault();update(task,{plannedDate:String(new FormData(e.currentTarget).get('plannedDate')||'')});}}><label className="field">Study date<input type="date" name="plannedDate" required defaultValue={task.plannedDate||today} disabled={busy}/></label><button className="button primary" disabled={blocked}>Save date</button><button type="button" className="button" disabled={busy} onClick={()=>setMoving(null)}>Cancel</button></form>}{feedbackFor(task.id)}</article>)}</div>}
 {feedback&&!['new',...tasks.map(x=>x.task.id)].includes(feedback.target)&&feedbackFor(feedback.target)}
 {(!tasks.length||adding)?<form className="sc-quick-task" onSubmit={create} aria-label="Add a task for today"><label className="field sc-quick-title">Today’s study task<input ref={title} name="title" required maxLength={140} placeholder="e.g. Practise 10 algebra questions" disabled={busy}/></label><div className="sc-quick-details"><label className="field">Subject (optional)<input name="subject" maxLength={40} placeholder="e.g. Maths" disabled={busy}/></label><label className="field">Planned minutes (optional)<input name="minutes" type="number" min="0" max="10080" step="1" placeholder="25" disabled={busy}/></label></div><div className="sc-form-actions"><button className="button primary" disabled={blocked}>{busy?'Saving…':'Add to today'}</button>{tasks.length>0&&<button className="button" type="button" disabled={busy} onClick={()=>{setAdding(false);addButton.current?.focus();}}>Cancel</button>}</div><p className="sc-help">Planned for {plannerDate(today)}. No deadline set. Completing a task does not add study minutes.</p></form>:<button ref={addButton} className="button sc-add-task" disabled={blocked} onClick={()=>{setAdding(true);setTimeout(()=>title.current?.focus(),0);}}>+ Add a task for today</button>}
 {feedbackFor('new')}
 {timerAction&&<div className="sc-start-row"><p>A task is optional. You can also study at your own pace.</p>{timerAction}</div>}
 </>}
 </section>;
}

export function SavedTrend({ready,recent,today,navigate,onReport}){
 return <section className="sc-panel sc-trend">
  <div className="sc-section-heading"><h2>Your last seven days</h2>{onReport?<button className="button" onClick={onReport}>View progress</button>:<a className="button" href="/study-tracker" onClick={navigate}>Full report →</a>}</div>
  {!ready?<p role="status">Loading saved learning…</p>:<>
   <div className="sc-trend-total"><strong>{duration(recent.total)}</strong><span>saved learning · local dates</span></div>
   {recent.total>0?<div className="sc-bars" aria-label="Saved learning by local date">{recent.series.map(d=><div key={d.date} className={'sc-bar-day'+(d.date===today?' sc-bar-today':'')}><strong>{duration(d.seconds)}</strong><span className="sc-bar-track" aria-hidden="true"><span style={{height:`${d.seconds/Math.max(...recent.series.map(x=>x.seconds))*100}%`}}/></span><span>{plannerDate(d.date,{weekday:'short'})}{d.date===today?' · Today':''}</span></div>)}</div>:<div className="sc-zero-trend"><p>No saved study sessions in these seven days.</p><p>Save your first session from a Study, Focus or Pomodoro timer to see your progress here.</p></div>}
   <p className="sc-help">Only saved study intervals count. Pauses and breaks are excluded.</p>
  </>}
 </section>;
}
