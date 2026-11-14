import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {MUSIC_TRACKS} from '../src/lib/music-catalog.mjs';
const base=process.env.PREVIEW_ORIGIN||'http://127.0.0.1:4174',checks=[];
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const t of MUSIC_TRACKS){
 const expected=await fs.readFile(new URL('../public'+t.src,import.meta.url));
 const head=await fetch(base+t.src,{method:'HEAD'});assert.equal(head.status,200);assert.match(head.headers.get('content-type'),/^audio\/mpeg/);assert.equal(Number(head.headers.get('content-length')),t.bytes);assert.equal(head.headers.get('accept-ranges'),'bytes');assert.match(head.headers.get('cache-control'),/immutable/);checks.push({track:t.id,check:'HEAD/type/length/cache',passed:true});
 const start=await fetch(base+t.src,{headers:{Range:'bytes=0-1023'}});assert.equal(start.status,206);assert.equal(start.headers.get('content-range'),`bytes 0-1023/${t.bytes}`);assert.deepEqual(Buffer.from(await start.arrayBuffer()),expected.subarray(0,1024));checks.push({track:t.id,check:'initial byte range',passed:true});
 const tail=await fetch(base+t.src,{headers:{Range:'bytes=-128'}});assert.equal(tail.status,206);assert.deepEqual(Buffer.from(await tail.arrayBuffer()),expected.subarray(-128));checks.push({track:t.id,check:'suffix byte range',passed:true});
 const full=await fetch(base+t.src);assert.equal(full.status,200);assert.equal(hash(Buffer.from(await full.arrayBuffer())),t.sha256);checks.push({track:t.id,check:'full licensed MP3 hash',passed:true});
}
const invalid=await fetch(base+MUSIC_TRACKS[0].src,{headers:{Range:'bytes=999999999-'}});assert.equal(invalid.status,416);checks.push({check:'invalid range',passed:true});
const end=await fetch(base+MUSIC_TRACKS[0].src,{headers:{Range:`bytes=${MUSIC_TRACKS[0].bytes-64}-`}});assert.equal(end.status,206);assert.equal((await end.arrayBuffer()).byteLength,64);checks.push({check:'open-ended range',passed:true});
const credits=await fetch(base+'/music/CREDITS.txt');assert.equal(credits.status,200);const text=await credits.text();for(const t of MUSIC_TRACKS)assert.ok(text.includes(t.title)&&text.includes(t.isrc));checks.push({check:'complete public attribution',passed:true});
const license=await fetch(base+'/music/CC-BY-4.0.pdf');assert.equal(license.status,200);assert.match(license.headers.get('content-type'),/application\/pdf/);assert.equal(Buffer.from(await license.arrayBuffer()).subarray(0,4).toString(),'%PDF');checks.push({check:'public license PDF',passed:true});
const precache=JSON.parse(await(await fetch(base+'/pwa-build.json')).text());assert.ok(!precache.precache.some(p=>p.startsWith('/music/')));checks.push({check:'no music in initial PWA precache',passed:true});
const out=new URL('../../docs/development/evidence/free-music-2026-11-14/music-http.json',import.meta.url);await fs.writeFile(out,JSON.stringify({base,environment:'local',checkedAt:new Date().toISOString(),checks},null,2));console.log(`Music HTTP verification passed: ${checks.length} checks, five exact source-audio hashes.`);
