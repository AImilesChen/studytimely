import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {ROUTES} from '../src/lib/routes.mjs';
const base=process.env.PREVIEW_ORIGIN||'http://127.0.0.1:4200',release=process.argv.includes('--release'),checks=[];
const response=await fetch(base+'/study-groups'),html=await response.text();
assert.equal(response.status,200);assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1);assert.ok(html.includes('Online study groups'));
assert.ok(html.includes(`name="robots" content="${release?'index,follow':'noindex,nofollow'}"`));
assert.ok(html.includes('rel="canonical" href="https://studytimely.com/study-groups"'));
for(const text of ['Create a free room','Join with a code','Browse public rooms','Make a plan before you meet','Online study tools for your group','Study group questions','What counts towards your group’s progress?','Access, privacy and common questions'])assert.ok(html.includes(text),text);
checks.push('public introduction, actions, agenda and FAQs are in the initial HTML');
const known=new Set(ROUTES.map(r=>r.path));
for(const [,href] of html.matchAll(/href="(\/[^"?#]*)(?:[?#][^"]*)?"/g))if(!/\.[a-z0-9]+$/i.test(href))assert.ok(known.has(href),href);
checks.push('internal page links resolve to supported routes');
for(const query of ['?room=00000000-0000-0000-0000-000000000000','?invite=synthetic-preview-only']){
 const r=await fetch(base+'/study-groups'+query);assert.equal(r.status,200);assert.match(r.headers.get('x-robots-tag'),/noindex/);assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(r.headers.get('referrer-policy'),'no-referrer');
 checks.push('private query has noindex, no-store and no-referrer: '+query.split('=')[0]);
}
const sitemap=await(await fetch(base+'/sitemap.xml')).text();assert.equal(sitemap.includes('<loc>https://studytimely.com/study-groups</loc>'),release);checks.push('Sitemap eligibility agrees with the build environment');
const pwa=await(await fetch(base+'/pwa-build.json')).json();assert.ok(!pwa.precache.includes('/study-groups'));checks.push('live community pages stay outside offline precache');
const report={at:new Date().toISOString(),base,environment:release?'release candidate':'local noindex preview',checks,passed:true};
const out=new URL('../../docs/development/evidence/groups-page-2026-11-14/',import.meta.url);await fs.mkdir(out,{recursive:true});await fs.writeFile(new URL(release?'release-http.json':'http.json',out),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
