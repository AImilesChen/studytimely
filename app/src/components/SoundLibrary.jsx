import {useState} from 'react';
import {Pause,MusicNotes,Tree,Heart} from '@phosphor-icons/react';
import {AmbientControls} from './StudySpace.jsx';
import {MusicControls} from './MusicControls.jsx';
import '../audio-library.css';

export function SoundLibrary({ambient,music,initialTab='music',recommendation}){
 const [tab,setTab]=useState(initialTab);
 const stop=()=>{ambient.onMute();music.onPause();};
 return <div className="sound-library"><div className="audio-library-head"><p>Music and natural sounds. Free to try.</p><button type="button" className="button" onClick={stop}><Pause size={16}/>Pause all audio</button></div><div className="audio-library-tabs" role="group" aria-label="Sound library">{[['music','Music',MusicNotes],['ambient','Nature & spaces',Tree],['mixes','My mixes',Heart]].map(([id,label,Icon])=><button type="button" key={id} data-tone={id==='music'?'piano':id==='ambient'?'nature':'favorite'} aria-pressed={tab===id} onClick={()=>setTab(id)}><Icon size={17}/>{label}</button>)}</div>{tab==='music'?<>{recommendation}<MusicControls music={music}/></>:<AmbientControls key={tab} {...ambient} view={tab==='mixes'?'mixes':'sounds'}/>}</div>;
}
