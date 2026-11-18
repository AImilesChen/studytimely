import {DomainError} from './model.mjs';
// One exchange, shared by the browser coordinator and two-device integration tests.
// Transport is injected; no identity, credentials or private data enter logs.
export async function exchangeSync({local,request,accountId}){
 const info=await local('syncInfo'),meta=info.sync;
 if(meta.account!==accountId)throw new DomainError('ACCOUNT_CHANGED','Sign in to this workspace’s account before syncing.');
 if(!meta.enabled||meta.held)return info;
 const prepared=await local('prepareSync'),batch=prepared.sync.inflight;let accepted=false,conflict=false;
 if(batch){try{await request('/mutations',{method:'POST',data:batch});accepted=true;}catch(e){if(e.status===409&&['CONFLICT','GENERATION'].includes(e.code))conflict=true;else throw e;}}
 const remote=await request('/state?since='+meta.version+'&generation='+encodeURIComponent(meta.generation||''));
 if(!remote.enabled)throw new DomainError('NOT_ENABLED','Automatic sync is not enabled for this cloud workspace.');
 return local('receiveSync',remote,{accepted,conflict});
}
