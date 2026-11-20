import {activityPhase,activityWhen} from './group-activities.mjs';

// Presentation only: selection and shortcuts never start, pause or settle a timer.
export function initialRoomActivity(items,requested,now){
 const requestedActivity=items.find(item=>item.id===requested);
 if(requestedActivity)return requestedActivity.id;
 if(requested&&/^[a-f0-9-]{36}$/.test(requested))return requested;
 const active=items.find(item=>['focus','break'].includes(activityPhase(item,now)));
 const next=items.filter(item=>activityPhase(item,now)==='scheduled').sort((a,b)=>a.startsAt-b.startsAt)[0];
 const recent=items.filter(item=>item.joined&&activityPhase(item,now)==='ended').sort((a,b)=>b.startsAt-a.startsAt)[0];
 return active?.id||next?.id||recent?.id||'';
}

export function roomActivityNotice(items,detail,now,readOnly=false){
 const activity=detail?.activity,own=detail?.own;
 const joined=!!own&&!own.withdrawnAt,phase=activity&&activityPhase(activity,now);
 if(activity&&joined&&!own.checkedOutAt&&['break','ended'].includes(phase)){
  return {id:activity.id,title:activity.title,state:'result',description:phase==='break'?'Focus finished · add your result when ready':'Your activity has ended',action:readOnly?'view':'result',label:readOnly?'View activity':'Add your result'};
 }
 const current=items.find(item=>['focus','break'].includes(activityPhase(item,now)))
  ||items.filter(item=>activityPhase(item,now)==='scheduled').sort((a,b)=>a.startsAt-b.startsAt)[0];
 if(!current)return null;
 const state=activityPhase(current,now),isJoined=current.id===activity?.id?joined:!!current.joined;
 return {id:current.id,title:current.title,state,action:'view',
  description:state==='scheduled'?`${activityWhen(current.startsAt,current.zone)} · ${current.zone} · ${current.focusMinutes} min study`:state==='break'?'Group break in progress':`Activity in progress · ${isJoined?'You have joined':'Open to view or join'}`,
  label:state==='scheduled'&&!isJoined&&!readOnly?'View & join':state==='scheduled'?'View activity':'Enter activity'};
}
