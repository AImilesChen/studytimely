import {useState} from 'react';
import {ArrowRight,BookOpen,CalendarBlank,ChartBar,MusicNotes,UsersThree,ShieldCheck,Clock,Target,Archive,Info,CaretDown,Play,Copy} from '@phosphor-icons/react';
import {GroupTools} from './GroupTools.jsx';
import {roomAccessNotice,roomGoalProgress} from '../lib/room-presentation.mjs';
import {activityDuration} from '../lib/group-activities.mjs';

export function RoomAccessNotice({selected,me,busy,onSelect,onOpen,onManage}){
 const notice=roomAccessNotice(selected,me?.rooms);
 if(!notice)return null;
 return <section className="room-access-explanation" aria-label="Room access"><strong>{notice.title}</strong><p>{notice.body}</p><div className="community-row">{notice.canChoose&&<button className="button primary" disabled={busy} onClick={()=>onSelect(selected.room.id,me?.freeRoomSelection?.version||0)}>Use this as my free room</button>}{notice.freeRoomId&&notice.freeRoomId!==selected.room.id&&<button className="button" disabled={busy} onClick={()=>onOpen(notice.freeRoomId)}>Open the active free room</button>}<button className="text-button" onClick={onManage}>{selected.owner?'Review room access':'View room access'}</button></div><p className="help">Advanced tools are separate. An active free room includes personal timers, quick messages and single activities.</p></section>;
}

const features=[
 [UsersThree,'More rooms & places','Up to ten owned rooms and up to 24 places per room.'],
 [BookOpen,'Shared tasks','Work on a shared step while keeping personal plans private.'],
 [CalendarBlank,'Repeating appointments','Keep a regular study time and review future dates.'],
 [ChartBar,'Challenges & weekly reports','Review confirmed group time and export weekly totals.'],
 [ShieldCheck,'Co-hosts','Up to two members can help organise the room.'],
 [MusicNotes,'Room atmosphere','Recommend a scene and music; each member chooses whether to use them.']
];
export function RoomAdvancedArea({selected,me,busy,onPreview,onManage,view,onView,...tools}){
 const [retained,setRetained]=useState(false),available=!!selected.access?.advancedActive;
 const canTry=selected.owner&&me?.entitlements?.source==='free'&&me.entitlements.previewAvailable;
 return <section className="room-advanced-area" aria-labelledby="room-advanced-title"><header><span className="eyebrow">ADDITIONS TO YOUR STUDY ROOM</span><h2 id="room-advanced-title">Advanced group tools</h2><p>Your four-person room, personal timers, quick updates, single activities and basic progress remain free.</p></header>{!available&&<div className="room-advanced-intro"><div className="room-advanced-feature-grid">{features.map(([Icon,title,text])=><article key={title}><Icon size={21}/><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>{canTry?<div className="room-preview-action"><button className="button primary" disabled={busy} onClick={()=>onPreview(true)}>Try advanced groups <ArrowRight size={17}/></button><p>Optional free preview · no payment or subscription is created.</p></div>:<p className="help">{selected.owner?'The advanced preview is not currently available. Your free room features remain available within your allowance.':'The room owner controls shared advanced access. You do not need your own subscription to participate in an eligible room. Free-text sending still requires your own eligible access and available safety review.'}</p>}</div>}{!available&&<details className="room-retained-tools" onToggle={e=>setRetained(e.currentTarget.open)}><summary>View retained advanced content</summary><p className="help">Review saved tasks, repeating activities and reports without changing your access.</p></details>}{(available||retained)&&<><div className="group-task-switch" role="group" aria-label="Advanced tool sections">{[['tasks','Shared tasks'],['series','Repeating activities'],['progress','Weekly reports & challenges'],['study','Scene & music']].map(([id,label])=><button className="button" key={id} data-tone={id} aria-pressed={view===id} onClick={()=>onView(id)}>{label}</button>)}<button className="button" onClick={onManage}>Co-hosts & room management</button></div><GroupTools key={selected.room.id+view} {...tools} selected={selected} view={view}/></>}</section>;
}

export function RoomProgress({totals,goalMinutes,formatDuration}){
 const progress=roomGoalProgress(totals.today_seconds,goalMinutes);
 return <section className="room-progress-card" aria-label="Shared room progress" data-complete={progress.complete}>
  <div className="room-progress-title"><span><ChartBar size={20}/>Shared progress today</span><strong>{progress.label}</strong></div>
  <div className="room-progress-metrics">
   <div><span><Clock size={17}/>Today · UTC</span><strong>{formatDuration(totals.today_seconds)}</strong><small>Members’ verified room time</small></div>
   <div><span><Target size={17}/>Daily shared goal</span><strong>{goalMinutes} min</strong><small>All members contribute</small></div>
   <div><span><Archive size={17}/>Retained room time</span><strong>{formatDuration(totals.total_seconds)}</strong><small>Across retained room records</small></div>
  </div>
  <progress aria-label="Daily shared study goal progress" aria-valuetext={progress.label+' of the daily shared goal'} max={progress.goalSeconds} value={progress.value}/>
  <details className="room-progress-explanation"><summary><Info size={17}/>How this is calculated<CaretDown size={17}/></summary><p>Verified study time from all members in this room adds together. For example, 4 people × 30 minutes = 120 minutes. Today resets at midnight UTC. Reaching the goal does not stop anyone’s timer.</p><p>Retained room time covers the room records that are still kept, not a lifetime total or your private study history. Messages, registrations and completed tasks do not add study time.</p></details>
 </section>;
}

export function RoomStudyGuide({navigate,canInvite=false,canPlan=false,canParticipate=false,onInvite,onMembers,onStudy,onPlan,onAccess,onProgress,totals,feedback='',busy=false}){
 const today=Math.max(0,Number(totals?.today_seconds)||0);
 return <section className="room-study-guide" aria-labelledby="room-study-guide-title">
  <header><h2 id="room-study-guide-title">Your next step</h2><p>{today>0?`${activityDuration(today)} recorded together today · UTC. Review your progress or arrange your next session.`:'Study straight away from your own place. Arranging an activity is optional.'}</p></header>
  <div className="room-next-actions"><button className="button" onClick={onProgress}><ChartBar size={17}/>View group progress<ArrowRight size={16}/></button><button className="button" disabled={busy} onClick={onPlan}><CalendarBlank size={17}/>{canPlan?'Plan next activity':'View activities'}<ArrowRight size={16}/></button></div>
  {feedback&&<p className="room-guide-feedback" role="status">{feedback}</p>}
  <details className="room-study-help"><summary><span><Info size={18}/>Room help &amp; common questions</span><CaretDown size={18}/></summary><div className="room-help-body">
  <div className="room-help-shortcuts">
   <div><span><strong>Bring a partner</strong><small>Offline members keep their places.</small></span><button className="text-button" disabled={busy} onClick={canInvite?onInvite:onMembers}>{canInvite?<Copy size={17}/>:<UsersThree size={17}/>} {canInvite?'Copy invitation':'View members'}</button></div>
   <div><span><strong>Find your timer</strong><small>Each person starts and pauses their own study.</small></span><button className="text-button" onClick={canParticipate?onStudy:onAccess}><Play size={17}/>{canParticipate?'Go to my place':'Review room access'}</button></div>
  </div>
  <div className="room-guide-questions">
   <details><summary>Do I need to join an activity first?<CaretDown size={18}/></summary><p>No. In Study together, use Start studying on your own place whenever you are ready. Study activities is optional: use it to agree a time, bring a private task and add a result afterwards. The host starts the shared schedule; each person still starts their own timer.</p></details>
   <details><summary>Why do room and activity timers show different times?<CaretDown size={18}/></summary><p>Your place shows your own elapsed study time. Study activities shows how much time remains in the shared study or break interval. Pausing yourself does not pause the group schedule. Both views use the same personal room timer; recorded activity time is not added twice.</p></details>
   <details><summary>Where can I add my result and private reflection?<CaretDown size={18}/></summary><p>Open Study activities, select the activity you joined and choose Finish &amp; add result. Your selected result is shared with members; your optional reflection is private. Saving stops your participation in that activity. Opening or cancelling the form does not submit it.</p></details>
   <details><summary>What do the learning states mean?<CaretDown size={18}/></summary><p>Studying means a connected room timer is running. Ready, break, check-in needed and offline describe timer or connection state; none proves attention. Reading away from the keyboard is still learning.</p></details>
   <details><summary>What remains free?<CaretDown size={18}/></summary><p>One active owned room with four places, personal room timers, quick messages and stickers, gentle interactions, single activities, basic progress and essential member management. Advanced tools add to these features.</p></details>
   <details><summary>How do we communicate and stay safe?<CaretDown size={18}/></summary><p>Use fixed updates and study stickers, or a silent tap or cheer when the member allows it. Open All messages &amp; safety to review, report or hide messages. Free text has separate access and safety-review requirements.</p></details>
   <details><summary>Can the owner remove someone, and can I leave?<CaretDown size={18}/></summary><p>Members can leave through the Members and room-action controls. Owners can remove members, mute messages or prevent rejoining. These essential controls do not require an advanced preview.</p></details>
  </div></div></details>
  <nav aria-label="Tools for your next study session">{[['/','Study Timer'],['/study-planner','Personal study plan'],['/study-tracker','Personal study analytics']].map(([href,label])=><a key={href} href={href} onClick={navigate}>{label}<ArrowRight size={15}/></a>)}</nav>
 </section>;
}
