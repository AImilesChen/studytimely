import test from 'node:test';import assert from 'node:assert/strict';
import {emptyState,transition,validateBackup} from '../src/lib/model.mjs';
import {backupOf,createRepository,DATABASE,STORE,ROOT_KEY} from '../src/lib/storage.mjs';
import {IDBFactory} from 'fake-indexeddb';
import {previewPreparation,previewRestDay,examPreparationReport} from '../src/lib/exam-preparation-report.mjs';
import {generateStudySchedule,planningFingerprint,planningCapacity} from '../src/lib/planning-engine.mjs';
import {preparationDeadline} from '../src/lib/exam-preparation.mjs';
import {validatePlanning,mergePlanning,losesPlanningHistory} from '../src/lib/planning-schema.mjs';
const now=Date.parse('2026-11-18T12:00Z');
const draft=(patch={})=>({exam:{title:'Maths paper',subject:'Maths',date:'2026-12-02'},topics:[{title:'Algebra',minutes:40,confidence:'new'},{title:'Graphs',minutes:30,confidence:'weak'}],rounds:1,gapDays:2,mockMinutes:90,importance:'normal',windows:Array.from({length:7},(_,i)=>({weekday:i+1,start:1080,end:1260})),settings:{zone:'UTC',maxDailyMinutes:180},...patch});
let sequence=0;const act=(state,type,payload={},id='action-'+(++sequence),time=now)=>transition(state,{type,epoch:state.epoch,expectedRevision:state.workspace.planning.revision,...payload},{now:time,id,owner:'test'}).state;
function save(data=emptyState('exam-test'),d=draft(),id='preparation'){const p=previewPreparation(data,d,id,now);return act(data,'planning-preparation',{basis:p.basis,draftId:id,draft:d,apply:true,at:now,recipe:p.schedule.recipe},id+':save');}
test('four-step draft previews are isolated; save atomically creates linked exam, activities and dated arrangements',()=>{
 const original=emptyState('own'),before=JSON.stringify(original),p=previewPreparation(original,draft(),'exam-plan',now);assert.equal(JSON.stringify(original),before);assert.equal(p.data.workspace.exams.length,1);assert.equal(p.data.workspace.planning.examPlans.length,1);assert.equal(p.data.sessions.length,0);
 const data=save(original,draft(),'exam-plan');assert.equal(data.workspace.planning.version,2);assert.equal(data.workspace.exams.length,1);assert.ok(data.workspace.planning.blocks.length>0);assert.equal(data.sessions.length,0);assert.equal(data.timer,null);validateBackup(backupOf(data));assert.equal(examPreparationReport(data,'exam-plan',now).stale,false);
 assert.throws(()=>act(data,'planning-preparation',{basis:planningFingerprint(data),draftId:'exam-plan',draft:draft()}),/already saved/);
});
test('review rounds obey a calendar-day gap after their prerequisites; mock papers remain in one continuous block',()=>{
 const data=save(),p=data.workspace.planning,learn=p.rules.find(r=>r.prep.stage==='learn'),review=p.rules.find(r=>r.prep.stage==='review'&&r.prep.topicId===learn.prep.topicId),blocks=p.blocks.filter(b=>!b.deletedAt),learnEnd=Math.max(...blocks.filter(b=>b.taskId===learn.id).map(b=>b.endAt)),reviewStart=Math.min(...blocks.filter(b=>b.taskId===review.id).map(b=>b.startAt));
 assert.ok(reviewStart>=Date.parse(new Date(learnEnd+2*86400000).toISOString().slice(0,10)+'T00:00Z'));
 const mock=p.rules.find(r=>r.prep.stage==='mock'),ms=blocks.filter(b=>b.taskId===mock.id);assert.equal(ms.length,1);assert.equal((ms[0].endAt-ms[0].startAt)/60000,90);
});
test('overlapping preparations share one capacity and preserved sessions count toward the daily focus limit',()=>{
 let data=save(undefined,draft({mockMinutes:0}),'first');data=save(data,draft({exam:{title:'English paper',date:'2026-11-28'},mockMinutes:0,topics:[{title:'Essay',minutes:200,confidence:'new'}],settings:{maxDailyMinutes:60}}),'second');
 const blocks=data.workspace.planning.blocks.filter(b=>!b.deletedAt&&b.status==='planned').sort((a,b)=>a.startAt-b.startAt);for(let i=1;i<blocks.length;i++)assert.ok(blocks[i].startAt>=blocks[i-1].endAt);const days=new Map();for(const b of blocks){const day=new Date(b.startAt).toISOString().slice(0,10);days.set(day,(days.get(day)||0)+(b.endAt-b.startAt)/60000);}assert.ok([...days.values()].every(n=>n<=60));
 const b=blocks[0];data=act(data,'planning-block',{itemId:b.id,locked:true});const result=generateStudySchedule(data,{start:'2026-11-18',days:14},now);const sameDay=result.blocks.filter(x=>new Date(x.startAt).toISOString().slice(0,10)===new Date(b.startAt).toISOString().slice(0,10));assert.ok(sameDay.reduce((n,x)=>n+(x.endAt-x.startAt)/60000,0)+(b.endAt-b.startAt)/60000<=60);
});
test('missing time excludes the exam day, later exam edits inherit the new deadline and archived exams pause new starts',()=>{
 let data=save(),p=data.workspace.planning,prep=p.examPlans[0],exam=data.workspace.exams[0];assert.equal(preparationDeadline(data,prep),Date.parse('2026-12-02T00:00Z'));
 data=act(data,'exam-save',{...exam,itemId:exam.id,date:'2026-12-06'});assert.equal(preparationDeadline(data,data.workspace.planning.examPlans[0]),Date.parse('2026-12-06T00:00Z'));assert.equal(examPreparationReport(data,prep.id,now).stale,true);
 exam=data.workspace.exams[0];data=act(data,'exam-status',{itemId:exam.id,expectedUpdatedAt:exam.updatedAt,archived:true});assert.equal(examPreparationReport(data,prep.id,now).paused,true);assert.throws(()=>act(data,'workspace-start',{taskId:data.workspace.tasks[0].id,mode:'study'}),/paused/);
});
test('topic coverage is unique and completion or simulated time never changes self-assessed mastery',()=>{
 let data=save(),p=data.workspace.planning,learn=p.rules.find(r=>r.prep.stage==='learn'),review=p.rules.find(r=>r.prep.stage==='review');assert.equal(examPreparationReport(data,p.goals[0].id,now).covered,1);
 data=act(data,'planning-feedback',{taskId:learn.id,remainingMinutes:0,done:true});assert.equal(examPreparationReport(data,p.goals[0].id,now).covered,2);data=act(data,'planning-feedback',{taskId:review.id,remainingMinutes:0,done:true});assert.equal(examPreparationReport(data,p.goals[0].id,now).covered,2);assert.equal(data.workspace.planning.examPlans[0].topics[0].confidence,'new');assert.equal(data.sessions.length,0);
});
test('unavailable days preview without mutation and apply/undo restores both arrangements and the day exception',()=>{
 let data=save(),before=JSON.stringify(data),preview=previewRestDay(data,'2026-11-18',now);assert.equal(JSON.stringify(data),before);assert.ok(!preview.blocks.some(b=>new Date(b.startAt).toISOString().startsWith('2026-11-18')));
 data=act(data,'planning-apply',{recipe:preview.recipe,at:preview.at,fingerprint:preview.fingerprint,restDate:preview.restDate},'rest');assert.ok(data.workspace.planning.exceptions.some(e=>e.date==='2026-11-18'&&!e.deletedAt));data=act(data,'planning-undo');assert.ok(!data.workspace.planning.exceptions.some(e=>e.date==='2026-11-18'&&!e.deletedAt));assert.equal(data.sessions.length,0);
});
test('versioned preparations and concurrent topic changes survive backup/merge and reject stripping by older clients',()=>{
 const data=save(),p=data.workspace.planning,a=structuredClone(p),b=structuredClone(p);a.examPlans[0].topics[0].confidence='confident';a.examPlans[0].topics[0].updatedAt=now+100;b.examPlans[0].topics[1].confidence='new';b.examPlans[0].topics[1].updatedAt=now+200;
 const merged=mergePlanning(a,b);assert.equal(merged.examPlans[0].topics[0].confidence,'confident');assert.equal(merged.examPlans[0].topics[1].confidence,'new');const stripped=structuredClone(data);stripped.workspace.planning.version=1;stripped.workspace.planning.examPlans=[];assert.equal(losesPlanningHistory(data,stripped),true);assert.throws(()=>validatePlanning({...p,version:1}),/Update/);
});
test('capacity shortage and a missing continuous mock window are explicit, without silently shortening work',()=>{
 const p=previewPreparation(emptyState('shortage'),draft({windows:[{weekday:3,start:1080,end:1110}],settings:{maxDailyMinutes:30}}),'limited',now);assert.ok(p.budget.shortfall>0);assert.ok(p.schedule.unscheduled.some(r=>/continuous/.test(r.reason)));assert.equal(p.data.workspace.tasks.find(t=>t.title==='Timed practice paper').estimateMinutes,90);assert.equal(p.data.sessions.length,0);
});
test('optional activities can be left out and restored without completing tasks or losing study history',()=>{
 let data=save(undefined,draft({rounds:2,mockMinutes:0})),p=data.workspace.planning,r=p.rules.find(r=>r.prep.stage==='review'&&r.prep.round===1),before=examPreparationReport(data,p.goals[0].id,now).remaining;
 data=act(data,'planning-prep-omit',{taskId:r.id,omitted:true});const affected=data.workspace.planning.rules.filter(x=>x.id===r.id||x.dependsOn.includes(r.id));assert.ok(affected.every(x=>x.prep.omitted));assert.ok(affected.every(x=>!data.workspace.tasks.find(t=>t.id===x.id).done));assert.ok(examPreparationReport(data,p.goals[0].id,now).remaining<before);assert.equal(data.sessions.length,0);
 data=act(data,'planning-prep-omit',{taskId:r.id,omitted:false});assert.ok(data.workspace.planning.rules.filter(x=>x.id===r.id||x.dependsOn.includes(r.id)).every(x=>!x.prep.omitted));
});
test('manual changes preserve review gaps and uninterrupted paper duration',()=>{
 let data=save(undefined,draft({topics:[{title:'Algebra',minutes:40,confidence:'new'}],mockMinutes:0})),p=data.workspace.planning,r=p.rules.find(r=>r.prep.stage==='review'),b=p.blocks.find(b=>b.taskId===r.id&&!b.deletedAt),capacity=planningCapacity(data,{start:'2026-11-19',days:1,now,keep:p.blocks.filter(x=>x.id!==b.id&&!x.deletedAt&&x.status==='planned')}),slot=capacity.days[0].slots.find(s=>(s.endAt-s.startAt)/60000>=20);
 assert.throws(()=>act(data,'planning-block',{itemId:b.id,startAt:slot.startAt,endAt:slot.startAt+20*60000}),/review interval/);
 data=save();p=data.workspace.planning;r=p.rules.find(r=>r.prep.stage==='mock');b=p.blocks.find(b=>b.taskId===r.id&&!b.deletedAt);assert.throws(()=>act(data,'planning-block',{itemId:b.id,startAt:b.startAt,endAt:b.startAt+30*60000}),/continuous/);
});
test('a stale wizard preview is rejected atomically and linked sources keep their original identity',()=>{
 let data=emptyState('stale'),preview=previewPreparation(data,draft(),'p',now);data=act(data,'exam-save',{title:'Other exam',date:'2026-12-01'},'other');const before=JSON.stringify(data);assert.throws(()=>act(data,'planning-preparation',{basis:preview.basis,draftId:'p',draft:draft(),apply:true,at:now,recipe:preview.schedule.recipe}),/changed/);assert.equal(JSON.stringify(data),before);
});
test('rest-day changes and optional-scope changes protect a real active timer and locked sessions',()=>{
 let data=save(),b=data.workspace.planning.blocks.find(b=>!b.deletedAt&&new Date(b.startAt).toISOString().startsWith('2026-11-18'));data=act(data,'workspace-start',{taskId:b.taskId,planningBlockId:b.id,mode:'study'},'timer');const timer=structuredClone(data.timer),preview=previewRestDay(data,'2026-11-18',now);assert.ok(!preview.replaceIds.includes(b.id));data=act(data,'planning-apply',{recipe:preview.recipe,at:preview.at,fingerprint:preview.fingerprint,restDate:preview.restDate},'rest-active');assert.deepEqual(data.timer,timer);assert.ok(data.workspace.planning.blocks.some(x=>x.id===b.id&&!x.deletedAt));assert.equal(data.sessions.length,0);
});


test('changing a previously familiar topic to new creates one linked study activity before its review',()=>{
 let data=save(),prep=data.workspace.planning.examPlans[0],topic=prep.topics.find(t=>!t.learnTaskId),before=data.workspace.tasks.length;data=act(data,'planning-prep-topic',{itemId:prep.id,topicId:topic.id,confidence:'new'});const saved=data.workspace.planning.examPlans[0].topics.find(t=>t.id===topic.id);assert.ok(saved.learnTaskId);assert.equal(data.workspace.tasks.length,before+1);assert.ok(data.workspace.planning.rules.find(r=>r.prep.topicId===topic.id&&r.prep.stage==='review').dependsOn.includes(saved.learnTaskId));data=act(data,'planning-prep-topic',{itemId:prep.id,topicId:topic.id,confidence:'new'});assert.equal(data.workspace.tasks.length,before+1);assert.equal(data.sessions.length,0);
});
test('the versioned local companion preserves exam preparation across an old root rewrite and a reset cannot revive it',async()=>{
 const indexedDB=new IDBFactory(),repo=createRepository({indexedDB,makeId:()=> 'local-prep'}),start=await repo.load(),d=draft(),preview=previewPreparation(start,d,'saved-prep',now);
 await repo.command({type:'planning-preparation',epoch:start.epoch,expectedRevision:0,basis:preview.basis,draftId:'saved-prep',draft:d,apply:true,at:now,recipe:preview.schedule.recipe},{now,id:'create',owner:'test'});
 const raw=await new Promise((resolve,reject)=>{const request=indexedDB.open(DATABASE,1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});const old=structuredClone(await repo.read());old.workspace.planning.version=1;old.workspace.planning.examPlans=[];old.workspace.planning.rules.forEach(r=>delete r.prep);
 const put=value=>new Promise(resolve=>{const tx=raw.transaction(STORE,'readwrite');tx.objectStore(STORE).put(value,ROOT_KEY);tx.oncomplete=resolve;});await put(old);assert.equal((await repo.read()).workspace.planning.version,2);assert.equal((await repo.read()).workspace.planning.examPlans.length,1);
 old.epoch='reset-in-an-old-tab';await put(old);assert.equal((await repo.read()).workspace.planning.examPlans.length,0);repo.close();raw.close();
});


test('an early real study record keeps its planned session until the learner saves feedback',()=>{
 let data=save(),b=data.workspace.planning.blocks.find(b=>!b.deletedAt);data=act(data,'workspace-start',{taskId:b.taskId,planningBlockId:b.id,mode:'study'},'early');data=act(data,'finish',{},'finish-early',now+60000);assert.equal(data.sessions.length,1);const preview=generateStudySchedule(data,{start:'2026-11-18',days:14},now+60000);assert.ok(!preview.replaceIds.includes(b.id));assert.throws(()=>act(data,'planning-block',{itemId:b.id,status:'skipped'},'skip',now+60000),/feedback/);data=act(data,'planning-feedback',{taskId:b.taskId,blockId:b.id,remainingMinutes:10,done:false},'feedback-early',now+60000);assert.equal(data.workspace.planning.blocks.find(x=>x.id===b.id).status,'reviewed');assert.equal(data.sessions.length,1);
});
