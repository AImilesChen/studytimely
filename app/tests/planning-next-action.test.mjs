import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlanningSandbox} from '../src/lib/planning-sandbox.mjs';
import {studyTaskRows} from '../src/lib/planning-plan-view.mjs';
import {planningNextAction,planningWhen} from '../src/lib/planning-next-action.mjs';
const now=Date.parse('2026-11-18T12:00Z');
const source=()=>createPlanningSandbox(now,'UTC','study').data;

test('future arrangements open details, current sessions can start, and missed arrangements ask for a preview',()=>{
 const data=source(),b=data.workspace.planning.blocks[0];
 let rows=studyTaskRows(data,now);assert.equal(planningNextAction(rows,now).kind,'future');assert.equal(planningNextAction(rows,now).label,'View arrangement');
 rows=studyTaskRows(data,b.startAt+1);assert.equal(planningNextAction(rows,b.startAt+1).kind,'ready');
 rows=studyTaskRows(data,b.endAt+1);assert.equal(planningNextAction(rows,b.endAt+1).kind,'replan');assert.equal(planningNextAction(rows,b.endAt+1).label,'Preview new times');
});
test('pending feedback wins over future or missed work, and active work wins over feedback even when preparation is paused',()=>{
 const data=source(),[a,b]=data.workspace.planning.blocks;
 data.sessions=[{planningBlockId:a.id,durationSeconds:60}];
 assert.equal(planningNextAction(studyTaskRows(data,now),now).kind,'feedback');
 data.timer={planningBlockId:b.id,status:'paused'};
 assert.equal(planningNextAction(studyTaskRows(data,now),now,{paused:true}).kind,'active');
});
test('completed, excluded, unarranged and paused work have distinct non-start actions',()=>{
 const data=source(),rows=studyTaskRows(data,now),row=rows[0];
 assert.equal(planningNextAction([{...row,task:{...row.task,done:true}}],now).kind,'complete');
 assert.equal(planningNextAction([{...row,state:'omitted'}],now).kind,'excluded');
 assert.equal(planningNextAction([{...row,state:'unscheduled',next:null,upcoming:[],missed:[]}],now).kind,'arrange');
 assert.equal(planningNextAction([{...row,paused:true}],now).kind,'paused');
 assert.equal(planningNextAction([],now).kind,'empty');
});
test('Today/Tomorrow use the planning time zone across midnight and clock changes',()=>{
 const time=Date.parse('2026-11-18T23:50Z'),block={startAt:Date.parse('2026-11-19T00:15Z'),endAt:Date.parse('2026-11-19T00:45Z')};
 assert.match(planningWhen(block,time,'UTC'),/^Tomorrow/);assert.match(planningWhen(block,time,'America/New_York'),/^Today/);
 const dst=Date.parse('2026-10-24T22:30Z');assert.match(planningWhen({startAt:Date.parse('2026-10-25T18:00Z'),endAt:Date.parse('2026-10-25T18:30Z')},dst,'Europe/London'),/^Tomorrow/);
});
test('a missed occurrence stops demanding replanning when its remaining work has been fully rearranged',()=>{
 const data=source(),row=studyTaskRows(data,now)[0],past={...row.next,startAt:now-3600000,endAt:now-1800000},future={...row.next,startAt:now+3600000,endAt:now+6000000};
 const arranged={...row,next:future,upcoming:[future],missed:[past],remaining:40};assert.equal(planningNextAction([arranged],now).kind,'future');
 assert.equal(planningNextAction([{...arranged,remaining:60}],now).kind,'replan');
});
