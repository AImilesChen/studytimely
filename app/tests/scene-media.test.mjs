import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {SCENE_VIDEOS} from '../src/lib/scene-media.mjs';
import {createWorker} from '../server/cloudflare.mjs';

test('local video encodes match reviewed sizes, use MP4 and stay out of mandatory offline downloads',async()=>{
 const pwa=JSON.parse(await fs.readFile(new URL('../dist/client/pwa-build.json',import.meta.url),'utf8'));
 for(const scene of SCENE_VIDEOS){
  const bytes=await fs.readFile(new URL('../public'+scene.src,import.meta.url));
  assert.equal(bytes.length,scene.bytes);assert.ok(bytes.length<6000000);assert.equal(bytes.subarray(4,8).toString(),'ftyp');assert.ok(!pwa.precache.includes(scene.src));
 }
});
test('Worker serves real video byte ranges and keeps HEAD, invalid ranges and music types correct',async()=>{
 const worker=createWorker({advancedLibraryPreview:true}),body=Uint8Array.from({length:128},(_,i)=>i);
 const env={ASSETS:{fetch:async request=>new Response(request.method==='HEAD'?null:body,{headers:{'Content-Length':'128','ETag':'"media"'}})}};
 const url='https://example.test'+SCENE_VIDEOS[0].src;
 for(const [range,start,end] of [['bytes=10-19',10,19],['bytes=-8',120,127],['bytes=120-',120,127]]){
  const r=await worker.fetch(new Request(url,{headers:{Range:range}}),env);
  assert.equal(r.status,206);assert.equal(r.headers.get('Content-Type'),'video/mp4');assert.equal(r.headers.get('Content-Range'),`bytes ${start}-${end}/128`);assert.deepEqual([...new Uint8Array(await r.arrayBuffer())],[...body.slice(start,end+1)]);
 }
 const head=await worker.fetch(new Request(url,{method:'HEAD'}),env);assert.equal(head.status,200);assert.equal(head.headers.get('Content-Type'),'video/mp4');assert.equal((await head.arrayBuffer()).byteLength,0);
 const invalid=await worker.fetch(new Request(url,{headers:{Range:'bytes=999-'}}),env);assert.equal(invalid.status,416);
});
