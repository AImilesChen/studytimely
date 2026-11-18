import {calendarKind} from './planning-calendar.mjs';

// Task type and task status are independent: completing a review keeps it a review.
export function studyGroupTypes(group){
 const counts=new Map();
 for(const row of group.rows){if(row.state==='omitted')continue;const kind=calendarKind({prep:row.prep});counts.set(kind,(counts.get(kind)||0)+1);}
 return ['study','review','mock','corrections'].filter(kind=>counts.has(kind)).map(kind=>({kind,count:counts.get(kind)}));
}

export const studyTaskLabels={omitted:'Left out',complete:'Completed',active:'In progress',feedback:'Needs feedback',scheduled:'Scheduled',replan:'Needs a new time',unscheduled:'Not arranged'};

export function studyTaskPage(groups,{query='',page=0}={}){
 const q=query.trim().toLocaleLowerCase(),matches=groups.filter(g=>!q||[g.title,...g.rows.flatMap(r=>[r.task.title,r.task.subject])].join(' ').toLocaleLowerCase().includes(q));
 const pages=Math.max(1,Math.ceil(matches.length/5)),current=Math.max(0,Math.min(pages-1,Number.isInteger(page)?page:0));
 return {rows:matches.slice(current*5,current*5+5),page:current,pages,total:matches.length,start:matches.length?current*5+1:0,end:Math.min(matches.length,(current+1)*5)};
}

export function preferredStudyTask(group,taskId='',phase='all'){
 if(!group)return null;
 const selected=group.rows.find(r=>r.task.id===taskId);if(selected)return selected;
 const matching=phase==='all'?group.rows:group.rows.filter(r=>phase==='mock'?['mock','reflect'].includes(r.prep?.stage):r.prep?.stage===phase),rows=matching.length?matching:group.rows;
 return rows.find(r=>r.state==='active')||rows.find(r=>r.state==='feedback')||rows.filter(r=>!r.task.done&&r.state!=='omitted'&&r.next).sort((a,b)=>a.next.startAt-b.next.startAt)[0]||rows.find(r=>!r.task.done&&r.state!=='omitted')||rows[0]||null;
}

export function studyDetailTitle(row,group){
 const stage=row.prep?.stage,topic=group.topic?.title;
 const original=stage==='learn'?topic:stage==='review'&&topic?'Review: '+topic:stage==='mock'?'Timed practice paper':stage==='reflect'?'Check the paper and review mistakes':null;
 // Preserve explicitly edited names; shorten only automatically generated repetition.
 if(!original||row.task.title!==original)return row.task.title;
 return {learn:'Study new content',review:'Review '+(row.prep.round||1),mock:'Mock exam',reflect:'Corrections'}[stage];
}

export function studyTaskAction(row,{paused=false,demo=false,now=Infinity}={}){
 if(!row)return {type:'none',label:'No task included'};
 if(row.state==='omitted')return {type:'none',label:'Left out'};
 if(row.task.done)return {type:'none',label:'Completed'};
 if(row.state==='active')return {type:'session',label:'Continue session'};
 if(row.state==='feedback')return {type:'session',label:'Save feedback'};
 if(paused)return {type:'none',label:'Preparation paused'};
 if(row.next)return {type:'start',label:demo?'Simulate start':row.next.startAt>now?'Start early':'Start learning'};
 if(row.remaining===null||row.remaining<=0)return {type:'edit',label:'Update remaining work'};
 return {type:'arrange',label:'Arrange study time'};
}

export function studyGroupCaption(group){
 if(!group.rows.length)return 'No study task included';
 if(group.complete)return `${group.done} task${group.done===1?'':'s'} completed`;
 if(!group.total)return 'Tasks left out';
 const active=group.rows.filter(r=>r.state!=='omitted'),reviews=active.filter(r=>calendarKind({prep:r.prep})==='review').length,study=active.some(r=>calendarKind({prep:r.prep})==='study');
 if(group.kind==='mock')return 'Mock exam + corrections';
 return [study?'Study':'',reviews?`${reviews} review${reviews===1?'':'s'}`:''].filter(Boolean).join(' + ')||'Study task';
}
