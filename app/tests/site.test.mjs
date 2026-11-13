import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createWorker} from '../server/cloudflare.mjs';
import {metadata} from '../src/lib/site.mjs';
import {ROUTES} from '../src/lib/routes.mjs';
import {safeEvent,createAnalytics} from '../src/lib/analytics.mjs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const worker=createWorker({indexable:false,analyticsEnabled:false});
const calls=[];
const env={ASSETS:{async fetch(req){const path=new URL(req.url).pathname;calls.push(path);const found=path==='/index.html'||path.endsWith('/index.html')||path==='/404.html'||path==='/assets/main.js';return new Response(found?'rendered':'missing',{status:found?200:404,headers:{'content-type':path.endsWith('.js')?'text/javascript':'text/html'}});}}};
test('public routes map to distinct prerendered HTML; alias and trailing slash redirect',async()=>{
 for(const route of ROUTES){calls.length=0;const r=await worker.fetch(new Request('https://example.test'+route.path),env);assert.equal(r.status,200);assert.equal(calls[0],route.path==='/'?'/index.html':route.path+'/index.html');assert.match(r.headers.get('x-robots-tag'),/noindex/);}
 for(const [path,status,location] of [['/study-timer',301,'/'],['/pomodoro-timer/',308,'/pomodoro-timer'],['/index.html',301,'/']]){const r=await worker.fetch(new Request('https://example.test'+path),env);assert.equal(r.status,status);assert.equal(r.headers.get('location'),location);}
});
test('404 and non-GET requests never silently become a success page',async()=>{
 const r=await worker.fetch(new Request('https://example.test/missing',{headers:{accept:'text/html'}}),env);assert.equal(r.status,404);assert.equal(await r.text(),'rendered');
 assert.equal((await worker.fetch(new Request('https://example.test/',{method:'POST'}),env)).status,405);
 for(const path of ['/api/test','/design-review.html'])assert.equal((await worker.fetch(new Request('https://example.test'+path),env)).status,404);
});
test('configured hostname uses HTTPS and redirects www while retaining the path and query',async()=>{
 const production=createWorker({origin:'https://studytimely.com',indexable:true});
 for(const url of ['http://studytimely.com/focus-timer?x=1','https://www.studytimely.com/focus-timer?x=1']){
  const r=await production.fetch(new Request(url),env);assert.equal(r.status,308);assert.equal(r.headers.get('location'),'https://studytimely.com/focus-timer?x=1');
 }
 assert.equal((await production.fetch(new Request('http://127.0.0.1:4174/'),env)).status,200);
});
test('preview metadata never invents a domain; production metadata uses only real routes',()=>{
 const preview=metadata('/',{origin:'',indexable:false});assert.equal(preview.canonical,'');assert.match(preview.robots,/noindex/);assert.equal(preview.schema,null);
 const configured={origin:'https://example.test',indexable:true};const actual=metadata('/focus-timer',configured);assert.equal(actual.canonical,'https://example.test/focus-timer');assert.equal(actual.schema.isAccessibleForFree,true);assert.equal(metadata('/study-groups',configured).robots,'noindex,nofollow');assert.equal(metadata('/account',configured).robots,'noindex,nofollow');assert.equal(metadata('/study-planner',configured).robots,'index,follow');
});
test('the built HTML contains real title/body/links for every route and no review pages',async()=>{
 const release=process.env.STUDY_TEST_RELEASE==='1';
 for(const route of ROUTES){const file=route.path==='/'?'dist/client/index.html':`dist/client${route.path}/index.html`;const html=await fs.readFile(new URL('../'+file,import.meta.url),'utf8');assert.match(html,/<h1/);assert.ok(html.includes(route.h1?route.h1:route.title==='Study Tracker'?'Track your study time':route.id==='cookies'?'Cookies and Local Storage Notice':route.title));assert.ok(html.includes(`content="${release&&route.indexable!==false?'index,follow':'noindex,nofollow'}"`));assert.ok(html.includes('href="/privacy"'));if(release){assert.ok(html.includes(`rel="canonical" href="https://studytimely.com${route.path}"`));assert.ok(!html.includes('INTERNAL DRAFT'));assert.ok(!html.includes('[待确认'));}}
 await assert.rejects(fs.access(new URL('../dist/client/design-review.html',import.meta.url)));
 const robots=await fs.readFile(new URL('../dist/client/robots.txt',import.meta.url),'utf8'),sitemap=await fs.readFile(new URL('../dist/client/sitemap.xml',import.meta.url),'utf8');
 if(release){assert.match(robots,/Sitemap: https:\/\/studytimely.com\/sitemap.xml/);assert.equal((sitemap.match(/<loc>/g)||[]).length,ROUTES.filter(r=>r.indexable!==false&&!['privacy','terms','cookies'].includes(r.id)).length);}else{assert.equal(robots,'User-agent: *\nDisallow: /\n');assert.ok(!sitemap.includes('<loc>'));}
});
test('analytics accepts only whitelisted behavior fields and remains absent before opt-in',()=>{
 assert.deepEqual(safeEvent('timer_start',{mode:'study',subject:'private',email:'private'}),{name:'timer_start',params:{mode:'study'}});assert.equal(safeEvent('purchase',{mode:'study'}),null);
 const sent=[],frames=[],listeners={};const win={location:{origin:'https://example.test'},addEventListener:(k,v)=>listeners[k]=v,removeEventListener:()=>{}};
 const doc={cookie:'_ga=fixture',createElement:()=>({contentWindow:{postMessage:m=>sent.push(m)},remove(){this.removed=true;}}),body:{append:f=>frames.push(f)}};
 const a=createAnalytics({id:'G-TEST',enabled:true,win,doc});a.page('/');a.track('timer_start',{mode:'study'});assert.equal(frames.length,0);
 a.consent(true);assert.equal(frames.length,1);a.page('/?subject=private');a.page('/');a.track('timer_start',{mode:'study',subject:'private'});
 listeners.message({source:frames[0].contentWindow,origin:win.location.origin,data:{type:'studytimely-analytics-ready'}});
 assert.equal(sent[0].type,'init');assert.equal(sent.filter(x=>x.type==='page').length,1);assert.ok(!JSON.stringify(sent).includes('private'));
 a.consent(false);assert.equal(frames[0].removed,true);assert.match(doc.cookie,/Max-Age=0/);const count=sent.length;a.track('timer_start',{mode:'study'});assert.equal(sent.length,count);a.destroy();
});
test('initial Tracker HTML is timezone independent for hydration before local data loads',async()=>{
 const run=promisify(execFile),module=new URL('../dist/ssr/entry-server.js',import.meta.url).href;
 const code=`import {render} from ${JSON.stringify(module)};process.stdout.write(render('/study-tracker',Date.UTC(2026,10,12,23,30)));`;
 const results=await Promise.all(['UTC','Asia/Tokyo'].map(TZ=>run(process.execPath,['--input-type=module','-e',code],{env:{...process.env,TZ},maxBuffer:2*1024*1024})));
 assert.equal(results[0].stdout,results[1].stdout);
});
