import {readGroupsReturn} from '../lib/group-center-draft.mjs';
import {MyGroups} from './MyGroups.jsx';
import {StudyCenterProgress} from './StudyCenterProgress.jsx';
import {StudyCenterGuide} from './StudyCenterGuide.jsx';
import {StudyCenterPlans} from './StudyCenterPlans.jsx';
import {DailyGoal,TodayTasks,SavedTrend} from './StudyCenterActions.jsx';
import {syncPresentation} from '../lib/sync-view.mjs';
import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowRight} from '@phosphor-icons/react';
import {dayKey,hasProgress} from '../lib/model.mjs';
import {toolFor} from '../lib/routes.mjs';
import {studyCenterReport} from '../lib/study-center.mjs';
import {trackerDuration} from '../lib/tracker.mjs';
import {plannerDate} from '../lib/planner.mjs';
import {StudyCenterCommunity} from './StudyCenterCommunity.jsx';
import '../study-center.css';

const tabs=[['overview','Today','☀️'],['progress','Progress','📊'],['community','My groups','👥'],['settings','Account & data','🗂️']];
const duration=trackerDuration;
export function centerSection(requested){if(['sync','signin','preferences'].includes(requested))return 'settings';return tabs.some(([id])=>id===requested)?requested:'overview';}
export function StudyCenter({store,now,navigate,onStart,auth,loaded,cloud,accountError,settingsSignal,accountNotice,settings,onSignIn,signInReady,accountBusy}){
 const [view,setView]=useState('overview'),[today,setToday]=useState(''),[jumpSync,setJumpSync]=useState(false),[jumpPreferences,setJumpPreferences]=useState(false);
 const progressDirty=useRef(false),panel=useRef(null),day=dayKey(now),minute=Math.floor(now/60000),ready=store.ready&&Number.isFinite(now)&&now>0&&today===day;
 useEffect(()=>setToday(day),[day]);
 useEffect(()=>{
  const enter=()=>{const url=new URL(location.href),requested=url.searchParams.get('view');setView(centerSection(requested));setJumpSync(requested==='sync');setJumpPreferences(requested==='preferences');if(requested==='learning'){url.searchParams.delete('view');history.replaceState({},'',url.pathname+url.search+url.hash);}};
  enter();window.addEventListener('studytimely:account-entry',enter);window.addEventListener('popstate',enter);return()=>{window.removeEventListener('studytimely:account-entry',enter);window.removeEventListener('popstate',enter);};
 },[]);
 useEffect(()=>{if(settingsSignal)setView('settings');},[settingsSignal]);
 useEffect(()=>{if(loaded&&auth?.user?.googleLinked&&auth.user.syncAccountId&&['settings','signin'].includes(new URL(location.href).searchParams.get('view'))&&readGroupsReturn(auth.user.syncAccountId)){setView('community');const url=new URL(location.href);url.searchParams.set('view','community');history.replaceState({},'',url.pathname+url.search+url.hash);}},[loaded,auth?.user?.syncAccountId,auth?.user?.googleLinked]);
 const report=useMemo(()=>ready?studyCenterReport(store.data,minute*60000):null,[ready,today,minute,store.data.sessions,store.data.workspace,store.data.dailyGoal]);
 const active=store.data.timer,unfinished=hasProgress(active),timerPath=unfinished?toolFor(active.mode).path:'/';
 function choose(id){if(id!==view&&progressDirty.current&&!window.confirm('Discard unsaved review changes?'))return false;setView(id);setJumpSync(false);setJumpPreferences(false);const url=new URL(location.href);if(id==='overview')url.searchParams.delete('view');else url.searchParams.set('view',id);history.replaceState({},'',url.pathname+url.search+url.hash);return true;}
 useEffect(()=>{if(view!=='settings'||!jumpSync)return;const target=document.getElementById('sync-settings');if(target){target.scrollIntoView({block:'start'});target.focus({preventScroll:true});setJumpSync(false);}},[view,jumpSync]);
 useEffect(()=>{if(view!=='settings'||!jumpPreferences)return;const target=document.getElementById('community-preferences');if(target){target.scrollIntoView({block:'start'});target.focus({preventScroll:true});setJumpPreferences(false);}},[view,jumpPreferences]);
 function tabKey(e){let i=tabs.findIndex(([id])=>id===view);if(e.key==='ArrowRight')i=(i+1)%tabs.length;else if(e.key==='ArrowLeft')i=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')i=0;else if(e.key==='End')i=tabs.length-1;else return;e.preventDefault();choose(tabs[i][0]);document.getElementById('center-tab-'+tabs[i][0])?.focus();}
 const link=(href,text,primary=false)=><a className={'button'+(primary?' primary':'')} href={href} onClick={navigate}>{text}<ArrowRight size={17}/></a>;
 const header=(title,href,text)=><div className="sc-section-heading"><h2>{title}</h2>{href&&<a className="button" href={href} onClick={navigate}>{text}<ArrowRight size={16}/></a>}</div>;
 const taskPanel=<TodayTasks store={store} ready={ready} today={today} report={report} onStart={onStart} navigate={navigate} timerAction={link(timerPath,unfinished?'Return to current timer':'Open timer without a task')}/>;
 const trend=<SavedTrend ready={ready} recent={report?.recent} today={today} navigate={navigate} onReport={view==='overview'?()=>choose('progress'):undefined}/>;
 const syncState=syncPresentation(store.cloudSync);
 const viewHelp={overview:'Choose today’s work, then save a session to see your progress.',progress:'Review your saved study time, subjects and habits.',community:'Return to your rooms or find study partners. Room credit stays separate.',settings:'Manage your account, personal preferences, backups and optional sync.'};
 const recent=<section className="sc-panel">{header('Recent study','/study-tracker?view=records','All records')}{!ready?<p role="status">Loading saved sessions…</p>:report.latest.length?<ul className="sc-records">{report.latest.map(s=><li key={s.id}><div><strong>{s.taskTitle||s.chapterTitle||s.subject||'Unlabelled study'}</strong><span>{s.subject||'No subject'} · {new Date(s.endedAt).toLocaleDateString('en-GB')} · {s.mode}</span></div><strong>{duration(s.durationSeconds)}</strong></li>)}</ul>:<p className="sc-help">Saved Study, Focus and Pomodoro records will appear here. General timers do not add learning time.</p>}</section>;
 return <main id="main-content" className="workspace management study-center"><header className="sc-heading"><h1>My Study Center</h1><p className="sc-heading-source">{view==='community'?'Community rooms · online account':store.memory?'Temporary tab · export before leaving':'Personal study saved in this browser'}{today?' · '+plannerDate(today,{weekday:'short',year:'numeric'}):''}</p></header>
 {accountNotice&&<p className="sc-feedback" role="status">{accountNotice}</p>}
 {syncState.tone==='warning'&&!store.memory&&!store.hasPending&&<p className="sc-feedback" role="status">{syncState.label}. Review Account &amp; data for details.</p>}
 <nav className="sc-tabs" aria-label="Study center sections" role="tablist" onKeyDown={tabKey}>{tabs.map(([id,label,emoji])=><button id={'center-tab-'+id} key={id} role="tab" aria-selected={view===id} aria-controls="center-panel" tabIndex={view===id?0:-1} onClick={()=>choose(id)}><span className="sc-tab-emoji" aria-hidden="true">{emoji}</span><span>{label}</span></button>)}</nav>
 {store.memory&&<p className="session-notice">Temporary storage: this overview can disappear when this tab closes. Use Account & data → Download backup to keep a copy.</p>}
 <div ref={panel} id="center-panel" role="tabpanel" aria-labelledby={'center-tab-'+view} tabIndex={0}>{!['progress','community'].includes(view)&&<p className="sc-view-help">{viewHelp[view]}</p>}{(store.error||store.hasPending)&&<p className="field-error" role="alert">{store.error?.message||'A local save needs attention. Resolve it before making more changes.'}</p>}
 {view==='overview'&&<>
 <div className="sc-overview-grid">
 <section className="sc-metrics" aria-label="Saved personal learning"><div><span>Saved today</span><strong>{ready?duration(report.day.total):'—'}</strong><small>Pauses and breaks excluded</small></div><div><span>Saved this week</span><strong>{ready?duration(report.week.total):'—'}</strong><small>Monday through today · local dates</small></div><DailyGoal store={store} ready={ready} minutes={report?.dailyGoal||0} seconds={report?.day.total||0}/></section>
 {taskPanel}
 <div className="sc-stack sc-history">{trend}{ready&&report.latest.length>0&&recent}</div></div>
 <StudyCenterPlans store={store} ready={ready} now={now} today={today} onStart={onStart}/>
 <StudyCenterGuide/>

 {auth&&loaded&&<StudyCenterCommunity mode="summary" auth={auth} loaded={loaded} navigate={navigate} onAccount={()=>choose('settings')}/>}

 {!auth&&loaded&&<section className="sc-signin"><div><h2>Keep learning here, sync when you choose</h2><p>Google sign-in enables optional cloud sync and community access. Signing in alone does not upload these records.</p></div><button className="button" disabled={!signInReady||accountBusy} onClick={onSignIn}>Continue with Google</button><button className="text-button" onClick={()=>choose('settings')}>Account options</button></section>}

 </>}
 {view==='progress'&&<StudyCenterProgress key={(store.cloudSync?.info?.account||'local')+':'+store.data.epoch} store={store} now={now} ready={ready} onDirty={value=>{progressDirty.current=value;}} studyAction={link(timerPath,unfinished?'Return to current timer':'Open study timer')}/>}
 {view==='community'&&<MyGroups key={auth?.user?.syncAccountId||'guest'} auth={auth} loaded={loaded} navigate={navigate} onAccount={()=>choose('settings')}/>}
 {view==='settings'&&<><StudyCenterCommunity mode="preferences" auth={auth} loaded={loaded} navigate={navigate} onAccount={()=>{document.querySelector('.sc-account-settings')?.scrollIntoView({block:'start'});}}/>{settings}</>}
 </div><p className="sc-source">Saved personal learning in this browser · local calendar dates. Plans and task completion do not create study time. Sync is optional and managed in Account & data.</p></main>;
}
