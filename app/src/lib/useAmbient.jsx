import {useEffect,useRef,useState} from 'react';
import {createAmbientEngine} from './ambient.mjs';
export function useAmbient(store){
 const engine=useRef(null),[active,setActive]=useState(false),[error,setError]=useState('');
 useEffect(()=>{engine.current=createAmbientEngine();return()=>{engine.current?.close();};},[]);
 useEffect(()=>{if(active)engine.current?.update(store.data.settings.ambient);},[store.data.settings.ambient,active]);
 async function onVolume(id,volume){setError('');const mix={...store.data.settings.ambient,[id]:volume};try{if(volume)await engine.current.start(mix);else engine.current.update(mix);setActive(true);if(!await store.command('settings',{patch:{ambient:mix}})){engine.current.stop();setActive(false);setError('The sound preference could not be saved. Try again.');}}catch(e){setError(e.message);setActive(false);}}
 function onMute(){engine.current?.stop();setActive(false);store.command('settings',{patch:{ambient:{}}});}
 return{mix:store.data.settings.ambient,active,error,onVolume,onMute};
}
