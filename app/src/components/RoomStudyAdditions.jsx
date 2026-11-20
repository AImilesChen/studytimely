import {useState} from 'react';
import {ArrowRight,BookOpen,CalendarBlank,ChartBar,MusicNotes,UsersThree,ShieldCheck} from '@phosphor-icons/react';
import {GroupTools} from './GroupTools.jsx';
import {roomAccessNotice} from '../lib/room-presentation.mjs';


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
export function RoomAdvancedArea({selected,me,busy,onPreview,onManage,onReports,view,onView,...tools}){
 const [retained,setRetained]=useState(false),available=!!selected.access?.advancedActive;
 const canTry=selected.owner&&me?.entitlements?.source==='free'&&me.entitlements.previewAvailable;
 return <section className="room-advanced-area" aria-labelledby="room-advanced-title"><header><span className="eyebrow">ADDITIONS TO YOUR STUDY ROOM</span><h2 id="room-advanced-title">Advanced group tools</h2><p>Your four-person room, personal timers, quick updates, single activities and basic progress remain free.</p></header>{!available&&<div className="room-advanced-intro"><div className="room-advanced-feature-grid">{features.map(([Icon,title,text])=><article key={title}><Icon size={21}/><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>{canTry?<div className="room-preview-action"><button className="button primary" disabled={busy} onClick={()=>onPreview(true)}>Try advanced groups <ArrowRight size={17}/></button><p>Optional free preview · no payment or subscription is created.</p></div>:<p className="help">{selected.owner?'The advanced preview is not currently available. Your free room features remain available within your allowance.':'The room owner controls shared advanced access. You do not need your own subscription to participate in an eligible room. Free-text sending still requires your own eligible access and available safety review.'}</p>}</div>}{!available&&<details className="room-retained-tools" onToggle={e=>setRetained(e.currentTarget.open)}><summary>View retained advanced content</summary><p className="help">Review saved tasks, repeating activities and reports without changing your access.</p></details>}{(available||retained)&&<><div className="group-task-switch" role="group" aria-label="Advanced tool sections">{[['tasks','Shared tasks'],['series','Repeating activities'],['challenge','Shared challenge'],['study','Scene & music']].map(([id,label])=><button className="button" key={id} data-tone={id} aria-pressed={view===id} onClick={()=>onView(id)}>{label}</button>)}<button className="button" onClick={onReports}>Weekly reports</button><button className="button" onClick={onManage}>Co-hosts & room management</button></div><GroupTools key={selected.room.id+view} {...tools} selected={selected} view={view}/></>}</section>;
}

export {RoomProgress} from './RoomProgress.jsx';

export {RoomStudyGuide} from './RoomStudyGuide.jsx';
