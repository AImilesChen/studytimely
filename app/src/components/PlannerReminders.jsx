import {useEffect,useRef,useState} from 'react';
import {Bell,X,ArrowRight} from '@phosphor-icons/react';
import {createPlannerReminderService,defaultPlannerReminders,PLANNER_REMINDER_KEY,plannerReminderIsCurrent} from '../lib/planning-reminders.mjs';
import {planningWhen} from '../lib/planning-next-action.mjs';

export function usePlannerReminders(store,{demo,suspended}){
 const [prefs,setPrefs]=useState(defaultPlannerReminders(store.data.epoch)),[supported,setSupported]=useState(false),[issue,setIssue]=useState(''),[notice,setNotice]=useState(null),[busy,setBusy]=useState(false),service=useRef(null),latest=useRef(null);
 latest.current={store,demo,suspended};
 useEffect(()=>{
  if(!store.ready)return;
  let gone=false,working=false;
  try{service.current=createPlannerReminderService({storage:localStorage,locks:navigator.locks,read:()=>latest.current.store.getSnapshot(),visible:()=>!gone&&document.visibilityState==='visible'&&!latest.current.demo&&!latest.current.suspended&&!latest.current.store.memory&&!latest.current.store.hasPending,onReminder:r=>{if(!gone)setNotice(r);}});setSupported(service.current.supported);setPrefs(service.current.settings(store.data.epoch));}
  catch{setSupported(false);setIssue('Reminder settings could not be read. Your learning records are unchanged.');}
  async function tick(){if(working||gone||!service.current)return;setNotice(n=>n&&plannerReminderIsCurrent(latest.current.store.data,n,Date.now())?n:null);working=true;try{await service.current.tick();}catch{if(!gone)setIssue('Reminders are paused because their settings could not be saved.');}finally{working=false;}}
  function storageChanged(e){if(e.key===PLANNER_REMINDER_KEY){try{setPrefs(service.current.settings(latest.current.store.data.epoch));setNotice(null);}catch{setIssue('Reminder settings could not be read.');}}}
  const timer=setInterval(tick,15000);document.addEventListener('visibilitychange',tick);window.addEventListener('storage',storageChanged);tick();
  return()=>{gone=true;clearInterval(timer);document.removeEventListener('visibilitychange',tick);window.removeEventListener('storage',storageChanged);};
 },[store.ready,store.data.epoch]);
 useEffect(()=>{if(notice&&(demo||!prefs.enabled||!plannerReminderIsCurrent(store.data,notice,Date.now())))setNotice(null);},[store.data,demo,prefs.enabled,notice]);
 async function configure(value){setBusy(true);setIssue('');try{const next=await service.current.configure(store.data.epoch,value);setPrefs(next);setNotice(null);return true;}catch(e){setIssue(e.message);return false;}finally{setBusy(false);}}
 return {prefs,supported,issue,notice,busy,configure,dismiss:()=>setNotice(null)};
}

export function PlannerReminderOptions({reminders,demo}){
 const [enabled,setEnabled]=useState(reminders.prefs.enabled),[mode,setMode]=useState(reminders.prefs.mode),[saved,setSaved]=useState(false);
 return <form className="sp-reminder-options" onSubmit={async e=>{e.preventDefault();setSaved(false);if(await reminders.configure({enabled,mode}))setSaved(true);}}><h3>Study reminders</h3><p>Show a quiet reminder while this planner is open and visible. Reminders stay on this browser.</p><label className="sp-check"><input type="checkbox" checked={enabled} disabled={demo||!reminders.supported||reminders.busy} onChange={e=>{setEnabled(e.target.checked);setSaved(false);}}/>Remind me about planned study</label><label>When<select value={mode} disabled={demo||!enabled||reminders.busy} onChange={e=>{setMode(e.target.value);setSaved(false);}}><option value="before">5 minutes before</option><option value="start">At the start time</option></select></label><p className="sp-note">Closing this page stops reminders. They do not start timers or send notifications outside this page.</p>{demo?<p>Example plans do not send reminders. Use your own plans to enable them.</p>:!reminders.supported&&<p>Page reminders are unavailable in this browser.</p>}{reminders.issue&&<p className="field-error" role="alert">{reminders.issue}</p>}<button className="button primary" disabled={demo||!reminders.supported||reminders.busy}>{reminders.busy?'Saving…':'Save reminders'}</button>{saved&&<p role="status">Reminder preferences saved on this browser.</p>}</form>;
}

export function PlannerReminderNotice({notice,clock,zone,onOpen,onDismiss}){
 if(!notice)return null;
 return <aside className="sp-reminder-notice" aria-label="Study reminder"><Bell size={21}/><div><strong role="status">{notice.mode==='before'?'Study starts soon':'Time for your planned study'}</strong><span>{notice.task.title} · {planningWhen(notice.block,clock,zone)}</span></div><button className="button" onClick={onOpen}>View task <ArrowRight size={15}/></button><button className="icon-button" aria-label="Dismiss study reminder" onClick={onDismiss}><X size={19}/></button></aside>;
}
