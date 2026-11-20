import test from 'node:test';
import assert from 'node:assert/strict';
import {companionRoster,roomAccessNotice,roomGoalProgress} from '../src/lib/room-presentation.mjs';
const member=(id,readOnly=false)=>({id,nickname:'Member '+id,readOnly});
test('a free room shows its real member and three empty places without requiring advanced access',()=>{
 const r=companionRoster({members:[member('me')],profileId:'me',limit:4});
 assert.equal(r.members.length,1);assert.equal(r.emptySeats,3);assert.equal(r.extraPlaces,0);assert.equal(r.pages,1);
 assert.equal(roomAccessNotice({member:true,owner:true,room:{closed:false},access:{roomActive:true,canParticipate:true,advancedActive:false,source:'free'}}),null);
});
test('larger room capacity adds places while the first four-place presentation stays familiar',()=>{
 const r=companionRoster({members:[member('me'),member('other')],profileId:'me',limit:12});assert.equal(r.emptySeats,2);assert.equal(r.extraPlaces,8);
});
test('expired larger-room members remain reachable, active members come before read-only guests',()=>{
 const members=[member('z',true),member('b'),member('a'),member('c'),member('d',true),member('me')];
 const first=companionRoster({members,profileId:'me',limit:4}),last=companionRoster({members,profileId:'me',limit:4,page:8});
 assert.deepEqual(first.members.map(m=>m.id),['me','a','b','c']);assert.equal(first.emptySeats,0);assert.equal(first.pages,2);
 assert.deepEqual(last.members.map(m=>m.id),['d','z']);assert.equal(last.page,1);
});
test('search never creates invitations or loses a retained member, and closed rooms do not advertise places',()=>{
 const members=[member('me'),member('retained',true)];
 const found=companionRoster({members,profileId:'me',limit:4,search:'retained',page:9});assert.equal(found.members[0].id,'retained');assert.equal(found.emptySeats,0);assert.equal(found.extraPlaces,0);
 const closed=companionRoster({members,profileId:'me',limit:12,closed:true});assert.equal(closed.emptySeats,0);assert.equal(closed.extraPlaces,0);
});
test('an inactive owned free room explains the selected room and permits an explicit switch',()=>{
 const s={member:true,owner:true,room:{closed:false},access:{roomActive:false,canParticipate:false,source:'free',freeRoomId:'other'}};
 const n=roomAccessNotice(s,[{id:'other',name:'Reading group'}]);assert.equal(n.kind,'room');assert.match(n.body,/Reading group/);assert.equal(n.canChoose,true);assert.equal(n.freeRoomId,'other');
 assert.equal(roomAccessNotice({...s,owner:false}).canChoose,false);
});
test('an inactive member place does not pretend the whole room is unavailable or offer a room switch',()=>{
 const n=roomAccessNotice({member:true,owner:false,room:{closed:false},access:{roomActive:true,canParticipate:false,memberLimit:4}});
 assert.equal(n.kind,'seat');assert.equal(n.canChoose,false);assert.match(n.body,/4 active places/);
 assert.equal(roomAccessNotice({member:false,room:{closed:false},access:{canParticipate:false}}),null);
});

test('shared goal keeps meaningful fractional progress and does not round an unfinished goal to complete',()=>{
 assert.equal(roomGoalProgress(43,120).label,'0.6%');
 assert.equal(roomGoalProgress(1,120).label,'<0.1%');
 const near=roomGoalProgress(7199,120);assert.equal(near.label,'99.9%');assert.equal(near.complete,false);
 const over=roomGoalProgress(8000,120);assert.equal(over.label,'100%');assert.equal(over.value,7200);assert.equal(over.today,8000);assert.equal(over.complete,true);
 assert.equal(roomGoalProgress(0,120).label,'0%');
});
