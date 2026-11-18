import {emptyState,transition} from './model.mjs';
import {generateStudySchedule} from './planning-engine.mjs';
import {zonedDay} from './study-analysis.mjs';
import {shiftPlannerDay as shiftDay} from './planner.mjs';

// Entirely in memory. This module has no repository, network, timer or sync access.
export function planningExample(now,zone='UTC'){
 const data=emptyState('planning-example'),today=zonedDay(now,zone),local=new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(now)),[hour,minute]=local.split(':').map(Number),first=hour*60+minute>=1080?shiftDay(today,1):today,p=data.workspace.planning;
 data.subjects=['Maths'];p.settings={...p.settings,zone,maxDailyMinutes:90};
 p.goals=[{id:'example-goal',title:'Finish Maths chapter 3',subject:'Maths',deadline:shiftDay(first,2),kind:'course',examId:'',updatedAt:now,deletedAt:0}];
 data.workspace.tasks=[['Read the worked examples',40],['Practise 10 questions',50],['Review and correct mistakes',30]].map(([title,estimateMinutes],i)=>({id:'example-task-'+i,title,subject:'Maths',estimateMinutes,plannedDate:'',dueDate:shiftDay(first,2),priority:'normal',done:false,updatedAt:now,deletedAt:0}));
 p.availability=Array.from({length:3},(_,i)=>({id:'example-window-'+i,weekday:(new Date(shiftDay(first,i)+'T12:00Z').getUTCDay()+6)%7+1,start:1080,end:1215,updatedAt:now,deletedAt:0}));
 p.rules=data.workspace.tasks.map(t=>({id:t.id,goalId:'example-goal',remainingMinutes:t.estimateMinutes,earliestDate:'',dependsOn:[],sourcePlanId:'',sourceChapterId:'',updatedAt:now,deletedAt:0}));
 p.blocks=generateStudySchedule(data,{start:today,days:7},now).blocks.map((b,i)=>({...b,id:'example-slot-'+i,source:'generated',locked:false,status:'planned',updatedAt:now,deletedAt:0}));
 return data;
}
export const createPlanningSandbox=(now,zone)=>({data:planningExample(now,zone),simulations:{}});
export function sandboxCommand(sandbox,type,payload,now,id){
 const b=sandbox.data.workspace.planning.blocks.find(b=>b.id===payload.itemId&&!b.deletedAt),running=Object.values(sandbox.simulations).some(s=>s.status==='running');
 if(type==='simulate-start'||type==='simulate-finish'){
  if(!b||b.status!=='planned')throw Error('Choose a current planned example session.');
  if(type==='simulate-start'&&running)throw Error('Finish the current simulation first.');
  if(type==='simulate-finish'&&sandbox.simulations[b.id]?.status!=='running')throw Error('Start this simulation first.');
  return{...sandbox,simulations:{...sandbox.simulations,[b.id]:{status:type==='simulate-start'?'running':'finished',seconds:type==='simulate-finish'?Math.round((b.endAt-b.startAt)/1000):0}}};
 }
 if(!type.startsWith('planning-'))throw Error('Only example planning actions are available here.');
 if(running&&['planning-apply','planning-undo','planning-block','planning-feedback'].includes(type))throw Error('Finish the example simulation before changing its schedule.');
 const result=transition(sandbox.data,{type,epoch:sandbox.data.epoch,expectedRevision:sandbox.data.workspace.planning.revision,...payload},{now,id,owner:'example'});
 return {...sandbox,data:result.state};
}
export function planningSessionStage(data,block,simulations={}){
 const simulated=simulations[block.id],active=data.timer?.planningBlockId===block.id&&['running','paused','review'].includes(data.timer.status),seconds=(data.sessions||[]).filter(s=>s.planningBlockId===block.id).reduce((n,s)=>n+s.durationSeconds,0);
 return{stage:block.status==='reviewed'?'reviewed':block.status==='skipped'?'skipped':active||simulated?.status==='running'?'active':seconds>0||simulated?.status==='finished'?'feedback':'planned',seconds,simulatedSeconds:simulated?.seconds||0};
}
