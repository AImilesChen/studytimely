// Presentation is independent of the timer and saved study data. Native
// fullscreen changes (including the header button and Esc) share this state.
export function createFocusPresentation({document:doc,onChange,onUnavailable=()=>{}}){
 let full=!!doc.fullscreenElement,expanded=full,pending=false,disposed=false;
 const publish=()=>{if(!disposed)onChange({full,expanded,pending});};
 function changed(){
  const next=!!doc.fullscreenElement;
  if(next)expanded=true;
  else if(full)expanded=false;
  full=next;publish();
 }
 doc.addEventListener('fullscreenchange',changed);
 publish();
 async function exit(){
  if(pending||disposed)return;
  if(!doc.fullscreenElement){expanded=false;publish();return;}
  pending=true;publish();
  try{await doc.exitFullscreen();if(!disposed){changed();expanded=false;}}
  catch{if(!disposed)onUnavailable('Could not exit fullscreen. Press Esc to return.');}
  finally{pending=false;publish();}
 }
 return {
  expand(){if(disposed||pending)return;expanded=true;publish();},
  back:exit,
  async toggleFullscreen(){
   if(pending||disposed)return;
   if(doc.fullscreenElement){await exit();return;}
   pending=true;publish();
   try{
    if(doc.fullscreenEnabled===false||!doc.documentElement.requestFullscreen)throw Error();
    await doc.documentElement.requestFullscreen();if(!disposed)changed();
   }catch{if(!disposed){expanded=true;onUnavailable('Fullscreen is unavailable. Expanded view is ready in this window.');}}
   finally{pending=false;publish();}
  },
  dispose(){disposed=true;doc.removeEventListener('fullscreenchange',changed);}
 };
}
