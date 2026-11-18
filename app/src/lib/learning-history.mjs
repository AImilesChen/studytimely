// Append-only planning evidence. Baselines describe what was observed, not past completions.
const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
const bad=()=>{throw Error('Invalid learning analysis history.');};
const str=(s,max=150)=>typeof s==='string'&&s.length<=max?s:bad();
const stamp=n=>Number.isFinite(n)&&n>=0&&n<=Date.now()+86400000?n:bad();
export const emptyLearning=()=>({version:1,startedAt:0,events:[],reviews:[],zone:'',zoneUpdatedAt:0});
function validateSnapshot(s){
 const positive=n=>Number.isFinite(n)&&n>=0,strings=(v,keys)=>keys.every(k=>typeof v[k]==='string'),subjects=a=>Array.isArray(a)&&a.length<=500&&a.every(v=>typeof v.name==='string'&&v.name.length<=40&&positive(v.seconds)&&positive(v.share)&&v.share<=1);
 if(!positive(s.total)||!Number.isInteger(s.count)||s.count<0||!Number.isInteger(s.activeDays)||s.activeDays<0||!(s.average===null||positive(s.average))||!subjects(s.subjects))bad();
 if(!Array.isArray(s.series)||s.series.length>366||!s.series.every(v=>validDate(v.date)&&positive(v.seconds)))bad();
 if(!Array.isArray(s.tasks)||s.tasks.length>100||!s.tasks.every(t=>strings(t,['id','title','subject','plannedDate','dueDate'])&&t.title.length<=140&&t.subject.length<=40&&typeof t.done==='boolean'&&typeof t.deleted==='boolean'&&positive(t.actualSeconds)&&positive(t.periodSeconds)&&(t.estimateMinutes===null||positive(t.estimateMinutes))))bad();
 if(!Array.isArray(s.insights)||s.insights.length>10||!s.insights.every(i=>typeof i.text==='string'&&i.text.length<=2000&&typeof i.kind==='string'))bad();
 if(s.comparison&&(!validDate(s.comparison.start)||!validDate(s.comparison.end)||!positive(s.comparison.total)||!positive(s.comparison.activeDays)||!subjects(s.comparison.subjects)||!Number.isFinite(s.comparison.delta?.difference)||!(s.comparison.delta.percent===null||Number.isFinite(s.comparison.delta.percent))))bad();
 return s;
}
export function taskEvidence(t){return {taskId:t.id,title:t.title,subject:t.subject||'',plannedDate:t.plannedDate||'',dueDate:t.dueDate||'',estimateMinutes:t.estimateMinutes||0,done:!!t.done,deleted:!!t.deletedAt};}
export function validateLearning(value){
 if(value===undefined)return emptyLearning();
 if(!value||value.version!==1||!Array.isArray(value.events)||value.events.length>50000||!Array.isArray(value.reviews)||value.reviews.length>2000||value.reviews.filter(r=>!r?.deletedAt).length>200)bad();
 const ids=new Set(),events=value.events.map(e=>{
  if(!e||!['task','baseline','daily-goal','weekly-goal'].includes(e.kind)||!e.id||ids.has(e.id))bad();ids.add(e.id);
  if(e.order!==undefined&&(!Number.isSafeInteger(e.order)||e.order<0))bad();const row={id:str(e.id),at:stamp(e.at),kind:e.kind,order:e.order||0};
  if(e.kind==='task'||e.kind==='baseline'){
   if(!e.taskId||typeof e.done!=='boolean'||typeof e.deleted!=='boolean'||!Number.isInteger(e.estimateMinutes)||e.estimateMinutes<0||e.estimateMinutes>10080)bad();
   for(const k of ['plannedDate','dueDate'])if(e[k]!==''&&!validDate(e[k]))bad();
   Object.assign(row,{taskId:str(e.taskId),title:str(e.title,140),subject:str(e.subject,40),plannedDate:e.plannedDate,dueDate:e.dueDate,estimateMinutes:e.estimateMinutes,done:e.done,deleted:e.deleted});
  }else{if(!Number.isInteger(e.minutes)||e.minutes<0||e.minutes>(e.kind==='daily-goal'?1440:10080))bad();row.minutes=e.minutes;}
  return row;
 });
 const reviewIds=new Set(),reviews=value.reviews.map(r=>{
  if(!r||!r.id||reviewIds.has(r.id)||!['week','month'].includes(r.period)||!validDate(r.start)||!validDate(r.end)||r.start>r.end)bad();reviewIds.add(r.id);
  const snapshot=JSON.stringify(r.snapshot);if(!snapshot||snapshot.length>80000||!r.snapshot||r.snapshot.version!==1)bad();
  validateSnapshot(r.snapshot);
  try{new Intl.DateTimeFormat('en',{timeZone:r.zone});}catch{bad();}
  return {id:str(r.id),updatedAt:stamp(r.updatedAt),deletedAt:stamp(r.deletedAt||0),generatedAt:stamp(r.generatedAt),period:r.period,start:r.start,end:r.end,zone:str(r.zone,100),subject:str(r.subject||'',60),mode:str(r.mode||'',20),fingerprint:str(r.fingerprint,100),snapshot:JSON.parse(snapshot),good:str(r.good||'',2000),difficulty:str(r.difficulty||'',2000),next:str(r.next||'',2000)};
 });
 const zone=str(value.zone||'',100);if(zone)try{new Intl.DateTimeFormat('en',{timeZone:zone});}catch{bad();}
 return {version:1,startedAt:stamp(value.startedAt||0),events:events.sort((a,b)=>a.at-b.at||(a.order||0)-(b.order||0)||a.id.localeCompare(b.id)),reviews,zone,zoneUpdatedAt:stamp(value.zoneUpdatedAt||0)};
}
export function beginLearning(state,now,id){
 const w=state.workspace,l=w.learning||emptyLearning();w.learning=l;if(l.startedAt)return l;
 l.startedAt=now;
 (w.tasks||[]).forEach((t,i)=>l.events.push({id:id+':baseline:'+i,at:now,kind:'baseline',...taskEvidence(t)}));
 l.events.push({id:id+':daily',at:now,kind:'daily-goal',minutes:state.dailyGoal||0},{id:id+':weekly',at:now,kind:'weekly-goal',minutes:w.weeklyGoal||0});return l;
}
export function recordTask(state,task,now,id){const l=beginLearning(state,now,id),order=l.events.reduce((n,e)=>Math.max(n,e.order||0),0)+1;l.events.push({id:id+':task',at:now,kind:'task',order,...taskEvidence(task)});}
export function recordGoal(state,kind,minutes,now,id){const l=beginLearning(state,now,id),order=l.events.reduce((n,e)=>Math.max(n,e.order||0),0)+1;l.events.push({id:id+':'+kind,at:now,kind,order,minutes});}
export function mergeLearning(a,b){
 a=validateLearning(a);b=validateLearning(b);
 const union=(xs,ys)=>{const map=new Map(xs.map(x=>[x.id,x]));for(const y of ys){const x=map.get(y.id);if(!x||Math.max(y.updatedAt||y.at,y.deletedAt||0)>Math.max(x.updatedAt||x.at,x.deletedAt||0)||(Math.max(y.updatedAt||y.at,y.deletedAt||0)===Math.max(x.updatedAt||x.at,x.deletedAt||0)&&JSON.stringify(y)>JSON.stringify(x)))map.set(y.id,y);}return [...map.values()];};
 const zone=b.zoneUpdatedAt>a.zoneUpdatedAt?b:a;
 return validateLearning({version:1,startedAt:[a.startedAt,b.startedAt].filter(Boolean).reduce((n,v)=>n?Math.min(n,v):v,0),events:union(a.events,b.events),reviews:union(a.reviews,b.reviews),zone:zone.zone,zoneUpdatedAt:zone.zoneUpdatedAt});
}
export function losesLearningHistory(previous,next){
 const a=previous?.workspace?.learning,b=next?.workspace?.learning;if(!a)return false;if(!b)return !!(a.startedAt||a.events?.length||a.reviews?.length);
 return (a.events||[]).some(e=>!b.events?.some(n=>n.id===e.id))||(a.reviews||[]).some(r=>!b.reviews?.some(n=>n.id===r.id));
}
