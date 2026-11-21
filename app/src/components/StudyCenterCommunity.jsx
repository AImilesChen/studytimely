import {CommunityPreferences} from './CommunityPreferences.jsx';
import {useEffect,useState} from 'react';
import {accountRequest} from '../lib/sync.mjs';
import {trackerDuration} from '../lib/tracker.mjs';

export function StudyCenterCommunity({auth,loaded,navigate,onAccount,mode='rooms'}){
 const [data,setData]=useState(null),[error,setError]=useState(''),[pending,setPending]=useState(false),[retry,setRetry]=useState(0);
 const accountId=auth?.user?.syncAccountId;
 useEffect(()=>{
  let disposed=false;setData(null);setError('');
  if(!accountId||!auth?.user?.googleLinked){setPending(false);return;}
  setPending(true);accountRequest('/api/community/me').then(me=>{if(!disposed)setData({me,accountId});}).catch(()=>{if(!disposed)setError('Your community details could not be loaded.');}).finally(()=>{if(!disposed)setPending(false);});
  return()=>{disposed=true;};
 },[accountId,auth?.user?.googleLinked,retry]);
 const preferences=mode==='preferences',compact=mode==='summary',title=preferences?'Your name and public profile':compact?'Your study groups':'Your rooms';
 const current=!!data&&!!accountId&&data.accountId===accountId&&auth?.user?.googleLinked&&!pending,me=current?data.me:null;
 return <section id={preferences?'community-preferences':undefined} tabIndex={preferences?-1:undefined} className={'sc-panel sc-community-summary'+(compact?' sc-community-compact':'')} aria-label={title}>
 <div className="sc-section-heading"><h2>{title}</h2>{!preferences&&<a className="button" href={compact?'/account?view=community':'/study-groups'} onClick={navigate}>{compact?'My groups':'Find or create a room'} →</a>}</div>
 {!loaded?<p role="status">Checking account…</p>:!auth?<><p>Sign in to manage your community nickname, rooms and optional public ranking. Your personal study tools work without an account.</p><button className="button" onClick={onAccount}>Sign-in options</button></>:!auth.user.googleLinked?<><p>Link Google to use community features.</p><button className="button" onClick={onAccount}>Link Google in Account</button></>:error?<><p className="field-error" role="alert">{error}</p><button className="button" onClick={()=>setRetry(n=>n+1)}>Retry community details</button></>:pending||!me?<p role="status">Loading your community details…</p>:me?<>
 {preferences?(me.profile?<CommunityPreferences key={me.profile.id} auth={auth} profile={me.profile} blocks={me.blocks} onProfile={profile=>setData(current=>({...current,me:{...current.me,profile}}))} refresh={()=>setRetry(n=>n+1)}/>:<><p>Choose a nickname and review the community rules before joining your first room.</p><a className="button" href="/study-groups" onClick={navigate}>Set up community profile →</a></>):<>
 {compact?<p>{me.rooms.length?`${me.rooms.length} joined room${me.rooms.length===1?'':'s'}. Return to a room to study with your partners.`:'No joined rooms yet. Find a quiet room or invite your study partners.'}</p>:<>
 <p>{me.profile?`Public ranking ${me.profile.publicRanking?'on':'off'} · ${trackerDuration(me.creditedToday||0)} confirmed room time today (UTC)`:'Choose a community nickname before joining a room. Public ranking is optional.'}</p>
 {me.rooms.length?<ul className="sc-records">{me.rooms.map(room=><li key={room.id}><div><strong>{room.name}</strong><span>{room.owner_id===me.profile?.id?'Owner':'Member'} · {room.member_count} / {room.capacity} members · {room.visibility} · {room.closed_at?'Closed':room.can_participate?'Active place':'Read only'}</span></div><a className="button" href={'/study-groups?room='+encodeURIComponent(room.id)} onClick={navigate}>{room.closed_at?'View records':'Enter room'} →</a></li>)}</ul>:<p>No joined rooms. Browse rooms or use an invitation to study alongside others.</p>}
 <div className="sc-form-actions"><a className="button" href="/account?view=preferences" onClick={navigate}>Nickname & ranking preferences →</a><a className="button" href="/leaderboard" onClick={navigate}>View rankings →</a></div>
 </>}
 <p className="sc-help">Room credit uses UTC. Personal study uses local dates. These totals stay separate.</p>
 </>}
 </>:null}
 </section>;
}
