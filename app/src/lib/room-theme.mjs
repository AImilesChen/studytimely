import {ACTIVITY_SUBJECTS} from './group-activities.mjs';
export const ROOM_THEME_LIMIT=40;
export function roomThemeInput(value){
 if(typeof value!=='string')throw Error('Use a room theme of 2–40 characters.');
 const text=value.normalize('NFKC').trim();
 if(!text)return '';
 if(/[\p{Cc}\p{Cf}<>]/u.test(text))throw Error('Use a single line of plain text for your room theme.');
 const clean=text.replace(/\s+/gu,' '),length=Array.from(clean).length;
 if(length<2||length>ROOM_THEME_LIMIT)throw Error('Use a room theme of 2–40 characters.');
 return clean;
}
export const roomThemeLabel=room=>room.customTheme||ACTIVITY_SUBJECTS[room.subject]||ACTIVITY_SUBJECTS.general;
