import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {FREE_THEMES,PLUS_THEMES,FREE_SCENES,PLUS_SCENES,libraryTier,libraryItem,availableMusic,effectiveTheme,libraryMediaURL,sceneAssetPath} from '../src/lib/library-access.mjs';
import {THEMES,themePatch} from '../src/lib/ambient.mjs';
import {FOCUS_SCENES} from '../src/lib/focus-space.mjs';
import {MUSIC_TRACKS} from '../src/lib/music-catalog.mjs';
import {SCENE_VIDEOS} from '../src/lib/scene-media.mjs';
import {createWorker} from '../server/cloudflare.mjs';
import {libraryAccess,learningFeatures} from '../server/learning-features.mjs';
import {setupCommunity} from './helpers/community.mjs';
import {validateSettings,DEFAULT_SETTINGS} from '../src/lib/model.mjs';
const paid={allowed:true,source:'subscription',expiresAt:Date.now()+60000},free={allowed:false,source:'free',expiresAt:0};

test('the library boundary covers every item once and retains the promised free floor',()=>{
 assert.equal(FREE_THEMES.length,8);assert.equal(PLUS_THEMES.length,3);assert.equal(FREE_SCENES.length,4);assert.equal(PLUS_SCENES.length,22);
 assert.deepEqual(new Set([...FREE_THEMES,...PLUS_THEMES]),new Set(THEMES.map(t=>t[0])));
 assert.deepEqual(new Set([...FREE_SCENES,...PLUS_SCENES]),new Set(FOCUS_SCENES.map(t=>t.id)));
 assert.equal(availableMusic(free).length,5);assert.equal(availableMusic(paid).length,25);
 assert.equal(libraryItem(free,'theme','coffee').allowed,true);assert.equal(libraryItem(free,'scene','mist-lake').allowed,true);
 assert.equal(libraryItem(free,'scene','coast').allowed,false);assert.equal(libraryItem(paid,'scene','coast').allowed,true);
 for(const id of PLUS_THEMES)validateSettings({...DEFAULT_SETTINGS,...themePatch(id)});
 assert.equal(libraryTier('scene','invented'),null);assert.equal(libraryItem(paid,'theme','invented').allowed,false);
});
test('expiry changes presentation without rewriting a saved colour or granting access from preferences',()=>{
 const settings={...DEFAULT_SETTINGS,...themePatch('terracotta')},snapshot=structuredClone(settings);
 assert.equal(effectiveTheme(settings,paid).spaceTheme,'terracotta');
 assert.equal(effectiveTheme(settings,{...paid,expiresAt:100},101).spaceTheme,'default');
 assert.deepEqual(settings,snapshot);assert.equal(availableMusic({...paid,expiresAt:100},101).length,5);
 assert.equal(libraryItem({allowed:true,source:'preview'},'theme','rose').label,'Plus · free preview');
});
test('every track has a real bounded separately hashed public sample; originals are unchanged',async()=>{
 for(const track of MUSIC_TRACKS){const sample=await fs.readFile(new URL('../public'+track.sampleSrc,import.meta.url));assert.equal(sample.length,track.sampleBytes);assert.ok(sample.length<150000);assert.notEqual(track.sampleSrc,track.src);assert.equal(createHash('sha256').update(sample).digest('hex'),track.sampleSha256);}
});
const request=(path,{cookie='',method='GET',range}={})=>new Request('https://study.test'+path,{method,headers:{...(cookie?{cookie}:{}),...(range?{Range:range}:{})}});
const assets=()=>({calls:[],async fetch(r){this.calls.push(new URL(r.url).pathname);return new Response(r.method==='HEAD'?null:new Uint8Array(128),{headers:{'Content-Length':'128'}});}});
test('closed preview denies anonymous full expanded media and encoded aliases before touching assets; samples and free media remain public',async()=>{
 const ASSETS=assets(),worker=createWorker(),track=MUSIC_TRACKS.find(t=>t.plannedTier==='expanded');
 for(const path of [track.src,libraryMediaURL(track.src),track.src.replace('/music/','/m%75sic/'),...SCENE_VIDEOS.map(v=>v.src),...PLUS_SCENES.map(sceneAssetPath)]){
  for(const method of ['GET','HEAD']){const r=await worker.fetch(request(path,{method,range:'bytes=0-7'}),{ASSETS});assert.equal(r.status,403);assert.match(r.headers.get('Cache-Control'),/no-store/);}
 }
 assert.equal(ASSETS.calls.length,0);
 for(const path of [track.sampleSrc,MUSIC_TRACKS[0].src,'/focus-scenes/mist-lake-generated-v1.webp','/focus-scenes/previews/coast-v1.webp'])assert.equal((await worker.fetch(request(path),{ASSETS})).status,200);
 assert.equal((await worker.fetch(request('/library/full/music/invented.mp3'),{ASSETS})).status,404);
});
test('free preview uses the same private full-media route, range handling and expiry boundary as membership',async()=>{
 const track=MUSIC_TRACKS.find(t=>t.plannedTier==='expanded'),ASSETS=assets(),worker=createWorker({advancedLibraryPreview:true});
 const r=await worker.fetch(request(libraryMediaURL(track.src),{range:'bytes=10-19'}),{ASSETS});assert.equal(r.status,206);assert.equal((await r.arrayBuffer()).byteLength,10);assert.match(r.headers.get('Cache-Control'),/private, no-store/);assert.equal(r.headers.get('Vary'),'Cookie');assert.equal(ASSETS.calls[0],track.src);
 const expired=createWorker({advancedLibraryPreview:true,advancedLibraryPreviewEndsAt:Date.now()-1000});assert.equal((await expired.fetch(request(track.src),{ASSETS})).status,403);
 const video=await worker.fetch(request(libraryMediaURL(SCENE_VIDEOS[0].src),{range:'bytes=0-7'}),{ASSETS});assert.equal(video.status,206);assert.equal(video.headers.get('Content-Type'),'video/mp4');
});
test('only a live authenticated account grant unlocks full media; expiry, logout and revocation fail closed',async()=>{
 const s=await setupCommunity();s.setTime(Date.now());try{
  const owner=await s.user('library-owner'),other=await s.user('library-other'),config={accountsEnabled:true},at=s.now;
  s.subscribe(owner,{expiresAt:at+60000});const url=libraryMediaURL(MUSIC_TRACKS.find(t=>t.plannedTier==='expanded').src),env={...s.env,ASSETS:assets()},worker=createWorker(config);
  assert.equal((await worker.fetch(request(url,{cookie:owner.cookie}),env)).status,200);
  assert.equal((await worker.fetch(request(url,{cookie:other.cookie}),env)).status,403);
  assert.equal((await worker.fetch(request(url),env)).status,403);
  assert.equal((await libraryAccess(request(url,{cookie:owner.cookie}),s.env,config,at+60000)).allowed,false);
  s.db.prepare('DELETE FROM sessions WHERE account_id=?').run(owner.id);
  assert.equal((await worker.fetch(request(url,{cookie:owner.cookie}),env)).status,403);
  s.subscribe(other,{expiresAt:Date.now()+60000});assert.equal((await worker.fetch(request(url,{cookie:other.cookie}),env)).status,200);
  s.db.prepare('DELETE FROM community_entitlements WHERE account_id=?').run(other.id);assert.equal((await worker.fetch(request(url,{cookie:other.cookie}),env)).status,403);
 }finally{s.db.close();}
});
test('library discovery is independent of other free previews and never treats a URL parameter as a paid grant',async()=>{
 const r=await learningFeatures(request('/api/learning/features?subscription=true'),{}, {advancedAnalyticsPreview:true});const data=await r.json();assert.equal(data.analytics.allowed,true);assert.equal(data.library.allowed,false);assert.equal(data.library.policyVersion,1);
 const p=await learningFeatures(request('/api/learning/features'),{}, {advancedLibraryPreview:true});assert.equal((await p.json()).library.source,'preview');
});
test('an unavailable entitlement store cannot serve protected full recordings',async()=>{
 const env={DB:{prepare(){throw Error('Synthetic database failure');}},ASSETS:assets()};const worker=createWorker({accountsEnabled:true}),track=MUSIC_TRACKS.find(t=>t.plannedTier==='expanded');const r=await worker.fetch(request(track.src,{cookie:'__Host-studytimely-session='+'a'.repeat(64)}),env);assert.equal(r.status,503);assert.equal(env.ASSETS.calls.length,0);
});

test('ambiguous encoded media paths cannot reach static assets',async()=>{
 const ASSETS=assets(),worker=createWorker();
 for(const path of ['/music%255cmeditation.mp3','/%256dusic/file.mp3','/music//file.mp3','/music/%5cfile.mp3'])assert.equal((await worker.fetch(request(path),{ASSETS})).status,400);
 assert.equal(ASSETS.calls.length,0);
});
