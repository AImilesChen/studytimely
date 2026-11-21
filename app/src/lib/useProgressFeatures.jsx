import {useEffect,useState} from 'react';
import {accountStatus} from './account-status.mjs';

export function useProgressFeatures(now){
 const [state,setState]=useState({status:'loading',allowed:false,expiresAt:0}),[retry,setRetry]=useState(0);
 useEffect(()=>{
  let disposed=false,generation=0;
  const refresh=()=>{const request=++generation;return fetch('/api/learning/features',{credentials:'same-origin',cache:'no-store'}).then(async r=>{if(!r.ok)throw Error();const body=await r.json();if(!disposed&&request===generation)setState({status:'ready',...(body.analytics||{allowed:false,expiresAt:0})});}).catch(()=>{if(!disposed&&request===generation)setState({status:'error',allowed:false,expiresAt:0});});};
  refresh();const timer=setInterval(refresh,60000),off=accountStatus.subscribe(refresh),visible=()=>{if(document.visibilityState==='visible')refresh();};document.addEventListener('visibilitychange',visible);
  return()=>{disposed=true;clearInterval(timer);off();document.removeEventListener('visibilitychange',visible);};
 },[retry]);
 return{...state,active:state.status==='ready'&&state.allowed&&(!state.expiresAt||state.expiresAt>now),retry:()=>{setState({status:'loading',allowed:false,expiresAt:0});setRetry(n=>n+1);}};
}
