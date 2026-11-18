import {useState} from 'react';
import {CloudCheck,CloudSlash,WarningCircle,DownloadSimple,ArrowRight} from '@phosphor-icons/react';
import {backupOf,downloadJSON} from '../lib/storage.mjs';
import {syncPresentation} from '../lib/sync-view.mjs';
export function StudyCenterData({store,onManage}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const state=syncPresentation(store.cloudSync),Icon=state.tone==='warning'?WarningCircle:state.tone==='synced'?CloudCheck:CloudSlash;
 async function download(){setBusy(true);setError('');try{downloadJSON(backupOf(await store.getSnapshot()));}catch{setError('The backup could not be prepared. Please try again.');}finally{setBusy(false);}}
 return <section className="sc-data-card" aria-labelledby="sc-data-title"><div className={'sc-data-icon sc-data-'+state.tone}><Icon size={24}/></div><div className="sc-data-copy"><h2 id="sc-data-title">Your data</h2><p><span className={'sc-data-state sc-data-'+state.tone}>{state.label}</span><span className="sc-data-description">{state.description}</span></p></div><div className="sc-data-actions"><button className="button" disabled={busy||!store.ready||store.hasPending} onClick={download}><DownloadSimple size={17}/>Download backup</button><button className="button" onClick={onManage}>Manage sync &amp; recovery<ArrowRight size={16}/></button></div>{error&&<p className="field-error" role="alert">{error}</p>}</section>;
}
