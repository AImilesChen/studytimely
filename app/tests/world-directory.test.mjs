import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {CITIES,clockText,dateText,dayDifference,differenceFromYou} from '../src/lib/world-clock.mjs';
import {metadata} from '../src/lib/site.mjs';
import {routeFor} from '../src/lib/routes.mjs';
import {zoneState,nextClockChange,timeZoneName} from '../src/lib/time-zones.mjs';
import {TIME_ZONE_DATA} from '../src/lib/time-zone-data.mjs';

test('directory dates and relative labels preserve cross-day, minute and year boundaries',()=>{
 const at=Date.parse('2026-01-15T18:00:00Z');
 assert.equal(clockText(at,'Europe/London',true),'18:00');assert.equal(clockText(at,'America/New_York',true),'13:00');assert.equal(clockText(at,'Asia/Shanghai',true),'02:00');
 assert.equal(dayDifference(at,'Asia/Shanghai','Europe/London'),1);assert.match(dateText(at,'Asia/Shanghai',true,true),/Jan 16, 2026/);
 assert.match(dateText(Date.parse('2026-12-31T23:30Z'),'Asia/Shanghai',true,true),/Jan 1, 2027/);
 assert.equal(differenceFromYou(at,'Asia/Kathmandu','Europe/London'),'5h 45m ahead of you');assert.equal(differenceFromYou(at,'America/New_York','Europe/London'),'5h behind you');assert.equal(differenceFromYou(at,'Asia/Shanghai','Asia/Shanghai'),'Same time as you');assert.equal(differenceFromYou(0,'Asia/Shanghai','Europe/London'),'Compared with your local time');
});
test('directory metadata has its own search intent, data-derived city count and breadcrumb',()=>{
 const m=metadata('/time',{origin:'https://studytimely.com',indexable:true});assert.match(m.title,/Current Local Times Around the World/);assert.ok(m.description.includes(`${CITIES.length} cities`));assert.equal(m.canonical,'https://studytimely.com/time');assert.equal(m.schema['@type'],'WebApplication');assert.deepEqual(m.breadcrumb.itemListElement.map(x=>x.item),['https://studytimely.com/flip-clock','https://studytimely.com/time']);
});
test('Honolulu has bundled year-round Hawaii rules and date-aware mainland comparisons',()=>{
 const city=CITIES.find(c=>c.slug==='honolulu');assert.equal(city.zone,'Pacific/Honolulu');assert.equal(city.region,'Pacific');assert.equal(CITIES.length%3,0);assert.equal(CITIES.at(-1).slug,'honolulu');assert.ok(TIME_ZONE_DATA.zones[city.zone]);
 const winter=Date.parse('2026-01-15T12:00Z'),summer=Date.parse('2026-07-15T12:00Z');for(const at of [winter,summer]){assert.equal(zoneState(at,city.zone).offset,-600);assert.equal(zoneState(at,city.zone).daylight,false);assert.equal(nextClockChange(at,city.zone),null);assert.equal(timeZoneName(at,city.zone,true),'Hawaii Standard Time');}
 assert.equal(differenceFromYou(winter,city.zone,'America/Los_Angeles'),'2h behind you');assert.equal(differenceFromYou(summer,city.zone,'America/Los_Angeles'),'3h behind you');assert.equal(dayDifference(Date.parse('2026-11-16T01:00Z'),city.zone,'Asia/Tokyo'),-1);
});
test('initial directory HTML exposes substantive instructions, FAQs and all real city destinations',async()=>{
 const html=await fs.readFile(new URL('../dist/client/time/index.html',import.meta.url),'utf8'),guide=html.split('<article class="world-directory-guide"')[1]?.split('</article>')[0];assert.ok(guide);const words=guide.replace(/<[^>]*>/g,' ').replace(/&[^;]*;/g,' ').trim().split(/\s+/).length;assert.ok(words>1500);
 const answers=[...guide.matchAll(/<details><summary>.*?<\/summary>(.*?)<\/details>/gs)];assert.equal(answers.length,8);for(const [,a] of answers)assert.ok(a.replace(/<[^>]*>/g,' ').trim().split(/\s+/).length>=40);
 for(const c of CITIES)assert.ok(guide.includes(`href="/time/${c.slug}"`));for(const [,path]of guide.matchAll(/href="(\/[^"#]*)"/g))assert.ok(routeFor(path),path);for(const [,id]of guide.matchAll(/href="#([^"]+)"/g))assert.ok(guide.includes(`id="${id}"`));
 assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1);assert.ok(html.includes('empty-clocks-inline'));assert.ok(!html.includes('Keep your favourite cities here'));assert.ok(!html.includes('Find a city'));assert.ok(!html.includes('FAQPage'));assert.ok(html.includes('does not yet provide a future-date time converter'));
 const city=await fs.readFile(new URL('../dist/client/time/new-york/index.html',import.meta.url),'utf8');assert.ok(city.includes('city-time-guide'));assert.ok(!city.includes('world-directory-guide'));
 console.log(JSON.stringify({directoryGuideWords:words,faqs:answers.length,cities:CITIES.length}));
});
