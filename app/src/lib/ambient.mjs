import {SOUND_SCAPES} from './sound-settings.mjs';
export {SOUND_SCAPES} from './sound-settings.mjs';
export const THEMES=[['dark','Dark','#101110'],['light','Light','#f3f2ec'],['midnight','Midnight','#121b30'],['sand','Sand','#ede1c5'],['rain','Rainy day','#18252b'],['forest','Forest','#17251d'],['coffee','Coffee shop','#2a211b'],['desk','Night desk','#211b2c']];
export function themePatch(id){return id==='dark'||id==='light'?{theme:id,spaceTheme:'default'}:{theme:id==='sand'?'light':'dark',spaceTheme:id};}

export {createNoiseValues} from './noise-values.mjs';
export {createAmbientEngine} from './ambient-engine.mjs';
