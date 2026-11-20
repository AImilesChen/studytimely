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

test('room footer exposes essential answers without nested disclosures and retains permission-aware shortcuts',()=>{
 const empty=render(RoomStudyGuide,{canInvite:true,canPlan:true,canParticipate:true,totals:{today_seconds:0},goalMinutes:120,activityOverview:{notice:null,loading:false,error:false}});
 assert.match(empty,/No activity arranged/);assert.match(empty,/0 sec/);assert.match(empty,/120 min/);
 assert.doesNotMatch(empty,/<details class="room-study-help"|room-guide-steps|role="timer"/);
 assert.ok(empty.indexOf('room-session-overview')<empty.indexOf('room-routine-tip'));
 const firstDisclosure=empty.indexOf('<details');
 for(const answer of ['Start studying anytime','Understand the two clocks','Add a result and private reflection'])assert.ok(empty.indexOf(answer)>0&&empty.indexOf(answer)<firstDisclosure,answer);
 assert.equal((empty.match(/<details/g)||[]).length,4);assert.equal((empty.match(/<progress /g)||[]).length,1);
 assert.match(empty,/View group progress/);assert.match(empty,/Copy invitation/);assert.match(empty,/Go to my place/);assert.match(empty,/Plan next activity/);assert.match(empty,/Full study group guide/);
 assert.match(empty,/Your study time counts once/);assert.match(empty,/Saving ends your participation/);
 const recorded=render(RoomStudyGuide,{totals:{today_seconds:43},goalMinutes:120});
 assert.match(recorded,/43 sec/);assert.match(recorded,/0.6% of the daily shared goal/);
});

test('unknown totals, unset goals and activity errors never appear as fabricated study or empty appointments',()=>{
 const unknown=render(RoomStudyGuide,{activityOverview:{error:true,loading:false,notice:null}});
 assert.match(unknown,/Not available/);assert.match(unknown,/Not set/);assert.match(unknown,/Activity details are unavailable/);
 assert.doesNotMatch(unknown,/No activity arranged|0 sec|120 min|<progress/);
 const loading=render(RoomStudyGuide,{activityOverview:{notice:null,loading:true,error:false}});
 assert.match(loading,/role="status"/);assert.match(loading,/Loading your room/);assert.doesNotMatch(loading,/No activity arranged/);
});

test('activity overview displays the existing appointment as text, including read-only and stale-update states',()=>{
 const notice={title:'Reading <together>',state:'scheduled',description:'20 Nov 2026, 18:00 · Europe/London · 25 min study'};
 const html=render(RoomStudyGuide,{activityOverview:{notice,error:false,loading:false},canPlan:false});
 assert.match(html,/Next activity/);assert.match(html,/Reading &lt;together&gt;/);assert.match(html,/Europe\/London/);assert.match(html,/View activities/);
 assert.doesNotMatch(html,/Plan next activity|role="timer"|<form|Start activity/);
 const stale=render(RoomStudyGuide,{activityOverview:{notice,error:true,loading:false}});
 assert.match(stale,/Updates are unavailable/);assert.match(stale,/Reading &lt;together&gt;/);assert.doesNotMatch(stale,/No activity arranged/);
});

test('viewing an existing activity does not trigger the owner plan form, while a known empty room can plan',()=>{
 const text=node=>Array.isArray(node)?node.map(text).join(''):typeof node==='string'?node:node?.props?text(node.props.children):'';
 const find=(node,label)=>{if(Array.isArray(node)){for(const child of node){const match=find(child,label);if(match)return match;}}else if(node?.props){if(node.type==='button'&&text(node).trim()===label)return node;return find(node.props.children,label);}};
 let planned=0,viewed=0;
 const actions={canPlan:true,onPlan:()=>planned++,onActivities:()=>viewed++};
 const existing=RoomStudyGuide({...actions,activityOverview:{notice:{title:'Reading',state:'scheduled',description:'Tomorrow'}}});
 find(existing,'View activities').props.onClick();assert.equal(viewed,1);assert.equal(planned,0);
 const empty=RoomStudyGuide({...actions,activityOverview:{notice:null,loading:false,error:false}});
 find(empty,'Plan next activity').props.onClick();assert.equal(planned,1);assert.equal(viewed,1);
 const unavailable=RoomStudyGuide({...actions,activityOverview:{notice:null,error:true}});
 find(unavailable,'View activities').props.onClick();assert.equal(viewed,2);assert.equal(planned,1);
 const html=render(RoomStudyGuide,actions);assert.match(html,/<a[^>]*href="\/study-groups#group-how" target="_blank" rel="noopener noreferrer"/);
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
 const owner=render(RoomStudyGuide,{canInvite:true,canPlan:true,canParticipate:true,activityOverview:{notice:null,loading:false,error:false}});
 assert.match(owner,/Copy invitation/);assert.match(owner,/Go to my place/);assert.match(owner,/Plan next activity/);assert.match(owner,/Full study group guide/);
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
