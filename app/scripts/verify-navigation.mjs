import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {ROUTES} from '../src/lib/routes.mjs';
import {TOOL_GROUPS,primaryLinks} from '../src/lib/global-navigation.mjs';
const base=process.env.PREVIEW_ORIGIN||'http://127.0.0.1:4195',config=JSON.parse(await fs.readFile(new URL('../site.config.json',import.meta.url),'utf8'));
const primary=primaryLinks({communityEnabled:config.communityEnabled!==false,accountsEnabled:config.accountsEnabled!==false});
const checks=[],paths=new Set(ROUTES.map(r=>r.path));
for(const group of TOOL_GROUPS)for(const [,url]of group.links)assert.ok(paths.has(url),'Unknown navigation route: '+url);
for(const route of ROUTES){
 const r=await fetch(base+route.path),html=await r.text();assert.equal(r.status,200);
 const header=html.match(/<header class="site-header global-site-header"[^>]*>(.*?)<\/header>/s)?.[1];assert.ok(header,route.path);
 assert.ok(header.includes('aria-label="Primary navigation"'));assert.ok(header.includes('>Tools '));assert.ok(header.includes('aria-label="Open navigation menu"'));
 for(const link of primary)assert.ok(header.includes(`href="${link.path}"`),route.path+' missing '+link.label);
 const explorer=html.match(/<dialog[^>]*class="site-explorer-dialog"[^>]*>.*?<\/dialog>/s)?.[0];assert.ok(explorer,route.path);assert.ok(!/<dialog[^>]*\bopen(?:=|\s|>)/.test(explorer),'Explorer unexpectedly open in initial HTML');
 for(const group of TOOL_GROUPS)for(const [,url]of group.links)assert.ok(explorer.includes(`href="${url}"`));
 assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1);
 if(primary.some(l=>l.path===route.path))assert.ok(header.includes(`href="${route.path}" aria-current="page"`));
 checks.push({path:route.path,status:200,headerPrimaryLinks:true,toolLinks:TOOL_GROUPS.reduce((sum,g)=>sum+g.links.length,0),menuInitiallyClosed:true});
}
const folder=new URL('../../docs/development/evidence/navigation-2026-11-14/',import.meta.url);await fs.mkdir(folder,{recursive:true});await fs.writeFile(new URL('navigation-http.json',folder),JSON.stringify({base,environment:'local preview',checkedAt:new Date().toISOString(),checks},null,2));
console.log(JSON.stringify({passed:true,pages:checks.length,toolLinksPerMenu:checks[0].toolLinks,primaryLinks:primary.length}));
