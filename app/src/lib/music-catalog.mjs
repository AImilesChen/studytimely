import catalog from '../../public/music/catalog.json' with {type:'json'};
export const MUSIC_TRACKS=catalog.tracks;
export const MUSIC_REPEAT=['all','one','off'];
export const musicTrack=id=>MUSIC_TRACKS.find(t=>t.id===id);
export function musicTime(seconds){const n=Math.max(0,Math.round(Number.isFinite(seconds)?seconds:0));return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;}
export function nextMusicId(id,repeat='all'){
 const i=MUSIC_TRACKS.findIndex(t=>t.id===id);
 if(i<0)return MUSIC_TRACKS[0].id;
 if(repeat==='one')return id;
 return MUSIC_TRACKS[i+1]?.id||(repeat==='all'?MUSIC_TRACKS[0].id:null);
}
