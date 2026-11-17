import {wallCandidates} from './exams.mjs';
import {zonedFormatter} from './time-zones.mjs';
export const ACTIVITY_SUBJECTS={general:'Independent study',maths:'Maths',science:'Science',languages:'Languages',humanities:'Humanities',coding:'Coding',writing:'Writing',exam:'Exam revision'};
export const ACTIVITY_KINDS={focus:'Quiet focus',revision:'Revision session',practice:'Practice questions',reading:'Reading session',assignment:'Assignment session'};
export const ROOM_NOTICES={welcome:'Choose one task, study quietly and check in at a break.',quiet:'Keep conversation for breaks. Each person controls their own timer.',revision:'Bring your revision materials and choose a small topic to practise.',kind:'Keep discussion kind, focused on learning and free of contact details.'};
export const ACTIVITY_OUTCOMES={completed:'Task completed',partial:'Some progress',not_started:'Not started'};
export function activityPhase(activity,now){
 if(activity.status==='cancelled')return 'cancelled';if(activity.status==='ended')return 'ended';
 if(activity.status==='scheduled')return 'scheduled';
 const focusEnd=activity.startedAt+activity.focusMinutes*60000;
 return now>=focusEnd+activity.breakMinutes*60000?'ended':now>=focusEnd?'break':'focus';
}
export function activityInput(input,now=Date.now()){
 if(!input||!Object.hasOwn(ACTIVITY_SUBJECTS,input.subject)||!Object.hasOwn(ACTIVITY_KINDS,input.kind))throw Error('Choose a study subject and activity type.');
 const focusMinutes=Number(input.focusMinutes),breakMinutes=Number(input.breakMinutes);
 if(!Number.isInteger(focusMinutes)||focusMinutes<5||focusMinutes>120||!Number.isInteger(breakMinutes)||breakMinutes<0||breakMinutes>30)throw Error('Choose 5–120 study minutes and 0–30 break minutes.');
 let candidates;try{candidates=wallCandidates(input.date,input.time,input.zone);}catch(e){throw Error(e.message.replaceAll('exam','activity'));}
 if(!candidates.length)throw Error('This local time does not exist because the clocks change. Choose another time.');
 if(candidates.length>1&&!['earlier','later'].includes(input.fold))throw Error('This time occurs twice. Choose the first or second occurrence.');
 const startsAt=input.fold==='later'?candidates.at(-1):candidates[0];
 if(startsAt<now-60000||startsAt>now+180*86400000)throw Error('Choose a start time from now to 180 days ahead.');
 const customTitle=typeof input.customTitle==='string'?input.customTitle.trim():'';
 if(customTitle.length>80)throw Error('Keep the activity title within 80 characters.');
 return {subject:input.subject,kind:input.kind,focusMinutes,breakMinutes,startsAt,zone:input.zone,customTitle,title:customTitle||`${ACTIVITY_SUBJECTS[input.subject]} · ${ACTIVITY_KINDS[input.kind]}`};
}
export function activityWall(at,zone){const parts=zonedFormatter(zone,{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(at).reduce((o,p)=>(o[p.type]=p.value,o),{});return {date:`${parts.year}-${parts.month}-${parts.day}`,time:`${parts.hour}:${parts.minute}`};}
export function activityWhen(at,zone){try{return zonedFormatter(zone,{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(at);}catch{return 'Time unavailable';}}
export function activityDuration(seconds=0){const s=Math.max(0,Math.floor(seconds));return s<60?`${s} sec`:s<3600?`${Math.floor(s/60)} min ${s%60?`${s%60} sec`:''}`.trim():`${Math.floor(s/3600)}h ${Math.floor(s%3600/60)}m`;}
