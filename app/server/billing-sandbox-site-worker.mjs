import {createWorker} from './cloudflare.mjs';
import {createBillingWebhookWorker} from './billing-webhook-worker.mjs';
import {createSandboxAccess,sandboxSiteAllowed} from './billing-sandbox-access.mjs';
import {result} from './auth-shared.mjs';
export function createBillingSandboxSite({siteFactory=createWorker,receiver=createBillingWebhookWorker(),access=createSandboxAccess()}={}){
 return {async fetch(request,env,ctx){
  if(!sandboxSiteAllowed(request,env))return result({error:{code:'ISOLATION',message:'Use the isolated payment test site.'}},403);
  const path=new URL(request.url).pathname;
  if(path==='/health'||path==='/api/billing/webhook'||path==='/robots.txt')return receiver.fetch(request,env,ctx);
  if(path==='/sandbox/sign-in')return access(request,env);
  if(path.startsWith('/__test/')||path.startsWith('/.'))return result({error:{code:'NOT_FOUND',message:'Not found.'}},404);
  const worker=siteFactory({origin:env.BILLING_ORIGIN,indexable:false,accountsEnabled:true,communityEnabled:false,advancedPlanningPreview:false,advancedAnalyticsPreview:false,advancedLibraryPreview:false,analyticsEnabled:false});
  const response=await worker.fetch(request,{...env,AI_WEEKLY_ENABLED:'false',SYNC_REQUIRE_PLUS:'true'},ctx);
  const headers=new Headers(response.headers);headers.set('X-Robots-Tag','noindex, nofollow');headers.set('Referrer-Policy','no-referrer');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
 }};
}
export default createBillingSandboxSite();
