import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory} from 'fake-indexeddb';
import {emptyState,validateSettings,validateBackup,transition} from '../src/lib/model.mjs';
import {createRepository,persistedState,backupOf,checkState} from '../src/lib/storage.mjs';
import {DEFAULT_MIXES,SOUND_SCAPES,validateMixes} from '../src/lib/sound-settings.mjs';
import {createNoiseValues,createAmbientEngine} from '../src/lib/ambient.mjs';
const run=(s,type,fields={},now=1000)=>transition(s,{type,epoch:s.epoch,...fields},{now,owner:'test',id:crypto.randomUUID()}).state;

test('old settings gain medium size, safe master volume and independent starter mixes',()=>{
 const a=validateSettings({ambient:{rain:35}}),b=emptyState('b');
 assert.equal(a.timerSize,'medium');assert.equal(a.ambientVolume,60);assert.deepEqual(a.ambient,{rain:35});
 a.ambientPresets[0].mix.rain=99;
 assert.equal(DEFAULT_MIXES[0].mix.rain,55);assert.equal(b.settings.ambientPresets[0].mix.rain,55);
 const old=emptyState('e');delete old.settings.timerSize;delete old.settings.ambientPresets;delete old.settings.ambientVolume;
 assert.equal(checkState(old).settings.timerSize,'medium');
});
test('all twelve channels and bounded volumes validate; invalid controls do not enter state',()=>{
 assert.equal(SOUND_SCAPES.length,12);
 assert.equal(Object.keys(validateSettings({ambient:Object.fromEntries(SOUND_SCAPES.map(([id])=>[id,100]))}).ambient).length,12);
 for(const patch of [{timerSize:'huge'},{ambientVolume:101},{ambientVolume:NaN},{ambient:{brown:1.2}},{ambient:{unknown:50}},{ambient:[]}])assert.throws(()=>validateSettings(patch));
});
test('saved mixes support rename, update, removal and strict bounded untrusted input',()=>{
 const list=structuredClone(DEFAULT_MIXES);list[0]={...list[0],name:' My reading ',mix:{pink:25,fan:20},volume:30};
 assert.equal(validateMixes(list)[0].name,'My reading');assert.equal(validateMixes([]).length,0);
 for(const invalid of [null,Array(9).fill(list[0]),[list[0],list[0]],[{...list[0],name:' '}],[{...list[0],name:'a'.repeat(33)}],[{...list[0],volume:-1}],[{...list[0],mix:{bogus:20}}],[{...list[0],id:'<script>'}], [list[0],{...list[1],name:'my reading'}]])assert.throws(()=>validateMixes(invalid));
});
test('sound and size changes preserve a running timer and never create study credit',()=>{
 let s=run(emptyState('e'),'start',{mode:'study'});const timer=structuredClone(s.timer);
 s=run(s,'settings',{patch:{timerSize:'large',ambient:{brown:45,stream:20},ambientVolume:35,ambientPresets:[]}},5000);
 assert.deepEqual(s.timer,timer);assert.deepEqual(s.sessions,[]);
});
test('real repository reload preserves mix, presets and size; forgetting preferences preserves timing only',async()=>{
 const db=new IDBFactory(),a=createRepository({indexedDB:db}),initial=await a.load();
 await a.command({type:'settings',epoch:initial.epoch,patch:{timerSize:'small',ambient:{fire:35,keyboard:10},ambientVolume:20,ambientPresets:[{id:'custom',name:'Reading',mix:{pink:50},volume:25}]}},{owner:'test',id:'prefs',now:1000});a.close();
 const b=createRepository({indexedDB:db});try{
  const state=await b.load();assert.equal(state.settings.timerSize,'small');assert.equal(state.settings.ambient.fire,35);assert.equal(state.settings.ambientPresets[0].name,'Reading');assert.equal(state.settings.ambientVolume,20);
  state.settings.rememberPreferences=false;state.timer={fixture:'active'};
  const forgotten=persistedState(state);assert.equal(forgotten.settings.timerSize,'medium');assert.deepEqual(forgotten.settings.ambient,{});assert.equal(forgotten.settings.ambientVolume,60);assert.deepEqual(forgotten.settings.ambientPresets,DEFAULT_MIXES);assert.deepEqual(forgotten.timer,state.timer);
 }finally{b.close();}
});
test('optional preference backup roundtrips new fields while ordinary backup excludes them',()=>{
 const s=run(emptyState('e'),'settings',{patch:{timerSize:'large',ambient:{pink:30},ambientVolume:12,ambientPresets:[]}});
 assert.equal(backupOf(s).preferences,undefined);
 const backup=backupOf(s,1000,{includePreferences:true});validateBackup(backup);
 const restored=run(emptyState('b'),'import',{backup,applyPreferences:true});
 assert.equal(restored.settings.timerSize,'large');assert.equal(restored.settings.ambient.pink,30);assert.equal(restored.settings.ambientVolume,12);assert.deepEqual(restored.settings.ambientPresets,[]);assert.equal(restored.timer,null);
});
function seeded(){let v=12345;return()=>{v=(Math.imul(v,1664525)+1013904223)>>>0;return v/4294967296;};}
const roughness=v=>{let energy=0,delta=0;for(let i=1;i<v.length;i++){energy+=v[i]*v[i];delta+=(v[i]-v[i-1])**2;}return delta/energy;};
test('white, pink and brown have different spectral balance, with finite click-free loop edges',()=>{
 const sample=id=>createNoiseValues(id,48000,48000,seeded());
 const white=sample('white'),pink=sample('pink'),brown=sample('brown');
 assert.ok(roughness(white)>roughness(pink)*2);assert.ok(roughness(pink)>roughness(brown)*4);
 for(const [id]of SOUND_SCAPES){const v=sample(id);assert.equal(Math.abs(v[0]),0);assert.equal(Math.abs(v.at(-1)),0);assert.ok(v.every(n=>Number.isFinite(n)&&Math.abs(n)<=.9));assert.ok(v.some(n=>Math.abs(n)>.01));}
});
function fakeAudio({deferred=false}={}) {
 const instances=[],waits=[];
 const param=()=>({value:0,targets:[],setTargetAtTime(...args){this.targets.push(args);}});
 class Audio {
  constructor(){instances.push(this);this.state='suspended';this.sampleRate=8000;this.currentTime=0;this.destination={};this.sources=[];this.gains=[];}
  createGain(){const n={gain:param(),connect(){},disconnect(){}};this.gains.push(n);return n;}
  createBiquadFilter(){return {frequency:param(),Q:param(),connect(){},disconnect(){}};}
  createDynamicsCompressor(){return {threshold:param(),knee:param(),ratio:param(),connect(){},disconnect(){}};}
  createBuffer(_channels,length){return {length,getChannelData:()=>new Float32Array(length)};}
  createBufferSource(){const n={connect(){},disconnect(){},start(){n.started=true;},stop(){n.stopped=true;}};this.sources.push(n);return n;}
  async resume(){if(deferred)await new Promise(resolve=>waits.push(resolve));this.state='running';}
  async suspend(){this.state='suspended';}
  async close(){this.state='closed';}
 }
 return {Audio,instances,waits};
}
test('engine stays lazy, applies master independently and tears down every sound source',async()=>{
 const f=fakeAudio(),engine=createAmbientEngine({AudioContext:f.Audio});engine.update({rain:50});assert.equal(f.instances.length,0);
 await engine.start({brown:50,stream:20},40);const c=f.instances[0];assert.equal(c.sources.length,2);assert.equal(c.gains[0].gain.targets.at(-1)[0],.4);
 engine.update({brown:100,stream:0},25);assert.equal(c.gains[0].gain.targets.at(-1)[0],.25);assert.equal(c.gains[1].gain.targets.at(-1)[0],.32);
 engine.stop();assert.equal(c.gains[0].gain.targets.at(-1)[0],0);
 await engine.close();assert.ok(c.sources.every(s=>s.stopped));assert.equal(c.state,'closed');
});
test('muting during browser audio resume cannot restart a pending sound',async()=>{
 const f=fakeAudio({deferred:true}),engine=createAmbientEngine({AudioContext:f.Audio});
 const starting=engine.start({rain:50},60);engine.stop();f.waits[0]();
 assert.equal(await starting,false);assert.equal(f.instances[0].sources.length,0);await engine.close();
});
