export const SOUND_SCAPES = [
  ['rain', 'Rain'], ['cafe', 'Café'], ['forest', 'Forest'], ['waves', 'Ocean'],
  ['white', 'White noise'], ['brown', 'Brown noise'], ['pink', 'Pink noise'], ['fire', 'Fireplace'],
  ['fan', 'Fan'], ['stream', 'Stream'], ['keyboard', 'Keyboard'], ['nature', 'Breeze & chimes']
];
export const SOUND_IDS = SOUND_SCAPES.map(([id]) => id);
export const DEFAULT_MIXES = [
  {id:'rainy-reading', name:'Rainy reading', mix:{rain:55, fire:20}, volume:60},
  {id:'quiet-study', name:'Quiet study', mix:{brown:45, stream:20}, volume:60},
  {id:'cafe-study', name:'Café study', mix:{cafe:45, rain:20}, volume:60}
];
export const MAX_MIXES = 8;
export function validateMix(mix) {
  if (!mix || typeof mix !== 'object' || Array.isArray(mix)) throw Error('Invalid ambient mix.');
  return Object.fromEntries(Object.entries(mix).map(([id, volume]) => {
    if (!SOUND_IDS.includes(id) || !Number.isInteger(volume) || volume < 0 || volume > 100) throw Error('Choose a supported sound and a volume from 0 to 100.');
    return [id, volume];
  }));
}
export function validateMixes(presets) {
  if (!Array.isArray(presets) || presets.length > MAX_MIXES) throw Error(`Keep up to ${MAX_MIXES} saved mixes.`);
  const ids = new Set(), names = new Set();
  return presets.map(p => {
    if (!p || typeof p.id !== 'string' || !/^[a-z0-9-]{1,64}$/.test(p.id) || ids.has(p.id)) throw Error('Invalid saved mix.');
    if (typeof p.name !== 'string' || !p.name.trim() || p.name.trim().length > 32 || names.has(p.name.trim().toLowerCase())) throw Error('Use a unique mix name of up to 32 characters.');
    if (!Number.isInteger(p.volume) || p.volume < 0 || p.volume > 100) throw Error('Mix volume must be from 0 to 100.');
    ids.add(p.id); names.add(p.name.trim().toLowerCase());
    return {id:p.id, name:p.name.trim(), mix:validateMix(p.mix), volume:p.volume};
  });
}
