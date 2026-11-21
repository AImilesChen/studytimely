import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,transition} from '../src/lib/model.mjs';
import {centerProgress,periodHabits} from '../src/lib/center-progress.mjs';
import {analysisRange,delta} from '../src/lib/study-analysis.mjs';
import {trendGroups} from '../src/lib/analytics-chart.mjs';
import {trackerCSV} from '../src/lib/tracker.mjs';
process.env.TZ='UTC';
const now=Date.parse('2026-11-21T12:00:00Z'),at=Date.parse;
const session=(id,start,end,patch={})=>({id,subject:'Maths',mode:'study',status:'Completed',startedAt:at(start),endedAt:at(end),durationSeconds:(at(end)-at(start))/1000,segments:[[at(start),at(end)]],...patch});

test('center reports share clipping, deletion, deduplication and daily-goal scope with analytics',()=>{
 let data=emptyState('progress');data=transition(data,{type:'goal',minutes:20,epoch:data.epoch},{now:at('2026-11-21T00:00:00Z'),owner:'test',id:'goal'}).state;
 const a=session('a','2026-11-21T10:00:00Z','2026-11-21T10:10:00Z');data.sessions=[a,a,session('b','2026-11-21T11:00:00Z','2026-11-21T11:10:00Z',{subject:'Biology'}),session('general','2026-11-21T10:00:00Z','2026-11-21T11:00:00Z',{mode:'stopwatch'}),session('deleted','2026-11-21T09:00:00Z','2026-11-21T10:00:00Z')];data.workspace.deletedSessions={deleted:{at:now}};
 const r=centerProgress(data,{now,zone:'UTC',selection:{period:'today'},subject:'Maths'});assert.equal(r.report.total,600);assert.equal(r.report.count,1);assert.equal(r.history.count,2);assert.equal(r.report.goals.reached,1);assert.equal(r.report.goals.eligible,1);assert.equal(r.rows.length,1);
});
test('date drill-down and CSV show only counted intervals, including sessions across midnight',()=>{
 const data=emptyState('progress');data.sessions=[session('night','2026-11-20T23:50:00Z','2026-11-21T00:10:00Z')];
 const r=centerProgress(data,{now,zone:'UTC',selection:{period:'week'},day:{start:'2026-11-21',end:'2026-11-21'}});assert.equal(r.report.total,1200);assert.equal(r.rows[0].seconds,600);assert.equal(r.rows[0].session.durationSeconds,1200);const csv=trackerCSV({...r.recordsReport,rows:r.rows},'UTC');assert.ok(csv.includes('1200'));assert.ok(csv.includes('600'));assert.ok(csv.includes('2026-11-21T00:00:00.000Z'));
});
test('all-record history reaches older years without creating an oversized chart or changing period metrics',()=>{
 const data=emptyState('progress');data.sessions=[session('old','2023-01-01T10:00:00Z','2023-01-01T10:30:00Z')];const r=centerProgress(data,{now,zone:'UTC',selection:{period:'week'},allHistory:true,compare:true});assert.equal(r.report.total,0);assert.ok(r.report.series.length<=7);assert.equal(r.rows.length,1);assert.equal(r.recordsReport.range.start,'2023-01-01');assert.equal(delta(r.report.total,r.prior.total).percent,null);
});
test('habit period evidence excludes rest days and labels clipped weekly windows',()=>{
 let data=emptyState('progress');const start=at('2026-11-16T00:00:00Z');data=transition(data,{type:'habit-save',title:'Daily reading',kind:'minutes',period:'daily',target:20,studyDays:[1,2,3,4,5],scope:'',epoch:data.epoch},{now:start,owner:'test',id:'daily'}).state;
 data=transition(data,{type:'habit-save',title:'Weekly study',kind:'minutes',period:'weekly',target:100,studyDays:[1,2,3,4,5],scope:'',epoch:data.epoch},{now:start,owner:'test',id:'weekly'}).state;
 data.sessions=[session('mon','2026-11-16T10:00:00Z','2026-11-16T10:20:00Z'),session('wed','2026-11-18T10:00:00Z','2026-11-18T10:30:00Z')];const range=analysisRange({period:'week',zone:'UTC',now}),all=periodHabits(data,range,now);assert.equal(all[0].planned,5);assert.equal(all[0].reached,2);assert.equal(all[1].weeks[0].value,50);assert.equal(all[1].weeks[0].partial,true);
 const clipped=periodHabits(data,analysisRange({period:'custom',start:'2026-11-18',end:'2026-11-19',zone:'UTC',now}),now);assert.equal(clipped[1].weeks[0].value,30);assert.equal(clipped[1].weeks[0].partial,true);
});
test('invalid dates fail explicitly and compact chart grouping retains exact totals and date ranges',()=>{
 assert.throws(()=>centerProgress(emptyState(),{now,zone:'UTC',selection:{period:'custom',start:'2026-11-22',end:'2026-11-21'}}));const series=Array.from({length:30},(_,i)=>({date:`2026-11-${String(i+1).padStart(2,'0')}`,seconds:i*60}));const groups=trendGroups(series,[],14);assert.ok(groups.length<=14);assert.equal(groups.reduce((n,g)=>n+g.value,0),series.reduce((n,d)=>n+d.seconds,0));assert.equal(groups[0].start,'2026-11-01');assert.equal(groups.at(-1).end,'2026-11-30');assert.equal(trendGroups(series).length,30);
});
