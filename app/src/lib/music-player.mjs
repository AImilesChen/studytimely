import {MUSIC_TRACKS,MUSIC_REPEAT,musicTrack,nextMusicId,validateMusicList} from './music-catalog.mjs';

// One lazy, same-origin audio element lives beyond individual panels and timer routes.
// Playback position and playback intent are never saved or restored.
export function createMusicPlayer({createAudio=()=>new globalThis.Audio(),onChange=()=>{},onAdvance=()=>{},schedule=setTimeout,unschedule=clearTimeout,fadeMs=0,now=()=>Date.now()}={}) {
 let audio=null,token=0,wantsPlay=false,closed=false,previewTimer=null,fadeTimer=null,envelope=1,playQueue=[];
 const cancelPreview=()=>{if(previewTimer!==null)unschedule(previewTimer);previewTimer=null;};
 const cancelFade=()=>{if(fadeTimer!==null)unschedule(fadeTimer);fadeTimer=null;};
 const applyVolume=()=>{if(audio)audio.volume=state.volume/100*envelope;};
 function fadeIn(request){if(!fadeMs)return;const began=now();const frame=()=>{fadeTimer=null;if(request!==token||!wantsPlay||closed)return;envelope=Math.min(1,(now()-began)/fadeMs);applyVolume();if(envelope<1){fadeTimer=schedule(frame,25);fadeTimer?.unref?.();}};frame();}
 let state={trackId:MUSIC_TRACKS[0].id,volume:35,repeat:'all',status:'idle',position:0,duration:0,muted:false,error:''};
 const handlers={};
 function emit(patch){if(closed)return;state={...state,...patch};onChange({...state});}
 function ensure(){
  if(audio)return audio;
  audio=createAudio();audio.preload='none';applyVolume();audio.loop=state.repeat==='one';audio.muted=state.muted;
  handlers.loadedmetadata=()=>emit({duration:Number.isFinite(audio.duration)?audio.duration:0});
  handlers.durationchange=handlers.loadedmetadata;
  handlers.timeupdate=()=>{const position=Number.isFinite(audio.currentTime)?Math.floor(audio.currentTime):0;if(fadeMs&&fadeTimer===null&&state.duration&&!audio.loop){envelope=Math.min(1,Math.max(0,(state.duration-audio.currentTime)/1.2));applyVolume();}if(position!==state.position)emit({position});};
  handlers.waiting=()=>{if(wantsPlay)emit({status:'loading'});};
  handlers.playing=()=>{if(wantsPlay)emit({status:'playing',error:''});else audio.pause();};
  handlers.pause=()=>{if(audio.paused&&state.status==='playing'){token++;wantsPlay=false;cancelPreview();cancelFade();emit({status:'paused',preview:false});}};
  handlers.error=()=>{
   token++;wantsPlay=false;cancelPreview();cancelFade();audio.pause();
   emit({status:'error',error:'Music could not be loaded. Check your connection and try again.'});
  };
  handlers.ended=()=>{
   if(state.preview){pause();return;}
   wantsPlay=false;
   const next=nextMusicId(state.trackId,state.repeat,playQueue);
   if(next){if(next!==state.trackId)onAdvance(next);play(next);}else emit({status:'ended',position:state.duration});
  };
  for(const [name,fn]of Object.entries(handlers))audio.addEventListener(name,fn);
  return audio;
 }
 function unload(){
  if(!audio)return;
  audio.pause();audio.removeAttribute('src');audio.load();
 }
 async function play(id=state.trackId,{previewSeconds=0}={}){
  if(closed)return false;
  const track=musicTrack(id);if(!track)throw Error('Choose a music track from the library.');
  cancelPreview();cancelFade();
  const request=++token,changed=state.trackId!==id;
  wantsPlay=true;
  const a=ensure(),newSource=changed||!a.getAttribute('src')||state.status==='error';
  const replay=state.status==='ended'||a.ended;
  emit({status:'loading',preview:previewSeconds>0,error:'',...(newSource?{trackId:id,position:0,duration:0}:{})});
  if(newSource){a.pause();a.src=track.src;a.load();}
  else if(replay){a.currentTime=0;}
  if(previewSeconds>0)a.currentTime=0;
  envelope=fadeMs?0:1;applyVolume();
  try{
   await a.play();
   if(closed||request!==token){if(!wantsPlay)a.pause();return false;}
   emit({status:'playing',error:''});fadeIn(request);if(previewSeconds>0){previewTimer=schedule(()=>{if(request===token)pause();},Math.min(10,previewSeconds)*1000);previewTimer?.unref?.();}return true;
  }catch(e){
   if(closed||request!==token)return false;
   wantsPlay=false;a.pause();
   emit({status:'error',error:e?.name==='NotAllowedError'?'Your browser blocked playback. Press Play music to try again.':'Music could not be loaded. Check your connection and try again.'});
   return false;
  }
 }
 function pause(){token++;wantsPlay=false;cancelPreview();cancelFade();audio?.pause();if(state.status!=='idle')emit({status:'paused',preview:false});}
 return {
  play,pause,
  snapshot:()=>({...state}),
  configure({trackId=state.trackId,volume=state.volume,repeat=state.repeat,queue=playQueue}={}){
   playQueue=validateMusicList(queue);
   if(!musicTrack(trackId)||!Number.isInteger(volume)||volume<0||volume>100||!MUSIC_REPEAT.includes(repeat))throw Error('Invalid music preference.');
   if(trackId!==state.trackId){token++;wantsPlay=false;cancelPreview();cancelFade();unload();emit({trackId,position:0,duration:0,status:'idle',preview:false,error:''});}
   if(audio)audio.loop=repeat==='one';
   emit({volume,repeat});
   applyVolume();
  },
  seek(seconds){
   if(!audio||!Number.isFinite(seconds)||!state.duration)return;
   const position=Math.max(0,Math.min(seconds,state.duration));audio.currentTime=position;emit({position});
  },
  toggleMute(){const muted=!state.muted;if(audio)audio.muted=muted;emit({muted});},
  close(){
   token++;wantsPlay=false;cancelPreview();cancelFade();closed=true;
   if(audio){for(const [name,fn]of Object.entries(handlers))audio.removeEventListener(name,fn);unload();audio=null;}
  }
 };
}
