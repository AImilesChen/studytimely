import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const root=path.resolve(import.meta.dirname,'..'),directory=await fs.mkdtemp(path.join(root,'.wrangler/manage-ui-'));
const file=path.join(directory,'components.mjs');
await build({stdin:{contents:"export {RoomManage,freeSeatIds,roomDraftMatches,changedPlaceMembers} from './src/components/RoomManage.jsx';export {RoomManageGuide} from './src/components/RoomManageGuide.jsx';",resolveDir:root,loader:'jsx'},outfile:file,bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic',loader:{'.css':'empty'},logLevel:'silent'});
const {RoomManage,RoomManageGuide,freeSeatIds,roomDraftMatches,changedPlaceMembers}=await import(pathToFileURL(file).href);
const render=(Component,props)=>renderToStaticMarkup(createElement(Component,props));
const room={id:'room',name:'Reading partners',capacity:4,subject:'general',announcement:'welcome',ownerId:'owner',inviteCode:'sample-invitation-code',invitationsOpen:true,version:1,goalMinutes:120,visibility:'private'};
const owner={id:'owner',nickname:'Reader',joined_at:1,online:true,readOnly:false},member={id:'member',nickname:'Partner',joined_at:2,readOnly:false};
const selected={room,member:true,owner:true,access:{canParticipate:true,roomActive:true,advancedActive:false,freeRoomId:'room'},members:[owner],cohosts:[],removedMembers:[],joinLimit:4,serverNow:1000};
const me={rooms:[{id:'room',owner_id:'owner',name:room.name}],freeRoomSelection:{version:0}},props={selected,me,profile:owner,visible:false};

test('single-room owner sees real forms, invitation code and members without folded tools or redundant room choice',()=>{
 const html=render(RoomManage,props);
 for(const text of ['Manage your room','Room details','Room name','Study theme','Pinned study notice','All changes saved','Copy invitation link','sample-invitation-code','Allow invitations and new joins','Members &amp; places','3 places available','Close room'])assert.ok(html.includes(text),text);
 assert.doesNotMatch(html.slice(0,html.indexOf('class="rm-guide"')),/<details|Room to keep active|Save free places|Moderation queue|Review capacity|Edit room theme/);
 assert.ok(html.indexOf('rm-layout')<html.indexOf('rm-guide'));assert.ok(html.indexOf('rm-guide')<html.indexOf('rm-danger'));
 const ids=[...html.matchAll(/ id="([^"]+)"/g)].map(match=>match[1]);assert.equal(ids.length,new Set(ids).size);
});

test('members see room information and their own exit, without owner fields or invitations',()=>{
 const html=render(RoomManage,{...props,selected:{...selected,owner:false,canManage:false,members:[owner,member]},profile:member});
 assert.match(html,/Reading partners/);assert.match(html,/Members &amp; places/);assert.match(html,/Leave room/);
 assert.doesNotMatch(html.slice(0,html.indexOf('class="rm-guide"')),/Save changes|Copy invitation link|sample-invitation-code|Allow invitations and new joins|Close room|Reports in this room/);
});

test('member actions target the corresponding row and co-hosts cannot manage peers or the owner',()=>{
 const helper={id:'helper',nickname:'Helper',joined_at:3},peer={id:'peer',nickname:'Peer',joined_at:4};
 const ownerHTML=render(RoomManage,{...props,selected:{...selected,members:[owner,member]}});
 assert.match(ownerHTML,/Can study in this room/);assert.match(ownerHTML,/Owner · fixed place/);assert.doesNotMatch(ownerHTML,/<button[^>]*>Save place changes<\/button>/);assert.match(ownerHTML,/Remove from room/);assert.match(ownerHTML,/Block rejoining/);
 assert.doesNotMatch(ownerHTML,/Role for Partner/);
 const advanced={...selected,owner:false,canManage:true,access:{...selected.access,advancedActive:true},members:[owner,member,helper,peer],cohosts:['helper','peer']};
 const helperHTML=render(RoomManage,{...props,selected:advanced,profile:helper});
 assert.equal((helperHTML.match(/Remove from room<\/button>/g)||[]).length,1);
 const readOnly=render(RoomManage,{...props,selected:{...selected,access:{...selected.access,canParticipate:false,roomActive:false}}});
 assert.match(readOnly,/read only/);assert.doesNotMatch(readOnly,/<form[^>]*aria-label="Room details"/);assert.match(readOnly,/Close room/);
});

test('free-place defaults include the owner separately and an explicit empty selection stays empty',()=>{
 assert.deepEqual(freeSeatIds({...selected,members:[member,owner]}),['member']);
 assert.deepEqual(freeSeatIds({...selected,room:{...room,freeSeatsChosen:true},access:{...selected.access,freeMemberIds:[]},members:[owner,member]}),[]);
 assert.deepEqual(freeSeatIds({...selected,access:{...selected.access,freeMemberIds:['left','member']},members:[owner,member]}),['member']);
});

test('public management guidance includes actionable examples without private invitation codes or image screenshots',()=>{
 const html=render(RoomManageGuide,{publicGuide:true});
 assert.match(html,/id="group-room-management"/);assert.match(html,/How to invite partners and manage a study room/);
 assert.equal((html.match(/<figure/g)||[]).length,3);assert.match(html,/read-only place/);assert.match(html,/Closing a room is permanent/);
 assert.doesNotMatch(html,/<button|sample-invitation-code|<img/);
});

test('owners can copy an existing invitation while joins are paused or the room is full',()=>{
 const previous=Object.getOwnPropertyDescriptor(globalThis,'location');
 Object.defineProperty(globalThis,'location',{configurable:true,value:{origin:'https://study.test'}});
 try{
  const more=[{...member,id:'second'},{...member,id:'third'}];
  for(const state of [{...selected,room:{...room,invitationsOpen:false}},{...selected,members:[owner,member,...more]}]){
   const html=render(RoomManage,{...props,selected:state});
   const button=html.match(/<button[^>]*>Copy invitation link<\/button>/)?.[0];assert.ok(button);assert.doesNotMatch(button,/disabled/);
   assert.match(html,/You can share this link now/);
  }
  const closed=render(RoomManage,{...props,selected:{...selected,room:{...room,closed:true}}});
  assert.match(closed,/<button[^>]*disabled=""[^>]*>Copy invitation link/);
  const inactive=render(RoomManage,{...props,selected:{...selected,access:{...selected.access,canParticipate:false}}});
  assert.match(inactive,/<button[^>]*disabled=""[^>]*>Copy invitation link/);
 }finally{if(previous)Object.defineProperty(globalThis,'location',previous);else delete globalThis.location;}
});

test('invitation switch and member actions have explicit labels while owner place is fixed text',()=>{
 const html=render(RoomManage,{...props,selected:{...selected,members:[owner,member]}});
 assert.match(html,/Invitations open/);assert.match(html,/role="switch"/);assert.match(html,/rm-switch-track/);assert.match(html,/Changes save immediately/);
 for(const label of ['Mute for 1 hour','Remove from room','Block rejoining','Replace invitation code'])assert.match(html,new RegExp('<button[^>]*class="button[^"]*"[^>]*>'+label+'</button>'));
 assert.doesNotMatch(html,/aria-label="[^"]*Reader"[^>]*disabled=""/);
 assert.match(html,/Owner · fixed place/);assert.match(html,/All changes saved/);
 const paused=render(RoomManage,{...props,selected:{...selected,room:{...room,invitationsOpen:false}}});assert.match(paused,/Invitations paused/);
});

test('dirty state recognises reverted edits, unordered place selections and metadata-only refreshes',()=>{
 assert.equal(roomDraftMatches({name:'Reading',version:1},{name:'Reading',version:4}),true);
 assert.equal(roomDraftMatches({name:'Reading'},{name:'Maths'}),false);
 assert.equal(roomDraftMatches({ids:['second','member'],memberKey:'new',version:2},{ids:['member','second'],memberKey:'old',version:1}),true);
 assert.equal(roomDraftMatches({capacity:'4'},{capacity:4}),true);
 assert.equal(roomDraftMatches({subject:'general',custom:'Unpublished draft'},{subject:'general',custom:''}),true);
 assert.equal(roomDraftMatches({subject:'custom',custom:'Reading'},{subject:'custom',custom:'Maths'}),false);
});

test('pending place summary counts only members whose permission will change, excluding the owner',()=>{
 const other={id:'other',nickname:'Other partner'};
 assert.deepEqual(changedPlaceMembers([owner,member,other],['member'],['other','owner'],'owner').map(item=>item.id),['member','other']);
 assert.deepEqual(changedPlaceMembers([owner,member,other],['member','other'],['other','member'],'owner'),[]);
});

test.after(async()=>{await fs.rm(directory,{recursive:true,force:true});});
