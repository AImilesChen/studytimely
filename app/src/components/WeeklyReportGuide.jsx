import {useState} from 'react';
import {ArrowRight,MagnifyingGlassPlus} from '@phosphor-icons/react';
import {Dialog} from './Dialog.jsx';
import './weekly-report-guide.css';

const steps=[
 {id:'week',title:'Choose a week',path:'Report week',fullPath:'Group progress → Weekly reports → Report week',image:'weekly-guide-select',alt:'Report week selector beside previous and next arrows',items:['Open Report week and choose one of the twelve available weeks.','Check the Monday–Sunday date range. All report dates use UTC.'],detail:'You can also move one week at a time with the arrows. In an illustrative example, the dates are read only.'},
 {id:'read',title:'Read your group’s progress',path:'Metrics → Daily trend',fullPath:'Weekly report → Metrics and daily trend',image:'weekly-guide-trend',alt:'Example weekly metrics, weekday bars and Week in review',items:['Check the four totals, then compare the daily bars.','Use Week in review to find active days and the busiest recorded day.'],detail:'Today also has an outline and a text label. Use the exact daily table when you need individual dates, time and member counts.'},
 {id:'export',title:'Keep a copy and plan ahead',path:'Download CSV',fullPath:'Weekly report header → Download CSV',image:'weekly-guide-select',alt:'Download CSV button in a real saved report header',items:['Choose Download CSV in the report header.','Save daily dates, minutes and member counts. Private notes stay separate.'],detail:'The file contains dates, recorded minutes and daily participating-member counts. It excludes private task text, reflections and study outside this room. Export requires an accessible real report.'}
];
const metrics=[
 ['Recorded together','All members’ confirmed room study time for the selected week.'],
 ['Studying members','Different people with recorded time. Each person counts once per week.'],
 ['Study days','Dates in this week with confirmed study time.'],
 ['Activities attended','Activities in this week with actual attendance.']
];
const questions=[
 {title:'Why is my report empty?',answer:'Only confirmed room timer time counts.',note:'Start your own timer in Study together. Breaks, online presence, bookings and result submissions add no minutes.',detail:'Check in when prompted. Personal study outside this room stays separate. A missing saved report does not mean there was no study.'},
 {title:'What does a dash mean?',answer:'A dash means not yet reported. Zero means no recorded time.',note:'Future dates and dates after a saved snapshot’s cutoff show a dash.',detail:'A retained snapshot states when it was saved and excludes later study. Zero applies only where the report contains a recorded figure for that date.'},
 {title:'Who can use weekly reports?',answer:'Current reports need eligible advanced room access.',note:'The optional free preview creates no payment or subscription. Available saved snapshots stay read only.',detail:'The room owner enables the preview when it is available. An illustrative example is never a room record and cannot be exported.'}
];

export function WeeklyReportActions({onStudy,onPlan,onActivities}){
 if(!onStudy&&!onPlan&&!onActivities)return null;
 return <section className="weekly-next" aria-label="Next steps after your weekly report"><h3>Turn your review into a next step</h3><p>Keep studying, arrange another session or record what you finished.</p><div>{[[onStudy,'🤓','Keep studying','Go to Study together','study','Open your own place. Start your timer when you are ready.'],[onPlan,'🐧','Make time together','Plan a session','plan','Choose a date and study length for your group.'],[onActivities,'🥳','Record an activity outcome','View study activities','review','Open your activity, then add what you finished.']].filter(([action])=>action).map(([action,emoji,title,label,tone,description])=><article key={label} data-action-tone={tone}><span className="weekly-next-emoji" aria-hidden="true">{emoji}</span><h4>{title}</h4><p>{description}</p><button type="button" className="button" onClick={action}>{label}<ArrowRight size={17}/></button></article>)}</div></section>;
}

function GuideScreenshot({step}){
 const src='/images/group-progress/'+step.image+'.jpg';
 return <span className="weekly-guide-shot" data-shot={step.id}>{step.id==='export'?<><span className="weekly-guide-crop" data-crop="header"><img src={src} alt={step.alt} width="785" height="889" loading="lazy"/></span><span className="weekly-guide-crop" data-crop="table"><img src={src} alt="Daily totals in the same saved example report" width="785" height="889" loading="lazy"/></span></>:<img src={src} alt={step.alt} width="785" height="889" loading="lazy"/>}</span>;
}

export function WeeklyReportGuide({idPrefix='weekly-report',publicGuide=false}){
 const [image,setImage]=useState(null);
 return <section className="weekly-guide" data-guide-mode={publicGuide?'public':'room'} aria-labelledby={idPrefix+'-guide-title'}>
  <header className="weekly-guide-heading"><h3 id={idPrefix+'-guide-title'}>How to use weekly study reports</h3><p>Choose a week, understand your progress and keep a copy.</p><span>Example screens. Your report shows your room’s own records.</span></header>
  <ol className="weekly-guide-steps">{steps.map((s,i)=><li key={s.id}><div className="weekly-guide-copy"><div className="weekly-guide-step"><span>0{i+1}</span><h4>{s.title}</h4></div><span className="weekly-guide-path">{s.path}</span><ul>{s.items.map(item=><li key={item}>{item}</li>)}</ul>{publicGuide&&<p className="weekly-guide-note">{s.detail}</p>}</div><button type="button" className="weekly-guide-image" onClick={()=>setImage(s)} aria-label={'Enlarge weekly example: '+s.title}><GuideScreenshot step={s}/><span className="weekly-guide-zoom"><MagnifyingGlassPlus size={15}/>View larger example</span></button></li>)}</ol>
  <section className="weekly-guide-metrics" aria-labelledby={idPrefix+'-metrics-title'}><h4 id={idPrefix+'-metrics-title'}>Metrics at a glance</h4><dl>{metrics.map(([label,text])=><div key={label}><dt>{label}</dt><dd>{text}</dd></div>)}</dl><p className="weekly-guide-member-example"><strong>Two people. Five study days.</strong><span>The same two people studying on five days still count as <strong>2 studying members.</strong></span></p></section>
  <section className="weekly-guide-answers" aria-labelledby={idPrefix+'-questions-title'}><h4 id={idPrefix+'-questions-title'}>A few things to know</h4>{questions.map(q=><article key={q.title}><h5>{q.title}</h5><div><p className="weekly-guide-answer-lead">{q.answer}</p><p>{q.note}</p>{publicGuide&&<p className="weekly-guide-note">{q.detail}</p>}</div></article>)}</section>
  {!publicGuide&&<a className="weekly-guide-more" href="/study-groups#group-weekly-reports" target="_blank" rel="noopener">Read the complete weekly report guide<ArrowRight size={16}/></a>}
  <Dialog open={!!image} title={image?'Weekly example: '+image.title:'Weekly report example'} close={()=>setImage(null)} className="weekly-guide-dialog" preserveScroll>{image&&<div className="weekly-guide-dialog-body"><p><strong>{image.fullPath}</strong></p><GuideScreenshot step={image}/><ul>{image.items.map(item=><li key={item}>{item}</li>)}</ul><p>{image.detail}</p><p>Viewing this example does not change your records.</p></div>}</Dialog>
 </section>;
}
