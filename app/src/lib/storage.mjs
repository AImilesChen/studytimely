import {pickPreferences} from './preferences.mjs';
import {emptyState,transition,SCHEMA,DEFAULT_SETTINGS,validateSettings,validateBackup,DomainError} from './model.mjs';
import {validateWorkspace} from './workspace.mjs';
export const DATABASE='studytimely';
export const STORE='local-state';
export const ROOT_KEY='v1';
export const CHANNEL='studytimely-state-v1';
export const SESSION_PREFERENCE_KEYS=['theme','spaceTheme','ambient','lastTool','lastPage','reducedMotion','sound','volume','clock24','showSeconds','showDate'];
const uuid=()=>crypto.randomUUID();
export function persistedState(state){
 // Choosing not to remember preferences retains study data and active timing only.
 if(state.settings.rememberPreferences)return state;
 return{...state,settings:{...state.settings,...Object.fromEntries(SESSION_PREFERENCE_KEYS.map(k=>[k,DEFAULT_SETTINGS[k]])),rememberPreferences:false}};
}
export function checkState(value){
 if(!value||value.schema!==SCHEMA||typeof value.epoch!=='string'||!Number.isInteger(value.revision))throw new DomainError('CORRUPT','Saved data could not be read. It has not been overwritten.');
 validateSettings(value.settings);validateBackup({app:'StudyTimely',schema:SCHEMA,subjects:value.subjects,sessions:value.sessions},{internal:true});
 if(!Number.isInteger(value.dailyGoal)||value.dailyGoal<0||value.dailyGoal>1440)throw new DomainError('CORRUPT','The saved goal could not be read.');
 return{...value,settings:validateSettings(value.settings),workspace:validateWorkspace(value.workspace)};
}
export function createRepository({indexedDB=globalThis.indexedDB,makeId=uuid,notify=()=>{}}={}){
 let opening=null,db=null;
 function open(){
   if(opening)return opening;
   opening=new Promise((resolve,reject)=>{
     if(!indexedDB){reject(new DomainError('STORAGE','Local storage is unavailable in this browser.'));return;}
     const request=indexedDB.open(DATABASE,1);
     request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE);};
     request.onerror=()=>{opening=null;reject(new DomainError('STORAGE','Local storage could not be opened.'));};
     request.onblocked=()=>{opening=null;reject(new DomainError('STORAGE','Close older StudyTimely tabs and try opening local storage again.'));};
     request.onsuccess=()=>{db=request.result;db.onversionchange=()=>{db.close();db=null;opening=null;};resolve(db);};
   });return opening;
 }
 async function transaction(change){
   const database=await open();return new Promise((resolve,reject)=>{
     let outcome,originalError;
     const tx=database.transaction(STORE,change?'readwrite':'readonly'),store=tx.objectStore(STORE),request=store.get(ROOT_KEY);
     request.onsuccess=()=>{
       try{
         const existing=request.result;
         if(change){outcome=change(existing);store.put(persistedState(outcome.state),ROOT_KEY);}
         else outcome={state:existing?checkState(existing):null,event:null};
       }catch(error){originalError=error;tx.abort();}
     };
     tx.oncomplete=()=>{if(change)notify();resolve(outcome);};
     tx.onabort=tx.onerror=()=>reject(originalError||new DomainError('STORAGE','Study data could not be saved. Keep this tab open and try again.'));
   }).catch(error=>{if(error instanceof DomainError)throw error;throw new DomainError('STORAGE','Study data could not be saved. Keep this tab open and try again.');});
 }
 return{
   async load(){const loaded=await transaction(null);if(loaded.state)return loaded.state;return(await transaction(existing=>({state:existing?checkState(existing):emptyState(makeId()),event:null}))).state;},
   async read(){return(await transaction(null)).state;},
   async command(action,context){return transaction(existing=>{const state=checkState(existing);if(!state.settings.rememberPreferences&&context.sessionSettings)state.settings={...state.settings,...Object.fromEntries(SESSION_PREFERENCE_KEYS.map(k=>[k,context.sessionSettings[k]]))};return transition(state,action,context);});},
   async wipe(){return transaction(existing=>({state:{...emptyState(makeId()),revision:(Number.isInteger(existing?.revision)?existing.revision:0)+1},event:'cleared'}));},
   close(){db?.close();db=null;opening=null;}
 };
}
export function backupOf(state,now=Date.now(),{includePreferences=false}={}){return{app:'StudyTimely',schema:SCHEMA,exportedAt:new Date(now).toISOString(),subjects:[...state.subjects],dailyGoal:state.dailyGoal,sessions:structuredClone(state.sessions),workspace:validateWorkspace(state.workspace),...(includePreferences?{preferences:{values:pickPreferences(state.settings),updatedAt:state.preferencesUpdatedAt||0}}:{})};}
export function downloadCSV(text){const blob=new Blob([text],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='studytimely-sessions.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function downloadJSON(data,filename='studytimely-backup.json'){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
