import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
async function harness(){
 const code=await fs.readFile(new URL('../dist/client/sw.js',import.meta.url),'utf8'),listeners={},stores=new Map();let skipped=0,claimed=0,network=false;
 const origin='https://study.test';
 const cache={async addAll(paths){for(const p of paths)stores.set(origin+p,new Response('cached '+p));},async match(key){return stores.get(String(key))?.clone();},async put(key,r){stores.set(String(key),r);}};
 const names=['unrelated-cache','studytimely-shell-old'],deleted=[];
 const caches={async open(){return cache;},async keys(){return names;},async delete(n){deleted.push(n);return true;},match:key=>cache.match(key)};
 const self={location:{origin},clients:{async claim(){claimed++;}},skipWaiting(){skipped++;},addEventListener:(name,fn)=>listeners[name]=fn};
 vm.runInNewContext(code,{self,caches,URL,Response,fetch:async()=>{if(!network)throw Error('offline');return new Response('network');}});
 async function event(name,extra={}){let promise;listeners[name]({...extra,waitUntil:p=>promise=p,respondWith:p=>promise=p});return promise?await promise:null;}
 return{event,listeners,deleted,stores,network:on=>network=on,get skipped(){return skipped;},get claimed(){return claimed;},request:(path,mode='navigate')=>({url:origin+path,method:'GET',mode})};
}
test('PWA precache contains public working routes and excludes APIs and account responses',async()=>{
 const build=JSON.parse(await fs.readFile(new URL('../dist/client/pwa-build.json',import.meta.url),'utf8'));
 for(const path of ['/','/app','/study-planner','/study-habit-tracker','/syllabus-tracker'])assert.ok(build.precache.includes(path));
 assert.ok(!build.precache.some(p=>p.startsWith('/api/')||p==='/account'||p.includes('?')));
 const manifest=JSON.parse(await fs.readFile(new URL('../public/manifest.webmanifest',import.meta.url),'utf8'));assert.equal(manifest.start_url,'/app');assert.ok(manifest.icons.some(i=>i.sizes==='512x512'));
});
test('offline navigation restores its own cached route; API/private paths remain network-only',async()=>{
 const h=await harness();await h.event('install');const r=await h.event('fetch',{request:h.request('/study-planner')});assert.equal(await r.text(),'cached /study-planner');
 assert.equal(await h.event('fetch',{request:h.request('/api/workspace')}),null);assert.equal(await h.event('fetch',{request:h.request('/account')}),null);
 const query=await h.event('fetch',{request:h.request('/study-planner?private=value')});assert.equal(await query.text(),'cached /study-planner');assert.ok(![...h.stores.keys()].some(k=>k.includes('private=')));
});
test('updates wait for an explicit message and activation removes only this app’s older cache',async()=>{
 const h=await harness();await h.event('install');assert.equal(h.skipped,0);await h.event('message',{data:{type:'APPLY_UPDATE'}});assert.equal(h.skipped,1);await h.event('activate');assert.deepEqual(h.deleted,['studytimely-shell-old']);assert.equal(h.claimed,1);
});
