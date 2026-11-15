import {useEffect,useRef,useState} from 'react';
import {createAlarmAudio} from './alarm-audio.mjs';
export function useAlarm(store){
 const engine=useRef(null),[audioError,setAudioError]=useState('');const a=store.data.reminder;
 const audio=()=>engine.current??=createAlarmAudio();
 useEffect(()=>()=>engine.current?.dispose(),[]);
 useEffect(()=>{if(a?.status==='ringing'&&a.owner===store.owner&&a.sound&&a.volume)audio().ring(a.tone,a.volume,setAudioError);else engine.current?.stop();return()=>engine.current?.stop();},[a?.id,a?.status,a?.owner,a?.sound,a?.volume,a?.tone,store.owner]);
 async function prime(){setAudioError('');try{await audio().prime();return true;}catch(e){setAudioError(e.message);return false;}}
 async function test(tone,volume){setAudioError('');try{await audio().test(tone,volume);}catch(e){setAudioError(e.message);}}
 return {audioError,prime,test,stop:()=>engine.current?.stop()};
}
