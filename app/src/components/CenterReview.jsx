import {useEffect,useMemo,useRef,useState} from 'react';
import {analysisRange,studyAnalysis,newReview,analysisFingerprint,duration} from '../lib/study-analysis.mjs';
import {dayKey} from '../lib/model.mjs';
import {shiftPlannerDay} from '../lib/planner.mjs';

const notes=[['good','What went well?','What helped you get started or understand a topic?'],['difficulty','What got in the way?','A difficult topic, an unrealistic estimate, or something else?'],['next','What will you change next time?','Choose one small adjustment you can act on.']];
export function CenterReview({store,source,report,now,access,demo=false,datesPending=false,onDirty}){
 const [selected,setSelected]=useState(''),[draft,setDraft]=useState(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[issue,setIssue]=useState(''),[taskNotice,setTaskNotice]=useState(''),[taskIssue,setTaskIssue]=useState('');
 const saving=useRef(false),allowLeave=useRef(false);
 const saved=useMemo(()=>(source.workspace?.learning?.reviews||[]).filter(r=>!r.deletedAt).sort((a,b)=>b.updatedAt-a.updatedAt),[source.workspace?.learning?.reviews]);
 const savedReview=saved.find(r=>r.id===selected),eligible=['week','last-week','month','last-month'].includes(report.range.period);
 const fingerprint=useMemo(()=>analysisFingerprint(source),[source]);
 const fresh=useMemo(()=>access.active&&eligible?newReview(report,source,report.range.period.includes('month')?'month':'week',now):null,[report,source,access.active,eligible,now]);
 const view=draft?.review||(selected?savedReview:fresh),dirty=!!draft;
 const blocked=busy||demo||!access.active||store.hasPending||datesPending;
 useEffect(()=>{onDirty?.(dirty);return()=>onDirty?.(false);},[dirty,onDirty]);
 useEffect(()=>{
  allowLeave.current=false;
  const warn=e=>{if(dirty&&!allowLeave.current){e.preventDefault();e.returnValue='';}};
  const leave=e=>{const a=e.target.closest?.('a[href]');if(!dirty||!a||a.target==='_blank'||a.download||e.metaKey||e.ctrlKey)return;const url=new URL(a.href,location.href);if(url.origin===location.origin&&url.pathname===location.pathname)return;if(!window.confirm('Discard unsaved review changes?')){e.preventDefault();e.stopImmediatePropagation();}else allowLeave.current=true;};
  window.addEventListener('beforeunload',warn);document.addEventListener('click',leave,true);return()=>{window.removeEventListener('beforeunload',warn);document.removeEventListener('click',leave,true);};
 },[dirty]);
 function choose(id){if(dirty&&!window.confirm('Discard unsaved review changes?'))return;setSelected(id);setDraft(null);setIssue('');setNotice('');}
 function edit(key,value){if(blocked||!view)return;setDraft(current=>({review:{...(current?.review||view),[key]:value},itemId:current?.itemId??savedReview?.id,expectedUpdatedAt:current?.expectedUpdatedAt??savedReview?.updatedAt}));setNotice('');}
 async function save(){
  if(blocked||saving.current||!view||(selected&&!savedReview&&!draft))return;
  saving.current=true;setBusy(true);setIssue('');setNotice('');
  try{
   const itemId=draft?.itemId||savedReview?.id,expectedUpdatedAt=draft?.expectedUpdatedAt??savedReview?.updatedAt;
   const result=await store.command('review-save',{...(itemId?{itemId,expectedUpdatedAt}:{}),review:view});if(!result)throw Error('Review not saved. It may have changed in another tab. Your draft is still here.');
   const next=itemId?result.state.workspace.learning.reviews.find(r=>r.id===itemId):result.state.workspace.learning.reviews.at(-1);setSelected(next.id);setDraft(null);setNotice('Review saved privately. Sync follows your existing account settings.');
  }catch(e){setIssue(e.message||'The review could not be saved. Your draft is still here.');}
  finally{saving.current=false;setBusy(false);}
 }
 function updateSnapshot(){
  if(blocked||!view)return;
  try{const range=analysisRange({period:'custom',start:view.start,end:view.end,zone:view.zone,now}),analysis=studyAnalysis(source,range,{subject:view.subject,mode:view.mode});
   setDraft({review:{...newReview(analysis,source,view.period,now),good:view.good,difficulty:view.difficulty,next:view.next},itemId:draft?.itemId||savedReview?.id,expectedUpdatedAt:draft?.expectedUpdatedAt??savedReview?.updatedAt});setNotice('Updated snapshot ready. Save the review to keep it.');
  }catch(e){setIssue(e.message||'The snapshot could not be updated. Your saved review is unchanged.');}
 }
 async function addTask(e){
  e.preventDefault();if(saving.current||demo||store.hasPending)return;const form=e.currentTarget,f=new FormData(form);saving.current=true;setBusy(true);setTaskIssue('');setTaskNotice('');
  try{const result=await store.command('task-save',{title:String(f.get('title')||'').trim(),subject:view?.subject==='none'?'':view?.subject||'',plannedDate:String(f.get('plannedDate')||''),dueDate:'',estimateMinutes:Number(f.get('minutes')||0),priority:'normal',done:false});if(!result)throw Error('Task not saved. Check the storage message and try again.');setTaskNotice('Next step added to your tasks. No study time was created.');form.reset();}
  catch(e){setTaskIssue(e.message||'Task not saved. Your draft has been kept.');}
  finally{saving.current=false;setBusy(false);}
 }
 const moved=view&&(view.start!==report.range.start||view.end!==report.range.end||view.zone!==report.range.zone||view.subject!==report.subject||view.mode!==report.mode);
 return <section className="cp-review" aria-labelledby="cp-review-title">
  <header className="cp-section-heading"><div className="cp-review-intro"><img src="/design-assets/chat-stickers/encourage-cat-v2.webp" width="256" height="256" alt="" loading="lazy"/><div><p className="cp-eyebrow">KEEP THE GOOD BITS</p><h2 id="cp-review-title">A moment to look back</h2><p>Keep what helped. Choose one small change for next time.</p></div></div><label className="cp-field"><span>Saved review</span><select value={selected} onChange={e=>choose(e.target.value)} disabled={busy}><option value="">New review from selected dates</option>{selected&&!savedReview&&<option value={selected}>Review no longer available</option>}{saved.map(r=><option key={r.id} value={r.id}>{r.start} – {r.end}{r.subject?' · '+(r.subject==='none'?'Unlabelled':r.subject):''}</option>)}</select></label></header>
  {demo?<p className="cp-note">Example view. Reflections and next steps are not saved in this mode.</p>:access.status==='loading'?<p role="status" className="cp-note">Checking review availability…</p>:access.status==='error'?<p className="cp-note">Review availability could not be checked. Your basic statistics and records still work. <button className="button" onClick={access.retry}>Retry availability</button></p>:!access.active?<p className="cp-note">New snapshots and review editing require eligible advanced analytics access. Available saved reviews remain readable here.</p>:!eligible&&!selected&&!draft?<p className="cp-note">Choose This week, Last week, This month or Last month above to write a review. Custom-date statistics and CSV remain available.</p>:null}
  {view&&<>
   <p className="cp-review-range">Review snapshot: {view.start} – {view.end} · {view.zone} · {view.subject==='none'?'Unlabelled':view.subject||'All subjects'}{view.mode?' · '+view.mode:''}</p>
   <div className="cp-review-summary"><span><strong>{duration(view.snapshot.total)}</strong> saved study</span><span><strong>{view.snapshot.activeDays}</strong> study days</span><span><strong>{view.snapshot.completed||0}</strong> known task completions</span></div>
   {moved&&<p className="cp-note">The filters above show a different view. This review keeps the dates and filters printed here. Choose New review to use the current selection.</p>}
   {view.fingerprint!==fingerprint&&<p className="cp-note">Records or plans have changed since this snapshot. Its saved figures have been kept. {access.active&&!demo&&<button className="button" disabled={blocked} onClick={updateSnapshot}>Update snapshot</button>}</p>}
  </>}
  <div className="cp-reflections">{notes.map(([key,label,placeholder])=><label className="cp-field" key={key}>{label}<textarea rows={3} maxLength={2000} value={view?.[key]||''} placeholder={placeholder} readOnly={blocked||!view} onChange={e=>edit(key,e.target.value)}/></label>)}</div>
  <div className="cp-review-actions"><button className="button primary" disabled={blocked||!view||(!!selected&&!dirty)} onClick={save}>{busy?'Saving…':selected?'Save review changes':'Save private review'}</button>{dirty&&<span className="cp-note">Unsaved review changes</span>}{selected&&!dirty&&view&&<span className="cp-note">Saved snapshot · notes and figures stay together</span>}</div>
  {notice&&<p className="cp-feedback" role="status">{notice}</p>}{issue&&<p className="field-error" role="alert">{issue}</p>}
  <form className="cp-next-step" aria-label="Plan a next step from this review" onSubmit={addTask}><h3><span className="cp-handwritten-emoji" aria-hidden="true">✏️</span> One next step</h3><p>Add a concrete task here when you know what to do next.</p><label className="cp-field cp-next-title">Study task<input name="title" required maxLength={140} key={selected||'new'} defaultValue="" placeholder="e.g. Practise five cell-transport questions" disabled={busy||demo||store.hasPending}/></label><label className="cp-field">Study day<input name="plannedDate" type="date" required defaultValue={shiftPlannerDay(dayKey(now),1)} disabled={busy||demo||store.hasPending}/></label><label className="cp-field">Planned minutes<input name="minutes" type="number" min="0" max="10080" step="1" placeholder="25" disabled={busy||demo||store.hasPending}/></label><button className="button" disabled={busy||demo||store.hasPending}>Add next step</button><p className="cp-note">Tasks use your device’s local calendar. Estimates and task completion do not add study minutes.</p>{taskNotice&&<p className="cp-feedback" role="status">{taskNotice}</p>}{taskIssue&&<p className="field-error" role="alert">{taskIssue}</p>}</form>
 </section>;
}
