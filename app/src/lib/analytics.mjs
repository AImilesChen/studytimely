import {ROUTES} from './routes.mjs';
const EVENTS=new Set(['timer_start','timer_pause','session_saved']);
const MODES=new Set(['study','pomodoro','focus','countdown','stopwatch','clock']);
export const ANALYTICS_PATHS=ROUTES.filter(r=>r.indexable!==false&&!['privacy','terms','cookies'].includes(r.id)).map(r=>r.path);
export function safeEvent(name,params={}){if(!EVENTS.has(name)||!MODES.has(params.mode))return null;return{name,params:{mode:params.mode}};}
export function createAnalytics({id='',ahrefsKey='',enabled=false,win=globalThis.window,doc=globalThis.document}={}){
 const google=enabled&&/^G-[A-Z0-9]+$/.test(id),ahrefs=enabled&&/^[A-Za-z0-9/+_-]{16,80}$/.test(ahrefsKey),configured=google||ahrefs;let frame=null,allowed=false,ready=false,queue=[],lastPage='',currentPath='';
 const send=message=>{if(!allowed||!configured)return;if(ready)frame.contentWindow.postMessage(message,win.location.origin);else if(queue.length<10)queue.push(message);};
 const listener=e=>{if(!frame||ready||e.source!==frame.contentWindow||e.origin!==win.location.origin||e.data?.type!=='studytimely-analytics-ready')return;ready=true;frame.contentWindow.postMessage({type:'init',id:google?id:'',ahrefsKey:ahrefs?ahrefsKey:'',paths:ANALYTICS_PATHS,path:currentPath},win.location.origin);queue.forEach(m=>frame.contentWindow.postMessage(m,win.location.origin));queue=[];};
 function remove(){frame?.remove();frame=null;ready=false;queue=[];lastPage='';}
 function clearCookies(){for(const pair of (doc.cookie||'').split(';')){const name=pair.split('=')[0].trim();if(/^_ga(?:_|$)/.test(name))doc.cookie=name+'=; Max-Age=0; Path=/; SameSite=Lax';}}
 function activate(){if(!allowed||!currentPath||frame)return;frame=doc.createElement('iframe');frame.hidden=true;frame.title='Optional usage statistics';frame.tabIndex=-1;frame.referrerPolicy='no-referrer';frame.src='/analytics-frame.html';doc.body.append(frame);}
 if(configured)win.addEventListener('message',listener);
 return{
   configured,
   consent(value){const next=configured&&value===true;if(next===allowed)return;allowed=next;if(!allowed){remove();clearCookies();return;}activate();if(currentPath){lastPage=currentPath;send({type:'page',path:currentPath});}},
   page(path){currentPath=ANALYTICS_PATHS.includes(path)?path:'';if(!currentPath){remove();return;}if(!allowed)return;activate();if(path===lastPage)return;lastPage=path;send({type:'page',path});},
   track(name,params){const event=safeEvent(name,params);if(event&&frame&&currentPath)send({type:'event',...event});},
   destroy(){allowed=false;remove();if(configured)win.removeEventListener('message',listener);}
 };
}
