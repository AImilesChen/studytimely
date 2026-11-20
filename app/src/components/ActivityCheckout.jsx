import {useEffect,useId,useState} from 'react';
import {CheckCircle,ArrowRight,NotePencil} from '@phosphor-icons/react';
import {ACTIVITY_OUTCOMES} from '../lib/group-activities.mjs';
export function ActivityCheckout({own,phase,pending,error,onSubmit,children}){
 const saved=!!own.checkedOutAt,id=useId(),[open,setOpen]=useState(!saved&&['break','ended'].includes(phase)),[failed,setFailed]=useState(false);
 useEffect(()=>{if(!saved&&['break','ended'].includes(phase))setOpen(true);},[phase,saved]);
 async function submit(e){setFailed(false);if(await onSubmit(e))setOpen(false);else setFailed(true);}
 return <section className="ga-result-card" aria-labelledby={id+'-title'}>
  <header><div className="ga-result-intro"><span className="ga-result-icon"><NotePencil size={23}/></span><div><h4 id={id+'-title'}>{saved?'Your study result':phase==='focus'?'Ready to finish?':'How did your study go?'}</h4><p>{saved?ACTIVITY_OUTCOMES[own.outcome]:'Choose your result and add a private reflection.'}</p></div></div><button type="button" className={open?'button ga-result-toggle':'button primary ga-action-join ga-result-toggle'} aria-expanded={open} aria-controls={id+'-form'} disabled={pending} onClick={()=>setOpen(value=>!value)}>{open?'Hide form':saved?'Edit result & reflection':'Finish & add result'}{!open&&<ArrowRight size={18}/>}</button></header>
  <p className="ga-result-privacy">Your result is shared with members. Your reflection is only visible to you.</p>
  {saved?<p className="ga-result-saved" role="status"><CheckCircle size={18}/>Result saved{own.reflection?.trim()?' · Private reflection saved':''}</p>:<p className="ga-result-consequence">Saving ends your participation and stops your activity timer. You cannot restart this activity timer afterwards.</p>}
  <form id={id+'-form'} onSubmit={submit} className="ga-checkout ga-result-form" hidden={!open} aria-label="Study result and private reflection"><fieldset className="ga-result-fields" disabled={pending}>{children}</fieldset>{failed&&<p role="alert" className="field-error">{error||"Your result could not be saved. Your entries are kept; try again."}</p>}<div className="ga-result-form-actions"><button className="button primary ga-action-join" disabled={pending}>{pending?'Saving…':saved?'Save changes':'Finish study & save result'}</button><button className="button" type="button" disabled={pending} onClick={()=>setOpen(false)}>Cancel</button></div></form>
 </section>;
}
