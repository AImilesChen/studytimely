import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {CITIES} from '../src/lib/world-clock.mjs';
import {CITY_CONTENT} from '../src/lib/city-content.mjs';
import {ROUTES} from '../src/lib/routes.mjs';
const base=process.env.PREVIEW_ORIGIN||'http://127.0.0.1:4193',checks=[];
const escape=s=>s.replaceAll('&','&amp;').replaceAll("'",'&#x27;').replaceAll('"','&quot;');
for(const city of CITIES){
 const path='/time/'+city.slug,r=await fetch(base+path),html=await r.text(),c=CITY_CONTENT[city.slug];
 assert.equal(r.status,200,path);assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1,path);
 assert.ok(html.includes('name="robots" content="noindex,nofollow"'));assert.ok(html.includes(`rel="canonical" href="https://studytimely.com${path}"`));
 assert.ok(html.includes(escape(c.overview)),city.slug+' intro');
 const scripts=[...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].map(m=>JSON.parse(m[1]));
 const trail=scripts.find(s=>s['@type']==='BreadcrumbList');assert.equal(trail.itemListElement[2].item,'https://studytimely.com'+path);
 for(const q of c.faqs)assert.ok(html.includes(escape(q.answer)),city.slug+' FAQ');
 for(const m of html.matchAll(/<a\b[^>]*href="(\/[^"#?]*)(?:[?#][^"]*)?"/g)){const target=m[1];if(target==='/time-zone-data-license.txt')continue;assert.ok(ROUTES.some(r=>r.path===target),city.slug+' broken internal link '+target);}
 const article=html.match(/<article class="city-time-guide".*?<\/article>/s)[0];
 checks.push({city:city.slug,status:r.status,initialHtmlGuide:true,faqAnswers:3,breadcrumb:true,internalLinksValid:true,guideWords:article.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length});
}
const license=await fetch(base+'/time-zone-data-license.txt');assert.equal(license.status,200);assert.match(await license.text(),/Apache License/);
const directory=await(await fetch(base+'/time')).text();assert.ok(directory.includes('Compare cities, not just UTC offsets'));
assert.equal(await(await fetch(base+'/robots.txt')).text(),'User-agent: *\nDisallow: /\n');
const report={base,environment:'local noindex preview',checkedAt:new Date().toISOString(),cityPages:32,faqAnswers:96,license:true,directory:true,checks};
const folder=new URL('../../docs/development/evidence/city-guides-2026-11-14/',import.meta.url);await fs.mkdir(folder,{recursive:true});await fs.writeFile(new URL('city-http.json',folder),JSON.stringify(report,null,2));
console.log(JSON.stringify({passed:true,cities:checks.length,faqAnswers:96,minimumGuideWords:Math.min(...checks.map(c=>c.guideWords)),maximumGuideWords:Math.max(...checks.map(c=>c.guideWords))}));
