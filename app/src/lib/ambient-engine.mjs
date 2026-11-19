import {SOUND_IDS} from './sound-settings.mjs';
import {ambientRecording,NOISE_IDS} from './ambient-catalog.mjs';
import {createNoiseValues} from './noise-values.mjs';

export function createAmbientEngine({AudioContext:AudioOverride,fetch:fetchAudio=globalThis.fetch}={}){
 let context=null,master=null,compressor=null,generation=0,suspension=null,wantedMix={},wantedVolume=60;
 const channels=new Map(),buffers=new Map(),pending=new Map();
 const release=v=>{for(const n of v.nodes){try{n.stop?.();n.disconnect();}catch{}}};
 const abortLoads=()=>{for(const item of pending.values())item.controller.abort();pending.clear();};
 function initialise(){
  if(context)return;
  const Audio=AudioOverride||globalThis.AudioContext||globalThis.webkitAudioContext;
  if(!Audio)throw Error('Ambient sound is unavailable in this browser.');
  context=new Audio();master=context.createGain();master.gain.value=0;compressor=context.createDynamicsCompressor();
  compressor.threshold.value=-16;compressor.knee.value=18;compressor.ratio.value=3;
  master.connect(compressor);compressor.connect(context.destination);
 }
 async function loadBuffer(id){
  if(buffers.has(id))return buffers.get(id);
  if(pending.has(id))return pending.get(id).promise;
  const recording=ambientRecording(id),c=context;
  if(!recording)throw Error('This sound is not available. Choose another recording.');
  const controller=new AbortController(),item={controller};
  item.promise=(async()=>{
   try{
    const r=await fetchAudio(recording.src,{signal:controller.signal});
    if(!r.ok||Number(r.headers.get('Content-Length'))>8000000)throw Error();
    const bytes=await r.arrayBuffer();if(bytes.byteLength>8000000||controller.signal.aborted||context!==c)throw Error();
    const buffer=await c.decodeAudioData(bytes);
    if(controller.signal.aborted||context!==c)throw Error();
    buffers.set(id,buffer);return buffer;
   }catch{throw Error('A recording could not be loaded. Check your connection and try again.');}
   finally{if(pending.get(id)===item)pending.delete(id);}
  })();pending.set(id,item);return item.promise;
 }
 function makeChannel(id){
  const c=context,gain=c.createGain(),source=c.createBufferSource(),nodes=[source,gain];gain.gain.value=0;
  if(NOISE_IDS.includes(id)){
   const buffer=c.createBuffer(1,c.sampleRate*16,c.sampleRate);buffer.getChannelData(0).set(createNoiseValues(id,buffer.length,c.sampleRate));source.buffer=buffer;
   const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value={white:6000,pink:4500,brown:800}[id];filter.Q.value=.3;
   source.connect(filter);filter.connect(gain);nodes.push(filter);
  }else{source.buffer=buffers.get(id);source.connect(gain);}
  source.loop=true;gain.connect(master);source.start();return {gain,nodes};
 }
 function update(mix,volume=60){
  wantedMix={...mix};wantedVolume=volume;
  if(!context)return;
  master.gain.setTargetAtTime(volume/100,context.currentTime,.12);
  for(const [id,v] of channels)v.gain.gain.setTargetAtTime(Number(mix[id]||0)/100*(NOISE_IDS.includes(id)?.22:.8),context.currentTime,.12);
 }
 return {
  async start(mix,volume=60){
   const token=++generation;clearTimeout(suspension);initialise();update(mix,volume);
   const c=context;await c.resume();if(token!==generation||c!==context)return false;
   if(c.state!=='running')throw Error('Your browser blocked audio. Try Play again.');
   const ids=SOUND_IDS.filter(id=>Number(mix[id])>0);
   try{await Promise.all(ids.filter(id=>!NOISE_IDS.includes(id)).map(loadBuffer));}catch(e){if(token!==generation||c!==context)return false;throw e;}
   if(token!==generation||c!==context)return false;
   for(const id of ids)if(!channels.has(id))channels.set(id,makeChannel(id));
   update(wantedMix,wantedVolume);return true;
  },update,
  fadeOut(){generation++;abortLoads();clearTimeout(suspension);if(context)master.gain.setTargetAtTime(0,context.currentTime,.5);suspension=setTimeout(()=>context?.suspend().catch(()=>{}),2200);},
  stop(){generation++;abortLoads();clearTimeout(suspension);update({},0);suspension=setTimeout(()=>context?.suspend().catch(()=>{}),300);},
  async close(){generation++;abortLoads();clearTimeout(suspension);for(const v of channels.values())release(v);channels.clear();buffers.clear();master?.disconnect();compressor?.disconnect();const old=context;context=null;await old?.close();}
 };
}
