import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
export async function buildPwa(root,routes){
 const dir=path.join(root,'dist/client'),assets=(await fs.readdir(path.join(dir,'assets'))).filter(f=>/\.(js|css|woff2)$/.test(f)).map(f=>'/assets/'+f);
 const version=createHash('sha256').update(assets.join('|')+routes.map(r=>r.path).join('|')).digest('hex').slice(0,16);
 const pages=routes.filter(r=>!['app','account','privacy','terms','cookies'].includes(r.id)).map(r=>r.path);
 const precache=[...new Set([...pages,'/app','/manifest.webmanifest',...assets,'/design-assets/brand/icon-192.png','/design-assets/brand/app-icon.png'])];
 const sw=`/* Generated public app-shell cache. No API responses or user records are cached. */
const CACHE='studytimely-shell-${version}';
const FILES=${JSON.stringify(precache)};
const KNOWN=new Set(FILES);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('message',event=>{if(event.data?.type==='APPLY_UPDATE')self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil((async()=>{const names=await caches.keys();await Promise.all(names.filter(n=>n.startsWith('studytimely-shell-')&&n!==CACHE).map(n=>caches.delete(n)));await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 const r=event.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==self.location.origin||u.pathname.startsWith('/api/')||!KNOWN.has(u.pathname))return;
 const key=u.origin+u.pathname;
 if(r.mode==='navigate')event.respondWith((async()=>{const cache=await caches.open(CACHE);try{const fresh=await fetch(r);if(fresh.ok&&!u.search&&!/private|no-store/.test(fresh.headers.get('cache-control')||''))await cache.put(key,fresh.clone());return fresh;}catch{const saved=await cache.match(key);return saved||new Response('Open a previously cached timer when you are back online.',{status:503,headers:{'Content-Type':'text/plain'}});}})());
 else event.respondWith((async()=>{const saved=await caches.match(key);return saved||fetch(r);})());
});
`;
 await fs.writeFile(path.join(dir,'sw.js'),sw);await fs.writeFile(path.join(dir,'pwa-build.json'),JSON.stringify({version,precache},null,2));return {version,files:precache.length};
}
