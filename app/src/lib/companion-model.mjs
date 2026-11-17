export const INTERACTIONS=Object.freeze([
 {id:'tap',label:'Gentle tap',received:'gave you a gentle tap',icon:'tap'},
 {id:'cheer',label:'Send encouragement',received:'is cheering you on',icon:'cheer'},
 {id:'celebrate',label:'Celebrate together',received:'sent a little celebration',icon:'celebrate'}
]);
export function companionState(member,at){
 if(!member||member.last_seen<=at-75000)return 'offline';
 if(member.timer_status==='running'&&member.timer_last_at>=at-90000&&member.timer_check_at>at)return 'studying';
 if(member.focus_state==='break')return 'break';
 if(member.timer_status==='check'||member.timer_status==='running')return 'check';
 return 'ready';
}
export const COMPANION_LABELS={studying:'Timer running',break:'Taking a break',ready:'Online · ready',offline:'Offline',check:'Check-in needed'};
export function companionSeconds(member,at){
 const saved=Math.max(0,Number(member.session_seconds)||0);
 return saved+(companionState(member,at)==='studying'?Math.max(0,Math.floor((Math.min(at,member.timer_check_at)-member.timer_last_at)/1000)):0);
}
