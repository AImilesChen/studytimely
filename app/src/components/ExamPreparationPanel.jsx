import {useState} from 'react';
import {ArrowRight,WarningCircle,ArrowCounterClockwise,GearSix,CalendarBlank} from '@phosphor-icons/react';
import {duration} from '../lib/study-analysis.mjs';
import {Dialog} from './Dialog.jsx';

// Only actionable problems belong in the main study flow.
export function ExamPreparationPanel({report,disabled,onArrange,onTime,navigate}){
 if(!report)return null;
 const {paused,shortfall,stale,overdue}=report;
 if(paused)return <section className="sp-prep-notice" aria-label="Preparation status"><WarningCircle size={19}/><div><strong>Preparation paused</strong><span>Your tasks and study records are kept.</span></div><a href="/exam-countdown" onClick={navigate}>Edit exam <ArrowRight size={14}/></a></section>;
 if(!shortfall&&!stale&&!overdue)return null;
 return <section className="sp-prep-notices" aria-label="Preparation status">{shortfall>0&&<div className="sp-prep-notice"><WarningCircle size={19}/><div><strong>{duration(shortfall*60)} more study time needed</strong><span>Shared exam workload before {report.exam.date}.</span></div><button className="text-button" disabled={disabled} onClick={onTime}>Adjust time</button></div>}{(stale||overdue)&&<div className="sp-prep-notice"><ArrowCounterClockwise size={19}/><div><strong>{overdue?'Some study times need updating':'Your plan changed'}</strong></div><button className="text-button" disabled={disabled} onClick={onArrange}>Preview changes <ArrowRight size={14}/></button></div>}</section>;
}

export function PreparationSettingsBody({report,disabled,issue,onArrange,onTime,onTopic,onExam}){
 const {prep,exam,paused,shortfall,required,available,phases}=report;
 return <div className="settings-body">
 <section className="sp-prep-settings-section"><h3>Study time budget</h3>{paused?<p>This exam is paused. Your tasks and records are kept.</p>:<><strong className="sp-prep-budget-total">{duration(required*60)} needed · {duration(available*60)} available</strong><p>Work due before {exam.date}, across exams due by that date. This shared budget is an estimate, not a guarantee that every task fits.</p>{shortfall>0&&<p className="field-error">{duration(shortfall*60)} short under your current settings.</p>}</>}<div className="sp-prep-settings-actions"><button className="button" disabled={disabled} onClick={onTime}>Available time</button><button className="text-button" disabled={disabled||paused} onClick={onArrange}>Preview updated schedule</button></div></section>
 <section className="sp-prep-settings-section"><h3>Topics &amp; familiarity</h3><p>{report.covered} / {report.total} topics previously studied or covered. Familiarity is your assessment; it does not complete tasks or create study time.</p>{prep.topics.filter(t=>!t.deletedAt).map(t=><label className="sp-prep-topic" key={t.id}><span>{t.title}</span><select value={t.confidence} disabled={disabled} aria-label={'Familiarity with '+t.title} onChange={e=>onTopic(t.id,e.target.value)}><option value="new">New to me</option><option value="weak">Needs practice</option><option value="confident">Familiar</option></select></label>)}{issue&&<p role="alert" className="field-error">{issue}</p>}</section>
 <details className="sp-prep-settings-outline"><summary>Review setup &amp; suggested phases</summary><p>{prep.rounds} review round{prep.rounds===1?'':'s'} · first interval {prep.gapDays} day{prep.gapDays===1?'':'s'}. Edit or leave out individual review and mock tasks from the study list.</p>{phases.map(p=><div key={p.id}><strong>{p.title}</strong><span>{p.start} → {p.end}</span></div>)}<p>These phase dates are suggestions; individual prerequisites and review gaps still apply.</p></details>
 <a className="text-button sp-prep-exam-link" href="/exam-countdown" onClick={onExam}><CalendarBlank size={16}/>Edit exam date <ArrowRight size={14}/></a>
 </div>;
}

export function ExamPreparationSettings({report,disabled,onArrange,onTime,onTopic,navigate}){
 const [open,setOpen]=useState(false),[issue,setIssue]=useState('');
 if(!report)return null;
 function leave(action){setOpen(false);action?.();}
 async function assess(id,value){setIssue('');try{const result=await onTopic(id,value);if(result===null)setIssue('Familiarity was not saved. Try again.');}catch(e){setIssue(e.message||'Familiarity was not saved. Try again.');}}
 return <><button className="button sp-preparation-settings-button" onClick={()=>{setIssue('');setOpen(true);}}><GearSix size={17}/>Preparation settings</button><Dialog open={open} title="Preparation settings" close={()=>setOpen(false)} className="sp-dialog sp-preparation-dialog">{open&&<PreparationSettingsBody {...{report,disabled,issue}} onTime={()=>leave(onTime)} onArrange={()=>leave(onArrange)} onTopic={assess} onExam={e=>{setOpen(false);navigate?.(e);}}/>}</Dialog></>;
}
