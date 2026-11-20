import {CalendarBlank,ArrowRight,NotePencil} from '@phosphor-icons/react';

export function RoomActivityNotice({notice,error,onOpen}){
 if(!notice&&!error)return null;
 const Icon=notice?.action==='result'?NotePencil:CalendarBlank;
 return <aside className="room-activity-notice" aria-label="Study activity shortcut" data-state={notice?.state||'error'}>
  <Icon size={21} aria-hidden="true"/>
  <div><strong>{notice?.title||'Study activities could not be loaded'}</strong><span>{notice?.description||'Open activities to check the connection and try again.'}</span></div>
  <button type="button" className="button" onClick={()=>onOpen(notice)}>{notice?.label||'View activities'}<ArrowRight size={17} aria-hidden="true"/></button>
 </aside>;
}
