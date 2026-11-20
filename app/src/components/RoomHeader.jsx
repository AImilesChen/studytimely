import {BookOpen,LockSimple,Globe} from '@phosphor-icons/react';
import {RoomToolbar} from './RoomMembers.jsx';
import {roomThemeLabel} from '../lib/room-theme.mjs';

export function RoomHeader({selected,busy,onMembers,onSettings,onLeave}){
 const {room,members}=selected,privateRoom=room.visibility==='private',VisibilityIcon=privateRoom?LockSimple:Globe;
 const access=selected.access,plan=access?.advancedActive?(access.source==='preview'?'Advanced preview':'Advanced room'):'Free room';
 return <header className="room-workspace-header">
  <div className="room-identity">
   <div className="room-identity-title"><h1>{room.name}</h1><span className="room-visibility"><VisibilityIcon size={14}/>{privateRoom?'Private room':'Public room'}</span></div>
   <div className="room-identity-meta"><span className="room-header-theme"><BookOpen size={15}/>{roomThemeLabel(room)}</span><span className="room-plan-marker">{plan} · {access?.memberLimit||selected.joinLimit||4} places</span></div>
  </div>
  <div className="room-header-actions">
   <RoomToolbar selected={selected} busy={busy} onMembers={onMembers} onSettings={onSettings} onLeave={onLeave}/>
   <div className="room-presence" aria-label="Room attendance"><span>{members.length}/{room.capacity} members</span><span>{members.filter(member=>member.online).length} online</span><span>{members.filter(member=>member.studying).length} studying</span>{!selected.member&&members.length>=(selected.joinLimit||room.capacity)&&<strong className="room-full">Full</strong>}</div>
  </div>
 </header>;
}
