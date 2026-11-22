const fail=m=>{throw Error(m||'Invalid advanced study plan.');};
const str=(v,n=150,optional=false)=>typeof v==='string'&&v.length<=n&&(optional||v.trim())?v:fail('Check the plan text.');
const num=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max?v:fail('Check the plan numbers.');
const stamp=v=>Number.isSafeInteger(v)&&v>=0&&v<=Date.now()+86400000?v:fail('Invalid plan update time.');
export const planningDate=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&v>='1970-01-01'&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;
const date=(v,optional=false)=>optional&&v===''?'':planningDate(v)?v:fail('Choose a valid study date.');
const rows=(v,n)=>{if(!Array.isArray(v)||v.length>n)fail('This plan contains too many items.');const ids=new Set();for(const r of v){if(!r||!r.id||ids.has(r.id))fail('Duplicate plan item.');ids.add(r.id);}return v;};
const base=r=>({id:str(r.id),updatedAt:stamp(r.updatedAt),deletedAt:stamp(r.deletedAt||0)});
export const DEFAULT_PLANNING_SETTINGS={zone:'UTC',strategy:'spread',maxDailyMinutes:240,focusMinutes:50,minMinutes:15,breakMinutes:5,bufferMinutes:15};
export const emptyPlanning=()=>({version:1,revision:0,settings:{...DEFAULT_PLANNING_SETTINGS,updatedAt:0},availability:[],exceptions:[],goals:[],rules:[],blocks:[],feedback:[],examPlans:[],undo:null});
export function planningSettings(s){
 const zone=str(s.zone,100);try{new Intl.DateTimeFormat('en',{timeZone:zone});}catch{fail('Choose a valid IANA time zone.');}
 const strategy=s.strategy??'spread';if(!['spread','early'].includes(strategy))fail('Choose a supported scheduling style.');
 const value={zone,strategy,maxDailyMinutes:num(s.maxDailyMinutes,15,720),focusMinutes:num(s.focusMinutes,15,240),minMinutes:num(s.minMinutes,5,120),breakMinutes:num(s.breakMinutes,0,60),bufferMinutes:num(s.bufferMinutes,0,240),updatedAt:stamp(s.updatedAt||0)};
 if(value.minMinutes>value.focusMinutes)fail('Minimum session length must fit the preferred focus window.');return value;
}
export function validatePlanning(input){
 if(input===undefined)return emptyPlanning();if(!input||![1,2].includes(input.version))fail('Update StudyTimely to read this study-plan format.');
 if(input.version===1&&((input.examPlans||[]).length||(input.rules||[]).some(r=>r.prep)))fail('Update StudyTimely to read this exam preparation.');
 const settings=planningSettings(input.settings),window=r=>{const start=num(r.start,0,1439),end=num(r.end,1,1440);if(start>=end)fail('Choose an end after the start. Split overnight windows between dates.');return {start,end};};
 const availability=rows(input.availability,100).map(r=>({...base(r),weekday:num(r.weekday,1,7),...window(r)}));
 const exceptions=rows(input.exceptions,500).map(r=>{if(!['off','busy','study'].includes(r.kind))fail();return {...base(r),date:date(r.date),kind:r.kind,...(r.kind==='off'?{start:0,end:1440}:window(r))};});
 const goals=rows(input.goals,200).map(r=>{if(!['exam','course','assignment','custom'].includes(r.kind))fail();return {...base(r),title:str(r.title,140),subject:str(r.subject||'',40,true),deadline:date(r.deadline),kind:r.kind,examId:str(r.examId||'',160,true)};});
 const rules=rows(input.rules,5000).map(r=>{const dependsOn=(r.dependsOn||[]).map(x=>str(x));if(dependsOn.length>30||new Set(dependsOn).size!==dependsOn.length||dependsOn.includes(r.id))fail('Check task dependencies.');let prep;if(r.prep){if(!['learn','review','mock','reflect'].includes(r.prep.stage)||typeof r.prep.whole!=='boolean')fail('Invalid preparation activity.');prep={topicId:str(r.prep.topicId||'',150,true),stage:r.prep.stage,round:num(r.prep.round,0,2),gapDays:num(r.prep.gapDays,0,60),whole:r.prep.whole,omitted:r.prep.omitted===undefined?false:typeof r.prep.omitted==='boolean'?r.prep.omitted:fail('Invalid activity selection.')};}return {...base(r),goalId:str(r.goalId||'',150,true),remainingMinutes:r.remainingMinutes===null?null:num(r.remainingMinutes,0,10080),earliestDate:date(r.earliestDate||'',true),dependsOn,sourcePlanId:str(r.sourcePlanId||'',150,true),sourceChapterId:str(r.sourceChapterId||'',150,true),...(prep?{prep}:{})};});
 const examPlans=rows(input.examPlans||[],200).map(e=>({...base(e),examId:str(e.examId,160),startDate:date(e.startDate),importance:['normal','high'].includes(e.importance)?e.importance:fail('Invalid exam priority.'),rounds:num(e.rounds,0,2),gapDays:num(e.gapDays,0,30),lastInputs:str(e.lastInputs||'',100,true),lastAppliedAt:stamp(e.lastAppliedAt||0),topics:rows(e.topics,100).map(t=>{if(!['new','weak','confident'].includes(t.confidence))fail('Choose a topic self-assessment.');return{...base(t),title:str(t.title,140),minutes:num(t.minutes,5,480),confidence:t.confidence,sourcePlanId:str(t.sourcePlanId||'',150,true),sourceChapterId:str(t.sourceChapterId||'',150,true),learnTaskId:str(t.learnTaskId||'',150,true)};})}));
 for(const r of rules.filter(r=>r.prep&&!r.deletedAt)){const e=examPlans.find(e=>e.id===r.goalId);if(!e||r.prep.topicId&&!e.topics.some(t=>t.id===r.prep.topicId))fail('Preparation activity has no topic or plan.');}
 const graph=new Map(rules.filter(r=>!r.deletedAt).map(r=>[r.id,r.dependsOn])),seen=new Set(),path=new Set();
 function visit(id){if(path.has(id))fail('Task dependencies form a cycle.');if(seen.has(id))return;path.add(id);for(const next of graph.get(id)||[])visit(next);path.delete(id);seen.add(id);}for(const id of graph.keys())visit(id);
 const block=r=>{if(!Number.isSafeInteger(r.startAt)||!Number.isSafeInteger(r.endAt)||r.startAt<0||r.endAt<=r.startAt||r.endAt-r.startAt>86400000||typeof r.locked!=='boolean'||!['planned','reviewed','skipped'].includes(r.status)||!['manual','generated'].includes(r.source))fail('Invalid dated study block.');return {...base(r),taskId:str(r.taskId),startAt:r.startAt,endAt:r.endAt,locked:r.locked,status:r.status,source:r.source};};
 const blocks=rows(input.blocks,5000).map(block),feedback=rows(input.feedback,5000).map(r=>({...base(r),taskId:str(r.taskId),blockId:str(r.blockId||'',150,true),remainingMinutes:r.remainingMinutes===null?null:num(r.remainingMinutes,0,10080),done:typeof r.done==='boolean'?r.done:fail()}));
 let undo=null;if(input.undo){const u=input.undo;if(!Array.isArray(u.afterIds)||u.afterIds.length>2000)fail();undo={id:str(u.id),at:stamp(u.at),revision:num(u.revision,0,Number.MAX_SAFE_INTEGER),before:rows(u.before,2000).map(block),afterIds:u.afterIds.map(x=>str(x)),...(u.aiAdoptionId?{aiAdoptionId:str(u.aiAdoptionId)}:{}),...(u.restChange?{restChange:{id:str(u.restChange.id),previous:u.restChange.previous===null?null:fail('Invalid rest-day undo.')}}:{})};}
 return {version:input.version,revision:num(input.revision,0,Number.MAX_SAFE_INTEGER),settings,availability,exceptions,goals,rules,blocks,feedback,examPlans,undo};
}
const choose=(a,b)=>!a?b:!b?a:Math.max(a.updatedAt,a.deletedAt||0)>Math.max(b.updatedAt,b.deletedAt||0)?a:Math.max(a.updatedAt,a.deletedAt||0)<Math.max(b.updatedAt,b.deletedAt||0)?b:JSON.stringify(a)>JSON.stringify(b)?a:b;
export function mergePlanning(a,b){
 a=validatePlanning(a);b=validatePlanning(b);if(JSON.stringify(a)===JSON.stringify(b))return a;const result=emptyPlanning();result.version=Math.max(a.version,b.version);result.settings=choose(a.settings,b.settings);result.revision=Math.max(a.revision,b.revision)+1;
 for(const key of ['availability','exceptions','goals','rules','blocks','feedback']){const map=new Map(a[key].map(r=>[r.id,r]));for(const r of b[key])map.set(r.id,choose(map.get(r.id),r));result[key]=[...map.values()];}
 const exams=new Map(a.examPlans.map(e=>[e.id,e]));for(const e of b.examPlans){const old=exams.get(e.id);if(!old){exams.set(e.id,e);continue;}const topics=new Map(old.topics.map(t=>[t.id,t]));for(const t of e.topics)topics.set(t.id,choose(topics.get(t.id),t));exams.set(e.id,{...choose(old,e),topics:[...topics.values()]});}result.examPlans=[...exams.values()];
 // Undo applies only to the exact local transaction that created it, never to a merge.
 result.undo=null;return validatePlanning(result);
}
export function losesPlanningHistory(previous,next){
 const a=previous?.workspace?.planning,b=next?.workspace?.planning;if(!a)return false;
 if(!b)return !!(a.settings?.updatedAt||['availability','exceptions','goals','rules','blocks','feedback','examPlans'].some(k=>a[k]?.length));
 return ![1,2].includes(b.version)||b.version<a.version||['availability','exceptions','goals','rules','blocks','feedback','examPlans'].some(k=>(a[k]||[]).some(r=>!b[k]?.some(x=>x.id===r.id)))||(a.examPlans||[]).some(e=>e.topics.some(t=>!b.examPlans?.find(n=>n.id===e.id)?.topics?.some(n=>n.id===t.id)))||(a.rules||[]).some(r=>r.prep&&!b.rules?.find(n=>n.id===r.id)?.prep)||(a.settings?.updatedAt||0)>(b.settings?.updatedAt||0);
}
