import {DomainError,dayKey,dailyTotals,hasProgress,makeTimer,validateSettings} from './model.mjs';
import {validateHabit,habitSave,habitCheck,mergeHabit,habitSummary,habitPolicy} from './habits.mjs';
import {parseSyllabusOutline,materialiseOutline,syllabusLeaves} from './syllabus.mjs';
import {BLOCK_KINDS,blockConflicts,conflictMessage,scheduleDraftDays} from './schedule.mjs';
import {migrateExams,validateExam} from './exams.mjs';

export const emptyWorkspace=()=>({tasks:[],habits:[],plans:[],blocks:[],examVersion:1,exams:[],weeklyGoal:0,deletedSessions:Object.create(null)});
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
 const habits=list(input.habits||[],100).map(validateHabit);
 const plans=list(input.plans||[],100).map(x=>{
  if(x.syllabusVersion!==undefined&&![1,2].includes(x.syllabusVersion))invalid('Update StudyTimely to read this syllabus format.');
  const chapters=list(x.chapters||[],1000).map(c=>{if(typeof c.done!=='boolean')invalid('Invalid chapter status.');return{...base(c),title:text(c.title),subject:text(c.subject||'',40,true),parentId:c.parentId?identifier(c.parentId):'',targetDate:date(c.targetDate||''),done:c.done,needsReview:c.needsReview===undefined?false:typeof c.needsReview==='boolean'?c.needsReview:invalid('Invalid review status.')};});
  for(const c of chapters){if(c.parentId&&(!chapters.some(p=>p.id===c.parentId&&!p.parentId&&(!p.deletedAt||c.deletedAt))||c.parentId===c.id))invalid('Subchapters need a top-level parent.');}
  if(!Array.isArray(x.subjects||[])||(x.subjects||[]).length>100)invalid('Invalid exam subjects.');
  return{...base(x),title:text(x.title),examDate:date(x.examDate||''),templateId:text(x.templateId||'',100,true),templateSource:text(x.templateSource||'',500,true),subjects:(x.subjects||[]).map(s=>text(s,40)),chapters,...(x.syllabusVersion===2?{syllabusVersion:2,nextChapterId:x.nextChapterId?identifier(x.nextChapterId):''}:{})};
 });
 const blocks=list(input.blocks||[],1000).map(x=>{const start=number(x.start,0,1439),end=number(x.end,1,1440),kind=x.kind||'study';if(!Object.hasOwn(BLOCK_KINDS,kind))invalid('Choose a supported block type.');if(start>=end)invalid('End time must be after start time.');return{...base(x),title:text(x.title),subject:text(x.subject||'',40,true),kind,weekday:number(x.weekday,1,7),start,end};});
 const deletedSessions=Object.create(null);if(!input.deletedSessions||typeof input.deletedSessions!=='object')input={...input,deletedSessions:{}};
 if(Object.keys(input.deletedSessions).length>50000)invalid('Too many deletion markers.');
 for(const [id,t]of Object.entries(input.deletedSessions)){identifier(id);deletedSessions[id]=stamp(t);}
 let exams;try{exams=migrateExams(input,plans);}catch(e){invalid(e.message);}
 return{tasks,habits,plans,blocks,examVersion:1,exams,weeklyGoal:number(input.weeklyGoal||0,0,10080),goalUpdatedAt:input.goalUpdatedAt?stamp(input.goalUpdatedAt):0,deletedSessions};
}
function choose(a,b){if(!a)return b;if(!b)return a;const at=Math.max(a.updatedAt,a.deletedAt||0),bt=Math.max(b.updatedAt,b.deletedAt||0);return bt>at?b:bt<at?a:JSON.stringify(a)>JSON.stringify(b)?a:b;}
function mergeItems(a,b,extra){const map=new Map(a.map(x=>[x.id,x]));for(const item of b){const previous=map.get(item.id);map.set(item.id,extra&&previous?extra(previous,item):choose(previous,item));}return[...map.values()];}
export function mergeWorkspace(a,b){
 const modernA=a?.examVersion===1,modernB=b?.examVersion===1;
 a=validateWorkspace(a);b=validateWorkspace(b);
 const result={
  tasks:mergeItems(a.tasks,b.tasks),blocks:mergeItems(a.blocks,b.blocks),examVersion:1,exams:mergeItems(a.exams,b.exams,(x,y)=>modernA&&!modernB?x:modernB&&!modernA?y:choose(x,y)),
  habits:mergeItems(a.habits,b.habits,(x,y)=>mergeHabit(x,y,choose)),
  plans:mergeItems(a.plans,b.plans,(x,y)=>{const winner=choose(x,y),modern=x.syllabusVersion===2||y.syllabusVersion===2;return {...winner,...(modern?{syllabusVersion:2,nextChapterId:winner.syllabusVersion===2?winner.nextChapterId:(x.syllabusVersion===2?x:y).nextChapterId}:{}),chapters:mergeItems(x.chapters,y.chapters,(c,d)=>{const chosen=choose(c,d);return {...chosen,needsReview:winner.syllabusVersion!==2&&modern?(x.syllabusVersion===2?c:d).needsReview:chosen.needsReview};})};}),
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
 const upsert=(key,fields)=>{const old=action.itemId?w[key].find(x=>x.id===action.itemId&&!x.deletedAt):null;if(action.itemId&&!old)invalid('This item changed or was removed.');if(old&&action.expectedUpdatedAt!==undefined&&action.expectedUpdatedAt!==old.updatedAt)invalid('This item changed in another tab. Reopen it before saving.');const entry={...old,...fields,id:old?.id||id,updatedAt:now,deletedAt:0};const candidate={...w,[key]:old?w[key].map(x=>x.id===old.id?entry:x):[...w[key],entry]};state.workspace=validateWorkspace(candidate);};
 if(type==='task-save')upsert('tasks',{title:action.title,subject:action.subject||'',dueDate:action.dueDate||'',plannedDate:action.plannedDate||'',priority:action.priority||'normal',estimateMinutes:action.estimateMinutes||0,done:!!action.done});
 else if(type==='habit-save')habitSave(w,action,{id,now});
 else if(type==='habit-check')habitCheck(w,action,now);
 else if(type==='habit-prepare'){
  if(hasProgress(state.timer))throw new DomainError('BUSY','Finish or reset your unfinished timer before preparing this habit. Your current session was kept.');
  const h=alive(w.habits).find(h=>h.id===action.habitId),rule=h&&habitPolicy(h,dayKey(now));if(!rule||rule.kind==='checkin')invalid('Choose an automatic learning habit.');
  const mode=action.mode||'focus';if(!['study','focus','pomodoro'].includes(mode))invalid('Choose a study timer.');
  const minutes=number(action.minutes??25,1,240),subject=!rule.scope?state.settings.subject:rule.scope==='none'?'':rule.scope.slice(8);
  state.settings=validateSettings({...state.settings,subject,...(mode==='focus'?{focusSeconds:minutes*60}:mode==='pomodoro'?{studyMinutes:minutes}:{})});
  state.timer=makeTimer(mode,state.settings,id,now,owner);
 }
 else if(type==='exam-save'){
  const old=action.itemId?w.exams.find(x=>x.id===action.itemId&&!x.deletedAt):null;
  if(action.planId&&!alive(w.plans).some(p=>p.id===action.planId)&&action.planId!==old?.planId)invalid('Choose a current syllabus.');
  if(action.scope==='selected'){
   const p=alive(w.plans).find(p=>p.id===action.planId),chapters=alive(p?.chapters);
   if(!p||!(action.topicIds||[]).every(topic=>chapters.some(c=>c.id===topic)||(old?.planId===p.id&&old.topicIds.includes(topic))))invalid('Choose current chapters or topics.');
  }
  upsert('exams',{title:action.title,date:action.date,subject:action.subject||'',planId:action.planId||'',scope:action.scope||'all',topicIds:action.topicIds||[],time:action.time||'',zone:action.time?action.zone:'',fold:action.time?action.fold||'':'',location:action.location||'',notes:action.notes||'',status:old?.status||'upcoming',archived:old?.archived||false});
  const e=state.workspace.exams.find(e=>e.id===(old?.id||id));
  // The old syllabus date is a compatibility mirror of its one migrated event only.
  if(e.id==='legacy:'+e.planId){const p=state.workspace.plans.find(p=>p.id===e.planId);if(p){p.examDate=e.date;p.updatedAt=now;}}
 }
 else if(type==='exam-status'){
  const e=w.exams.find(e=>e.id===action.itemId&&!e.deletedAt);if(!e)invalid('This exam no longer exists.');
  if(action.expectedUpdatedAt!==e.updatedAt)invalid('This exam changed in another tab. Reopen it before saving.');
  if(action.status!==undefined)e.status=action.status;if(action.archived!==undefined)e.archived=action.archived;e.updatedAt=now;
 }
 else if(type==='plan-save'){
  const previous=w.plans.find(x=>x.id===action.itemId),examDate=action.examDate===undefined?(previous?.examDate||''):action.examDate;
  upsert('plans',{title:action.title,examDate,templateId:action.templateId||'',templateSource:action.templateSource||'',syllabusVersion:2,nextChapterId:previous?.nextChapterId||'',subjects:action.subjects||previous?.subjects||[],chapters:action.chapters||previous?.chapters||[]});
  if(examDate!==(previous?.examDate||'')){
   const plan=state.workspace.plans.find(p=>p.id===(action.itemId||id)),legacyId='legacy:'+plan.id,old=state.workspace.exams.find(e=>e.id===legacyId);
   if(examDate){const event=validateExam({...old,id:legacyId,title:old?.title||plan.title,date:examDate,planId:plan.id,subject:old?.subject||(plan.subjects.length===1?plan.subjects[0]:''),updatedAt:now,deletedAt:0});state.workspace.exams=old?state.workspace.exams.map(e=>e.id===legacyId?event:e):[...state.workspace.exams,event];}
   else if(old){old.updatedAt=now;old.deletedAt=now;}
  }
 }
 else if(type==='chapter-save'){
  const plan=w.plans.find(x=>x.id===action.planId&&!x.deletedAt);if(!plan)invalid('Choose an exam plan.');
  const old=action.itemId?plan.chapters.find(c=>c.id===action.itemId&&!c.deletedAt):null;if(action.itemId&&!old)invalid('That chapter no longer exists.');
  if(old&&action.expectedUpdatedAt!==undefined&&action.expectedUpdatedAt!==old.updatedAt)invalid('This topic changed in another tab. Reopen it before saving.');
  const c={id:old?.id||id,title:action.title,subject:action.subject||'',parentId:action.parentId||'',targetDate:action.targetDate||'',done:!!action.done,needsReview:action.needsReview===undefined?(old?.needsReview||false):action.needsReview,updatedAt:now,deletedAt:0};
  if(plan.nextChapterId===c.id&&c.done&&!c.needsReview)plan.nextChapterId='';
  plan.syllabusVersion=2;plan.chapters=old?plan.chapters.map(x=>x.id===old.id?c:x):[...plan.chapters,c];plan.updatedAt=now;
 }
 else if(type==='chapter-import'){
  const plan=alive(w.plans).find(p=>p.id===action.planId);if(!plan)invalid('Choose a syllabus.');
  if(action.expectedUpdatedAt!==plan.updatedAt)invalid('This syllabus changed in another tab. Preview your import again.');
  let parsed;try{parsed=parseSyllabusOutline(action.outline);}catch(e){invalid(e.message);}
  if(!parsed.rows.length)invalid('Paste at least one topic.');
  const rows=action.rows||parsed.rows;
  // Reviewed edits can adjust titles and parents, never inject record fields.
  if(!Array.isArray(rows)||rows.length!==parsed.rows.length)invalid('Preview the outline again.');
  rows.forEach((r,i)=>{text(r.title);if(r.parentIndex!==null&&(!Number.isInteger(r.parentIndex)||r.parentIndex<0||r.parentIndex>=i||rows[r.parentIndex].parentIndex!==null))invalid('Choose an earlier top-level parent.');});
  const selected=rows.map((r,i)=>({...r,original:i})).filter(r=>!r.skip);
  const remap=new Map(selected.map((r,i)=>[r.original,i]));
  if(!selected.length)invalid('Keep at least one topic to import.');
  const fixed=selected.map(r=>({title:r.title,parentIndex:r.parentIndex===null?null:remap.get(r.parentIndex)}));
  if(fixed.some(r=>r.parentIndex===undefined))invalid('Keep the parent chapter or make its children top-level.');
  let n=0;const subject=text(action.subject||'',40,true),entries=materialiseOutline(fixed,subject,()=>id+':'+(++n),now);
  plan.chapters.push(...entries);if(subject&&!plan.subjects.includes(subject))plan.subjects.push(subject);plan.syllabusVersion=2;plan.updatedAt=now;
 }
 else if(type==='syllabus-next'){
  const plan=alive(w.plans).find(p=>p.id===action.planId);if(!plan)invalid('Choose a syllabus.');
  if(action.chapterId&&!syllabusLeaves(plan).some(c=>c.id===action.chapterId))invalid('Choose a current leaf topic.');
  plan.nextChapterId=action.chapterId||'';plan.syllabusVersion=2;plan.updatedAt=now;
 }
 else if(type==='workspace-delete'){
  if(!['tasks','habits','plans','blocks','chapters','exams'].includes(action.collection))invalid('Choose a supported item.');
  const list=action.collection==='chapters'?w.plans.find(p=>p.id===action.planId)?.chapters:w[action.collection];
  const item=list?.find(x=>x.id===action.itemId&&!x.deletedAt);if(!item)invalid('That item no longer exists.');
  if(action.collection==='exams'&&action.expectedUpdatedAt!==item.updatedAt)invalid('This exam changed in another tab. Reopen it before deleting.');
  item.deletedAt=now;item.updatedAt=now;
  if(action.collection==='exams'&&item.id==='legacy:'+item.planId){const p=w.plans.find(p=>p.id===item.planId);if(p){p.examDate='';p.updatedAt=now;}}
  if(action.collection==='chapters'){const plan=w.plans.find(p=>p.id===action.planId);if(plan)plan.updatedAt=now;}
  if(action.collection==='chapters')for(const child of list.filter(c=>c.parentId===item.id)){child.deletedAt=now;child.updatedAt=now;}
 }
 else if(type==='block-save'||type==='blocks-save'){
  let days;try{days=scheduleDraftDays(action);}catch(e){invalid(e.message);}
  const conflict=blockConflicts(w.blocks,action,days)[0];if(conflict)invalid(conflictMessage(conflict));
  const old=action.itemId?w.blocks.find(b=>b.id===action.itemId&&!b.deletedAt):null;if(action.itemId&&!old)invalid('This block changed or was removed.');
  const entries=days.map(day=>({...old,id:old?.id||(days.length===1?id:id+':'+day),title:action.title,subject:action.subject||'',kind:action.kind||'study',weekday:day,start:action.start,end:action.end,updatedAt:now,deletedAt:0}));
  state.workspace=validateWorkspace({...w,blocks:old?w.blocks.map(b=>b.id===old.id?entries[0]:b):[...w.blocks,...entries]});
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
 const subjects=[action.subject,...(action.subjects||[]),...(type==='habit-save'&&action.scope?.startsWith('subject:')?[action.scope.slice(8)]:[])].filter(Boolean);for(const subject of subjects)if(!state.subjects.some(s=>s.toLowerCase()===subject.toLowerCase()))state.subjects.push(subject);
 return true;
}
export function targetSeconds(sessions,field,id){return sessions.filter(s=>s[field]===id).reduce((sum,s)=>sum+s.durationSeconds,0);}
export function chapterProgress(plan){const chapters=alive(plan.chapters);const leaves=chapters.filter(c=>!chapters.some(x=>x.parentId===c.id));return{total:leaves.length,done:leaves.filter(c=>c.done).length};}
export function examDays(date,now){if(!validDay(date))return null;return Math.round((Date.parse(date+'T12:00:00Z')-Date.parse(dayKey(now)+'T12:00:00Z'))/86400000);}
export {habitSummary};

export function sessionsCSV(sessions){
 const cell=value=>{let s=String(value??'');if(/^[\s]*[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
 const rows=[['Session ID','Started at (UTC)','Ended at (UTC)','Mode','Subject','Task','Chapter','Duration seconds','Status'],...sessions.map(s=>[s.id,new Date(s.startedAt).toISOString(),new Date(s.endedAt).toISOString(),s.mode,s.subject,s.taskTitle||'',s.chapterTitle||'',s.durationSeconds,s.status])];
 return '\uFEFF'+rows.map(r=>r.map(cell).join(',')).join('\r\n')+'\r\n';
}
