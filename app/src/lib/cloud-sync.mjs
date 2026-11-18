import {validateBackup,DomainError} from './model.mjs';
export const SYNC_PROTOCOL=1;
export const SYNC_MAX_BYTES=4*1024*1024;
export const SYNC_BATCH_BYTES=512*1024;
export const SYNC_RECORD_BYTES=128*1024;
export const COLLECTIONS=['sessions','workspace.tasks','workspace.habits','workspace.plans','workspace.blocks','workspace.exams','workspace.planning.availability','workspace.planning.exceptions','workspace.planning.goals','workspace.planning.rules','workspace.planning.blocks','workspace.planning.feedback','workspace.planning.examPlans','workspace.learning.events','workspace.learning.reviews'];
export const canonical=value=>JSON.stringify(value,(_k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
export const same=(a,b)=>canonical(a)===canonical(b);
const clone=v=>v===undefined?undefined:structuredClone(v);
const bytes=v=>new TextEncoder().encode(JSON.stringify(v)).length;
export const recordKey=(path,id)=>path+':'+encodeURIComponent(id);
function slot(object,path){const keys=path.split('.'),last=keys.pop();return[ keys.reduce((o,k)=>o[k],object),last];}
export function syncDocument(input){const valid=validateBackup(input);return {app:'StudyTimely',schema:1,...valid};}
export function packDocument(input){
 const document=syncDocument(input);delete document.preferences;const out={};
 for(const path of COLLECTIONS){const [parent,key]=slot(document,path);for(const value of parent[key]||[])out[recordKey(path,value.id)]=value;parent[key]=[];}
 for(const [id,at]of Object.entries(document.workspace.deletedSessions))out[recordKey('deletedSessions',id)]=at;
 document.workspace.deletedSessions={};document.workspace.planning.undo=null;out.meta=document;return out;
}
export function unpackRecords(records){
 if(!records.meta)throw new DomainError('INVALID','This sync workspace has no metadata.');
 const document=clone(records.meta);
 for(const path of COLLECTIONS){const [parent,key]=slot(document,path);parent[key]=[];}
 document.workspace.deletedSessions={};
 for(const [key,value]of Object.entries(records)){if(key==='meta'||value===null)continue;const split=key.indexOf(':'),path=key.slice(0,split),id=decodeURIComponent(key.slice(split+1));
  if(path==='deletedSessions'){document.workspace.deletedSessions[id]=value;continue;}
  if(!COLLECTIONS.includes(path)||value?.id!==id)throw new DomainError('INVALID','Invalid sync record.');const [parent,field]=slot(document,path);parent[field].push(clone(value));
 }
 document.sessions=document.sessions.filter(s=>!Object.hasOwn(document.workspace.deletedSessions,s.id)).sort((a,b)=>b.endedAt-a.endedAt);
 return syncDocument(document);
}
export function validSyncKey(key){
 if(key==='meta')return true;const split=key.indexOf(':'),path=key.slice(0,split);if(!COLLECTIONS.includes(path)&&path!=='deletedSessions')return false;
 try{const id=decodeURIComponent(key.slice(split+1));return !!id&&id.length<=200&&recordKey(path,id)===key;}catch{return false;}
}
export function checkRecords(records){
 if(!records||Array.isArray(records)||Object.keys(records).length>40000)throw new DomainError('SYNC_LIMIT','Too many cloud records.');
 for(const [key,value]of Object.entries(records))if(!validSyncKey(key)||key.length>650||bytes(value)>SYNC_RECORD_BYTES)throw new DomainError('SYNC_LIMIT','One item is too large to sync. Download a JSON backup.');
 const document=unpackRecords(records);if(bytes(document)>SYNC_MAX_BYTES)throw new DomainError('SYNC_LIMIT','Automatic sync supports a 4 MiB workspace. Export a backup for larger histories.');return document;
}
export function diffRecords(base,next,excluded={}){const out={};for(const k of new Set([...Object.keys(base),...Object.keys(next)]))if(!excluded[k]&&!same(base[k]??null,next[k]??null))out[k]=next[k]??null;return out;}
export function applyRecords(base,changes){const out=clone(base);for(const [k,v]of Object.entries(changes))if(v===null)delete out[k];else out[k]=clone(v);return out;}
// Three-way fields, never device-clock last-write-wins. Deletion beats stale edits.
export function mergeValue(base,local,remote,path='',conflicts=[]){
 if(same(local,remote))return clone(local);if(same(local,base))return clone(remote);if(same(remote,base))return clone(local);
 if(base!==undefined&&(local===undefined||remote===undefined))return undefined;
 if(local?.deletedAt||remote?.deletedAt){if(!base?.deletedAt)return clone(local?.deletedAt?local:remote);}
 if(Array.isArray(local)&&Array.isArray(remote)&&[...local,...remote,...(Array.isArray(base)?base:[])].every(x=>typeof x==='string')){const old=new Set(base||[]),a=new Set(local),b=new Set(remote);return[...new Set([...remote,...local])].filter(x=>!old.has(x)||(a.has(x)&&b.has(x)));}
 if(Array.isArray(local)&&Array.isArray(remote)&&[...local,...remote,...(Array.isArray(base)?base:[])].every(x=>x&&typeof x.id==='string')){
  const a=new Map(local.map(x=>[x.id,x])),b=new Map(remote.map(x=>[x.id,x])),c=new Map((base||[]).map(x=>[x.id,x]));return[...new Set([...b.keys(),...a.keys()])].map(id=>mergeValue(c.get(id),a.get(id),b.get(id),path+'.'+id,conflicts)).filter(x=>x!==undefined);
 }
 if(local&&remote&&typeof local==='object'&&typeof remote==='object'&&!Array.isArray(local)&&!Array.isArray(remote)){
  const out={};for(const key of new Set([...Object.keys(base||{}),...Object.keys(local),...Object.keys(remote)])){
   if(key==='startedAt'&&typeof local[key]==='number'&&typeof remote[key]==='number'){out[key]=Math.min(...[local[key],remote[key]].filter(Boolean))||0;continue;}
   if(['updatedAt','revision','goalUpdatedAt','zoneUpdatedAt'].includes(key)&&typeof local[key]==='number'&&typeof remote[key]==='number'){out[key]=Math.max(local[key],remote[key]);continue;}
   const v=mergeValue(base?.[key],local[key],remote[key],path?path+'.'+key:key,conflicts);if(v!==undefined)out[key]=v;
  }return out;
 }
 conflicts.push({field:path,local:clone(local),remote:clone(remote)});return clone(local);
}
export function rebaseRecords(base,local,remote){
 const records={},conflicts={};for(const key of new Set([...Object.keys(base),...Object.keys(local),...Object.keys(remote)])){
  const fields=[],value=mergeValue(base[key],local[key],remote[key],key,fields);if(value!==undefined)records[key]=value;
  if(fields.length)conflicts[key]={key,base:clone(base[key]),local:clone(local[key]),remote:clone(remote[key]),fields};
 }
 // Session deletion markers are authoritative across independent session records.
 for(const [key,value]of Object.entries(records))if(key.startsWith('deletedSessions:')&&value)delete records['sessions:'+key.slice(16)];
 return{records,conflicts};
}
export function recordLabel(key,value){return value?.title||value?.taskTitle||value?.subject||(key==='meta'?'Goals and workspace settings':key.startsWith('sessions:')?'Study session':key.split(':')[0].split('.').at(-1));}
export function summaryOf(records){const d=unpackRecords(records);return{sessions:d.sessions.length,tasks:d.workspace.tasks.filter(x=>!x.deletedAt).length,plans:d.workspace.planning.goals.filter(x=>!x.deletedAt).length,minutes:Math.floor(d.sessions.reduce((n,s)=>n+s.durationSeconds,0)/60)};}
export function recoveryChanges(current,target){const changes=diffRecords(current,target);return Object.entries(changes).map(([key,value])=>({key,label:recordLabel(key,value||current[key]),kind:value===null?'remove':!current[key]?'add':'change',value}));}
export function recoverySelection(current,source,keys,now=Date.now()){
 const selected=new Set(keys),allKeys=Object.keys(source);let again=true;
 while(again){again=false;for(const key of [...selected]){const v=source[key];if(!v||typeof v!=='object')continue;
  const ids=[v.taskId,v.planId,v.goalId,v.examId,v.examPlanId,v.ruleId,v.chapterId,v.planningBlockId,v.blockId,v.sourcePlanId,v.sourceChapterId,...(v.dependsOn||[]),...(v.taskIds||[]),...(v.topics||[]).flatMap(t=>[t.learnTaskId,t.sourcePlanId,t.sourceChapterId])].filter(Boolean);
  if(key.startsWith('workspace.tasks:')){const rule=recordKey('workspace.planning.rules',v.id);if(source[rule]&&!selected.has(rule)){selected.add(rule);again=true;}}
  if(key.startsWith('workspace.planning.rules:')){const task=recordKey('workspace.tasks',v.id);if(source[task]&&!selected.has(task)){selected.add(task);again=true;}}
  for(const id of ids)for(const k of allKeys.filter(x=>x.endsWith(':'+encodeURIComponent(id))||source[x]?.chapters?.some(c=>c.id===id))){if(!selected.has(k)){selected.add(k);again=true;}}
  // Restoring a plan includes its owned tasks, rules and scheduled blocks.
  if(key.startsWith('workspace.planning.goals:')||key.startsWith('workspace.planning.examPlans:'))for(const k of allKeys){const r=source[k];if(r&&[r.goalId,r.planId,r.examPlanId].includes(v.id)&&!selected.has(k)){selected.add(k);again=true;}}
 }}
 const result=clone(current);for(const key of selected){if(!source[key])continue;result[key]=clone(source[key]);if(result[key]?.deletedAt){result[key].deletedAt=0;result[key].updatedAt=now;}
  if(key.startsWith('workspace.planning.examPlans:')||result[key]?.prep)result.meta.workspace.planning.version=Math.max(2,result.meta.workspace.planning.version);
  if(key.startsWith('sessions:'))delete result['deletedSessions:'+key.slice(9)];
 }
 checkRecords(result);return{records:result,keys:[...selected]};
}

// Pack independent records into bounded requests while keeping connected plans,
// task rules, prerequisites and generated blocks in one atomic batch.
export function selectSyncBatch(base,changes){
 const keys=Object.keys(changes),parent=new Map(keys.map(k=>[k,k])),aliases=new Map(),refs=new Map();
 const find=k=>{let root=k;while(parent.get(root)!==root)root=parent.get(root);while(k!==root){const next=parent.get(k);parent.set(k,root);k=next;}return root;};
 const join=(a,b)=>parent.set(find(a),find(b));
 for(const key of keys){const ids=new Set(),links=new Set(),id=key.includes(':')?decodeURIComponent(key.slice(key.indexOf(':')+1)):'';if(id)ids.add(id);
  const walk=(value,field='')=>{if(!value||typeof value!=='object')return;for(const [name,v]of Object.entries(value)){if(name==='id'&&typeof v==='string')ids.add(v);else if((name.endsWith('Id')||name==='dependsOn')&&v){for(const ref of Array.isArray(v)?v:[v])if(typeof ref==='string')links.add(ref);}if(v&&typeof v==='object')walk(v,name);}};
  if(!key.startsWith('sessions:'))walk(changes[key]||base[key]);for(const id of ids){if(aliases.has(id))join(key,aliases.get(id));else aliases.set(id,key);}refs.set(key,links);
 }
 for(const [key,links]of refs)for(const id of links)if(aliases.has(id))join(key,aliases.get(id));
 const groups=new Map();for(const key of keys){const root=find(key);if(!groups.has(root))groups.set(root,[]);groups.get(root).push(key);}
 const selected={},chosen=[];let count=0,totalBytes=2,blocked=false;
 for(const group of groups.values()){
  const values=Object.fromEntries(group.map(k=>[k,changes[k]])),extra=bytes(values)-2+(count?1:0);
  if(count+group.length>500||totalBytes+extra>SYNC_BATCH_BYTES){blocked=true;continue;}
  Object.assign(selected,values);chosen.push(values);count+=group.length;totalBytes+=extra;
 }
 // The common case validates once, including histories with thousands of rows.
 try{if(count){checkRecords(applyRecords(base,selected));return selected;}}catch{}
 // A dependency on data outside this batch may need to wait. Keep safe independent groups.
 const safe={};for(const group of chosen){try{checkRecords(applyRecords(base,{...safe,...group}));Object.assign(safe,group);}catch{blocked=true;}}
 if(!Object.keys(safe).length&&keys.length)throw new DomainError('SYNC_LIMIT',blocked?'Linked changes cannot fit safely in one sync batch. Other independent edits can still sync; download a backup before reducing the import.':'No changes are ready to sync.');
 return safe;
}
