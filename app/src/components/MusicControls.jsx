import {MusicNotes,PianoKeys,Play,Pause,SkipBack,SkipForward,SpeakerHigh,SpeakerSlash,Check} from '@phosphor-icons/react';
import {MUSIC_TRACKS,musicTrack,musicTime} from '../lib/music-catalog.mjs';

export function MusicControls({music}){
 const track=musicTrack(music.trackId)||MUSIC_TRACKS[0];
 const playing=music.status==='playing',loading=music.status==='loading';
 const duration=music.duration||track.durationSeconds;
 return <div className="music-controls">
  <p className="help music-intro">Free instrumental music. Full recordings, with no account or subscription. Press Play to begin.</p>
  <section className="music-now" aria-label="Music player">
   <div className="music-current"><span className="music-cover" aria-hidden="true"><MusicNotes size={32} weight="light"/></span><div><span className="music-eyebrow">{playing?'NOW PLAYING':loading?'LOADING':'READY TO PLAY'}</span><h3>{track.title}</h3><p>Kevin MacLeod · {track.style}</p></div></div>
   <div className="music-transport">
    <button type="button" className="icon-button" disabled={!music.ready} aria-label="Previous track" onClick={()=>music.onSkip(-1)}><SkipBack size={23}/></button>
    <button type="button" className="music-play" disabled={!music.ready} aria-label={playing||loading?'Pause music':'Play music'} onClick={playing||loading?music.onPause:()=>music.onPlay()}>{playing||loading?<Pause size={24} weight="fill"/>:<Play size={24} weight="fill"/>}<span>{loading?'Loading…':playing?'Pause':'Play'}</span></button>
    <button type="button" className="icon-button" disabled={!music.ready} aria-label="Next track" onClick={()=>music.onSkip(1)}><SkipForward size={23}/></button>
   </div>
   <label className="music-progress"><span className="sr-only">Music position</span><input aria-label="Music position" type="range" min="0" max={duration} step="1" value={Math.min(music.position,duration)} disabled={!music.duration} aria-valuetext={`${musicTime(music.position)} of ${musicTime(duration)}`} onChange={e=>music.onSeek(Number(e.target.value))}/><span><time>{musicTime(music.position)}</time><time>{musicTime(duration)}</time></span></label>
   <div className="music-options"><label>Repeat<select aria-label="Repeat music" disabled={!music.ready} value={music.repeat} onChange={e=>music.onRepeat(e.target.value)}><option value="all">Playlist</option><option value="one">This track</option><option value="off">Off</option></select></label><button type="button" className="icon-button" aria-label={music.muted?'Unmute music':'Mute music'} aria-pressed={music.muted} disabled={!music.ready} onClick={music.onMute}>{music.muted||music.volume===0?<SpeakerSlash size={20}/>:<SpeakerHigh size={20}/>}</button><label className="music-volume"><span>Volume <output>{music.volume}%</output></span><input aria-label="Music volume" type="range" min="0" max="100" value={music.volume} disabled={!music.ready} onChange={e=>music.onVolume(Number(e.target.value))}/></label></div>
  </section>
  <p className="music-status" role="status">{music.error?'Playback paused. Try Play again after resolving the message below.':loading?'Loading the full recording…':playing?`Playing ${track.title}. Music continues when you close this panel.`:music.status==='ended'?'Playlist finished. Press Play to listen again.':'Music is paused. It never starts automatically on a new visit.'}</p>
  {music.error&&<p className="field-error" role="alert">{music.error}</p>}
  <div className="music-library-heading"><h3>Study playlist</h3><span>{MUSIC_TRACKS.length} tracks · Free</span></div>
  <ol className="music-library">{MUSIC_TRACKS.map(t=><li key={t.id}><button type="button" disabled={!music.ready} aria-label={`Play ${t.title}`} aria-current={track.id===t.id?'true':undefined} onClick={()=>music.onPlay(t.id)}><span className="music-track-icon" aria-hidden="true">{playing&&track.id===t.id?<Check size={20}/>:t.style==='Piano'||t.style==='Harp'?<PianoKeys size={20}/>:<MusicNotes size={20}/>}</span><span className="music-track-name"><strong>{t.title}</strong><small>{t.style}</small></span><time>{musicTime(t.durationSeconds)}</time><Play size={14} aria-hidden="true"/></button></li>)}</ol>
  <details className="music-credits"><summary>Music credits &amp; license</summary><p>All five recordings are by <a href="https://incompetech.com/" target="_blank" rel="noreferrer">Kevin MacLeod (incompetech.com)</a>, licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">Creative Commons: By Attribution 4.0</a>. Original recordings are unchanged. No endorsement is implied.</p><ul>{MUSIC_TRACKS.map(t=><li key={t.id}><a href={t.source} target="_blank" rel="noreferrer">{t.title}</a> — Kevin MacLeod</li>)}</ul><a href="/music/CREDITS.txt" target="_blank" rel="noreferrer">Full credits</a> · <a href="/music/CC-BY-4.0.pdf" target="_blank" rel="noreferrer">License PDF</a></details>
  <p className="help music-note">Music loads from StudyTimely only when played. A connection is needed to load a track; music is not included in the offline app download. Music and Sounds have separate volume controls.</p>
 </div>;
}
