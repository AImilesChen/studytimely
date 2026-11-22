import {useEffect,useMemo,useRef,useState} from 'react';
import {accountRequest} from '../lib/sync.mjs';
import {weeklyInput,weeklyReview,weeklyStale} from '../lib/ai-weekly.mjs';
import {detailedWeeklyInput} from '../lib/ai-weekly-detailed.mjs';
import {DetailedReportContent,WeeklyPlanAdoption,WeeklyDetailedPreflight} from './DetailedWeeklyReport.jsx';
import {duration} from '../lib/study-analysis.mjs';
import {downloadWeeklyReport} from '../lib/ai-weekly-export.mjs';
import {weeklyReportFigures,weeklyReportOrigin,shortWeeklyEvidence} from '../lib/weekly-report-view.mjs';

const path='/api/learning/weekly-reports';
export function WeeklyReportFigures({facts}){
 const figures=weeklyReportFigures(facts);
 return <div className="weekly-figures"><figure className="weekly-daily"><figcaption>Daily saved time <small>{facts.partial?'Week so far':'Monday–Sunday'}</small></figcaption><div className="weekly-mini-bars">{figures.days.map(d=><div className="weekly-mini-day" key={d.date} aria-label={`${d.date}: ${d.value}`}><b>{d.value}</b><div className="weekly-mini-track" aria-hidden="true"><i style={{height:d.height+'%'}}/></div><span>{d.label}</span></div>)}</div></figure><figure className="weekly-subject-figure"><figcaption>Time by subject <small>{facts.shareNames?'Saved subject names':'Names kept private'}</small></figcaption>{figures.subjects.length?<ul>{figures.subjects.map(s=><li key={s.id}><span><strong>{s.name||'Unlabelled study'}</strong><b>{s.value}</b></span><div className="weekly-mini-share" aria-hidden="true"><i style={{width:s.share+'%'}}/></div></li>)}</ul>:<p>No saved subject time.</p>}</figure></div>;
}
export function AIReportContent({ai,onAction,canPlan=true,onDownload,onHTML,exporting='',planControls}){
 if(ai.version===2)return <DetailedReportContent {...{ai,onDownload,onHTML,exporting,planControls}} figures={<WeeklyReportFigures facts={ai.facts}/>}/>;
 const f=ai.facts,figures=weeklyReportFigures(f),origin=weeklyReportOrigin(ai);
 const observation=(rows,empty)=>rows.length?<ul className="weekly-observations">{rows.map((r,i)=><li key={i}><p>{r.text}</p><small>Based on: {r.evidence.map(k=>shortWeeklyEvidence(f,k)).join(' · ')}</small></li>)}</ul>:<p className="cp-note">{empty}</p>;
 return <article className="weekly-report-paper" aria-label="Saved AI weekly report"><header className="weekly-report-toolbar"><div><span className="weekly-report-type">AI weekly study report</span><span className="weekly-origin">{origin.badge}</span><h3>{figures.rangeLabel}</h3><p>{f.zone}{f.partial?' · This week so far':''} · {f.filter.subject==='selected'?'Selected subject':'All subjects'} · {f.filter.mode==='all'?'All study timers':f.filter.mode}</p></div>{onDownload&&<button className="button primary weekly-download" disabled={!!exporting} onClick={onDownload}>{exporting==='pdf'?'Preparing PDF…':'Download full report (PDF)'}</button>}</header><div className="weekly-download-explanation"><p>PDF includes every chart, analysis and suggestion shown here. No extra analysis; private reflections stay out.</p>{onHTML&&<button className="weekly-html-copy" disabled={!!exporting} onClick={onHTML}>HTML copy</button>}</div><p className="weekly-mobile-context">{f.zone}{f.partial?' · This week so far':''} · {f.filter.subject==='selected'?'Selected subject':'All subjects'} · {f.filter.mode==='all'?'All study timers':f.filter.mode}</p>
 <section className="weekly-glance"><h4 className="sr-only">Your week at a glance</h4><dl className="weekly-key-figures"><div><dt>Saved study</dt><dd>{duration(f.seconds)}</dd></div><div><dt>Study days</dt><dd>{f.activeDays}<small> / {f.days.length}</small></dd></div><div><dt>Saved sessions</dt><dd>{f.count}</dd></div></dl><p className="weekly-comparison">{figures.comparison}{f.previous?.count&&f.partial?' · equal elapsed time':''}</p><p className="weekly-summary">{ai.content.summary}</p></section>
 <WeeklyReportFigures facts={f}/>
 <div className="weekly-findings"><section><h4><span aria-hidden="true">🌻</span> Worth keeping</h4>{observation(ai.content.keep,'There is not enough recorded evidence to identify a stable practice yet.')}</section><section><h4><span aria-hidden="true">🧵</span> Room to adjust</h4>{observation(ai.content.adjust,'No specific adjustment is supported by this snapshot.')}</section></div>
 <section className="weekly-action-section"><h4><span aria-hidden="true">✏️</span> Small steps for next week</h4><table className="weekly-action-table"><caption className="sr-only">Suggestions to review before adding to your plan</caption><thead><tr><th scope="col">Next step</th><th scope="col">Estimate</th>{onAction&&<th scope="col">Plan</th>}</tr></thead><tbody>{ai.content.actions.map((a,i)=><tr key={i}><td><strong>{a.title}</strong><p>{a.why}</p></td><td>{a.minutes} min</td>{onAction&&<td><button className="button" type="button" disabled={!canPlan} onClick={()=>onAction(a)} aria-label={`Use this next step: ${a.title}`}>Use this next step</button></td>}</tr>)}</tbody></table></section>
 <footer><p>From saved study only; time is not a measure of attention, grades or understanding. Check suggestions before planning them. Personal reflections are excluded from downloaded reports.</p><span>{origin.example?'Example prepared':'Generated'} {new Date(ai.generatedAt).toLocaleDateString()} · {origin.attribution}</span></footer></article>;
}
export function WeeklyReportGuide(){
 const items=[['Your week at a glance','See the decisions worth your attention, with the records behind them.'],['Goals and actual study','Compare saved study with the target known at the start of the week. Missing targets stay unknown.'],['Time by subject','Read subject allocation alongside upcoming exam dates, without invented mastery scores.'],['Plan execution','Check the original plan, later additions and completed tasks with matching estimates and saved effort.'],['What fits next','Compare remaining work and deadlines with entered availability, breaks and a buffer.'],['A proposed next step','Review dated sessions, work left out and a fallback before confirming anything in your planner.'],['Follow-through','See what happened to explicitly adopted tasks and compare four equivalent weekly windows.'],['Evidence and limits','Know which conclusions have support and what information would improve your next report.']];
 return <section className="weekly-guide" aria-labelledby="weekly-guide-title"><div className="weekly-guide-intro"><span className="weekly-margin-note">Before you generate</span><h3 id="weekly-guide-title">What will your report help you do?</h3><p>Turn recorded study into a realistic next-week plan. Your eight-part report combines calculated tables and charts with AI interpretation. A limited-evidence report clearly identifies missing analyses.</p><p>Worth keeping, room to adjust and a next step you can use - supported by your records. The downloaded report contains the same complete analysis you can read here.</p><img src="/design-assets/chat-stickers/encourage-cat-v2.webp" alt="" width="256" height="256" loading="lazy"/></div><div className="weekly-guide-example"><p className="weekly-example-label">Report format - not your records - not a live AI result</p>{items.map(([title,body],i)=><div key={title}><span>{String(i+1).padStart(2,'0')}</span><section><h4>{title}</h4><p>{body}</p></section></div>)}</div></section>;
}

export function WeeklyStudyReport({store,source,report,now,view,auth,onSignIn,signInReady,onImported,onAction,onWeek,onBusy,demo=false,canPlan=true}){
 const [service,setService]=useState({state:'loading'}),[consent,setConsent]=useState(false),[shareNames,setShareNames]=useState(false),[busy,setBusy]=useState(false),[issue,setIssue]=useState(''),[job,setJob]=useState(null),[retry,setRetry]=useState(0),[notice,setNotice]=useState(''),[updateOpen,setUpdateOpen]=useState(false),[exporting,setExporting]=useState(''),[exportError,setExportError]=useState(''),[exportMessage,setExportMessage]=useState('');
 const exportInFlight=useRef(false);
 const epoch=store.data.epoch,account=auth?.user?.syncAccountId||'',scope=account+':'+epoch,scopeRef=useRef(scope),mounted=useRef(false),inFlight=useRef(false),requestRef=useRef(null),follow=useRef(''),importing=useRef(new Set()),callbacks=useRef({onImported,onBusy});
 scopeRef.current=scope;callbacks.current={onImported,onBusy};
 const eligible=['week','last-week'].includes(report.range.period);
 const input=useMemo(()=>{if(!eligible)return {facts:null,error:''};try{return {facts:detailedWeeklyInput(source,{now,zone:report.range.zone,period:report.range.period,subject:report.subject,mode:report.mode,shareNames}),error:''};}catch(e){return {facts:null,error:e.message};}},[source,now,report.range.zone,report.range.period,report.subject,report.mode,shareNames]);
 const facts=input.facts;
 const ai=view?.snapshot?.aiWeek||null,inputsKey=[report.range.start,report.range.end,report.subject,report.mode,shareNames,facts?.detail.planning.basis,facts?.seconds,facts?.count].join(':');
 useEffect(()=>{setConsent(false);requestRef.current=null;setIssue('');},[inputsKey]);
 useEffect(()=>{setUpdateOpen(false);setConsent(false);setExportError('');setExportMessage('');},[ai?.id]);
 useEffect(()=>{
  mounted.current=true;const origin=scope;let gone=false,poll=null,loading=false;
  const live=()=>!gone&&scopeRef.current===origin;
  async function refresh(){
   if(loading||demo)return;loading=true;
   try{
    const status=await accountRequest(path+'/status');if(!live())return;
    if(status.accountId&&account&&status.accountId!==account)throw Error('The signed-in account changed. Refresh before generating.');
    setService({state:'ready',...status});
    if(status.authenticated){
     const listing=await accountRequest(path);if(!live())return;
     if(listing.accountId!==status.accountId)throw Error('The signed-in account changed. Refresh before retrieving reports.');
     const {reports}=listing;
     const pending=reports.find(r=>r.status==='pending');if(pending){follow.current=pending.id;setJob(pending);setBusy(true);callbacks.current.onBusy?.(true);}
     let selected='';
     for(const row of reports){
      if(!live())return;
      if(row.id===follow.current&&row.status!=='pending'){setJob(row);setBusy(false);callbacks.current.onBusy?.(false);if(row.status==='failed'){requestRef.current=null;follow.current='';setIssue('The report could not be generated. No report allowance was used. Try again.');}}
      if(row.status!=='ready'||importing.current.has(row.id))continue;
      const snapshot=store.getSnapshot?await store.getSnapshot():store.data;if(!live()||snapshot.epoch!==epoch)return;
      const reviewId='ai-week-'+row.id;
      if((snapshot.workspace?.learning?.reviews||[]).some(r=>r.id===reviewId)){if(row.id===follow.current)selected=reviewId;continue;}
      importing.current.add(row.id);
      try{const result=await store.command('review-import-ai',{review:weeklyReview(row)});if(!result)throw Error('The completed report could not be saved in this browser. Refresh to retrieve it from your account.');if(!selected)selected=reviewId;}
      finally{importing.current.delete(row.id);}
     }
     if(live()&&selected){callbacks.current.onImported?.(selected);follow.current='';setNotice('Report saved to your private review history. Viewing it again uses no allowance.');}
     if(live()){clearTimeout(poll);poll=setTimeout(refresh,pending?2000:60000);}
    }
   }catch(e){if(live()){setIssue(e.message||'Weekly report availability could not be checked.');setService(s=>({...s,state:'error'}));}}
   finally{loading=false;}
  }
  refresh();const visible=()=>{if(document.visibilityState==='visible')refresh();};document.addEventListener('visibilitychange',visible);
  return()=>{gone=true;mounted.current=false;clearTimeout(poll);document.removeEventListener('visibilitychange',visible);callbacks.current.onBusy?.(false);};
 },[scope,retry,demo]);
 async function generate(){
  if(inFlight.current||busy||demo||!facts||!consent||!service.available||!service.detailedAvailable||!service.allowed||facts.detail.coverage.depth==='insufficient'||store.hasPending)return;
  let accepted=false;const origin=scope,snapshot=facts,serial=JSON.stringify(snapshot);if(!requestRef.current||requestRef.current.serial!==serial)requestRef.current={key:crypto.randomUUID(),serial};
  const requestKey=requestRef.current.key;
  inFlight.current=true;setBusy(true);onBusy?.(true);setIssue('');setNotice('');
  try{
   const who=await accountRequest('/api/auth/me');if(!who.user?.syncAccountId||account&&who.user.syncAccountId!==account)throw Error('Sign in to the same account before generating.');
   if(scopeRef.current!==origin||!mounted.current)return;
   const reply=await accountRequest(path,{method:'POST',csrf:who.csrf,data:{consent:true,allowLimited:snapshot.detail?.coverage.depth==='limited',requestKey,facts:snapshot}});if(scopeRef.current!==origin||!mounted.current)return;
   setJob(reply.report);follow.current=reply.report.id;accepted=reply.report.status==='pending';
   if(reply.report.status==='failed'){requestRef.current=null;throw Error('The report could not be generated. No report allowance was used. Try again.');}
   // Restart the read loop: a status fetch already in flight must not delay a
   // newly created job until its otherwise-idle 60-second refresh.
   setRetry(n=>n+1);
  }catch(e){if(scopeRef.current===origin&&mounted.current){setIssue(e.message||'Generation could not be started. Refresh to check before retrying.');if(e.code!=='OFFLINE'&&e.code!=='REQUEST_TIMEOUT'&&e.code!=='AI_UNAVAILABLE')requestRef.current=null;}}
  finally{inFlight.current=false;if(!accepted&&scopeRef.current===origin&&mounted.current){setBusy(false);onBusy?.(false);}}
 }
 async function download(format){
  if(exportInFlight.current||!ai)return;
  const origin=scope;exportInFlight.current=true;setExporting(format);setExportError('');setExportMessage('');
  try{if(format==='pdf'){const {downloadWeeklyPDF}=await import('../lib/ai-weekly-pdf.mjs');await downloadWeeklyPDF(ai);}else downloadWeeklyReport(ai);if(mounted.current&&scopeRef.current===origin)setExportMessage(`${format==='pdf'?'PDF':'HTML'} prepared for download. Your saved report and allowance are unchanged.`);}
  catch(e){if(mounted.current&&scopeRef.current===origin)setExportError(e.message||'The report could not be prepared. Retry or choose the HTML copy.');}
  finally{exportInFlight.current=false;if(mounted.current&&scopeRef.current===origin)setExporting('');}
 }
 const remaining=Math.max(0,(service.limit||0)-(service.used||0)-(service.reserved||0)),stale=ai&&facts&&weeklyStale(ai,facts),unavailable=service.state==='ready'&&!service.available;
 return <div className="weekly-ai">
 {ai&&<>{stale&&<p className="weekly-stale">These saved figures have been kept. The current week, filters or records differ from this report; generate an updated report when you want a new analysis. Your personal reflections will stay with the original report.</p>}<AIReportContent ai={ai} onAction={onAction} canPlan={canPlan&&!busy} planControls={ai.version===2?<WeeklyPlanAdoption key={ai.id} ai={ai} source={source} store={store} disabled={!canPlan||busy||demo} onBusy={onBusy}/>:null} onDownload={()=>download('pdf')} onHTML={()=>download('html')} exporting={exporting}/></>}
{exporting&&<p className="cp-feedback" role="status">Preparing your complete report on this device. No new AI request is sent.</p>}{exportError&&<p className="field-error" role="alert">{exportError}</p>}{exportMessage&&<p className="cp-feedback" role="status">{exportMessage}</p>}
{ai&&<div className="weekly-update-bar"><p><strong>{stale?'New selection or records':'Saved report'}</strong><span>{stale?'Your saved report keeps its original figures.': 'This report already matches your current summary.'}{service.allowed?` · ${remaining} of ${service.limit} reports available`:''}</span></p><button className="button" aria-expanded={updateOpen} aria-controls="weekly-update-form" disabled={busy} onClick={()=>{setUpdateOpen(v=>!v);setConsent(false);}}>{updateOpen?'Cancel update':'Update report'}</button></div>}
{(!ai||updateOpen)&&<div className="weekly-generation" id="weekly-update-form"><div><p className="cp-eyebrow">AI WEEKLY REVIEW</p><h3>Generate your AI weekly study report</h3><p>Get an eight-part review: what changed, where your plan slipped, what fits next week, and how to check the result. AI explains the evidence; you decide what to add to your plan.</p></div>
 {!eligible?<p className="cp-note">AI reports cover a calendar week. <button className="button" onClick={onWeek}>Use last week</button> Your other date views and private reflections remain available.</p>:<>
 <p className="weekly-scope"><strong>{facts?.start} — {facts?.end}</strong> · {report.range.zone}{facts?.partial?' · This week so far; compared with equal elapsed time':''}<br/>{facts?`${duration(facts.seconds)} saved · ${facts.count} sessions · ${facts.activeDays} study days`:'Preparing a supported weekly summary…'} · {report.subject?'Selected subject':'All subjects'}{report.mode?' · '+report.mode:''}</p>
 {input.error&&<p className="field-error" role="alert">{input.error} Your existing reports remain available.</p>}
 {facts&&<WeeklyDetailedPreflight facts={facts} source={source} store={store} disabled={busy||demo||!canPlan} onBusy={onBusy}/>}
 <label className="weekly-check"><input type="checkbox" checked={shareNames} disabled={busy||demo} onChange={e=>setShareNames(e.target.checked)}/><span>Include subject names <small>Optional. Otherwise, DeepSeek sees “Subject 1”, “Subject 2”, and so on.</small></span></label>
 <label className="weekly-check"><input type="checkbox" checked={consent} disabled={busy||demo} onChange={e=>setConsent(e.target.checked)}/><span>Send this weekly summary to DeepSeek to generate my report.<small>Includes four comparable weekly totals, original goal/plan evidence, anonymous completed-task estimate matches, current remaining workloads, deadline dates, daily capacity, proposed session times and adopted-task status. No email, nickname, task titles, raw session logs, chats or private reflections. The completed report is saved to your account and this browser. This does not enable automatic sync.</small></span></label>
 <div className="weekly-generate-action">{service.state==='ready'&&service.available&&!service.authenticated&&onSignIn?<button className="button primary" onClick={()=>onSignIn(false,false,'progress')} disabled={!signInReady||demo}>Sign in to generate</button>:<button className="button primary" onClick={generate} disabled={busy||demo||!!ai&&!stale||!consent||!facts?.count||facts?.detail.coverage.depth==='insufficient'||!service.available||!service.detailedAvailable||!service.allowed||remaining<1||store.hasPending}>{busy?'Generating your weekly review…':ai&&!stale?'Report is up to date':facts?.detail.coverage.depth==='limited'?'Generate limited-evidence report':ai?'Generate updated AI report':'Generate AI weekly report'}</button>}<span className="cp-note">{demo?'Example view: no data is sent and no allowance is used.':service.state==='loading'?'Checking AI report availability…':unavailable?'DeepSeek generation is not connected yet. Your statistics and personal reflections still work.':!service.detailedAvailable?'Detailed DeepSeek generation is awaiting server configuration. Saved reports remain readable.':!service.authenticated?'Sign in for private AI reports. Your account workspace and anonymous browser records stay separate.':!service.allowed?'AI reports require Plus or an explicitly enabled AI preview.':`${remaining} of ${service.limit} reports available · resets ${new Date(service.resetsAt).toLocaleDateString()} (UTC)`}</span></div>
 {facts&&!facts.count&&<p className="cp-note">Save a study session in this week first. The illustrative report below shows what you will receive.</p>}
 <p className="cp-note">One successful new report uses one report allowance. An unchanged summary reuses its report. Failed reports, reading, and downloads use no report allowance.</p>
 </>}
 </div>}
 {busy&&<p role="status" className="cp-feedback">Your report is being prepared. You can leave this page; return to Progress to retrieve it.</p>}
 {issue&&<p className="field-error" role="alert">{issue} <button className="button" onClick={()=>setRetry(n=>n+1)}>Refresh report status</button></p>}{notice&&<p className="cp-feedback" role="status">{notice}</p>}
 {job?.status==='failed'&&!issue&&<p className="cp-note">The last request failed. Your report allowance was returned.</p>}
 </div>;
}
