import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {ROUTES,routeFor} from '../src/lib/routes.mjs';
import {TOOL_GROUPS,primaryLinks,isToolPath} from '../src/lib/global-navigation.mjs';
test('one shared catalogue keeps all sixteen tool routes and respects primary feature flags',()=>{
 const paths=TOOL_GROUPS.flatMap(g=>g.links.map(([,path])=>path));assert.equal(paths.length,16);assert.equal(new Set(paths).size,paths.length);for(const path of paths){assert.ok(routeFor(path),path);assert.ok(isToolPath(path));}assert.ok(isToolPath('/time/honolulu'));assert.ok(!isToolPath('/account'));assert.deepEqual(primaryLinks({communityEnabled:false,accountsEnabled:false}).map(x=>x.path),['/pricing']);assert.deepEqual(primaryLinks({communityEnabled:false}).map(x=>x.path),['/pricing','/account']);
});
test('every initial route has the shared header, closed disclosures and no legacy workspace bar',async()=>{
 for(const route of ROUTES){const pathname=route.path==='/'?'':route.path.slice(1)+'/',html=await fs.readFile(new URL('../dist/client/'+pathname+'index.html',import.meta.url),'utf8');assert.equal((html.match(/class="site-header global-site-header"/g)||[]).length,1,route.path);assert.ok(!html.includes('workspace-nav'),route.path);assert.ok(!html.includes('aria-label="Study workspace"'),route.path);assert.ok(html.includes('id="site-tools-dropdown"'),route.path);assert.match(html,/<div id="site-tools-dropdown"[^>]*hidden=""/);assert.ok(html.includes('aria-label="Open navigation menu"'));const header=html.match(/<header class="site-header global-site-header"[^>]*>(.*?)<\/header>/s)?.[1];assert.ok(header.includes('href="/pricing"'),route.path+' pricing missing from header');for(const [,path]of TOOL_GROUPS.flatMap(g=>g.links))assert.ok(html.includes(`href="${path}"`),route.path+' '+path);const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length,route.path+' duplicate IDs');}
});
test('city pages mark World Clock as the current parent tool in both navigation surfaces',async()=>{
 const html=await fs.readFile(new URL('../dist/client/time/honolulu/index.html',import.meta.url),'utf8');assert.equal((html.match(/href="\/time" aria-current="page"/g)||[]).length,2);const groups=await fs.readFile(new URL('../dist/client/study-groups/index.html',import.meta.url),'utf8');assert.match(groups,/href="\/study-groups" aria-current="page"/);
});

test('pricing is a public primary destination before the personal account and has current-page state',async()=>{
 const links=primaryLinks();assert.ok(links.findIndex(x=>x.path==='/pricing')<links.findIndex(x=>x.path==='/account'));
 const html=await fs.readFile(new URL('../dist/client/pricing/index.html',import.meta.url),'utf8');
 assert.equal((html.match(/href="\/pricing" aria-current="page"/g)||[]).length,2);
 const explorer=html.match(/<dialog[^>]*class="site-explorer-dialog"[^>]*>.*?<\/dialog>/s)?.[0];assert.ok(explorer.includes('href="/pricing"'));
});
