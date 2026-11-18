import {studyTaskRows} from './planning-plan-view.mjs';
import {PLANNER_REMINDER_KEY} from './planner-device-state.mjs';
export {PLANNER_REMINDER_KEY};
const MINUTE=60000;
export const defaultPlannerReminders=epoch=>({version:1,epoch,enabled:false,mode:'before',enabledAt:0,seen:{}});
export function readPlannerReminders(storage,epoch){
 const stored=storage.getItem(PLANNER_REMINDER_KEY);let raw;try{raw=JSON.parse(stored||'null');}catch{return defaultPlannerReminders(epoch);}
 if(!raw||raw.version!==1||raw.epoch!==epoch)return defaultPlannerReminders(epoch);
 return {...defaultPlannerReminders(epoch),enabled:raw.enabled===true,mode:raw.mode==='start'?'start':'before',enabledAt:Number.isSafeInteger(raw.enabledAt)?raw.enabledAt:0,seen:raw.seen&&typeof raw.seen==='object'&&!Array.isArray(raw.seen)?raw.seen:{}};
}
export const plannerReminderId=(epoch,block)=>JSON.stringify([epoch,block.id,block.startAt,block.endAt]);
export function plannerReminderIsCurrent(data,notice,now){
 if(!notice||now>=Math.min(notice.dueAt+2*MINUTE,notice.block.endAt)||['running','paused','review'].includes(data.timer?.status))return false;
 const row=studyTaskRows(data,now).find(r=>r.task.id===notice.task.id&&!r.task.done&&!r.paused&&r.state==='scheduled');
 if(!row||row.goalId&&!data.workspace.planning.goals.some(g=>g.id===row.goalId&&!g.deletedAt))return false;
 return row.upcoming.some(b=>plannerReminderId(data.epoch,b)===notice.key);
}
export function plannerReminderCandidates(data,now,prefs){
 if(!prefs.enabled||prefs.epoch!==data.epoch||['running','paused','review'].includes(data.timer?.status))return [];
 const goals=new Set(data.workspace.planning.goals.filter(g=>!g.deletedAt).map(g=>g.id));
 return studyTaskRows(data,now).filter(r=>!r.task.done&&!r.paused&&r.state==='scheduled'&&(!r.goalId||goals.has(r.goalId))).flatMap(row=>row.upcoming.map(block=>{
  const dueAt=block.startAt-(prefs.mode==='before'?5*MINUTE:0),key=plannerReminderId(data.epoch,block);
  return {key,block,task:row.task,dueAt,mode:prefs.mode};
 })).filter(r=>!Object.hasOwn(prefs.seen,r.key)&&r.dueAt>=prefs.enabledAt&&now>=r.dueAt&&now<Math.min(r.dueAt+2*MINUTE,r.block.endAt,prefs.mode==='before'?r.block.startAt:Infinity)).sort((a,b)=>a.dueAt-b.dueAt||a.block.id.localeCompare(b.block.id));
}

// Web Locks coordinates the preference/claim write across tabs. No background push.
export function createPlannerReminderService({storage,locks,read,now=Date.now,visible=()=>true,onReminder=()=>{}}){
 const supported=!!storage&&typeof locks?.request==='function';
 return {supported,
  settings(epoch){return readPlannerReminders(storage,epoch);},
  async configure(epoch,{enabled,mode}){
   if(!supported)throw Error('Page reminders are unavailable in this browser.');
   if(typeof enabled!=='boolean'||!['before','start'].includes(mode))throw Error('Choose a reminder time.');
   return locks.request(PLANNER_REMINDER_KEY,async()=>{
    const data=await read();if(data.epoch!==epoch)throw Error('Your workspace changed. Reopen reminder settings.');
    const old=readPlannerReminders(storage,epoch),next={...old,enabled,mode,enabledAt:enabled&&!old.enabled?now():old.enabledAt};
    storage.setItem(PLANNER_REMINDER_KEY,JSON.stringify(next));return next;
   });
  },
  async tick(){
   if(!supported||!visible())return null;
   return locks.request(PLANNER_REMINDER_KEY,{ifAvailable:true},async lock=>{
    if(!lock||!visible())return null;
    const data=await read(),at=now(),prefs=readPlannerReminders(storage,data.epoch),candidate=plannerReminderCandidates(data,at,prefs)[0];
    if(!candidate||!visible())return null;
    const seen=Object.fromEntries(Object.entries(prefs.seen).filter(([,time])=>Number.isSafeInteger(time)&&time>at-21*86400000).slice(-499));seen[candidate.key]=at;
    storage.setItem(PLANNER_REMINDER_KEY,JSON.stringify({...prefs,seen}));onReminder(candidate);return candidate;
   });
  }
 };
}
