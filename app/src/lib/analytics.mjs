import {ROUTES} from './routes.mjs';
const EVENTS=new Set(['timer_start','timer_pause','session_saved']);
const MODES=new Set(['study','pomodoro','focus','countdown','stopwatch','clock']);
export function safeEvent(name,params={}){if(!EVENTS.has(name)||!MODES.has(params.mode))return null;return{name,params:{mode:params.mode}};}
export function createAnalytics({id='',enabled=false,win=globalThis.window,doc=globalThis.document}={}){
 const configured=enabled&&/^G-[A-Z0-9]+$/.test(id);let frame=null,allowed=false,ready=false,queue=[],lastPage='';
 const send=message=>{if(!allowed||!configured)return;if(ready)frame.contentWindow.postMessage(message,win.location.origin);else if(queue.length<10)queue.push(message);};
 const listener=e=>{if(!frame||e.source!==frame.contentWindow||e.origin!==win.location.origin||e.data?.type!=='studytimely-analytics-ready')return;ready=true;frame.contentWindow.postMessage({type:'init',id},win.location.origin);queue.forEach(m=>frame.contentWindow.postMessage(m,win.location.origin));queue=[];};
 function remove(){frame?.remove();frame=null;ready=false;queue=[];lastPage='';}
 if(configured)win.addEventListener('message',listener);
 return{
   configured,
   consent(value){const next=configured&&value===true;if(next===allowed)return;allowed=next;if(!allowed){remove();for(const pair of (doc.cookie||'').split(';')){const name=pair.split('=')[0].trim();if(/^_ga(?:_|$)/.test(name))doc.cookie=name+'=; Max-Age=0; Path=/; SameSite=Lax';}return;}frame=doc.createElement('iframe');frame.hidden=true;frame.title='Optional usage statistics';frame.tabIndex=-1;frame.referrerPolicy='no-referrer';frame.src='/analytics-frame.html';doc.body.append(frame);},
   page(path){if(!allowed||!ROUTES.some(r=>r.path===path)||path===lastPage)return;lastPage=path;send({type:'page',path});},
   track(name,params){const event=safeEvent(name,params);if(event)send({type:'event',...event});},
   destroy(){allowed=false;remove();if(configured)win.removeEventListener('message',listener);}
 };
}
