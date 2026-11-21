import {createContext,useContext,useEffect,useRef,useState} from 'react';
import {accountRequest} from '../lib/sync.mjs';
import {ACTIVITY_SUBJECTS,ROOM_NOTICES} from '../lib/group-activities.mjs';
import {roomThemeInput,ROOM_THEME_LIMIT,roomThemeLabel} from '../lib/room-theme.mjs';
import {communityRules} from '../lib/community-model.mjs';
import {STUDY_CHAT_RULES} from '../lib/community-safety.mjs';
import {RoomManageGuide} from './RoomManageGuide.jsx';
import './room-manage.css';

const ManageContext=createContext(null);
const useManage=()=>useContext(ManageContext);
const roomFields=room=>({name:room.name,subject:room.customTheme?'custom':room.subject||'general',custom:room.customTheme||'',announcement:room.announcement||'welcome',version:room.version});
export function freeSeatIds(selected){
 if(selected.room.freeSeatsChosen || selected.access?.freeMemberIds?.length)return (selected.access?.freeMemberIds||[]).filter(id=>selected.members.some(m=>m.id===id&&id!==selected.room.ownerId));
 return selected.members.filter(m=>m.id!==selected.room.ownerId).slice().sort((a,b)=>(a.joined_at-b.joined_at)||a.id.localeCompare(b.id)).slice(0,Math.max(0,Math.min(4,selected.room.capacity)-1)).map(m=>m.id);
}
export function roomDraftMatches(first,second){
 const normalise=value=>{
  const {version,memberKey,...fields}=value;
  if(fields.subject&&fields.subject!=='custom')delete fields.custom;
  if(Array.isArray(fields.ids))fields.ids=[...fields.ids].sort();
  if(Object.hasOwn(fields,'capacity'))fields.capacity=Number(fields.capacity);
  return JSON.stringify(Object.keys(fields).sort().map(key=>[key,fields[key]]));
 };
 return normalise(first)===normalise(second);
}
export function changedPlaceMembers(members,before,after,ownerId){
 const previous=new Set(before),next=new Set(after);
 return members.filter(member=>member.id!==ownerId&&previous.has(member.id)!==next.has(member.id));
}
function useRoomDraft(from){
 const {selected}=useManage();
 const [state,setState]=useState(()=>{const value=from(selected);return{draft:value,baseline:value};});
 const {draft,baseline}=state,dirty=!roomDraftMatches(draft,baseline);
 useEffect(()=>{if(!dirty&&selected.room.version>=draft.version){const value=from(selected);setState({draft:value,baseline:value});}},[selected.room.version,dirty]);
 return {draft,baseline,dirty,conflict:selected.room.version>draft.version,
  change:patch=>setState(previous=>({...previous,draft:{...previous.draft,...patch}})),
  reset:()=>{const value=from(selected);setState({draft:value,baseline:value});},
  saved:result=>setState(previous=>{const value={...previous.draft,version:result.version};return{draft:value,baseline:value};})};
}
function Feedback({section,editing=false}){
 const {messages}=useManage(),message=messages[section];
 return message&&(!editing||message.error)?<p className={message.error?'field-error rm-feedback':'rm-feedback'} role={message.error?'alert':'status'}>{message.text}</p>:null;
}
function Conflict({conflict,reset}){
 const {disabled}=useManage();
 return conflict?<div className="rm-conflict" role="status"><p>The room changed while you were editing. Your draft is kept.</p><button type="button" className="button" disabled={disabled} onClick={reset}>Load latest settings</button></div>:null;
}

export function RoomManage({selected,me,profile,auth,busy,visible=true,refresh,confirm,onBusyChange,onLeave,navigate}){
 const [pending,setPending]=useState(''),[messages,setMessages]=useState({}),[refreshFailed,setRefreshFailed]=useState(false);
 const lock=useRef(false),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;onBusyChange?.(false);};},[onBusyChange]);
 const disabled=Boolean(busy||pending),owner=Boolean(selected.owner),open=!selected.room.closed;
 const canEdit=owner&&open&&selected.access?.canParticipate!==false;
 async function execute(section,path,values,success){
  if(lock.current||busy)return false;
  lock.current=true;setPending(section);onBusyChange?.(true);setMessages(previous=>({...previous,[section]:null}));
  try{
   const result=await accountRequest('/api/community'+path,{method:path==='/moderation'||path.includes('/advanced/')?'POST':'PATCH',data:values,csrf:auth?.csrf});
   if(!alive.current)return result;
   setMessages(previous=>({...previous,[section]:{text:success}}));
   try{await refresh();setRefreshFailed(false);}catch{if(alive.current){setRefreshFailed(true);setMessages(previous=>({...previous,[section]:{error:true,needsRefresh:true,text:'Your change was saved. Refresh the room to load its latest state.'}}));}}
   return result;
  }catch(error){if(alive.current)setMessages(previous=>({...previous,[section]:{error:true,text:error.message}}));if(error.code==='CONFLICT'){try{await refresh();}catch{}}return false;}
  finally{lock.current=false;if(alive.current){setPending('');onBusyChange?.(false);}}
 }
 async function recoverRefresh(){
  if(lock.current||busy)return;lock.current=true;setPending('refresh');onBusyChange?.(true);
  try{await refresh();if(alive.current){setRefreshFailed(false);setMessages(previous=>Object.fromEntries(Object.entries(previous).map(([key,message])=>[key,message?.needsRefresh?{text:'Room refreshed. Your saved change is loaded.'}:key==='refresh'?null:message])));}}
  catch(error){if(alive.current)setMessages(previous=>({...previous,refresh:{error:true,text:error.message}}));}
  finally{lock.current=false;if(alive.current){setPending('');onBusyChange?.(false);}}
 }
 const context={selected,me,profile,auth,disabled,pending,owner,canEdit,execute,confirm,messages,refresh,visible};
 return <ManageContext.Provider value={context}><section className="room-manage" aria-labelledby="room-manage-title">
  <header className="rm-heading"><div><h2 id="room-manage-title" tabIndex={-1}>Manage your room</h2><p>Invite your study partners, look after members and keep your room ready.</p></div><span>{selected.room.closed?'Closed room':selected.access?.advancedActive?'Advanced access':'Free room'} · {selected.members.length} {selected.members.length===1?'member':'members'}</span></header>
  {!open?<p className="rm-access" role="status">This room is closed. Its retained records are available to review.</p>:selected.access?.canParticipate===false&&<p className="rm-access" role="status">{selected.access.roomActive?'Your place is read only.':'This room is read only.'} Your membership and retained records are kept. {owner?'Review the active free room and places below.':'The room owner controls active places.'}</p>}
  {refreshFailed&&<button className="button rm-refresh" disabled={disabled} onClick={recoverRefresh}>{pending==='refresh'?'Refreshing room…':'Refresh room'}</button>}
  <Feedback section="refresh"/>
  <div className="rm-layout"><div className="rm-main"><RoomDetails/><RoomMemberSettings/></div><RoomInvitation/></div>
  <RoomAccessSelection/>
  {owner&&<RoomReports/>}
  <RoomManageGuide/>
  <section className="rm-rules" aria-labelledby="room-manage-rules-title"><h3 id="room-manage-rules-title" tabIndex={-1}>Room rules & privacy</h3><p>{communityRules()}</p><p>Use a nickname, not personal contact details. {STUDY_CHAT_RULES} Chat is visible to room members and kept for up to 30 days. Reports are kept for up to 90 days. Personal tasks and private activity reflections stay separate.</p><a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms of Use</a></section>
  <section className="rm-account-preferences" aria-labelledby="room-manage-preferences-title"><div><h3 id="room-manage-preferences-title">Your personal preferences</h3><p>Manage your nickname, public ranking and hidden messages in My Study Center.</p></div><a className="button" href="/account?view=community" onClick={navigate}>Manage personal preferences →</a></section>
  {owner&&open?<section className="rm-danger" aria-labelledby="room-manage-close-title"><h3 id="room-manage-close-title">Close this room</h3><p>Stops room timers, ends running activities and closes invitations. Retained records are kept. The room cannot be reopened.</p><button type="button" className="button danger" disabled={disabled} onClick={()=>confirm({title:'Close this room permanently?',body:'Room timers stop, upcoming activities are cancelled and invitations stop working. Retained records are kept. This room cannot be reopened.',action:'Close room',run:()=>execute('close','/rooms/'+selected.room.id+'/settings',{section:'close',close:true,version:selected.room.version},'Room closed. Retained records are kept.')})}>Close room</button><Feedback section="close"/></section>:!owner&&selected.member&&open&&<section className="rm-leave"><p>Leaving frees your place and pauses your room timer. Recorded study time is kept.</p><button className="button" disabled={disabled} onClick={onLeave}>Leave room</button></section>}
 </section></ManageContext.Provider>;
}

export function RoomDetails(){
 const {selected,disabled,canEdit,execute,pending}=useManage(),room=selected.room;
 const form=useRoomDraft(value=>roomFields(value.room)),{draft}=form;
 let custom='',validation='';if(draft.subject==='custom')try{custom=roomThemeInput(draft.custom);if(!custom)validation='Write a theme or choose a preset.';}catch(error){validation=error.message;}
 const needsReview=draft.subject==='custom'&&custom!==(room.customTheme||'');
 const reviewUnavailable=needsReview&&!selected.customThemesAvailable;
 async function save(event){event.preventDefault();if(!canEdit||disabled||!form.dirty||validation||reviewUnavailable||form.conflict)return;
  const result=await execute('details','/rooms/'+room.id+'/home',{name:draft.name,subject:draft.subject==='custom'?room.subject||'general':draft.subject,customTheme:custom,announcement:draft.announcement,version:draft.version},'Room details saved. Members can see the update.');if(result)form.saved(result);
 }
 return <section className="rm-section" aria-labelledby="room-manage-details-title"><h3 id="room-manage-details-title" tabIndex={-1}>Room details</h3>
  {canEdit?<form onSubmit={save} className="rm-form" aria-label="Room details" aria-busy={pending==='details'}>
   <label className="field">Room name<input id="room-manage-name" value={draft.name} minLength={2} maxLength={60} required disabled={disabled} onChange={event=>form.change({name:event.target.value})}/></label>
   <label className="field">Study theme<select value={draft.subject} disabled={disabled} onChange={event=>form.change({subject:event.target.value})}>{Object.entries(ACTIVITY_SUBJECTS).map(([id,label])=><option key={id} value={id}>{label}</option>)}<option value="custom">Custom study theme</option></select></label>
   <p className="help rm-field-note">Tell partners what you study here. Personal backgrounds and music are in Group tools.</p>
   {draft.subject==='custom'&&<div><label className="field">Custom study theme<input value={draft.custom} maxLength={80} required disabled={disabled} aria-describedby="rm-custom-help" aria-invalid={Boolean(validation)} onChange={event=>form.change({custom:event.target.value})}/></label><p className="help" id="rm-custom-help">2–{ROOM_THEME_LIMIT} characters. New text is checked before sharing.</p>{validation&&<p className="field-error">{validation}</p>}{reviewUnavailable&&<p className="rm-access" role="status">Custom theme review is paused. You can keep drafting, or choose a preset to save now.</p>}</div>}
   <label className="field">Pinned study notice<select value={draft.announcement} disabled={disabled} onChange={event=>form.change({announcement:event.target.value})}>{Object.entries(ROOM_NOTICES).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
   <Conflict conflict={form.conflict} reset={form.reset}/>
   <div className="rm-save-row" aria-live="polite">
    {form.dirty||pending==='details'?<>
     <button className="button primary" type="submit" disabled={disabled||Boolean(validation)||reviewUnavailable||form.conflict}>{pending==='details'?'Saving changes…':'Save changes'}</button>
     {pending!=='details'&&<span className="rm-unsaved">Unsaved changes</span>}
    </>:<p className="rm-saved-state"><span aria-hidden="true">✓</span> All changes saved</p>}
   </div>
   <Feedback section="details" editing={form.dirty}/>

  </form>:<dl className="rm-info"><div><dt>Room name</dt><dd>{room.name}</dd></div><div><dt>Study theme</dt><dd>{roomThemeLabel(room)}</dd></div><div><dt>Pinned study notice</dt><dd>{ROOM_NOTICES[room.announcement]||ROOM_NOTICES.welcome}</dd></div><div><dt>Who can edit?</dt><dd>{room.closed?'This room is closed.':'The room owner with an active place.'}</dd></div></dl>}
 </section>;
}

export function RoomInvitation(){
 const {selected,owner,canEdit,disabled,pending,execute,confirm,messages}=useManage(),room=selected.room;
 const inviteStale=Boolean(messages.invitation?.needsRefresh);
 const [copyState,setCopyState]=useState('idle');
 const [origin]=useState(()=>typeof location==='undefined'?'':location.origin);
 const copyLock=useRef(false);
 const link=owner&&room.inviteCode&&origin?origin+'/study-groups?invite='+room.inviteCode:'';
 const limit=selected.joinLimit||room.capacity,remaining=Math.max(0,limit-selected.members.length);
 useEffect(()=>{setCopyState('idle');},[link]);
 async function copy(){
  if(!link||!canEdit||disabled||inviteStale||copyLock.current)return;
  copyLock.current=true;setCopyState('copying');
  try{await navigator.clipboard.writeText(link);setCopyState('copied');}
  catch{setCopyState('error');}
  finally{copyLock.current=false;}
 }
 return <aside className="rm-invitation" aria-labelledby="room-manage-invite-title"><span className="rm-friendly" aria-hidden="true">💌</span><h3 id="room-manage-invite-title">Invite a study partner</h3>
  <p className="rm-invite-state" data-open={!room.closed&&room.invitationsOpen} role="status">{inviteStale?'Refresh to confirm invitation status':pending==='invitation'?'Updating invitation setting…':room.closed?'Room closed':room.invitationsOpen?'Invitations open':'Invitations paused'}</p>
  <p>{room.closed?'This room is closed.':remaining?remaining+' '+(remaining===1?'place available.':'places available.'):'This room is full.'}</p>
  {owner&&room.inviteCode?<>
   <label className="field">Room invitation link<input readOnly value={inviteStale?'':link} placeholder={inviteStale?'Refresh room to load the current link':'Preparing invitation link…'} onFocus={event=>event.currentTarget.select()}/></label>
   <div className="rm-copy-action">
    <button type="button" className="button primary" disabled={disabled||!link||!canEdit||inviteStale||copyState==='copying'} onClick={copy}>{copyState==='copying'?'Copying…':copyState==='copied'?'Copied ✓':'Copy invitation link'}</button>
    {!inviteStale&&copyState==='copied'&&<p role="status" className="rm-feedback">Invitation copied. Send it to your study partners.</p>}
    {copyState==='error'&&<p role="alert" className="field-error rm-feedback">Copying is unavailable. Select the link or code and copy it manually.</p>}
    {!room.closed&&(!room.invitationsOpen||remaining===0)&&<p className="help">{!room.invitationsOpen?'You can share this link now. Partners can join after invitations reopen.':'You can share this link now. Partners can join when a place becomes available.'}</p>}
   </div>
   <label className="field rm-invite-code">Invitation code<input readOnly value={inviteStale?'':room.inviteCode} onFocus={event=>event.currentTarget.select()}/></label>
   {canEdit?<>
    <label className="rm-toggle"><span className="rm-toggle-copy"><strong>Allow invitations and new joins</strong><small id="rm-invite-switch-help">{pending==='invitation'?'Saving invitation setting…':room.invitationsOpen?'On · new partners can join when a place is available.':'Off · existing members stay. New joins are paused.'} Changes save immediately.</small></span><span className="rm-switch"><input type="checkbox" role="switch" aria-describedby="rm-invite-switch-help" checked={room.invitationsOpen} disabled={disabled||inviteStale} onChange={event=>execute('invitation','/rooms/'+room.id+'/settings',{section:'invitation',invitationsOpen:event.target.checked,version:room.version},event.target.checked?'Invitations are open.':'Invitations paused. Existing members stay.')}/><span className="rm-switch-track" aria-hidden="true"/></span></label>
    <button className="button rm-replace" type="button" disabled={disabled||inviteStale} onClick={()=>confirm({title:'Replace the room invitation?',body:'Old links and codes stop admitting new members. Existing members stay in the room.',action:'Replace invitation',run:async()=>{const result=await execute('invitation','/rooms/'+room.id+'/settings',{section:'invitation',rotateInvite:true,version:room.version},'Invitation replaced. Share the new link with intended members.');if(result)setCopyState('idle');return result;}})}>Replace invitation code</button><Feedback section="invitation"/>
   </>:<p className="help">{room.closed?'Invitations stop when a room closes.':'Room invitations are read only while this room or your place is inactive.'}</p>}
  </>:<p className="rm-access">The room owner shares invitations and controls new joins.</p>}
  <p className="help rm-invitation-note">Share the invitation only with intended partners. Joining shares their nickname and room study time with members.</p>
 </aside>;
}

export function RoomMemberSettings(){
 const {selected,profile,owner,disabled,pending,execute,confirm}=useManage(),room=selected.room,cohosts=selected.cohosts||[];
 const manager=Boolean(selected.member&&(owner||selected.canManage)&&!room.closed);
 const form=useRoomDraft(value=>({ids:freeSeatIds(value),version:value.room.version,memberKey:value.members.map(member=>member.id).sort().join(',')}));
 const canSeats=owner&&!room.closed,slots=Math.max(0,Math.min(4,room.capacity)-1);
 const placeChanges=changedPlaceMembers(selected.members,form.baseline.ids,form.draft.ids,room.ownerId);
 const seatsChanged=placeChanges.length>0;
 const placesToPause=placeChanges.filter(member=>!form.draft.ids.includes(member.id));
 const openPlaces=Math.max(0,(selected.joinLimit||room.capacity)-selected.members.length);
 const membershipChanged=form.draft.memberKey!==selected.members.map(member=>member.id).sort().join(',');
 const canChangeMember=member=>manager&&member.id!==profile?.id&&member.id!==room.ownerId&&(owner||!cohosts.includes(member.id));
 const memberKey=selected.members.map(member=>member.id).sort().join(',');
 useEffect(()=>{if(!form.dirty)form.reset();},[memberKey]);
 async function memberAction(member,action){
  const run=()=>execute('members','/rooms/'+room.id+'/members',{profileId:member.id,action},action==='unban'?'Member can rejoin with a valid invitation.':'Member access updated.');
  if(action==='evict'||action==='ban')return confirm({title:action==='ban'?'Block '+member.nickname+' from rejoining?':'Remove '+member.nickname+' from this room?',body:action==='ban'?'Their room timer and access stop. They cannot rejoin until you allow it below. Recorded study time stays.':'Their room timer stops and their place is freed. They can return with a valid invitation when a place is available. Recorded time stays.',action:action==='ban'?'Block rejoining':'Remove member',run});
  return run();
 }
 async function saveSeats(event){event.preventDefault();if(!canSeats||disabled||!seatsChanged||form.conflict||membershipChanged)return;
  const removed=selected.members.filter(member=>member.id!==room.ownerId&&!member.readOnly&&!form.draft.ids.includes(member.id));
  const run=async()=>{const result=await execute('seats','/rooms/'+room.id+'/seats',{profileIds:form.draft.ids,version:form.draft.version},'Study places saved. The owner keeps their fixed place.');if(result)form.saved(result);return result;};
  if(!selected.access?.advancedActive&&removed.length)return confirm({title:'Change active free places?',body:'These members will become read only and their room timers will pause: '+removed.map(member=>member.nickname).join(', ')+'. Membership and recorded study time are kept.',action:'Save place changes',run});
  return run();
 }
 return <section className="rm-section rm-members" aria-labelledby="room-manage-members-title"><header className="rm-section-heading"><h3 id="room-manage-members-title" tabIndex={-1}>Members & places</h3><span>{selected.members.length}/{selected.joinLimit||room.capacity} members · {openPlaces} {openPlaces===1?'place':'places'} available</span></header>
  <p className="help">{selected.access?.advancedActive?'Choose which free places to keep after advanced access ends. Current advanced access stays active.':'The owner has one fixed place. Offline members keep their places.'}</p>
  <form onSubmit={saveSeats} className="rm-members-form" aria-label="Member places">
   <ul className="rm-member-list">{selected.members.map(member=><li key={member.id} id={'room-manage-member-'+member.id} tabIndex={-1}>
    <div className="rm-member-person"><span className="rm-avatar" aria-hidden="true">{member.nickname?.slice(0,1).toUpperCase()||'?'}</span><div><strong>{member.nickname}{member.id===profile?.id?' · You':''}</strong><p>{member.id===room.ownerId?'Room owner':cohosts.includes(member.id)?'Co-host':'Member'} · {member.readOnly?'Read-only place':member.studying?'Studying':member.online?'Online':'Offline'}</p></div></div>
    {canSeats&&(member.id===room.ownerId?<span className="rm-fixed-place">Owner · fixed place</span>:<label className="rm-member-place"><input type="checkbox" aria-label={(selected.access?.advancedActive?'Keep free place after advanced access for ':'Allow study in this room for ')+member.nickname} checked={form.draft.ids.includes(member.id)} disabled={disabled||!form.draft.ids.includes(member.id)&&form.draft.ids.length>=slots} onChange={event=>form.change({ids:event.target.checked?[...form.draft.ids,member.id]:form.draft.ids.filter(id=>id!==member.id)})}/><span>{selected.access?.advancedActive?'Keep after advanced access':'Can study in this room'}{placeChanges.some(changed=>changed.id===member.id)&&<small className="rm-pending-place">Pending change</small>}</span></label>)}
    {canChangeMember(member)&&<div className="rm-member-actions" role="group" aria-label={'Actions for '+member.nickname}>

     {owner&&(selected.access?.advancedActive||cohosts.includes(member.id))&&<label className="rm-role">Role<select aria-label={'Role for '+member.nickname} value={cohosts.includes(member.id)?'cohost':'member'} disabled={disabled||!cohosts.includes(member.id)&&cohosts.length>=2||!selected.access?.advancedActive&&!cohosts.includes(member.id)} onChange={event=>{const enabled=event.target.value==='cohost';confirm({title:enabled?'Make '+member.nickname+' a co-host?':'Remove co-host access?',body:enabled?'They can organise shared learning tools and moderate regular members. Only the owner changes room access and assigns co-hosts.':'Their room membership and records are kept.',action:enabled?'Make co-host':'Remove role',run:()=>execute('members','/rooms/'+room.id+'/advanced/roles',{profileId:member.id,enabled},'Member role saved.')});}}><option value="member">Member</option><option value="cohost">Co-host</option></select></label>}
     <button type="button" className="button rm-member-mute" disabled={disabled} onClick={()=>memberAction(member,member.muted_until>selected.serverNow?'unmute':'mute')}>{member.muted_until>selected.serverNow?'Unmute':'Mute for 1 hour'}</button>
     <button type="button" className="button rm-member-remove" disabled={disabled} onClick={()=>memberAction(member,'evict')}>Remove from room</button>
     <button type="button" className="button rm-block" disabled={disabled} onClick={()=>memberAction(member,'ban')}>Block rejoining</button>
    </div>}
   </li>)}</ul>
   {canSeats&&selected.members.length>1&&<>
    <Conflict conflict={form.conflict||membershipChanged} reset={form.reset}/>
    {seatsChanged?<div className="rm-place-changes" aria-live="polite">
     <div><strong>{placeChanges.length} {placeChanges.length===1?'place change':'place changes'} to save</strong>
      <p>{selected.access?.advancedActive?'These selections apply after advanced access ends.':placesToPause.length?placesToPause.map(member=>member.nickname).join(', ')+' will become read only. Their room timers will pause; they remain members.':'Selected partners can study after you save.'}</p>
     </div>
     <button type="submit" className="button primary" disabled={disabled||form.conflict||membershipChanged}>{pending==='seats'?'Saving places…':'Save place changes'}</button>
    </div>:<p className="rm-saved-state"><span aria-hidden="true">✓</span> {form.draft.ids.length+1}/{Math.min(4,room.capacity)} {selected.access?.advancedActive?'free places kept after advanced access':'study places active'}, including the owner</p>}
    <Feedback section="seats" editing={seatsChanged}/>
   </>}

  </form>
  <Feedback section="members"/>
  {owner&&(selected.removedMembers||[]).length>0&&<section className="rm-blocked"><h4>Blocked from rejoining</h4><ul>{selected.removedMembers.map(member=><li key={member.id}><span>{member.nickname}</span><button type="button" className="button" disabled={disabled||room.closed} onClick={()=>memberAction(member,'unban')}>Allow rejoining</button></li>)}</ul></section>}
  {owner&&!room.closed&&<RoomCapacitySettings/>}
 </section>;
}

function RoomCapacitySettings(){
 const {selected,canEdit,disabled,execute}=useManage(),room=selected.room,maximum=selected.ownerMemberLimit||4;
 const form=useRoomDraft(value=>({capacity:value.room.capacity,version:value.room.version}));
 if(maximum<=4&&room.capacity<=4)return null;
 return <form className="rm-capacity-form" aria-label="Room member limit" onSubmit={async event=>{event.preventDefault();if(!canEdit||disabled||form.conflict)return;const result=await execute('capacity','/rooms/'+room.id+'/settings',{section:'capacity',capacity:Number(form.draft.capacity),version:form.draft.version},'Room member limit saved.');if(result)form.saved(result);}}><label className="field">Member limit<input type="number" min={Math.max(2,selected.members.length)} max={maximum} value={form.draft.capacity} required disabled={disabled||!canEdit||selected.members.length>maximum} onChange={event=>form.change({capacity:event.target.value})}/></label><p className="help">Current allowance: up to {maximum} places. Existing memberships are retained. A limit cannot be smaller than the current membership. {selected.members.length>maximum&&'Reduce membership before lowering the room limit to the current allowance.'}</p><Conflict conflict={form.conflict} reset={form.reset}/><button className="button" disabled={disabled||!canEdit||!form.dirty||form.conflict||selected.members.length>maximum}>Save member limit</button><Feedback section="capacity"/></form>;
}

function RoomAccessSelection(){
 const {selected,me,profile,owner,disabled,execute,confirm}=useManage(),access=selected.access;
 const rooms=(me?.rooms||[]).filter(room=>room.owner_id===profile?.id&&!room.closed_at);
 const [chosen,setChosen]=useState(access?.freeRoomId||selected.room.id);
 useEffect(()=>{setChosen(access?.freeRoomId||selected.room.id);},[access?.freeRoomId,selected.room.id]);
 if(!owner||selected.room.closed)return null;
 if(rooms.length<=1&&access?.roomActive)return <p className="rm-plan-note">{access.advancedActive?'This room has advanced access.':'This room is active within your free allowance.'} Free access includes one active room and four places.</p>;
 const current=rooms.find(room=>room.id===access?.freeRoomId);
 async function save(event){event.preventDefault();if(disabled)return;
  const run=()=>execute('access','/room-access',{roomId:chosen,version:me?.freeRoomSelection?.version||0},'Active free room saved. Recorded study time is kept.');
  if(chosen===access?.freeRoomId)return;
  confirm({title:access?.advancedActive?'Choose the room to keep after advanced access ends?':'Switch your active free room?',body:access?.advancedActive?'Your eligible rooms stay active for now. This selection determines the free room kept after advanced access ends.':'Rooms losing active access become read only and their room timers pause. Membership and recorded study time are kept.',action:'Save free room',run});
 }
 return <section className="rm-section rm-access-selection" aria-labelledby="room-manage-access-title"><h3 id="room-manage-access-title">{access?.advancedActive?'Free room after advanced access ends':'Your active free room'}</h3><p>Free access includes one active room and four places. {current?'Current free room: '+current.name+'.':''}</p><form onSubmit={save} className="rm-form"><label className="field">Room to keep active<select value={chosen} disabled={disabled} onChange={event=>setChosen(event.target.value)}>{rooms.map(room=><option key={room.id} value={room.id}>{room.name}</option>)}</select></label><button className="button" disabled={disabled||chosen===access?.freeRoomId}>Save free room</button></form><Feedback section="access"/></section>;
}

function RoomReports(){
 const {selected,auth,visible,disabled,execute,confirm}=useManage();
 const [reports,setReports]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 const request=useRef(0);
 async function load(){const ticket=++request.current;setLoading(true);try{const result=await accountRequest('/api/community/moderation?room='+selected.room.id,{csrf:auth?.csrf});if(ticket===request.current){setReports(result.reports.filter(report=>report.room_id===selected.room.id));setError('');}}catch(error){if(ticket===request.current)setError(error.message);}finally{if(ticket===request.current)setLoading(false);}}
 useEffect(()=>{if(visible)load();return()=>{request.current++;};},[visible,selected.room.id]);
 async function review(report,action){const run=async()=>{const result=await execute('reports','/moderation',{id:report.id,action},'Report reviewed.');if(result)await load();return result;};if(action==='remove')confirm({title:'Block the reported member?',body:'Their room timer and access stop. Their recorded study time is kept.',action:'Block member',run});else await run();}
 return <section className="rm-section rm-reports" aria-labelledby="room-manage-reports-title"><header className="rm-section-heading"><h3 id="room-manage-reports-title">Reports in this room</h3><span>{reports?reports.length+' open':loading?'Loading…':''}</span></header>{error?<p role="alert" className="field-error">{error} <button className="text-button" disabled={loading||disabled} onClick={load}>Retry reports</button></p>:reports===null?<p role="status">Loading room reports…</p>:reports.length===0?<p className="help">No open reports in this room.</p>:<ul className="rm-report-list">{reports.map(report=><li key={report.id}><strong>{report.reason} · {report.author||'Former member'}</strong><blockquote>{report.excerpt}</blockquote>{report.detail&&<p>{report.detail}</p>}<div className="rm-member-actions">{[['hide','Hide message'],['mute','Mute 24h'],['remove','Block member'],['dismiss','Dismiss report']].map(([action,label])=><button className="button" key={action} disabled={disabled} onClick={()=>review(report,action)}>{label}</button>)}</div></li>)}</ul>}<Feedback section="reports"/></section>;
}
