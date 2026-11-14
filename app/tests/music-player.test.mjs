import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {IDBFactory} from 'fake-indexeddb';
import {MUSIC_TRACKS,nextMusicId,musicTime} from '../src/lib/music-catalog.mjs';
import {createMusicPlayer} from '../src/lib/music-player.mjs';
import {emptyState,validateSettings,transition} from '../src/lib/model.mjs';
import {createRepository,persistedState,backupOf} from '../src/lib/storage.mjs';
const first=MUSIC_TRACKS[0],second=MUSIC_TRACKS[1],last=MUSIC_TRACKS.at(-1);
function fixture(options={}){
 const instances=[],pending=[];
 class Audio extends EventTarget{
  constructor(){super();instances.push(this);this.src='';this.paused=true;this.currentTime=0;this.duration=0;this.ended=false;this.loads=0;this.volume=1;this.loop=false;this.muted=false;this.reject=options.reject;}
  getAttribute(name){return name==='src'?this.src:null;}
  removeAttribute(name){if(name==='src')this.src='';}
  load(){this.loads++;this.error=null;this.currentTime=0;this.ended=false;if(this.src){this.duration=213;this.dispatchEvent(new Event('loadedmetadata'));}}
  async play(){
   if(this.reject)throw Object.assign(Error('private provider message'),{name:this.reject});
   this.paused=false;
   if(options.deferred)await new Promise(resolve=>pending.push(resolve));
   this.dispatchEvent(new Event('playing'));
  }
  pause(){this.paused=true;this.dispatchEvent(new Event('pause'));}
 }
 const changes=[],advanced=[];
 const engine=createMusicPlayer({createAudio:()=>new Audio(),onChange:s=>changes.push(s),onAdvance:id=>advanced.push(id)});
 return {engine,instances,pending,changes,advanced};
}
test('music stays lazy and paused when preferences are loaded; playback needs an explicit action',async()=>{
 const f=fixture();f.engine.configure({trackId:second.id,volume:15,repeat:'one'});assert.equal(f.instances.length,0);assert.equal(f.engine.snapshot().status,'idle');
 await f.engine.play();const audio=f.instances[0];assert.equal(audio.src,second.src);assert.equal(audio.preload,'none');assert.equal(audio.loop,true);assert.equal(audio.volume,.15);assert.equal(f.engine.snapshot().status,'playing');
 f.engine.pause();assert.equal(audio.paused,true);assert.equal(f.engine.snapshot().status,'paused');f.engine.close();
});
test('track changes, seeking, independent volume and mute operate on one player',async()=>{
 const f=fixture();await f.engine.play(first.id);f.engine.seek(100);assert.equal(f.instances[0].currentTime,100);
 f.engine.seek(999);assert.equal(f.instances[0].currentTime,213);f.engine.configure({volume:20});assert.equal(f.instances[0].volume,.2);
 f.engine.toggleMute();assert.equal(f.instances[0].muted,true);assert.equal(f.engine.snapshot().volume,20);
 await f.engine.play(second.id);assert.equal(f.instances.length,1);assert.equal(f.instances[0].src,second.src);assert.equal(f.engine.snapshot().trackId,second.id);assert.equal(f.engine.snapshot().status,'playing');assert.equal(f.engine.snapshot().position,0);
 f.engine.close();assert.equal(f.instances[0].src,'');assert.equal(f.instances[0].paused,true);
});
test('pausing or closing during a pending play request cannot restart audio',async()=>{
 for(const close of [false,true]){
  const f=fixture({deferred:true}),start=f.engine.play();if(close)f.engine.close();else f.engine.pause();
  f.pending[0]();assert.equal(await start,false);assert.equal(f.instances[0].paused,true);if(!close)f.engine.close();
 }
});
test('a newer track wins when an older play promise completes late',async()=>{
 const f=fixture({deferred:true}),a=f.engine.play(first.id),b=f.engine.play(second.id);
 f.pending[1]();assert.equal(await b,true);f.pending[0]();assert.equal(await a,false);
 assert.equal(f.engine.snapshot().trackId,second.id);assert.equal(f.instances[0].paused,false);f.engine.close();
});
test('playlist advancement, repeat-one and stopping at the final track have distinct behavior',async()=>{
 assert.equal(nextMusicId(last.id,'all'),first.id);assert.equal(nextMusicId(first.id,'one'),first.id);assert.equal(nextMusicId(last.id,'off'),null);
 const f=fixture();await f.engine.play(first.id);f.instances[0].dispatchEvent(new Event('ended'));await Promise.resolve();assert.equal(f.engine.snapshot().trackId,second.id);assert.deepEqual(f.advanced,[second.id]);
 f.engine.configure({repeat:'off'});await f.engine.play(last.id);f.instances[0].dispatchEvent(new Event('ended'));assert.equal(f.engine.snapshot().status,'ended');
 f.engine.configure({repeat:'one'});assert.equal(f.instances[0].loop,true);f.engine.close();
});
test('blocked and failed playback show safe errors and a real retry reloads the media',async()=>{
 const f=fixture({reject:'NotAllowedError'});assert.equal(await f.engine.play(),false);assert.match(f.engine.snapshot().error,/browser blocked/);assert.ok(!f.engine.snapshot().error.includes('private provider'));
 f.instances[0].reject=null;const previous=f.instances[0].loads;assert.equal(await f.engine.play(),true);assert.ok(f.instances[0].loads>previous);
 f.instances[0].error={code:4};f.instances[0].dispatchEvent(new Event('error'));assert.equal(f.engine.snapshot().status,'error');assert.equal(f.instances[0].paused,true);f.engine.close();
});
test('external preference changes pause instead of auto-playing a different recording',async()=>{
 const f=fixture();await f.engine.play(first.id);f.engine.configure({trackId:second.id});assert.equal(f.instances[0].paused,true);assert.equal(f.instances[0].src,'');assert.equal(f.engine.snapshot().status,'idle');f.engine.close();
});
test('music preferences migrate, validate, persist and stay separate from timer accounting',async()=>{
 assert.equal(validateSettings({}).musicTrack,first.id);
 for(const p of [{musicTrack:'https://example.com/song.mp3'},{musicVolume:101},{musicRepeat:'random'}])assert.throws(()=>validateSettings(p));
 const old=emptyState('e');const initial=transition(old,{type:'start',epoch:'e',mode:'study'},{owner:'a',id:'run',now:1000}).state;
 const changed=transition(initial,{type:'settings',epoch:'e',patch:{musicTrack:second.id,musicVolume:25,musicRepeat:'one'}},{owner:'a',id:'prefs',now:6000}).state;
 assert.deepEqual(changed.timer,initial.timer);assert.deepEqual(changed.sessions,[]);assert.equal(backupOf(changed).preferences,undefined);assert.equal(backupOf(changed,6000,{includePreferences:true}).preferences.values.musicTrack,second.id);
 const forgotten=persistedState({...changed,settings:{...changed.settings,rememberPreferences:false}});assert.equal(forgotten.settings.musicTrack,first.id);assert.deepEqual(forgotten.timer,initial.timer);
 const db=new IDBFactory(),a=createRepository({indexedDB:db}),s=await a.load();await a.command({type:'settings',epoch:s.epoch,patch:{musicTrack:second.id,musicVolume:25,musicRepeat:'one'}},{owner:'a',id:'saved',now:1000});a.close();
 const b=createRepository({indexedDB:db});try{const reloaded=await b.load();assert.equal(reloaded.settings.musicTrack,second.id);assert.equal(reloaded.settings.musicVolume,25);assert.equal(reloaded.settings.musicRepeat,'one');assert.equal(reloaded.timer,null);}finally{b.close();}
});
test('all five bundled recordings match their exact licensed source manifest and stay out of precache',async()=>{
 assert.equal(MUSIC_TRACKS.length,5);
 for(const t of MUSIC_TRACKS){
  const audio=await fs.readFile(new URL('../public'+t.src,import.meta.url));
  assert.equal(audio.byteLength,t.bytes);assert.equal(createHash('sha256').update(audio).digest('hex'),t.sha256);assert.ok(audio.subarray(0,3).toString()==='ID3'||audio[0]===255&&audio[1]&224);assert.ok(t.bytes<25*1024*1024);
  assert.equal(t.license,'CC BY 4.0');assert.equal(new URL(t.source).hostname,'incompetech.com');assert.match(t.src,new RegExp(t.sha256.slice(0,12)));assert.ok(t.durationSeconds>120);
 }
 const credits=await fs.readFile(new URL('../public/music/CREDITS.txt',import.meta.url),'utf8');for(const t of MUSIC_TRACKS)assert.ok(credits.includes(t.title)&&credits.includes(t.isrc));
 const precache=JSON.parse(await fs.readFile(new URL('../dist/client/pwa-build.json',import.meta.url),'utf8')).precache;assert.ok(!precache.some(s=>s.startsWith('/music/')));
});

test('muting before the first play gesture is applied to the newly created audio element',async()=>{
 const f=fixture();f.engine.toggleMute();assert.equal(f.instances.length,0);await f.engine.play();assert.equal(f.instances[0].muted,true);assert.equal(f.engine.snapshot().muted,true);f.engine.close();
});
test('displayed full recording lengths round encoder fractions consistently with the playlist',()=>{
 assert.equal(musicTime(212.819592),'3:33');assert.equal(musicTime(324.850272),'5:25');assert.equal(musicTime(53),'0:53');assert.equal(musicTime(NaN),'0:00');assert.equal(musicTime(-1),'0:00');
});
