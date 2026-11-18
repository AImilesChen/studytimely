const validMonth=value=>typeof value==='string'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(value)&&value>='1970-01';
const dateAt=day=>Date.parse(day+'T12:00:00Z');
const shiftDay=(day,offset)=>new Date(dateAt(day)+offset*86400000).toISOString().slice(0,10);
export function shiftCalendarMonth(month,offset){
 if(!validMonth(month)||!Number.isInteger(offset))throw Error('Choose a valid calendar month.');
 const [year,index]=month.split('-').map(Number),date=new Date(Date.UTC(year,index-1+offset,1));
 return date.toISOString().slice(0,7);
}
export function calendarMonthRange(month,today){
 if(!validMonth(month)||typeof today!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(today))throw Error('Choose a valid calendar month.');
 const start=month+'-01',[year,index]=month.split('-').map(Number),last=new Date(Date.UTC(year,index,0)).toISOString().slice(0,10);
 if(start>today)throw Error('Future months do not contain saved study records yet.');
 return {start,end:last>today?today:last,last};
}
export function buildStudyCalendar(report){
 const {start,end,today}=report.range,month=end.slice(0,7),bounds=calendarMonthRange(month,today),offset=(new Date(dateAt(bounds.start)).getUTCDay()+6)%7,days=Number(bounds.last.slice(-2)),size=Math.ceil((offset+days)/7)*7,first=shiftDay(bounds.start,-offset),values=new Map(report.series.map(d=>[d.date,d.seconds]));
 const cells=Array.from({length:size},(_,i)=>{const date=shiftDay(first,i),inMonth=date.startsWith(month),future=date>today,inRange=inMonth&&date>=start&&date<=end&&!future;return {date,day:Number(date.slice(-2)),inMonth,future,inRange,today:date===today,seconds:inRange?(values.get(date)||0):null};});
 const included=cells.filter(d=>d.inRange),max=Math.max(1,...included.map(d=>d.seconds));
 return {month,...bounds,cells,fullMonth:start===bounds.start&&end===bounds.end,total:included.reduce((n,d)=>n+d.seconds,0),activeDays:included.filter(d=>d.seconds>0).length,preferredDate:included.filter(d=>d.seconds>0).at(-1)?.date||included.at(-1)?.date||'',max};
}
export function calendarDuration(seconds){
 if(seconds===null)return '—';if(seconds===0)return '—';
 if(seconds<60)return `${Math.floor(seconds)}s`;
 const hours=Math.floor(seconds/3600),minutes=Math.floor(seconds%3600/60);
 return hours?`${hours}h${minutes?' '+minutes+'m':''}`:`${minutes}m`;
}
export function compactCalendarDuration(seconds){
 if(!seconds)return '—';if(seconds<3600)return calendarDuration(seconds);
 return `${Math.floor(seconds/3600)}h${seconds%3600?'+':''}`;
}
