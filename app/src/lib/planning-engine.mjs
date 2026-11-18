import {validatePlanning,planningDate} from './planning-schema.mjs';
import {wallCandidates,examInstant} from './exams.mjs';
import {dayBoundary,zonedDay} from './study-analysis.mjs';
import {shiftPlannerDay as shiftDay} from './planner.mjs';
const live=xs=>(xs||[]).filter(r=>!r.deletedAt),mins=xs=>xs.reduce((n,[a,b])=>n+(b-a)/60000,0);
export function unionWindows(xs){const out=[];for(const [a,b]of xs.filter(([a,b])=>b>a).sort((a,b)=>a[0]-b[0])){const last=out.at(-1);if(last&&a<=last[1])last[1]=Math.max(last[1],b);else out.push([a,b]);}return out;}
export function subtractWindows(xs,busy){let out=unionWindows(xs);for(const [a,b]of unionWindows(busy))out=out.flatMap(([x,y])=>b<=x||a>=y?[[x,y]]:[[x,Math.min(a,y)],[Math.max(b,x),y]].filter(([c,d])=>d>c));return out;}
const clock=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
export function wallWindow(date,start,end,zone){const a=wallCandidates(date,clock(start),zone),b=end===1440?wallCandidates(shiftDay(date,1),'00:00',zone):wallCandidates(date,clock(end),zone);if(a.length!==1||b.length!==1||b[0]<=a[0])throw Error('A clock-change window is missing or ambiguous. Choose another time.');return[a[0],b[0]];}
export function planningFingerprint(data){const p=validatePlanning(data.workspace?.planning),v=JSON.stringify([p,(data.workspace?.tasks||[]).map(t=>[t.id,t.updatedAt,t.deletedAt,t.done,t.dueDate,t.estimateMinutes]),data.workspace?.blocks,data.workspace?.exams,(data.sessions||[]).map(s=>[s.id,s.durationSeconds]),data.timer?.planningBlockId||'',data.timer?.status||'']);let a=2166136261,b=5381;for(let i=0;i<v.length;i++){a=Math.imul(a^v.charCodeAt(i),16777619);b=Math.imul(b,33)^v.charCodeAt(i);}return (a>>>0).toString(16)+(b>>>0).toString(16);}
export function taskRemaining(task,rule){return task.done?0:rule?.remainingMinutes??(task.estimateMinutes>0?task.estimateMinutes:null);}
function goalDeadline(task,rule,p,data){const g=live(p.goals).find(g=>g.id===rule?.goalId),e=g?.examId&&live(data.workspace?.exams).find(e=>e.id===g.examId&&!e.archived&&e.status!=='taken');let at=Infinity;for(const d of [task.dueDate,g?.deadline,e?.date].filter(Boolean))at=Math.min(at,dayBoundary(shiftDay(d,1),p.settings.zone));if(e?.time)at=Math.min(at,examInstant(e));return at;}
export function planningCapacity(data,{start,days=7,now,keep=[]}={}){
 const p=validatePlanning(data.workspace?.planning),s=p.settings,out=[],warnings=[],routine=live(data.workspace?.blocks),available=live(p.availability),exceptions=live(p.exceptions);
 for(let i=0;i<days;i++){const date=shiftDay(start,i),weekday=(new Date(date+'T12:00:00Z').getUTCDay()+6)%7+1,ex=exceptions.filter(e=>e.date===date),busy=[],windows=[];
  const add=(list,a,b)=>{try{list.push(wallWindow(date,a,b,s.zone));}catch(e){warnings.push({date,message:e.message});}};
  if(!ex.some(e=>e.kind==='off'))for(const r of [...available.filter(r=>r.weekday===weekday),...ex.filter(e=>e.kind==='study')])add(windows,r.start,r.end);
  for(const r of [...routine.filter(r=>r.weekday===weekday&&r.kind!=='study'),...ex.filter(e=>e.kind==='busy')])add(busy,r.start,r.end);
  if(ex.some(e=>e.kind==='off')){out.push({date,slots:[],capacity:0,free:0,buffer:0});continue;}
  const begin=dayBoundary(date,s.zone),end=dayBoundary(shiftDay(date,1),s.zone);for(const b of keep)if(b.startAt<end&&b.endAt>begin)busy.push([b.startAt,b.endAt]);
  let free=subtractWindows(windows,busy).map(([a,b])=>[Math.max(a,Math.ceil((now+60000)/300000)*300000),b]).filter(([a,b])=>b>a),buffer=Math.min(s.bufferMinutes,mins(free)),left=buffer*60000;
  for(let j=free.length-1;j>=0&&left;j--){const cut=Math.min(left,free[j][1]-free[j][0]);free[j][1]-=cut;left-=cut;}free=free.filter(([a,b])=>b>a);
  const slots=[];let cap=s.maxDailyMinutes;
  for(const [a,b]of free){let at=a;while(cap>=5&&b-at>=300000){const length=Math.min(s.focusMinutes,Math.floor((b-at)/60000),cap);slots.push({date,startAt:at,endAt:at+length*60000});cap-=length;at+=(length+s.breakMinutes)*60000;}}
  out.push({date,slots,capacity:slots.reduce((n,r)=>n+(r.endAt-r.startAt)/60000,0),free:mins(free)+buffer,buffer});
 }return{days:out,capacity:out.reduce((n,d)=>n+d.capacity,0),warnings};
}
export function generateStudySchedule(data,{start,days=7,goalId=''}={},now=Date.now()){
 const p=validatePlanning(data.workspace?.planning),today=zonedDay(now,p.settings.zone);if(![7,14,30].includes(days)||!planningDate(start)||start<today||start>shiftDay(today,366))throw Error('Choose a start from today and a 7, 14 or 30-day plan.');
 const rules=new Map(live(p.rules).map(r=>[r.id,r])),tasks=live(data.workspace?.tasks).filter(t=>!goalId||rules.get(t.id)?.goalId===goalId),ids=new Set(tasks.map(t=>t.id)),end=dayBoundary(shiftDay(start,days),p.settings.zone),active=data.timer&&['running','paused','review'].includes(data.timer.status)?data.timer.planningBlockId:'';
 const replacing=live(p.blocks).filter(b=>b.status==='planned'&&!b.locked&&b.id!==active&&ids.has(b.taskId)&&b.startAt>=now&&b.startAt>=dayBoundary(start,p.settings.zone)&&b.startAt<end),replaceIds=new Set(replacing.map(b=>b.id)),keep=live(p.blocks).filter(b=>b.status==='planned'&&!replaceIds.has(b.id)),capacity=planningCapacity(data,{start,days,now,keep}),slots=capacity.days.flatMap(d=>d.slots.map(r=>({...r}))),blocks=[],unscheduled=[],reserved=new Map(),finished=new Map();
 for(const b of keep)if(b.endAt>now){reserved.set(b.taskId,(reserved.get(b.taskId)||0)+(b.endAt-Math.max(now,b.startAt))/60000);const task=tasks.find(t=>t.id===b.taskId),remaining=task&&taskRemaining(task,rules.get(task.id));if(remaining!==null&&reserved.get(b.taskId)>=remaining)finished.set(b.taskId,Math.max(...keep.filter(x=>x.taskId===b.taskId).map(x=>x.endAt)));}
 const dayLoads=new Map();for(const b of keep)if(b.endAt>now){const date=zonedDay(b.startAt,p.settings.zone);dayLoads.set(date,(dayLoads.get(date)||0)+(b.endAt-Math.max(now,b.startAt))/60000);}
 const allTasks=new Map(live(data.workspace?.tasks).map(t=>[t.id,t])),candidates=tasks.filter(t=>!t.done).map(t=>({task:t,rule:rules.get(t.id),deadline:goalDeadline(t,rules.get(t.id),p,data),remaining:taskRemaining(t,rules.get(t.id))})).sort((a,b)=>a.deadline-b.deadline||({high:0,normal:1,low:2}[a.task.priority]-{high:0,normal:1,low:2}[b.task.priority])||a.task.id.localeCompare(b.task.id));
 const pending=[...candidates];let passes=0;
 while(pending.length&&passes++<=candidates.length){let changed=false;for(let n=0;n<pending.length;){const c=pending[n],deps=c.rule?.dependsOn||[],missing=deps.find(id=>!allTasks.has(id)),blocked=deps.some(id=>!allTasks.get(id)?.done&&!finished.has(id));if(blocked&&!missing){n++;continue;}pending.splice(n,1);changed=true;
   let amount=c.remaining===null?null:Math.max(0,c.remaining-(reserved.get(c.task.id)||0)),why=missing?'A prerequisite task was removed.':amount===null?'Set a remaining-time estimate.':amount===0&&!c.task.done&&!(reserved.get(c.task.id)>0)?'Confirm completion or enter remaining work.':'';
   const earliest=Math.max(now,...deps.map(id=>allTasks.get(id)?.done?0:finished.get(id)||0),c.rule?.earliestDate?dayBoundary(c.rule.earliestDate,p.settings.zone):0);
   if(!why&&amount>0){while(amount>0){
     let options=slots.map(slot=>{const a=Math.max(slot.startAt,earliest),b=Math.min(slot.endAt,c.deadline);return{slot,a,free:Math.floor((b-a)/60000)};}).filter(x=>x.free>=Math.min(p.settings.minMinutes,amount));
     // A short task stays whole when a later focus window can accommodate it.
     if(amount<=p.settings.focusMinutes&&options.some(x=>x.free>=amount))options=options.filter(x=>x.free>=amount);
     const load=date=>dayLoads.get(date)||0;
     options.sort((a,b)=>(p.settings.strategy==='spread'?load(a.slot.date)-load(b.slot.date):0)||a.a-b.a);
     if(!options.length)break;const {slot,a,free}=options[0];let length=Math.min(free,amount);
     if(amount>length&&amount-length<p.settings.minMinutes&&amount-p.settings.minMinutes>=p.settings.minMinutes)length=amount-p.settings.minMinutes;
     blocks.push({taskId:c.task.id,startAt:a,endAt:a+length*60000});slot.startAt=a+length*60000;amount-=length;dayLoads.set(slot.date,load(slot.date)+length);
    }
    if(amount===0)finished.set(c.task.id,Math.max(finished.get(c.task.id)||0,...blocks.filter(b=>b.taskId===c.task.id).map(b=>b.endAt)));
   }
   if(why||amount>0){const due=c.deadline<=end;unscheduled.push({taskId:c.task.id,minutes:amount,reason:why||(due?'Not placed before the deadline under these availability and session rules.':'Outside this planning horizon or no suitable focus window.'),deadlineAt:Number.isFinite(c.deadline)?c.deadline:null,deadlineRisk:due});}
  }if(!changed)break;}
 for(const c of pending)unscheduled.push({taskId:c.task.id,minutes:c.remaining,reason:'A prerequisite still needs to be completed or scheduled in this plan.',deadlineRisk:c.deadline<=end,deadlineAt:Number.isFinite(c.deadline)?c.deadline:null});
 if(blocks.length+replacing.length>2000)throw Error('Use a shorter horizon or fewer tasks per generation.');
 blocks.sort((a,b)=>a.startAt-b.startAt||a.taskId.localeCompare(b.taskId));
 const result={recipe:{start,days,goalId},at:now,fingerprint:planningFingerprint(data),blocks,replaceIds:[...replaceIds],unscheduled,capacity,strategy:p.settings.strategy,plannedMinutes:blocks.reduce((n,b)=>n+(b.endAt-b.startAt)/60000,0)};
 // Balance is a preference. Do not lose a feasible deadline merely to spread work.
 const risk=rows=>rows.reduce((n,r)=>n+(r.deadlineRisk&&Number.isFinite(r.minutes)?r.minutes:0),0);
 if(p.settings.strategy==='spread'&&risk(unscheduled)>0){const earlier=generateStudySchedule({...data,workspace:{...data.workspace,planning:{...p,settings:{...p.settings,strategy:'early'}}}},result.recipe,now);if(risk(earlier.unscheduled)<risk(unscheduled))return{...earlier,strategy:'spread',fingerprint:result.fingerprint,explanation:'Some work is grouped earlier to fit deadlines and prerequisites.'};}
 return result;
}

export {goalDeadline as planningTaskDeadline};
