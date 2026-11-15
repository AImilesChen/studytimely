import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {metadata} from '../src/lib/site.mjs';
import {routeFor} from '../src/lib/routes.mjs';

test('alarm metadata explains the tool and its browser limits with a stable canonical',()=>{
 const m=metadata('/alarm-clock',{origin:'https://studytimely.com',indexable:true});
 assert.equal(m.canonical,'https://studytimely.com/alarm-clock');assert.match(m.title,/Online Alarm Clock with Sound/);assert.match(m.description,/tab open.*device awake/);assert.equal(m.schema['@type'],'WebApplication');assert.equal(m.schema.isAccessibleForFree,true);assert.equal(m.breadcrumb.itemListElement[1].item,m.canonical);assert.equal(m.robots,'index,follow');
});
test('initial alarm HTML includes the useful guide, ten full FAQ answers and valid related tools without JavaScript',async()=>{
 const html=await fs.readFile(new URL('../dist/client/alarm-clock/index.html',import.meta.url),'utf8');const guide=html.split('<div class="alarm-guide">')[1]?.split('</main>')[0];assert.ok(guide);
 const words=guide.replace(/<[^>]*>/g,' ').replace(/&[^;]*;/g,' ').trim().split(/\s+/).length;assert.ok(words>=1100&&words<=1900,`guide has ${words} words`);assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1);assert.equal((guide.match(/<details>/g)||[]).length,10);assert.ok(!guide.includes('<details open'));
 for(const id of ['alarm-how-to','alarm-sound-help','alarm-faq'])assert.ok(guide.includes(`id="${id}"`));
 for(const url of [...guide.matchAll(/href="([^"]+)"/g)].map(x=>x[1]))assert.ok(routeFor(url),url);
 assert.match(guide,/five minutes from that action/);assert.match(guide,/90 seconds/);assert.match(guide,/at most one minute/);assert.match(html,/id="page-schema"/);assert.match(html,/id="breadcrumb-schema"/);assert.ok(!html.includes('FAQPage'));assert.ok(!html.includes('aggregateRating'));
});
