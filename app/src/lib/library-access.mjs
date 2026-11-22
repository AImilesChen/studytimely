import {MUSIC_TRACKS} from './music-catalog.mjs';
import {ORIGINAL_SCENES} from './original-scenes.mjs';

// Versioned product boundary. Existing colour themes and field recordings stay free.
export const LIBRARY_POLICY_VERSION=1;
// A fresh private URL avoids reusing formerly public, immutable browser caches.
export const libraryMediaURL=path=>'/library/full'+path;
export const FREE_THEMES=['dark','light','midnight','sand','rain','forest','coffee','desk'];
export const PLUS_THEMES=['terracotta','paper','rose'];
export const FREE_SCENES=['mist-lake','sunlit-meadow','rain-lake','pastel-sea'];
export const PLUS_SCENES=['cloud-valley','clear-lagoon','alpine-lake','blue-plains','valley-drizzle','rain-cleared-meadow','lavender-lake','dusk-cloud-sea','coast','rain',...ORIGINAL_SCENES.map(scene=>scene.id)];
export const sceneAssetPath=id=>'/focus-scenes/'+id+(['coast','rain'].includes(id)?'-nature-v1.webp':'-generated-v1.webp');
export function libraryTier(kind,id){
 if(kind==='music'){const track=MUSIC_TRACKS.find(t=>t.id===id);return track?(track.plannedTier==='free'?'free':'plus'):null;}
 if(kind==='theme')return FREE_THEMES.includes(id)?'free':PLUS_THEMES.includes(id)?'plus':null;
 if(kind==='scene')return FREE_SCENES.includes(id)?'free':PLUS_SCENES.includes(id)?'plus':null;
 return null;
}
export function libraryItem(access,kind,id,at=Date.now()){
 const tier=libraryTier(kind,id),active=access?.allowed===true&&(!access.expiresAt||access.expiresAt>at);
 const allowed=tier==='free'||tier==='plus'&&active;
 return {tier,allowed,label:tier==='free'?'Free':active?(access.source==='subscription'?'Plus':'Plus · free preview'):'Plus'};
}
export function availableMusic(access,at=Date.now()){return MUSIC_TRACKS.filter(t=>libraryItem(access,'music',t.id,at).allowed).map(t=>t.id);}
export function effectiveTheme(settings,access,at=Date.now()){
 return libraryItem(access,'theme',settings.spaceTheme==='default'?settings.theme:settings.spaceTheme,at).allowed?{theme:settings.theme,spaceTheme:settings.spaceTheme}:{theme:settings.theme,spaceTheme:'default'};
}
