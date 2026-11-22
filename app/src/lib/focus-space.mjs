import {SCENE_VIDEOS} from './scene-media.mjs';
import {ORIGINAL_SCENES,SCENE_CATEGORIES} from './original-scenes.mjs';
import {libraryMediaURL,libraryTier,sceneAssetPath} from './library-access.mjs';
import {validateMix} from './sound-settings.mjs';
import {musicTrack,validateMusicList,MUSIC_REPEAT} from './music-catalog.mjs';
export const FOCUS_SCENES=[
 {id:'mist-lake',name:'Morning mist',group:'Morning reading',caption:'Soft light over a quiet lake.',mix:{stream:20},accent:'#e8d9c6'},
 {id:'cloud-valley',name:'Misty hills',group:'Morning reading',caption:'Soft mountain layers above the clouds.',mix:{stream:15},accent:'#d4e5da'},
 {id:'clear-lagoon',name:'Bright bay',group:'Morning reading',caption:'Clear blue water and a pale sandy shore.',mix:{waves:20},accent:'#a9dfdf'},
 {id:'sunlit-meadow',name:'Sunlit slopes',group:'Afternoon study',caption:'Gentle sunlight across open green hills.',mix:{nature:20},accent:'#dce6bb'},
 {id:'alpine-lake',name:'Open lakeshore',group:'Afternoon study',caption:'Fresh mountain air and open water.',mix:{nature:20},accent:'#c1deed'},
 {id:'blue-plains',name:'Blue-sky plains',group:'Afternoon study',caption:'Open grassland beneath a soft blue sky.',mix:{nature:20},accent:'#cce2d2'},
 {id:'rain-lake',name:'Rainy lake',group:'Rainy focus',caption:'Light rain over a peaceful lake.',mix:{rain:35},accent:'#c2dce4'},
 {id:'valley-drizzle',name:'Valley drizzle',group:'Rainy focus',caption:'Fine rain across a quiet green valley.',mix:{rain:35},accent:'#c9ded3'},
 {id:'rain-cleared-meadow',name:'Rain-cleared meadow',group:'Rainy focus',caption:'Fresh open fields after a gentle shower.',mix:{rain:20},accent:'#d8e3c7'},
 {id:'pastel-sea',name:'Pastel sea',group:'Evening reading',caption:'Pale pink skies and a gentle shoreline.',mix:{waves:20},accent:'#efd7d3'},
 {id:'lavender-lake',name:'Warm lake',group:'Evening reading',caption:'Warm evening light reflected on still water.',mix:{stream:15},accent:'#e3cfe3'},
 {id:'dusk-cloud-sea',name:'Dusk cloud sea',group:'Evening reading',caption:'Soft peach light above a sea of clouds.',mix:{stream:10},accent:'#e5d5e4'},
 {id:'coast',name:'Ocean waves',group:'Live',caption:'Real waves washing onto the shore.',mix:{waves:45,nature:10},accent:'#afe0ed'},
 {id:'rain',name:'Rain on glass',group:'Live',caption:'Real rain, softly moving across the window.',mix:{rain:48},accent:'#c5d9fd'},
 ...ORIGINAL_SCENES
];
export const FOCUS_ATMOSPHERES={
 'Morning reading':{sound:'Light piano + gentle water',music:'meditation-01'},
 'Afternoon study':{sound:'Instrumental music + soft breeze',music:'dream-culture'},
 'Rainy focus':{sound:'Gentle rain · optional piano',music:'evening-piano'},
 'Evening reading':{sound:'Ambient music + gentle water',music:'water-prelude'}
};
export const SCENE_GROUPS=['All',...SCENE_CATEGORIES,'Live'];
const legacyScene=id=>({minimal:'coast',cabin:'coast',library:'coast',cafe:'coast','soft-dunes':'blue-plains','after-rain':'rain-cleared-meadow','rain-coast':'valley-drizzle','golden-grassland':'dusk-cloud-sea'}[id]||id);
export const sceneFor=id=>FOCUS_SCENES.find(s=>s.id===legacyScene(id))||FOCUS_SCENES[0];
export const sceneImage=id=>{const scene=sceneFor(id),src=sceneAssetPath(scene.id);return libraryTier('scene',scene.id)==='plus'?libraryMediaURL(src):src;};
export const sceneThumbnail=id=>'/focus-scenes/previews/'+sceneFor(id).id+'-v1.webp';
export const sceneVideo=id=>{const src=SCENE_VIDEOS.find(s=>s.id===legacyScene(id))?.src;return src?libraryMediaURL(src):null;};
export const sceneKind=id=>sceneVideo(id)?'Live video':sceneFor(id).kind||'Still scene';
export const DEFAULT_FOCUS_CONFIG={scene:'mist-lake',appearance:'day',motion:true,mode:'focus',minutes:25,breakMinutes:5,mix:{stream:20},volume:45,sound:false,endSound:'fade',musicTrack:'',musicVolume:25,musicRepeat:'one',musicQueue:[]};
export function focusConfig(value={}){
 const c={...DEFAULT_FOCUS_CONFIG,...value};c.scene=legacyScene(c.scene);
 if(!FOCUS_SCENES.some(s=>s.id===c.scene)||!['study','focus','pomodoro'].includes(c.mode))throw Error('Choose a supported scene and study timer.');
 for(const [key,min,max]of [['minutes',1,240],['breakMinutes',1,60],['volume',0,100]])if(!Number.isInteger(c[key])||c[key]<min||c[key]>max)throw Error(`Enter ${key} from ${min} to ${max}.`);
 if(!['day','night'].includes(c.appearance))throw Error('Choose a day or night display.');
 if(typeof c.motion!=='boolean')throw Error('Choose whether scene motion is enabled.');
 if(typeof c.sound!=='boolean'||!['keep','fade'].includes(c.endSound))throw Error('Choose a sound preference.');
 if(c.musicTrack!==''&&!musicTrack(c.musicTrack)||!MUSIC_REPEAT.includes(c.musicRepeat)||!Number.isInteger(c.musicVolume)||c.musicVolume<0||c.musicVolume>100)throw Error('Choose a supported music setup.');
 return {scene:c.scene,appearance:c.appearance,motion:c.motion,mode:c.mode,minutes:c.minutes,breakMinutes:c.breakMinutes,mix:validateMix(c.mix),volume:c.volume,sound:c.sound,endSound:c.endSound,musicTrack:c.musicTrack,musicVolume:c.musicVolume,musicRepeat:c.musicRepeat,musicQueue:validateMusicList(c.musicQueue)};
}
export function focusTimerPatch(config){const c=focusConfig(config);return {focusSeconds:c.minutes*60,studyMinutes:c.minutes,shortBreak:c.breakMinutes,autoBreak:false,autoStudy:false,ambient:c.mix,ambientVolume:c.volume};}
export const FOCUS_DEVICE_PREFIX='studytimely-focus-space-v1:';
export const emptyFocusDevice=()=>({version:1,revision:0,config:focusConfig(),presets:[],notes:[]});
export function validateFocusDevice(v){
 if(!v||v.version!==1||!Number.isSafeInteger(v.revision)||v.revision<0||!Array.isArray(v.presets)||v.presets.length>20||!Array.isArray(v.notes)||v.notes.length>50)throw Error('Focus preferences could not be read. Existing data has been kept.');
 const ids=new Set();const text=(s,n)=>{if(typeof s!=='string'||!s.trim()||s.length>n)throw Error(`Use 1–${n} characters.`);return s.trim();};
 return {version:1,revision:v.revision,config:focusConfig(v.config),presets:v.presets.map(p=>{const id=text(p.id,100);if(ids.has(id))throw Error('Duplicate preset.');ids.add(id);return {id,name:text(p.name,40),config:focusConfig(p.config)};}),notes:v.notes.map(n=>{const id=text(n.id,100);if(ids.has(id)||!Number.isFinite(n.at)||n.at<0)throw Error('Invalid note.');ids.add(id);return {id,text:text(n.text,1000),at:n.at,...(typeof n.taskId==='string'?{taskId:text(n.taskId,150)}:{})};})};
}
export function readFocusDevice(storage,epoch){const raw=storage.getItem(FOCUS_DEVICE_PREFIX+epoch);return raw?validateFocusDevice(JSON.parse(raw)):emptyFocusDevice();}
export function writeFocusDevice(storage,epoch,previous,next){
 const current=readFocusDevice(storage,epoch);if(current.revision!==previous.revision)throw Error('Focus settings changed in another tab. Reload them before saving; your draft is kept.');
 const checked=validateFocusDevice({...next,revision:previous.revision+1});storage.setItem(FOCUS_DEVICE_PREFIX+epoch,JSON.stringify(checked));return checked;
}
export function clearFocusDevice(storage){for(let i=storage.length-1;i>=0;i--){const key=storage.key(i);if(key?.startsWith(FOCUS_DEVICE_PREFIX))storage.removeItem(key);}storage.setItem('studytimely-focus-reset-v1',crypto.randomUUID());}
export function focusFeedback(state,record,{done,remainingMinutes}){
 const task=state.workspace.tasks.find(t=>t.id===record.taskId&&!t.deletedAt);if(!task)throw Error('This task was removed. Your recorded study time is kept.');
 if(typeof done!=='boolean'||!Number.isInteger(remainingMinutes)||remainingMinutes<0||remainingMinutes>10080||(!done&&remainingMinutes===0))throw Error('Enter remaining work, or mark the task complete.');
 return {expectedRevision:state.workspace.planning.revision,taskId:task.id,blockId:record.planningBlockId||'',done,remainingMinutes};
}

// Prepared suggestions only: selecting one never commands a timer or an audio player.
export const FOCUS_STARTERS=[
 {id:'morning',title:'Morning reading',scene:'mist-lake',mode:'focus',minutes:25,breakMinutes:5,description:'Read a chapter or work through your notes in soft morning light.'},
 {id:'afternoon',title:'Afternoon study',scene:'sunlit-meadow',mode:'focus',minutes:50,breakMinutes:10,description:'Make room for a longer writing, coding or practice session.'},
 {id:'rainy',title:'Rainy focus',scene:'rain-lake',mode:'pomodoro',minutes:25,breakMinutes:5,description:'Try a study round with a separate break and optional gentle rain.'},
 {id:'evening',title:'Evening review',scene:'pastel-sea',mode:'focus',minutes:20,breakMinutes:5,description:'Review the day’s notes or prepare one small task for tomorrow.'}
];
export function applyFocusStarter(config,id){
 const item=FOCUS_STARTERS.find(s=>s.id===id);if(!item)throw Error('Choose an available study setup.');
 return focusConfig({...config,scene:item.scene,mode:item.mode,minutes:item.minutes,breakMinutes:item.breakMinutes,mix:{...sceneFor(item.scene).mix},sound:false});
}
