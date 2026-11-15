import test from 'node:test';import assert from 'node:assert/strict';
import {IDBFactory} from 'fake-indexeddb';
import {emptyState,transition} from '../src/lib/model.mjs';
import {checkState,createRepository,backupOf} from '../src/lib/storage.mjs';
import {createAlarmAudio} from '../src/lib/alarm-audio.mjs';
import {execFileSync} from 'node:child_process';
const now=Date.UTC(2026,10,15,9),act=(s,type,p={},at=now,owner='a')=>transition(s,{type,epoch:s.epoch,...p},{now:at,owner,id:crypto.randomUUID()});
const arm=(s=emptyState('x'),p={})=>act(s,'reminder-arm',{at:now+60000,expectedId:s.reminder?.id??null,...p}).state;
test('alarm and study timer run independently; tick, snooze and cancel cannot credit or reset study',()=>{
 let s=act(emptyState('x'),'start',{mode:'study'}).state,original=structuredClone(s.timer);s=arm(s);assert.deepEqual(s.timer,original);const a=s.reminder;
 let r=act(s,'reminder-tick',{reminderId:a.id},now+60000);assert.equal(r.event,'alarm-reached');assert.deepEqual(r.state.timer,original);assert.equal(r.state.sessions.length,0);
 s=act(r.state,'reminder-snooze',{reminderId:a.id},now+61000).state;assert.equal(s.reminder.at,now+361000);assert.deepEqual(s.timer,original);
 s=act(s,'reminder-dismiss',{reminderId:s.reminder.id},now+62000).state;assert.deepEqual(s.timer,original);
 const saved=act(s,'finish',{},now+65000);assert.equal(saved.state.sessions[0].durationSeconds,65);assert.equal(saved.state.reminder.status,'dismissed');
});
test('ownership, revisions and deadline bounds reject stale tabs without overwriting another alarm',()=>{
 let s=arm();const a=s.reminder;assert.throws(()=>act(s,'reminder-arm',{at:now+50000,expectedId:a.id},now,'b'),{code:'OTHER_TAB'});assert.throws(()=>act(s,'reminder-arm',{at:now+50000,expectedId:null}),/changed/);assert.throws(()=>act(s,'reminder-dismiss',{reminderId:a.id},now,'b'),/another tab/);
 s=act(s,'reminder-claim',{reminderId:a.id},now+1000,'b').state;assert.equal(s.reminder.at,a.at);assert.equal(s.reminder.owner,'b');assert.throws(()=>act(s,'reminder-tick',{reminderId:a.id},now+60000,'a'),/another tab/);
 assert.throws(()=>arm(emptyState(),{at:now-1}),/next occurrence/);assert.throws(()=>arm(emptyState(),{at:now+93600001}),/next occurrence/);assert.throws(()=>arm(emptyState(),{volume:101}),/could not be read/);
});
test('late callbacks and refresh recovery show missed alarms rather than old surprise audio; ring is bounded',()=>{
 const s=arm(),id=s.reminder.id;assert.equal(act(s,'reminder-tick',{reminderId:id},now+151000).state.reminder.status,'missed');assert.equal(act(s,'reminder-claim',{reminderId:id},now+61000,'new-tab').state.reminder.status,'missed');
 const ringing=act(s,'reminder-tick',{reminderId:id},now+60000).state;assert.equal(act(ringing,'reminder-tick',{reminderId:id},now+120000).state.reminder.status,'missed');assert.equal(act(ringing,'reminder-claim',{reminderId:id},now+120000,'new-tab').state.reminder.status,'missed');
});
test('local repository persists independent alarms, serializes competing claims and excludes alarms from backup',async()=>{
 const r=createRepository({indexedDB:new IDBFactory()}),s=await r.load();try{
 const context={now,owner:'a',id:'first'};await r.command({type:'start',mode:'study',epoch:s.epoch},context);
 await r.command({type:'reminder-arm',at:now+60000,label:'Private label',expectedId:null,epoch:s.epoch},{...context,id:'alarm'});
 const reloaded=await r.read();assert.equal(reloaded.reminder.label,'Private label');assert.equal(reloaded.timer.mode,'study');assert.equal(reloaded.reminder.owner,'a');assert.ok(!JSON.stringify(backupOf(reloaded,now,{includePreferences:true})).includes('Private label'));
 const changed=await r.command({type:'reminder-claim',reminderId:'alarm',epoch:s.epoch},{...context,owner:'b',id:'claim'});assert.equal(changed.state.reminder.owner,'b');await assert.rejects(r.command({type:'reminder-dismiss',reminderId:'alarm',epoch:s.epoch},context),/another tab/);
 assert.equal((await r.wipe()).state.reminder,null);
 }finally{r.close();}
});
test('legacy alarm moves out of timer state, preserves its due time and never invents enabled audio',()=>{
 const s=act(emptyState(),'alarm-arm',{at:now+60000}).state;const read=checkState(s);assert.equal(read.timer,null);assert.equal(read.reminder.at,now+60000);assert.equal(read.reminder.sound,false);assert.equal(read.reminder.status,'armed');
});
test('a next-day local alarm remains valid across a 25-hour daylight-saving day',()=>{
 const output=execFileSync(process.execPath,['--input-type=module','-e',`import {nextAlarm} from './src/lib/alarm.mjs';const now=new Date(2026,9,24,12).getTime(); console.log(JSON.stringify({now,at:nextAlarm('11:30:00',now)}));`],{cwd:new URL('..',import.meta.url),env:{...process.env,TZ:'Europe/London'},encoding:'utf8'});
 const {now:wall,at}=JSON.parse(output);assert.equal(at-wall,24.5*3600000);const s=emptyState();assert.equal(act(s,'reminder-arm',{at,expectedId:null},wall).state.reminder.at,at);
});
test('two concurrent alarm submissions have a single winner in the real local repository',async()=>{
 const r=createRepository({indexedDB:new IDBFactory()});try{const s=await r.load();const result=await Promise.allSettled(['a','b'].map(owner=>r.command({type:'reminder-arm',epoch:s.epoch,expectedId:null,at:now+60000},{now,owner,id:owner})));assert.equal(result.filter(x=>x.status==='fulfilled').length,1);assert.equal(result.filter(x=>x.status==='rejected'&&x.reason.code==='STALE').length,1);assert.equal((await r.read()).reminder.owner,result.find(x=>x.status==='fulfilled').value.state.reminder.owner);}finally{r.close();}
});
test('audio stays lazy, has distinct tones, stops repetitions and cannot restart a cancelled pending preview',async()=>{
 let made=0,notes=[],pulse,deadline,resume;const param={setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}};
 class Audio{constructor(){made++;this.state='running';this.currentTime=0;}async resume(){if(resume)await resume;}createOscillator(){const o={frequency:{},connect(){},disconnect(){},start(){notes.push(o.frequency.value);},stop(){}};return o;}createGain(){return {gain:param,connect(){},disconnect(){}};}close(){}}
 let cleared=0;const engine=createAlarmAudio({Audio,setIntervalFn:fn=>(pulse=fn,1),clearIntervalFn:()=>cleared++,setTimeoutFn:fn=>(deadline=fn,2),clearTimeoutFn:()=>{}});assert.equal(made,0);await engine.test('bell',60);assert.equal(notes.length,3);await engine.test('chime',60);assert.notEqual(notes[3],notes[4]);engine.ring('pulse',60,()=>{});pulse();assert.ok(notes.includes(880));deadline();assert.ok(cleared>0);
 let release;resume=new Promise(r=>release=r);const pending=engine.test('bell',60);const count=notes.length;engine.stop();release();await pending;assert.equal(notes.length,count);engine.dispose();
});
