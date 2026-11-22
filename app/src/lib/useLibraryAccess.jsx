import {createContext,useContext,useEffect,useState} from 'react';
import {accountStatus} from './account-status.mjs';
import {libraryItem} from './library-access.mjs';
const pending={status:'loading',allowed:false,source:'loading',expiresAt:0};
const LibraryContext=createContext({...pending,item:(kind,id)=>libraryItem(pending,kind,id),retry:()=>{}});
export function LibraryAccessProvider({children}){
 const [access,setAccess]=useState(pending),[retry,setRetry]=useState(0),[clock,setClock]=useState(Date.now);
 useEffect(()=>{
  let disposed=false,generation=0;
  const refresh=async()=>{const request=++generation;try{const r=await fetch('/api/learning/features',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error();const body=await r.json();if(!body.library||typeof body.library.allowed!=='boolean')throw Error();if(!disposed&&request===generation)setAccess({...body.library,status:'ready'});}catch{if(!disposed&&request===generation)setAccess({status:'error',source:'offline',allowed:false,expiresAt:0});}};
  const changed=()=>{setAccess(pending);refresh();},visible=()=>{if(document.visibilityState==='visible'){setClock(Date.now());refresh();}};
  refresh();const timer=setInterval(refresh,60000),tick=setInterval(()=>setClock(Date.now()),1000),off=accountStatus.subscribe(changed);
  document.addEventListener('visibilitychange',visible);
  return()=>{disposed=true;clearInterval(timer);clearInterval(tick);off();document.removeEventListener('visibilitychange',visible);};
 },[retry]);
 const active=access.status==='ready'&&access.allowed&&(!access.expiresAt||access.expiresAt>clock);
 const value={...access,allowed:active,item:(kind,id)=>libraryItem({...access,allowed:active},kind,id,clock),retry:()=>{setAccess(pending);setRetry(n=>n+1);}};
 return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}
export const useLibraryAccess=()=>useContext(LibraryContext);
