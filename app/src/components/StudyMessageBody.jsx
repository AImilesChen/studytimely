import {useEffect,useState} from 'react';
import {ArrowClockwise} from '@phosphor-icons/react';
import {stickerForMessage} from '../lib/study-stickers.mjs';
import '../study-stickers.css';
const reducedMotion=()=>document.documentElement.dataset.motion==='reduced'||window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export function StudySticker({message,compact=false,animate=false,interactive=false}){
 const sticker=stickerForMessage(message),[playing,setPlaying]=useState(()=>animate&&interactive),[replay,setReplay]=useState(0);
 useEffect(()=>{if(!interactive)setPlaying(false);},[interactive]);
 useEffect(()=>{if(!playing)return;const preference=window.matchMedia('(prefers-reduced-motion: reduce)'),stopIfQuiet=()=>{if(reducedMotion())setPlaying(false);};stopIfQuiet();preference.addEventListener('change',stopIfQuiet);const observer=new MutationObserver(stopIfQuiet);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});return()=>{preference.removeEventListener('change',stopIfQuiet);observer.disconnect();};},[playing]);
 if(!sticker)return null;
 const active=playing&&interactive&&!compact;
 function play(){if(reducedMotion())return;setReplay(n=>n+1);setPlaying(true);}
 return <span className={`study-sticker ${compact?'study-sticker-small':''} ${active?'study-sticker-playing':''}`} data-sticker-kind={sticker.type}>
  <span key={replay} className={`study-sticker-motion ${active?'study-sticker-enter':''}`} onAnimationEnd={e=>{if(e.target===e.currentTarget)setPlaying(false);}} aria-hidden="true"><img src={sticker.src} alt="" width="96" height="96" draggable="false"/></span>
  {!compact&&interactive&&<button type="button" className="study-sticker-replay" aria-label={'Replay '+sticker.label+' sticker'} title="Play sticker animation" onClick={play}><ArrowClockwise size={14} aria-hidden="true"/></button>}
  {!compact&&<span className="study-sticker-particles" aria-hidden="true"><i/><i/><i/></span>}
 </span>;
}
export function StudyMessageBody({message,animate=false,interactive=true}){
 return <div className={`study-message-body ${stickerForMessage(message)?'study-message-with-sticker':''}`}><StudySticker message={message} animate={animate} interactive={interactive}/><p>{message.text}</p></div>;
}
