import {zonedDay} from './study-analysis.mjs';
import {shiftPlannerDay} from './planner.mjs';

export function planningWhen(block,now,zone){
 if(!block)return '';
 const day=zonedDay(block.startAt,zone),today=zonedDay(now,zone),relative=day===today?'Today':day===shiftPlannerDay(today,1)?'Tomorrow':new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(day+'T12:00Z'));
 const time=at=>new Date(at).toLocaleTimeString('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit'});
 return `${relative} · ${time(block.startAt)}–${time(block.endAt)}`;
}

// Shared by Today and Plans. Finishing feedback takes precedence over new work.
export function planningNextAction(rows,now,{paused=false,demo=false}={}){
 const unfinished=rows.filter(r=>!r.task.done&&r.state!=='omitted');
 const session=kind=>{const row=unfinished.find(r=>r.state===kind);return row&&{kind,row,block:row.next,label:kind==='active'?'Continue session':'Save feedback',heading:kind==='active'?'In progress':'Ready for feedback'};};
 const existing=session('active')||session('feedback');if(existing)return existing;
 if(paused)return {kind:'paused',label:'Preparation paused',heading:'Preparation paused'};
 const eligible=unfinished.filter(r=>!r.paused),current=eligible.filter(r=>r.next&&r.next.startAt<=now&&r.next.endAt>now).sort((a,b)=>a.next.startAt-b.next.startAt)[0];
 if(current)return {kind:'ready',row:current,block:current.next,label:demo?'Simulate start':'Start learning',heading:'Ready to study'};
 const missed=eligible.find(r=>r.state==='replan'||r.missed?.length&&(r.remaining===null||r.upcoming.reduce((n,b)=>n+(b.endAt-b.startAt)/60000,0)<r.remaining));
 if(missed)return {kind:'replan',row:missed,block:missed.missed?.at(-1),label:'Preview new times',heading:'A study time was missed'};
 const future=eligible.filter(r=>r.next?.startAt>now).sort((a,b)=>a.next.startAt-b.next.startAt)[0];
 if(future)return {kind:'future',row:future,block:future.next,label:'View arrangement',heading:'Next learning session'};
 if(eligible.length)return {kind:'arrange',row:eligible[0],label:eligible[0].remaining===null?'Add time estimate':'Arrange study',heading:'Give this task a study time'};
 if(unfinished.length)return {kind:'paused',label:'Preparation paused',heading:'Preparation paused'};
 if(rows.some(r=>r.state!=='omitted'))return {kind:'complete',label:'View learning records',heading:'Your plan is complete'};
 return {kind:rows.length?'excluded':'empty',label:rows.length?'Choose tasks':'Add first task',heading:rows.length?'No tasks included':'Break this goal into small tasks'};
}
