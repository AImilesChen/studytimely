import {inactiveSyncStatus,syncContext} from './sync-view.mjs';
import {hasProgress} from './model.mjs';
import {exchangeSync} from './sync-exchange.mjs';
import {accountStatus} from './account-status.mjs';
import {useEffect,useRef,useState,useCallback} from 'react';
import {accountRequest} from './sync.mjs';
export function useAutomaticSync(store,available=true){
 const [info,setInfo]=useState(null),[status,setStatus]=useState('local'),[error,setError]=useState(''),[auth,setAuth]=useState(null),[authChecked,setAuthChecked]=useState(false);
 const ref=useRef({store,auth:null,busy:false,stopped:false,retryAt:0,failures:0}),mounted=useRef(false),due=useRef(0);ref.current.store=store;
 const read=useCallback(async()=>{const value=await ref.current.store.syncLocal('syncInfo');ref.current.meta=value.sync;if(mounted.current)setInfo(value.sync);return value;},[]);
 const refreshAuth=useCallback(async()=>{
  const generation=ref.current.authGeneration=(ref.current.authGeneration||0)+1;const a=await accountRequest('/api/auth/me');if(generation!==ref.current.authGeneration)return ref.current.auth||{user:null};const identity=a.user?.syncAccountId||null;
  ref.current.auth=a.user?a:null;ref.current.verified=true;if(mounted.current){setAuth(a.user?a:null);setAuthChecked(true);}accountStatus.publish(!!a.user);
  const value=await ref.current.store.syncLocal('switchAccount',identity);if(generation!==ref.current.authGeneration)return ref.current.auth||{user:null};ref.current.meta=value.sync;if(mounted.current){setInfo(value.sync);setError('');const inactive=inactiveSyncStatus(value.sync);if(inactive&&!ref.current.busy)setStatus(inactive);}return a;
 },[]);
 const syncNow=useCallback(async()=>{
  const r=ref.current;if(r.busy||r.stopped||!r.store.ready||r.store.memory||r.store.hasPending)return;
  if(globalThis.navigator?.onLine===false){setStatus('offline');return;}
  const run=async()=>{
   r.busy=true;setError('');setStatus('syncing');
   try{
    const context=await syncContext({read,refreshAuth,getAuth:()=>r.auth});if(context.skip){setStatus(context.status);return;}
    const result=await exchangeSync({local:(method,...args)=>r.store.syncLocal(method,...args),accountId:r.auth.user.syncAccountId,request:(path,options={})=>accountRequest('/api/sync'+path,{...options,csrf:r.auth.csrf})});setInfo(result.sync);
    setStatus(result.sync.held?'held':result.sync.deferred?'deferred':Object.keys(result.sync.conflicts||{}).length?'conflict':result.sync.pending?'pending':'synced');r.failures=0;r.retryAt=0;
   }catch(e){
    r.failures++;r.retryAt=Date.now()+Math.min(60000,2000*2**Math.min(r.failures,5));setError(e.message||'Sync could not finish. Your changes stay on this device.');setStatus(globalThis.navigator?.onLine===false?'offline':'error');
    if(e.status===401){r.authGeneration=(r.authGeneration||0)+1;r.auth=null;setAuth(null);}
   }finally{r.busy=false;}
  };
  if(globalThis.navigator?.locks)await navigator.locks.request('studytimely-cloud-sync',{ifAvailable:true},lock=>lock?run():undefined);else await run();
 },[read,refreshAuth]);
 useEffect(()=>{
  if(!available||!store.ready||store.memory)return;mounted.current=true;ref.current.stopped=false;
  refreshAuth().then(()=>{due.current=Date.now();}).catch(e=>{setError(e.message);setStatus('error');});
  const pulse=setInterval(async()=>{if(ref.current.busy||document.visibilityState!=='visible'||Date.now()<ref.current.retryAt)return;
   try{const {sync}=await read();if(!sync.enabled||sync.held)return;
    const now=Date.now();if(now>=due.current&&(!sync.changedAt||now-sync.changedAt>=2200)){due.current=now+15000;await syncNow();}
   }catch(e){setError(e.message);setStatus('error');}
  },2500);
  const wake=()=>{if(document.visibilityState==='visible'){refreshAuth().then(()=>{due.current=0;syncNow();}).catch(e=>{setError(e.message);setStatus('error');});}};
  const offline=()=>setStatus('offline');window.addEventListener('online',wake);window.addEventListener('offline',offline);window.addEventListener('focus',wake);document.addEventListener('visibilitychange',wake);
  const warn=e=>{const m=ref.current.meta;if(m?.pending||m?.inflight||m?.held||Object.keys(m?.conflicts||{}).length){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);
  const authChange=()=>wake();window.addEventListener('studytimely:auth-changed',authChange);
  return()=>{mounted.current=false;ref.current.stopped=true;ref.current.authGeneration=(ref.current.authGeneration||0)+1;clearInterval(pulse);window.removeEventListener('online',wake);window.removeEventListener('offline',offline);window.removeEventListener('focus',wake);document.removeEventListener('visibilitychange',wake);window.removeEventListener('beforeunload',warn);window.removeEventListener('studytimely:auth-changed',authChange);};
 },[available,store.ready,store.memory,read,refreshAuth,syncNow]);
 useEffect(()=>{if(!store.ready)return;read().then(async v=>{const r=ref.current;if(r.verified&&v.sync.account!==(r.auth?.user?.syncAccountId||null)&&!hasProgress(r.store.data.timer)){await refreshAuth();v=await read();}if(v.sync.pending||v.sync.inflight){due.current=Date.now()+2200;setStatus('pending');}}).catch(()=>{});},[store.event,store.ready,read,refreshAuth]);
 ref.current.meta=info;
 const request=useCallback((path,options={})=>{const a=ref.current.auth;if(!a||a.user.syncAccountId!==ref.current.meta?.account)throw Error('Sign in to this workspace’s account.');return accountRequest('/api/sync'+path,{...options,csrf:a.csrf});},[]);
 const pause=async()=>{await store.syncLocal('pauseSync');await read();setStatus('paused');};
 const enable=async choice=>{
  await refreshAuth();const {sync}=await read();if(!ref.current.auth||sync.account!==ref.current.auth.user.syncAccountId)throw Error('Sign in before enabling sync.');
  await request('/enable',{method:'POST',data:{confirm:true}});const remote=await request('/state');
  const guest=choice==='merge-guest'?await store.syncLocal('guestBackup'):null;
  await store.syncLocal('configureSync',{records:remote.changes,generation:remote.generation,version:remote.version},choice==='cloud'?'cloud':'merge',guest);await read();setStatus('pending');due.current=0;await syncNow();
 };
 const resolve=async(key,choice)=>{await store.syncLocal('resolveSync',key,choice);await read();due.current=0;};
 return{info,status:store.memory?'temporary':status,temporary:store.memory,pendingLocal:store.hasPending,error,auth,authChecked,read,request,syncNow,refreshAuth,enable,pause,resolve,pendingCount:Object.keys(info?.pending?.changes||info?.inflight?.changes||{}).length};
}
