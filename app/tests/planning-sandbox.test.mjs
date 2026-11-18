import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,transition,validateBackup} from '../src/lib/model.mjs';
import {backupOf} from '../src/lib/storage.mjs';
import {createPlanningSandbox,sandboxCommand,planningSessionStage} from '../src/lib/planning-sandbox.mjs';
import {generateStudySchedule} from '../src/lib/planning-engine.mjs';
import {zonedDay} from '../src/lib/study-analysis.mjs';
const now=Date.parse('2026-11-18T12:00Z');
function sandbox(){let state=createPlanningSandbox(now,'UTC'),n=0;return{get state(){return state;},act(type,payload){state=sandboxCommand(state,type,payload,now,'sandbox-'+(++n));return state;}};}
test('editable example spreads three recognisable whole tasks over three days without importing fake records',()=>{
 const s=sandbox(),p=s.state.data.workspace.planning;
 assert.deepEqual(s.state.data.workspace.tasks.map(t=>t.estimateMinutes),[40,50,30]);
 assert.equal(p.blocks.length,3);assert.equal(new Set(p.blocks.map(b=>zonedDay(b.startAt,'UTC'))).size,3);
 assert.equal(s.state.data.sessions.length,0);assert.equal(s.state.data.timer,null);validateBackup(backupOf(s.state.data));
});
test('example editing, preview/apply, simulated study and feedback leave the real workspace and actual records untouched',()=>{
 const real=emptyState('real'),before=JSON.stringify(real),s=sandbox(),task=s.state.data.workspace.tasks[0];
 s.act('planning-task',{taskId:task.id,title:'Read textbook examples',subject:'Maths',remainingMinutes:45,goalId:'example-goal'});
 const preview=generateStudySchedule(s.state.data,{start:'2026-11-18',days:7},now);
 s.act('planning-apply',{recipe:preview.recipe,at:preview.at,fingerprint:preview.fingerprint});
 const b=s.state.data.workspace.planning.blocks.find(b=>!b.deletedAt&&b.taskId===task.id);
 s.act('simulate-start',{itemId:b.id});assert.equal(planningSessionStage(s.state.data,b,s.state.simulations).stage,'active');
 assert.throws(()=>s.act('planning-block',{itemId:b.id,locked:true}),/Finish/);
 s.act('simulate-finish',{itemId:b.id});assert.equal(planningSessionStage(s.state.data,b,s.state.simulations).stage,'feedback');
 s.act('planning-feedback',{taskId:task.id,blockId:b.id,remainingMinutes:0,done:true});
 assert.equal(s.state.data.workspace.tasks[0].done,true);assert.equal(s.state.data.workspace.tasks[0].title,'Read textbook examples');
 assert.equal(s.state.data.sessions.length,0);assert.equal(s.state.data.timer,null);assert.equal(JSON.stringify(real),before);
 assert.throws(()=>s.act('workspace-start',{taskId:task.id}),/Only example/);
 const reset=createPlanningSandbox(now,'UTC');assert.equal(reset.data.workspace.tasks[0].done,false);assert.deepEqual(reset.simulations,{});
});
test('removing one example day changes the proposed schedule only after an explicit apply',()=>{
 const s=sandbox(),p=s.state.data.workspace.planning,before=structuredClone(p.blocks);
 s.act('planning-settings',{settings:p.settings,windows:p.availability.slice(1)});
 assert.deepEqual(s.state.data.workspace.planning.blocks,before);
 const preview=generateStudySchedule(s.state.data,{start:'2026-11-18',days:7},now);
 assert.ok(preview.blocks.every(b=>zonedDay(b.startAt,'UTC')!=='2026-11-18'));assert.equal(preview.plannedMinutes,120);
 s.act('planning-apply',{recipe:preview.recipe,at:preview.at,fingerprint:preview.fingerprint});
 assert.ok(s.state.data.workspace.planning.blocks.filter(b=>!b.deletedAt).every(b=>zonedDay(b.startAt,'UTC')!=='2026-11-18'));
});
test('spread and finish-early policies differ while preserving total work and deadlines',()=>{
 const state=createPlanningSandbox(now,'UTC').data;
 state.workspace.planning.blocks=[];state.workspace.planning.settings.focusMinutes=90;state.workspace.tasks.forEach(t=>t.estimateMinutes=30);state.workspace.planning.rules.forEach(r=>r.remainingMinutes=30);
 const spread=generateStudySchedule(state,{start:'2026-11-18',days:7},now);
 state.workspace.planning.settings.strategy='early';
 const early=generateStudySchedule(state,{start:'2026-11-18',days:7},now);
 assert.equal(spread.plannedMinutes,90);assert.equal(early.plannedMinutes,90);
 assert.equal(new Set(spread.blocks.map(b=>zonedDay(b.startAt,'UTC'))).size,3);
 assert.equal(new Set(early.blocks.map(b=>zonedDay(b.startAt,'UTC'))).size,1);
});
test('short work waits for a whole window instead of being split merely to fill a gap',()=>{
 const state=createPlanningSandbox(now,'UTC').data,p=state.workspace.planning;
 state.workspace.tasks=state.workspace.tasks.slice(0,1);state.workspace.tasks[0].estimateMinutes=30;p.rules=p.rules.slice(0,1);p.rules[0].remainingMinutes=30;p.blocks=[];
 p.settings={...p.settings,strategy:'early',bufferMinutes:0};p.availability=[{id:'small',weekday:3,start:1080,end:1100,updatedAt:now},{id:'whole',weekday:4,start:1080,end:1110,updatedAt:now}];
 const result=generateStudySchedule(state,{start:'2026-11-18',days:7},now);assert.equal(result.blocks.length,1);assert.equal(zonedDay(result.blocks[0].startAt,'UTC'),'2026-11-19');assert.equal(result.plannedMinutes,30);
});
test('session stages follow actual linked records and protect active timers from post-study controls',()=>{
 const data=createPlanningSandbox(now,'UTC').data,b=data.workspace.planning.blocks[0];assert.equal(planningSessionStage(data,b).stage,'planned');
 data.timer={planningBlockId:b.id,status:'paused'};assert.equal(planningSessionStage(data,b).stage,'active');
 data.timer=null;data.sessions=[{planningBlockId:b.id,durationSeconds:60}];assert.equal(planningSessionStage(data,b).stage,'feedback');
 assert.equal(planningSessionStage(data,{...b,status:'reviewed'}).stage,'reviewed');
});
test('editing an existing planned task updates its original task rather than creating a duplicate or changing saved study',()=>{
 const data=createPlanningSandbox(now,'UTC').data,task=data.workspace.tasks[0],sessions=structuredClone(data.sessions),r=transition(data,{type:'planning-task',epoch:data.epoch,expectedRevision:0,taskId:task.id,title:'New title',subject:'Algebra',dueDate:'2026-11-21',priority:'high',remainingMinutes:35,goalId:'example-goal'},{now,owner:'test',id:'edit'});
 assert.equal(r.state.workspace.tasks.length,3);assert.equal(r.state.workspace.tasks[0].title,'New title');assert.equal(r.state.workspace.tasks[0].priority,'high');assert.deepEqual(r.state.sessions,sessions);assert.equal(r.state.timer,null);
 assert.throws(()=>transition(data,{type:'planning-task',epoch:data.epoch,expectedRevision:0,taskId:task.id,title:'',subject:'Maths',remainingMinutes:35},{now,owner:'test',id:'bad'}),/title/);
});


test('balanced planning falls back to earlier work when spreading would miss a feasible dependent-task deadline',()=>{
 let data=createPlanningSandbox(now,'UTC').data;data=transition(data,{type:'exam-save',epoch:data.epoch,title:'Test',date:'2026-11-19',time:'18:45',zone:'UTC'},{now,owner:'test',id:'exam'}).state;const p=data.workspace.planning;
 data.workspace.tasks=data.workspace.tasks.slice(0,2);p.rules=p.rules.slice(0,2);p.rules[0].remainingMinutes=90;p.rules[1].remainingMinutes=30;p.rules[1].dependsOn=[p.rules[0].id];
 p.blocks=[];p.settings.bufferMinutes=0;p.availability=p.availability.slice(0,2);p.goals[0].examId=data.workspace.exams[0].id;
 const result=generateStudySchedule(data,{start:'2026-11-18',days:7},now);assert.equal(result.plannedMinutes,120);assert.equal(result.unscheduled.length,0);assert.match(result.explanation,/earlier/);assert.ok(result.blocks.every(b=>b.endAt<=Date.parse('2026-11-19T18:45Z')));
 const applied=sandboxCommand({data,simulations:{}},'planning-apply',{at:result.at,recipe:result.recipe,fingerprint:result.fingerprint},now,'fallback');assert.equal(applied.data.workspace.planning.blocks.filter(b=>!b.deletedAt).length,3);
});
