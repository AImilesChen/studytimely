import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory} from 'fake-indexeddb';
import {emptyState,transition} from '../src/lib/model.mjs';
import {createRepository} from '../src/lib/storage.mjs';
import {focusConfig,focusFeedback,FOCUS_STARTERS,applyFocusStarter,emptyFocusDevice,readFocusDevice,writeFocusDevice,clearFocusDevice,FOCUS_DEVICE_PREFIX} from '../src/lib/focus-space.mjs';
const run=(s,type,p={},at=10000,id=crypto.randomUUID(),owner='owner')=>transition(s,{type,epoch:s.epoch,...p},{now:at,id,owner}).state;
const config=()=>focusConfig();
test('focus configurations validate modes, durations and every sound channel',()=>{
 for(const patch of [{mode:'alarm'},{scene:'unknown'},{minutes:0},{minutes:241},{minutes:1.5},{breakMinutes:61},{volume:101},{sound:'yes'},{endSound:'random'},{mix:{evil:20}}])assert.throws(()=>focusConfig(patch));
 assert.equal(focusConfig({mode:'study'}).mode,'study');
});
test('studio creates and starts one task atomically without inventing time',()=>{
 let s=run(emptyState('e'),'studio-start',{config:config(),title:'Practise algebra',subject:'Maths'},10000,'start');
 assert.equal(s.workspace.tasks.length,1);assert.equal(s.timer.taskId,'start:task');assert.equal(s.timer.subject,'Maths');assert.equal(s.timer.mode,'focus');assert.equal(s.timer.status,'running');assert.equal(s.sessions.length,0);
 assert.throws(()=>run(s,'studio-start',{config:config(),title:'Duplicate'}),/Finish or reset/);
 const task=structuredClone(s.workspace.tasks[0]);s=run(s,'pause',{},14000);s=run(s,'start',{mode:'focus'},19000);s=run(s,'finish',{},25000);
 assert.equal(s.sessions.length,1);assert.equal(s.sessions[0].durationSeconds,10);assert.equal(s.sessions[0].taskId,task.id);assert.equal(s.workspace.tasks[0].done,false);
 const payload=focusFeedback(s,s.sessions[0],{done:false,remainingMinutes:15});s=run(s,'planning-feedback',payload,26000);assert.equal(s.workspace.planning.rules[0].remainingMinutes,15);assert.equal(s.sessions.length,1);
});
test('existing task links, review guards and other-tab ownership remain authoritative',()=>{
 let s=run(emptyState('e'),'task-save',{title:'Existing',estimateMinutes:30},10000,'task');s=run(s,'studio-start',{config:{...config(),mode:'study'},taskId:'task'},11000,'session');
 assert.equal(s.workspace.tasks.length,1);assert.equal(s.timer.taskId,'task');
 assert.throws(()=>run(s,'finish',{},15000,'x','other'),/another tab/);
 s=run(s,'clock-change',{},16000);assert.equal(s.timer.status,'review');assert.throws(()=>run(s,'finish',{},17000),/Review/);assert.equal(s.sessions.length,0);
});
test('bad starts leave the original workspace untouched; missing and completed draft data do not get reused',()=>{
 const s=emptyState('e');assert.throws(()=>run(s,'studio-start',{config:config(),taskId:'missing'}));assert.deepEqual(s,emptyState('e'));
 let a=run(s,'studio-start',{config:{...config(),mode:'pomodoro'},title:'First'},10000,'first');a=run(a,'finish',{},12000);a=run(a,'studio-start',{config:{...config(),mode:'study'}},13000,'second');assert.equal(a.timer.taskId,undefined);assert.equal(a.timer.phase,'Study');assert.equal(a.workspace.tasks.length,1);
});
test('break countdown records no learning and cannot replace an active session',()=>{
 let s=run(emptyState('e'),'studio-break',{minutes:5},10000,'break');assert.equal(s.timer.studioBreak,true);assert.equal(s.timer.mode,'countdown');assert.throws(()=>run(s,'studio-start',{config:config()}));s=run(s,'tick',{},310000);assert.equal(s.timer.status,'completed');assert.equal(s.sessions.length,0);
 s=run(s,'studio-start',{config:config()},311000);assert.equal(s.timer.mode,'focus');assert.equal(s.timer.studioBreak,undefined);
});
test('repeated note conversion is idempotent across refresh, even after task deletion',()=>{
 let s=run(emptyState('e'),'studio-note-task',{noteId:'note-1',title:'Read chapter'},10000,'a');s=run(s,'studio-note-task',{noteId:'note-1',title:'Read chapter'},11000,'b');assert.equal(s.workspace.tasks.length,1);assert.equal(s.sessions.length,0);s=run(s,'workspace-delete',{collection:'tasks',itemId:'focus-note:note-1'},12000);s=run(s,'studio-note-task',{noteId:'note-1',title:'Read chapter'},13000);assert.equal(s.workspace.tasks.length,1);assert.ok(s.workspace.tasks[0].deletedAt);
});
const memoryStorage=()=>{const m=new Map();return{get length(){return m.size;},key:i=>[...m.keys()][i],getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
test('device notes are workspace-scoped, bounded, conflict-checked and cleared independently',()=>{
 const storage=memoryStorage(),a=emptyFocusDevice();let b=writeFocusDevice(storage,'a',a,{...a,notes:[{id:'n',text:'Private thought',at:1}]});assert.equal(readFocusDevice(storage,'b').notes.length,0);assert.equal(readFocusDevice(storage,'a').notes[0].text,'Private thought');assert.throws(()=>writeFocusDevice(storage,'a',a,a),/another tab/);
 assert.throws(()=>writeFocusDevice(storage,'a',b,{...b,notes:Array.from({length:51},(_,i)=>({id:String(i),text:'x',at:1}))}));assert.equal(readFocusDevice(storage,'a').notes.length,1);
 storage.setItem('other-app','kept');clearFocusDevice(storage);assert.equal(storage.getItem('other-app'),'kept');assert.equal(storage.getItem(FOCUS_DEVICE_PREFIX+'a'),null);
});
test('storage failures never return a saved device document',()=>{
 const storage=memoryStorage();storage.setItem=()=>{throw Error('Quota exceeded');};assert.throws(()=>writeFocusDevice(storage,'a',emptyFocusDevice(),emptyFocusDevice()),/Quota/);
});
test('feedback requires an existing task and a meaningful remaining-work choice',()=>{
 let s=run(emptyState('e'),'studio-start',{config:config(),title:'Task'},10000);s=run(s,'finish',{},12000);const record=s.sessions[0];assert.throws(()=>focusFeedback(s,record,{done:false,remainingMinutes:0}));assert.equal(focusFeedback(s,record,{done:true,remainingMinutes:0}).done,true);assert.throws(()=>focusFeedback(s,{taskId:'missing'},{done:true,remainingMinutes:0}));
});

test('the real repository transaction makes concurrent starts and repeated note conversion safe',async()=>{
 const db=new IDBFactory(),a=createRepository({indexedDB:db}),b=createRepository({indexedDB:db});const initial=await a.load();await b.load();
 const action={type:'studio-start',config:config(),title:'One task',epoch:initial.epoch};
 const attempts=await Promise.allSettled([a.command(action,{id:'one',owner:'a',now:10000}),b.command(action,{id:'two',owner:'b',now:10000})]);assert.equal(attempts.filter(r=>r.status==='fulfilled').length,1);const stored=await a.read();assert.equal(stored.workspace.tasks.length,1);assert.equal(stored.sessions.length,0);
 const note={type:'studio-note-task',noteId:'same-note',title:'Follow up',epoch:stored.epoch};await Promise.all([a.command(note,{id:'x',owner:'a',now:11000}),b.command(note,{id:'y',owner:'b',now:11000})]);assert.equal((await a.read()).workspace.tasks.filter(t=>t.id==='focus-note:same-note').length,1);a.close();b.close();
});

test('end-sound choice follows the device timer through Pomodoro phases without entering study records',()=>{
 let s=run(emptyState('e'),'studio-start',{config:{...config(),mode:'pomodoro',minutes:1}},10000,'sound');assert.equal(s.timer.studioAudio,'fade');s=run(s,'tick',{},70000);assert.equal(s.timer.phase,'Short break');assert.equal(s.timer.studioAudio,'fade');assert.equal(s.sessions.length,1);assert.equal(s.sessions[0].studioAudio,undefined);assert.equal(s.timer.status,'ready');
});

test('saved focus setups retain a soundtrack without starting playback or changing timer settings',()=>{
 const old=focusConfig({scene:'coast',mix:{rain:20}});assert.equal(old.musicTrack,'');assert.deepEqual(old.musicQueue,[]);
 const c=focusConfig({...old,musicTrack:'meditation-01',musicVolume:20,musicRepeat:'all',musicQueue:['meditation-01','water-prelude']});assert.equal(c.musicVolume,20);assert.deepEqual(c.musicQueue,['meditation-01','water-prelude']);assert.throws(()=>focusConfig({...c,musicTrack:'unknown'}));
 let s=run(emptyState('music-preset'),'studio-start',{config:c,title:'Read quietly'},10000,'start');assert.equal(s.sessions.length,0);assert.equal(s.settings.musicTrack,'meditation-01');assert.equal(s.settings.musicVolume,35);
});


test('suggested setups preserve user preferences and never enable sound or create a session',()=>{
 const original=focusConfig({appearance:'night',musicTrack:'meditation-01',sound:true}),snapshot=JSON.stringify(original);
 for(const {id} of FOCUS_STARTERS){const next=applyFocusStarter(original,id);assert.equal(next.appearance,'night');assert.equal(next.musicTrack,'meditation-01');assert.equal(next.sound,false);assert.ok(next.minutes>0);assert.notEqual(next.mix,original.mix);}
 assert.equal(JSON.stringify(original),snapshot);assert.throws(()=>applyFocusStarter(original,'missing'));
});

test('moving a studio session preserves its identity and recorded intervals without creating study credit',()=>{
 let s=run(emptyState('transfer'),'studio-start',{config:config(),title:'Synthetic transfer'},10000,'transfer','owner-a');const id=s.timer.id;
 assert.throws(()=>run(s,'pause',{},12000,'wrong-tab','owner-b'),/another tab/);
 s=run(s,'claim',{timerId:id},13000,'claim','owner-b');assert.equal(s.timer.id,id);assert.equal(s.timer.owner,'owner-b');assert.equal(s.timer.status,'paused');assert.equal(s.timer.baseMs,3000);assert.equal(s.sessions.length,0);assert.equal(s.workspace.tasks.length,1);
});
