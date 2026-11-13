import {useCallback,useEffect,useRef,useState} from 'react';
import {emptyState,transition,elapsedMs} from './model.mjs';
import {createRepository,CHANNEL,SESSION_PREFERENCE_KEYS} from './storage.mjs';

export function useStudyStore(){
 const [data,setData]=useState(()=>emptyState()),[ready,setReady]=useState(false),[error,setError]=useState(null),[memory,setMemory]=useState(false),[event,setEvent]=useState(null);
 const ref=useRef(data),repo=useRef(null),channel=useRef(null),owner=useRef(''),mounted=useRef(false),pending=useRef(null),working=useRef(false),tickAt=useRef(0),volatile=useRef(false);
 const apply=useCallback(next=>{ref.current=next;if(mounted.current)setData(next);},[]);
 const refresh=useCallback(async()=>{if(volatile.current)return;try{const next=await repo.current.read();if(next&&next.revision>=ref.current.revision){if(!next.settings.rememberPreferences&&!ref.current.settings.rememberPreferences)next.settings={...next.settings,...Object.fromEntries(SESSION_PREFERENCE_KEYS.map(k=>[k,ref.current.settings[k]]))};apply(next);}}catch{if(mounted.current)setError({code:'STORAGE',message:'Study history could not be read. Existing data has not been cleared.'});}},[apply]);
 const load=useCallback(async()=>{setError(null);try{const next=await repo.current.load();apply(next);setReady(true);}catch(e){setError({code:e.code||'STORAGE',message:e.message});setReady(false);}},[apply]);
 useEffect(()=>{
   mounted.current=true;owner.current=crypto.randomUUID();
   channel.current=typeof BroadcastChannel!=='undefined'?new BroadcastChannel(CHANNEL):null;
   repo.current=createRepository({notify:()=>channel.current?.postMessage({changed:true})});
   if(channel.current)channel.current.onmessage=refresh;
   load();const poll=setInterval(refresh,4000);const visible=()=>{if(document.visibilityState==='visible')refresh();};document.addEventListener('visibilitychange',visible);
   return()=>{mounted.current=false;clearInterval(poll);document.removeEventListener('visibilitychange',visible);channel.current?.close();repo.current?.close();};
 },[load,refresh]);
 const execute=useCallback(async(intent)=>{
   const context={now:intent.at,owner:owner.current,id:intent.id,sessionSettings:ref.current.settings};
   try{
     const result=volatile.current?transition(ref.current,intent.action,context):await repo.current.command(intent.action,context);
     const mode=ref.current.timer?.mode||intent.action.mode;apply(result.state);setError(null);pending.current=null;setEvent({name:result.event,action:intent.action.type,mode,at:Date.now()});return result;
   }catch(e){
     if(e.code==='STALE'||e.code==='OTHER_TAB'){await refresh();}
     if(e.code==='STORAGE'||!e.code)pending.current=intent;
     setError({code:e.code||'STORAGE',message:e.message||'The action could not be completed. Try again.'});return null;
   }
 },[apply,refresh]);
 const command=useCallback(async(type,payload={})=>{
   if(!ready)return null;
   if(pending.current){setError({code:'STORAGE',message:'Resolve the pending save before changing the session.'});return null;}
   return execute({action:{type,...payload,epoch:ref.current.epoch},at:Date.now(),id:crypto.randomUUID()});
 },[ready,execute]);
 const retry=useCallback(()=>pending.current?execute(pending.current):load(),[execute,load]);
 const useMemory=useCallback(()=>{
   volatile.current=true;setMemory(true);const savedIntent=pending.current;pending.current=null;
   // Keep the most recent visible state; no silent persistence/success promise.
   let next=ref.current.epoch==='initial'?emptyState(crypto.randomUUID()):ref.current;
   if(savedIntent){try{next=transition(next,savedIntent.action,{now:savedIntent.at,owner:owner.current,id:savedIntent.id}).state;}catch{}}
   apply(next);setReady(true);setError(null);
 },[apply]);
 useEffect(()=>{
   if(!ready)return;
   let observed={wall:Date.now(),mono:performance.now()};
   const tick=()=>{
     const t=ref.current.timer,now=Date.now(),mono=performance.now(),clockChanged=Math.abs((now-observed.wall)-(mono-observed.mono))>2000;
     observed={wall:now,mono};
     if(working.current||pending.current||!t||t.owner!==owner.current||t.status!=='running')return;
     const due=t.durationSeconds&&elapsedMs(t,now)>=t.durationSeconds*1000;
     if(!clockChanged&&!due&&now-tickAt.current<5000&&now>=t.lastObserved)return;
     tickAt.current=now;working.current=true;
     execute({action:{type:clockChanged?'clock-change':'tick',epoch:ref.current.epoch,timerId:t.id},at:now,id:crypto.randomUUID()}).finally(()=>working.current=false);
   };
   const timer=setInterval(tick,250);const visible=()=>{if(document.visibilityState==='visible'){tickAt.current=0;tick();}};
   document.addEventListener('visibilitychange',visible);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',visible);};
 },[ready,execute]);
 const wipe=useCallback(async()=>{try{const result=volatile.current?{state:emptyState(crypto.randomUUID()),event:'cleared'}:await repo.current.wipe();pending.current=null;apply(result.state);setReady(true);setError(null);setEvent({name:'cleared',at:Date.now()});return result;}catch{setError({code:'STORAGE',message:'Stored data could not be cleared. Try again.'});return null;}},[apply]);
 const getSnapshot=useCallback(()=>volatile.current?Promise.resolve(ref.current):repo.current.read(),[]);
 return{data,ready,error,memory,event,owner:owner.current,command,retry,useMemory,refresh,wipe,getSnapshot,clearError:()=>setError(null),hasPending:!!pending.current,pendingAt:pending.current?.at};
}
