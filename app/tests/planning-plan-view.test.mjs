import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlanningSandbox} from '../src/lib/planning-sandbox.mjs';
import {studyPlanDetail,studyPlanSummaries} from '../src/lib/planning-plan-view.mjs';
const now=Date.parse('2026-11-18T12:00Z'),example=()=>createPlanningSandbox(now,'UTC').data;
test('one plan resolves its own tasks, remaining work and next arrangement without recording planned time',()=>{
 const data=example(),before=JSON.stringify(data),d=studyPlanDetail(data,'',now);
 assert.deepEqual(studyPlanSummaries(data).map(s=>[s.goal.id,s.done,s.total]),[['example-goal',0,3]]);assert.equal(d.goal.id,'example-goal');assert.equal(d.rows.length,3);assert.equal(d.done,0);assert.equal(d.remaining,120);assert.equal(d.planned,120);assert.equal(d.nextRow.task.id,'example-task-0');assert.equal(d.nextRow.state,'scheduled');assert.equal(data.sessions.length,0);assert.equal(JSON.stringify(data),before);
});
test('unknown estimates, completed work and skipped arrangements remain distinct',()=>{
 const data=example(),p=data.workspace.planning;data.workspace.tasks[0].done=true;data.workspace.tasks[1].estimateMinutes=0;p.rules[1].remainingMinutes=null;p.blocks.forEach(b=>{if(b.taskId==='example-task-2')b.status='skipped';});
 const d=studyPlanDetail(data,'example-goal',now);assert.equal(d.done,1);assert.equal(d.unknown,1);assert.equal(d.remaining,30);assert.equal(d.rows[0].state,'complete');assert.equal(d.rows[2].state,'unscheduled');assert.equal(d.rows[2].next,null);assert.equal(d.planned,50);
});
test('active or pending-feedback sessions take precedence over the next future booking; simulation is not recorded time',()=>{
 const data=example(),last=data.workspace.planning.blocks.at(-1);const simulations={[last.id]:{status:'running',seconds:0}};
 let d=studyPlanDetail(data,'example-goal',now,simulations);assert.equal(d.nextRow.next.id,last.id);assert.equal(d.nextRow.state,'active');
 simulations[last.id]={status:'finished',seconds:1800};d=studyPlanDetail(data,'example-goal',now,simulations);assert.equal(d.nextRow.state,'feedback');assert.equal(d.remaining,120);assert.equal(data.sessions.length,0);
});
test('plan switching scopes tasks, invalid selections fall back, and stale dates offer replanning',()=>{
 const data=example(),p=data.workspace.planning;p.goals.push({...p.goals[0],id:'another',title:'Another goal'});p.rules[2].goalId='another';
 assert.equal(studyPlanDetail(data,'another',now).rows.length,1);assert.equal(studyPlanDetail(data,'missing',now).rows.length,2);
 let d=studyPlanDetail(data,'example-goal',Date.parse('2026-11-25T12:00Z'));assert.ok(d.rows.every(r=>r.state==='replan'));assert.equal(d.nextRow,null);assert.equal(d.planned,0);
 p.goals[0].deletedAt=now;assert.equal(studyPlanDetail(data,'example-goal',now).goal.id,'another');p.goals[1].deletedAt=now;assert.equal(studyPlanDetail(data,'',now),null);
});
