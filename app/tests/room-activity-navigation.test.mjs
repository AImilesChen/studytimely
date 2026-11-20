import test from 'node:test';
import assert from 'node:assert/strict';
import {initialRoomActivity,roomActivityNotice} from '../src/lib/room-activity-navigation.mjs';

const now=Date.UTC(2026,10,20,18),base={id:'one',title:'Maths focus',roomId:'room',status:'scheduled',startsAt:now+3600000,zone:'UTC',focusMinutes:25,breakMinutes:5};
const running={...base,id:'running',status:'running',startedAt:now-60000};

test('activity entry chooses the running session or earliest appointment without mutating server data',()=>{
 const earlier={...base,id:'earlier',startsAt:now+600000},items=[base,earlier];
 assert.equal(initialRoomActivity(items,'',now),'earlier');
 assert.equal(initialRoomActivity([...items,running],'',now),'running');
 assert.equal(items[0],base);
 assert.equal(initialRoomActivity(items,'one',now),'one');
});

test('direct activity links and the last joined ended activity remain reachable',()=>{
 const requested='12fb1cb9-3e0c-41a0-8716-0cfe18a4ba5b';
 assert.equal(initialRoomActivity([],requested,now),requested);
 assert.equal(initialRoomActivity([],'invalid',now),'');
 const old={...base,id:'old',status:'ended',joined:true,startsAt:now-86400000};
 const recent={...old,id:'recent',startsAt:now-3600000};
 assert.equal(initialRoomActivity([old,recent],'',now),'recent');
 assert.equal(initialRoomActivity([{...recent,joined:false}],'',now),'');
});

test('pending result comes before an appointment, with live sessions and requested activities still taking priority',()=>{
 const saved={...base,id:'saved',status:'ended',joined:true,awaitingResult:false,endedAt:now-1000};
 const pending={...saved,id:'pending',awaitingResult:true,endedAt:now-3000};
 const items=[base,saved,pending];
 assert.equal(initialRoomActivity(items,'',now),'pending');
 assert.equal(initialRoomActivity(items,'one',now),'one');
 assert.equal(initialRoomActivity([...items,running],'',now),'running');
 assert.equal(initialRoomActivity(items,'',now,true),'one');
 assert.equal(roomActivityNotice(items,null,now).id,'pending');
 assert.equal(roomActivityNotice([...items,running],null,now).id,'running');
 assert.equal(roomActivityNotice(items,null,now,true).id,'one');
});

test('empty, cancelled and already-finished activities do not clutter the room with a running shortcut',()=>{
 assert.equal(roomActivityNotice([],null,now),null);
 assert.equal(roomActivityNotice([{...base,status:'cancelled'}],null,now),null);
 const ended={...base,status:'ended'};
 assert.equal(roomActivityNotice([ended],{activity:ended,own:{checkedOutAt:now}},now),null);
 assert.equal(roomActivityNotice([ended],{activity:ended,own:{withdrawnAt:now}},now),null);
});

test('scheduled shortcut exposes the appointment and opens joining, without starting a timer',()=>{
 const shortcut=roomActivityNotice([base],null,now);
 assert.equal(shortcut.state,'scheduled');assert.equal(shortcut.action,'view');assert.equal(shortcut.label,'View & join');
 assert.match(shortcut.description,/25 min study/);
 assert.equal(roomActivityNotice([{...base,joined:true}],null,now).label,'View activity');
 assert.equal(roomActivityNotice([base],null,now,true).label,'View activity');
 const past={...base,id:'past',startsAt:now-3600000};
 assert.equal(roomActivityNotice([past,base],null,now).id,base.id);
 assert.equal(roomActivityNotice([past],null,now).awaitingStart,true);
 assert.match(roomActivityNotice([past],null,now).description,/Scheduled time passed/);
});

test('running shortcut has no second ticking countdown and does not depend on personal timer pauses',()=>{
 const detail={activity:running,own:{seconds:40}};
 const a=roomActivityNotice([running],detail,now),b=roomActivityNotice([running],detail,now+1000);
 assert.deepEqual(a,b);assert.equal(a.label,'Enter activity');assert.match(a.description,/You have joined/);
 assert.equal(Object.hasOwn(a,'remaining'),false);
});

test('break and ended participation provide a direct result action, while read-only access stays read-only',()=>{
 const detail={activity:running,own:{seconds:40,checkedOutAt:0,withdrawnAt:0}};
 const atBreak=now-60000+25*60000;
 for(const at of [atBreak,atBreak+5*60000]){
  const shortcut=roomActivityNotice([running],detail,at);
  assert.equal(shortcut.state,'result');assert.equal(shortcut.action,'result');assert.equal(shortcut.label,'Add your result');
  assert.equal(roomActivityNotice([running],detail,at,true).action,'view');
 }
 assert.equal(roomActivityNotice([running],{...detail,own:{...detail.own,checkedOutAt:now}},atBreak).state,'break');
});

test('a selected cancelled or historical activity does not hide another upcoming appointment',()=>{
 const cancelled={...base,id:'cancelled',status:'cancelled'};
 assert.equal(roomActivityNotice([cancelled,base],{activity:cancelled,own:null},now).id,base.id);
});
