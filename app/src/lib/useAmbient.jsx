import {useEffect,useRef,useState} from 'react';
import {createAmbientEngine} from './ambient.mjs';
import {DEFAULT_MIXES,MAX_MIXES,validateMixes} from './sound-settings.mjs';

export function useAmbient(store) {
 const engine=useRef(null), current=useRef(store.data.settings), queue=useRef(Promise.resolve());
 const pending=useRef(0), playing=useRef(false), intent=useRef(0);
 const [active,setActive]=useState(false), [error,setError]=useState('');
 if(!pending.current)current.current=store.data.settings;
 useEffect(()=>{engine.current=createAmbientEngine();return()=>{intent.current++;engine.current?.close();};},[]);
 useEffect(()=>{
  if(active)engine.current?.update(current.current.ambient,current.current.ambientVolume);
 },[store.data.settings.ambient,store.data.settings.ambientVolume,active]);
 function stop() {intent.current++;playing.current=false;engine.current?.stop();setActive(false);}
 async function save(patch) {
  pending.current++;
  const operation=queue.current.then(()=>store.command('settings',{patch}));
  queue.current=operation.catch(()=>null);
  try {
   const result=await operation;
   if(!result){stop();setError('The sound preference could not be saved. Try again.');}
   return !!result;
  } catch {stop();setError('The sound preference could not be saved. Try again.');return false;}
  finally {pending.current--;}
 }
 async function play(mix,volume) {
  const token=++intent.current;
  if(!Object.values(mix).some(v=>v>0)){stop();return;}
  try {
   const started=await engine.current.start(mix,volume);
   if(started&&token===intent.current){engine.current.update(current.current.ambient,current.current.ambientVolume);playing.current=true;setActive(true);}
  } catch(e) {if(token===intent.current){stop();setError(e.message);}}
 }
 function onVolume(id,volume) {
  setError('');const mix={...current.current.ambient,[id]:volume};
  current.current={...current.current,ambient:mix};
  // Start/resume only from the user's sound gesture, never from persisted state.
  play(mix,current.current.ambientVolume);
  return save({ambient:mix});
 }
 function onMaster(volume) {
  setError('');current.current={...current.current,ambientVolume:volume};
  if(playing.current)engine.current.update(current.current.ambient,volume);
  return save({ambientVolume:volume});
 }
 function onMute() {setError('');stop();}
 function onResume() {setError('');return play(current.current.ambient,current.current.ambientVolume);}
 function onPreset(preset) {
  setError('');current.current={...current.current,ambient:{...preset.mix},ambientVolume:preset.volume};
  play(preset.mix,preset.volume);
  return save({ambient:{...preset.mix},ambientVolume:preset.volume});
 }
 async function onSavePreset(name,id) {
  setError('');
  try {
   const s=current.current, existing=s.ambientPresets;
   if(!id&&existing.length>=MAX_MIXES)throw Error(`You can save up to ${MAX_MIXES} mixes. Edit or remove one first.`);
   const item={id:id||crypto.randomUUID(),name,mix:{...s.ambient},volume:s.ambientVolume};
   const presets=validateMixes(id?existing.map(p=>p.id===id?item:p):[...existing,item]);
   current.current={...s,ambientPresets:presets};
   return await save({ambientPresets:presets});
  } catch(e) {setError(e.message);return false;}
 }
 function onDeletePreset(id) {
  setError('');const presets=current.current.ambientPresets.filter(p=>p.id!==id);
  current.current={...current.current,ambientPresets:presets};return save({ambientPresets:presets});
 }
 function onRestorePresets() {
  setError('');const presets=structuredClone(DEFAULT_MIXES);
  current.current={...current.current,ambientPresets:presets};return save({ambientPresets:presets});
 }
 return {mix:store.data.settings.ambient,volume:store.data.settings.ambientVolume,presets:store.data.settings.ambientPresets,
  active,error,onVolume,onMaster,onMute,onResume,onPreset,onSavePreset,onDeletePreset,onRestorePresets};
}
