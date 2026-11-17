import {accountRequest} from './sync.mjs';
const initial=Object.freeze({status:'unknown',signedIn:null});
export function accountNavigation(snapshot){
 if(snapshot.signedIn===true)return {label:'My Study Center',href:'/account',description:'Your learning overview, plans and account settings.'};
 if(snapshot.signedIn===false)return {label:'Sign in',href:'/account?view=signin',description:'Continue with Google for optional sync and community access.'};
 return {label:'Account',href:'/account',description:'Open your learning workspace and account options.'};
}
export function createAccountStatus(load=()=>accountRequest('/api/auth/me')){
 let state=initial,pending=null,generation=0,lastRead=0;const listeners=new Set();
 const update=next=>{state=next;listeners.forEach(fn=>fn());};
 return {getSnapshot:()=>state,getServerSnapshot:()=>initial,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},
  publish(signedIn){generation++;lastRead=Date.now();update({status:'ready',signedIn:!!signedIn});},
  refresh(force=false){if(pending)return pending;if(!force&&Date.now()-lastRead<10000)return Promise.resolve();const started=generation;
   pending=Promise.resolve().then(load).then(reply=>{if(started===generation){lastRead=Date.now();update({status:'ready',signedIn:!!reply.user});}}).catch(()=>{if(started===generation)update({status:'error',signedIn:state.signedIn});}).finally(()=>{pending=null;});return pending;
  }
 };
}
// Only a transient login-status boolean is shared. No tokens, email or account data are stored here.
export const accountStatus=createAccountStatus();
