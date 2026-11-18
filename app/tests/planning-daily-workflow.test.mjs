import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory} from 'fake-indexeddb';
import {createRepository,backupOf} from '../src/lib/storage.mjs';
import {generateStudySchedule} from '../src/lib/planning-engine.mjs';
import {previewRestDay} from '../src/lib/exam-preparation-report.mjs';
import {studyTaskRows} from '../src/lib/planning-plan-view.mjs';
import {planningNextAction} from '../src/lib/planning-next-action.mjs';

test('own-workspace repository workflow survives reload, records real timer intervals once, reopens work and undoes a rest-day replan',async()=>{
 const indexedDB=new IDBFactory();let repo=createRepository({indexedDB,makeId:()=> 'daily-own-workspace'}),data=await repo.load(),now=Date.parse('2026-11-18T12:00Z'),seq=0;
 async function act(type,payload={}){data=await repo.read();const result=await repo.command({type,epoch:data.epoch,expectedRevision:data.workspace.planning.revision,...payload},{now,id:'daily-'+(++seq),owner:'daily-test'});data=result.state;return result;}
 try{
  await act('planning-settings',{settings:{zone:'UTC',maxDailyMinutes:180,focusMinutes:40,minMinutes:15,breakMinutes:5,bufferMinutes:0},windows:[{weekday:3,start:1080,end:1200},{weekday:4,start:1080,end:1200}]});
  await act('planning-goal',{title:'Finish a chapter',subject:'Maths',kind:'course',deadline:'2026-11-26'});const goalId=data.workspace.planning.goals[0].id;
  await act('planning-task',{title:'Practise equations',subject:'Maths',remainingMinutes:40,goalId});const taskId=data.workspace.tasks[0].id;
  const preview=generateStudySchedule(data,{start:'2026-11-18',days:7,goalId},now);
  await act('planning-apply',{recipe:preview.recipe,at:preview.at,fingerprint:preview.fingerprint});const block=data.workspace.planning.blocks.find(b=>!b.deletedAt);
  repo.close();repo=createRepository({indexedDB});data=await repo.load();assert.equal(data.workspace.tasks[0].id,taskId);assert.equal(data.workspace.planning.blocks.find(b=>!b.deletedAt).id,block.id);assert.equal(planningNextAction(studyTaskRows(data,now),now).kind,'future');
  now=block.startAt;await act('workspace-start',{taskId,planningBlockId:block.id,mode:'study'});assert.equal(planningNextAction(studyTaskRows(data,now),now).kind,'active');
  const running=JSON.stringify(data);await assert.rejects(act('planning-block',{itemId:block.id,locked:true}),/timer/);assert.equal(JSON.stringify(await repo.read()),running);
  now+=60000;await act('finish');assert.equal(data.sessions.length,1);assert.equal(data.sessions[0].durationSeconds,60);assert.equal(planningNextAction(studyTaskRows(data,now),now).kind,'feedback');
  await act('planning-feedback',{taskId,blockId:block.id,done:true,remainingMinutes:0});assert.equal(data.workspace.tasks[0].done,true);
  const completed=JSON.stringify(data);await assert.rejects(act('planning-task',{taskId,goalId,reopen:true,remainingMinutes:0}),/positive/);assert.equal(JSON.stringify(await repo.read()),completed);
  await act('planning-task',{taskId,goalId,title:'Practise equations',subject:'Maths',reopen:true,remainingMinutes:30});assert.equal(data.workspace.tasks[0].done,false);assert.equal(data.workspace.planning.blocks.find(b=>b.id===block.id).status,'reviewed');assert.equal(data.sessions.length,1);
  const rest=previewRestDay(data,'2026-11-18',now);await act('planning-apply',{recipe:rest.recipe,at:rest.at,fingerprint:rest.fingerprint,restDate:rest.restDate});assert.ok(data.workspace.planning.exceptions.some(e=>!e.deletedAt&&e.kind==='off'));
  await act('planning-undo');assert.ok(!data.workspace.planning.exceptions.some(e=>!e.deletedAt&&e.kind==='off'));assert.equal(data.sessions.length,1);
  const backup=backupOf(data);assert.equal(backup.sessions[0].durationSeconds,60);
  repo.close();repo=createRepository({indexedDB});data=await repo.load();assert.equal(data.sessions.length,1);assert.equal(data.workspace.tasks.find(t=>t.id===taskId).done,false);assert.equal(data.workspace.planning.rules.find(r=>r.id===taskId).remainingMinutes,30);
 }finally{repo.close();}
});
