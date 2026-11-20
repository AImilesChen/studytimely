import {activityPhase,activityWhen} from './group-activities.mjs';

// Presentation only: selection and shortcuts never start, pause or settle a timer.
export function initialRoomActivity(items,requested,now,readOnly=false){
 const requestedActivity=items.find(item=>item.id===requested);
 if(requestedActivity)return requestedActivity.id;
 if(requested&&/^[a-f0-9-]{36}$/.test(requested))return requested;
 const active=items.find(item=>['focus','break'].includes(activityPhase(item,now)));
 const scheduled=items.filter(item=>activityPhase(item,now)==='scheduled').sort((a,b)=>a.startsAt-b.startsAt);
 const next=scheduled.find(item=>item.startsAt>=now)||scheduled.at(-1);
 const ended=items.filter(item=>item.joined&&activityPhase(item,now)==='ended')
  .sort((a,b)=>(b.endedAt||b.startsAt)-(a.endedAt||a.startsAt));
 const pending=readOnly?null:ended.find(item=>item.awaitingResult);
 return active?.id||pending?.id||next?.id||ended[0]?.id||'';
}

export function roomActivityNotice(items,detail,now,readOnly=false){
 const activity=detail?.activity,own=detail?.own;
 const joined=!!own&&!own.withdrawnAt,phase=activity&&activityPhase(activity,now);
 if(activity&&joined&&!own.checkedOutAt&&['break','ended'].includes(phase)){
  return {id:activity.id,title:activity.title,state:'result',description:phase==='break'?'Focus finished · add your result when ready':'Your activity has ended',action:readOnly?'view':'result',label:readOnly?'View activity':'Add your result'};
 }
 const active=items.find(item=>['focus','break'].includes(activityPhase(item,now)));
 const pending=readOnly||active?null:items.filter(item=>item.id!==activity?.id&&item.awaitingResult&&activityPhase(item,now)==='ended')
  .sort((a,b)=>(b.endedAt||b.startsAt)-(a.endedAt||a.startsAt))[0];
 if(pending)return {id:pending.id,title:pending.title,state:'result',description:'Your activity has ended',action:'result',label:'Add your result'};
 const scheduled=items.filter(item=>activityPhase(item,now)==='scheduled').sort((a,b)=>a.startsAt-b.startsAt);
 const current=active||scheduled.find(item=>item.startsAt>=now)||scheduled.at(-1);
 if(!current)return null;
 const state=activityPhase(current,now),isJoined=current.id===activity?.id?joined:!!current.joined;
 const awaitingStart=state==='scheduled'&&current.startsAt<now;
 return {id:current.id,title:current.title,state,action:'view',
  awaitingStart,
  description:awaitingStart?'Scheduled time passed · waiting for the organiser':state==='scheduled'?`${activityWhen(current.startsAt,current.zone)} · ${current.zone} · ${current.focusMinutes} min study`:state==='break'?'Group break in progress':`Activity in progress · ${isJoined?'You have joined':'Open to view or join'}`,
  label:state==='scheduled'&&!isJoined&&!readOnly?'View & join':state==='scheduled'?'View activity':'Enter activity'};
}
