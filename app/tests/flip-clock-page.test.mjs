import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {metadata} from '../src/lib/site.mjs';
import {routeFor} from '../src/lib/routes.mjs';

test('the local clock explains current time without showing the learning overview; the homepage retains it',async()=>{
 const read=path=>fs.readFile(new URL('../dist/client/'+path,import.meta.url),'utf8');
 const [clock,home]=await Promise.all([read('flip-clock/index.html'),read('index.html')]);
 assert.equal((clock.match(/<h1[ >]/g)||[]).length,1);assert.ok(clock.includes('<h1>Free Online Flip Clock</h1>'));
 assert.ok(clock.includes('local-clock-screen'));assert.ok(clock.includes('class="clock-date"'));assert.ok(clock.includes('id="world-clock"'));
 assert.ok(!clock.includes('class="progress-teaser"'));assert.ok(home.includes('class="progress-teaser"'));
 assert.ok(!clock.includes('class="how-section"'));assert.ok(clock.includes('id="world-heading"'));
 const guide=clock.split('<article class="flip-clock-guide"')[1]?.split('</article>')[0];assert.ok(guide);
 const words=guide.replace(/<[^>]*>/g,' ').split(/\s+/).filter(Boolean).length;assert.ok(words>1800);
 assert.equal((guide.match(/<details>/g)||[]).length,12);
 for(const id of ['flip-clock-how','flip-clock-fullscreen','flip-clock-display','flip-clock-uses','flip-clock-time','flip-clock-help','flip-clock-offline','flip-clock-tools','flip-clock-faq'])assert.ok(guide.includes(`id="${id}"`));
 for(const [,path]of guide.matchAll(/href="(\/[^"#]*)"/g))assert.ok(routeFor(path),path);
 assert.ok(guide.includes('does not independently synchronise'));assert.ok(guide.includes('does not create learning records'));
 assert.equal((guide.match(/class="pwa-notice"/g)||[]).length,1);assert.ok(!guide.includes('aggregateRating'));
 console.log(JSON.stringify({flipClockGuideWords:words,faqAnswers:12}));
});
test('flip clock metadata keeps the canonical, reflects real display options and includes its breadcrumb',()=>{
 const m=metadata('/flip-clock',{origin:'https://studytimely.com',indexable:true});
 assert.match(m.title,/Seconds & Fullscreen/);assert.match(m.description,/12\/24-hour/);assert.equal(m.canonical,'https://studytimely.com/flip-clock');assert.equal(m.schema.isAccessibleForFree,true);assert.equal(m.breadcrumb.itemListElement[1].name,'Flip Clock');
 assert.equal(metadata('/flip-clock',{origin:'https://studytimely.com',indexable:false}).robots,'noindex,nofollow');
});
