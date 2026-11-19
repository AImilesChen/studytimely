// The video layer is silent and never touches the learning timer or sound mix.
export function createSceneVideoPlayer({video,src,onStatus}){
 let gate={enabled:false,reduced:false,hidden:false,intersecting:true},disposed=false,attempt=0,failed=false;
 const wanted=()=>gate.enabled&&!gate.reduced&&!gate.hidden&&gate.intersecting;
 const status=()=>gate.reduced?'reduced':!gate.enabled?'off':gate.hidden||!gate.intersecting?'paused':failed?'unavailable':video.paused?'loading':'playing';
 const report=()=>{if(!disposed)onStatus(status());};
 const playing=()=>{if(!wanted()){video.pause();return;}failed=false;report();};
 const waiting=()=>{if(!disposed&&wanted())onStatus('loading');};
 const error=()=>{failed=true;video.pause();report();};
 video.addEventListener('playing',playing);video.addEventListener('waiting',waiting);video.addEventListener('error',error);
 async function update(next){
  if(disposed)return;
  const wasWanted=wanted();gate={...gate,...next};const token=++attempt;
  if(!wanted()){video.pause();report();return;}
  if(!wasWanted)failed=false;
  if(failed){report();return;}
  if(!video.getAttribute('src')){video.muted=true;video.src=src;video.load();}
  report();
  try{await video.play();if(disposed||token!==attempt){if(!wanted()||disposed)video.pause();return;}report();}
  catch{if(!disposed&&token===attempt){failed=true;report();}}
 }
 return {update,dispose(){disposed=true;attempt++;video.removeEventListener('playing',playing);video.removeEventListener('waiting',waiting);video.removeEventListener('error',error);video.pause();video.removeAttribute('src');video.load();}};
}
