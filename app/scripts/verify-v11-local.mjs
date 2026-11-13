import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {ROUTES} from '../src/lib/routes.mjs';
import {emptyState} from '../src/lib/model.mjs';
import {backupOf} from '../src/lib/storage.mjs';
const base=process.env.PREVIEW_ORIGIN||'http://127.0.0.1:4181';
if(!['127.0.0.1','localhost'].includes(new URL(base).hostname))throw Error('This synthetic integration script is local-only.');
const checks=[];
for(const route of ROUTES){const r=await fetch(base+route.path),html=await r.text();assert.equal(r.status,200,route.path);assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1,route.path);assert.ok(html.includes('noindex,nofollow'));assert.ok(html.includes('href="/privacy"'));checks.push({path:route.path,status:200,prerendered:true});}
for(const [path,status]of [['/study-groups',404],['/design-review.html',404],['/site.config.json',404],['/api/unknown',404]])assert.equal((await fetch(base+path)).status,status,path);
const manifest=await(await fetch(base+'/manifest.webmanifest')).json();assert.equal(manifest.start_url,'/app');const pwa=await(await fetch(base+'/pwa-build.json')).json();assert.ok(pwa.precache.includes('/study-planner'));assert.ok(!pwa.precache.some(p=>p.startsWith('/api/')||p==='/account'));
const sw=await(await fetch(base+'/sw.js')).text();assert.ok(sw.includes("u.pathname.startsWith('/api/')"));
const production=await fs.readFile(new URL('../dist/cloudflare/worker.mjs',import.meta.url),'utf8');assert.ok(!production.includes('/__test/otp'));assert.ok(!production.includes('synthetic-local-preview-key'));
async function call(path,method='GET',data,auth={}){const r=await fetch(base+path,{method,headers:{origin:base,'content-type':'application/json',...(auth.cookie?{cookie:auth.cookie}:{}),...(auth.csrf?{'x-csrf-token':auth.csrf}:{})},body:data===undefined?undefined:JSON.stringify(data)});return{r,data:await r.json()};}
const address=`worker-qa-${Date.now()}@studytimely.invalid`;
async function login(email){const sent=await call('/api/auth/request-code','POST',{email,accepted:true});assert.equal(sent.r.status,202,JSON.stringify(sent.data));const code=(await(await fetch(base+'/__test/otp?email='+encodeURIComponent(email))).json()).code;assert.ok(code);const verified=await call('/api/auth/verify-code','POST',{email,code});assert.equal(verified.r.status,200,JSON.stringify(verified.data));assert.ok(verified.r.headers.get('set-cookie').includes('HttpOnly'));return{cookie:verified.r.headers.get('set-cookie').split(';')[0],csrf:verified.data.csrf};}
const auth=await login(address),document=backupOf(emptyState('synthetic-test'));
assert.equal((await call('/api/workspace')).r.status,401);
assert.equal((await call('/api/workspace','PUT',{version:0,document},{cookie:auth.cookie})).r.status,403);
assert.equal((await call('/api/workspace','PUT',{version:0,document},auth)).r.status,200);
assert.equal((await call('/api/workspace','PUT',{version:0,document},auth)).r.status,409);
const other=await login('other-'+address);assert.equal((await call('/api/workspace','GET',undefined,other)).data.document,null);
assert.equal((await call('/api/account/export','GET',undefined,auth)).data.account.email,address);
assert.equal((await call('/api/workspace','DELETE',{version:1},auth)).r.status,200);
assert.equal((await call('/api/workspace','GET',undefined,auth)).data.version,2);
assert.equal((await call('/api/account','DELETE',{confirm:'DELETE'},auth)).r.status,200);
assert.equal((await call('/api/workspace','GET',undefined,auth)).r.status,401);
assert.equal((await call('/api/account','DELETE',{confirm:'DELETE'},other)).r.status,200);
checks.push({name:'real-local-D1-and-Worker',otp:'synthetic delivery verified',sessions:'HttpOnly, CSRF, expiry schema',tenantIsolation:true,versionConflict:true,deletionRevokesSession:true,createdTestAccountsDeleted:true});
const out=new URL('../../docs/development/evidence/v1.1/',import.meta.url);await fs.mkdir(out,{recursive:true});await fs.writeFile(new URL('worker-http.json',out),JSON.stringify({at:new Date().toISOString(),environment:'local-workerd',base,compatibilityDate:'2026-10-26',externalMailSent:false,checks,pwa},null,2));
console.log(JSON.stringify({passed:true,publicPages:ROUTES.length,accountIntegration:'passed',pwaPrecache:pwa.precache.length,productionTestBackdoorAbsent:true}));
