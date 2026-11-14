import {MUSIC_TRACKS,MUSIC_REPEAT,musicTrack,nextMusicId} from './music-catalog.mjs';

// One lazy, same-origin audio element lives beyond individual panels and timer routes.
// Playback position and playback intent are never saved or restored.
export function createMusicPlayer({createAudio=()=>new globalThis.Audio(),onChange=()=>{},onAdvance=()=>{}}={}) {
 let audio=null,token=0,wantsPlay=false,closed=false;
 let state={trackId:MUSIC_TRACKS[0].id,volume:35,repeat:'all',status:'idle',position:0,duration:0,muted:false,error:''};
 const handlers={};
 function emit(patch){if(closed)return;state={...state,...patch};onChange({...state});}
 function ensure(){
  if(audio)return audio;
  audio=createAudio();audio.preload='none';audio.volume=state.volume/100;audio.loop=state.repeat==='one';audio.muted=state.muted;
  handlers.loadedmetadata=()=>emit({duration:Number.isFinite(audio.duration)?audio.duration:0});
  handlers.durationchange=handlers.loadedmetadata;
  handlers.timeupdate=()=>{const position=Number.isFinite(audio.currentTime)?Math.floor(audio.currentTime):0;if(position!==state.position)emit({position});};
  handlers.waiting=()=>{if(wantsPlay)emit({status:'loading'});};
  handlers.playing=()=>{if(wantsPlay)emit({status:'playing',error:''});else audio.pause();};
  handlers.pause=()=>{if(audio.paused&&state.status==='playing'){token++;wantsPlay=false;emit({status:'paused'});}};
  handlers.error=()=>{
   token++;wantsPlay=false;audio.pause();
   emit({status:'error',error:'Music could not be loaded. Check your connection and try again.'});
  };
  handlers.ended=()=>{
   wantsPlay=false;
   const next=nextMusicId(state.trackId,state.repeat);
   if(next){if(next!==state.trackId)onAdvance(next);play(next);}else emit({status:'ended',position:state.duration});
  };
  for(const [name,fn]of Object.entries(handlers))audio.addEventListener(name,fn);
  return audio;
 }
 function unload(){
  if(!audio)return;
  audio.pause();audio.removeAttribute('src');audio.load();
 }
 async function play(id=state.trackId){
  if(closed)return false;
  const track=musicTrack(id);if(!track)throw Error('Choose a music track from the library.');
  const request=++token,changed=state.trackId!==id;
  wantsPlay=true;
  const a=ensure(),newSource=changed||!a.getAttribute('src')||state.status==='error';
  const replay=state.status==='ended'||a.ended;
  emit({status:'loading',error:'',...(newSource?{trackId:id,position:0,duration:0}:{})});
  if(newSource){a.pause();a.src=track.src;a.load();}
  else if(replay){a.currentTime=0;}
  try{
   await a.play();
   if(closed||request!==token){if(!wantsPlay)a.pause();return false;}
   emit({status:'playing',error:''});return true;
  }catch(e){
   if(closed||request!==token)return false;
   wantsPlay=false;a.pause();
   emit({status:'error',error:e?.name==='NotAllowedError'?'Your browser blocked playback. Press Play music to try again.':'Music could not be loaded. Check your connection and try again.'});
   return false;
  }
 }
 function pause(){token++;wantsPlay=false;audio?.pause();if(state.status!=='idle')emit({status:'paused'});}
 return {
  play,pause,
  snapshot:()=>({...state}),
  configure({trackId=state.trackId,volume=state.volume,repeat=state.repeat}={}){
   if(!musicTrack(trackId)||!Number.isInteger(volume)||volume<0||volume>100||!MUSIC_REPEAT.includes(repeat))throw Error('Invalid music preference.');
   if(trackId!==state.trackId){token++;wantsPlay=false;unload();emit({trackId,position:0,duration:0,status:'idle',error:''});}
   if(audio){audio.volume=volume/100;audio.loop=repeat==='one';}
   emit({volume,repeat});
  },
  seek(seconds){
   if(!audio||!Number.isFinite(seconds)||!state.duration)return;
   const position=Math.max(0,Math.min(seconds,state.duration));audio.currentTime=position;emit({position});
  },
  toggleMute(){const muted=!state.muted;if(audio)audio.muted=muted;emit({muted});},
  close(){
   token++;wantsPlay=false;closed=true;
   if(audio){for(const [name,fn]of Object.entries(handlers))audio.removeEventListener(name,fn);unload();audio=null;}
  }
 };
}
