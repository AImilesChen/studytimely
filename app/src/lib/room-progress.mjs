import {activityPhase} from './group-activities.mjs';

export function progressDuration(value) {
 if (!Number.isFinite(value)) return 'Not available';
 const seconds=Math.floor(Math.max(0,value));
 if(seconds<60)return `${seconds} sec`;
 if(seconds<3600)return `${Math.floor(seconds/60)} min${seconds%60?' '+seconds%60+' sec':''}`;
 return `${Math.floor(seconds/3600)} hr ${Math.floor(seconds%3600/60)} min`;
}

export function roomContributions(totals,members=[],profileId='') {
 const known=Number.isFinite(totals?.today_seconds),total=known?Math.max(0,totals.today_seconds):null;
 const rows=members.map(m=>({id:m.id,name:m.nickname,seconds:Number.isFinite(m.today_seconds)?Math.max(0,m.today_seconds):null,self:m.id===profileId}));
 rows.sort((a,b)=>Number(b.self)-Number(a.self));
 const accounted=rows.reduce((sum,m)=>sum+(m.seconds||0),0),other=known?Math.max(0,total-accounted):null;
 const own=rows.find(m=>m.self)?.seconds??null;
 return {known,total,own,other,rows:rows.map(m=>({...m,share:known&&total>0&&m.seconds!==null?Math.min(100,m.seconds/total*100):0})),participants:Number.isInteger(totals?.today_members)?Math.max(0,totals.today_members):other===0?rows.filter(m=>m.seconds>0).length:null,inconsistent:known&&accounted>total};
}

export function recentRoomActivities(items=[],now) {
 const priority=a=>['focus','break'].includes(a.phase)?0:a.phase==='ended'?1:2;
 return items.filter(a=>a.status!=='cancelled').map(a=>({...a,phase:activityPhase(a,now)}))
  .sort((a,b)=>priority(a)-priority(b)||(a.phase==='scheduled'&&b.phase==='scheduled'?a.startsAt-b.startsAt:(b.endedAt||b.startedAt||b.startsAt)-(a.endedAt||a.startedAt||a.startsAt))).slice(0,3);
}

export function progressNextStep({timer,roomId,notice,canParticipate=true}) {
 if(!canParticipate)return {action:'access',label:'Review room access',description:'Your records are kept. Review access before starting another session.'};
 if(timer&&roomId&&(timer.room_id||timer.roomId)===roomId&&timer.status==='running')return {action:'study',label:'Return to your study',description:'Your room timer is running. Continue from your own place.'};
 if(notice?.action==='result')return {...notice,action:'result',label:'Add your study result',description:'Open your activity to record a shared outcome and an optional private reflection.'};
 if(notice?.state==='scheduled')return {...notice,action:'activity',label:'View your next activity',description:notice.description};
 return {action:'study',label:'Start studying',description:'Choose one small task, then start your own timer in Study together.'};
}

export function groupGoalEstimate(people,minutes) {
 const n=Number(people),m=Number(minutes);
 if(!Number.isInteger(n)||n<1||n>24)throw Error('Choose 1–24 people.');
 if(!Number.isInteger(m)||m<5||m>120)throw Error('Choose 5–120 study minutes per person.');
 return {people:n,minutes:m,total:n*m};
}
