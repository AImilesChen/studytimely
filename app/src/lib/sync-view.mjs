// Shared account UI states. Anonymous/local-only use is a normal state.
export function inactiveSyncStatus(info){
 if(info?.held)return 'held';
 return info?.enabled?null:info?.account?'paused':'local';
}
export async function syncContext({read,refreshAuth,getAuth}){
 let value=await read(),status=inactiveSyncStatus(value.sync);
 if(status)return{...value,status,skip:true};
 let auth=getAuth();if(!auth||auth.user.syncAccountId!==value.sync.account){await refreshAuth();value=await read();auth=getAuth();}
 status=inactiveSyncStatus(value.sync);if(status)return{...value,status,skip:true};
 if(!auth||auth.user.syncAccountId!==value.sync.account)throw Error('Sign in to this workspace’s account before syncing.');
 return{...value,auth,skip:false};
}
export function syncPresentation(sync){
 const info=sync?.info;
 const state=(label,tone='local',description='')=>({label,tone,description});
 if(sync?.temporary)return state('Temporary mode · export before leaving','warning','Keep a downloaded copy before closing this tab.');
 if(sync?.pendingLocal)return state('Local save needs attention','warning','Resolve the pending save before syncing or restoring.');
 if(sync?.status==='error'&&sync?.error)return state(info?.enabled?'Sync needs attention':'Account connection needs attention','warning',sync.error);
 if(sync?.authChecked===false)return state('Checking account…','local','Your study records stay on this device.');
 if(!info?.account)return state('Saved on this device','local','Sign in and choose whether to sync across devices.');
 if(info.held)return state('Local changes need review','warning',info.held.reason||'The cloud workspace was restored or cleared.');
 const conflicts=Object.keys(info.conflicts||{}).length;
 if(conflicts)return state(conflicts+' item'+(conflicts===1?' needs':'s need')+' review','warning','Choose which changes to keep. Other records can still sync.');
 if(!info.enabled)return state('Automatic sync is off','local','Enable it when you want to use another device.');
 if(sync?.status==='offline')return state('Offline · changes saved on this device','pending','Changes will upload when your connection returns.');
 if(sync?.status==='syncing')return state('Syncing…','pending','Your local changes are saved.');
 if(info.deferred)return state('Cloud changes waiting for your timer','pending','Finish the current timer to apply them safely.');
 if(sync?.pendingCount)return state('Saved locally · sync pending','pending',sync.pendingCount+' changes waiting to sync.');
 return state(info.lastSuccess?'All changes synced':'Ready to sync',info.lastSuccess?'synced':'local','Manage backups, recover deleted items and check your devices.');
}
export const syncLabel=sync=>syncPresentation(sync).label;
