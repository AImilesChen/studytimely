import {useEffect,useMemo,useState} from 'react';
import {accountRequest} from './sync.mjs';
import {MyGroupsClient} from './my-groups.mjs';
import {roomHeartbeat} from './room-timer-client.mjs';
const sessionStore=()=>{try{return window.sessionStorage;}catch{return undefined;}};

export function useMyGroups(auth,loaded){
 const accountId=auth?.user?.googleLinked?auth.user.syncAccountId||'':'';
 const client=useMemo(()=>new MyGroupsClient({accountId,request:(path,method='GET',data)=>accountRequest('/api/community'+path,{method,data,csrf:auth?.csrf}),storage:sessionStore(),origin:typeof location==='undefined'?'https://studytimely.com':location.origin}),[accountId,auth?.csrf]);
 const [view,setView]=useState(()=>({client,state:client.state})),[now,setNow]=useState(0),[connection,setConnection]=useState('Connecting…');
 const state=view.client===client?view.state:client.state;
 useEffect(()=>{client.activate();setView({client,state:client.state});const off=client.subscribe(value=>setView({client,state:value}));if(loaded)client.refresh();const tick=setInterval(()=>setNow(client.clock()),1000);setNow(client.clock());const poll=setInterval(()=>{if(document.visibilityState==='visible'&&loaded)client.refresh();},30000);const visible=()=>{if(document.visibilityState==='visible'&&loaded)client.refresh();};document.addEventListener('visibilitychange',visible);return()=>{off();client.dispose();clearInterval(tick);clearInterval(poll);document.removeEventListener('visibilitychange',visible);};},[client,loaded]);
 const timer=state.me?.timer,owns=!!timer&&!!client.lease&&timer.lease===client.lease;
 useEffect(()=>{if(!accountId||!owns||timer?.status!=='running')return;return roomHeartbeat({request:client.request,lease:timer.lease,onResult:result=>client.acceptTimer(result),onError:e=>{client.set({error:e.message});client.refreshMe();}});},[client,accountId,owns,timer?.lease,timer?.status]);
 useEffect(()=>{
  if(!accountId||!state.selectedId||!state.detail?.member||state.detail.room.closed){setConnection('Not connected');return;}
  let stopped=false,socket,retry,presence,queued,delay=1000;
  const refresh=()=>{clearTimeout(queued);queued=setTimeout(()=>{if(!stopped)Promise.all([client.refreshMe(),client.refreshSelected()]);},250);};
  const connect=()=>{if(stopped)return;setConnection('Connecting…');try{socket=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/api/community/rooms/${state.selectedId}/socket`);}catch{setConnection('Live updates unavailable');return;}
   socket.onopen=()=>{delay=1000;setConnection('Live');refresh();presence=setInterval(()=>{if(socket.readyState===1)socket.send('presence');},30000);};
   socket.onmessage=e=>{try{if(JSON.parse(e.data).type==='refresh')refresh();}catch{}};
   socket.onerror=()=>{if(!stopped)setConnection('Updates interrupted');};socket.onclose=()=>{clearInterval(presence);if(stopped)return;setConnection('Reconnecting…');retry=setTimeout(connect,delay);delay=Math.min(delay*2,30000);};
  };connect();return()=>{stopped=true;clearTimeout(retry);clearTimeout(queued);clearInterval(presence);socket?.close();};
 },[client,accountId,state.selectedId,state.detail?.member,state.detail?.room.closed]);
 return{...state,client,now,connection};
}
