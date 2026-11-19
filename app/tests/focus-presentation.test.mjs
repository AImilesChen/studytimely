import test from 'node:test';
import assert from 'node:assert/strict';
import {createFocusPresentation} from '../src/lib/focus-presentation.mjs';

function fixture(){
 const doc=new EventTarget(),states=[],errors=[];
 doc.fullscreenElement=null;doc.fullscreenEnabled=true;
 doc.documentElement={requestFullscreen:async()=>{doc.fullscreenElement=doc.documentElement;doc.dispatchEvent(new Event('fullscreenchange'));}};
 doc.exitFullscreen=async()=>{doc.fullscreenElement=null;doc.dispatchEvent(new Event('fullscreenchange'));};
 const controls=createFocusPresentation({document:doc,onChange:s=>states.push(s),onUnavailable:e=>errors.push(e)});
 return {doc,controls,states,errors,state:()=>states.at(-1)};
}
test('expanded view and repeated native fullscreen cycles always restore the setup entry',async()=>{
 const f=fixture();assert.deepEqual(f.state(),{full:false,expanded:false,pending:false});
 f.controls.expand();assert.equal(f.state().expanded,true);
 await f.controls.back();assert.equal(f.state().expanded,false);
 for(let i=0;i<3;i++){
  await f.controls.toggleFullscreen();assert.deepEqual(f.state(),{full:true,expanded:true,pending:false});
  await f.controls.toggleFullscreen();assert.deepEqual(f.state(),{full:false,expanded:false,pending:false});
 }
 assert.deepEqual(f.errors,[]);f.controls.dispose();
});
test('header fullscreen and browser Esc use the same presentation state',async()=>{
 const f=fixture();await f.doc.documentElement.requestFullscreen();assert.equal(f.state().expanded,true);
 await f.doc.exitFullscreen();assert.deepEqual(f.state(),{full:false,expanded:false,pending:false});
 f.controls.dispose();
});
test('unsupported fullscreen leaves a usable expanded view and allows another attempt',async()=>{
 const f=fixture();f.doc.fullscreenEnabled=false;
 await f.controls.toggleFullscreen();assert.deepEqual(f.state(),{full:false,expanded:true,pending:false});assert.equal(f.errors.length,1);
 await f.controls.back();f.doc.fullscreenEnabled=true;
 await f.controls.toggleFullscreen();assert.equal(f.state().full,true);f.controls.dispose();
});
test('failed fullscreen exit retains the exit controls instead of stranding the user',async()=>{
 const f=fixture();await f.controls.toggleFullscreen();f.doc.exitFullscreen=async()=>{throw Error('denied');};
 await f.controls.back();assert.deepEqual(f.state(),{full:true,expanded:true,pending:false});assert.equal(f.errors.length,1);f.controls.dispose();
});
test('double clicks cannot overlap fullscreen requests and disposed views receive no updates',async()=>{
 const f=fixture();let finish,calls=0;
 f.doc.documentElement.requestFullscreen=()=>{calls++;return new Promise(resolve=>{finish=resolve;});};
 const pending=f.controls.toggleFullscreen();await f.controls.toggleFullscreen();assert.equal(calls,1);assert.equal(f.state().pending,true);
 f.controls.dispose();const count=f.states.length;finish();await pending;f.doc.dispatchEvent(new Event('fullscreenchange'));assert.equal(f.states.length,count);
});
