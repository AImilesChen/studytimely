import test from 'node:test';
import assert from 'node:assert/strict';
import {createBillingWebhookWorker} from '../server/billing-webhook-worker.mjs';
const base='https://receiver.example.invalid';
const worker=createBillingWebhookWorker();
test('sandbox receiver provides a noindex endpoint address without exposing credentials',async()=>{
 const env={BILLING_ENABLED:'true',BILLING_ENV:'test',BILLING_TEST_ISOLATED:'true',BILLING_ORIGIN:base,STRIPE_SECRET_KEY:'sk_test_synthetic',STRIPE_PRICE_PLUS_MONTHLY:'price_m',STRIPE_PRICE_PLUS_ANNUAL:'price_y',STRIPE_WEBHOOK_SECRET:'whsec_synthetic',DB:{}};
 const r=await worker.fetch(new Request(base+'/api/billing/webhook'),env),v=await r.json();assert.equal(r.status,200);assert.equal(v.ready,true);assert.equal(v.environment,'test');assert.equal(v.method,'POST');assert.equal(v.eventTypes,10);assert.doesNotMatch(JSON.stringify(v),/sk_test|whsec|price_m/);assert.match(r.headers.get('x-robots-tag'),/noindex/);
 assert.equal((await(await worker.fetch(new Request(base+'/health'),{})).json()).ready,false);
});
test('receiver rejects main-domain, live-key, unsigned and unrelated route requests',async()=>{
 assert.equal((await worker.fetch(new Request('https://studytimely.com/api/billing/webhook'),{})).status,403);
 for(const path of ['/__test/enter','/api/billing/checkout','/api/auth/me','/.dev.vars'])assert.equal((await worker.fetch(new Request(base+path),{})).status,404);
 const env={DB:{},BILLING_ENABLED:'true',BILLING_ENV:'test',BILLING_TEST_ISOLATED:'true',BILLING_ORIGIN:base,STRIPE_SECRET_KEY:'sk_test_synthetic',STRIPE_PRICE_PLUS_MONTHLY:'price_m',STRIPE_PRICE_PLUS_ANNUAL:'price_y',STRIPE_WEBHOOK_SECRET:'whsec_synthetic'};
 assert.equal((await worker.fetch(new Request(base+'/api/billing/webhook',{method:'POST',body:'{}'}),env)).status,400);
 assert.equal((await worker.fetch(new Request(base+'/api/billing/webhook',{method:'POST',body:'{}'}),{...env,STRIPE_SECRET_KEY:'sk_live_synthetic'})).status,503);
});
