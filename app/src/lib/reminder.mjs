export const ALARM_TONES=['bell','chime','pulse'];
export const RING_MS=60000;
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
export function validateReminder(a){
 if(a==null)return null;
 if(typeof a!=='object'||typeof a.id!=='string'||a.id.length>150||typeof a.owner!=='string'||!['armed','ringing','missed','dismissed'].includes(a.status)||!Number.isFinite(a.at)||a.at<0||!Number.isFinite(a.firedAt)||a.firedAt<0||typeof a.label!=='string'||a.label.length>60||typeof a.sound!=='boolean'||!Number.isInteger(a.volume)||a.volume<0||a.volume>100||!ALARM_TONES.includes(a.tone))fail('CORRUPT','The saved alarm could not be read. It has not been overwritten.');
 return {id:a.id,owner:a.owner,status:a.status,at:a.at,firedAt:a.firedAt,label:a.label,sound:a.sound,volume:a.volume,tone:a.tone};
}
export function reminderAction(state,action,{now,owner,id}){
 if(!action.type.startsWith('reminder-'))return false;
 const a=validateReminder(state.reminder);
 if(action.type==='reminder-arm'){
  if((action.expectedId??null)!==(a?.id??null))fail('STALE','The alarm changed in another tab. Review it before setting another.');
  if(a&&['armed','ringing'].includes(a.status)&&a.owner!==owner)fail('OTHER_TAB','Move alarm checks here before changing this alarm.');
  // A local day can exceed 24 hours when clocks move back.
  if(!Number.isFinite(action.at)||action.at<=now||action.at>now+93600000)fail('INVALID','Choose the next occurrence of a local time.');
  state.reminder=validateReminder({id,owner,status:'armed',at:action.at,firedAt:0,label:String(action.label||'').trim(),sound:action.sound??true,volume:action.volume??60,tone:action.tone||'bell'});return 'alarm-set';
 }
 if(!a||action.reminderId!==a.id)fail('STALE','The alarm changed. Review its current state.');
 if(action.type==='reminder-claim'){
  const expired=(a.status==='armed'&&now>=a.at)||(a.status==='ringing'&&now-a.firedAt>=RING_MS);
  state.reminder={...a,owner,...(expired?{status:'missed',firedAt:now}:{})};return 'alarm-moved';
 }
 if(a.owner!==owner)fail('OTHER_TAB','Alarm checks are active in another tab. Move them here first.');
 if(action.type==='reminder-tick'){
  if(a.status==='armed'&&now>=a.at){state.reminder={...a,status:now-a.at>90000?'missed':'ringing',firedAt:now};return state.reminder.status==='ringing'?'alarm-reached':'alarm-missed';}
  if(a.status==='ringing'&&now-a.firedAt>=RING_MS){state.reminder={...a,status:'missed'};return 'alarm-ended';}
  return 'alarm-checked';
 }
 if(action.type==='reminder-dismiss'){state.reminder={...a,status:'dismissed'};return 'alarm-dismissed';}
 if(action.type==='reminder-snooze'){
  if(!['ringing','missed'].includes(a.status))fail('INVALID','Snooze is available after the alarm time.');
  state.reminder={...a,id,at:now+300000,status:'armed',firedAt:0};return 'alarm-set';
 }
 fail('INVALID','Choose a supported alarm action.');
}
export function legacyReminder(t){return {id:t.id,owner:t.owner||'',status:t.status==='running'?'armed':t.status==='completed'?'missed':'dismissed',at:t.alarmAt,firedAt:0,label:'',sound:false,volume:40,tone:'bell'};}
