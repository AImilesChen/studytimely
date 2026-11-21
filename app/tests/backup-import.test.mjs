import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory} from 'fake-indexeddb';
import {emptyState,transition,makeTimer} from '../src/lib/model.mjs';
import {backupOf,createRepository} from '../src/lib/storage.mjs';
import {packDocument,summaryOf} from '../src/lib/cloud-sync.mjs';
import {readStudyBackup,previewStudyBackup,importStudyBackup} from '../src/lib/backup-import.mjs';
const now=Date.now(),context={now,owner:'qa',id:'new-task'};
const session=id=>({id,mode:'study',subject:'Maths',durationSeconds:60,startedAt:now-60000,endedAt:now,status:'Completed',segments:[[now-60000,now]]});
const task=(state,title,id)=>transition(state,{type:'task-save',epoch:state.epoch,title},{...context,id}).state;

test('backup reader rejects account exports, malformed files and oversized files before a preview',async()=>{
 for(const value of [{account:{email:'qa@example.invalid'}},{automaticSync:{records:{}}}])await assert.rejects(readStudyBackup({size:100,text:async()=>JSON.stringify(value)}),/account data copy/);
 await assert.rejects(readStudyBackup({size:100,text:async()=>'{'}),/not valid JSON/);
 let read=false;await assert.rejects(readStudyBackup({size:5*1024*1024+1,text:async()=>{read=true;}}),/smaller than 5 MB/);assert.equal(read,false);
 const original=backupOf(emptyState('source'));assert.deepEqual(await readStudyBackup({size:100,text:async()=>JSON.stringify(original)}),JSON.parse(JSON.stringify(original)));
});
test('merge preview uses the real import rules, preserves existing IDs and goals, and does not mutate data',()=>{
 const local=task(emptyState('local'),'Existing task','task-a');local.sessions=[session('one')];local.dailyGoal=40;
 const incoming=task(emptyState('file'),'Imported task','task-b');incoming.sessions=[session('one'),session('two')];incoming.dailyGoal=90;
 const previous=JSON.stringify(local),backup=backupOf(incoming),preview=previewStudyBackup(local,backup,{accountId:'account-a',now});
 const actual=transition(local,{type:'import',epoch:local.epoch,backup},context).state;
 assert.equal(JSON.stringify(local),previous);assert.deepEqual(preview.after,summaryOf(packDocument(backupOf(actual))));assert.equal(preview.after.sessions,2);assert.equal(preview.after.tasks,2);assert.equal(actual.dailyGoal,40);assert.equal(preview.accountId,'account-a');
});
test('import preview respects saved deletion records rather than resurrecting old sessions',()=>{
 const local=emptyState('local');local.sessions=[session('one')];const incoming=emptyState('file');incoming.workspace.deletedSessions.one=now;
 const preview=previewStudyBackup(local,backupOf(incoming));assert.equal(preview.after.sessions,0);assert.ok(preview.counts.removed>0);
});
test('account changes, stale data and active timers stop an import before writing',async()=>{
 const local=emptyState('local'),preview=previewStudyBackup(local,backupOf(task(emptyState('file'),'Read','task')), {accountId:'account-a'});let writes=0;
 const store={getSnapshot:async()=>local,command:async()=>{writes++;}};
 await assert.rejects(importStudyBackup(store,preview,'account-b'),/account changed/);
 local.revision++;await assert.rejects(importStudyBackup(store,preview,'account-a'),/changed after/);local.revision--;
 local.timer={...makeTimer('study',local.settings,'timer',now,'qa'),status:'running',startedAt:now};await assert.rejects(importStudyBackup(store,preview,'account-a'),/Finish or reset/);assert.equal(writes,0);
});
test('atomic import rejects a change that occurs after the initial preview check',async()=>{
 let state=emptyState('local');const preview=previewStudyBackup(state,backupOf(task(emptyState('file'),'Read','task')));
 const store={getSnapshot:async()=>state,command:async(type,payload)=>{state=transition(state,{type:'goal',epoch:state.epoch,minutes:55},context).state;return transition(state,{type,epoch:state.epoch,...payload},context);}};
 await assert.rejects(importStudyBackup(store,preview),/changed after the import preview/);assert.equal(state.dailyGoal,55);assert.equal(state.workspace.tasks.length,0);
});
test('local-only import creates a recoverable protection copy without enabling or queuing cloud sync',async()=>{
 const repo=createRepository({indexedDB:new IDBFactory()});try{
  const initial=await repo.load();await repo.command({type:'task-save',epoch:initial.epoch,title:'Before import'},{...context,id:'before'});
  const before=await repo.read(),backup=backupOf(task(emptyState('file'),'Imported task','incoming'));
  const store={getSnapshot:()=>repo.read(),command:async(type,payload)=>repo.command({type,epoch:(await repo.read()).epoch,...payload},context)};
  await importStudyBackup(store,previewStudyBackup(before,backup));let info=(await repo.syncInfo()).sync;
  assert.equal(info.enabled,false);assert.equal(info.pending,null);assert.equal(info.backups.length,1);assert.deepEqual(info.backups[0].records,packDocument(backupOf(before)));
  const after=await repo.read();assert.equal(after.workspace.tasks.length,2);
  await repo.restoreLocal(info.backups[0].records,'Before test recovery',{account:null,records:packDocument(backupOf(after))});
  const restored=await repo.read();assert.deepEqual(restored.workspace.tasks.map(x=>x.title),['Before import']);assert.equal(restored.sessions.length,0);
 }finally{repo.close();}
});
