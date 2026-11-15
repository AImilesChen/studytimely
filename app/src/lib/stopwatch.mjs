import {elapsedMs,MAX_RUN,formatTime} from './model.mjs';

export function stopwatchTime(ms,precision=2){const whole=Math.max(0,Math.min(MAX_RUN,Math.floor(ms||0)));return formatTime(whole/1000).join(':')+(precision?'.'+String(whole%1000).padStart(3,'0').slice(0,precision):'');}
export function stopwatchReport(timer,now){
 const laps=timer?.mode==='stopwatch'?timer.laps.map(l=>({...l})):[],completedMs=laps.at(-1)?.totalMs||0;
 const totalMs=timer?.mode==='stopwatch'?Math.max(completedMs,Math.floor(elapsedMs(timer,now))):0,times=laps.map(l=>l.splitMs);
 return {totalMs,laps,completedMs,currentMs:Math.max(0,totalMs-completedMs),count:laps.length,averageMs:times.length?Math.floor(completedMs/times.length):null,fastestMs:times.length?times.reduce((a,b)=>Math.min(a,b)):null,slowestMs:times.length?times.reduce((a,b)=>Math.max(a,b)):null};
}
// Exports are a paused snapshot, not a live read of a moving clock.
export function stopwatchExport(timer,now,kind='text'){
 if(timer?.mode!=='stopwatch'||!['paused','completed'].includes(timer.status))throw Error('Pause the stopwatch before exporting a stable result.');
 const r=stopwatchReport(timer,now);if(!r.totalMs)throw Error('Record some elapsed time before exporting.');
 const rows=r.laps.map(l=>[String(l.number),'Completed lap',stopwatchTime(l.splitMs,3),stopwatchTime(l.totalMs,3),String(l.splitMs),String(l.totalMs)]);
 if(r.currentMs>0)rows.push(['','Unfinished segment',stopwatchTime(r.currentMs,3),stopwatchTime(r.totalMs,3),String(r.currentMs),String(r.totalMs)]);
 if(kind==='csv')return '\uFEFF'+[['Lap','Type','Lap time','Total time','Lap milliseconds','Total milliseconds'],...rows].map(row=>row.join(',')).join('\r\n')+'\r\n';
 return ['StudyTimely stopwatch result',`Total elapsed: ${stopwatchTime(r.totalMs,3)}`,`Completed laps: ${r.count}`,`Average completed lap: ${r.averageMs===null?'—':stopwatchTime(r.averageMs,3)}`,...rows.map(row=>`${row[0]?'Lap '+row[0]:row[1]}: ${row[2]} | Total ${row[3]}`),'Pauses excluded. Unfinished segment excluded from lap statistics.','General timing only; no study or leaderboard credit.'].join('\n');
}
