import test from 'node:test';
import assert from 'node:assert/strict';
import {buildStudyCalendar,calendarMonthRange,shiftCalendarMonth,calendarDuration,compactCalendarDuration} from '../src/lib/study-calendar.mjs';
import {analysisRange,comparisonRange,studyAnalysis,recordRows} from '../src/lib/study-analysis.mjs';
const now=Date.UTC(2026,10,18,12);
const session=(id,start,end,subject='Maths',mode='focus')=>({id,subject,mode,status:'Completed',startedAt:Date.parse(start),endedAt:Date.parse(end),durationSeconds:(Date.parse(end)-Date.parse(start))/1000,segments:[[Date.parse(start),Date.parse(end)]]});
const report=(patch={},sessions=[])=>studyAnalysis({sessions},analysisRange({period:'calendar',month:'2026-11',zone:'UTC',now,...patch}));

test('calendar lays out complete Monday–Sunday rows and handles leap-year months',()=>{
 const m=buildStudyCalendar(report());assert.equal(m.cells.length,42);assert.equal(m.cells.findIndex(d=>d.date==='2026-11-01'),6);assert.equal(m.cells[0].date,'2026-10-26');assert.equal(m.cells.at(-1).date,'2026-12-06');assert.ok(m.cells.some(d=>d.date==='2026-11-30'&&d.inMonth));
 const leap=buildStudyCalendar(report({month:'2024-02'}));assert.equal(leap.cells.filter(d=>d.inMonth).length,29);assert.ok(leap.cells.some(d=>d.date==='2024-02-29'&&d.inMonth));assert.equal(leap.cells.length%7,0);
});
test('today truncates report totals while the future month cells stay visibly future',()=>{
 const m=buildStudyCalendar(report());assert.equal(m.end,'2026-11-18');assert.equal(m.last,'2026-11-30');assert.equal(m.cells.find(d=>d.date==='2026-11-18').today,true);assert.equal(m.cells.find(d=>d.date==='2026-11-19').future,true);assert.equal(m.cells.find(d=>d.date==='2026-11-19').seconds,null);
});
test('dates outside a selected week are unknown in this view rather than fabricated zeroes',()=>{
 const s=session('s','2026-11-17T09:00:00Z','2026-11-17T09:30:00Z'),m=buildStudyCalendar(report({period:'week'},[s]));assert.equal(m.fullMonth,false);assert.equal(m.preferredDate,'2026-11-17');assert.equal(m.cells.find(d=>d.date==='2026-11-10').seconds,null);assert.equal(m.cells.find(d=>d.date==='2026-11-16').seconds,0);assert.equal(m.total,1800);assert.equal(m.activeDays,1);
});
test('month navigation handles year boundaries, rejects future months and keeps calendar comparisons',()=>{
 assert.equal(shiftCalendarMonth('2026-01',-1),'2025-12');assert.equal(shiftCalendarMonth('2026-12',1),'2027-01');assert.throws(()=>calendarMonthRange('2026-13','2026-11-18'));assert.throws(()=>calendarMonthRange('2026-12','2026-11-18'));assert.throws(()=>calendarMonthRange('1969-12','2026-11-18'));
 const range=analysisRange({period:'calendar',month:'2026-10',zone:'UTC',now}),previous=comparisonRange(range);assert.equal(range.start,'2026-10-01');assert.equal(range.end,'2026-10-31');assert.equal(previous.start,'2026-09-01');assert.equal(previous.end,'2026-09-30');
});
test('month totals and day details preserve applied subject/mode filters and midnight clipping',()=>{
 const sessions=[session('night','2026-11-16T23:50:00Z','2026-11-17T00:20:00Z'),session('bio','2026-11-17T10:00:00Z','2026-11-17T11:00:00Z','Biology','study')],r=studyAnalysis({sessions},analysisRange({period:'calendar',month:'2026-11',zone:'UTC',now}),{subject:'Maths',mode:'focus'}),m=buildStudyCalendar(r);
 assert.equal(m.total,r.total);assert.equal(m.total,1800);assert.equal(m.cells.find(d=>d.date==='2026-11-16').seconds,600);assert.equal(m.cells.find(d=>d.date==='2026-11-17').seconds,1200);const details=recordRows(r,{start:'2026-11-17',end:'2026-11-17'});assert.equal(details.length,1);assert.equal(details[0].seconds,1200);
});
test('calendar preserves half-hour-zone dates and selects a useful day without inventing study',()=>{
 const m=buildStudyCalendar(report({zone:'Asia/Kolkata'},[session('s','2026-11-17T18:15:00Z','2026-11-17T18:45:00Z')]));assert.equal(m.cells.find(d=>d.date==='2026-11-17').seconds,900);assert.equal(m.cells.find(d=>d.date==='2026-11-18').seconds,900);assert.equal(m.preferredDate,'2026-11-18');const empty=buildStudyCalendar(report());assert.equal(empty.preferredDate,'2026-11-18');assert.equal(empty.total,0);
});
test('small calendar labels retain exact minutes or mark a shortened hour value explicitly',()=>{assert.equal(calendarDuration(5400),'1h 30m');assert.equal(compactCalendarDuration(5400),'1h+');assert.equal(compactCalendarDuration(3600),'1h');assert.equal(calendarDuration(1200),'20m');assert.equal(calendarDuration(null),'—');assert.equal(calendarDuration(0),'—');});
