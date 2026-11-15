// Original synthesised tones; no recordings, requests or automatic audio on load.
export function createAlarmAudio({Audio=globalThis.AudioContext||globalThis.webkitAudioContext,setIntervalFn=setInterval,clearIntervalFn=clearInterval,setTimeoutFn=setTimeout,clearTimeoutFn=clearTimeout}={}){
 let context=null,interval=null,deadline=null,active=[],generation=0;
 function stop(){generation++;if(interval)clearIntervalFn(interval);if(deadline)clearTimeoutFn(deadline);deadline=null;interval=null;for(const o of active)try{o.stop();}catch{}active=[];}
 async function prime(){if(!Audio)throw Error('Audio is unavailable in this browser.');context??=new Audio();await context.resume();if(context.state!=='running')throw Error('Audio is blocked. Try Test sound again and check browser permissions.');}
 function note(tone,volume){if(!context||context.state!=='running')throw Error('Audio is paused. Test the alarm sound in this tab first.');const at=context.currentTime,freq=tone==='pulse'?880:tone==='chime'?523.25:660;
  for(let i=0;i<3;i++){const o=context.createOscillator(),g=context.createGain();o.type=tone==='bell'?'sine':'triangle';o.frequency.value=freq*(tone==='chime'?[1,1.25,1.5][i]:1);g.gain.setValueAtTime(0,at+i*.2);g.gain.linearRampToValueAtTime(volume/500,at+i*.2+.015);g.gain.exponentialRampToValueAtTime(.001,at+i*.2+.18);o.connect(g);g.connect(context.destination);o.start(at+i*.2);o.stop(at+i*.2+.2);active.push(o);o.onended=()=>{active=active.filter(x=>x!==o);o.disconnect();g.disconnect();};}
 }
 async function test(tone,volume){stop();const current=generation;if(!volume)throw Error('Alarm volume is 0%. Increase it before testing.');await prime();if(current===generation)note(tone,volume);}
 function ring(tone,volume,onError){stop();const current=generation;try{note(tone,volume);interval=setIntervalFn(()=>{if(current!==generation)return;try{note(tone,volume);}catch(e){stop();onError(e.message);}},1600);deadline=setTimeoutFn(stop,60000);}catch(e){stop();onError(e.message);}}
 return {prime,test,ring,stop,dispose(){stop();context?.close();context=null;}};
}
