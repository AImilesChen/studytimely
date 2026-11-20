import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleWeeklyReport,weeklyReportView,weeklyDuration,reportScale,weekRange} from '../src/lib/weekly-report.mjs';
import {setupCommunity} from './helpers/community.mjs';

const friday=Date.UTC(2026,10,20,14),week='2026-11-16';
test('weekly view distinguishes confirmed zeroes, future dates and the unique weekly-member count',()=>{
 const report=sampleWeeklyReport(friday),view=weeklyReportView(report,friday);
 assert.equal(report.week,week);assert.equal(report.seconds,21600);assert.equal(report.members,2);
 assert.equal(weekRange(week),'16–22 Nov 2026 · UTC');assert.equal(weekRange('2026-12-28'),'28 Dec 2026 – 3 Jan 2027 · UTC');
 assert.equal(view.activeDays,5);assert.equal(view.busiest[0].day,'2026-11-19');
 assert.deepEqual(view.days.filter(d=>d.future).map(d=>d.day),['2026-11-21','2026-11-22']);
 assert.equal(view.days.find(d=>d.today).day,'2026-11-20');
 assert.deepEqual(reportScale(7200).ticks,[7200,5400,3600,1800,0]);
 assert.equal(reportScale(32).max,40);assert.equal(reportScale(43).max,60);assert.equal(reportScale(0).max,3600);assert.equal(weeklyDuration(32),'32 sec');assert.equal(weeklyDuration(21600),'6h 00m');
});
test('empty weeks have no busiest day and tied days do not invent one winner',()=>{
 const report=sampleWeeklyReport(friday);
 const empty={...report,days:report.days.map(d=>({...d,seconds:0,members:0})),seconds:0,members:0,activityCount:0};
 const view=weeklyReportView(empty,friday);assert.equal(view.empty,true);assert.deepEqual(view.busiest,[]);assert.equal(view.activeDays,0);
 const tied={...report,days:report.days.map((d,i)=>({...d,seconds:i<2?60:0}))};
 assert.deepEqual(weeklyReportView(tied,friday).busiest.map(d=>d.day),['2026-11-16','2026-11-17']);
});
test('a retained snapshot does not label dates after its cutoff as confirmed zero study',()=>{
 const report=sampleWeeklyReport(Date.UTC(2026,10,18,15));report.snapshot=true;
 const view=weeklyReportView(report,friday);
 assert.equal(view.cutoff,'2026-11-18');assert.equal(view.days[3].future,true);assert.equal(view.days[4].future,true);
 assert.equal(view.days[4].today,true);assert.equal(view.days[2].future,false);
});
test('example dates and totals follow the server UTC week without inventing future study',()=>{
 const monday=Date.UTC(2026,10,16,0,1),report=sampleWeeklyReport(monday);
 assert.equal(report.seconds,3600);assert.equal(report.activityCount,1);assert.equal(report.days[1].seconds,0);
 assert.equal(sampleWeeklyReport(Date.UTC(2026,10,23)).week,'2026-11-23');
});
test('only members receive retained-week metadata, bounded to the twelve selectable weeks',async()=>{
 const s=await setupCommunity({subscribedFixtures:true});try{
  s.setTime(friday);const owner=await s.user('report-owner'),visitor=await s.user('report-visitor'),room=await s.room(owner,'public');
  const report=await s.call('/rooms/'+room.id+'/advanced','GET',undefined,owner);assert.equal(report.status,200);
  for(const w of ['2026-08-31','2026-08-24','2026-11-23'])s.db.prepare('INSERT INTO community_group_reports(room_id,week,body,updated_at) VALUES(?,?,?,?)').run(room.id,w,'{}',friday);
  const own=await s.call('/rooms/'+room.id,'GET',undefined,owner);assert.deepEqual(own.retainedReportWeeks,[week,'2026-08-31']);
  const publicView=await s.call('/rooms/'+room.id,'GET',undefined,visitor);assert.equal(publicView.status,200);assert.deepEqual(publicView.retainedReportWeeks,[]);
  s.db.prepare('DELETE FROM community_entitlements WHERE account_id=?').run(owner.id);
  const retained=await s.call('/rooms/'+room.id+'/advanced','GET',undefined,owner);assert.equal(retained.report.snapshot,true);
 }finally{s.close();}
});
