import {roomThemeLabel} from './room-theme.mjs';
import {invitationCode} from './community-entry.mjs';
import {beginRoomTimer,pauseRoomTimer,readRoomLease,roomClock} from './room-timer-client.mjs';

export function groupStatus(room){
 if(room.closed_at||room.closed)return{key:'closed',label:'Closed · records kept',description:'This room is closed. Its retained records are still available.'};
 if(room.can_participate===1||room.can_participate===true)return{key:'ready',label:'Ready to study',description:'You have an active place. Start your own timer when you are ready.'};
 if(room.room_active===0||room.room_active===false)return{key:'room',label:'Room is read only',description:'This room is not active under the owner’s current room allowance. Records and membership are kept.'};
 if(room.room_active===1||room.room_active===true)return{key:'seat',label:'No active place',description:'The room is active, but you do not have an active place. The owner chooses the available places.'};
 return{key:'unknown',label:'Checking access',description:'Refresh room access before starting. Availability has not been confirmed.'};
}
export function selectDefaultGroup(rooms,timer,preferred=''){
 return rooms.find(r=>r.id===timer?.room_id&&timer.status==='running')?.id||rooms.find(r=>r.id===preferred&&r.can_participate)?.id||rooms.find(r=>r.can_participate&&!r.closed_at)?.id||rooms.find(r=>!r.closed_at)?.id||rooms[0]?.id||'';
}
export function nextGroupActivity(activities,at){return activities.filter(a=>a.status==='running'&&a.startedAt+(a.focusMinutes+a.breakMinutes)*60000>at||a.status==='scheduled').sort((a,b)=>(a.status==='running'?0:1)-(b.status==='running'?0:1)||a.startsAt-b.startsAt)[0]||null;}
export function groupDirectory(rooms,{subject='',available=true,query=''}={}){
 const text=query.trim().toLowerCase();return rooms.filter(r=>(!subject||r.subject===subject)&&(!available||!r.readOnly&&r.members<(r.joinLimit||r.capacity))&&(!text||(r.name+' '+roomThemeLabel(r)).toLowerCase().includes(text)));
}

export class MyGroupsClient{
 constructor({request,accountId='',storage,origin='https://studytimely.com',now=Date.now,uuid=()=>crypto.randomUUID()}){
  Object.assign(this,{request,accountId,storage,origin,now,uuid});this.listeners=new Set();this.disposed=false;this.sequence={me:0,room:0,directory:0};this.mutation=0;this.locked=false;this.lease=readRoomLease(storage);this.timerAt=0;this.offset=0;this.createRequest=null;
  this.state={me:null,meStatus:accountId?'loading':'guest',rooms:[],directoryStatus:'loading',selectedId:'',detail:null,detailStatus:'idle',activities:[],activityStatus:'idle',busy:false,error:'',notice:'',invitation:null,updatedAt:0};
 }
 subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
 set(patch){if(this.disposed)return;this.state={...this.state,...patch};for(const listener of this.listeners)listener(this.state);}
 dispose(){this.disposed=true;this.sequence.me++;this.sequence.room++;this.sequence.directory++;this.listeners.clear();}
 activate(){this.disposed=false;}
 clock(){return this.now()+this.offset;}
 syncClock(at){if(Number.isFinite(at)&&at>0)this.offset=at-this.now();}
 selectionKey(){return 'studytimely-my-group:'+this.accountId;}
 preferred(){try{return this.storage?.getItem(this.selectionKey())||'';}catch{return '';}}
 async refreshMe(){
  if(!this.accountId)return;const sequence=++this.sequence.me,epoch=this.mutation;
  try{const me=await this.request('/me');if(this.disposed||sequence!==this.sequence.me||epoch!==this.mutation)return;
   this.syncClock(me.serverNow);if(me.serverNow<this.timerAt)me.timer=this.state.me?.timer||null;else this.timerAt=me.serverNow||this.clock();
   const selectedId=me.rooms.some(r=>r.id===this.state.selectedId)?this.state.selectedId:selectDefaultGroup(me.rooms,me.timer,this.preferred());
   this.set({me,meStatus:'ready'});if(selectedId!==this.state.selectedId)await this.select(selectedId);
  }catch(e){if(this.disposed||sequence!==this.sequence.me)return;this.set({meStatus:'error',...(e.status===401?{me:null,detail:null}:{}),error:e.message});}
 }
 async refreshDirectory(){
  const sequence=++this.sequence.directory;
  try{const value=await this.request('/rooms');if(!this.disposed&&sequence===this.sequence.directory)this.set({rooms:value.rooms,directoryStatus:'ready',directoryAt:this.now()});}
  catch(e){if(!this.disposed&&sequence===this.sequence.directory)this.set({directoryStatus:'error',directoryError:e.message});}
 }
 async refresh(){const previous=this.state.selectedId;await Promise.all([this.refreshMe(),this.refreshDirectory()]);if(previous&&previous===this.state.selectedId)await this.refreshSelected();}
 async select(id){
  if(id&&!this.state.me?.rooms.some(r=>r.id===id))return;
  this.sequence.room++;this.set({selectedId:id,detail:null,detailStatus:id?'loading':'idle',activities:[],activityStatus:id?'loading':'idle',error:'',notice:''});
  try{if(id)this.storage?.setItem(this.selectionKey(),id);}catch{}
  if(id)await this.refreshSelected();
 }
 async refreshSelected(){
  const id=this.state.selectedId;if(!id||!this.state.me?.profile)return;const sequence=++this.sequence.room;
  const current=()=>!this.disposed&&id===this.state.selectedId&&sequence===this.sequence.room;
  await Promise.all([
   this.request('/rooms/'+id).then(detail=>{if(!current())return;this.syncClock(detail.serverNow);this.set({detail,detailStatus:'ready',updatedAt:this.now()});}).catch(e=>{if(current())this.set({detailStatus:'error',...(e.status===403||e.status===404?{detail:null}:{}),roomError:e.message});}),
   this.request('/rooms/'+id+'/activities').then(value=>{if(current())this.set({activities:value.activities,activityStatus:'ready'});}).catch(e=>{if(current())this.set({activityStatus:'error',activityError:e.message});})
  ]);
 }
 async run(operation){
  if(this.locked||this.disposed||!this.accountId)return false;this.locked=true;this.mutation++;this.set({busy:true,error:'',notice:''});
  try{return await operation()||true;}catch(e){if(!this.disposed){if(['CONFLICT','ROOM_LIMIT','ROOM_READ_ONLY','ACTIVE_TIMER','LEASE'].includes(e.code))await this.refresh();this.set({error:e.message,...(e.status===401?{me:null,meStatus:'error',detail:null}:{} )});}return false;}
  finally{this.locked=false;this.set({busy:false});}
 }
 acceptTimer(value){
  if(this.disposed)return;this.syncClock(value.serverNow);if((value.serverNow||0)<this.timerAt)return;this.timerAt=value.serverNow||this.clock();
  this.set({me:{...this.state.me,timer:value.timer},...(value.needsCheck?{notice:'Check in to continue your room timer. Unconfirmed gaps do not add minutes.'}:{}),...(value.capReached?{notice:'Your UTC daily room-time limit is reached. Your confirmed records are kept.'}:{})});
 }
 async timerStart(activityId){return this.run(async()=>{
  const detail=this.state.detail,id=this.state.selectedId;
  if(!detail?.member||detail.room.closed||detail.access?.canParticipate!==true)throw Error('An active room place is required before studying.');
  if(roomClock(this.state.me?.timer,this.lease,this.clock(),id).live)throw Error('A room timer is already running. Pause it before starting another.');
  const result=await beginRoomTimer(this.request,this.storage,{roomId:id,activityId});this.lease=result.timer.lease;this.acceptTimer(result);await this.refreshSelected();this.set({notice:'Your room timer has started. Pause when you step away; check in when prompted.'});return true;
 });}
 async timerPause(){return this.run(async()=>{
  const timer=this.state.me?.timer;if(!timer||timer.lease!==this.lease)throw Error('This timer is controlled by another tab or device. Pause it there first.');
  const result=await pauseRoomTimer(this.request,this.lease);this.acceptTimer(result);await this.refreshSelected();this.set({notice:'Timer paused. Confirmed room minutes are kept; breaks do not count.'});return true;
 });}
 async saveProfile(values){return this.run(async()=>{await this.request('/profile','PUT',{nickname:values.nickname,accepted:values.accepted,publicRanking:false});await this.refreshMe();this.set({notice:'Nickname saved. Public ranking stays off unless you choose it in Account & data.'});return true;});}
 async findInvitation(text){return this.run(async()=>{
  const code=invitationCode(text,this.origin);if(!/^[a-f0-9]{24}$/i.test(code))throw Error('Use the 24-character room invitation code or its StudyTimely invitation link.');
  const result=await this.request('/invite','POST',{code});
  if(result.room.alreadyMember){await this.refreshMe();await this.select(result.room.id);this.set({invitation:null,notice:'You already belong to this room. Its current access is shown above.'});}
  else this.set({invitation:{room:result.room,code},notice:'Review the room and what members can see before confirming.'});return true;
 });}
 previewPublic(room){if(room.readOnly||room.members>=(room.joinLimit||room.capacity))return;this.set({invitation:{room,code:''},notice:'Review this public room before joining.',error:''});}
 dismissInvitation(){if(!this.locked)this.set({invitation:null});}
 async join(accepted){return this.run(async()=>{
  const preview=this.state.invitation;if(!preview||!accepted)throw Error('Confirm the room-sharing notice before joining.');if(preview.room.readOnly||preview.room.members>=(preview.room.joinLimit||preview.room.capacity))throw Error('This room has no available place. Ask the owner to review access or choose another room.');
  await this.request('/rooms/'+preview.room.id+'/join','POST',{code:preview.code,accepted:true});await this.refreshMe();await this.select(preview.room.id);this.set({invitation:null,notice:'You joined the room. Your timer starts only when you choose Start my study.'});return true;
 });}
 async create(values){return this.run(async()=>{
  if(!this.state.me?.profile)throw Error('Save your community nickname first.');
  const payload={name:values.name.trim(),subject:values.subject,visibility:values.visibility,capacity:4,goalMinutes:120},signature=JSON.stringify(payload);
  if(this.createRequest?.signature!==signature)this.createRequest={id:this.uuid(),signature};
  const result=await this.request('/rooms','POST',{id:this.createRequest.id,...payload});this.createRequest=null;await this.refreshMe();await this.select(result.id);this.set({notice:'Room created. Invite a partner or start your own study timer.'});return true;
 });}
 async useFreeRoom(confirmed){return this.run(async()=>{
  const detail=this.state.detail;if(!confirmed||!detail?.owner||detail.room.closed)throw Error('Review the free-room switch before confirming.');
  await this.request('/room-access','PATCH',{roomId:this.state.selectedId,version:this.state.me?.freeRoomSelection?.version||0});await this.refreshMe();await this.refreshSelected();this.set({notice:'Active free room updated. Previous records and memberships are kept.'});return true;
 });}
 async joinActivity(activity,values){return this.run(async()=>{
  const id=this.state.selectedId,detail=await this.request('/rooms/'+id+'/activities/'+activity.id);
  if(detail.own&&detail.own.withdrawnAt===0)throw Error('You already joined this activity. Refresh its status.');
  await this.request('/rooms/'+id+'/activities/'+activity.id+'/participation','PUT',{subject:values.subject,task:values.task,version:detail.own?.version||0});await this.refreshSelected();this.set({notice:'Place reserved. Joining does not start your timer; your task stays private.'});return true;
 });}
}
