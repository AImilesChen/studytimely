import test from 'node:test';
import assert from 'node:assert/strict';
import {learningRecordHistory,allHistoryRecords,groupRecordDays,recordsEmptyKind} from '../src/lib/study-records.mjs';
import {analysisRange,studyAnalysis,recordRows} from '../src/lib/study-analysis.mjs';
import {trackerCSV} from '../src/lib/tracker.mjs';
import {emptyState,transition} from '../src/lib/model.mjs';
const at=Date.parse,now=at('2026-11-18T12:00:00Z');
const session=(id,a,b,patch={})=>({id,subject:'Maths',mode:'focus',status:'Completed',startedAt:at(a),endedAt:at(b),durationSeconds:(at(b)-at(a))/1000,segments:[[at(a),at(b)]],...patch});

test('subject choices reflect configured and retained learning subjects without a phantom unlabelled category',()=>{
 const old=session('old','2024-01-01T09:00Z','2024-01-01T09:30Z'),removed=session('removed','2026-11-17T09:00Z','2026-11-17T09:30Z',{subject:'Removed'}),nonLearning={...old,id:'stopwatch',mode:'stopwatch',subject:'Stopwatch'},future=session('future','2027-01-01T09:00Z','2027-01-01T09:30Z',{subject:'Future'});
 const h=learningRecordHistory({subjects:['Biology','Maths'],sessions:[old,removed,nonLearning,future],workspace:{deletedSessions:{removed:now}}},now);
 assert.deepEqual(h.subjects,['Biology','Maths']);assert.equal(h.count,1);assert.equal(h.hasUnlabelled,false);
 assert.equal(learningRecordHistory({sessions:[{...old,subject:''}]},now).hasUnlabelled,true);
 assert.deepEqual(learningRecordHistory({sessions:[]},now).subjects,[]);
});

test('all history includes several years, deduplicates records and exports every matched session without weakening analysis limits',()=>{
 const a=session('old','2023-01-01T09:00Z','2023-01-01T09:30Z'),b=session('new','2026-11-17T09:00Z','2026-11-17T10:00Z',{subject:'Biology',mode:'study'}),h=learningRecordHistory({sessions:[a,b,a]},now),r=allHistoryRecords(h,'UTC',now);
 assert.equal(r.count,2);assert.equal(r.total,5400);assert.equal(r.range.start,'2023-01-01');assert.equal(r.range.end,'2026-11-18');assert.equal(r.rows[0].session.id,'new');assert.equal(trackerCSV(r,'UTC').split('\r\n').filter(Boolean).length,3);
 assert.throws(()=>analysisRange({period:'custom',start:'2023-01-01',end:'2026-11-18',zone:'UTC',now}),/366/);
 assert.equal(allHistoryRecords(h,'UTC',now,{subject:'Biology',mode:'study'}).total,3600);assert.equal(allHistoryRecords(h,'UTC',now,{subject:'Maths',mode:'study'}).count,0);
});

test('first history, date-range misses and subject/mode/drilldown misses have distinct recovery states',()=>{
 const empty=learningRecordHistory({sessions:[]},now),h=learningRecordHistory({sessions:[session('s','2024-01-01T09:00Z','2024-01-01T09:30Z')]},now);
 assert.equal(recordsEmptyKind(empty,{subject:'Maths'}),'first');assert.equal(recordsEmptyKind(h),'dates');for(const filter of [{subject:'Maths'},{mode:'study'},{dayView:{start:'2026-11-17',end:'2026-11-17'}}])assert.equal(recordsEmptyKind(h,filter),'filtered');
});

test('date grouping splits a cross-midnight session and retains pauses, per-day totals and original identity',()=>{
 const s=session('night','2026-11-16T23:40Z','2026-11-17T00:30Z',{segments:[[at('2026-11-16T23:40Z'),at('2026-11-16T23:50Z')],[at('2026-11-16T23:55Z'),at('2026-11-17T00:30Z')]],durationSeconds:2700}),h=learningRecordHistory({sessions:[s]},now),days=groupRecordDays(h.rows,'UTC');
 assert.equal(days.dayCount,2);assert.equal(days.totalEntries,2);assert.deepEqual(days.groups.map(g=>[g.date,g.total]),[['2026-11-17',1800],['2026-11-16',900]]);assert.equal(days.groups[1].records[0].segments.length,2);assert.equal(days.groups[0].records[0].session,s);assert.equal(days.groups.reduce((n,g)=>n+g.total,0),2700);
});

test('grouped day details and CSV agree with already clipped date and hour drilldowns',()=>{
 const sessions=[session('night','2026-11-16T23:50Z','2026-11-17T00:20Z')],report=studyAnalysis({sessions},analysisRange({period:'week',zone:'UTC',now})),rows=recordRows(report,{start:'2026-11-17',end:'2026-11-17'}),days=groupRecordDays(rows,'UTC');
 assert.equal(days.groups.length,1);assert.equal(days.groups[0].total,1200);assert.equal(rows[0].seconds,1200);assert.equal(rows[0].session.durationSeconds,1800);assert.match(trackerCSV({...report,rows},'UTC'),/"1800","1200"/);
 const hourly=recordRows(report,{weekday:1,hour:0});assert.equal(groupRecordDays(hourly,'UTC').groups[0].total,1200);
});

test('day groups use actual DST and half-hour time-zone boundaries',()=>{
 for(const [a,b,seconds] of [['2026-03-08T05:00Z','2026-03-09T04:00Z',23*3600],['2026-11-01T04:00Z','2026-11-02T05:00Z',25*3600]]){const days=groupRecordDays(learningRecordHistory({sessions:[session('dst',a,b)]},now).rows,'America/New_York');assert.equal(days.dayCount,1);assert.equal(days.groups[0].total,seconds);}
 const half=groupRecordDays(learningRecordHistory({sessions:[session('half','2026-11-17T18:15Z','2026-11-17T18:45Z')]},now).rows,'Asia/Kolkata');assert.deepEqual(half.groups.map(g=>g.total),[900,900]);
});

test('display limits keep complete daily totals and disclose partial days rather than silently losing time',()=>{
 const sessions=Array.from({length:105},(_,i)=>session('s'+i,'2026-11-17T09:00Z','2026-11-17T09:01Z')),h=learningRecordHistory({sessions},now),r=allHistoryRecords(h,'UTC',now),days=groupRecordDays(r.rows,'UTC');
 assert.equal(days.totalEntries,105);assert.equal(days.shownEntries,100);assert.equal(days.groups[0].count,105);assert.equal(days.groups[0].records.length,100);assert.equal(days.groups[0].total,6300);assert.equal(r.total,6300);assert.equal(trackerCSV(r,'UTC').split('\r\n').filter(Boolean).length,106);
});

test('adding a new subject uses the existing action without relabelling saved records or starting a timer',()=>{
 const saved=session('saved','2026-11-17T09:00Z','2026-11-17T09:30Z',{subject:''}),state={...emptyState('subject-setup'),sessions:[saved]},r=transition(state,{type:'subject',epoch:state.epoch,label:'Biology'},{now,id:'add-subject',owner:'test'});
 assert.ok(r.state.subjects.includes('Biology'));assert.deepEqual(r.state.sessions,state.sessions);assert.equal(r.state.timer,state.timer);assert.equal(learningRecordHistory(r.state,now).hasUnlabelled,true);
});
