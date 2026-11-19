import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {AMBIENT_RECORDINGS} from '../src/lib/ambient-catalog.mjs';
import {createAmbientEngine} from '../src/lib/ambient-engine.mjs';
import {createNoiseValues} from '../src/lib/noise-values.mjs';
function fixture(){
 const instances=[],param=()=>({value:0,setTargetAtTime(){}});
 class Audio{constructor(){instances.push(this);this.state='suspended';this.sampleRate=8000;this.currentTime=0;this.destination={};this.sources=[];this.generated=0;}
 createGain(){return {gain:param(),connect(){},disconnect(){}};}
 createDynamicsCompressor(){return {threshold:param(),knee:param(),ratio:param(),connect(){},disconnect(){}};}
 createBuffer(){this.generated++;throw Error('Nature must not be synthesised.');}
 createBufferSource(){const s={connect(){},disconnect(){},start(){s.started=true;},stop(){s.stopped=true;}};this.sources.push(s);return s;}
 async decodeAudioData(){return {duration:40};}async resume(){this.state='running';}async suspend(){this.state='suspended';}async close(){this.state='closed';}}
 return {Audio,instances};
}
test('every nature and room channel is a versioned, bounded CC0 recording, with no synthetic substitute',async()=>{
 assert.equal(AMBIENT_RECORDINGS.length,9);
 for(const s of AMBIENT_RECORDINGS){const bytes=await fs.readFile(new URL('../public'+s.src,import.meta.url));assert.equal(s.license,'CC0 1.0');assert.equal(new URL(s.source).hostname,'freesound.org');assert.equal(bytes.length,s.bytes);assert.ok(bytes.length>10000&&bytes.length<1000000);assert.equal(createHash('sha256').update(bytes).digest('hex'),s.sha256);assert.ok(s.durationSeconds>5&&s.durationSeconds<45);assert.throws(()=>createNoiseValues(s.id,100,8000));}
});
test('recordings load only on Play, are decoded once and release all playback nodes',async()=>{
 const f=fixture();let requests=0;const engine=createAmbientEngine({AudioContext:f.Audio,fetch:async()=>{requests++;return new Response(new Uint8Array(100));}});
 engine.update({stream:25},40);assert.equal(requests,0);assert.equal(f.instances.length,0);
 assert.equal(await engine.start({stream:25},40),true);assert.equal(requests,1);assert.equal(f.instances[0].generated,0);
 assert.equal(await engine.start({stream:35},45),true);assert.equal(requests,1);assert.equal(f.instances[0].sources.length,1);
 await engine.close();assert.ok(f.instances[0].sources.every(s=>s.stopped));assert.equal(f.instances[0].state,'closed');
});
test('Mute during a pending recording download cannot create or restart a source',async()=>{
 const f=fixture();let resolve;const engine=createAmbientEngine({AudioContext:f.Audio,fetch:()=>new Promise(r=>resolve=r)});
 const playing=engine.start({stream:25},45);await Promise.resolve();await Promise.resolve();engine.stop();resolve(new Response(new Uint8Array(100)));
 assert.equal(await playing,false);assert.equal(f.instances[0].sources.length,0);await engine.close();
});
test('download and decode failures stay silent instead of falling back to noise',async()=>{
 for(const status of [404,200]){const f=fixture();f.Audio.prototype.decodeAudioData=async()=>{throw Error('bad file');};const engine=createAmbientEngine({AudioContext:f.Audio,fetch:async()=>new Response(new Uint8Array(100),{status})});await assert.rejects(engine.start({stream:20},45),/recording could not be loaded/);assert.equal(f.instances[0].sources.length,0);assert.equal(f.instances[0].generated,0);await engine.close();}
});
