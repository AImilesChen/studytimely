import test from 'node:test';
import assert from 'node:assert/strict';
import {parseMusicRange,musicAssetResponse} from '../server/music-assets.mjs';
const url='https://study.test/music/piano.0123456789ab.mp3';
const source=(bytes=Uint8Array.from({length:100},(_,i)=>i))=>new Response(bytes,{headers:{'Content-Length':String(bytes.length),'Content-Type':'application/octet-stream',ETag:'"v1"'}});

test('music byte ranges clamp ends and handle open-ended and suffix requests',()=>{
 assert.deepEqual(parseMusicRange('bytes=10-19',100),{start:10,end:19});
 assert.deepEqual(parseMusicRange('bytes=95-150',100),{start:95,end:99});
 assert.deepEqual(parseMusicRange('bytes=95-',100),{start:95,end:99});
 assert.deepEqual(parseMusicRange('bytes=-8',100),{start:92,end:99});
 assert.deepEqual(parseMusicRange('bytes=-200',100),{start:0,end:99});
 for(const r of ['bytes=100-','bytes=20-10','bytes=-0','bytes=-','bytes=0-1,3-4','wrong','bytes=999999999999999999999-'])assert.equal(parseMusicRange(r,100),null);
});
test('music adapter returns exactly the requested audio bytes and correct headers',async()=>{
 const response=await musicAssetResponse(new Request(url,{headers:{Range:'bytes=10-19'}}),source());
 assert.equal(response.status,206);assert.equal(response.headers.get('Content-Type'),'audio/mpeg');assert.equal(response.headers.get('Content-Length'),'10');assert.equal(response.headers.get('Content-Range'),'bytes 10-19/100');
 assert.deepEqual([...new Uint8Array(await response.arrayBuffer())],Array.from({length:10},(_,i)=>10+i));
});
test('streamed ranges cross arbitrary chunk boundaries and stop the underlying reader early',async()=>{
 let calls=0,cancelled=false;
 const stream=new ReadableStream({pull(c){const i=calls++;c.enqueue(Uint8Array.from({length:7},(_,j)=>i*7+j));if(calls===20)c.close();},cancel(){cancelled=true;}});
 const response=await musicAssetResponse(new Request(url,{headers:{Range:'bytes=5-16'}}),new Response(stream,{headers:{'Content-Length':'140'}}));
 assert.deepEqual([...new Uint8Array(await response.arrayBuffer())],Array.from({length:12},(_,i)=>5+i));assert.ok(cancelled);assert.ok(calls<20);
});
test('invalid ranges produce 416, HEAD stays bodyless and stale If-Range gets the full song',async()=>{
 const bad=await musicAssetResponse(new Request(url,{headers:{Range:'bytes=100-'}}),source());assert.equal(bad.status,416);assert.equal(bad.headers.get('Content-Range'),'bytes */100');assert.equal((await bad.arrayBuffer()).byteLength,0);
 const head=await musicAssetResponse(new Request(url,{method:'HEAD',headers:{Range:'bytes=0-9'}}),new Response(null,{headers:{'Content-Length':'100'}}));assert.equal(head.status,200);assert.equal((await head.arrayBuffer()).byteLength,0);
 const fresh=await musicAssetResponse(new Request(url,{headers:{Range:'bytes=0-9','If-Range':'"v1"'}}),source());assert.equal(fresh.status,206);
 const stale=await musicAssetResponse(new Request(url,{headers:{Range:'bytes=0-9','If-Range':'"old"'}}),source());assert.equal(stale.status,200);assert.equal((await stale.arrayBuffer()).byteLength,100);
 const missing=new Response('missing',{status:404});assert.equal(await musicAssetResponse(new Request(url),missing),missing);
});
test('reviewed file size supports byte seeking when the asset service omits Content-Length',async()=>{
 const r=await musicAssetResponse(new Request(url,{headers:{Range:'bytes=2-4'}}),new Response(Uint8Array.from([0,1,2,3,4,5])),6);
 assert.equal(r.status,206);assert.equal(r.headers.get('Content-Range'),'bytes 2-4/6');assert.deepEqual([...new Uint8Array(await r.arrayBuffer())],[2,3,4]);
});
