import {DomainError,dayKey,dailyTotals,hasProgress,makeTimer} from './model.mjs';

export const emptyWorkspace=()=>({tasks:[],habits:[],plans:[],blocks:[],weeklyGoal:0,deletedSessions:Object.create(null)});
const invalid=message=>{throw new DomainError('INVALID',message);};
export const alive=items=>(items||[]).filter(x=>!x.deletedAt);
const text=(v,max=140,optional=false)=>{if(typeof v!=='string'||v.length>max||(!optional&&!v.trim()))invalid(`Enter text from ${optional?0:1} to ${max} characters.`);return v.trim();};
export const validDay=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&dayKey(new Date(value+'T12:00:00').getTime())===value;
const date=v=>{if(v!==''&&!validDay(v))invalid('Choose a valid calendar date.');return v;};
const number=(v,min,max)=>{if(!Number.isInteger(v)||v<min||v>max)invalid(`Enter a whole number from ${min} to ${max}.`);return v;};
const stamp=v=>{if(!Number.isFinite(v)||v<0||v>Date.now()+86400000)invalid('Invalid update time.');return v;};
const identifier=v=>text(v,150);
function base(v){return{id:identifier(v.id),updatedAt:stamp(v.updatedAt),deletedAt:v.deletedAt?stamp(v.deletedAt):0};}
function list(v,cap){if(!Array.isArray(v)||v.length>cap)invalid('The workspace contains too many items.');const seen=new Set();for(const x of v){if(!x||seen.has(x.id))invalid('Duplicate or invalid workspace item.');seen.add(x.id);}return v;}
export function validateWorkspace(input){
 if(input===undefined)return emptyWorkspace();
 if(!input||typeof input!=='object')invalid('Invalid workspace data.');
 const tasks=list(input.tasks||[],5000).map(x=>{if(!['low','normal','high'].includes(x.priority)||typeof x.done!=='boolean')invalid('Invalid task status.');return{...base(x),title:text(x.title),subject:text(x.subject||'',40,true),dueDate:date(x.dueDate||''),plannedDate:date(x.plannedDate||''),priority:x.priority,estimateMinutes:number(x.estimateMinutes||0,0,10080),done:x.done};});
 const habits=list(input.habits||[],100).map(x=>{
  if(!['minutes','sessions','checkin'].includes(x.kind)||!['daily','weekly'].includes(x.period))invalid('Invalid habit goal.');
  if(!Array.isArray(x.studyDays)||!x.studyDays.length||new Set(x.studyDays).size!==x.studyDays.length||x.studyDays.some(d=>!Number.isInteger(d)||d<1||d>7))invalid('Choose at least one study day.');
  const checks={};if(!x.checks||typeof x.checks!=='object'||Object.keys(x.checks).length>20000)invalid('Invalid check-ins.');
  for(const [k,v]of Object.entries(x.checks)){if(!validDay(k)||!v||typeof v.checked!=='boolean')invalid('Invalid check-in date.');checks[k]={checked:v.checked,updatedAt:stamp(v.updatedAt)};}
  if(!validDay(x.startDate))invalid('Invalid habit start date.');
  return{...base(x),title:text(x.title),kind:x.kind,period:x.period,target:number(x.target,1,x.kind==='minutes'?(x.period==='daily'?1440:10080):x.kind==='checkin'?(x.period==='daily'?1:7):1000),studyDays:[...x.studyDays],startDate:x.startDate,checks};
 });
 const plans=list(input.plans||[],100).map(x=>{
  const chapters=list(x.chapters||[],1000).map(c=>{if(typeof c.done!=='boolean')invalid('Invalid chapter status.');return{...base(c),title:text(c.title),subject:text(c.subject||'',40,true),parentId:c.parentId?identifier(c.parentId):'',targetDate:date(c.targetDate||''),done:c.done};});
  for(const c of chapters){if(c.parentId&&(!chapters.some(p=>p.id===c.parentId&&!p.parentId&&(!p.deletedAt||c.deletedAt))||c.parentId===c.id))invalid('Subchapters need a top-level parent.');}
  if(!Array.isArray(x.subjects||[])||(x.subjects||[]).length>100)invalid('Invalid exam subjects.');
  return{...base(x),title:text(x.title),examDate:date(x.examDate||''),templateId:text(x.templateId||'',100,true),templateSource:text(x.templateSource||'',500,true),subjects:(x.subjects||[]).map(s=>text(s,40)),chapters};
 });
 const blocks=list(input.blocks||[],1000).map(x=>{const start=number(x.start,0,1439),end=number(x.end,1,1440);if(start>=end)invalid('End time must be after start time.');return{...base(x),title:text(x.title),subject:text(x.subject||'',40,true),weekday:number(x.weekday,1,7),start,end};});
 const deletedSessions=Object.create(null);if(!input.deletedSessions||typeof input.deletedSessions!=='object')input={...input,deletedSessions:{}};
 if(Object.keys(input.deletedSessions).length>50000)invalid('Too many deletion markers.');
 for(const [id,t]of Object.entries(input.deletedSessions)){identifier(id);deletedSessions[id]=stamp(t);}
 return{tasks,habits,plans,blocks,weeklyGoal:number(input.weeklyGoal||0,0,10080),goalUpdatedAt:input.goalUpdatedAt?stamp(input.goalUpdatedAt):0,deletedSessions};
}
function choose(a,b){if(!a)return b;if(!b)return a;const at=Math.max(a.updatedAt,a.deletedAt||0),bt=Math.max(b.updatedAt,b.deletedAt||0);return bt>at?b:bt<at?a:JSON.stringify(a)>JSON.stringify(b)?a:b;}
function mergeItems(a,b,extra){const map=new Map(a.map(x=>[x.id,x]));for(const item of b){const previous=map.get(item.id);map.set(item.id,extra&&previous?extra(previous,item):choose(previous,item));}return[...map.values()];}
export function mergeWorkspace(a,b){
 a=validateWorkspace(a);b=validateWorkspace(b);
 const result={
  tasks:mergeItems(a.tasks,b.tasks),blocks:mergeItems(a.blocks,b.blocks),
  habits:mergeItems(a.habits,b.habits,(x,y)=>{const checks={...x.checks};for(const [day,v]of Object.entries(y.checks))checks[day]=choose(checks[day],v);return{...choose(x,y),checks};}),
  plans:mergeItems(a.plans,b.plans,(x,y)=>({...choose(x,y),chapters:mergeItems(x.chapters,y.chapters)})),
  weeklyGoal:b.goalUpdatedAt>a.goalUpdatedAt?b.weeklyGoal:a.weeklyGoal,goalUpdatedAt:Math.max(a.goalUpdatedAt,b.goalUpdatedAt),
  deletedSessions:{...a.deletedSessions}
 };
 for(const [id,t]of Object.entries(b.deletedSessions))result.deletedSessions[id]=Math.max(t,result.deletedSessions[id]||0);
 // A child edited on another device cannot revive its deleted parent.
 for(const plan of result.plans)for(const child of plan.chapters){const parent=child.parentId&&plan.chapters.find(c=>c.id===child.parentId);if(parent?.deletedAt&&!child.deletedAt)child.deletedAt=Math.max(parent.deletedAt,child.updatedAt);}
 return validateWorkspace(result);
}
export function workspaceAction(state,action,{id,now,owner}){
 const w=state.workspace=validateWorkspace(state.workspace),type=action.type;
 const upsert=(key,fields)=>{const old=action.itemId?w[key].find(x=>x.id===action.itemId&&!x.deletedAt):null;if(action.itemId&&!old)invalid('This item changed or was removed.');const entry={...old,...fields,id:old?.id||id,updatedAt:now,deletedAt:0};const candidate={...w,[key]:old?w[key].map(x=>x.id===old.id?entry:x):[...w[key],entry]};state.workspace=validateWorkspace(candidate);};
 if(type==='task-save')upsert('tasks',{title:action.title,subject:action.subject||'',dueDate:action.dueDate||'',plannedDate:action.plannedDate||'',priority:action.priority||'normal',estimateMinutes:action.estimateMinutes||0,done:!!action.done});
 else if(type==='habit-save')upsert('habits',{title:action.title,kind:action.kind,period:action.period,target:action.target,studyDays:action.studyDays,startDate:action.startDate||dayKey(now),checks:w.habits.find(x=>x.id===action.itemId)?.checks||{}});
 else if(type==='habit-check'){
  const h=w.habits.find(x=>x.id===action.itemId&&!x.deletedAt);if(!h||h.kind!=='checkin')invalid('Choose a manual check-in habit.');
  if(!validDay(action.day)||action.day>dayKey(now)||action.day<h.startDate)invalid('Choose a day between the habit start and today.');
  h.checks[action.day]={checked:!!action.checked,updatedAt:now};h.updatedAt=now;
 }
 else if(type==='plan-save')upsert('plans',{title:action.title,examDate:action.examDate||'',templateId:action.templateId||'',templateSource:action.templateSource||'',subjects:action.subjects||w.plans.find(x=>x.id===action.itemId)?.subjects||[],chapters:action.chapters||w.plans.find(x=>x.id===action.itemId)?.chapters||[]});
 else if(type==='chapter-save'){
  const plan=w.plans.find(x=>x.id===action.planId&&!x.deletedAt);if(!plan)invalid('Choose an exam plan.');
  const old=action.itemId?plan.chapters.find(c=>c.id===action.itemId&&!c.deletedAt):null;if(action.itemId&&!old)invalid('That chapter no longer exists.');
  const c={id:old?.id||id,title:action.title,subject:action.subject||'',parentId:action.parentId||'',targetDate:action.targetDate||'',done:!!action.done,updatedAt:now,deletedAt:0};
  plan.chapters=old?plan.chapters.map(x=>x.id===old.id?c:x):[...plan.chapters,c];plan.updatedAt=now;
 }
 else if(type==='workspace-delete'){
  if(!['tasks','habits','plans','blocks','chapters'].includes(action.collection))invalid('Choose a supported item.');
  const list=action.collection==='chapters'?w.plans.find(p=>p.id===action.planId)?.chapters:w[action.collection];
  const item=list?.find(x=>x.id===action.itemId&&!x.deletedAt);if(!item)invalid('That item no longer exists.');
  item.deletedAt=now;item.updatedAt=now;
  if(action.collection==='chapters')for(const child of list.filter(c=>c.parentId===item.id)){child.deletedAt=now;child.updatedAt=now;}
 }
 else if(type==='block-save'){
  if(alive(w.blocks).some(b=>b.id!==action.itemId&&b.weekday===action.weekday&&action.start<b.end&&action.end>b.start))invalid('This block overlaps another block on the same day.');
  upsert('blocks',{title:action.title,subject:action.subject||'',weekday:action.weekday,start:action.start,end:action.end});
 }
 else if(type==='weekly-goal'){w.weeklyGoal=number(action.minutes,0,10080);w.goalUpdatedAt=now;}
 else if(type==='workspace-start'){
  if(hasProgress(state.timer))throw new DomainError('BUSY','Finish or reset the active session before starting a different task.');
  let target;if(action.taskId)target=alive(w.tasks).find(x=>x.id===action.taskId);else target=alive(w.plans).find(x=>x.id===action.planId)?.chapters.find(x=>x.id===action.chapterId&&!x.deletedAt);
  if(!target)invalid('This study target no longer exists.');
  const mode=action.mode||'study';if(!['study','focus','pomodoro'].includes(mode))invalid('Choose a study timer.');
  state.timer={...makeTimer(mode,state.settings,id,now,owner),subject:target.subject,taskId:action.taskId||'',taskTitle:action.taskId?target.title:'',planId:action.planId||'',chapterId:action.chapterId||'',chapterTitle:action.chapterId?target.title:'',status:'running',since:now,startedAt:now};
 }
 else return false;
 state.workspace=validateWorkspace(state.workspace);
 const subjects=[action.subject,...(action.subjects||[])].filter(Boolean);for(const subject of subjects)if(!state.subjects.some(s=>s.toLowerCase()===subject.toLowerCase()))state.subjects.push(subject);
 return true;
}
export function targetSeconds(sessions,field,id){return sessions.filter(s=>s[field]===id).reduce((sum,s)=>sum+s.durationSeconds,0);}
export function chapterProgress(plan){const chapters=alive(plan.chapters);const leaves=chapters.filter(c=>!chapters.some(x=>x.parentId===c.id));return{total:leaves.length,done:leaves.filter(c=>c.done).length};}
export function examDays(date,now){if(!validDay(date))return null;return Math.round((Date.parse(date+'T12:00:00Z')-Date.parse(dayKey(now)+'T12:00:00Z'))/86400000);}
const weekday=d=>new Date(d+'T12:00:00').getDay()||7;
const shift=(d,n)=>{const date=new Date(d+'T12:00:00');date.setDate(date.getDate()+n);return dayKey(date);};
export function habitSummary(h,sessions,now){
 const today=dayKey(now),days=dailyTotals(sessions),counts={};for(const s of sessions){const day=dayKey(s.endedAt);counts[day]=(counts[day]||0)+1;}
 const value=day=>h.kind==='minutes'?(days[day]||0)/60:h.kind==='sessions'?(counts[day]||0):h.checks[day]?.checked?1:0;
 const isRest=day=>!h.studyDays.includes(weekday(day));
 const monday=day=>shift(day,1-weekday(day));
 const weekValue=day=>Array.from({length:7},(_,i)=>shift(monday(day),i)).filter(d=>d>=h.startDate&&d<=today).reduce((sum,d)=>sum+value(d),0);
 const met=day=>h.period==='weekly'?weekValue(day)>=h.target:value(day)>=h.target;
 let best=0,run=0,current=0;
 if(h.period==='daily'){
  for(let d=h.startDate;d<=today;d=shift(d,1)){if(isRest(d))continue;if(met(d)){run++;best=Math.max(best,run);}else if(d!==today)run=0;}
  for(let d=today;d>=h.startDate;d=shift(d,-1)){if(isRest(d))continue;if(d===today&&!met(d))continue;if(!met(d))break;current++;}
 }else{
  for(let d=monday(h.startDate);d<=today;d=shift(d,7)){if(weekValue(d)>=h.target){run++;best=Math.max(best,run);}else if(d!==monday(today))run=0;}
  for(let d=monday(today);d>=monday(h.startDate);d=shift(d,-7)){if(d===monday(today)&&weekValue(d)<h.target)continue;if(weekValue(d)<h.target)break;current++;}
 }
 return{value:h.period==='weekly'?weekValue(today):value(today),met:met(today),rest:isRest(today),current,best,unit:h.period==='weekly'?'weeks':'study days',days:Array.from({length:7},(_,i)=>{const day=shift(monday(today),i);return{day,value:value(day),rest:isRest(day),future:day>today,met:met(day)};})};
}

export function sessionsCSV(sessions){
 const cell=value=>{let s=String(value??'');if(/^[\s]*[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
 const rows=[['Session ID','Started at (UTC)','Ended at (UTC)','Mode','Subject','Task','Chapter','Duration seconds','Status'],...sessions.map(s=>[s.id,new Date(s.startedAt).toISOString(),new Date(s.endedAt).toISOString(),s.mode,s.subject,s.taskTitle||'',s.chapterTitle||'',s.durationSeconds,s.status])];
 return '\uFEFF'+rows.map(r=>r.map(cell).join(',')).join('\r\n')+'\r\n';
}
