import {useState} from 'react';
import {Bell,CornersOut,Palette,SpeakerHigh,SpeakerSlash} from '@phosphor-icons/react';
import {Dialog} from './Dialog.jsx';
import {AmbientControls,ThemePicker} from './StudySpace.jsx';
import '../timer-quick-tools.css';

export function TimerQuickTools({mode,store,ambient,onFocus,playSound}){
 const [panel,setPanel]=useState(null);
 const {data,ready,command,error}=store,s=data.settings;
 const playing=ambient.active&&Object.values(ambient.mix).some(v=>Number(v)>0);
 const titles={sounds:'Ambient sounds',alert:'Timer alert',themes:'Themes'};
 const soundCount=Object.values(ambient.mix).filter(v=>Number(v)>0).length;
 const patch=values=>command('settings',{patch:values});
 return <>
  <div className="timer-quick-tools" role="group" aria-label="Quick timer tools">
   <button type="button" disabled={!ready} aria-label="Ambient sounds" aria-haspopup="dialog" aria-expanded={panel==='sounds'} onClick={()=>setPanel('sounds')}>
    {playing?<SpeakerHigh size={19}/>:<SpeakerSlash size={19}/>}<span>Sounds</span>{playing&&<small>On</small>}
   </button>
   {!['clock','stopwatch'].includes(mode)&&<button type="button" disabled={!ready} aria-label="Timer alert" aria-haspopup="dialog" aria-expanded={panel==='alert'} onClick={()=>setPanel('alert')}><Bell size={19}/><span>Alert</span></button>}
   <button type="button" disabled={!ready} aria-label="Themes" aria-haspopup="dialog" aria-expanded={panel==='themes'} onClick={()=>setPanel('themes')}><Palette size={19}/><span>Themes</span></button>
   <button type="button" onClick={onFocus}><CornersOut size={19}/><span>Focus</span></button>
  </div>
  <Dialog open={!!panel} title={titles[panel]||'Quick timer tools'} close={()=>setPanel(null)} className="quick-tools-panel" preserveScroll>
   <div className="settings-body">
    {panel==='sounds'&&<><p className="quick-sound-status" role="status">{playing?`${soundCount} sound${soundCount===1?'':'s'} playing. Your mix continues when you close this panel.`:'Sounds are off. Choose a sound to start.'}</p><AmbientControls {...ambient}/></>}
    {panel==='alert'&&<><p className="help">Play an end sound for Pomodoro, Focus Timer or Countdown. Study Timer counts upwards and has no timed end.</p><label className="switch-row">End sound<input type="checkbox" checked={s.sound} onChange={e=>patch({sound:e.target.checked})}/></label><label className="field">Volume · {s.volume}%<input aria-label="End sound volume" type="range" min="0" max="100" value={s.volume} onChange={e=>patch({volume:Number(e.target.value)})}/></label><button type="button" className="button wide" onClick={()=>playSound(true)}><SpeakerHigh size={19}/> Test sound</button><p className="help">Keep this page and device awake. Closing the browser or sleep mode may prevent an alert.</p></>}
    {panel==='themes'&&<><p className="help">Choose a look for your timer. Your current session keeps running.</p><ThemePicker settings={s} command={command} ready={ready}/><label className="switch-row">Reduce motion<input type="checkbox" checked={s.reducedMotion} onChange={e=>patch({reducedMotion:e.target.checked})}/></label></>}
    {error&&<p className="field-error" role="alert">{error.message}</p>}
   </div>
  </Dialog>
 </>;
}
