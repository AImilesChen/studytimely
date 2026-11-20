import {utcDay,weekStart} from './community-model.mjs';
import {dayPlus} from './group-advanced.mjs';

export const WEEKDAY_COLOURS=['#38c7f3','#ffb547','#f36a97','#aa8cff','#b9e45b','#ff8359','#4ee2bd'];
export const weekDate=(day,options={})=>new Date(day+'T12:00:00Z').toLocaleDateString('en-GB',{timeZone:'UTC',...options});
export function weekRange(week){
 const end=dayPlus(week,6),sameMonth=week.slice(0,7)===end.slice(0,7),sameYear=week.slice(0,4)===end.slice(0,4);
 const start=sameMonth?String(Number(week.slice(8))):weekDate(week,{day:'numeric',month:'short',...(sameYear?{}:{year:'numeric'})});
 return `${start}${sameMonth?'–':' – '}${weekDate(end,{day:'numeric',month:'short',year:'numeric'})} · UTC`;
}
export function weeklyDuration(seconds){
 if(!Number.isFinite(seconds))return 'Not available';
 const n=Math.max(0,Math.floor(seconds));
 if(n<60)return n+' sec';
 if(n<3600)return Math.floor(n/60)+' min'+(n%60?' '+n%60+' sec':'');
 return Math.floor(n/3600)+'h '+String(Math.floor(n%3600/60)).padStart(2,'0')+'m';
}
export function reportScale(maximum){
 const unit=maximum>=60||maximum===0?60:1,target=maximum?maximum/unit/4:15;
 const power=10**Math.floor(Math.log10(target)),step=[1,1.5,2,2.5,3,5,10].find(n=>n*power>=target)*power*unit;
 return {max:step*4,ticks:Array.from({length:5},(_,i)=>(4-i)*step)};
}
export function weeklyReportView(report,now){
 const cutoff=utcDay(report.snapshot?report.asOf:now),today=utcDay(now);
 const days=report.days.map((d,i)=>({...d,colour:WEEKDAY_COLOURS[i],today:d.day===today,future:d.day>cutoff&&d.seconds===0}));
 const recorded=days.filter(d=>d.seconds>0),maximum=Math.max(0,...recorded.map(d=>d.seconds));
 return {days,activeDays:recorded.length,busiest:recorded.filter(d=>d.seconds===maximum),scale:reportScale(maximum),current:report.week===weekStart(now),empty:recorded.length===0,cutoff};
}
export function sampleWeeklyReport(now){
 const week=weekStart(now),today=utcDay(now),values=[3600,5400,1800,7200,3600,0,0];
 const days=values.map((seconds,i)=>({day:dayPlus(week,i),seconds:dayPlus(week,i)>today?0:seconds,members:dayPlus(week,i)>today||!seconds?0:i===2?1:2}));
 const active=days.filter(d=>d.seconds>0).length;
 return {week,end:dayPlus(week,6),asOf:now,days,seconds:days.reduce((n,d)=>n+d.seconds,0),members:active?2:0,activityCount:Math.min(3,active),activities:[]};
}
