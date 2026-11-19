import {useEffect,useRef} from 'react';
import {sceneImage,sceneVideo} from '../lib/focus-space.mjs';
import {createSceneVideoPlayer} from '../lib/scene-video.mjs';

export function SceneVideo({scene,enabled,reducedMotion,onStatus}){
 const ref=useRef(null);
 useEffect(()=>{
  const video=ref.current,media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const player=createSceneVideoPlayer({video,src:sceneVideo(scene),onStatus});
  let intersecting=true;
  const update=()=>player.update({enabled,reduced:reducedMotion||media.matches,hidden:document.hidden,intersecting});
  const observer=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(entries=>{intersecting=entries[0]?.isIntersecting!==false;update();});
  observer?.observe(video);media.addEventListener?.('change',update);document.addEventListener('visibilitychange',update);update();
  return()=>{observer?.disconnect();media.removeEventListener?.('change',update);document.removeEventListener('visibilitychange',update);player.dispose();};
 },[scene,enabled,reducedMotion,onStatus]);
 return <video className="fs-scene-video" ref={ref} poster={sceneImage(scene)} preload="none" muted loop playsInline disablePictureInPicture aria-hidden="true"/>;
}
