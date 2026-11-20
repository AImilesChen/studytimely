import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const root=path.resolve(import.meta.dirname,'..'),dir=await fs.mkdtemp(path.join(root,'.wrangler/room-ui-'));
const file=path.join(dir,'components.mjs');
await build({stdin:{contents:"export {RoomHeader} from './src/components/RoomHeader.jsx';export {ActivityCheckout} from './src/components/ActivityCheckout.jsx';export {ActivityClock} from './src/components/ActivityClock.jsx';export {StudyCompanions} from './src/components/StudyCompanions.jsx';export {RoomAdvancedArea,RoomAccessNotice,RoomStudyGuide,RoomProgress} from './src/components/RoomStudyAdditions.jsx';",resolveDir:root,loader:'jsx'},outfile:file,bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic',loader:{'.css':'empty'},logLevel:'silent'});
const {RoomHeader,ActivityCheckout,ActivityClock,StudyCompanions,RoomAdvancedArea,RoomAccessNotice,RoomStudyGuide,RoomProgress}=await import(pathToFileURL(file).href);
const profile={id:'me'},room={id:'room',name:'Reading',capacity:4,invitationsOpen:true,closed:false,ownerId:'me'},access={roomActive:true,canParticipate:true,advancedActive:false,memberLimit:4,source:'free'};
const selected={room,access,member:true,owner:true,joinLimit:4,members:[{id:'me',nickname:'Reader',last_seen:100000,readOnly:false,session_seconds:0,today_seconds:0}],messages:[],moderationAvailable:true,mutedUntil:0,entitlements:{freeText:false}};
const render=(Component,props)=>renderToStaticMarkup(createElement(Component,props));
test('free room renders four places, real timer controls and usable fixed messages without an advanced grant',()=>{
 const html=render(StudyCompanions,{selected,profile,me:{},now:100000,connection:'Live'});
 assert.equal((html.match(/companion-empty-place/g)||[]).length,3);assert.match(html,/Start studying/);assert.match(html,/1\/4 members/);
 assert.match(html,/<button[^>]*>[^<]*<svg[\s\S]*?Starting study/);assert.doesNotMatch(html,/Advanced tools are read only/);
 const quick=html.match(/<button class="button"[^>]*>[\s\S]*?<span>Starting study<\/span><\/button>/);assert.ok(quick);assert.doesNotMatch(quick[0].split('>')[0],/disabled/);
});

test('compact room identity retains the real free allowance and owner/member actions without changing access',()=>{
 const header=render(RoomHeader,{selected:{...selected,room:{...room,visibility:'private'}}});
 assert.match(header,/<h1>Reading<\/h1>/);assert.equal((header.match(/<h1/g)||[]).length,1);
 assert.match(header,/Free room · 4 places/);assert.match(header,/Private room/);assert.match(header,/Room settings/);assert.match(header,/Room actions/);
 assert.doesNotMatch(header,/Advanced room|Advanced preview/);
 const guest=render(RoomHeader,{selected:{...selected,owner:false}});
 assert.match(guest,/Leave room/);assert.doesNotMatch(guest,/Room settings/);
 const advanced=render(RoomHeader,{selected:{...selected,access:{...access,advancedActive:true,source:'preview',memberLimit:24}}});
 assert.match(advanced,/Advanced preview · 24 places/);
});

test('room footer uses real recorded time and closed help while retaining original invitation and timer shortcuts',()=>{
 const empty=render(RoomStudyGuide,{canInvite:true,canPlan:true,canParticipate:true,totals:{today_seconds:0}});
 assert.match(empty,/Arranging an activity is optional/);assert.doesNotMatch(empty,/0 sec recorded|0 min recorded|room-guide-steps/);
 assert.match(empty,/<details class="room-study-help"><summary>/);assert.match(empty,/View group progress/);assert.match(empty,/Copy invitation/);assert.match(empty,/Go to my place/);assert.match(empty,/Plan next activity/);
 assert.match(empty,/same personal room timer/);assert.match(empty,/Where can I add my result/);
 const recorded=render(RoomStudyGuide,{totals:{today_seconds:43}});
 assert.match(recorded,/43 sec recorded together today · UTC/);assert.match(recorded,/View activities/);
});
test('inactive free room retains four-place presentation but does not invite or start a timer',()=>{
 const html=render(StudyCompanions,{selected:{...selected,access:{...access,canParticipate:false,roomActive:false},members:[{...selected.members[0],readOnly:true}]},profile,me:{},now:100000,connection:'Live'});
 assert.equal((html.match(/companion-empty-place/g)||[]).length,3);assert.doesNotMatch(html,/Start studying|>Invite a partner</);assert.match(html,/review room access above/);
});
test('free advanced area explains optional additions instead of rendering disabled environment and task controls',()=>{
 const html=render(RoomAdvancedArea,{selected,me:{entitlements:{source:'free',previewAvailable:true}},view:'tasks'});
 assert.match(html,/Try advanced groups/);assert.match(html,/no payment or subscription/);assert.doesNotMatch(html,/Play music|Use scene|Add shared task/);
});
test('free guests in an eligible advanced room are not asked to activate their own group preview',()=>{
 const html=render(RoomAdvancedArea,{selected:{...selected,owner:false,access:{...access,advancedActive:true}},me:{entitlements:{source:'free',previewAvailable:true}},view:'tasks'});
 assert.doesNotMatch(html,/Try advanced groups|room-advanced-feature-grid/);assert.match(html,/Loading shared tools/);
});
test('inactive owner sees an explicit free-room switch and useful retained room guidance remains available',()=>{
 const html=render(RoomAccessNotice,{selected:{...selected,access:{...access,roomActive:false,canParticipate:false,freeRoomId:'other'}},me:{rooms:[{id:'other',name:'Maths'}]}});
 assert.match(html,/Maths/);assert.match(html,/Use this as my free room/);assert.match(html,/Open the active free room/);
 const guide=render(RoomStudyGuide,{});assert.match(guide,/What remains free/);assert.match(guide,/cannot|none proves attention/);assert.match(guide,/\/study-planner/);
});
test('basic progress shows useful totals once, an accurate percentage and an honest calculation explanation',()=>{
 const html=render(RoomProgress,{totals:{today_seconds:43,total_seconds:3670},goalMinutes:120,formatDuration:s=>s+' sec'});
 assert.match(html,/0.6%/);assert.match(html,/43 sec/);assert.match(html,/3670 sec/);assert.match(html,/120 min/);
 assert.equal((html.match(/<progress /g)||[]).length,1);assert.match(html,/not a lifetime total/);assert.match(html,/midnight UTC/);assert.doesNotMatch(html,/room-progress-compact|Progress details/);
});
test('guide gives active owners useful shortcuts while guests and paused rooms get appropriate existing destinations',()=>{
 const owner=render(RoomStudyGuide,{canInvite:true,canPlan:true,canParticipate:true});
 assert.match(owner,/Copy invitation/);assert.match(owner,/Go to my place/);assert.match(owner,/Plan next activity/);assert.doesNotMatch(owner,/Full study group guide/);
 const guest=render(RoomStudyGuide,{});assert.match(guest,/View members/);assert.match(guest,/Review room access/);assert.match(guest,/View activities/);assert.doesNotMatch(guest,/Copy invitation|Plan next activity/);
});
test('activity exposes one shared countdown and ordinary recorded time while preserving personal timer controls',()=>{
 const activity={id:'a',roomId:'r',status:'running',startedAt:100000,focusMinutes:25,breakMinutes:5},timer={activity_id:'a',room_id:'r',status:'running',last_at:100000,check_at:1600000,credited_seconds:0};
 const html=render(ActivityClock,{activity,timer,now:146000,joined:true,own:{seconds:0},studying:true});
 assert.doesNotMatch(html,/00:00:46|This study interval/);assert.match(html,/00:24:14/);assert.match(html,/Pause study/);assert.match(html,/0 sec recorded/);assert.equal((html.match(/role="timer"/g)||[]).length,1);
 const paused=render(ActivityClock,{activity,timer:{...timer,status:'paused',credited_seconds:46},now:160000,joined:true,own:{seconds:46}});
 assert.match(paused,/Your timer is paused/);assert.match(paused,/Resume study/);assert.doesNotMatch(paused,/00:00:46/);
 const closed=render(ActivityClock,{activity,timer,now:146000,joined:true,own:{seconds:0},readOnly:true});assert.doesNotMatch(closed,/<button/);
});
test('finish action is a named button with disclosure state and clear privacy and irreversible participation consequences',()=>{
 const html=render(ActivityCheckout,{own:{checkedOutAt:0},phase:'focus'});
 assert.match(html,/<button[^>]*aria-expanded="false"[^>]*>Finish &amp; add result/);
 assert.match(html,/<form[^>]*hidden=""/);assert.match(html,/Your result is shared with members/);assert.match(html,/Your reflection is only visible to you/);assert.match(html,/cannot restart/);assert.match(html,/Finish study &amp; save result/);
});
test('break and ended activities reveal unsaved result forms; saved results expose an edit action instead of ending again',()=>{
 for(const phase of ['break','ended']){
  const html=render(ActivityCheckout,{own:{checkedOutAt:0},phase});assert.match(html,/aria-expanded="true"/);assert.doesNotMatch(html,/<form[^>]*hidden/);assert.match(html,/Hide form/);
 }
 const html=render(ActivityCheckout,{own:{checkedOutAt:123,outcome:'partial',reflection:'Private next step'},phase:'ended'});
 assert.match(html,/Edit result &amp; reflection/);assert.match(html,/Some progress/);assert.match(html,/Private reflection saved/);assert.match(html,/Save changes/);assert.doesNotMatch(html,/Finish &amp; add result|cannot restart/);
});
test.after(async()=>{assert.ok(path.resolve(dir).startsWith(path.join(root,'.wrangler','room-ui-')));await fs.rm(dir,{recursive:true,force:true});});
