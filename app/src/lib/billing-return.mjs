// A success URL is only a cue to check the server, never proof of payment.
export async function confirmBillingReturn({request,csrf,onUpdate=()=>{},isCurrent=()=>true,delay=ms=>new Promise(resolve=>setTimeout(resolve,ms)),attempts=8}){
 let status=null;
 for(let n=0;n<attempts&&isCurrent();n++){
  if(n===3){try{await request('/api/billing/refresh',{method:'POST',data:{},csrf});}catch(e){if(!['BILLING_BUSY','STRIPE_UNAVAILABLE','BILLING_UNAVAILABLE'].includes(e.code))throw e;}}
  if(!isCurrent())return null;
  status=await request('/api/billing/status');if(!isCurrent())return null;onUpdate(status);
  if(status.plus||!status.ready||!status.enabled)return status;
  if(n<attempts-1)await delay(2000);
 }
 return isCurrent()?status:null;
}
