import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createAnalytics,ANALYTICS_PATHS} from '../src/lib/analytics.mjs';
import {createWorker} from '../server/cloudflare.mjs';

test('both providers remain gated, private navigation destroys SDK context and consent is not replayed',()=>{
 const frames=[],sent=[],listeners={};const win={location:{origin:'https://example.test'},addEventListener:(k,v)=>listeners[k]=v,removeEventListener:()=>{}};
 const doc={cookie:'_ga=fixture',createElement:()=>({contentWindow:{postMessage:m=>sent.push(m)},remove(){this.removed=true;}}),body:{append:f=>frames.push(f)}};
 const a=createAnalytics({id:'G-TEST',ahrefsKey:'test-public-key-12345',enabled:true,win,doc});a.page('/account');a.consent(true);assert.equal(frames.length,0);
 a.page('/study-planner');assert.equal(frames.length,1);listeners.message({source:frames[0].contentWindow,origin:win.location.origin,data:{type:'studytimely-analytics-ready'}});
 assert.equal(sent[0].ahrefsKey,'test-public-key-12345');assert.equal(sent[0].path,'/study-planner');
 a.page('/account');assert.equal(frames[0].removed,true);const before=sent.length;a.track('timer_start',{mode:'study'});assert.equal(sent.length,before);
 a.page('/');assert.equal(frames.length,2);a.consent(false);assert.equal(frames[1].removed,true);a.page('/pomodoro-timer');assert.equal(frames.length,2);a.destroy();
 assert.ok(!ANALYTICS_PATHS.includes('/account'));assert.ok(!ANALYTICS_PATHS.includes('/privacy'));
});

test('isolated SDK bridge sends each sanitized public page once and excludes unapproved fields',async()=>{
 const scripts=[],ahrefsEvents=[],handlers={};const ctx={location:{origin:'https://example.test'},parent:{postMessage(){}},addEventListener:(k,v)=>handlers[k]=v,Date};ctx.window=ctx;
 ctx.document={title:'',createElement:()=>({attrs:{},setAttribute(k,v){this.attrs[k]=v;}}),head:{append:s=>scripts.push(s)}};
 const source=await fs.readFile(new URL('../public/analytics-frame.js',import.meta.url),'utf8');vm.runInNewContext(source,ctx);
 const message=(data,origin=ctx.location.origin)=>handlers.message({source:ctx.parent,origin,data});
 const init={type:'init',id:'G-TEST',ahrefsKey:'test-public-key-12345',path:'/study-planner'};message(init,'https://untrusted.test');assert.equal(scripts.length,0);message(init);assert.equal(scripts.length,2);
 const script=scripts.find(s=>s.src.includes('ahrefs'));assert.equal(script.attrs['data-no-pageview-auto'],'');assert.equal(script.attrs['data-no-pageview-on-load'],'');
 ctx.AhrefsAnalytics={sendEvent:(name,options)=>ahrefsEvents.push({name,options,url:script.attrs['data-page-location']})};script.onload();
 message({type:'page',path:'/study-planner'});message({type:'page',path:'/account?email=private'});message({type:'event',name:'timer_start',params:{mode:'study',email:'private',subject:'private'}});message(init);
 assert.equal(scripts.length,2);assert.equal(ctx.dataLayer.filter(x=>x[0]==='event'&&x[1]==='page_view').length,1);assert.equal(ahrefsEvents.filter(x=>x.name==='pageview').length,1);assert.ok(!JSON.stringify(ahrefsEvents).includes('private'));assert.ok(!JSON.stringify(ctx.dataLayer).includes('private'));
 for(const path of ANALYTICS_PATHS)message({type:'page',path});assert.equal(ahrefsEvents.at(-1).url,ctx.location.origin+ANALYTICS_PATHS.at(-1));
 const config=ctx.dataLayer.find(x=>x[0]==='config')[2];assert.equal(config.send_page_view,false);assert.equal(config.first_party_collection,false);assert.equal(config.cookie_expires,2592000);
});

test('third-party CSP permissions exist only on the optional analytics document',async()=>{
 const worker=createWorker({analyticsEnabled:true}),env={ASSETS:{fetch:async()=>new Response('fixture')}};
 for(const path of ['/','/account','/analytics-frame.html']){const r=await worker.fetch(new Request('https://example.test'+path),env),csp=r.headers.get('Content-Security-Policy');assert.equal(csp.includes('https://analytics.ahrefs.com'),path==='/analytics-frame.html');assert.equal(csp.includes('https://www.googletagmanager.com'),path==='/analytics-frame.html');}
});
