import {scheduleMinutes} from './schedule.mjs';
import {chartColour} from './analytics-chart.mjs';
import {planningCapacity,taskRemaining,wallWindow} from './planning-engine.mjs';
import {planningSessionStage} from './planning-sandbox.mjs';
import {preparationFor,preparationExam} from './exam-preparation.mjs';
import {zonedDay} from './study-analysis.mjs';

const live=xs=>(xs||[]).filter(x=>!x.deletedAt);
export const calendarColour=subject=>chartColour(subject||'Unlabelled');
export const calendarKind=rule=>({learn:'study',review:'review',mock:'mock',reflect:'corrections'}[rule?.prep?.stage]||'study');
export const calendarKindLabel=kind=>({study:'Study',review:'Review',mock:'Mock',corrections:'Corrections'}[kind]||'Study');
export function calendarTaskGroups(source,goal,now){
 const p=source.workspace.planning,rules=new Map(live(p.rules).map(r=>[r.id,r])),reserved=new Map();
 for(const b of live(p.blocks))if(b.status==='planned'&&b.endAt>now)reserved.set(b.taskId,(reserved.get(b.taskId)||0)+(b.endAt-Math.max(now,b.startAt))/60000);
 const pending=[],arranged=[];
 for(const task of live(source.workspace.tasks)){
  const rule=rules.get(task.id);if(task.done||rule?.prep?.omitted||goal&&rule?.goalId!==goal)continue;
  const prep=preparationFor(source,rule?.goalId);if(prep&&!preparationExam(source,prep))continue;
  const remaining=taskRemaining(task,rule),placed=reserved.get(task.id)||0,unarranged=remaining===null?null:Math.max(0,remaining-placed),row={task,rule,remaining,placed,unarranged};
  (unarranged===null||unarranged>0||!placed?pending:arranged).push(row);
 }
 const order=(a,b)=>(a.task.dueDate||'9999').localeCompare(b.task.dueDate||'9999')||a.task.title.localeCompare(b.task.title);
 return {pending:pending.sort(order),arranged:arranged.sort(order)};
}
export function calendarStatus(source,block,now,simulations={}){
 const stage=planningSessionStage(source,block,simulations).stage;
 return stage==='planned'&&block.endAt<now?'missed':stage;
}
export const calendarWallMinute=(at,zone)=>{const parts=new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(at)).split(':').map(Number);return parts[0]*60+parts[1];};

export function calendarFreeTimes(source,start,now){
 const keep=live(source.workspace.planning.blocks).filter(b=>b.status==='planned');
 return planningCapacity(source,{start,days:7,now,keep}).days;
}
export function calendarAddDraft(slot,zone,fraction=0){
 const at=Math.min(slot.endAt-5*60000,slot.startAt+Math.floor(Math.max(0,Math.min(.999,fraction))*(slot.endAt-slot.startAt)/300000)*300000),duration=Math.min(30,Math.floor((slot.endAt-at)/60000));
 return {date:zonedDay(at,zone),start:calendarWallMinute(at,zone),minutes:duration};
}

export function calendarSessionPayload(fields,zone){
 const start=scheduleMinutes(fields.start),minutes=Number(fields.minutes);
 if(!Number.isSafeInteger(start)||start<0||start>=1440||!Number.isSafeInteger(minutes)||minutes<5||minutes>720||start+minutes>1440)throw Error('Choose 5–720 minutes and finish by midnight.');
 const [startAt,endAt]=wallWindow(fields.date,start,start+minutes,zone);
 return {itemId:fields.itemId,taskId:fields.taskId||'',startAt,endAt,goalId:fields.goalId||'',...(fields.title!==undefined?{title:fields.title.trim(),subject:(fields.subject||'').trim()}: {})};
}
