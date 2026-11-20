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
await build({stdin:{contents:"export {StudyCompanions} from './src/components/StudyCompanions.jsx';export {RoomAdvancedArea,RoomAccessNotice,RoomStudyGuide,RoomProgress} from './src/components/RoomStudyAdditions.jsx';",resolveDir:root,loader:'jsx'},outfile:file,bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic',loader:{'.css':'empty'},logLevel:'silent'});
const {StudyCompanions,RoomAdvancedArea,RoomAccessNotice,RoomStudyGuide,RoomProgress}=await import(pathToFileURL(file).href);
const profile={id:'me'},room={id:'room',name:'Reading',capacity:4,invitationsOpen:true,closed:false,ownerId:'me'},access={roomActive:true,canParticipate:true,advancedActive:false,memberLimit:4,source:'free'};
const selected={room,access,member:true,owner:true,joinLimit:4,members:[{id:'me',nickname:'Reader',last_seen:100000,readOnly:false,session_seconds:0,today_seconds:0}],messages:[],moderationAvailable:true,mutedUntil:0,entitlements:{freeText:false}};
const render=(Component,props)=>renderToStaticMarkup(createElement(Component,props));
test('free room renders four places, real timer controls and usable fixed messages without an advanced grant',()=>{
 const html=render(StudyCompanions,{selected,profile,me:{},now:100000,connection:'Live'});
 assert.equal((html.match(/companion-empty-place/g)||[]).length,3);assert.match(html,/Start studying/);assert.match(html,/1\/4 members/);
 assert.match(html,/<button[^>]*>[^<]*<svg[\s\S]*?Starting study/);assert.doesNotMatch(html,/Advanced tools are read only/);
 const quick=html.match(/<button class="button"[^>]*>[\s\S]*?<span>Starting study<\/span><\/button>/);assert.ok(quick);assert.doesNotMatch(quick[0].split('>')[0],/disabled/);
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
test.after(async()=>{assert.ok(path.resolve(dir).startsWith(path.join(root,'.wrangler','room-ui-')));await fs.rm(dir,{recursive:true,force:true});});
