import {useEffect,useState} from 'react';
import {ArrowRight,ArrowClockwise,ChartLine,ShieldCheck,MagnifyingGlass,GearSix} from '@phosphor-icons/react';
import {Dialog} from './Dialog.jsx';
import {LeaderboardGuide} from './LeaderboardContent.jsx';
import {RankingPodium,RankingTable} from './LeaderboardStandings.jsx';
import {accountRequest} from '../lib/sync.mjs';
import {RANKING_PERIODS,rankingDuration,rankingStandings} from '../lib/leaderboard-model.mjs';
import '../leaderboard.css';

const api=(path,options)=>accountRequest('/api/community'+path,options);
const scoreText=(score,period)=>period==='streak'?`${score} ${score===1?'day':'days'}`:rankingDuration(score);
const utcDate=day=>day?new Date(day+'T00:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}):'';

export function Leaderboard({navigate,site}){
 const [period,setPeriod]=useState('today'),[refresh,setRefresh]=useState(0);
 const [board,setBoard]=useState(null),[loading,setLoading]=useState(true),[boardError,setBoardError]=useState('');
 const [mine,setMine]=useState(null),[auth,setAuth]=useState(null),[accountStatus,setAccountStatus]=useState('loading'),[accountError,setAccountError]=useState('');
 const [search,setSearch]=useState(''),[page,setPage]=useState(1),[dialog,setDialog]=useState(false),[nickname,setNickname]=useState(''),[ranking,setRanking]=useState(false),[accepted,setAccepted]=useState(false),[editVersion,setEditVersion]=useState(0),[saving,setSaving]=useState(false),[saveError,setSaveError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{
  let disposed=false;setLoading(true);setBoardError('');setAccountStatus('loading');setAccountError('');
  api('/leaderboard?period='+period).then(data=>{if(!disposed)setBoard(data);}).catch(e=>{if(!disposed)setBoardError(e.message);}).finally(()=>{if(!disposed)setLoading(false);});
  (async()=>{try{
   const account=await accountRequest('/api/auth/me');if(disposed)return;setAuth(account);
   if(!account.user){setMine(null);setAccountStatus('signedOut');return;}
   if(!account.user.googleLinked){setMine(null);setAccountStatus('googleRequired');return;}
   const personal=await api('/leaderboard/me?period='+period);if(!disposed){setMine(personal);setAccountStatus('ready');}
  }catch(e){if(!disposed){setMine(null);setAccountError(e.message);setAccountStatus('error');}}})();
  return()=>{disposed=true;};
 },[period,refresh]);
 useEffect(()=>{const visible=()=>{if(!document.hidden&&!dialog)setRefresh(n=>n+1);};document.addEventListener('visibilitychange',visible);return()=>document.removeEventListener('visibilitychange',visible);},[dialog]);
 const current=board?.period===period?board:null,personal=mine?.period===period?mine:null;
 const profile=personal?.profile,published=!!profile?.publicRanking,view=rankingStandings(current?.rows||[],search,page);
 function changePeriod(id){setPeriod(id);setPage(1);setSearch('');}
 function openProfile(){setNickname(profile?.nickname||'');setRanking(profile?.publicRanking||false);setAccepted(false);setEditVersion(profile?.version||0);setSaveError('');setDialog(true);}
 async function saveProfile(e){
  e.preventDefault();setSaving(true);setSaveError('');
  try{await api('/profile',{method:'PUT',csrf:auth?.csrf,data:{nickname,publicRanking:ranking,version:editVersion,...(!profile?{accepted}:{})}});setDialog(false);setNotice(ranking?'Your public ranking choice was saved. Eligible room time already recorded in this period is included.':'Your profile was saved with public rankings off. Existing daily rank history was removed; room time is kept.');setRefresh(n=>n+1);}
  catch(error){setSaveError(error.message);}
  finally{setSaving(false);}
 }
 function periodKeys(e){
  const ids=RANKING_PERIODS.map(([id])=>id),i=ids.indexOf(period);let next;
  if(e.key==='ArrowRight')next=ids[(i+1)%ids.length];else if(e.key==='ArrowLeft')next=ids[(i+ids.length-1)%ids.length];else if(e.key==='Home')next=ids[0];else if(e.key==='End')next=ids.at(-1);else return;
  e.preventDefault();changePeriod(next);document.getElementById('ranking-tab-'+next)?.focus();
 }
 const action=accountStatus==='ready'?<button className="button primary" onClick={openProfile}>{profile?published?'Ranking settings':'Review public ranking':'Set up community profile'} {profile?<GearSix size={17}/>:<ArrowRight size={17}/>}</button>:['signedOut','googleRequired'].includes(accountStatus)?<a className="button primary" href="/account?view=signin" onClick={navigate}>{accountStatus==='googleRequired'?'Link Google in Account':'Sign in to participate'} <ArrowRight size={17}/></a>:null;
 const dateRange=current?(period==='week'?`${utcDate(current.start)}–${utcDate(current.end)} · week to date`:period==='today'?utcDate(current.day):`Consecutive days · as of ${utcDate(current.day)}`):'Dates appear when the leaderboard loads';
 return <main id="main-content" className="workspace management community leaderboard-page">
  <nav className="lb-breadcrumb" aria-label="Breadcrumb"><a href="/" onClick={navigate}>StudyTimely</a><span aria-hidden="true">/</span><span>Leaderboard</span></nav>
  <header className="lb-heading"><div><h1>Study Leaderboard</h1><p>Compare room study time and streaks. Join only if it helps you.</p></div><a className="button" href="/study-groups" onClick={navigate}>Find a study room <ArrowRight size={18}/></a></header>
  {site?.localAccountsTest&&<aside className="lb-preview-note">Local preview · synthetic accounts and rankings, not real user activity.</aside>}
  {notice&&<p className="lb-notice" role="status">{notice}</p>}
  <section className="lb-board" aria-labelledby="lb-board-heading">
   <div className="lb-section-head"><div><h2 id="lb-board-heading">Community rankings</h2><p>Up to 100 participants · ordered by {period==='streak'?'consecutive UTC days':'credited room time'}</p></div><div className="lb-board-actions"><a href="#leaderboard-counting">Scoring rules</a><button className="button" disabled={loading} onClick={()=>setRefresh(n=>n+1)}><ArrowClockwise size={17}/> Refresh</button></div></div>
   <div className="lb-periods" role="tablist" aria-label="Leaderboard period" onKeyDown={periodKeys}>{RANKING_PERIODS.map(([id,label])=><button key={id} id={'ranking-tab-'+id} type="button" role="tab" tabIndex={period===id?0:-1} aria-selected={period===id} aria-controls="lb-results" onClick={()=>changePeriod(id)}>{label}</button>)}</div>
   <div className="lb-period-meta"><p>{dateRange}{current&&' · UTC'}</p>{current&&<p>Updated <time dateTime={new Date(current.serverNow).toISOString()}>{new Date(current.serverNow).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'UTC'})} UTC</time></p>}</div>
   <div data-nosnippet id="lb-results" role="tabpanel" aria-labelledby={'ranking-tab-'+period} aria-busy={loading} tabIndex={0}>
    <RankingPodium rows={current?.rows||[]} period={period} status={loading?'loading':boardError?'error':'ready'}/>
    {loading?<p className="lb-board-message" role="status">Loading this period’s rankings…</p>:boardError?<div className="lb-board-message lb-error" role="alert"><p>Rankings could not be loaded. {boardError}</p><button className="button" onClick={()=>setRefresh(n=>n+1)}>Try rankings again</button><a href="#leaderboard-help">Check missing time and connection steps</a></div>:current?.rows.length>0&&<div className="lb-search-row"><label className="lb-search"><MagnifyingGlass size={19}/><span className="sr-only">Search the displayed Top 100 by nickname</span><input type="search" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search this Top 100"/></label><p>{current.participants} {current.participants===1?'participant':'participants'} in this period · {current.rows.length} displayed{search?` · ${view.total} matches`:''}</p></div>}
    {!loading&&!boardError&&current&&<>
     {(view.searching||view.total>0)&&<RankingTable rows={view.rows} period={period} caption={`${view.searching?'Search results from the Top 100':'Participants following the podium'} · ${period==='streak'?'Current streak':'Credited room time'} leaderboard · ${dateRange} UTC`} profileId={published?profile?.id:null}/>}
     {view.pages>1&&<nav className="lb-pagination" aria-label="Leaderboard pages"><button className="button" disabled={view.page===1} onClick={()=>setPage(view.page-1)}>Previous</button><span role="status">Page {view.page} of {view.pages}</span><button className="button" disabled={view.page===view.pages} onClick={()=>setPage(view.page+1)}>Next</button></nav>}
     {view.searching&&!view.total&&<div className="lb-board-message"><p>This search covers the displayed Top 100, not all accounts.</p><button className="button" onClick={()=>{setSearch('');setPage(1);}}>Clear search</button></div>}
     {!current.rows.length&&<div className="lb-vacancy-note"><p>{period==='streak'?'No qualifying public streaks yet.':'No public scores yet.'} The first places are open.</p>{published?<a className="button" href="/study-groups" onClick={navigate}>Start studying in a room <ArrowRight size={16}/></a>:action||<button className="button" disabled={accountStatus!=='error'} onClick={()=>setRefresh(n=>n+1)}>{accountStatus==='error'?'Retry participation check':'Checking participation…'}</button>}</div>}
    </>}
   </div>
   {current&&<details className="lb-reset"><summary>UTC reset &amp; local time</summary><p>{period==='streak'?'Today can still extend a streak through yesterday. Next UTC day: ':period==='week'?'Next weekly period starts: ':'Next daily period starts: '}<time dateTime={new Date(current.nextResetAt).toISOString()}>{new Date(current.nextResetAt).toLocaleString('en-GB',{timeZone:'UTC'})} UTC</time><span>On this device: {new Date(current.nextResetAt).toLocaleString('en-GB')}.</span></p></details>}
   <p className="lb-footnote">Times are credited by the room timer; they do not prove attention or learning. Ties share a rank. Public rankings are optional. <a href="#leaderboard-periods">Understand periods and streaks</a>.</p>
  </section>
  <section data-nosnippet className="lb-personal" aria-labelledby="lb-you-heading" aria-busy={accountStatus==='loading'}>
   <div className="lb-personal-intro"><span className="lb-icon"><ChartLine size={24}/></span><div><h2 id="lb-you-heading">Your progress</h2>
    {accountStatus==='loading'?<p role="status">Checking your participation…</p>:accountStatus==='error'?<><p role="alert">Your account status could not be loaded. {accountError}</p><button className="text-button" onClick={()=>setRefresh(n=>n+1)}>Try account again</button></>:accountStatus==='signedOut'?<p>Browse freely. Sign in with Google to choose a community nickname and decide whether to appear.</p>:accountStatus==='googleRequired'?<p>Link Google to your existing account before taking part in community rankings.</p>:!profile?<p>Choose a nickname first. Creating a profile does not require joining the public leaderboard.</p>:!published?<p><strong>Public ranking is off.</strong> Your room contributions stay out of global rankings. Review what is shared before joining.</p>:<p><strong>{profile.nickname}</strong> · Public ranking is on. Only server-checked room time contributes.</p>}
   </div></div>
   {accountStatus==='ready'&&profile&&<dl className="lb-personal-stats"><div><dt>{period==='streak'?'Your current streak':'Your credited time'}</dt><dd>{scoreText(personal.score,period)}</dd></div><div><dt>{published?'Your rank this period':'Public participation'}</dt><dd>{published?personal.rank?`#${personal.rank}`:'Unranked':'Off'}</dd></div></dl>}
   <div className="lb-personal-actions">{action}<a href="/study-groups" onClick={navigate}>{published?'Go study in a room':'Browse study rooms'} <ArrowRight size={16}/></a></div>
   {accountStatus==='ready'&&profile&&<p className="lb-footnote">{published&&personal.rank&&personal.rank>100?'Your rank is calculated across all opted-in participants, even when your row is outside the displayed Top 100. ':published&&!personal.rank?'No qualifying score in this period yet. ':''}Homepage timers and imported records do not add leaderboard time. <a href="#leaderboard-counting">See what counts</a>.</p>}
  </section>
  <section data-nosnippet className="lb-history" aria-labelledby="lb-history-heading"><div className="lb-section-head"><div><h2 id="lb-history-heading">Your daily rank history</h2><p>Private to your signed-in account · up to 30 recent daily results.</p></div><ShieldCheck size={26}/></div>
   {accountStatus==='loading'?<p role="status">Checking daily results…</p>:accountStatus==='error'?<p>Your history is unavailable until the account request succeeds. Use Try account again above.</p>:['signedOut','googleRequired'].includes(accountStatus)?<p><a href="/account?view=signin" onClick={navigate}>Sign in with Google</a> to see your own daily results. Browsing this page does not join you to a leaderboard.</p>:!profile?<p>Create your community profile above to choose whether you want public ranking.</p>:!published?<p>Public ranking is off, so daily rank results are not being recorded. Turning it off clears existing rank history; it does not erase room contributions.</p>:personal.history.length?<details className="lb-history-list"><summary>View {personal.history.length} daily {personal.history.length===1?'result':'results'}</summary><div className="table-scroll"><table><thead><tr><th scope="col">UTC day</th><th scope="col">Daily rank</th><th scope="col">Credited time</th></tr></thead><tbody>{personal.history.map(r=><tr key={r.day}><th scope="row">{utcDate(r.day)}</th><td>#{r.rank}</td><td>{rankingDuration(r.seconds)}</td></tr>)}</tbody></table></div></details>:<p>Your first result appears after an eligible UTC day closes and the daily snapshot runs. Studying today does not create a completed daily result immediately.</p>}
   <p className="lb-footnote">Rank history is a daily snapshot, not a weekly chart. <a href="/study-tracker" onClick={navigate}>Study Tracker</a> holds your separate browser learning records.</p>
  </section>
  <LeaderboardGuide navigate={navigate}/>
  <Dialog open={dialog} title={profile?'Public ranking settings':'Create your community profile'} close={()=>{if(!saving)setDialog(false);}} initialFocus={profile?'input[type="checkbox"]':'input[type="text"]'} className="lb-profile-dialog" preserveScroll>
   <form className="settings-body lb-profile-form" onSubmit={saveProfile}>
    <label className="field">Community nickname<input type="text" value={nickname} onChange={e=>setNickname(e.target.value)} minLength={2} maxLength={30} required autoComplete="off" placeholder="Choose a study nickname" disabled={saving}/></label>
    <label className="lb-choice"><input type="checkbox" checked={ranking} onChange={e=>setRanking(e.target.checked)} disabled={saving}/><span>Appear on public global leaderboards</span></label>
    <p>Your nickname, credited totals and rank will be visible to anyone, including visitors who are not signed in. Google names and email are not published. Public ranking information can be read or copied by visitors and search engines.</p><p>Enabling ranking includes eligible time already recorded in the selected periods from all your rooms, including private rooms. Private room names and messages are not shown here.</p><p>Switching public ranking off removes you from global lists and clears daily rank history. Your underlying room contributions are kept. Saving this choice does not start a timer or upload local study history.</p>
    {!profile&&<label className="lb-choice"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} required disabled={saving}/><span>I am at least 16 and agree to the community rules, <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>, with parental permission where required.</span></label>}
    {saveError&&<p className="field-error" role="alert">{saveError} Close and refresh this page if your profile changed on another tab; your draft has not been applied.</p>}
    <div className="lb-dialog-actions"><button type="button" className="button" disabled={saving} onClick={()=>setDialog(false)}>Cancel</button><button className="button primary" disabled={saving}>{saving?'Saving…':'Save choice'}</button></div>
   </form>
  </Dialog>
 </main>;
}
