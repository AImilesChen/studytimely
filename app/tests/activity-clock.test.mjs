import test from 'node:test';
import assert from 'node:assert/strict';
import {activityClock,activityClockText} from '../src/lib/activity-clock.mjs';
const at=1000000,activity={id:'activity',roomId:'room',status:'running',startedAt:at,focusMinutes:25,breakMinutes:5};
const timer={room_id:'room',activity_id:'activity',status:'running',last_at:at,check_at:at+1500000,credited_seconds:0};
test('activity panel advances each second before the first server credit and counts shared time down',()=>{
 const first=activityClock(activity,timer,at+45000),next=activityClock(activity,timer,at+46000);
 assert.equal(first.seconds,45);assert.equal(next.seconds,46);assert.equal(next.remaining,1454);assert.equal(next.running,true);assert.equal(activityClockText(next.seconds),'00:00:46');
});
test('heartbeat settlement does not count the same seconds twice',()=>{
 const settled={...timer,last_at:at+30000,credited_seconds:30};
 assert.equal(activityClock(activity,settled,at+46000).seconds,46);
});
test('pausing freezes only the personal interval; resuming uses the new interval and preserves separate server totals',()=>{
 const paused={...timer,status:'paused',credited_seconds:46,last_at:at+46000};
 const a=activityClock(activity,paused,at+50000),b=activityClock(activity,paused,at+60000);
 assert.equal(a.seconds,46);assert.equal(b.seconds,46);assert.equal(a.remaining-b.remaining,10);assert.equal(b.running,false);
 assert.equal(activityClock(activity,{...timer,last_at:at+60000},at+65000).seconds,5);
});
test('other activities, rooms, stale heartbeats and check-ins cannot inflate the visible personal interval',()=>{
 assert.equal(activityClock(activity,{...timer,activity_id:'other',credited_seconds:200},at+10000).seconds,0);
 assert.equal(activityClock(activity,{...timer,room_id:'other',credited_seconds:200},at+10000).seconds,0);
 const stale=activityClock(activity,timer,at+91000);assert.equal(stale.seconds,0);assert.equal(stale.needsCheck,true);
 const check=activityClock(activity,{...timer,status:'check',credited_seconds:30},at+40000);assert.equal(check.seconds,30);assert.equal(check.needsCheck,true);
});
test('focus/break/end boundaries never show a negative countdown or extra study credit',()=>{
 const focusEnd=at+1500000;
 const b=activityClock(activity,{...timer,last_at:focusEnd-1000,credited_seconds:1499},focusEnd);
 assert.equal(b.phase,'break');assert.equal(b.remaining,300);assert.equal(b.running,false);
 const e=activityClock(activity,timer,focusEnd+300000);assert.equal(e.phase,'ended');assert.equal(e.remaining,0);
 assert.equal(activityClock({...activity,status:'cancelled'},timer,at+5000).running,false);
});
