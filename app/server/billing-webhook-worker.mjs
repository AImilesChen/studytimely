import {createBillingApi} from './billing.mjs';
import {billingConfig,STRIPE_VERSION,BILLING_EVENTS} from './stripe-client.mjs';
import {result} from './auth-shared.mjs';

// Dedicated sandbox receiver. No website, login, fixtures or checkout creation
// routes are exposed here. Its DB and Stripe credentials are separate bindings.
export function createBillingWebhookWorker(options={}){
 const billing=createBillingApi(options);
 return {async fetch(request,env){
  const url=new URL(request.url),path=url.pathname;
  if(['studytimely.com','www.studytimely.com'].includes(url.hostname))return result({error:{code:'ISOLATION',message:'Use the isolated sandbox receiver.'}},403);
  if(path==='/robots.txt')return new Response('User-agent: *\nDisallow: /\n',{headers:{'Content-Type':'text/plain','X-Robots-Tag':'noindex, nofollow'}});
  if(['GET','HEAD'].includes(request.method)&&['/','/health','/api/billing/webhook'].includes(path)){
   const config=billingConfig(env,request);
   const response=result({service:'StudyTimely Stripe sandbox webhook',environment:'test',endpoint:'/api/billing/webhook',method:'POST',apiVersion:STRIPE_VERSION,eventTypes:BILLING_EVENTS.length,ready:!!env.DB&&config.ready,status:config.ready?'ready':'waiting for sandbox endpoint configuration'});
   return request.method==='HEAD'?new Response(null,{status:response.status,headers:response.headers}):response;
  }
  if(path==='/api/billing/webhook'){
   if(request.method!=='POST')return result({error:{code:'METHOD',message:'Use POST.'}},405,{Allow:'POST'});
   return billing(request,env,true);
  }
  return result({error:{code:'NOT_FOUND',message:'Endpoint not found.'}},404);
 }};
}
export default createBillingWebhookWorker();
