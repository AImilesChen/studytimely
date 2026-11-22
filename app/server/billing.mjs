import {publicPlans} from '../src/lib/plus-plans.mjs';
import {ApiError,fail,result,identity,body,rateLimit} from './auth-shared.mjs';
import {billingConfig,stripeClient,stripeId,checkedPrices,verifyStripeEvent,BILLING_EVENTS,PLUS_PLANS} from './stripe-client.mjs';
const q=(env,sql,...args)=>env.DB.prepare(sql).bind(...args),id=v=>typeof v==='string'?v:v?.id;
const seconds=v=>Number.isSafeInteger(v)&&v>0?v*1000:0;
const activeStatuses=['active','trialing','past_due','unpaid','incomplete','paused'];
async function locked(env,account,at,fn){
 const token=crypto.randomUUID(),held=await q(env,'INSERT INTO billing_locks(account_id,token,expires_at) VALUES(?,?,?) ON CONFLICT(account_id) DO UPDATE SET token=excluded.token,expires_at=excluded.expires_at WHERE billing_locks.expires_at<? RETURNING token',account,token,at+120000,at).first();
 if(!held)fail(503,'BILLING_BUSY','Another billing action is in progress. Wait a moment and refresh.');
 try{return await fn();}finally{await q(env,'DELETE FROM billing_locks WHERE account_id=? AND token=?',account,token).run();}
}
async function customerFor(env,user,stripe,at){
 let row=await q(env,'SELECT * FROM billing_customers WHERE account_id=?',user.id).first();
 if(row?.deleting)fail(409,'ACCOUNT_DELETING','Account deletion is in progress. Contact support if it cannot finish.');
 if(!row){const customer=await stripe('/v1/customers',{method:'POST',key:'studytimely-customer-'+user.id,data:{'metadata[app]':'studytimely','metadata[account_id]':user.id}});const customerId=stripeId(customer,'cus');
  await q(env,'INSERT INTO billing_customers(account_id,customer_id,created_at) VALUES(?,?,?)',user.id,customerId,at).run();row={account_id:user.id,customer_id:customerId,deleting:0};
 }return row;
}
async function subscriptions(stripe,customer){const list=await stripe('/v1/subscriptions?customer='+stripeId(customer,'cus')+'&status=all&limit=100');if(list.has_more||!Array.isArray(list.data))fail(409,'BILLING_REVIEW','Please contact support to review these subscriptions.');if(list.data.some(s=>s.livemode!==false||id(s.customer)!==customer))fail(409,'BILLING_OBJECT','Unexpected subscription owner.');return list.data;}
async function portal(stripe,customer,origin,configuration){if(configuration&&!/^bpc_[A-Za-z0-9]+$/.test(configuration))fail(503,'PORTAL_CONFIGURATION','The subscription portal configuration needs attention.');const value=await stripe('/v1/billing_portal/sessions',{method:'POST',data:{customer,return_url:origin+'/account?view=settings#plus-membership',...(configuration?{configuration}:{})}});if(!value.url?.startsWith('https://billing.stripe.com/'))fail(503,'BILLING_URL','The subscription portal is unavailable.');return {url:value.url};}
function checkSubscription(sub,customer,account,prices){
 if(sub.livemode!==false||id(sub.customer)!==customer||sub.metadata?.app!=='studytimely'||sub.metadata?.account_id!==account)return null;
 const items=sub.items?.data;if(sub.items?.has_more||!Array.isArray(items)||items.length!==1||items[0].quantity!==1)fail(409,'BILLING_REVIEW','This subscription needs review.');
 const item=items[0],plan=Object.keys(prices).find(k=>prices[k].id===id(item.price));
 if(!plan||id(item.price?.product)!==prices[plan].product||sub.currency!=='usd')fail(409,'BILLING_REVIEW','The subscription does not match a supported Plus plan.');
 return {plan,item};
}
async function invoicePayment(stripe,invoice,sub,account,prices){
 const checked=checkSubscription(sub,id(invoice.customer),account,prices);if(!checked)return null;
 const {plan,item}=checked,p=prices[plan],lines=invoice.lines;
 if(invoice.livemode!==false||invoice.status!=='paid'||invoice.amount_remaining!==0||id(invoice.parent?.subscription_details?.subscription)!==sub.id)return null;
 if(lines?.has_more||lines?.data?.length!==1)fail(409,'BILLING_REVIEW','An adjusted invoice needs review before it can grant membership.');
 const line=lines.data[0],start=seconds(line.period?.start),end=seconds(line.period?.end);
 if(line.currency!=='usd'||line.amount!==p.amount||line.quantity!==1||id(line.pricing?.price_details?.price)!==p.id||id(line.pricing?.price_details?.product)!==p.product||line.parent?.subscription_item_details?.proration===true||id(line.parent?.subscription_item_details?.subscription)!==sub.id||id(line.parent?.subscription_item_details?.subscription_item)!==item.id||!start||end<=start||end-start>367*86400000||invoice.currency!=='usd'||invoice.total!==p.amount||invoice.amount_paid!==p.amount||invoice.subtotal!==p.amount||invoice.paid_out_of_band===true||(invoice.total_discount_amounts||[]).some(d=>d.amount)||(invoice.total_taxes||[]).some(t=>t.amount))fail(409,'BILLING_REVIEW','The invoice amount, currency or service period needs review.');
 const payments=await stripe('/v1/invoice_payments?invoice='+stripeId(invoice,'in')+'&limit=10'),paid=payments.data?.filter(p=>p.status==='paid');
 if(payments.has_more||paid?.length!==1||paid[0].livemode!==false||paid[0].currency!=='usd'||paid[0].amount_paid!==p.amount||paid[0].payment?.type!=='payment_intent')fail(409,'BILLING_REVIEW','The invoice payment needs review.');
 const pi=await stripe('/v1/payment_intents/'+stripeId(paid[0].payment.payment_intent,'pi')+'?expand[]=latest_charge');
 if(pi.livemode!==false||id(pi.customer)!==id(invoice.customer)||pi.currency!=='usd'||pi.amount_received!==p.amount||pi.status!=='succeeded')fail(409,'BILLING_REVIEW','The invoice payment could not be confirmed.');
 let charge=pi.latest_charge;if(typeof charge==='string')charge=await stripe('/v1/charges/'+stripeId(charge,'ch'));
 if(!charge||charge.livemode!==false||!charge.paid||!charge.captured||charge.amount!==p.amount||charge.currency!=='usd'||id(charge.customer)!==id(invoice.customer))fail(409,'BILLING_REVIEW','The captured payment could not be confirmed.');
 let disputed=charge.disputed;if(disputed){const dispute=await stripe('/v1/disputes?charge='+stripeId(charge,'ch')+'&limit=10');if(dispute.has_more||!Array.isArray(dispute.data))fail(409,'BILLING_REVIEW','This disputed payment needs review.');disputed=dispute.data.some(d=>d.status!=='won');}
 return {invoice:invoice.id,subscription:sub.id,account,charge:charge.id,start,end,amount:p.amount,revoked:charge.amount_refunded>=charge.amount||disputed?1:0,review:charge.amount_refunded>0||disputed?1:0};
}
async function reconcile(env,stripe,customer,account,subId,prices,at,invoiceId=null){
 const sub=await stripe('/v1/subscriptions/'+stripeId(subId,'sub')),checked=checkSubscription(sub,customer,account,prices);if(!checked)return false;
 const invoiceIds=[...new Set([invoiceId,id(sub.latest_invoice)].filter(Boolean))],payments=[];
 for(const invoiceId of invoiceIds){const invoice=await stripe('/v1/invoices/'+stripeId(invoiceId,'in'));if(id(invoice.customer)!==customer||id(invoice.parent?.subscription_details?.subscription)!==sub.id)fail(409,'BILLING_OBJECT','Invoice ownership does not match.');const payment=await invoicePayment(stripe,invoice,sub,account,prices);if(payment)payments.push(payment);}
 const statements=[q(env,'INSERT INTO billing_subscriptions(subscription_id,account_id,customer_id,plan_id,status,cancel_at_period_end,cancel_at,period_end,updated_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(subscription_id) DO UPDATE SET plan_id=excluded.plan_id,status=excluded.status,cancel_at_period_end=excluded.cancel_at_period_end,cancel_at=excluded.cancel_at,period_end=excluded.period_end,updated_at=excluded.updated_at',sub.id,account,customer,checked.plan,sub.status,sub.cancel_at_period_end?1:0,seconds(sub.cancel_at),seconds(checked.item.current_period_end),at)];
 for(const p of payments)statements.push(q(env,'INSERT INTO billing_payments(invoice_id,subscription_id,account_id,charge_id,period_start,period_end,amount,currency,revoked,review_required,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(invoice_id) DO UPDATE SET revoked=excluded.revoked,review_required=excluded.review_required,updated_at=excluded.updated_at',p.invoice,p.subscription,p.account,p.charge,p.start,p.end,p.amount,'usd',p.revoked,p.review,at));
 statements.push(q(env,'INSERT INTO billing_grants(subscription_id,account_id,expires_at,updated_at) SELECT ?,?,COALESCE(MAX(period_end),0),? FROM billing_payments WHERE subscription_id=? AND account_id=? AND revoked=0 AND period_start<=? ON CONFLICT(subscription_id) DO UPDATE SET expires_at=excluded.expires_at,updated_at=excluded.updated_at',sub.id,account,at,sub.id,account,at));
 await env.DB.batch(statements);return true;
}
async function refreshAccount(env,stripe,account,prices,at){
 const customer=await q(env,'SELECT * FROM billing_customers WHERE account_id=?',account).first();if(!customer||customer.deleting)return;
 const list=await subscriptions(stripe,customer.customer_id);if(list.length>20)fail(409,'BILLING_REVIEW','Please contact support to reconcile this account.');
 for(const sub of list)if(sub.metadata?.app==='studytimely'&&sub.metadata?.account_id===account)await reconcile(env,stripe,customer.customer_id,account,sub.id,prices,at);
}
async function billingStatus(env,config,user,at){
 const subscriptions=(await q(env,'SELECT plan_id AS plan,status,cancel_at_period_end AS cancelAtPeriodEnd,cancel_at AS cancelAt,period_end AS periodEnd FROM billing_subscriptions WHERE account_id=? ORDER BY updated_at DESC LIMIT 20',user.id).all()).results;
 const paid=await q(env,'SELECT MAX(expires_at) AS expiry FROM billing_grants WHERE account_id=?',user.id).first(),legacy=await q(env,'SELECT expires_at FROM community_entitlements WHERE account_id=?',user.id).first();
 const expiry=Math.max(paid?.expiry||0,legacy?.expires_at||0),customer=await q(env,'SELECT deleting FROM billing_customers WHERE account_id=?',user.id).first();
 return {enabled:config.enabled,configured:config.configured,ready:config.ready,environment:'test',plus:expiry>at,expiresAt:expiry,syncWriteAllowed:env.SYNC_REQUIRE_PLUS!=='true'||expiry>at,canManage:!!customer&&!customer.deleting,subscriptions,plans:Object.entries(PLUS_PLANS).map(([plan,p])=>({plan,amount:p.amount,currency:'usd',interval:p.interval})),aiMonthlyLimit:4};
}
async function eventTarget(stripe,event){
 const obj=event.data.object;
 if(event.type.startsWith('checkout.session.')){const session=await stripe('/v1/checkout/sessions/'+stripeId(obj.id,'cs'));return {customer:id(session.customer),subscription:id(session.subscription)};}
 if(event.type.startsWith('customer.subscription.')){const sub=await stripe('/v1/subscriptions/'+stripeId(obj.id,'sub'));return {customer:id(sub.customer),subscription:sub.id};}
 if(event.type.startsWith('invoice.')){const invoice=await stripe('/v1/invoices/'+stripeId(obj.id,'in'));return {customer:id(invoice.customer),subscription:id(invoice.parent?.subscription_details?.subscription),invoice:invoice.id};}
 let chargeId=event.type.startsWith('charge.dispute.')?id((await stripe('/v1/disputes/'+stripeId(obj.id,'dp'))).charge):obj.id;
 const charge=await stripe('/v1/charges/'+stripeId(chargeId,'ch'));if(!charge.payment_intent)return {};
 const payments=await stripe('/v1/invoice_payments?payment[type]=payment_intent&payment[payment_intent]='+stripeId(charge.payment_intent,'pi')+'&limit=10');if(payments.has_more||payments.data?.length>1)fail(409,'BILLING_REVIEW','The payment allocation needs review.');
 const invoiceId=id(payments.data?.[0]?.invoice);if(!invoiceId)return {};
 const invoice=await stripe('/v1/invoices/'+stripeId(invoiceId,'in'));return {customer:id(invoice.customer),subscription:id(invoice.parent?.subscription_details?.subscription),invoice:invoice.id};
}
export function createBillingApi({now=Date.now,fetcher=fetch}={}){return async function billing(request,env,siteConfig=true){
 const at=now(),path=new URL(request.url).pathname,config=billingConfig(env,request),stripe=stripeClient(env,fetcher);
 try{
  const accountsEnabled=typeof siteConfig==='boolean'?siteConfig:siteConfig.accountsEnabled===true;
  if(path==='/api/billing/options'){
   if(request.method!=='GET')fail(405,'METHOD','Use GET.');
   const preview=key=>siteConfig?.[key]===true&&(!siteConfig[key+'EndsAt']||siteConfig[key+'EndsAt']>at);
   return result({enabled:accountsEnabled&&!!env.DB&&config.enabled,ready:accountsEnabled&&!!env.DB&&config.ready,environment:config.enabled?'test':null,plans:publicPlans(),previews:{planning:preview('advancedPlanningPreview'),analytics:preview('advancedAnalyticsPreview'),library:preview('advancedLibraryPreview'),sync:env.SYNC_REQUIRE_PLUS!=='true'}});
  }
  if(!accountsEnabled||!env.DB)fail(503,'BILLING_DISABLED','Billing is not available in this environment.');
  if(path==='/api/billing/webhook'){
   if(request.method!=='POST')fail(405,'METHOD','Use POST.');if(!config.ready)fail(503,'BILLING_DISABLED','Sandbox billing is not configured.');
   const incoming=await verifyStripeEvent(request,env.STRIPE_WEBHOOK_SECRET,at);
   // Fetch from this API key's account, not merely the signed incoming payload.
   const event=await stripe('/v1/events/'+stripeId(incoming.id,'evt'));if(event.id!==incoming.id||event.type!==incoming.type||event.livemode!==false)fail(400,'BILLING_OBJECT','Unexpected event.');
   const previous=await q(env,'SELECT status FROM billing_events WHERE event_id=?',event.id).first();if(['processed','ignored'].includes(previous?.status))return result({received:true,replayed:true});
   await q(env,"INSERT INTO billing_events(event_id,event_type,object_id,status,received_at) VALUES(?,?,?,'received',?) ON CONFLICT(event_id) DO NOTHING",event.id,event.type,event.data.object.id,at).run();
   let processed=false;
   if(BILLING_EVENTS.includes(event.type)){
    const target=await eventTarget(stripe,event),mapping=target.customer?await q(env,'SELECT account_id,deleting FROM billing_customers WHERE customer_id=?',target.customer).first():null;
    if(mapping?.account_id&&!mapping.deleting&&target.subscription)await locked(env,mapping.account_id,at,async()=>{const still=await q(env,'SELECT account_id,deleting FROM billing_customers WHERE customer_id=?',target.customer).first();if(still?.account_id&&!still.deleting)processed=await reconcile(env,stripe,target.customer,still.account_id,target.subscription,await checkedPrices(stripe,config),at,target.invoice);});
   }
   await q(env,'UPDATE billing_events SET status=?,processed_at=? WHERE event_id=?',processed?'processed':'ignored',at,event.id).run();return result({received:true});
  }
  const user=await identity(request,env,at),method=request.method;
  if(path==='/api/billing/status'&&method==='GET'){
   if(!config.enabled)return result({enabled:false,ready:false,environment:null,plus:false});
   return result(await billingStatus(env,config,user,at));
  }
  if(!config.ready)fail(503,'BILLING_DISABLED','Sandbox payments are not ready yet. Your existing access has not changed.');
  await rateLimit(env,'billing',user.id,30,3600000,at);
  if(path==='/api/billing/refresh'&&method==='POST'){await locked(env,user.id,at,async()=>refreshAccount(env,stripe,user.id,await checkedPrices(stripe,config),at));return result(await billingStatus(env,config,user,at));}
  // A deliberate user action creates a Checkout or portal; status reads never do.
  if(path==='/api/billing/portal'&&method==='POST')return result(await locked(env,user.id,at,async()=>{const customer=await q(env,'SELECT customer_id,deleting FROM billing_customers WHERE account_id=?',user.id).first();if(!customer||customer.deleting)fail(409,'NO_SUBSCRIPTION','No subscription is available to manage.');return portal(stripe,customer.customer_id,config.origin,env.STRIPE_PORTAL_CONFIGURATION);}));
  if(path==='/api/billing/checkout'&&method==='POST'){
   const input=await body(request);if(!Object.hasOwn(PLUS_PLANS,input.plan)||Object.keys(input).some(k=>k!=='plan'))fail(400,'PLAN','Choose the monthly or annual Plus plan.');
   return result(await locked(env,user.id,at,async()=>{
    const prices=await checkedPrices(stripe,config),customer=await customerFor(env,user,stripe,at),existing=await subscriptions(stripe,customer.customer_id);
    if(existing.some(s=>activeStatuses.includes(s.status)))return {...await portal(stripe,customer.customer_id,config.origin,env.STRIPE_PORTAL_CONFIGURATION),manage:true};
    let intent=await q(env,'SELECT * FROM billing_checkouts WHERE account_id=?',user.id).first();
    if(intent?.session_id){const session=await stripe('/v1/checkout/sessions/'+stripeId(intent.session_id,'cs'));if(id(session.customer)!==customer.customer_id)fail(409,'BILLING_OBJECT','Checkout ownership does not match.');if(session.status==='complete'&&!existing.some(s=>s.id===id(session.subscription)&&['canceled','incomplete_expired'].includes(s.status)))fail(409,'PAYMENT_CONFIRMING','Payment is being confirmed. Refresh membership before buying again.');if(session.status==='open'&&intent.plan_id===input.plan&&intent.expires_at>at)return {url:intent.url};if(session.status==='open')await stripe('/v1/checkout/sessions/'+session.id+'/expire',{method:'POST'});intent=null;}
    if(!intent||intent.expires_at<=at||intent.plan_id!==input.plan){intent={intent_id:crypto.randomUUID(),plan_id:input.plan,expires_at:Math.floor(at/1000)*1000+1920000};await q(env,'INSERT INTO billing_checkouts(account_id,intent_id,plan_id,expires_at,created_at) VALUES(?,?,?,?,?) ON CONFLICT(account_id) DO UPDATE SET intent_id=excluded.intent_id,plan_id=excluded.plan_id,session_id=NULL,url=NULL,expires_at=excluded.expires_at,created_at=excluded.created_at',user.id,intent.intent_id,input.plan,intent.expires_at,at).run();}
    const session=await stripe('/v1/checkout/sessions',{method:'POST',key:'studytimely-checkout-'+intent.intent_id,data:{mode:'subscription',customer:customer.customer_id,client_reference_id:user.id,'line_items[0][price]':prices[input.plan].id,'line_items[0][quantity]':'1','subscription_data[metadata][app]':'studytimely','subscription_data[metadata][account_id]':user.id,'metadata[app]':'studytimely','metadata[account_id]':user.id,success_url:config.origin+'/account?view=settings&billing=success#plus-membership',cancel_url:config.origin+'/account?view=settings&billing=cancelled#plus-membership',expires_at:String(intent.expires_at/1000)}});
    if(session.livemode!==false||!session.url?.startsWith('https://checkout.stripe.com/'))fail(503,'BILLING_URL','Checkout is unavailable.');
    await q(env,'UPDATE billing_checkouts SET session_id=?,url=? WHERE account_id=? AND intent_id=?',stripeId(session,'cs'),session.url,user.id,intent.intent_id).run();return {url:session.url};
   }));
  }
  fail(405,'METHOD','This billing action is not supported.');
 }catch(e){return result({error:{code:e instanceof ApiError?e.code:'BILLING_UNAVAILABLE',message:e instanceof ApiError?e.message:'Billing could not be checked. Please try again.'}},e instanceof ApiError?e.status:503);}
};}
export async function prepareBillingDeletion(request,env,account,at=Date.now(),fetcher=fetch){
 const customer=await q(env,'SELECT * FROM billing_customers WHERE account_id=?',account).first();if(!customer)return;
 const config=billingConfig(env,request);if(!config.configured)fail(503,'BILLING_DELETION','Billing must be available to stop renewals before deleting this account.');const stripe=stripeClient(env,fetcher);
 await locked(env,account,at,async()=>{
  await q(env,'UPDATE billing_customers SET deleting=1 WHERE account_id=?',account).run();
  const sessions=await stripe('/v1/checkout/sessions?customer='+stripeId(customer.customer_id,'cus')+'&limit=100');if(sessions.has_more||!Array.isArray(sessions.data))fail(409,'BILLING_DELETION','Pending checkouts need review before deleting this account.');
  for(const session of sessions.data)if(session.status==='open'&&id(session.customer)===customer.customer_id)await stripe('/v1/checkout/sessions/'+stripeId(session,'cs')+'/expire',{method:'POST'});
  for(const sub of await subscriptions(stripe,customer.customer_id))if(activeStatuses.includes(sub.status)){const canceled=await stripe('/v1/subscriptions/'+stripeId(sub,'sub'),{method:'DELETE',key:'studytimely-delete-'+sub.id});if(canceled.status!=='canceled')fail(503,'BILLING_DELETION','A renewal could not be stopped. Account deletion has not completed.');}
 });
}
export async function billingAccountData(env,account){
 return {
  subscriptions:(await q(env,'SELECT plan_id,status,cancel_at_period_end,cancel_at,period_end,updated_at FROM billing_subscriptions WHERE account_id=?',account).all()).results,
  payments:(await q(env,'SELECT invoice_id,period_start,period_end,amount,currency,revoked,review_required,updated_at FROM billing_payments WHERE account_id=?',account).all()).results,
  grants:(await q(env,'SELECT expires_at,updated_at FROM billing_grants WHERE account_id=?',account).all()).results
 };
}
