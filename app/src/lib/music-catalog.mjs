import catalog from '../../public/music/catalog.json' with {type:'json'};
export const MUSIC_TRACKS=catalog.tracks;
export const MUSIC_REPEAT=['all','one','off'];
export const musicTrack=id=>MUSIC_TRACKS.find(t=>t.id===id);
export function musicTime(seconds){const n=Math.max(0,Math.round(Number.isFinite(seconds)?seconds:0));return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;}
export const MUSIC_CATEGORIES=['All','Piano','Ambient','Gentle rhythm','Favorites'];
export function validateMusicList(ids,max=100){
 if(!Array.isArray(ids)||ids.length>max||new Set(ids).size!==ids.length||ids.some(id=>!musicTrack(id)))throw Error('Choose supported, unique music tracks.');
 return [...ids];
}
export function nextMusicId(id,repeat='all',queue=[]){
 const tracks=queue.length?queue:MUSIC_TRACKS.map(t=>t.id),i=tracks.indexOf(id);
 if(i<0)return tracks[0];
 if(repeat==='one')return id;
 return tracks[i+1]||(repeat==='all'?tracks[0]:null);
}
