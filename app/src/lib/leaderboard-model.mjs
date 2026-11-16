import {utcDay,weekStart} from './community-model.mjs';
export const RANKING_PERIODS=[['today','Today'],['week','This week'],['streak','Current streak']];
export function rankingPeriod(value){return RANKING_PERIODS.some(([id])=>id===value)?value:'today';}
export function rankingWindow(value,at){
 const period=rankingPeriod(value),day=utcDay(at),midnight=Date.parse(day+'T00:00:00Z'),start=period==='week'?weekStart(at):period==='today'?day:null;
 return {period,day,start,end:day,serverNow:at,nextResetAt:period==='week'?Date.parse(start+'T00:00:00Z')+7*86400000:midnight+86400000};
}
export function rankingDuration(seconds){
 const n=Math.max(0,Math.floor(Number(seconds)||0));if(n<60)return n?`${n} sec`:'0 min';
 const hours=Math.floor(n/3600),minutes=Math.floor(n%3600/60),rest=n%60;
 return [hours?`${hours}h`:null,minutes?`${minutes}m`:null,rest?`${rest}s`:null].filter(Boolean).join(' ');
}
export function rankingPage(rows,search='',page=1){
 const term=String(search).normalize('NFC').toLocaleLowerCase().trim();
 const filtered=rows.filter(r=>!term||r.nickname.normalize('NFC').toLocaleLowerCase().includes(term));
 const pages=Math.max(1,Math.ceil(filtered.length/20)),current=Math.max(1,Math.min(pages,page));
 return {rows:filtered.slice((current-1)*20,current*20),total:filtered.length,pages,page:current};
}
export function rankingStandings(rows,search='',page=1){
 const searching=!!String(search).trim();
 // The first three participants are already shown in the podium. Search still covers everyone.
 return {...rankingPage(searching?rows:rows.slice(3),search,page),searching};
}
