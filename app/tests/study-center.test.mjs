import test from 'node:test';
import assert from 'node:assert/strict';
import {studyCenterReport} from '../src/lib/study-center.mjs';
import {emptyWorkspace} from '../src/lib/workspace.mjs';
const at=s=>new Date(s).getTime(),now=at('2026-11-17T12:00:00'),day='2026-11-17';
const task=(id,patch={})=>({id,title:id,subject:'Maths',priority:'normal',dueDate:'',plannedDate:'',estimateMinutes:30,done:false,updatedAt:1,deletedAt:0,...patch});
const data=()=>({sessions:[],workspace:emptyWorkspace(),dailyGoal:60});
test('center clips saved intervals at midnight, excludes general timers and keeps planned time separate',()=>{
 const d=data(),a=at('2026-11-16T23:50:00'),b=at('2026-11-17T00:10:00');
 d.sessions=[{id:'study',mode:'study',subject:'Maths',startedAt:a,endedAt:b,durationSeconds:1200,segments:[[a,b]]},{id:'watch',mode:'stopwatch',subject:'',startedAt:a,endedAt:b,durationSeconds:1200,segments:[[a,b]]}];
 d.workspace.tasks=[task('plan',{plannedDate:day,estimateMinutes:180,done:true})];d.workspace.blocks=[{id:'block',weekday:2,start:780,end:840,kind:'study',title:'Later study'}];
 const r=studyCenterReport(d,now);assert.equal(r.day.total,600);assert.equal(r.week.total,1200);assert.equal(r.latest.length,1);assert.equal(r.completedTodayPlan,1);assert.equal(r.nextBlock.id,'block');assert.equal(r.recent.subjects[0].seconds,1200);
});
test('today plan completion is not a claim about when old tasks were completed; deleted work is excluded',()=>{
 const d=data();d.workspace.tasks=[task('old',{plannedDate:'2026-11-16',done:true}),task('today',{plannedDate:day,dueDate:day,done:true}),task('deleted',{plannedDate:day,deletedAt:2}),task('late',{dueDate:'2026-11-15'}),task('scheduled',{plannedDate:day}),task('due',{dueDate:day})];
 const r=studyCenterReport(d,now);assert.equal(r.todayTasks.length,3);assert.equal(r.completedTodayPlan,1);assert.deepEqual(r.nextTasks.map(x=>x.task.id),['late','scheduled','due']);assert.equal(new Set(r.nextTasks.map(x=>x.task.id)).size,3);assert.equal(r.day.total,0);
});
test('upcoming exams and next blocks exclude archived, taken, past, deleted and non-study items',()=>{
 const d=data();d.workspace.exams=[{id:'past',title:'Past',date:'2026-11-16'},{id:'archived',title:'Archive',date:day,archived:true},{id:'taken',title:'Taken',date:day,status:'taken'},{id:'next',title:'Next',date:'2026-11-18'},{id:'today',title:'Today',date:day}];
 d.workspace.blocks=[{id:'ended',weekday:2,start:600,end:700},{id:'break',weekday:2,start:720,end:800,kind:'break'},{id:'different',weekday:3,start:720,end:800},{id:'next',weekday:2,start:750,end:800}];
 const r=studyCenterReport(d,now);assert.deepEqual(r.exams.map(x=>x.exam.id),['today','next']);assert.equal(r.nextBlock.id,'next');assert.equal(r.exams[0].timing.days,0);assert.equal(r.exams[1].timing.days,1);
});
test('empty browser has no invented activity and report computation does not change stored data',()=>{
 const d=data(),before=JSON.stringify(d),r=studyCenterReport(d,now);assert.equal(r.day.total,0);assert.equal(r.recent.series.length,7);assert.deepEqual(r.nextTasks,[]);assert.deepEqual(r.latest,[]);assert.deepEqual(r.habits,[]);assert.deepEqual(r.topics,[]);assert.equal(JSON.stringify(d),before);
});
