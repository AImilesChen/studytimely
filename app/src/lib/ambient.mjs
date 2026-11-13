// Original procedural sound textures. No downloaded recordings or third-party audio.
export const SOUND_SCAPES=[['rain','Rain'],['cafe','Café murmur'],['forest','Forest'],['white','White noise'],['waves','Ocean waves'],['nature','Breeze & chimes']];
export const THEMES=[['dark','Dark','#101110'],['light','Light','#f3f2ec'],['midnight','Midnight','#121b30'],['sand','Sand','#ede1c5'],['rain','Rainy day','#18252b'],['forest','Forest','#17251d'],['coffee','Coffee shop','#2a211b'],['desk','Night desk','#211b2c']];
export function themePatch(id){return id==='dark'||id==='light'?{theme:id,spaceTheme:'default'}:{theme:id==='sand'?'light':'dark',spaceTheme:id};}
export function createAmbientEngine(){
 let context=null,channels=new Map(),timers=[];
 function makeChannel(id){
  const c=context,gain=c.createGain(),filter=c.createBiquadFilter(),source=c.createBufferSource();
  const buffer=c.createBuffer(1,c.sampleRate*8,c.sampleRate),values=buffer.getChannelData(0);let brown=0;
  for(let i=0;i<values.length;i++){const white=Math.random()*2-1;brown=(brown+.02*white)/1.02;values[i]=id==='white'?white*.28:brown*3.2;}
  source.buffer=buffer;source.loop=true;filter.type=id==='rain'?'highpass':'lowpass';filter.frequency.value=({rain:650,cafe:600,forest:1300,white:20000,waves:800,nature:450})[id];
  source.connect(filter);filter.connect(gain);gain.gain.value=0;gain.connect(c.destination);source.start();
  const nodes=[source,filter,gain];
  if(['waves','rain','cafe'].includes(id)){const lfo=c.createOscillator(),depth=c.createGain();lfo.frequency.value=id==='waves'?.09:id==='cafe'?.4:.17;depth.gain.value=id==='waves'?400:100;lfo.connect(depth);depth.connect(filter.frequency);lfo.start();nodes.push(lfo,depth);}
  if(['forest','nature'].includes(id)){
   const chirp=()=>{if(gain.gain.value<.001)return;const o=c.createOscillator(),g=c.createGain(),at=c.currentTime;o.type='sine';o.frequency.setValueAtTime(id==='forest'?1800:640,at);o.frequency.exponentialRampToValueAtTime(id==='forest'?2600:960,at+.13);g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(.08,at+.02);g.gain.exponentialRampToValueAtTime(.001,at+.6);o.connect(g);g.connect(gain);o.start();o.stop(at+.7);o.onended=()=>{o.disconnect();g.disconnect();};};
   timers.push(setInterval(chirp,id==='forest'?4300:6900));
  }
  return{gain,nodes};
 }
 return{
  async start(mix){const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)throw Error('Ambient sound is unavailable in this browser.');context??=new Audio();await context.resume();if(context.state!=='running')throw Error('Your browser blocked audio. Try the sound button again.');this.update(mix);},
  update(mix){if(!context)return;for(const [id]of SOUND_SCAPES){const amount=Number(mix[id]||0);if(amount&&!channels.has(id))channels.set(id,makeChannel(id));const channel=channels.get(id);if(channel)channel.gain.gain.setTargetAtTime(amount/100*.32,context.currentTime,.08);}},
  stop(){this.update({});},
  async close(){timers.forEach(clearInterval);timers=[];for(const v of channels.values())for(const n of v.nodes){try{n.stop?.();n.disconnect();}catch{}}channels.clear();await context?.close();context=null;}
 };
}
