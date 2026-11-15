import {useEffect,useRef,useState} from 'react';
import {createAlarmAudio} from './alarm-audio.mjs';
import {countdownCanRing} from './countdown.mjs';

// One tab owns checks. Fresh completed transitions may ring, old completions
// loaded from disk never autoplay. Sound is always bounded to sixty seconds.
export function useCountdownAlert(store){
 const engine=useRef(null),previous=useRef(null),handled=useRef(''),deadline=useRef(null),[ringing,setRinging]=useState(false),[audioError,setAudioError]=useState('');
 const t=store.data.timer,s=store.data.settings;
 const audio=()=>engine.current??=createAlarmAudio();
 function stop(){engine.current?.stop();clearTimeout(deadline.current);setRinging(false);}
 useEffect(()=>()=>{clearTimeout(deadline.current);engine.current?.dispose();},[]);
 useEffect(()=>{
  const last=previous.current;previous.current=t?{id:t.id,status:t.status}:null;
  stop();
  if(!store.ready||t?.mode!=='countdown'||t.status!=='completed'||t.owner!==store.owner||!s.sound||!s.volume){stop();return;}
  if(handled.current===t.id)return;
  handled.current=t.id;
  if(countdownCanRing(last,t,store.owner,Date.now())){
   setAudioError('');let failed=false;audio().ring('bell',s.volume,message=>{failed=true;setAudioError(message);setRinging(false);});
   if(!failed){setRinging(true);deadline.current=setTimeout(()=>{engine.current?.stop();setRinging(false);},60000);}
  }
  return ()=>{engine.current?.stop();clearTimeout(deadline.current);};
 },[store.ready,t?.id,t?.status,t?.owner,store.owner,s.sound,s.volume]);
 async function prime(){setAudioError('');try{await audio().prime();return true;}catch(e){setAudioError(e.message);return false;}}
 async function test(volume){stop();setAudioError('');try{await audio().test('bell',Number.isInteger(volume)?Math.max(0,Math.min(100,volume)):s.volume);}catch(e){setAudioError(e.message);}}
 return {ringing,audioError,prime,test,stop};
}
