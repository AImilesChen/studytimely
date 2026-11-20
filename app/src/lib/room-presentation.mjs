// Presentation only: server-provided participation/access remains authoritative.
export function roomGoalProgress(seconds,goalMinutes){
 const today=Number.isFinite(seconds)?Math.max(0,seconds):0,goalSeconds=Number.isFinite(goalMinutes)&&goalMinutes>0?goalMinutes*60:60;
 const percent=Math.min(100,today/goalSeconds*100),complete=today>=goalSeconds;
 const label=complete?'100%':percent===0?'0%':percent<0.1?'<0.1%':`${Math.min(99.9,Number(percent.toFixed(1)))}%`;
 return {today,goalSeconds,value:Math.min(today,goalSeconds),label,complete};
}
export function companionRoster({members,profileId,limit=4,search='',page=0,closed=false}){
 const query=search.trim().toLowerCase(),size=limit<=4?4:6;
 const ordered=[...members].sort((a,b)=>a.id===profileId?-1:b.id===profileId?1:Number(!!a.readOnly)-Number(!!b.readOnly)||a.nickname.localeCompare(b.nickname));
 const filtered=ordered.filter(m=>m.nickname.toLowerCase().includes(query)),pages=Math.max(1,Math.ceil(filtered.length/size)),current=Math.min(Math.max(0,page),pages-1);
 const emptySeats=closed||query||current>0?0:Math.max(0,Math.min(4,limit)-members.length);
 return {members:filtered.slice(current*size,(current+1)*size),pages,page:current,emptySeats,extraPlaces:closed||query?0:Math.max(0,limit-members.length-emptySeats),fourSeats:limit<=4};
}
export function roomAccessNotice(selected,rooms=[]){
 if(!selected?.member||selected.room.closed||selected.access?.canParticipate!==false)return null;
 const access=selected.access,freeRoom=rooms.find(r=>r.id===access.freeRoomId);
 if(!access.roomActive)return {kind:'room',title:'This room is outside the active room allowance',body:access.source==='free'?(freeRoom?`Your free room is currently “${freeRoom.name}”. This room and its records are kept, but its timers and messages are paused.`:'Your free allowance includes one active room. This room and its records are kept, but its timers and messages are paused.'):'This room is outside the current active-room allowance. Its records are kept.',canChoose:!!selected.owner&&access.source==='free',freeRoomId:access.freeRoomId};
 return {kind:'seat',title:'Your place is currently read only',body:`This room currently has ${access.memberLimit} active places. The owner can review which members keep active places; your membership and records are kept.`,canChoose:false};
}
