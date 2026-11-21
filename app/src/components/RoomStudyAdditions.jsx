import {roomAccessNotice} from '../lib/room-presentation.mjs';


export function RoomAccessNotice({selected,me,busy,onSelect,onOpen,onManage}){
 const notice=roomAccessNotice(selected,me?.rooms);
 if(!notice)return null;
 return <section className="room-access-explanation" aria-label="Room access"><strong>{notice.title}</strong><p>{notice.body}</p><div className="community-row">{notice.canChoose&&<button className="button primary" disabled={busy} onClick={()=>onSelect(selected.room.id,me?.freeRoomSelection?.version||0)}>Use this as my free room</button>}{notice.freeRoomId&&notice.freeRoomId!==selected.room.id&&<button className="button" disabled={busy} onClick={()=>onOpen(notice.freeRoomId)}>Open the active free room</button>}<button className="text-button" onClick={onManage}>{selected.owner?'Review room access':'View room access'}</button></div><p className="help">Advanced tools are separate. An active free room includes personal timers, quick messages and single activities.</p></section>;
}

export {RoomAdvancedArea} from './RoomGroupTools.jsx';

export {RoomProgress} from './RoomProgress.jsx';

export {RoomStudyGuide} from './RoomStudyGuide.jsx';
