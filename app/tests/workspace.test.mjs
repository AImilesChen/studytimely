import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,transition,dayKey,validateBackup} from '../src/lib/model.mjs';
import {checkState,backupOf} from '../src/lib/storage.mjs';
import {emptyWorkspace,habitSummary,mergeWorkspace,chapterProgress,sessionsCSV,examDays} from '../src/lib/workspace.mjs';
import {cloneOutline} from '../src/lib/exam-templates.mjs';
import {mergeBackups} from '../src/lib/sync.mjs';
function app(){let state=emptyState('e'),n=0,now=Date.UTC(2026,10,13,12);return{get state(){return state;},get now(){return now;},advance(ms){now+=ms;},do(type,fields={}){const r=transition(state,{type,epoch:state.epoch,...fields},{now,owner:'tab',id:'item-'+(++n)});state=r.state;return r;}};}
function record(id,at,seconds){return{id,mode:'study',subject:'Math',startedAt:at,endedAt:at+seconds*1000,durationSeconds:seconds,status:'Completed',segments:[[at,at+seconds*1000]]};}
test('V1 state/backup gain an empty workspace without changing saved sessions or the timer',()=>{
 const v1=emptyState('old');delete v1.workspace;delete v1.settings.ambient;delete v1.settings.spaceTheme;delete v1.settings.lastTool;v1.sessions=[record('s',Date.UTC(2026,10,12),60)];
 const migrated=checkState(v1);assert.deepEqual(migrated.sessions,v1.sessions);assert.equal(migrated.epoch,'old');assert.equal(migrated.settings.spaceTheme,'default');assert.equal(migrated.workspace.tasks.length,0);assert.equal(validateBackup({app:'StudyTimely',schema:1,subjects:[],sessions:v1.sessions}).workspace.plans.length,0);
});
test('task sessions use actual recorded time and keep the link through Pomodoro phases',()=>{
 const a=app();a.do('task-save',{title:'Algebra',subject:'Math',priority:'high',estimateMinutes:120});const task=a.state.workspace.tasks[0];a.do('settings',{patch:{studyMinutes:1,shortBreak:1,autoBreak:true}});a.do('workspace-start',{taskId:task.id,mode:'pomodoro'});a.advance(60000);a.do('tick');assert.equal(a.state.sessions[0].durationSeconds,60);assert.equal(a.state.sessions[0].taskId,task.id);assert.equal(a.state.timer.taskId,task.id);a.advance(60000);a.do('tick');assert.equal(a.state.sessions.length,1);assert.equal(a.state.timer.phase,'Study');assert.equal(a.state.timer.taskId,task.id);
});
test('daily habits skip planned rest days while a missed scheduled day breaks a streak',()=>{
 const friday='2026-11-13',at=Date.parse(friday+'T12:00:00');const h={id:'h',title:'Study',kind:'minutes',period:'daily',target:30,studyDays:[1,2,3,4,5],startDate:friday,checks:{},updatedAt:at,deletedAt:0};
 const sessions=[record('fri',at,1800)];const monday=Date.parse('2026-11-16T12:00:00');assert.equal(habitSummary(h,sessions,monday).current,1);assert.equal(habitSummary(h,sessions,Date.parse('2026-11-17T12:00:00')).current,0);assert.equal(habitSummary(h,sessions,Date.parse('2026-11-14T12:00:00')).rest,true);
});
test('weekly goals count saved sessions once and check-ins never manufacture study time',()=>{
 const a=app();a.do('habit-save',{title:'Practice',kind:'checkin',period:'weekly',target:2,studyDays:[1,2,3,4,5]});const h=a.state.workspace.habits[0];a.do('habit-check',{itemId:h.id,day:dayKey(a.now),checked:true});assert.equal(a.state.sessions.length,0);assert.equal(habitSummary(a.state.workspace.habits[0],[],a.now).value,1);assert.throws(()=>a.do('habit-check',{itemId:h.id,day:'2099-01-01',checked:true}),/between/);a.do('habit-check',{itemId:h.id,day:dayKey(a.now),checked:false});assert.equal(habitSummary(a.state.workspace.habits[0],[],a.now).value,0);
});
test('leaf chapters determine progress; deleting a parent also hides its children',()=>{
 const a=app();a.do('plan-save',{title:'Exam'});const plan=a.state.workspace.plans[0];a.do('chapter-save',{planId:plan.id,title:'Parent',subject:'Math'});const parent=a.state.workspace.plans[0].chapters[0];a.do('chapter-save',{planId:plan.id,title:'Child 1',parentId:parent.id,done:true});a.do('chapter-save',{planId:plan.id,title:'Child 2',parentId:parent.id});assert.deepEqual(chapterProgress(a.state.workspace.plans[0]),{total:2,done:1});a.do('workspace-delete',{collection:'chapters',planId:plan.id,itemId:parent.id});assert.deepEqual(chapterProgress(a.state.workspace.plans[0]),{total:0,done:0});assert.equal(examDays('2026-11-14',a.now),1);
});
test('workspace merge preserves edits to separate chapters and deletion markers prevent resurrection',()=>{
 const a=app();a.do('plan-save',{title:'Exam'});const p=a.state.workspace.plans[0];a.do('chapter-save',{planId:p.id,title:'A'});a.do('chapter-save',{planId:p.id,title:'B'});const left=structuredClone(a.state.workspace),right=structuredClone(left);left.plans[0].chapters[0].done=true;left.plans[0].chapters[0].updatedAt++;right.plans[0].chapters[1].done=true;right.plans[0].chapters[1].updatedAt++;const merged=mergeWorkspace(left,right);assert.equal(chapterProgress(merged.plans[0]).done,2);
 const local=backupOf(a.state),remote=structuredClone(local);remote.sessions=[record('removed',a.now-60000,30)];local.workspace.deletedSessions.removed=a.now;assert.equal(mergeBackups(local,remote).sessions.length,0);assert.deepEqual(mergeWorkspace(left,right),mergeWorkspace(right,left));
});
test('weekly schedules reject overlaps and invalid dates without changing state',()=>{
 const a=app();a.do('block-save',{title:'Math',weekday:1,start:540,end:600});const before=JSON.stringify(a.state);assert.throws(()=>a.do('block-save',{title:'Overlap',weekday:1,start:590,end:620}),/overlaps/);assert.equal(JSON.stringify(a.state),before);a.do('block-save',{title:'Next',weekday:1,start:600,end:630});assert.throws(()=>a.do('task-save',{title:'Invalid',dueDate:'2026-02-30',priority:'normal'}),/date/);
});
test('CSV neutralises formula prefixes and quotes commas, quotes and multiline labels',()=>{
 const s=record('csv',Date.UTC(2026,10,13),60);s.subject='  =1+1';s.taskTitle='Read "chapter",\nthen review';const csv=sessionsCSV([s]);assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes('"\'  =1+1"'));assert.ok(csv.includes('"Read ""chapter"",\nthen review"'));assert.ok(csv.includes('Duration seconds'));assert.equal(backupOf({...emptyState('e'),workspace:emptyWorkspace()}).workspace.tasks.length,0);
});


test('personal outlines keep hierarchy but reset IDs, dates and completion',()=>{
 const a=app();a.do('plan-save',{title:'My custom outline',subjects:['Biology']});const id=a.state.workspace.plans[0].id;
 a.do('chapter-save',{planId:id,title:'Cells',done:true,targetDate:'2026-11-20'});const parent=a.state.workspace.plans[0].chapters[0].id;
 a.do('chapter-save',{planId:id,title:'Mitosis',parentId:parent,done:true});
 const original=structuredClone(a.state.workspace.plans[0]);let n=0;const copied=cloneOutline(original,()=>`new-${++n}`,a.now);
 assert.equal(copied.length,2);assert.equal(copied[1].parentId,copied[0].id);assert.ok(copied.every(c=>!c.done&&!c.targetDate&&!original.chapters.some(o=>o.id===c.id)));assert.equal(original.chapters[0].done,true);
 a.do('plan-save',{title:'Next exam',subjects:original.subjects,chapters:copied});assert.deepEqual(chapterProgress(a.state.workspace.plans[1]),{total:1,done:0});
});

test('a concurrently edited child cannot restore a deleted parent during sync',()=>{
 const a=app();a.do('plan-save',{title:'Exam'});const id=a.state.workspace.plans[0].id;
 a.do('chapter-save',{planId:id,title:'Parent'});const parent=a.state.workspace.plans[0].chapters[0].id;
 a.do('chapter-save',{planId:id,title:'Child',parentId:parent});const right=structuredClone(a.state.workspace);
 a.advance(1000);a.do('workspace-delete',{collection:'chapters',planId:id,itemId:parent});
 right.plans[0].chapters[1].title='Edited elsewhere';right.plans[0].chapters[1].updatedAt=a.now+1000;
 const merged=mergeWorkspace(a.state.workspace,right);assert.deepEqual(chapterProgress(merged.plans[0]),{total:0,done:0});assert.deepEqual(merged,mergeWorkspace(right,a.state.workspace));
});
