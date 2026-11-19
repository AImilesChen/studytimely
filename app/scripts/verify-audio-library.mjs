import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {MUSIC_TRACKS} from '../src/lib/music-catalog.mjs';
import {AMBIENT_RECORDINGS} from '../src/lib/ambient-catalog.mjs';
const base=process.env.PREVIEW_ORIGIN||'http://127.0.0.1:4306',checks=[];
for(const t of [...MUSIC_TRACKS,...AMBIENT_RECORDINGS]){
 const expected=await fs.readFile(new URL('../public'+t.src,import.meta.url));
 const head=await fetch(base+t.src,{method:'HEAD'});assert.equal(head.status,200);assert.match(head.headers.get('content-type'),/^audio\/mpeg/);assert.equal(Number(head.headers.get('content-length')),t.bytes);assert.equal(head.headers.get('accept-ranges'),'bytes');assert.match(head.headers.get('cache-control'),/immutable/);
 for(const [range,bytes] of [['bytes=0-1023',expected.subarray(0,1024)],['bytes=-128',expected.subarray(-128)]]){const r=await fetch(base+t.src,{headers:{Range:range}});assert.equal(r.status,206);assert.deepEqual(Buffer.from(await r.arrayBuffer()),bytes);}
 const full=await fetch(base+t.src);assert.equal(full.status,200);assert.equal(createHash('sha256').update(Buffer.from(await full.arrayBuffer())).digest('hex'),t.sha256);
 checks.push({id:t.id,head:true,ranges:2,hash:t.sha256,bytes:t.bytes});
}
for(const [folder,items] of [['music',MUSIC_TRACKS],['ambient',AMBIENT_RECORDINGS]]){const r=await fetch(base+'/'+folder+'/CREDITS.txt');assert.equal(r.status,200);const text=await r.text();for(const t of items)assert.ok(text.includes(t.title)&&text.includes(t.source));}
const pwa=await(await fetch(base+'/pwa-build.json')).json();assert.ok(!pwa.precache.some(p=>/^\/(music|ambient)\//.test(p)));
await fs.writeFile(new URL('../../docs/development/evidence/sound-library-2026-11-19/http-audio.json',import.meta.url),JSON.stringify({base,checkedAt:new Date().toISOString(),checks,credits:true,noAudioPrecache:true},null,2));
console.log(`Verified ${checks.length} audio files: HEAD, two ranges and exact hashes; both credits and no mandatory audio precache.`);
