import {useEffect,useState} from 'react';
import {CheckCircle,Clock,WarningCircle,GearSix,ArrowClockwise} from '@phosphor-icons/react';
import {readManualSync} from '../lib/manual-sync-status.mjs';

export function PlannerStorageStatus({store,demo,busy,failed,zone,navigate,onOptions,onRetry}){
 const [syncedAt,setSyncedAt]=useState(0);
 useEffect(()=>{try{setSyncedAt(readManualSync(localStorage,store.data.epoch));}catch{setSyncedAt(0);}},[store.data.epoch]);
 const label=demo?'Example changes stay in this preview':busy?'Saving…':failed||store.hasPending?'Changes have not been saved':store.memory?'Temporary mode · export before closing':!store.ready?'Loading local plans…':'Saved in this browser';
 const Icon=busy?Clock:failed||store.hasPending||store.memory?WarningCircle:CheckCircle;
 return <div className="sp-storage-status"><span role="status"><Icon size={16}/>{label}</span>{!demo&&syncedAt>0&&<small>Last manual sync · {new Date(syncedAt).toLocaleString('en-GB',{timeZone:zone,dateStyle:'medium',timeStyle:'short'})}</small>}<div>{store.hasPending&&!demo&&<button className="text-button" disabled={busy} onClick={onRetry}><ArrowClockwise size={15}/>Retry saving</button>}<a href="/account?view=settings" onClick={navigate}>Account &amp; sync</a><button className="text-button" disabled={busy||!store.ready} onClick={onOptions}><GearSix size={16}/>Plan options</button></div></div>;
}
