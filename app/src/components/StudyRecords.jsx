import {ArrowRight,ChartLine,Play,Plus,ArrowCounterClockwise} from '@phosphor-icons/react';
import {duration,zonedDay} from '../lib/study-analysis.mjs';
import {chartColour} from '../lib/analytics-chart.mjs';

export function RecordSubjectFilter({history,value,onChange,onAdd,disabled=false}){
 const empty=!history.subjects.length&&!history.hasUnlabelled;
 return <div className="sa-subject-filter"><label><span className="sr-only">Subject</span><select aria-label="Subject" value={value} disabled={empty} onChange={e=>onChange(e.target.value)}><option value="">{empty?'No subjects yet':'All subjects'}</option>{history.hasUnlabelled&&<option value="none">Unlabelled</option>}{history.subjects.map(s=><option key={s} value={s}>{s}</option>)}</select></label><button className="text-button" disabled={disabled} onClick={onAdd}><Plus size={15} aria-hidden="true"/>Add subject</button></div>;
}

export function RecordEmptyState({kind,onClear,onHistory,onExample,navigate}){
 const first=kind==='first',filtered=kind==='filtered';
 return <section className="sa-record-empty" aria-label="Learning records status"><i><ChartLine size={26} aria-hidden="true"/></i><div><h2>{first?'Your first learning record starts here':filtered?'No records match these filters':'No learning records in this date range'}</h2><p>{first?'Save a Study, Focus or Pomodoro learning session to start your history.':filtered?'Try all subjects and modes, or open your full history.':'Your saved history is kept. Open all history to find another study day.'}</p></div><div className="sa-empty-actions">{first?<><a className="button primary" href="/" onClick={navigate}><Play size={16} weight="fill"/>Start studying</a><button className="text-button" onClick={onExample}>Explore example</button></>:<>{filtered&&<button className="button" onClick={onClear}><ArrowCounterClockwise size={16}/>Clear filters</button>}<button className={filtered?'text-button':'button'} onClick={onHistory}>View all history <ArrowRight size={16}/></button></>}</div></section>;
}

const shortDateLabel=date=>new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
const dateLabel=date=>new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
function interval(row,date,zone){
 const a=row.segments[0][0],b=row.segments.at(-1)[1],precise=row.seconds<60||a%60000!==0||b%60000!==0,offset=new Intl.DateTimeFormat('en',{timeZone:zone,timeZoneName:'shortOffset'}),zoneAt=at=>offset.formatToParts(at).find(p=>p.type==='timeZoneName').value,crosses=zoneAt(a)!==zoneAt(b),fmt=new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',...(precise?{second:'2-digit'}:{}),...(crosses?{timeZoneName:'shortOffset'}:{}),hourCycle:'h23'});
 const end=zonedDay(b,zone)!==date?(precise?'24:00:00':'24:00')+(crosses?' '+zoneAt(b):''):fmt.format(b);
 return `${fmt.format(a)} – ${end}`;
}
const modeLabel=mode=>mode==='pomodoro'?'Pomodoro':mode==='focus'?'Focus':'Study';

export function StudyRecordList({days,onDetails,onMore}){
 return <div className="sa-record-days">{days.groups.map(day=><section className="sa-record-day" key={day.date} aria-label={dateLabel(day.date)}><header><div><h3><span className="sa-record-date-full">{dateLabel(day.date)}</span><span className="sa-record-date-short">{shortDateLabel(day.date)}</span></h3><span>{day.count} session{day.count===1?'':'s'}</span></div><strong>{duration(day.total)}</strong></header><div className="sa-record-columns" aria-hidden="true"><span>Subject / task</span><span>Recorded window</span><span>Mode</span><span>Duration</span><span/></div><ul>{day.records.map(row=><li key={row.session.id}><div className="sa-record-identity"><i style={{background:chartColour(row.session.subject)}} aria-hidden="true"/><div><h4>{row.session.subject||'Unlabelled'}</h4>{(row.session.taskTitle||row.session.chapterTitle)&&<p>{row.session.taskTitle||row.session.chapterTitle}</p>}</div></div><span className="sa-record-window" title="First to last recorded interval on this date. Pauses are excluded from duration.">{interval(row,day.date,days.zone)}</span><span className="sa-record-mode">{modeLabel(row.session.mode)}</span><strong className="sa-record-duration">{duration(row.seconds)}</strong><button className="text-button" aria-label={`View ${row.session.subject||'unlabelled'} session details for ${day.date}`} onClick={()=>onDetails(row)}>Details <ArrowRight size={14}/></button></li>)}</ul>{day.records.length<day.count&&<p className="sa-note">Showing {day.records.length} of {day.count} sessions on this day. The daily total includes all matches.</p>}</section>)}{days.shownEntries<days.totalEntries&&<div className="sa-record-more"><p className="sa-note">Showing {days.shownEntries} of {days.totalEntries} daily entries. CSV includes every matched session.</p><button className="button" onClick={onMore}>Show more records <ArrowRight size={16}/></button></div>}</div>;
}
