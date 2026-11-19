import {useEffect,useRef,useState} from 'react';
import {MUSIC_TRACKS} from './music-catalog.mjs';
import {createMusicPlayer} from './music-player.mjs';

export function useMusic(store){
 const engine=useRef(null),current=useRef(store.data.settings),pending=useRef(0),queue=useRef(Promise.resolve()),command=useRef(store.command);
 command.current=store.command;
 const [playback,setPlayback]=useState({trackId:MUSIC_TRACKS[0].id,volume:35,repeat:'all',status:'idle',position:0,duration:0,muted:false,error:''});
 const [saveError,setSaveError]=useState('');
 if(!pending.current)current.current=store.data.settings;
 useEffect(()=>{engine.current=createMusicPlayer({fadeMs:600,onChange:setPlayback,onAdvance:trackId=>{current.current={...current.current,musicTrack:trackId};save({musicTrack:trackId});}});return()=>engine.current?.close();},[]);
 useEffect(()=>{
  const s=current.current;
  engine.current?.configure({trackId:s.musicTrack,volume:s.musicVolume,repeat:s.musicRepeat,queue:s.musicQueue||[]});
 },[store.data.settings.musicTrack,store.data.settings.musicVolume,store.data.settings.musicRepeat,store.data.settings.musicQueue]);
 useEffect(()=>{engine.current?.pause();},[store.data.epoch]);
 async function save(patch){
  pending.current++;
  const operation=queue.current.then(()=>command.current('settings',{patch}));queue.current=operation.catch(()=>null);
  try{
   const result=await operation;
   if(!result){engine.current?.pause();setSaveError('The music preference could not be saved. Playback has been paused.');}
   return !!result;
  }catch{engine.current?.pause();setSaveError('The music preference could not be saved. Playback has been paused.');return false;}
  finally{pending.current--;}
 }
 function onPlay(id=current.current.musicTrack,ids,previewSeconds=0){
  if(!store.ready)return;
  setSaveError('');const changed=current.current.musicTrack!==id;
  const patch={musicTrack:id,...(ids?{musicQueue:ids}:{})};current.current={...current.current,...patch};
  // Start the media request directly within the user's click, before any storage work.
  engine.current.configure({queue:current.current.musicQueue||[]});engine.current.play(id,{previewSeconds});
  if(changed||ids)save(patch);
 }
 function onSkip(direction){
  const ids=current.current.musicQueue?.length?current.current.musicQueue:MUSIC_TRACKS.map(t=>t.id),index=ids.indexOf(current.current.musicTrack);
  onPlay(index<0?(direction>0?ids[0]:ids.at(-1)):ids[(index+direction+ids.length)%ids.length]);
 }
 function onVolume(volume){
  if(!store.ready)return;
  setSaveError('');current.current={...current.current,musicVolume:volume};
  engine.current.configure({volume});return save({musicVolume:volume});
 }
 function onRepeat(repeat){
  if(!store.ready)return;
  setSaveError('');current.current={...current.current,musicRepeat:repeat};
  engine.current.configure({repeat});return save({musicRepeat:repeat});
 }
 function onFavorite(id){if(!store.ready)return;const previous=current.current.musicFavorites||[],favorites=previous.includes(id)?previous.filter(t=>t!==id):[...previous,id];current.current={...current.current,musicFavorites:favorites};return save({musicFavorites:favorites});}
 function onSetup({trackId,volume,repeat,queue:ids=[]}){if(!store.ready)return;const patch={musicTrack:trackId,musicVolume:volume,musicRepeat:repeat,musicQueue:ids};current.current={...current.current,...patch};engine.current.configure({trackId,volume,repeat,queue:ids});engine.current.play(trackId);save(patch);}
 return {...playback,ready:store.ready,error:saveError||playback.error,favorites:store.data.settings.musicFavorites||[],queue:store.data.settings.musicQueue||[],
  onPlay,onPause:()=>engine.current?.pause(),onSkip,onVolume,onRepeat,
  onFavorite,onPreview:id=>onPlay(id,undefined,8),onSetup,
  onSeek:seconds=>engine.current?.seek(seconds),onMute:()=>engine.current?.toggleMute()};
}
