import {SOUND_SCAPES} from './sound-settings.mjs';
export {SOUND_SCAPES} from './sound-settings.mjs';
export const THEMES=[['dark','Dark','#101110'],['light','Light','#f3f2ec'],['midnight','Midnight','#121b30'],['sand','Sand','#ede1c5'],['rain','Rainy day','#18252b'],['forest','Forest','#17251d'],['coffee','Coffee shop','#2a211b'],['desk','Night desk','#211b2c']];
export function themePatch(id){return id==='dark'||id==='light'?{theme:id,spaceTheme:'default'}:{theme:id==='sand'?'light':'dark',spaceTheme:id};}

// Original, synthesised textures. No downloaded recordings, voices or music.
// Pink noise uses the standard multi-pole approximation; brown noise integrates white noise.
export function createNoiseValues(id, length, sampleRate, random = Math.random) {
 const values = new Float32Array(length), pink = new Float64Array(7);
 let brown=0, eventLeft=0, eventLength=0, eventPitch=0, nextEvent=0;
 for(let i=0;i<length;i++) {
  const white=random()*2-1;
  brown=(brown+.02*white)/1.02;
  pink[0]=.99886*pink[0]+white*.0555179;
  pink[1]=.99332*pink[1]+white*.0750759;
  pink[2]=.969*pink[2]+white*.153852;
  pink[3]=.8665*pink[3]+white*.3104856;
  pink[4]=.55*pink[4]+white*.5329522;
  pink[5]=-.7616*pink[5]-white*.016898;
  const soft=(pink[0]+pink[1]+pink[2]+pink[3]+pink[4]+pink[5]+pink[6]+white*.5362)*.11;
  pink[6]=white*.115926;
  const t=i/sampleRate;
  let value=soft;
  if(id==='white') value=white*.28;
  if(id==='brown') value=brown*3.2;
  if(id==='pink') value=soft;
  if(id==='rain') value=(soft*.7+white*.12)*(.8+.12*Math.sin(t*1.1));
  if(id==='waves') value=brown*3.2*(.35+.65*(1-Math.cos(2*Math.PI*t/8))/2);
  if(id==='cafe') value=(brown*1.6+soft*.2)*(.6+.18*Math.sin(t*2.7)+.12*Math.sin(t*4.1));
  if(id==='forest'||id==='nature') value=brown*1.4;
  if(id==='stream') value=(soft*.65+white*.08)*(.75+.15*Math.sin(t*13)+.1*Math.sin(t*23));
  if(id==='fan') value=brown*1.6+Math.sin(2*Math.PI*90*t)*.035*(.8+.2*Math.sin(2*Math.PI*1.5*t));
  if(id==='fire'||id==='keyboard') {
   value=id==='fire'?brown*1.5:0;
   if(i>=nextEvent) {
    eventLength=Math.floor(sampleRate*(id==='fire'?.012+random()*.06:.018+random()*.025));
    eventLeft=eventLength;eventPitch=350+random()*1400;
    nextEvent=i+Math.floor(sampleRate*(id==='fire'?.04+random()*.5:.09+random()*.38));
    if(id==='keyboard'&&random()<.12)nextEvent+=sampleRate*.8;
   }
   if(eventLeft>0) {
    const age=(eventLength-eventLeft)/sampleRate, envelope=(eventLeft/eventLength)**3;
    value+=(white*.22+Math.sin(2*Math.PI*eventPitch*age)*.08)*envelope;
    eventLeft--;
   }
  }
  values[i]=Math.max(-.9,Math.min(.9,value));
 }
 // Millisecond edge fades prevent clicks when the original texture loops.
 const edge=Math.min(Math.floor(sampleRate*.006),Math.floor(length/2));
 for(let i=0;i<edge;i++){values[i]*=i/edge;values[length-i-1]*=i/edge;}
 return values;
}

export function createAmbientEngine({AudioContext:AudioOverride}={}) {
 let context=null, master=null, compressor=null, generation=0, suspension=null;
 const channels=new Map();
 function makeChannel(id) {
  const c=context, gain=c.createGain(), filter=c.createBiquadFilter(), source=c.createBufferSource();
  const buffer=c.createBuffer(1,c.sampleRate*16,c.sampleRate);
  buffer.getChannelData(0).set(createNoiseValues(id,buffer.length,c.sampleRate));
  source.buffer=buffer;source.loop=true;
  filter.type=id==='rain'?'highpass':id==='cafe'?'bandpass':'lowpass';
  filter.frequency.value=({rain:600,cafe:480,forest:1600,white:20000,brown:1200,pink:12000,waves:850,nature:650,fire:4000,fan:1600,stream:6000,keyboard:6500})[id];
  filter.Q.value=id==='cafe'?.7:.3;
  source.connect(filter);filter.connect(gain);gain.gain.value=0;gain.connect(master);source.start();
  const nodes=[source,filter,gain];
  if(['forest','nature'].includes(id)) {
   // Soft bird-like or bell-like tones are original synthesis, not field recordings.
   const tone=c.createBufferSource(), b=c.createBuffer(1,c.sampleRate*16,c.sampleRate), v=b.getChannelData(0);
   for(const at of [2.1,7.3,12.4])for(let j=0;j<c.sampleRate*.7;j++){
    const t=j/c.sampleRate, frequency=id==='forest'?1700+900*t:640;
    v[Math.floor(at*c.sampleRate)+j]=Math.sin(2*Math.PI*frequency*t)*Math.exp(-t*9)*Math.min(1,t*80)*.055;
   }
   tone.buffer=b;tone.loop=true;tone.connect(gain);tone.start();nodes.push(tone);
  }
  return {gain,nodes};
 }
 function update(mix,volume=60) {
  if(!context)return;
  master.gain.setTargetAtTime(volume/100,context.currentTime,.06);
  for(const [id] of SOUND_SCAPES) {
   const amount=Number(mix[id]||0);
   if(amount&&!channels.has(id))channels.set(id,makeChannel(id));
   channels.get(id)?.gain.gain.setTargetAtTime(amount/100*.32,context.currentTime,.06);
  }
 }
 return {
  async start(mix,volume=60) {
   const token=++generation;
   clearTimeout(suspension);
   const Audio=AudioOverride||globalThis.AudioContext||globalThis.webkitAudioContext;
   if(!Audio)throw Error('Ambient sound is unavailable in this browser.');
   if(!context) {
    context=new Audio();master=context.createGain();compressor=context.createDynamicsCompressor();
    compressor.threshold.value=-18;compressor.knee.value=18;compressor.ratio.value=4;
    master.connect(compressor);compressor.connect(context.destination);
   }
   await context.resume();
   if(token!==generation)return false;
   if(context.state!=='running')throw Error('Your browser blocked audio. Try the sound button again.');
   update(mix,volume);return true;
  },
  update,
  stop() {
   generation++;update({},0);
   clearTimeout(suspension);
   suspension=setTimeout(()=>{if(context?.state==='running')context.suspend().catch(()=>{});},220);
  },
  async close() {
   generation++;clearTimeout(suspension);
   for(const v of channels.values())for(const n of v.nodes){try{n.stop?.();n.disconnect();}catch{}}
   channels.clear();master?.disconnect();compressor?.disconnect();
   const old=context;context=null;await old?.close();
  }
 };
}
