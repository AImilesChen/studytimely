import {useCallback,useEffect,useRef,useState} from 'react';

// Presentation never changes the timer, music or saved preferences.
export function useTimerPresentation({enabled,path,onUnavailable}){
 const [focus,setFocus]=useState(false),[full,setFull]=useState(false),[controlsVisible,setControlsVisible]=useState(true);
 const workspace=useRef(null),wasFull=useRef(false),previousPath=useRef(path);
 const immersive=enabled&&(focus||full);
 function remember(){
  if(!workspace.current)workspace.current={path,left:window.scrollX,top:window.scrollY,trigger:document.activeElement};
 }
 function enterFocus(){
  if(!enabled){onUnavailable('Open a timer or city clock to use Focus Mode.');return;}
  remember();setFocus(true);
 }
 const leave=useCallback(async()=>{
  if(document.fullscreenElement){try{await document.exitFullscreen();}catch{onUnavailable('Could not exit fullscreen. Press Esc to return to your workspace.');return;}}
  setFocus(false);
 },[onUnavailable]);
 async function fullscreen(){
  if(document.fullscreenElement){await leave();return;}
  if(enabled)remember();
  try{
   if(!document.fullscreenEnabled||!document.documentElement.requestFullscreen)throw Error();
   await document.documentElement.requestFullscreen();
  }catch{
   if(enabled){setFocus(true);onUnavailable('Fullscreen is unavailable. Focus Mode is ready in this window.');}
   else{workspace.current=null;onUnavailable('Fullscreen is unavailable in this browser.');}
  }
 }
 useEffect(()=>{
  const changed=()=>{
   const current=!!document.fullscreenElement;
   if(current&&enabled)remember();
   if(!current&&wasFull.current)setFocus(false);
   wasFull.current=current;setFull(current);
  };
  changed();document.addEventListener('fullscreenchange',changed);
  return()=>document.removeEventListener('fullscreenchange',changed);
 },[enabled]);
 useEffect(()=>{
  if(previousPath.current===path)return;
  previousPath.current=path;workspace.current=null;setFocus(false);
 },[path]);
 useEffect(()=>{
  if(!immersive)return;
  const bodyOverflow=document.body.style.overflow,htmlOverflow=document.documentElement.style.overflow;
  document.body.style.overflow='hidden';document.documentElement.style.overflow='hidden';
  return()=>{
   document.body.style.overflow=bodyOverflow;document.documentElement.style.overflow=htmlOverflow;
   const saved=workspace.current;workspace.current=null;
   if(saved&&location.pathname===saved.path){
    // Wait for normal layout to return before restoring its position and trigger.
    requestAnimationFrame(()=>{
     if(saved.trigger?.isConnected)saved.trigger.focus?.({preventScroll:true});
     window.scrollTo({left:saved.left,top:saved.top,behavior:'instant'});
    });
   }
  };
 },[immersive]);
 useEffect(()=>{
  if(!immersive)return;
  let idle;
  const reveal=()=>{setControlsVisible(true);clearTimeout(idle);idle=setTimeout(()=>setControlsVisible(false),2500);};
  const key=e=>{
   reveal();
   if(e.key==='Escape'&&!document.fullscreenElement&&!document.querySelector('dialog[open]')){e.preventDefault();setFocus(false);}
  };
  reveal();
  window.addEventListener('pointermove',reveal,{passive:true});
  window.addEventListener('pointerdown',reveal,{passive:true});
  window.addEventListener('keydown',key);
  window.addEventListener('focusin',reveal);
  return()=>{clearTimeout(idle);window.removeEventListener('pointermove',reveal);window.removeEventListener('pointerdown',reveal);window.removeEventListener('keydown',key);window.removeEventListener('focusin',reveal);};
 },[immersive]);
 return {full,immersive,controlsVisible,enterFocus,fullscreen,leave};
}
