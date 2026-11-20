import {ArrowLeft,ArrowRight,DownloadSimple} from '@phosphor-icons/react';
import {weekStart} from '../lib/community-model.mjs';
import {dayPlus,groupReportCSV} from '../lib/group-advanced.mjs';
import {weeklyDuration,weeklyReportView,weekDate,weekRange,sampleWeeklyReport} from '../lib/weekly-report.mjs';
import {WeeklyReportActions,WeeklyReportGuide} from './WeeklyReportGuide.jsx';
import './weekly-report.css';
const chartTime=n=>n>=60?Math.floor(n/60)+' min'+(n%60?' '+n%60+' sec':''):weeklyDuration(n);

export function WeeklyReport({report,now,week='',onWeek,busy=false,example=false,onStudy,onPlan,onActivities}){
 const current=weekStart(now),shown=week||current,weeks=Array.from({length:12},(_,i)=>dayPlus(current,-7*i)),index=weeks.indexOf(shown);
 const model=report?weeklyReportView(report,now):null;
 function download(){
  const url=URL.createObjectURL(new Blob([groupReportCSV(report)],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');
  a.href=url;a.download='group-week-'+shown+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 return <section className="weekly-report" aria-label={example?'Example weekly report':'Weekly report'}>
  <header className="wr-heading"><div className="wr-title"><h2>Weekly report</h2>{example&&<span className="wr-badge">Example data</span>}</div>
   <div className="wr-controls">{example?<p className="wr-example-week">{weekRange(shown)}</p>:<div className="wr-week-control"><button type="button" className="button" aria-label="Previous report week" disabled={busy||index<0||index===11} onClick={()=>onWeek(weeks[index+1])}><ArrowLeft size={17}/></button><select aria-label="Report week" value={shown} disabled={busy} onChange={e=>onWeek(e.target.value)}>{weeks.map(w=><option value={w} key={w}>{w===current?'This week · ':''}{weekRange(w)}</option>)}</select><button type="button" className="button" aria-label="Next report week" disabled={busy||index<=0} onClick={()=>onWeek(weeks[index-1])}><ArrowRight size={17}/></button></div>}
   <span className="wr-badge">{report?.snapshot?'Retained snapshot':shown===current?'In progress':'Completed week'}</span>{!example&&<p className="wr-range">{weekRange(shown)}</p>}</div>
   {!example&&<button type="button" className="button wr-export" disabled={!report||busy} onClick={download}><DownloadSimple size={17}/>Download CSV</button>}
  </header>
  {report?.snapshot&&<p className="wr-notice">Snapshot as of {new Date(report.asOf).toLocaleString('en-GB',{timeZone:'UTC'})} · UTC. Later study is not included.</p>}
  {example&&<p className="wr-example-notice">Illustrative sample, not this room’s records. The current report and CSV export require eligible advanced access.</p>}
  {!report?<div className="wr-empty" role="status"><h3>No retained report for this week</h3><p>Choose a different week to check saved reports. A missing report does not mean there was no study.</p></div>:<>
   <dl className="wr-metrics">{[[weeklyDuration(report.seconds),'Recorded together'],[report.members,'Studying members'],[model.activeDays,'Study days'],[report.activityCount,'Activities attended']].map(([value,label])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
   {model.empty&&<div className="wr-empty" role="status"><h3>{report.snapshot?'No study in this saved report':'No confirmed room study this week yet'}</h3><p>{report.snapshot?'This snapshot contains zero recorded time.':'Your group’s confirmed timer minutes will appear here. Online presence, reservations and submitted results do not add minutes.'}</p>{!report.snapshot&&!example&&(onStudy||onPlan)&&<div className="wr-empty-actions">{onStudy&&<button type="button" className="button wr-primary" onClick={onStudy}>Go to Study together<ArrowRight size={16}/></button>}{onPlan&&<button type="button" className="button" onClick={onPlan}>Plan a session</button>}</div>}</div>}
   <div className="wr-analysis"><div className="wr-chart" role="img" aria-label={'Daily recorded study: '+model.days.map(d=>d.day+' '+(d.future?'not yet reported':weeklyDuration(d.seconds))).join(', ')}>
    <div className="wr-axis" aria-hidden="true">{model.scale.ticks.map(n=><span key={n}>{chartTime(n)}</span>)}</div>
    <div className="wr-plot"><div className="wr-grid" aria-hidden="true">{model.scale.ticks.map(n=><i key={n}/>)}</div><div className="wr-bars">{model.days.map(d=><div className="wr-day" data-today={d.today||undefined} key={d.day}><div className="wr-bar-space" style={{'--bar-height':(100*d.seconds/model.scale.max)+'%'}}><span className="wr-bar-value">{d.future?'—':chartTime(d.seconds)}</span>{d.seconds>0&&<i className="wr-bar" style={{height:(100*d.seconds/model.scale.max)+'%',backgroundColor:d.colour}}/>}</div><span className="wr-day-label">{weekDate(d.day,{weekday:'short',day:'numeric'})}{d.today&&<strong>Today</strong>}</span></div>)}</div></div>
   </div><aside className="wr-review" aria-label="Week in review"><h3>Week in review</h3>{model.empty?<p>There is no recorded study to summarise yet.</p>:<ul><li>{model.activeDays} {model.activeDays===1?'day':'days'} with recorded study.</li><li>{model.busiest.length===1?`${weekDate(model.busiest[0].day,{weekday:'long'})} was busiest (${weeklyDuration(model.busiest[0].seconds)}).`:`${model.busiest.length} days shared the highest total (${weeklyDuration(model.busiest[0].seconds)}).`}</li><li>{report.activityCount} {report.activityCount===1?'activity had':'activities had'} attendance.</li></ul>}{model.current&&!report.snapshot&&<p className="wr-review-note">This week is still in progress. Future dates show a dash.</p>}</aside></div>
   <div className="wr-table-wrap"><table className="wr-daily"><caption>Daily totals</caption><thead><tr><th scope="col">Date · UTC</th><th scope="col">Recorded time</th><th scope="col">Members</th></tr></thead><tbody>{model.days.map(d=><tr key={d.day} data-today={d.today||undefined}><th scope="row"><time dateTime={d.day}>{weekDate(d.day,{weekday:'short',day:'numeric',month:'short'})}</time>{d.today&&<small>Today</small>}</th><td>{d.future?'—':weeklyDuration(d.seconds)}</td><td>{d.future?'—':d.members}</td></tr>)}</tbody></table></div>
   {report.activities?.length>0&&<section className="wr-attendance" aria-label="Activity attendance"><h3>Activity attendance</h3><ul>{report.activities.map(a=><li key={a.id}><span>{a.title}</span><time>{new Date(a.started_at||a.starts_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'})}</time><strong>{a.attended} attended</strong></li>)}</ul></section>}
  </>}
  <WeeklyReportActions onStudy={onStudy} onPlan={onPlan} onActivities={onActivities}/>
  <WeeklyReportGuide idPrefix={example?'weekly-example':'weekly-report'}/>
 </section>;
}

export function WeeklyReportPreview({selected,canTry,busy,onPreview,onRetained,onStudy,onPlan,onActivities}){
 const now=Number.isFinite(selected?.serverNow)?selected.serverNow:Date.now(),weeks=selected?.retainedReportWeeks||[];
 return <div className="wr-preview"><section className="wr-access" aria-label="Weekly report access"><div><h3>See what your group’s week adds up to</h3><p>This room’s advanced reports are not active. The example below shows what a weekly report includes.</p></div><div className="wr-access-actions"><div className="wr-access-buttons">{canTry&&<button type="button" className="button wr-primary" disabled={busy} onClick={()=>onPreview?.(true)}>Try advanced groups<ArrowRight size={17}/></button>}{weeks.length>0&&<button type="button" className="text-button" onClick={onRetained}>View retained weekly reports<ArrowRight size={16}/></button>}</div>{canTry?<span>Optional free preview · no payment or subscription.</span>:<p>{selected?.owner?'Advanced access is not currently available. Your room records are kept.':'The room owner controls advanced access.'}</p>}{weeks.length===0&&<span>No retained weekly reports yet.</span>}</div></section><WeeklyReport report={sampleWeeklyReport(now)} now={now} example onStudy={onStudy} onPlan={onPlan} onActivities={onActivities}/></div>;
}
