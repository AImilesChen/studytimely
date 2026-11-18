import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory} from 'fake-indexeddb';
import {createRepository,backupOf} from '../src/lib/storage.mjs';
import {analysisRange,studyAnalysis,newReview} from '../src/lib/study-analysis.mjs';
const at=Date.UTC(2026,10,18,9);
test('a complete learning/review/backup workflow persists across repository reload',async()=>{
 const indexedDB=new IDBFactory(),repo=createRepository({indexedDB});let state=await repo.load(),n=0,clock=at;const command=async(type,fields={})=>{const r=await repo.command({type,epoch:state.epoch,...fields},{now:clock,id:'local-'+(++n),owner:'tab'});state=r.state;return r;};
 await command('goal',{minutes:25});await command('task-save',{title:'Read a chapter',subject:'Biology',estimateMinutes:25,plannedDate:'2026-11-18'});const task=state.workspace.tasks[0];await command('workspace-start',{taskId:task.id,mode:'study'});clock+=1500000;await command('finish',{timerId:state.timer.id});await command('task-save',{...task,itemId:task.id,done:true});const range=analysisRange({period:'week',zone:'Europe/London',now:clock+1}),report=studyAnalysis(state,range);assert.equal(report.total,1500);assert.equal(report.tasks.completed,1);const review=newReview(report,state,'week',clock);review.good='I finished the chapter';await command('review-save',{review});await command('analytics-zone',{zone:'Europe/London'});const backup=backupOf(state);repo.close();
 const restored=createRepository({indexedDB}),loaded=await restored.load();assert.equal(loaded.workspace.learning.reviews[0].good,review.good);assert.equal(loaded.workspace.learning.reviews[0].snapshot.total,1500);assert.equal(loaded.workspace.learning.zone,'Europe/London');assert.deepEqual(backup.workspace.learning,loaded.workspace.learning);restored.close();
});
test('concurrent same-millisecond review writes cannot overwrite each other silently',async()=>{
 const indexedDB=new IDBFactory(),a=createRepository({indexedDB}),b=createRepository({indexedDB});let s=await a.load();await b.load();const review=newReview(studyAnalysis(s,analysisRange({period:'week',zone:'UTC',now:at})),s,'week',at),r=await a.command({type:'review-save',epoch:s.epoch,review},{now:at,id:'review',owner:'a'}),saved=r.state.workspace.learning.reviews[0];
 const results=await Promise.allSettled([a,b].map((repo,i)=>repo.command({type:'review-save',epoch:s.epoch,itemId:saved.id,expectedUpdatedAt:saved.updatedAt,review:{...saved,good:'writer '+i}},{now:at,id:'update-'+i,owner:String(i)})));assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected').length,1);assert.match(results.find(r=>r.status==='rejected').reason.message,/another tab/);a.close();b.close();
});
test('same-millisecond task toggles retain causal event order without inventing timestamps',async()=>{
 const indexedDB=new IDBFactory(),repo=createRepository({indexedDB});let s=await repo.load();const cmd=async(type,fields,id)=>{const r=await repo.command({type,epoch:s.epoch,...fields},{now:at,id,owner:'a'});s=r.state;};
 await cmd('task-save',{title:'A task',estimateMinutes:20},'z-create');const task=s.workspace.tasks[0];await cmd('task-save',{...task,itemId:task.id,done:true},'y-complete');await cmd('task-save',{...task,itemId:task.id,done:false},'a-reopen');const report=studyAnalysis(s,analysisRange({period:'today',zone:'UTC',now:at+1}));assert.equal(report.tasks.completed,1);assert.equal(s.workspace.learning.events.filter(e=>e.kind==='task').at(-1).done,false);assert.ok(s.workspace.learning.events.every(e=>e.at===at));repo.close();
});
