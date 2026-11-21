import {useRef,useState} from 'react';
import {alive} from '../lib/workspace.mjs';
import {plannerDate} from '../lib/planner.mjs';
import {sortedExams,examTiming} from '../lib/exams.mjs';
import {habitSummary,habitUnit,habitTargetMax} from '../lib/habits.mjs';
import {parseSyllabusOutline,materialiseOutline,syllabusLeaves,syllabusSummary} from '../lib/syllabus.mjs';

function useSave(store,ready){
 const [busy,setBusy]=useState(false),[feedback,setFeedback]=useState(null),saving=useRef(false);
 async function run(operation,message){
  if(saving.current||!ready||store.hasPending)return null;
  saving.current=true;setBusy(true);setFeedback(null);
  try{const result=await operation();if(!result)throw Error('Not saved. Check the storage message and try again.');setFeedback({message,error:false});return result;}
  catch(e){setFeedback({message:e.message||'Not saved. Your other records are unchanged.',error:true});return null;}
  finally{saving.current=false;setBusy(false);}
 }
 return{busy,blocked:busy||!ready||store.hasPending,feedback,run};
}
const Feedback=({value})=>value&&<p className={'sc-action-feedback'+(value.error?' field-error':'')} role={value.error?'alert':'status'}>{value.message}</p>;
const Heading=({id,emoji,title,children})=><div className="sc-tool-intro"><span className="sc-friendly" aria-hidden="true">{emoji}</span><h3 id={id}>{title}</h3><p>{children}</p></div>;

export function CenterExams({store,ready,now}){
 const {blocked,busy,feedback,run}=useSave(store,ready);
 const exams=ready?sortedExams(store.data.workspace?.exams||[],now).filter(e=>!e.archived&&e.status!=='taken'):[];
 async function add(e){
  e.preventDefault();const form=e.currentTarget,f=new FormData(form);
  if(await run(()=>store.command('exam-save',{title:String(f.get('title')||'').trim(),date:String(f.get('date')||''),subject:String(f.get('subject')||'').trim(),planId:'',scope:'all',topicIds:[],time:'',zone:'',fold:'',location:'',notes:''}),'Exam date saved. Your countdown is shown below.'))form.reset();
 }
 return <section className="sc-inline-tool" aria-labelledby="sc-exams-title"><Heading id="sc-exams-title" emoji="📅" title="Exam dates">Add your next exam and keep its date in sight.</Heading><div className="sc-tool-workspace">
 <form className="sc-inline-form sc-exam-form" aria-label="Add an exam in My Study Center" onSubmit={add}><label className="field">Exam name<input name="title" required maxLength={140} placeholder="e.g. Biology paper 1" disabled={blocked}/></label><label className="field">Exam date<input name="date" type="date" required disabled={blocked}/></label><label className="field">Subject (optional)<input name="subject" maxLength={40} placeholder="e.g. Biology" disabled={blocked}/></label><button className="button primary" disabled={blocked}>{busy?'Saving…':'Save exam date'}</button></form>
 <p className="sc-help">Date-only countdown · uses your local calendar. Saving a date does not schedule study time.</p>
 {!ready?<p role="status">Loading your exams…</p>:exams.length>0?<ul className="sc-inline-records">{exams.map(exam=>{const timing=examTiming(exam,now);return <li key={exam.id}><div><strong>{exam.title}</strong><span>{plannerDate(exam.date)}{exam.subject?' · '+exam.subject:''}{exam.time?' · '+exam.time+' '+exam.zone:''}</span></div><span className="sc-countdown">{timing.days===0?'Today':timing.days>0?`${timing.days} days left`:`${-timing.days} days ago`}</span><button className="button" disabled={blocked} onClick={()=>run(()=>store.command('exam-status',{itemId:exam.id,expectedUpdatedAt:exam.updatedAt,status:'taken'}),'Exam marked as taken. Its record has been kept.')}>Mark taken</button></li>;})}</ul>:<p className="sc-help">No upcoming exams saved. Add a name and date above to start a countdown.</p>}
 <Feedback value={feedback}/>
 </div></section>;
}

const weekdays=[[1,'Mon'],[2,'Tue'],[3,'Wed'],[4,'Thu'],[5,'Fri'],[6,'Sat'],[7,'Sun']];
export function CenterHabits({store,ready,now,today}){
 const {blocked,busy,feedback,run}=useSave(store,ready);
 const [kind,setKind]=useState('minutes'),[period,setPeriod]=useState('daily'),[target,setTarget]=useState(25),[days,setDays]=useState([1,2,3,4,5,6,7]);
 const habits=ready?alive(store.data.workspace?.habits):[],max=habitTargetMax(kind,period);
 async function add(e){
  e.preventDefault();const form=e.currentTarget,f=new FormData(form);
  if(await run(()=>store.command('habit-save',{title:String(f.get('title')||'').trim(),kind,period,target:Number(target),studyDays:days,scope:''}),'Habit saved. Its progress is shown below.'))form.elements.namedItem('title').value='';
 }
 return <section className="sc-inline-tool" aria-labelledby="sc-habits-title"><Heading id="sc-habits-title" emoji="🌱" title="Habits & goals">Choose a routine and track it here. Rest days stay part of your plan.</Heading><div className="sc-tool-workspace">
 <form className="sc-inline-form sc-habit-form" aria-label="Create a habit in My Study Center" onSubmit={add}><label className="field sc-tool-wide">Habit name<input name="title" required maxLength={140} placeholder="e.g. Read a little every day" disabled={blocked}/></label><label className="field">Measure<select value={kind} disabled={blocked} onChange={e=>{const value=e.target.value;setKind(value);setTarget(value==='minutes'?25:1);}}><option value="minutes">Saved study minutes</option><option value="sessions">Saved study sessions</option><option value="checkin">Manual check-in</option></select></label><label className="field">Repeat<select value={period} disabled={blocked} onChange={e=>{setPeriod(e.target.value);setTarget(v=>Math.min(v,habitTargetMax(kind,e.target.value)));}}><option value="daily">Daily</option><option value="weekly">Weekly</option></select></label><label className="field">Target ({habitUnit(kind,target)})<input name="target" type="number" required min="1" max={max} step="1" value={target} disabled={blocked} onChange={e=>setTarget(e.target.value===''?'':Number(e.target.value))}/></label><fieldset className="sc-tool-days" disabled={blocked}><legend>Planned study days</legend>{weekdays.map(([day,label])=><label key={day}><input type="checkbox" checked={days.includes(day)} onChange={e=>setDays(v=>e.target.checked?[...v,day].sort((a,b)=>a-b):v.filter(x=>x!==day))}/><span>{label}</span></label>)}</fieldset><button className="button primary" disabled={blocked||!days.length}>{busy?'Saving…':'Save habit'}</button>{!days.length&&<p className="field-error">Choose at least one planned study day.</p>}</form>
 <p className="sc-help">Minutes and sessions update from saved timers. Manual check-ins record your routine and add no study minutes.</p>
 {!ready?<p role="status">Loading your habits…</p>:habits.length>0?<ul className="sc-inline-records">{habits.map(habit=>{const summary=habitSummary(habit,store.data.sessions,now),manual=summary.rule.kind==='checkin',checked=!!habit.checks[today]?.checked;return <li key={habit.id}><div><strong>{habit.title}</strong><span>{summary.rule.period==='weekly'?'This week':'Today'} · {Math.floor(summary.value)} / {summary.rule.target} {habitUnit(summary.rule.kind,summary.rule.target)} · {summary.rest&&summary.rule.period==='daily'?'Rest day':summary.met?'Goal reached':'In progress'}</span></div><progress max={summary.rule.target} value={Math.min(summary.value,summary.rule.target)} aria-label={habit.title+' progress'}/>{manual&&<button className="button" disabled={blocked} onClick={()=>run(()=>store.command('habit-check',{itemId:habit.id,day:today,checked:!checked}),checked?'Today’s check-in removed. Study time is unchanged.':'Checked in for today. Study time is unchanged.')}>{checked?'Undo today’s check-in':'Check in today'}</button>}</li>;})}</ul>:<p className="sc-help">No habits saved yet. Set a goal above to see your progress here.</p>}
 <Feedback value={feedback}/>
 </div></section>;
}

export function CenterCourses({store,ready,now,onStart}){
 const {blocked,busy,feedback,run}=useSave(store,ready),[planId,setPlanId]=useState(null);
 const plans=ready?alive(store.data.workspace?.plans):[],plan=plans.find(p=>p.id===planId)||(planId===null?plans[0]:null),leaves=syllabusLeaves(plan),summary=syllabusSummary(plan);
 async function save(e){
  e.preventDefault();const form=e.currentTarget,f=new FormData(form);
  const result=await run(async()=>{
   const parsed=parseSyllabusOutline(String(f.get('topics')||''));if(!parsed.rows.length)throw Error('Add at least one topic, one per line.');
   const snapshot=await store.getSnapshot(),existing=plan?snapshot.workspace.plans.find(p=>p.id===plan.id&&!p.deletedAt):null;
   if(plan&&(!existing||existing.updatedAt!==plan.updatedAt))throw Error('This course changed. Review its current topics before saving again.');
   const subject=String(f.get('subject')||'').trim(),chapters=materialiseOutline(parsed.rows,subject,()=>crypto.randomUUID(),now);
   const before=new Set(snapshot.workspace.plans.map(p=>p.id));
   const result=await store.command('plan-save',{...(existing||{}),...(existing?{itemId:existing.id,expectedUpdatedAt:plan.updatedAt}:{}),title:existing?.title||String(f.get('title')||'').trim(),subjects:[...new Set([...(existing?.subjects||[]),subject].filter(Boolean))],chapters:[...(existing?.chapters||[]),...chapters]});
   if(result){const saved=existing?result.state.workspace.plans.find(p=>p.id===existing.id):result.state.workspace.plans.find(p=>!before.has(p.id));if(saved)setPlanId(saved.id);}
   return result;
  },plan?'Topics added to this course. Saved study time is unchanged.':'Course saved. Start a topic or mark what you have covered below.');
  if(result){form.elements.namedItem('topics').value='';const title=form.elements.namedItem('title');if(title)title.value='';}
 }
 return <section className="sc-inline-tool" aria-labelledby="sc-courses-title"><Heading id="sc-courses-title" emoji="📚" title="Course topics">Turn a course into a short topic list, then study or mark each topic covered.</Heading><div className="sc-tool-workspace">
 <form className="sc-inline-form sc-course-form" aria-label="Save course topics in My Study Center" onSubmit={save}><label className="field">Course<select value={plan?.id||''} disabled={blocked} onChange={e=>setPlanId(e.target.value)}><option value="">Create a new course</option>{plans.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></label>{!plan&&<label className="field">Course name<input name="title" required maxLength={140} placeholder="e.g. Biology revision" disabled={blocked}/></label>}<label className="field">Subject for new topics (optional)<input name="subject" maxLength={40} placeholder="e.g. Biology" disabled={blocked}/></label><label className="field sc-tool-wide">{plan?'Add topics — one per line':'Topics — one per line'}<textarea name="topics" rows={3} required maxLength={100000} placeholder={'Cell structure\nTransport in cells\nEnzymes'} disabled={blocked}/></label><button className="button primary" disabled={blocked}>{busy?'Saving…':plan?'Add topics':'Save course & topics'}</button></form>
 {!ready?<p role="status">Loading your courses…</p>:plan?<div className="sc-course-topics"><div className="sc-course-progress"><strong>{plan.title}</strong><span>{summary.done} / {summary.total} topics covered{summary.review?' · '+summary.review+' to review':''}</span></div>{leaves.length?<ul className="sc-inline-records">{leaves.map(topic=><li key={topic.id}><label className="sc-topic-check"><input type="checkbox" checked={topic.done} disabled={blocked} onChange={e=>run(()=>store.command('chapter-save',{...topic,itemId:topic.id,planId:plan.id,expectedUpdatedAt:topic.updatedAt,done:e.target.checked}),'Topic coverage saved. Study time is unchanged.')}/><span><strong>{topic.title}</strong><small>{topic.done?'Covered':'To study'}{topic.needsReview?' · Marked for review':''}</small></span></label><button className="button" disabled={blocked} onClick={()=>onStart({planId:plan.id,chapterId:topic.id,mode:'study'})}>Start this topic →</button></li>)}</ul>:<p className="sc-help">This course has no topics yet. Add them above.</p>}</div>:<p className="sc-help">{plans.length?'Choose a saved course above to see its topics, or create a new one.':'Your course and topic checklist will appear here after saving.'} Marking a topic covered does not add study minutes.</p>}
 <Feedback value={feedback}/>
 </div></section>;
}

export function StudyCenterPlans(props){
 return <section className="sc-inline-plans" aria-labelledby="sc-plans-title"><div className="sc-section-heading"><div><h2 id="sc-plans-title">Your study plans</h2><p>Add exams, build a routine and keep track of course topics here.</p></div></div><CenterExams {...props}/><CenterHabits {...props}/><CenterCourses {...props}/></section>;
}
