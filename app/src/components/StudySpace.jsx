import {useState} from 'react';
import {CloudRain,Coffee,Tree,WaveSine,Waves,Fire,Fan,Drop,Keyboard,Wind,SpeakerSlash,Play,Check,Plus} from '@phosphor-icons/react';
import {MusicControls} from './MusicControls.jsx';
import {THEMES,themePatch} from '../lib/ambient.mjs';
import {SOUND_SCAPES} from '../lib/sound-settings.mjs';
const SOUND_ICONS={rain:CloudRain,cafe:Coffee,forest:Tree,waves:Waves,white:WaveSine,brown:WaveSine,pink:WaveSine,fire:Fire,fan:Fan,stream:Drop,keyboard:Keyboard,nature:Wind};

export function ThemePicker({settings,command,ready}){const selected=settings.spaceTheme==='default'?settings.theme:settings.spaceTheme;return <div className="space-themes">{THEMES.map(([id,label,color])=><button key={id} disabled={!ready} className={selected===id?'chosen':''} aria-pressed={selected===id} onClick={()=>command('settings',{patch:themePatch(id)})}><span className="theme-swatch" style={{background:color}}/><span>{label}</span></button>)}</div>;}
export function TimerSizePicker({settings,command,ready}) {
 return <fieldset className="timer-size-picker"><legend>Timer size</legend><div>{['small','medium','large'].map(size=><button key={size} type="button" aria-pressed={settings.timerSize===size} disabled={!ready} onClick={()=>command('settings',{patch:{timerSize:size}})}><span aria-hidden="true" className={`size-sample ${size}`}>25</span><span>{size[0].toUpperCase()+size.slice(1)}</span>{settings.timerSize===size&&<Check size={14} aria-hidden="true"/>}</button>)}</div><p className="help">Fits your screen automatically. Choose a smaller or larger view.</p></fieldset>;
}
export function AmbientControls({mix,volume,presets,active,error,onVolume,onMaster,onMute,onResume,onPreset,onSavePreset,onDeletePreset,onRestorePresets}) {
 const [editing,setEditing]=useState(false),[selected,setSelected]=useState(null),[name,setName]=useState(''),[notice,setNotice]=useState('');
 const selectedPreset=presets.find(p=>p.id===selected);
 const hasMix=Object.values(mix).some(v=>v>0);
 const startEdit=()=>{setName(selectedPreset?.name||'');setEditing(true);setNotice('');};
 const save=async id=>{if(await onSavePreset(name,id)){setEditing(false);setNotice(id?'Mix updated.':'Mix saved.');}};
 return <div className="ambient-controls">
  <p className="help sound-intro">12 original synthesised textures. Choose a sound or a saved mix to play.</p>
  <div className="ambient-grid">{SOUND_SCAPES.map(([id,label])=>{
   const Icon=SOUND_ICONS[id],chosen=!!mix[id],on=active&&chosen&&volume>0;
   return <div className={`sound-tile ${chosen?'selected':''}`} key={id}>
    <button type="button" aria-label={label} aria-pressed={on} onClick={()=>onVolume(id,active&&chosen?0:mix[id]||35)}>
     <Icon size={26} weight="light" aria-hidden="true"/><span>{id==='nature'?'Breeze':label}</span><small>{on?<><Check size={11} aria-hidden="true"/> On</>:chosen?'Ready':'Off'}</small>
    </button>
    <label className="sound-channel"><span className="sr-only">{label} volume</span><input aria-label={`${label} volume`} type="range" min="0" max="100" value={mix[id]||0} onChange={e=>onVolume(id,Number(e.target.value))}/><output>{mix[id]||0}%</output></label>
   </div>;
  })}</div>
  <div className="ambient-master"><label><span>Master volume</span><output>{volume}%</output><input aria-label="Ambient master volume" type="range" min="0" max="100" value={volume} onChange={e=>onMaster(Number(e.target.value))}/></label><button type="button" className="button" disabled={!hasMix} onClick={active?onMute:onResume}>{active?<SpeakerSlash size={19}/>:<Play size={19}/>} {active?'Mute':'Play mix'}</button></div>
  <p className="help mute-note" role="status">{active?(volume===0?'Master volume is 0%. Raise it to hear your mix.':'Closing this panel keeps your mix playing.'):'Sound is off. Your mix levels are kept for next time.'}</p>
  <div className="mix-heading"><h3>Saved mixes</h3><button type="button" onClick={startEdit}><Plus size={15}/> Save mix</button></div>
  <div className="mix-presets">{presets.map(p=><button type="button" key={p.id} className={selected===p.id?'selected':''} onClick={()=>{setSelected(p.id);setEditing(false);setNotice('');onPreset(p);}}><Play size={13} aria-hidden="true"/>{p.name}</button>)}</div>
  {presets.length===0&&<p className="help">No saved mixes yet. Choose sounds and save your first mix.</p>}
  {editing&&<form className="mix-editor" onSubmit={e=>{e.preventDefault();save(selectedPreset?.id);}}>
   <label>Mix name<input autoFocus aria-label="Mix name" maxLength={32} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Evening reading" required/></label>
   <div><button type="submit" className="button primary" disabled={!name.trim()}>{selectedPreset?'Save changes':'Save new mix'}</button>{selectedPreset&&<button type="button" className="button" disabled={!name.trim()} onClick={()=>save()}>Save as new</button>}<button type="button" className="button" onClick={()=>setEditing(false)}>Cancel</button></div>
   {selectedPreset&&<button type="button" className="text-button" onClick={async()=>{if(await onDeletePreset(selected)){setSelected(null);setEditing(false);setNotice('Saved mix removed.');}}}>Remove this saved mix</button>}
  </form>}
  <button type="button" className="restore-mixes" onClick={async()=>{if(await onRestorePresets()){setSelected(null);setEditing(false);setNotice('The three starter mixes have been restored.');}}}>Restore starter mixes</button>
  {notice&&<p className="help" role="status">{notice}</p>}{error&&<p className="field-error" role="alert">{error}</p>}
 </div>;
}
export function StudySpace({store,ambient,music,navigate}){return <main id="main-content" className="workspace management"><div className="workspace-heading"><div><span className="eyebrow">YOUR FOCUS SPACE</span><h1>Make space for your next study session</h1><p>Choose a quieter look and a sound that suits your session.</p></div><a className="button primary" href="/" onClick={navigate}>Open Study Timer</a></div><div className="management-grid"><section className="management-panel"><h2>A setting that suits you</h2><ThemePicker settings={store.data.settings} command={store.command} ready={store.ready}/><TimerSizePicker settings={store.data.settings} command={store.command} ready={store.ready}/><p className="help">Static, original colour palettes. Reduce motion is available in Settings.</p></section><section className="management-panel"><h2>Ambient sound</h2><AmbientControls {...ambient}/></section><section className="management-panel study-music-panel"><h2>Study music</h2><MusicControls music={music}/></section></div><details className="management-faq"><summary>Will sounds play after I close the browser?</summary><p>No. Keep the page open. Sleep mode and device settings can interrupt audio.</p></details></main>;}
