import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory,IDBObjectStore} from 'fake-indexeddb';
import {createRepository,persistedState} from '../src/lib/storage.mjs';
import {emptyState} from '../src/lib/model.mjs';
test('concurrent repositories initialise once and serialize start/finish atomically',async()=>{
 const indexedDB=new IDBFactory(),a=createRepository({indexedDB}),b=createRepository({indexedDB});
 const [one,two]=await Promise.all([a.load(),b.load()]);assert.equal(one.epoch,two.epoch);
 const results=await Promise.allSettled([a.command({type:'start',mode:'study',epoch:one.epoch},{owner:'a',id:'run-a',now:1000}),b.command({type:'start',mode:'study',epoch:one.epoch},{owner:'b',id:'run-b',now:1000})]);
 assert.equal(results.filter(x=>x.status==='fulfilled').length,1);
 const started=await a.read(),owner=started.timer.owner;
 const intent={type:'finish',epoch:started.epoch,timerId:started.timer.id};
 const ended=await Promise.allSettled([a.command(intent,{owner,id:'end-a',now:6000}),b.command(intent,{owner,id:'end-b',now:6000})]);
 assert.equal(ended.filter(x=>x.status==='fulfilled').length,1);assert.equal((await a.read()).sessions.length,1);a.close();b.close();
});
test('failed transaction rolls back and retry retains the exact session duration',async()=>{
 const a=createRepository({indexedDB:new IDBFactory()});const initial=await a.load();
 await a.command({type:'start',mode:'study',epoch:initial.epoch},{owner:'a',id:'one',now:1000});
 await assert.rejects(a.command({type:'settings',patch:{focusSeconds:0},epoch:initial.epoch},{owner:'a',id:'invalid',now:4000}));
 assert.equal((await a.read()).timer.status,'running');
 await a.command({type:'finish',epoch:initial.epoch},{owner:'a',id:'two',now:6000});assert.equal((await a.read()).sessions[0].durationSeconds,5);a.close();
});
test('deletion generation prevents another open tab restoring cleared history',async()=>{
 const db=new IDBFactory(),a=createRepository({indexedDB:db}),b=createRepository({indexedDB:db});const s=await a.load();
 await a.command({type:'start',mode:'study',epoch:s.epoch},{owner:'a',id:'old',now:1000});const cleared=await b.wipe();
 await assert.rejects(a.command({type:'finish',epoch:s.epoch},{owner:'a',id:'late',now:6000}),/changed/);const read=await a.read();assert.equal(read.epoch,cleared.state.epoch);assert.equal(read.sessions.length,0);assert.equal(read.timer,null);a.close();b.close();
});
test('no preference memory persists requested study data but defaults optional settings',()=>{
 const s=emptyState('e');s.settings.theme='light';s.settings.rememberPreferences=false;s.settings.studyMinutes=50;s.settings.analytics=true;s.subjects=['Biology'];s.dailyGoal=45;
 const saved=persistedState(s);assert.equal(saved.settings.theme,'dark');assert.deepEqual(saved.subjects,['Biology']);assert.equal(saved.dailyGoal,45);assert.equal(saved.settings.rememberPreferences,false);assert.equal(saved.settings.studyMinutes,50);assert.equal(saved.settings.analytics,true);
});
test('a quota write failure preserves the old timer; retry saves exactly once at the original intent time',async()=>{
 const repository=createRepository({indexedDB:new IDBFactory()}),s=await repository.load();
 await repository.command({type:'start',epoch:s.epoch,mode:'study'},{owner:'a',now:1000,id:'run'});
 const original=IDBObjectStore.prototype.put;
 try{
   IDBObjectStore.prototype.put=function(){throw new DOMException('Quota exceeded','QuotaExceededError');};
   await assert.rejects(repository.command({type:'finish',epoch:s.epoch},{owner:'a',now:6000,id:'finish'}),e=>e.code==='STORAGE');
 }finally{IDBObjectStore.prototype.put=original;}
 assert.equal((await repository.read()).timer.status,'running');assert.equal((await repository.read()).sessions.length,0);
 await repository.command({type:'finish',epoch:s.epoch},{owner:'a',now:6000,id:'finish'});
 assert.equal((await repository.read()).sessions[0].durationSeconds,5);repository.close();
});
