import {useEffect,useRef,useState} from 'react';
import {MUSIC_TRACKS} from './music-catalog.mjs';
import {createMusicPlayer} from './music-player.mjs';

export function useMusic(store){
 const engine=useRef(null),current=useRef(store.data.settings),pending=useRef(0),queue=useRef(Promise.resolve()),command=useRef(store.command);
 command.current=store.command;
 const [playback,setPlayback]=useState({trackId:MUSIC_TRACKS[0].id,volume:35,repeat:'all',status:'idle',position:0,duration:0,muted:false,error:''});
 const [saveError,setSaveError]=useState('');
 if(!pending.current)current.current=store.data.settings;
 useEffect(()=>{engine.current=createMusicPlayer({onChange:setPlayback,onAdvance:trackId=>{current.current={...current.current,musicTrack:trackId};save({musicTrack:trackId});}});return()=>engine.current?.close();},[]);
 useEffect(()=>{
  const s=current.current;
  engine.current?.configure({trackId:s.musicTrack,volume:s.musicVolume,repeat:s.musicRepeat});
 },[store.data.settings.musicTrack,store.data.settings.musicVolume,store.data.settings.musicRepeat]);
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
 function onPlay(id=current.current.musicTrack){
  if(!store.ready)return;
  setSaveError('');const changed=current.current.musicTrack!==id;
  current.current={...current.current,musicTrack:id};
  // Start the media request directly within the user's click, before any storage work.
  engine.current.play(id);
  if(changed)save({musicTrack:id});
 }
 function onSkip(direction){
  const index=MUSIC_TRACKS.findIndex(t=>t.id===current.current.musicTrack);
  onPlay(MUSIC_TRACKS[(index+direction+MUSIC_TRACKS.length)%MUSIC_TRACKS.length].id);
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
 return {...playback,ready:store.ready,error:saveError||playback.error,
  onPlay,onPause:()=>engine.current?.pause(),onSkip,onVolume,onRepeat,
  onSeek:seconds=>engine.current?.seek(seconds),onMute:()=>engine.current?.toggleMute()};
}
