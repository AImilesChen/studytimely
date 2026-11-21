import {packDocument,unpackRecords,diffRecords,rebaseRecords,applyRecords,checkRecords,same,SYNC_BATCH_BYTES,selectSyncBatch} from './cloud-sync.mjs';
import {validateReminder,legacyReminder} from './reminder.mjs';
import {pickPreferences} from './preferences.mjs';
import {emptyState,transition,SCHEMA,DEFAULT_SETTINGS,validateSettings,validateBackup,DomainError,hasProgress} from './model.mjs';
import {validateWorkspace} from './workspace.mjs';
export const DATABASE='studytimely';
export const STORE='local-state';
export const ROOT_KEY='v1';
export const PLANNING_KEY='advanced-planning-v1';
export const SYNC_KEY='automatic-sync-v1';
export const CHANNEL='studytimely-state-v1';
export const SESSION_PREFERENCE_KEYS=['worldClockCities','theme','spaceTheme','ambient','ambientVolume','ambientPresets','timerSize','musicTrack','musicVolume','musicRepeat','musicFavorites','musicQueue','lastTool','lastPage','reducedMotion','sound','volume','clock24','showSeconds','showDate'];
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
 let reminder;try{reminder=validateReminder(value.reminder??(value.timer?.mode==='alarm'?legacyReminder(value.timer):null));}catch(e){throw new DomainError(e.code,e.message);}
 return{...value,reminder,timer:value.timer?.mode==='alarm'?null:value.timer,settings:validateSettings(value.settings),workspace:validateWorkspace(value.workspace)};
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
 async function transaction(change,{syncOnly=false}={}){
   const database=await open();return new Promise((resolve,reject)=>{
     let outcome,originalError;
     const tx=database.transaction(STORE,change?'readwrite':'readonly'),store=tx.objectStore(STORE),request=store.get(ROOT_KEY);
     request.onsuccess=()=>{const side=store.get(PLANNING_KEY);side.onsuccess=()=>{const syncRequest=store.get(SYNC_KEY);syncRequest.onsuccess=()=>{
       try{
         let existing=request.result;const sync=syncRequest.result||freshSync(null,existing?.epoch);
         if(existing&&side.result?.epoch===existing.epoch)existing={...existing,workspace:{...existing.workspace,planning:side.result.planning}};
         if(change){
          outcome=change(existing,sync,store);
          if(!outcome.sync){
           outcome.sync=sync;
           if(existing){
            const before=packDocument(backupOf(existing)),after=packDocument(backupOf(outcome.state));
            if(!same(before,after)){
             if(Object.values(diffRecords(before,after)).some(v=>v===null||v?.deletedAt)||outcome.event==='imported')protect(sync,before,'Before import or deletion');
             if(sync.enabled){sync.pending=pendingFor(sync,after,makeId);sync.changedAt=Date.now();}
            }
           }
          }
          if(!syncOnly){store.put(persistedState(outcome.state),ROOT_KEY);store.put({epoch:outcome.state.epoch,planning:outcome.state.workspace.planning},PLANNING_KEY);}
          outcome.sync.observedRevision=outcome.state.revision;outcome.sync.rootEpoch=outcome.state.epoch;store.put(outcome.sync,SYNC_KEY);
         }else outcome={state:existing?checkState(existing):null,sync,event:null};
       }catch(error){originalError=error;tx.abort();}
     };};};
     tx.oncomplete=()=>{if(change)notify();resolve(outcome);};
     tx.onabort=tx.onerror=()=>reject(originalError||new DomainError('STORAGE','Study data could not be saved. Keep this tab open and try again.'));
   }).catch(error=>{if(error instanceof DomainError)throw error;throw new DomainError('STORAGE','Study data could not be saved. Keep this tab open and try again.');});
 }
 return{
   async load(){const loaded=await transaction(null);if(loaded.state)return loaded.state;return(await transaction(existing=>({state:existing?checkState(existing):emptyState(makeId()),event:null}))).state;},
   async read(){return(await transaction(null)).state;},
   async command(action,context){return transaction((existing,sync)=>{const state=checkState(existing);if(sync.enabled&&sync.observedRevision!==undefined&&sync.observedRevision!==state.revision)throw new DomainError('UPDATE_REQUIRED','An older tab changed this workspace. Close older tabs and review cloud data before syncing.');if(!state.settings.rememberPreferences&&context.sessionSettings)state.settings={...state.settings,...Object.fromEntries(SESSION_PREFERENCE_KEYS.map(k=>[k,context.sessionSettings[k]]))};return transition(state,action,context);});},
   async wipe(){return transaction((existing,sync,store)=>{const state={...emptyState(makeId()),revision:(Number.isInteger(existing?.revision)?existing.revision:0)+1};store.clear();return{state,sync:freshSync(sync.account,state.epoch),event:'cleared'};});},
   async syncInfo(){return transaction(null);},
   async switchAccount(account){
    await open();return new Promise((resolve,reject)=>{
     const tx=db.transaction(STORE,'readwrite'),os=tx.objectStore(STORE),r=os.get(SYNC_KEY);let outcome,failure;
     r.onsuccess=()=>{const saved=r.result||freshSync(null),root=os.get(ROOT_KEY);root.onsuccess=()=>{try{
      const state=checkState(root.result);if(saved.account===account){outcome={state,sync:saved};return;}
      if(hasProgress(state.timer))throw new DomainError('BUSY','Finish or reset your timer before switching account workspaces.');
      const planning=os.get(PLANNING_KEY);planning.onsuccess=()=>{if(planning.result?.epoch===state.epoch)state.workspace.planning=planning.result.planning;
       os.put({state,sync:saved},profileKey(saved.account));const target=os.get(profileKey(account));target.onsuccess=()=>{try{
        const next=target.result?.state?checkState(target.result.state):{...emptyState(makeId()),settings:state.settings};
        next.epoch=makeId();next.revision=state.revision+1;next.timer=null;next.reminder=state.reminder;
        const meta=target.result?.sync||freshSync(account,next.epoch);meta.account=account;meta.rootEpoch=next.epoch;meta.observedRevision=next.revision;
        os.put(next,ROOT_KEY);os.put({epoch:next.epoch,planning:next.workspace.planning},PLANNING_KEY);os.put(meta,SYNC_KEY);outcome={state:next,sync:meta};
       }catch(e){failure=e;tx.abort();}};
      };
     }catch(e){failure=e;tx.abort();}};};
     tx.oncomplete=()=>{notify();resolve(outcome);};tx.onerror=tx.onabort=()=>reject(failure||new DomainError('STORAGE','The account workspace could not be opened.'));
    });
   },
   async guestBackup(){const database=await open();return new Promise((resolve,reject)=>{const tx=database.transaction(STORE),r=tx.objectStore(STORE).get(profileKey(null));r.onsuccess=()=>resolve(r.result?.state?backupOf(r.result.state):null);r.onerror=()=>reject(new DomainError('STORAGE','Guest data could not be read.'));});},
   async configureSync(remote,choice='cloud',guest=null){return transaction((existing,sync)=>{
    if(hasProgress(existing.timer))throw new DomainError('BUSY','Finish or reset your timer before choosing a cloud workspace.');
    const before=packDocument(backupOf(existing)),cloud=remote.records;checkRecords(cloud);protect(sync,before,'Before enabling automatic sync');
    let records=cloud,conflicts={};
    if(choice==='merge'){
     const source=guest?packDocument(guest):before;
     const empty=packDocument(backupOf(emptyState('base'))),merged=rebaseRecords(empty,source,cloud);records=merged.records;conflicts=merged.conflicts;
     protect(sync,source,'Local data before first merge');
    }
    const state=applyCloud(existing,records);Object.assign(sync,{enabled:true,base:cloud,generation:remote.generation,version:remote.version,conflicts,held:null,inflight:null,lastSuccess:Date.now()});sync.pending=pendingFor(sync,records,makeId);return{state,sync};
   });},
   async pauseSync(){return transaction((state,sync)=>{sync.enabled=false;return{state,sync};},{syncOnly:true});},
   async prepareSync(){return transaction((state,sync)=>{
    if(!sync.enabled||sync.held)return{state,sync};
    if(sync.observedRevision!==undefined&&sync.observedRevision!==state.revision)throw new DomainError('UPDATE_REQUIRED','An older tab changed local data. Close older tabs and review cloud data before syncing.');
    const local=packDocument(backupOf(state));sync.pending=pendingFor(sync,local,makeId);
    if(!sync.inflight&&sync.pending)sync.inflight={id:sync.pending.id,generation:sync.pending.generation,version:sync.pending.version,changes:selectSyncBatch(sync.base,sync.pending.changes)};return{state,sync};
   },{syncOnly:true});},
   async receiveSync(remote,{accepted=false,conflict=false}={}){return transaction((state,sync)=>{
    if(remote.accountId!==sync.account)throw new DomainError('ACCOUNT_CHANGED','The signed-in account changed. Sync has stopped.');
    const local=packDocument(backupOf(state));if(sync.observedRevision!==undefined&&sync.observedRevision!==state.revision){protect(sync,local,'Before older-client review');sync.held={records:local,at:Date.now(),reason:'An older tab changed saved data. Close older tabs, download your local changes and reconnect.'};sync.enabled=false;return{state,sync};}
    const cloud=remote.reset?remote.changes:applyRecords(sync.base,remote.changes);checkRecords(cloud);
    if(sync.generation&&sync.generation!==remote.generation){protect(sync,local,'Before cloud reset');sync.held={records:local,at:Date.now()};sync.inflight=null;sync.pending=null;sync.enabled=false;return{state,sync};}
    // Never change the task/plan behind a live timer. Apply after it finishes.
    if(hasProgress(state.timer)&&!same(cloud,sync.base)){sync.deferred=true;return{state,sync};}
    const base=accepted&&sync.inflight?applyRecords(sync.base,sync.inflight.changes):sync.base;
    const merged=rebaseRecords(base,local,cloud);const previous=sync.conflicts||{};
    // Unresolved conflicts remain visible even when the next pull has no changes.
    for(const [k,c]of Object.entries(previous))if(!same(local[k],cloud[k]))merged.conflicts[k]={...c,local:local[k],remote:cloud[k]};
    try{checkRecords(merged.records);}catch{protect(sync,local,'Before linked-data conflict review');sync.held={records:local,at:Date.now(),reason:'Linked plan changes need review. Download local data before reconnecting.'};sync.enabled=false;sync.inflight=null;return{state,sync};}
    if(Object.keys(merged.conflicts).length)protect(sync,local,'Before conflict review');
    sync.base=cloud;sync.version=remote.version;sync.generation=remote.generation;sync.conflicts=merged.conflicts;sync.deferred=false;
    if(accepted||conflict)sync.inflight=null;sync.lastSuccess=Date.now();const next=applyCloud(state,merged.records);sync.pending=pendingFor(sync,merged.records,makeId);return{state:next,sync};
   });},
   async resolveSync(key,choice){return transaction((state,sync)=>{
    const item=sync.conflicts?.[key];if(!item)throw new DomainError('STALE','This conflict has already changed.');
    const local=packDocument(backupOf(state));protect(sync,local,'Before conflict resolution');if(choice==='cloud'){if(item.remote===undefined)delete local[key];else local[key]=item.remote;}
    delete sync.conflicts[key];const next=applyCloud(state,local);sync.pending=pendingFor(sync,local,makeId);return{state:next,sync};
   });},
   async restoreLocal(records,source='Before recovery',expected={}){return transaction((state,sync)=>{
    if(expected.account!==undefined&&expected.account!==sync.account)throw new DomainError('ACCOUNT_CHANGED','The account changed. Open the recovery preview again.');
    if(expected.records&&!same(packDocument(backupOf(state)),expected.records))throw new DomainError('STALE','Your local data changed. Open the recovery preview again.');
    if(hasProgress(state.timer))throw new DomainError('BUSY','Finish your timer before restoring data.');
    checkRecords(records);protect(sync,packDocument(backupOf(state)),source);const next=applyCloud(state,records);sync.pending=pendingFor(sync,records,makeId);return{state:next,sync};
   });},
   close(){db?.close();db=null;opening=null;}
 };
}
export function backupOf(state,now=Date.now(),{includePreferences=false}={}){return{app:'StudyTimely',schema:SCHEMA,exportedAt:new Date(now).toISOString(),subjects:[...state.subjects],dailyGoal:state.dailyGoal,sessions:structuredClone(state.sessions),workspace:validateWorkspace(state.workspace),...(includePreferences?{preferences:{values:pickPreferences(state.settings),updatedAt:state.preferencesUpdatedAt||0}}:{})};}
export function downloadCSV(text,filename='studytimely-sessions.csv'){const blob=new Blob([text],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function downloadJSON(data,filename='studytimely-backup.json'){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

const profileKey=account=>'sync-profile:'+(account||'guest');
const freshSync=(account,rootEpoch)=>({account,rootEpoch,enabled:false,base:{},version:0,generation:null,pending:null,inflight:null,conflicts:{},backups:[],lastSuccess:null});
function protect(sync,records,source){
 const at=Date.now();if(sync.backups?.some(b=>b.source===source&&same(b.records,records)))return;
 sync.backups=[{id:crypto.randomUUID(),at,source,records:structuredClone(records)},...(sync.backups||[])].filter(b=>b.at>at-30*86400000).slice(0,10);
}
function pendingFor(sync,local,makeId){
 const changes=diffRecords(sync.base,local,sync.conflicts);if(!Object.keys(changes).length)return null;
 if(sync.pending&&same(sync.pending.changes,changes)&&sync.pending.version===sync.version)return sync.pending;
 const size=new TextEncoder().encode(JSON.stringify(changes)).length;
 // All pending edits are durable; prepareSync selects complete connected groups.
 return{id:makeId(),generation:sync.generation,version:sync.version,changes,oversized:Object.keys(changes).length>500||size>SYNC_BATCH_BYTES};
}
function applyCloud(state,records){
 const sameData=same(packDocument(backupOf(state)),records);if(sameData)return state;
 const d=checkRecords(records);d.workspace.planning.undo=same(packDocument(backupOf(state)),records)?state.workspace.planning.undo:null;return{...state,subjects:d.subjects,dailyGoal:d.dailyGoal,sessions:d.sessions,workspace:d.workspace,revision:state.revision+1};
}
