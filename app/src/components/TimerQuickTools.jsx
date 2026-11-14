import {useState} from 'react';
import {Bell,EyeSlash,Palette,SpeakerHigh,SpeakerSlash,MusicNotes} from '@phosphor-icons/react';
import {MusicControls} from './MusicControls.jsx';
import {Dialog} from './Dialog.jsx';
import {AmbientControls,ThemePicker,TimerSizePicker} from './StudySpace.jsx';
import '../timer-quick-tools.css';

export function TimerQuickTools({mode,store,ambient,music,onFocus,playSound}){
 const [panel,setPanel]=useState(null);
 const {data,ready,command,error}=store,s=data.settings;
 const playing=ambient.active&&ambient.volume>0&&Object.values(ambient.mix).some(v=>Number(v)>0);
 const titles={sounds:'Ambient sounds',music:'Study music',alert:'Timer alert',themes:'Themes'};
 const patch=values=>command('settings',{patch:values});
 return <>
  <div className="timer-quick-tools" role="group" aria-label="Quick timer tools">
   <button type="button" disabled={!ready} aria-label="Ambient sounds" aria-haspopup="dialog" aria-expanded={panel==='sounds'} onClick={()=>setPanel('sounds')}>
    {playing?<SpeakerHigh size={19}/>:<SpeakerSlash size={19}/>}<span>Sounds</span>{playing&&<small>On</small>}
   </button>
   <button type="button" disabled={!ready} aria-label="Study music" aria-haspopup="dialog" aria-expanded={panel==='music'} onClick={()=>setPanel('music')}><MusicNotes size={19}/><span>Music</span>{music.status==='playing'&&!music.muted&&music.volume>0&&<small>On</small>}</button>
   {!['clock','stopwatch'].includes(mode)&&<button type="button" disabled={!ready} aria-label="Timer alert" aria-haspopup="dialog" aria-expanded={panel==='alert'} onClick={()=>setPanel('alert')}><Bell size={19}/><span>Alert</span></button>}
   <button type="button" disabled={!ready} aria-label="Themes" aria-haspopup="dialog" aria-expanded={panel==='themes'} onClick={()=>setPanel('themes')}><Palette size={19}/><span>Themes</span></button>
   <button type="button" onClick={onFocus} title="Focus Mode · hide menus in this window"><EyeSlash size={19} aria-hidden="true"/><span>Focus</span></button>
  </div>
  <Dialog open={!!panel} title={titles[panel]||'Quick timer tools'} close={()=>setPanel(null)} className={`quick-tools-panel ${panel==='music'?'music-panel':''}`} preserveScroll>
   <div className="settings-body">
    {panel==='sounds'&&<AmbientControls {...ambient}/>}
    {panel==='music'&&<MusicControls music={music}/>}
    {panel==='alert'&&<><p className="help">Play an end sound for Pomodoro, Focus Timer or Countdown. Study Timer counts upwards and has no timed end.</p><label className="switch-row">End sound<input type="checkbox" checked={s.sound} onChange={e=>patch({sound:e.target.checked})}/></label><label className="field">Volume · {s.volume}%<input aria-label="End sound volume" type="range" min="0" max="100" value={s.volume} onChange={e=>patch({volume:Number(e.target.value)})}/></label><button type="button" className="button wide" onClick={()=>playSound(true)}><SpeakerHigh size={19}/> Test sound</button><p className="help">Keep this page and device awake. Closing the browser or sleep mode may prevent an alert.</p></>}
    {panel==='themes'&&<><p className="help">Choose a look for your timer. Your current session keeps running.</p><ThemePicker settings={s} command={command} ready={ready}/><TimerSizePicker settings={s} command={command} ready={ready}/><label className="switch-row">Reduce motion<input type="checkbox" checked={s.reducedMotion} onChange={e=>patch({reducedMotion:e.target.checked})}/></label></>}
    {error&&<p className="field-error" role="alert">{error.message}</p>}
   </div>
  </Dialog>
 </>;
}
