import test from 'node:test';
import assert from 'node:assert/strict';
import {progressDuration,roomContributions,progressNextStep,recentRoomActivities,groupGoalEstimate} from '../src/lib/room-progress.mjs';
import {readCommunityEntry,saveCommunityEntry} from '../src/lib/community-entry.mjs';

test('progress formats exact short durations without rounding an unfinished minute or inventing unknown time',()=>{
 for(const [seconds,label] of [[0,'0 sec'],[59,'59 sec'],[60,'1 min'],[150,'2 min 30 sec'],[3599,'59 min 59 sec'],[3600,'1 hr 0 min']])assert.equal(progressDuration(seconds),label);
 assert.equal(progressDuration(undefined),'Not available');assert.equal(progressDuration(NaN),'Not available');
});
test('member shares reconcile current members with retained contributions without exposing former identities',()=>{
 const rows=[{id:'other',nickname:'Partner',today_seconds:15},{id:'me',nickname:'Me',today_seconds:30}];
 const result=roomContributions({today_seconds:60,today_members:3},rows,'me');
 assert.equal(result.own,30);assert.equal(result.other,15);assert.equal(result.participants,3);assert.equal(result.rows[0].id,'me');assert.equal(result.rows[0].share,50);
 assert.equal(result.rows.reduce((n,r)=>n+r.seconds,0)+result.other,result.total);
 assert.equal(roomContributions(undefined,rows,'me').total,null);
 assert.equal(roomContributions({today_seconds:30},rows,'me').inconsistent,true);
 assert.equal(roomContributions({today_seconds:0,today_members:0},[]).participants,0);
});
test('next action prioritises access, a matching running timer, own pending result, then appointment',()=>{
 const notice={id:'activity',action:'result',state:'ended'},timer={room_id:'room',status:'running'};
 assert.equal(progressNextStep({roomId:'room',timer,notice,canParticipate:false}).action,'access');
 assert.equal(progressNextStep({roomId:'room',timer,notice}).action,'study');
 assert.equal(progressNextStep({roomId:'different',timer,notice}).id,'activity');
 assert.equal(progressNextStep({roomId:'room',timer:{...timer,status:'paused'},notice}).action,'result');
 assert.equal(progressNextStep({notice:{state:'scheduled',id:'next'}}).action,'activity');
 assert.equal(progressNextStep({}).label,'Start studying');
});
test('recent activity overview excludes cancelled appointments and preserves pending ownership data',()=>{
 const now=100000,items=[{id:'ended',status:'ended',endedAt:90000,startsAt:1000,awaitingResult:true},{id:'cancelled',status:'cancelled',startsAt:999999}];
 const result=recentRoomActivities(items,now);assert.equal(result.length,1);assert.equal(result[0].id,'ended');assert.equal(result[0].awaitingResult,true);assert.equal(result[0].phase,'ended');
 const appointments=[{id:'far',status:'scheduled',startsAt:now+5000},{id:'near',status:'scheduled',startsAt:now+1000}];
 assert.deepEqual(recentRoomActivities([...items,...appointments],now).map(x=>x.id),['ended','near','far']);
});
test('public estimate counts planned study minutes per person, with bounded integer inputs',()=>{
 assert.deepEqual(groupGoalEstimate('4','30'),{people:4,minutes:30,total:120});
 assert.equal(groupGoalEstimate(24,120).total,2880);
 for(const n of [0,25,1.5,''])assert.throws(()=>groupGoalEstimate(n,30));
 for(const n of [0,4,121,5.5,''])assert.throws(()=>groupGoalEstimate(4,n));
});
test('a bounded planned goal survives the existing sign-in return draft and cannot be inserted into invitation drafts',()=>{
 const map=new Map(),storage={getItem:key=>map.get(key),setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)};
 saveCommunityEntry(storage,{action:'create',topic:'Revision',goalMinutes:105},1000);
 assert.equal(readCommunityEntry(storage,1100).goalMinutes,105);
 saveCommunityEntry(storage,{action:'create',goalMinutes:Infinity},1000);assert.equal(readCommunityEntry(storage,1100).goalMinutes,undefined);
 saveCommunityEntry(storage,{action:'join',goalMinutes:105},1000);assert.equal(readCommunityEntry(storage,1100).goalMinutes,undefined);
 assert.equal(readCommunityEntry(storage,1000+600001),null);
});
