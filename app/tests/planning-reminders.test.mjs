import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlanningSandbox} from '../src/lib/planning-sandbox.mjs';
import {createPlannerReminderService,readPlannerReminders,plannerReminderCandidates,plannerReminderIsCurrent,PLANNER_REMINDER_KEY} from '../src/lib/planning-reminders.mjs';
import {readManualSync,recordManualSync} from '../src/lib/manual-sync-status.mjs';
import {clearPlannerDeviceState,MANUAL_SYNC_KEY} from '../src/lib/planner-device-state.mjs';
const noon=Date.parse('2026-11-18T12:00Z');
function fixture(){
 let data=createPlanningSandbox(noon,'UTC','study').data,now=noon,visible=true,busy=false;
 const items=new Map(),alerts=[],storage={getItem:k=>items.get(k)||null,setItem:(k,v)=>items.set(k,v),removeItem:k=>items.delete(k)},locks={async request(key,options,fn){if(typeof options==='function'){fn=options;options={};}if(busy&&options.ifAvailable)return fn(null);assert.equal(busy,false);busy=true;try{return await fn({name:key});}finally{busy=false;}}};
 const make=()=>createPlannerReminderService({storage,locks,read:async()=>data,now:()=>now,visible:()=>visible,onReminder:r=>alerts.push(r)});
 return {get data(){return data;},set data(v){data=v;},storage,locks,alerts,make,setNow:n=>now=n,setVisible:v=>visible=v};
}
test('page reminders default off and send once across competing tabs and reloads without adding learning',async()=>{
 const f=fixture(),a=f.make(),b=f.make(),slot=f.data.workspace.planning.blocks[0],before=JSON.stringify(f.data);
 assert.equal(a.settings(f.data.epoch).enabled,false);f.setNow(slot.startAt-5*60000);assert.equal(await a.tick(),null);
 f.setNow(noon);await a.configure(f.data.epoch,{enabled:true,mode:'before'});f.setNow(slot.startAt-5*60000);
 await Promise.all([a.tick(),b.tick()]);assert.equal(f.alerts.length,1);await f.make().tick();assert.equal(f.alerts.length,1);assert.equal(JSON.stringify(f.data),before);
});
test('rescheduling invalidates an old occurrence; cancelling, completion, hidden pages and active timers suppress reminders',async()=>{
 const f=fixture(),s=f.make(),slot=f.data.workspace.planning.blocks[0];await s.configure(f.data.epoch,{enabled:true,mode:'start'});f.setNow(slot.startAt);
 f.setVisible(false);assert.equal(await s.tick(),null);f.setVisible(true);f.data.timer={status:'running'};assert.equal(await s.tick(),null);f.data.timer=null;
 slot.startAt+=3600000;slot.endAt+=3600000;assert.equal(await s.tick(),null);f.setNow(slot.startAt);
 slot.deletedAt=1;assert.equal(await s.tick(),null);slot.deletedAt=0;f.data.workspace.tasks.find(t=>t.id===slot.taskId).done=true;assert.equal(await s.tick(),null);assert.equal(f.alerts.length,0);
});
test('changing timing cannot re-send an occurrence and old wake-ups do not dump reminders',async()=>{
 const f=fixture(),s=f.make(),slot=f.data.workspace.planning.blocks[0];await s.configure(f.data.epoch,{enabled:true,mode:'before'});f.setNow(slot.startAt-5*60000);await s.tick();assert.equal(f.alerts.length,1);
 await s.configure(f.data.epoch,{enabled:true,mode:'start'});f.setNow(slot.startAt);assert.equal(await s.tick(),null);
 f.setNow(slot.startAt+3*60000);const prefs={...s.settings(f.data.epoch),seen:{}};assert.equal(plannerReminderCandidates(f.data,slot.startAt+3*60000,prefs).length,0);
});
test('preference writes must succeed before a reminder is shown; malformed settings reset safely and workspace resets disable them',async()=>{
 const f=fixture(),s=f.make();f.storage.setItem(PLANNER_REMINDER_KEY,'bad json');assert.equal(readPlannerReminders(f.storage,f.data.epoch).enabled,false);
 await s.configure(f.data.epoch,{enabled:true,mode:'start'});assert.equal(s.settings('new-epoch').enabled,false);
 f.setNow(f.data.workspace.planning.blocks[0].startAt);f.storage.setItem=()=>{throw Error('quota');};await assert.rejects(s.tick(),/quota/);assert.equal(f.alerts.length,0);
 const unsupported=createPlannerReminderService({storage:f.storage,locks:null,read:async()=>f.data});assert.equal(unsupported.supported,false);await assert.rejects(unsupported.configure(f.data.epoch,{enabled:true,mode:'start'}),/unavailable/);
});
test('only successful explicit manual sync writes a browser timestamp and a reset cannot inherit it',()=>{
 const f=fixture();assert.equal(readManualSync(f.storage,f.data.epoch),0);recordManualSync(f.storage,f.data.epoch,noon);assert.equal(readManualSync(f.storage,f.data.epoch),noon);assert.equal(readManualSync(f.storage,'new-epoch'),0);
});
test('a visible notice expires and cannot open a renamed occurrence, excluded activity or archived preparation',async()=>{
 const f=fixture(),s=f.make(),slot=f.data.workspace.planning.blocks[0];await s.configure(f.data.epoch,{enabled:true,mode:'start'});f.setNow(slot.startAt);const notice=await s.tick();assert.equal(plannerReminderIsCurrent(f.data,notice,slot.startAt),true);
 assert.equal(plannerReminderIsCurrent(f.data,notice,slot.startAt+120000),false);slot.endAt+=60000;assert.equal(plannerReminderIsCurrent(f.data,notice,slot.startAt),false);
 const data=createPlanningSandbox(noon,'UTC','prep').data,rule=data.workspace.planning.rules.find(r=>r.prep.stage==='review'),block=data.workspace.planning.blocks.find(b=>b.taskId===rule.id&&!b.deletedAt),prefs={...readPlannerReminders(f.storage,data.epoch),epoch:data.epoch,enabled:true,enabledAt:noon,mode:'start',seen:{}};
 assert.ok(plannerReminderCandidates(data,block.startAt,prefs).some(r=>r.block.id===block.id));rule.prep.omitted=true;assert.ok(!plannerReminderCandidates(data,block.startAt,prefs).some(r=>r.block.id===block.id));rule.prep.omitted=false;data.workspace.exams.find(e=>e.id===data.workspace.planning.examPlans[0].examId).archived=true;assert.ok(!plannerReminderCandidates(data,block.startAt,prefs).some(r=>r.block.id===block.id));
});
test('clearing study data removes planner device metadata without clearing other local preferences',()=>{
 const f=fixture();f.storage.setItem(PLANNER_REMINDER_KEY,'reminders');f.storage.setItem(MANUAL_SYNC_KEY,'sync');f.storage.setItem('other-setting','keep');clearPlannerDeviceState(f.storage);assert.equal(f.storage.getItem(PLANNER_REMINDER_KEY),null);assert.equal(f.storage.getItem(MANUAL_SYNC_KEY),null);assert.equal(f.storage.getItem('other-setting'),'keep');
});
