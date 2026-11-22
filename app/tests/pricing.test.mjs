import test from 'node:test';
import assert from 'node:assert/strict';
import {PLUS_PLANS,publicPlans,annualSaving,rememberPricingPlan,readPricingPlan,offerMatches,verifiedBillingURL} from '../src/lib/plus-plans.mjs';
import {authReturnPath} from '../server/auth-return.mjs';
import {createBillingApi} from '../server/billing.mjs';
import {metadata} from '../src/lib/site.mjs';
import {routeFor} from '../src/lib/routes.mjs';
import {createWorker} from '../server/cloudflare.mjs';

const memory=()=>{const values=new Map();return{setItem:(k,v)=>values.set(k,v),getItem:k=>values.get(k)||null,removeItem:k=>values.delete(k)};};
test('pricing uses the verified Stripe amounts and honest annual arithmetic',()=>{
 assert.deepEqual(PLUS_PLANS.plus_monthly,{amount:499,interval:'month',label:'Monthly'});
 assert.equal(PLUS_PLANS.plus_annual.amount,3999);assert.equal(PLUS_PLANS.plus_annual.interval,'year');
 assert.equal((3999/1200).toFixed(2),'3.33');assert.equal(annualSaving,33);
 assert.equal(offerMatches({plans:publicPlans()}),true);
 for(const patch of [{amount:1},{currency:'hkd'},{interval:'month'},{plan:'unknown'}]){const plans=publicPlans();Object.assign(plans[1],patch);assert.equal(offerMatches({plans}),false);}
});
test('annual is the default while an explicit recent monthly choice survives sign-in',()=>{
 const storage=memory();assert.equal(readPricingPlan(storage,1000),'plus_annual');
 rememberPricingPlan(storage,'plus_monthly',1000);assert.equal(readPricingPlan(storage,2000),'plus_monthly');
 assert.equal(readPricingPlan(storage,1801000),'plus_annual');
 rememberPricingPlan(storage,'https://evil.test',1000);assert.equal(readPricingPlan(storage,2000),'plus_annual');
 storage.setItem('studytimely-pricing-choice-v2','{"plan":"plus_monthly","expires":9999999999}');assert.equal(readPricingPlan(storage,2000),'plus_annual');
 storage.setItem('studytimely-pricing-choice-v2','broken');assert.equal(readPricingPlan(storage,2000),'plus_annual');
 storage.setItem('studytimely-pricing-choice','{"plan":"plus_monthly","expires":1801000}');assert.equal(readPricingPlan(storage,2000),'plus_annual');
 const blocked={getItem(){throw Error();},setItem(){throw Error();},removeItem(){throw Error();}};assert.doesNotThrow(()=>rememberPricingPlan(blocked,'plus_annual'));assert.equal(readPricingPlan(blocked),'plus_annual');
});
test('hosted billing links and auth returns reject lookalike hosts and open redirects',()=>{
 for(const link of ['https://checkout.stripe.com/c/test','https://billing.stripe.com/p/session'])assert.equal(verifiedBillingURL(link),link);
 for(const link of ['http://checkout.stripe.com/c/test','https://checkout.stripe.com.evil.test','https://evil.test','https://user@checkout.stripe.com','javascript:alert(1)','https://billing.stripe.com:444'])assert.throws(()=>verifiedBillingURL(link));
 assert.equal(authReturnPath('/pricing'),'/pricing');assert.equal(authReturnPath('/study-groups'),'/study-groups');
 for(const value of ['//evil.test','https://study.test/pricing','/pricing?next=https://evil.test','/pricing/','/account?view=settings'])assert.equal(authReturnPath(value),'/account');
});
test('public offer discovery never needs a session, calls Stripe, writes data or exposes configured identifiers',async()=>{
 let calls=0;const api=createBillingApi({now:()=>1000,fetcher:async()=>{calls++;throw Error('No external requests expected');}});
 const env={DB:{prepare(){throw Error('No database reads expected');}},BILLING_ENABLED:'true',BILLING_ENV:'test',STRIPE_SECRET_KEY:'sk_test_synthetic',STRIPE_WEBHOOK_SECRET:'whsec_synthetic',STRIPE_PRICE_PLUS_MONTHLY:'price_month',STRIPE_PRICE_PLUS_ANNUAL:'price_year'};
 const config={accountsEnabled:true,advancedPlanningPreview:true,advancedAnalyticsPreview:true,advancedAnalyticsPreviewEndsAt:999,advancedLibraryPreview:false};
 const response=await api(new Request('http://127.0.0.1:4340/api/billing/options'),env,config),value=await response.json();
 assert.equal(response.status,200);assert.equal(value.ready,true);assert.equal(value.environment,'test');assert.deepEqual(value.previews,{planning:true,analytics:false,library:false,sync:true});assert.equal(calls,0);
 assert.equal(offerMatches(value),true);assert.match(response.headers.get('cache-control'),/no-store/);
 const text=JSON.stringify(value);for(const secret of ['sk_test','whsec','price_month','price_year','customer','subscription','email'])assert.equal(text.includes(secret),false);
 const publicSite=await api(new Request('https://studytimely.com/api/billing/options'),env,config);assert.equal((await publicSite.json()).ready,false);
 const noDB=await api(new Request('http://127.0.0.1:4340/api/billing/options'),{},config);assert.equal((await noDB.json()).enabled,false);
 assert.equal((await api(new Request('http://127.0.0.1:4340/api/billing/options',{method:'POST'}),env,config)).status,405);
});
test('the prelaunch pricing route has canonical metadata but stays out of search and offline purchase flows',()=>{
 const route=routeFor('/pricing'),meta=metadata('/pricing',{origin:'https://studytimely.com',indexable:true});
 assert.equal(route.indexable,false);assert.equal(route.onlineOnly,true);assert.equal(meta.canonical,'https://studytimely.com/pricing');assert.match(meta.robots,/noindex/);assert.match(meta.title,/Free and Plus/);assert.ok(meta.description.length>80);assert.equal(meta.breadcrumb.itemListElement[1].name,'Pricing');assert.equal(meta.schema,null);
});
test('even an indexable deployment serves pricing with a noindex response header',async()=>{
 const worker=createWorker({origin:'https://studytimely.com',indexable:true,accountsEnabled:true});
 const response=await worker.fetch(new Request('https://studytimely.com/pricing'),{ASSETS:{fetch:async()=>new Response('<h1>Pricing preview</h1>',{headers:{'Content-Type':'text/html'}})}},{});
 assert.equal(response.status,200);assert.match(response.headers.get('x-robots-tag'),/noindex/);
});
