import test from 'node:test';
import assert from 'node:assert/strict';
import {createSceneVideoPlayer} from '../src/lib/scene-video.mjs';
import {sceneVideo,sceneImage,sceneKind,focusConfig,FOCUS_SCENES,FOCUS_ATMOSPHERES} from '../src/lib/focus-space.mjs';
import {musicTrack} from '../src/lib/music-catalog.mjs';

function fixture(){
 const video=new EventTarget(),states=[];let calls=0;
 video.src='';video.paused=true;video.getAttribute=()=>video.src||null;
 video.removeAttribute=()=>{video.src='';};video.load=()=>{};
 video.pause=()=>{video.paused=true;};
 video.play=async()=>{calls++;video.paused=false;video.dispatchEvent(new Event('playing'));};
 const player=createSceneVideoPlayer({video,src:'/focus-scenes/rain-nature-v1.mp4',onStatus:s=>states.push(s)});
 return {video,player,states,calls:()=>calls,state:()=>states.at(-1)};
}

test('the four agreed study atmospheres have three still scenes and a playable catalogue pairing each',()=>{
 assert.equal(Object.keys(FOCUS_ATMOSPHERES).length,4);
 for(const [group,pairing] of Object.entries(FOCUS_ATMOSPHERES)){
  const scenes=FOCUS_SCENES.filter(s=>s.group===group&&!s.collection);assert.equal(scenes.length,3);
  assert.ok(musicTrack(pairing.music));
  for(const s of scenes){assert.equal(sceneKind(s.id),s.kind||'Still scene');assert.doesNotThrow(()=>focusConfig({scene:s.id,mix:s.mix}));}
 }
 for(const [before,after] of [['soft-dunes','blue-plains'],['after-rain','rain-cleared-meadow'],['rain-coast','valley-drizzle'],['golden-grassland','dusk-cloud-sea']]){
  const c=focusConfig({scene:before,minutes:40,mix:{pink:25}});assert.equal(c.scene,after);assert.equal(c.minutes,40);assert.deepEqual(c.mix,{pink:25});
 }
});
test('only the two real video scenes advertise live footage and share matching posters',()=>{
 for(const id of ['rain','coast']){assert.equal(sceneVideo(id),`/library/full/focus-scenes/${id}-nature-v1.mp4`);assert.equal(sceneImage(id),`/library/full/focus-scenes/${id}-nature-v1.webp`);assert.equal(sceneKind(id),'Live video');}
 assert.equal(sceneVideo('unknown'),null);assert.equal(sceneKind('coast'),'Live video');
});
test('retired desk scenes migrate without losing preset timing or sound preferences',()=>{
 const old={scene:'minimal',minutes:40,mix:{pink:35},motion:false};
 const next=focusConfig(old);assert.equal(next.scene,'coast');assert.equal(next.minutes,40);assert.deepEqual(next.mix,old.mix);assert.equal(next.motion,false);
 for(const scene of ['cabin','library','cafe'])assert.equal(focusConfig({scene}).scene,'coast');
 assert.deepEqual(FOCUS_SCENES.filter(s=>sceneVideo(s.id)).map(s=>s.id),['coast','rain']);
 assert.ok(!FOCUS_SCENES.some(s=>['minimal','cabin','library','cafe'].includes(s.id)));
});
test('video does not load until eligible, is muted, and pauses for all visibility protections',async()=>{
 const f=fixture();await f.player.update({enabled:false});assert.equal(f.video.src,'');assert.equal(f.calls(),0);
 await f.player.update({enabled:true,reduced:true});assert.equal(f.video.src,'');assert.equal(f.state(),'reduced');
 await f.player.update({reduced:false});assert.equal(f.video.muted,true);assert.equal(f.state(),'playing');
 for(const gate of [{hidden:true},{hidden:false,intersecting:false},{intersecting:true,enabled:false}]){await f.player.update(gate);assert.equal(f.video.paused,true);assert.notEqual(f.state(),'playing');}
 f.player.dispose();assert.equal(f.video.src,'');
});
test('autoplay rejection reports a real failure and an off/on attempt can recover',async()=>{
 const f=fixture();f.video.play=async()=>{throw Error('denied');};
 await f.player.update({enabled:true});assert.equal(f.state(),'unavailable');
 await f.player.update({enabled:false});f.video.play=async()=>{f.video.paused=false;};
 await f.player.update({enabled:true});assert.equal(f.state(),'playing');f.player.dispose();
});
test('late play completion cannot restart a hidden or disposed scene',async()=>{
 const f=fixture();let finish;f.video.play=()=>new Promise(resolve=>{finish=()=>{f.video.paused=false;resolve();};});
 const pending=f.player.update({enabled:true});await f.player.update({hidden:true});finish();await pending;assert.equal(f.video.paused,true);
 f.player.dispose();const count=f.states.length;f.video.dispatchEvent(new Event('playing'));assert.equal(f.states.length,count);
});
test('decode failure retains the poster and reports unavailable instead of an on label',async()=>{
 const f=fixture();await f.player.update({enabled:true});f.video.dispatchEvent(new Event('error'));assert.equal(f.state(),'unavailable');assert.equal(f.video.paused,true);f.player.dispose();
});
