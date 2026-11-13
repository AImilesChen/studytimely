import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,transition,elapsedMs,parseDuration,dailyTotals,statistics,MAX_GAP,validateBackup} from '../src/lib/model.mjs';
let sequence=0;
function act(s,type,now,payload={},owner='a'){return transition(s,{type,epoch:s.epoch,...payload},{now,owner,id:'test-'+(++sequence)}).state;}
test('timestamp accounting excludes pauses and records only once',()=>{
 let s=act(emptyState('e'),'start',1000,{mode:'study'});s=act(s,'pause',11000);s=act(s,'start',21000,{mode:'study'});s=act(s,'finish',26000);
 assert.equal(s.sessions[0].durationSeconds,15);assert.deepEqual(s.sessions[0].segments,[[1000,11000],[21000,26000]]);
 s=act(s,'finish',27000);assert.equal(s.sessions.length,1);
});
test('Pomodoro chooses long breaks, excludes breaks and stops at cycle limit',()=>{
 let s=emptyState('e');s=act(s,'settings',0,{patch:{studyMinutes:1,shortBreak:1,longBreak:2,longEvery:2,cycleLimit:2,autoBreak:true,autoStudy:true}});
 s=act(s,'start',1000,{mode:'pomodoro'});s=act(s,'tick',61000);assert.equal(s.timer.phase,'Short break');assert.equal(s.sessions.length,1);
 s=act(s,'tick',121000);assert.equal(s.timer.phase,'Study');assert.equal(s.sessions.length,1);
 s=act(s,'tick',181000);assert.equal(s.timer.status,'completed');assert.equal(s.sessions.length,2);
 s=act(s,'settings',182000,{patch:{cycleLimit:0}});s=act(s,'start',183000,{mode:'pomodoro'});
 s=act(s,'tick',243000);s=act(s,'tick',303000);s=act(s,'tick',363000);
 assert.equal(s.timer.phase,'Long break');assert.equal(s.timer.durationSeconds,120);assert.equal(s.sessions.length,4);
});
test('delayed callbacks complete only one phase and never invent catch-up study blocks',()=>{
 let s=act(emptyState('e'),'settings',0,{patch:{studyMinutes:1,autoBreak:true,autoStudy:true}});
 s=act(s,'start',1000,{mode:'pomodoro'});s=act(s,'tick',601000);
 assert.equal(s.sessions.length,1);assert.equal(s.sessions[0].durationSeconds,60);assert.equal(s.timer.since,601000);assert.equal(s.timer.phase,'Short break');
});
test('long gaps require review, bounded confirmed time retains precise intervals',()=>{
 let s=act(emptyState('e'),'start',1000,{mode:'study'});s=act(s,'tick',11000);s=act(s,'tick',11001+MAX_GAP);
 assert.equal(s.timer.status,'review');assert.equal(s.timer.baseMs,10000);assert.equal(s.sessions.length,0);
 assert.throws(()=>act(s,'finish',MAX_GAP+12000),/Review/);
 s=act(s,'review',MAX_GAP+13000,{seconds:20});s=act(s,'finish',MAX_GAP+14000);assert.equal(s.sessions[0].durationSeconds,20);
});
test('clock reversal asks for review and never produces negative time',()=>{
 let s=act(emptyState('e'),'start',10000,{mode:'study'});s=act(s,'tick',20000);s=act(s,'tick',1000);assert.equal(s.timer.status,'review');assert.ok(elapsedMs(s.timer,1000)>=0);
});
test('cross-tab control and clear generation reject stale writers',()=>{
 let s=act(emptyState('e'),'start',1000,{mode:'study'});const oldEpoch=s.epoch;
 assert.throws(()=>act(s,'finish',6000,{},'b'),/another tab/);
 s=act(s,'claim',6000,{},'b');assert.equal(s.timer.status,'paused');assert.equal(s.timer.owner,'b');
 assert.throws(()=>act(s,'start',7000,{mode:'study'},'a'),/another tab/);
 s=act(s,'clear',8000,{},'b');assert.throws(()=>transition(s,{type:'finish',epoch:oldEpoch},{now:9000,owner:'a',id:'stale'}),/changed/);assert.equal(s.sessions.length,0);
});
test('countdown uses exact h/m/s and never creates study records',()=>{
 assert.equal(parseDuration('0','0','1'),1);assert.equal(parseDuration(1,2,3),3723);
 for(const xs of [['',0,1],[0,0,0],[0,60,0],[0,0,1.5],[-1,0,1],[24,0,0]])assert.throws(()=>parseDuration(...xs));
 let s=act(emptyState('e'),'settings',0,{patch:{countdownSeconds:1}});s=act(s,'start',1000,{mode:'countdown'});s=act(s,'tick',3500);assert.equal(s.timer.status,'completed');assert.equal(s.timer.baseMs,1000);assert.equal(s.sessions.length,0);
});
test('laps include both split and total times without affecting study history',()=>{
 let s=act(emptyState('e'),'start',1000,{mode:'stopwatch'});s=act(s,'lap',4500);s=act(s,'lap',6000);assert.deepEqual(s.timer.laps.map(l=>[l.splitMs,l.totalMs]),[[3500,3500],[1500,5000]]);assert.equal(s.sessions.length,0);
});
test('midnight allocations exclude pause gaps and maintain total',()=>{
 const start=new Date(2026,10,12,23,59,50).getTime(),end=new Date(2026,10,13,0,0,20).getTime();
 const sessions=[{subject:'Biology',durationSeconds:20,segments:[[start,start+10000],[end-10000,end]]}];
 const days=dailyTotals(sessions);assert.deepEqual(Object.values(days),[10,10]);const stats=statistics(sessions,end);assert.equal(stats.today,10);assert.equal(stats.total,20);assert.equal(stats.currentStreak,2);
});
test('backup import validates interval consistency, filters unknown fields and deduplicates merges',()=>{
 let s=act(emptyState('e'),'start',1000,{mode:'study'});s=act(s,'finish',5000);
 const b={app:'StudyTimely',schema:1,subjects:['Biology'],sessions:[{...s.sessions[0],privateExtra:'ignored'}]};
 assert.equal(validateBackup(b).sessions[0].privateExtra,undefined);
 s=act(s,'import',6000,{backup:b});assert.equal(s.sessions.length,1);assert.deepEqual(s.subjects,['Biology']);
 assert.throws(()=>validateBackup({...b,sessions:[{...b.sessions[0],durationSeconds:100}]}),/does not match/);
});
test('appearance changes preserve Pomodoro rest phase and completed study count',()=>{
 let s=act(emptyState('e'),'settings',0,{patch:{studyMinutes:1}});s=act(s,'start',1000,{mode:'pomodoro'});s=act(s,'tick',61000);
 assert.equal(s.timer.phase,'Short break');s=act(s,'settings',62000,{patch:{theme:'light'}});assert.equal(s.timer.phase,'Short break');assert.equal(s.timer.completedStudies,1);
});
test('a forward wall-clock discrepancy can require explicit time review',()=>{
 let s=act(emptyState('e'),'start',1000,{mode:'study'});s=act(s,'tick',11000);s=act(s,'clock-change',100000);
 assert.equal(s.timer.status,'review');assert.equal(s.timer.reviewReason,'clock');assert.equal(s.timer.baseMs,10000);
});
