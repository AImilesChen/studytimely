import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pricingOptions} from '../server/pricing-options.mjs';
import {createWorker} from '../server/cloudflare.mjs';
import {PLUS_PLANS,DEFAULT_PLUS_PLAN,annualSaving,readPricingPlan,rememberPricingPlan,offerMatches} from '../src/lib/plus-plans.mjs';
import {metadata} from '../src/lib/site.mjs';
import {routeFor} from '../src/lib/routes.mjs';

test('production price discovery never activates payments, queries billing tables or exposes credentials',async()=>{
 const env={STRIPE_SECRET_KEY:'sk_test_synthetic',STRIPE_PRICE_PLUS_MONTHLY:'price_synthetic',BILLING_ENABLED:'true',DB:{prepare(){throw Error('Pricing must not query a database');}}};
 const config={accountsEnabled:true,advancedPlanningPreview:true,advancedAnalyticsPreview:true,advancedLibraryPreview:true};
 const worker=createWorker(config),r=await worker.fetch(new Request('https://studytimely.com/api/billing/options'),env,{}),v=await r.json();
 assert.equal(r.status,200);assert.equal(v.enabled,false);assert.equal(v.ready,false);assert.equal(v.environment,null);assert.equal(offerMatches(v),true);assert.match(r.headers.get('cache-control'),/no-store/);
 assert.deepEqual(v.previews,{planning:true,analytics:true,library:true,sync:true});assert.doesNotMatch(JSON.stringify(v),/sk_test|price_synthetic|customer|subscription|email/);
});
test('discovery accepts only GET and honours preview expiry without accounts or a database',async()=>{
 const req=new Request('https://studytimely.com/api/billing/options');
 const v=await(await pricingOptions(req,{}, {advancedPlanningPreview:true,advancedPlanningPreviewEndsAt:50,advancedLibraryPreview:true},100)).json();
 assert.deepEqual(v.previews,{planning:false,analytics:false,library:true,sync:true});
 assert.equal((await pricingOptions(new Request(req.url,{method:'POST'}))).status,405);
});
test('annual-first prices disclose the actual yearly charge and preserve a deliberate monthly choice',()=>{
 assert.equal(DEFAULT_PLUS_PLAN,'plus_annual');assert.equal(PLUS_PLANS.plus_annual.amount,3999);assert.equal(PLUS_PLANS.plus_monthly.amount,499);assert.equal(annualSaving,33);
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 assert.equal(readPricingPlan(storage,1000),'plus_annual');rememberPricingPlan(storage,'plus_monthly',1000);assert.equal(readPricingPlan(storage,2000),'plus_monthly');assert.equal(readPricingPlan(storage,1801000),'plus_annual');
});
test('prelaunch pricing is noindex even when the rest of the production site is indexable',async()=>{
 const route=routeFor('/pricing'),m=metadata('/pricing',{origin:'https://studytimely.com',indexable:true});
 assert.equal(route.onlineOnly,true);assert.equal(route.indexable,false);assert.match(m.robots,/noindex/);assert.equal(m.canonical,'https://studytimely.com/pricing');
 const r=await createWorker({indexable:true}).fetch(new Request('https://studytimely.com/pricing'),{ASSETS:{fetch:async()=>new Response('Pricing')}},{});assert.match(r.headers.get('x-robots-tag'),/noindex/);
});
test('pre-rendered pricing shows annual billing and a labelled decorative saving without a real purchase action',()=>{
 const html=fs.readFileSync('dist/client/pricing/index.html','utf8').replace(/<!--[\s\S]*?-->/g,'');
 assert.match(html,/Save 33% with yearly billing compared with twelve monthly payments/);assert.match(html,/\$39\.99/);assert.match(html,/Charged once a year/);assert.match(html,/about \$3\.33/);assert.match(html,/pricing-saving/);assert.doesNotMatch(html,/library\/full|sk_test_|whsec_/);
 const sw=fs.readFileSync('dist/client/sw.js','utf8'),sitemap=fs.readFileSync('dist/client/sitemap.xml','utf8');assert.ok(!sw.includes('/pricing'));assert.ok(!sitemap.includes('/pricing'));
});
