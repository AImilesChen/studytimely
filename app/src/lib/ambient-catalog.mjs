import catalog from '../../public/ambient/catalog.json' with {type:'json'};
export const AMBIENT_RECORDINGS=catalog.sounds;
export const ambientRecording=id=>AMBIENT_RECORDINGS.find(s=>s.id===id);
export const NOISE_IDS=['white','pink','brown'];
