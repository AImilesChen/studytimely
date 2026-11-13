// Only the authenticated outer Worker can address this Durable Object namespace.
export class StudyRoom {
 constructor(ctx,env){this.ctx=ctx;this.env=env;ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('keepalive','alive'));}
 async valid(a){
  if(!a)return false;const at=Date.now();
  return !!await this.env.DB.prepare(`SELECT 1 FROM community_members m JOIN community_profiles p ON p.id=m.profile_id JOIN sessions s ON s.account_id=p.account_id JOIN community_rooms r ON r.id=m.room_id WHERE m.room_id=? AND m.profile_id=? AND m.banned=0 AND m.left_at=0 AND r.closed_at=0 AND s.token_hash=? AND s.expires_at>?`).bind(a.roomId,a.profileId,a.sessionHash,at).first();
 }
 async broadcast(){const status={checked:0,refreshed:0,closed:0,failed:0};for(const ws of this.ctx.getWebSockets()){status.checked++;try{if(await this.valid(ws.deserializeAttachment())){ws.send(JSON.stringify({type:'refresh'}));status.refreshed++;}else{ws.close(1008,'Room access ended');status.closed++;}}catch{status.failed++;try{ws.close(1011,'Connection unavailable');}catch{}}}return status;}
 async fetch(request){
  const url=new URL(request.url);
  if(url.pathname==='/notify'&&request.method==='POST'){const input=await request.json().catch(()=>({}));if(input.metrics){const at=Date.now(),last=await this.ctx.storage.get('metricsAt')||0;if(at-last<15000)return Response.json({throttled:true});await this.ctx.storage.put('metricsAt',at);}return Response.json(await this.broadcast());}
  if(url.pathname!=='/connect'||request.headers.get('upgrade')?.toLowerCase()!=='websocket')return new Response('Not found',{status:404});
  const a={roomId:request.headers.get('x-room-id'),profileId:request.headers.get('x-profile-id'),sessionHash:request.headers.get('x-session-hash'),lastPing:Date.now()};
  if(!await this.valid(a))return new Response('Room access denied',{status:403});
  const sockets=this.ctx.getWebSockets();if(sockets.length>=72||sockets.filter(s=>s.deserializeAttachment()?.profileId===a.profileId).length>=3)return new Response('Too many connections',{status:429});
  const pair=new WebSocketPair(),[client,server]=Object.values(pair);this.ctx.acceptWebSocket(server);server.serializeAttachment(a);
  await this.env.DB.prepare('UPDATE community_members SET last_seen=? WHERE room_id=? AND profile_id=?').bind(Date.now(),a.roomId,a.profileId).run();await this.broadcast();
  return new Response(null,{status:101,webSocket:client});
 }
 async webSocketMessage(ws,message){
  const a=ws.deserializeAttachment();if(typeof message!=='string'||message.length>100||message!=='presence'){ws.close(1008,'Unsupported message');return;}
  const at=Date.now();if(at-a.lastPing<15000)return;if(!await this.valid(a)){ws.close(1008,'Room access ended');return;}
  a.lastPing=at;ws.serializeAttachment(a);await this.env.DB.prepare('UPDATE community_members SET last_seen=? WHERE room_id=? AND profile_id=?').bind(at,a.roomId,a.profileId).run();ws.send(JSON.stringify({type:'presence'}));
 }
 async webSocketClose(ws,code){const a=ws.deserializeAttachment();try{ws.close(code===1005?1000:code);}catch{}if(a&&!this.ctx.getWebSockets().some(s=>s!==ws&&s.deserializeAttachment()?.profileId===a.profileId)){await this.env.DB.prepare('UPDATE community_members SET last_seen=0 WHERE room_id=? AND profile_id=?').bind(a.roomId,a.profileId).run();}await this.broadcast();}
 async webSocketError(ws){try{ws.close(1011,'Connection unavailable');}catch{}}
}
