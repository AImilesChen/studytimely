import test from 'node:test';import assert from 'node:assert/strict';
import {canAnimateScene,coverFrame,rainDrop,sceneFrameLoop,WINDOW_MASKS} from '../src/lib/scene-motion.mjs';
import {focusConfig,focusTimerPatch,validateFocusDevice,emptyFocusDevice} from '../src/lib/focus-space.mjs';
test('scene motion is opt-out and stops for reduced motion, background or off-screen surfaces',()=>{
 for(const scene of ['rain','coast']){assert.ok(canAnimateScene({scene}));for(const flags of [{enabled:false},{reduced:true},{hidden:true},{intersecting:false}])assert.equal(canAnimateScene({scene,...flags}),false);}
 for(const scene of ['cabin','library','cafe','minimal','unknown'])assert.equal(canAnimateScene({scene}),false);
});
test('photo-relative motion masks align with cover cropping on narrow and wide layouts',()=>{
 const narrow=coverFrame(400,700,1672,941);assert.equal(narrow.y,0);assert.ok(narrow.x<0);assert.ok(Math.abs(941*narrow.scale-700)<.001);
 const wide=coverFrame(1400,600,1672,941);assert.equal(wide.x,0);assert.ok(wide.y<0);
 for(const args of [[0,10,20,20],[NaN,20,20,20],[20,20,-1,20]])assert.equal(coverFrame(...args),null);
 for(const mask of Object.values(WINDOW_MASKS))for(const [x,y]of mask)assert.ok(x>=0&&x<=1&&y>=0&&y<=1);
});
test('rain progresses over time without random flicker or unbounded particles',()=>{
 assert.deepEqual(rainDrop(10,5),rainDrop(10,5));assert.notEqual(rainDrop(10,5).y,rainDrop(10,10).y);
 for(let i=0;i<45;i++){const d=rainDrop(i,1000);assert.ok(d.x>=0&&d.x<=1&&d.y>=0&&d.y<1);assert.ok(d.alpha>0&&d.alpha<.4);assert.ok(d.length<.03);}
});
test('motion loop caps painting to twenty frames per second and cancellation prevents later work',()=>{
 let id=0;const pending=new Map(),draws=[],canceled=[];const stop=sceneFrameLoop({request:cb=>{pending.set(++id,cb);return id;},cancel:n=>{canceled.push(n);pending.delete(n);},draw:t=>draws.push(t)});
 const step=at=>{const [key,fn]=pending.entries().next().value;pending.delete(key);fn(at);};step(0);step(16);step(32);step(51);assert.deepEqual(draws,[0,.051]);const queued=[...pending.values()][0];stop();assert.equal(pending.size,0);queued(100);assert.equal(draws.length,2);assert.equal(canceled.length,1);
});
test('old saved focus presets gain motion defaults while presentation does not alter timer settings',()=>{
 const old=emptyFocusDevice();delete old.config.motion;old.presets=[{id:'old',name:'Reading',config:{scene:'rain',mode:'focus',minutes:25,breakMinutes:5,mix:{rain:25},volume:30,sound:false,endSound:'fade'}}];assert.equal(validateFocusDevice(old).presets[0].config.motion,true);
 assert.equal(focusConfig({motion:false}).motion,false);assert.throws(()=>focusConfig({motion:'on'}));assert.deepEqual(focusTimerPatch(focusConfig({motion:true})),focusTimerPatch(focusConfig({motion:false})));
});

test('daylight display defaults remain local presentation and migrate existing presets',()=>{
 const old=emptyFocusDevice();delete old.config.appearance;assert.equal(validateFocusDevice(old).config.appearance,'day');assert.equal(focusConfig({appearance:'night'}).appearance,'night');assert.throws(()=>focusConfig({appearance:'neon'}));assert.deepEqual(focusTimerPatch(focusConfig({appearance:'day'})),focusTimerPatch(focusConfig({appearance:'night'})));
});
