import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),now=Date.parse('2026-11-21T12:00:00Z');
const result=await build({stdin:{contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {GroupWorkspace,GroupEntries,GroupDiscovery,MyGroupsGuide,MyGroups} from './src/components/MyGroups.jsx';export const workspace=p=>renderToStaticMarkup(<GroupWorkspace {...p}/>);export const entries=p=>renderToStaticMarkup(<GroupEntries {...p}/>);export const discovery=p=>renderToStaticMarkup(<GroupDiscovery {...p}/>);export const guide=()=>renderToStaticMarkup(<MyGroupsGuide/>);export const page=p=>renderToStaticMarkup(<MyGroups {...p}/>);`,resolveDir:fileURLToPath(new URL('../',import.meta.url)),loader:'jsx'},bundle:true,platform:'node',format:'cjs',jsx:'automatic',external:['react','react-dom/server','react/jsx-runtime'],loader:{'.css':'empty'},write:false,logLevel:'silent'});
const mod={exports:{}};new Function('require','module','exports',result.outputFiles[0].text)(require,mod,mod.exports);const ui=mod.exports;
function state(){const room={id:'room-one',name:'Evening revision',subject:'maths',owner_id:'profile',can_participate:1,room_active:1,member_count:1,capacity:4};return{me:{profile:{id:'profile'},rooms:[room],timer:null,roomOwnership:{limit:1,openCount:1}},selectedId:room.id,busy:false,detailStatus:'ready',activityStatus:'ready',activities:[],detail:{room:{id:room.id,name:room.name,subject:room.subject,visibility:'private',capacity:4,goalMinutes:120,invitationsOpen:true,inviteCode:'a'.repeat(24),closed:false},member:true,owner:true,access:{roomActive:true,canParticipate:true},members:[{id:'profile',nickname:'Reader',last_seen:now,today_seconds:0,readOnly:false,timer_status:'paused'}],totals:{today_seconds:0},serverNow:now},rooms:[],directoryStatus:'ready',meStatus:'ready'};}
const props=s=>({state:s,client:{accountId:'account',lease:'own'},now,connection:'Live',lease:'own'});

test('selected room exposes its actual timer, members and invitation without another navigation menu',()=>{
 const html=ui.workspace(props(state()));for(const text of ['Evening revision','Maths','Start my study','Copy invitation link','Studying alongside you','Next time together','No upcoming activity'])assert.ok(html.includes(text),text);assert.ok(!html.includes('<nav'));assert.ok(!html.includes('<details'));assert.ok(!html.includes('<svg'));assert.ok(html.includes('/images/group-tools/tasks-art.jpg'));assert.ok(!html.includes('Enter room'));
});
test('read-only owners, members and closed rooms show different explanations and no unusable timer',()=>{
 let s=state();s.detail.access={roomActive:false,canParticipate:false};let html=ui.workspace(props(s));assert.ok(html.includes('Use as my free room'));assert.ok(!html.includes('Start my study'));assert.ok(html.includes('Records and membership are kept'));
 s=state();s.detail.owner=false;s.detail.access={roomActive:true,canParticipate:false};html=ui.workspace(props(s));assert.ok(html.includes('No active place'));assert.ok(html.includes('owner chooses'));assert.ok(!html.includes('Use as my free room'));assert.ok(!html.includes('Copy invitation link'));
 s.detail.room.closed=true;html=ui.workspace(props(s));assert.ok(html.includes('Closed · records kept'));assert.ok(!html.includes('Start my study'));
});
test('an active timer in another room stays visible and blocks a silent replacement',()=>{
 const s=state();s.me.timer={room_id:'other',lease:'own',status:'running',last_at:now,check_at:now+1500000,credited_seconds:10};const html=ui.workspace(props(s));assert.ok(html.includes('Browsing here does not stop it'));assert.ok(html.includes('Show my running room'));assert.match(html,/<button[^>]*disabled=""[^>]*>Start my study/);
});
test('upcoming activities join inline and distinguish reservation from starting a timer',()=>{
 const s=state();s.activities=[{id:'activity',title:'Quiet questions',startsAt:now+3600000,zone:'UTC',status:'scheduled',focusMinutes:25,breakMinutes:5,joined:false}];let html=ui.workspace(props(s));assert.ok(html.includes('Quiet questions'));assert.ok(html.includes('Join this activity'));assert.ok(!html.includes('Start my activity timer'));
 s.activities[0]={...s.activities[0],status:'running',startedAt:now-60000,joined:true};html=ui.workspace(props(s));assert.ok(html.includes('Your place is reserved'));assert.ok(html.includes('Start my activity timer'));
});
test('join/create forms stay on-page, respect the allowance and do not imply that full invitations can join',()=>{
 const s=state();s.me.roomOwnership.openCount=0;let html=ui.entries({...props(s),authReady:true});for(const text of ['Invitation link or code','Check invitation','Create a study room in My groups','Create my room','Study theme','Who can join'])assert.ok(html.includes(text),text);assert.ok(!html.includes('<details'));
 s.me.roomOwnership.openCount=1;html=ui.entries({...props(s),authReady:true});assert.ok(html.includes('current room allowance is in use'));assert.ok(!html.includes('Create my room'));
 s.invitation={room:{name:'Full private room',members:4,joinLimit:4},code:'a'.repeat(24)};html=ui.entries({...props(s),authReady:true});assert.ok(html.includes('All places are taken'));assert.match(html,/<button[^>]*disabled=""[^>]*>Confirm &amp; join room/);
});
test('loading/auth/errors are honest; the illustrated guide has no fake clickable controls',()=>{
 const guest=ui.page({auth:null,loaded:true});assert.ok(guest.includes('Sign-in options'));assert.ok(guest.includes('disabled=""'));assert.ok(!guest.includes('id="mg-room-title"'));
 const waiting=ui.page({auth:{user:{syncAccountId:'account',googleLinked:true}},loaded:true});assert.ok(waiting.includes('Loading your community details'));assert.ok(!/<button[^>]*>Start my study/.test(waiting));
 const s=state();s.detailStatus='error';s.roomError='Updates are unavailable';const error=ui.workspace(props(s));assert.ok(error.includes('Retry this room'));assert.ok(!error.includes('Start my study'));
 const guide=ui.guide();assert.ok(guide.includes('Illustration')||guide.includes('illustration'));assert.equal((guide.match(/<img /g)||[]).length,1);assert.ok(!/<(?:button|form|details)\b/.test(guide));
});
