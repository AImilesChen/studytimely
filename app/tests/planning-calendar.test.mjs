import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,transition,validateBackup} from '../src/lib/model.mjs';
import {backupOf} from '../src/lib/storage.mjs';
import {generateStudySchedule} from '../src/lib/planning-engine.mjs';
import {calendarTaskGroups,calendarColour,calendarKind,calendarFreeTimes,calendarAddDraft,calendarSessionPayload,calendarStatus} from '../src/lib/planning-calendar.mjs';
import {chartColour} from '../src/lib/analytics-chart.mjs';
import {createPlanningSandbox,sandboxCommand} from '../src/lib/planning-sandbox.mjs';

const now=Date.parse('2026-11-18T12:00Z');
function setup(){let state=emptyState('calendar'),n=0,at=now;return {get state(){return state;},get now(){return at;},advance(ms){at+=ms;},act(type,payload={}){state=transition(state,{type,epoch:state.epoch,expectedRevision:state.workspace.planning.revision,...payload},{id:'calendar-'+(++n),now:at,owner:'test'}).state;return state;}};}
function app(){const a=setup();a.act('planning-settings',{settings:{zone:'UTC',strategy:'spread',maxDailyMinutes:120,focusMinutes:50,minMinutes:15,breakMinutes:5,bufferMinutes:0},windows:[{weekday:3,start:1080,end:1260},{weekday:4,start:1080,end:1260}]});return a;}
const payload=(patch={})=>calendarSessionPayload({title:'Read a chapter',subject:'Maths',date:'2026-11-18',start:'18:00',minutes:30,...patch},'UTC');
const live=xs=>xs.filter(x=>!x.deletedAt);

test('a calendar entry atomically creates one task and protected session without creating learning records',()=>{
 const a=app(),revision=a.state.workspace.planning.revision;a.act('planning-session',payload());
 const p=a.state.workspace.planning,t=a.state.workspace.tasks[0],b=p.blocks[0];assert.equal(p.revision,revision+1);assert.equal(t.title,'Read a chapter');assert.equal(b.taskId,t.id);assert.equal(b.source,'manual');assert.equal(b.locked,true);assert.equal(p.rules[0].remainingMinutes,30);assert.equal(a.state.sessions.length,0);assert.equal(a.state.timer,null);
 assert.deepEqual(validateBackup(backupOf(a.state)).workspace.planning,p);
 const preview=generateStudySchedule(a.state,{start:'2026-11-18',days:7},now);assert.ok(!preview.replaceIds.includes(b.id));assert.equal(preview.blocks.filter(x=>x.taskId===t.id).length,0);
});

test('failed calendar saves preserve task titles, planning evidence and existing arrangements atomically',()=>{
 const a=app();a.act('planning-session',payload());const b=a.state.workspace.planning.blocks[0],before=JSON.stringify(a.state);
 for(const value of [payload({title:'Overlaps'}),payload({title:'Outside',start:'15:00'}),payload({itemId:b.id,title:'Rename then fail',start:'21:00'})]){assert.throws(()=>a.act('planning-session',value),/overlaps|available/);assert.equal(JSON.stringify(a.state),before);}
 assert.throws(()=>a.act('planning-session',{...payload(),expectedRevision:0}),/changed/);assert.equal(JSON.stringify(a.state),before);
});

test('existing tasks are linked without copies; direct edits retain identities, task scope and remaining work',()=>{
 const a=app();a.act('planning-task',{title:'Long task',subject:'Maths',remainingMinutes:60,goalId:''});const t=a.state.workspace.tasks[0];
 a.act('planning-session',payload({taskId:t.id,title:undefined,start:'18:00',minutes:30}));const b=a.state.workspace.planning.blocks[0];
 let groups=calendarTaskGroups(a.state,'',now);assert.equal(groups.pending[0].unarranged,30);assert.equal(groups.pending[0].remaining,60);
 a.act('planning-session',payload({taskId:t.id,title:undefined,start:'19:00',minutes:30}));groups=calendarTaskGroups(a.state,'',now);assert.equal(groups.pending.length,0);assert.equal(groups.arranged.length,1);
 a.act('planning-session',payload({itemId:b.id,title:'Updated title',subject:'English',start:'18:05',minutes:25}));
 assert.equal(a.state.workspace.tasks.length,1);assert.equal(a.state.workspace.tasks[0].id,t.id);assert.equal(a.state.workspace.tasks[0].title,'Updated title');assert.equal(a.state.workspace.tasks[0].subject,'English');assert.equal(a.state.workspace.planning.rules[0].remainingMinutes,60);assert.equal(a.state.workspace.planning.blocks[0].id,b.id);assert.equal(a.state.sessions.length,0);assert.equal(calendarTaskGroups(a.state,'',now).pending[0].unarranged,5);
});

test('calendar entries cannot overallocate a task, exceed a deadline or bypass rest days and commitments',()=>{
 const a=app();a.act('planning-task',{title:'Only 15 minutes',subject:'Maths',remainingMinutes:15,goalId:'',dueDate:'2026-11-18'});const taskId=a.state.workspace.tasks[0].id;
 assert.throws(()=>a.act('planning-session',payload({taskId,title:undefined})),/unarranged/);
 assert.throws(()=>a.act('planning-session',payload({taskId,title:undefined,date:'2026-11-19',minutes:15})),/deadline/);
 a.act('block-save',{weekday:3,start:1080,end:1140,title:'Class',kind:'busy'});
 assert.throws(()=>a.act('planning-session',payload({taskId,title:undefined,minutes:15})),/available/);
 a.act('planning-exception',{date:'2026-11-18',kind:'off'});
 assert.throws(()=>a.act('planning-session',payload({taskId,title:undefined,start:'19:00',minutes:15})),/available/);
});

test('calendar edits cannot rename or move a running session or one awaiting actual feedback',()=>{
 const a=app();a.act('planning-session',payload());const b=a.state.workspace.planning.blocks[0];a.act('workspace-start',{taskId:b.taskId,planningBlockId:b.id,mode:'study'});
 let before=JSON.stringify(a.state);assert.throws(()=>a.act('planning-session',payload({itemId:b.id,title:'Changed'})),/timer/);assert.equal(JSON.stringify(a.state),before);
 a.advance(60000);a.act('finish');before=JSON.stringify(a.state);assert.throws(()=>a.act('planning-session',payload({itemId:b.id,title:'Changed'})),/feedback/);assert.equal(JSON.stringify(a.state),before);assert.equal(a.state.sessions.length,1);
});

test('backlog measures all future reservations and does not count expired appointments as arranged',()=>{
 const a=app();a.act('planning-session',payload());const b=a.state.workspace.planning.blocks[0];assert.equal(calendarTaskGroups(a.state,'',now).arranged.length,1);
 assert.equal(calendarTaskGroups(a.state,'',b.endAt+1).pending[0].unarranged,30);assert.equal(calendarStatus(a.state,b,b.endAt+1),'missed');
 a.state.workspace.tasks[0].done=true;assert.equal(calendarTaskGroups(a.state,'',now).pending.length,0);assert.equal(calendarTaskGroups(a.state,'',now).arranged.length,0);
});

test('free-time click drafts avoid occupied time; five-minute snapping and midnight validation retain real duration',()=>{
 const a=app();a.act('planning-session',payload());const days=calendarFreeTimes(a.state,'2026-11-18',now),b=a.state.workspace.planning.blocks[0];
 for(const slot of days[0].slots)assert.ok(slot.endAt<=b.startAt||slot.startAt>=b.endAt);
 const draft=calendarAddDraft(days[0].slots[0],'UTC',.5);assert.equal(draft.start%5,0);assert.ok(draft.minutes>=5&&draft.minutes<=30);
 const midnight=payload({date:'2026-11-18',start:'23:30',minutes:30});assert.equal(midnight.endAt,Date.parse('2026-11-19T00:00Z'));
 assert.throws(()=>payload({start:'23:50',minutes:30}),/midnight/);assert.throws(()=>payload({minutes:4}),/5–720/);
 assert.throws(()=>calendarSessionPayload({date:'2026-11-01',start:'01:30',minutes:30,title:'DST'},'America/New_York'),/clock-change/);
});

test('calendar colours share the analytics palette and activity types retain non-colour labels',()=>{
 for(const name of ['Maths','English','Biology','Coding'])assert.equal(calendarColour(name),chartColour(name));
 assert.equal(calendarKind({prep:{stage:'review'}}),'review');assert.equal(calendarKind({prep:{stage:'mock'}}),'mock');assert.equal(calendarKind({prep:{stage:'reflect'}}),'corrections');assert.equal(calendarKind(),'study');
});

test('manual study respects daily limits, focus breaks and the order of already arranged dependent tasks',()=>{
 const a=app();a.act('planning-session',payload());
 assert.throws(()=>a.act('planning-session',payload({start:'18:30'})),/break/);
 a.act('planning-settings',{settings:{...a.state.workspace.planning.settings,maxDailyMinutes:45},windows:live(a.state.workspace.planning.availability)});
 assert.throws(()=>a.act('planning-session',payload({start:'19:00',minutes:20})),/daily/);
 const c=app();c.act('planning-task',{title:'Prerequisite',subject:'Maths',remainingMinutes:60,goalId:''});const first=c.state.workspace.tasks[0].id;
 c.act('planning-task',{title:'After prerequisite',subject:'Maths',remainingMinutes:15,goalId:'',dependsOn:[first]});
 const preview=generateStudySchedule(c.state,{start:'2026-11-18',days:7},now);c.act('planning-apply',{recipe:preview.recipe,at:preview.at,fingerprint:preview.fingerprint});
 const original=c.state.workspace.planning.blocks.find(b=>b.taskId===first),before=JSON.stringify(c.state);
 assert.throws(()=>c.act('planning-session',payload({itemId:original.id,title:'Rename then move',date:'2026-11-19',start:'19:00',minutes:(original.endAt-original.startAt)/60000})),/prerequisite/);assert.equal(JSON.stringify(c.state),before);
});

test('direct calendar editing stays inside the isolated example and protects unfinished simulations',()=>{
 const real=emptyState('real'),before=JSON.stringify(real),original=createPlanningSandbox(now,'UTC'),slot=original.data.workspace.planning.blocks[0];
 let sandbox=sandboxCommand(original,'planning-session',payload({date:'2026-11-18',start:'19:00',minutes:15,title:'Example only'}),now,'sandbox-calendar');
 assert.equal(original.data.workspace.tasks.length,3);assert.equal(sandbox.data.workspace.tasks.length,4);assert.equal(sandbox.data.sessions.length,0);assert.equal(JSON.stringify(real),before);
 sandbox=sandboxCommand(sandbox,'simulate-start',{itemId:slot.id},now,'simulation');assert.throws(()=>sandboxCommand(sandbox,'planning-session',payload({itemId:slot.id}),now,'blocked'),/simulation/);
 sandbox=sandboxCommand(sandbox,'simulate-finish',{itemId:slot.id},now,'simulation-end');assert.throws(()=>sandboxCommand(sandbox,'planning-session',payload({itemId:slot.id}),now,'blocked'),/feedback/);
});
