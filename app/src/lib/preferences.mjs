// Only user-selected presentation settings are eligible for optional sync.
export const PREFERENCE_KEYS=['theme','spaceTheme','ambient','reducedMotion','sound','volume','clock24','showSeconds','showDate'];
export function pickPreferences(settings){return Object.fromEntries(PREFERENCE_KEYS.map(k=>[k,structuredClone(settings[k])]));}
