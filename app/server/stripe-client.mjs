import {fail,hmac,equal} from './auth-shared.mjs';
export const STRIPE_VERSION='2026-11-18.endive';
export const BILLING_EVENTS=['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.expired','invoice.paid','invoice.payment_failed','customer.subscription.updated','customer.subscription.deleted','charge.refunded','charge.dispute.created','charge.dispute.closed'];
import {PLUS_PLANS} from '../src/lib/plus-plans.mjs';
export {PLUS_PLANS};
const loopback=host=>['localhost','127.0.0.1','[::1]'].includes(host);
export function billingConfig(env,request){
 const origin=new URL(request.url).origin,host=new URL(origin).hostname;
 // This implementation deliberately has no live-payment switch.
 const safeHost=loopback(host)||(!['studytimely.com','www.studytimely.com'].includes(host)&&env.BILLING_TEST_ISOLATED==='true'&&origin===env.BILLING_ORIGIN);
 const enabled=env.BILLING_ENABLED==='true'&&env.BILLING_ENV==='test'&&safeHost&&/^(sk|rk)_test_[A-Za-z0-9]+$/.test(env.STRIPE_SECRET_KEY||'');
 const prices={plus_monthly:env.STRIPE_PRICE_PLUS_MONTHLY,plus_annual:env.STRIPE_PRICE_PLUS_ANNUAL};
 const configured=enabled&&Object.values(prices).every(v=>/^price_[A-Za-z0-9]+$/.test(v||''))&&prices.plus_monthly!==prices.plus_annual;
 return {enabled,configured,ready:configured&&/^whsec_[A-Za-z0-9]+$/.test(env.STRIPE_WEBHOOK_SECRET||''),prices,origin};
}
export function stripeClient(env,fetcher=fetch){const deadline=Date.now()+75000;return async function stripe(path,{method='GET',data,key}={}){
 if(Date.now()>=deadline)fail(503,'STRIPE_UNAVAILABLE','Billing took too long. Refresh membership before trying again.');
 if(!path.startsWith('/v1/')||path.includes('..')||path.includes('#'))fail(500,'BILLING_PATH','Invalid billing operation.');
 const headers={Authorization:'Bearer '+env.STRIPE_SECRET_KEY,'Stripe-Version':STRIPE_VERSION};
 if(key)headers['Idempotency-Key']=key;
 if(data)headers['Content-Type']='application/x-www-form-urlencoded';
 let response;try{response=await fetcher('https://api.stripe.com'+path,{method,headers,body:data?new URLSearchParams(data).toString():undefined,redirect:'manual',signal:AbortSignal.timeout(Math.max(1,Math.min(12000,deadline-Date.now())))});}catch{fail(503,'STRIPE_UNAVAILABLE','Billing could not be reached. Refresh membership before trying again.');}
 let value;try{value=await response.json();}catch{fail(503,'STRIPE_UNAVAILABLE','Billing returned an unreadable response. Please try again.');}
 if(!response.ok){if(env.BILLING_LOCAL_DIAGNOSTICS==='true')console.warn('Stripe sandbox request rejected:',JSON.stringify({status:response.status,type:value.error?.type,code:value.error?.code,param:value.error?.param,message:String(value.error?.message||'').replace(/\b(sk|rk|pk|whsec)_[A-Za-z0-9_]+/g,'[redacted]').slice(0,350)}));fail(response.status===429?429:503,'STRIPE_UNAVAILABLE','Billing could not complete this action. Please try again or contact support.');}
 if(value?.livemode===true)fail(409,'BILLING_ENVIRONMENT','Only sandbox billing is enabled here.');
 return value;
};}
export function stripeId(value,prefix){const id=typeof value==='string'?value:value?.id;if(typeof id!=='string'||!new RegExp('^'+prefix+'_[A-Za-z0-9_]+$').test(id))fail(400,'BILLING_OBJECT','The billing object is invalid.');return id;}
export async function verifyStripeEvent(request,secret,at){
 if(Number(request.headers.get('content-length')||0)>262144)fail(413,'TOO_LARGE','Webhook is too large.');
 const reader=request.body?.getReader();if(!reader)fail(400,'SIGNATURE','A signed webhook body is required.');
 let length=0;const chunks=[];while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>262144){await reader.cancel();fail(413,'TOO_LARGE','Webhook is too large.');}chunks.push(value);}
 const bytes=new Uint8Array(length);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}let raw;try{raw=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{fail(400,'INVALID','The webhook body must be UTF-8.');}
 const parts=(request.headers.get('stripe-signature')||'').split(',').map(p=>p.split('=')),ts=parts.filter(([k])=>k==='t'),signatures=parts.filter(([k])=>k==='v1').map(([,v])=>v);
 if(ts.length!==1||!/^\d+$/.test(ts[0][1])||Math.abs(at/1000-Number(ts[0][1]))>300)fail(400,'SIGNATURE','The webhook signature is invalid or expired.');
 const expected=await hmac(secret,ts[0][1]+'.'+raw);if(!signatures.some(s=>equal(s,expected)))fail(400,'SIGNATURE','The webhook signature is invalid.');
 let event;try{event=JSON.parse(raw);}catch{fail(400,'INVALID','Invalid webhook JSON.');}
 if(event.livemode!==false||event.account||!/^evt_[A-Za-z0-9]+$/.test(event.id||'')||typeof event.type!=='string'||!event.data?.object?.id)fail(400,'BILLING_ENVIRONMENT','Use a sandbox event from this account.');
 return event;
}
export async function checkedPrices(stripe,config){
 const out={};for(const [plan,id] of Object.entries(config.prices)){
  const p=await stripe('/v1/prices/'+stripeId(id,'price')),expected=PLUS_PLANS[plan];
  if(p.id!==id||p.livemode!==false||!p.active||p.currency!=='usd'||p.unit_amount!==expected.amount||p.type!=='recurring'||p.billing_scheme!=='per_unit'||p.recurring?.interval!==expected.interval||p.recurring?.interval_count!==1||p.recurring?.usage_type!=='licensed'||p.transform_quantity||p.custom_unit_amount)fail(409,'PRICE_CONFIGURATION','The sandbox price does not match the approved amount and billing period.');
  out[plan]={...expected,id,product:stripeId(p.product,'prod')};
 }
 if(out.plus_monthly.product!==out.plus_annual.product)fail(409,'PRICE_CONFIGURATION','Both prices must belong to the same Plus product.');return out;
}
