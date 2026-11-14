import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {CITIES,cityFor,clockText,offsetMinutes,difference,dayDifference,zoneName} from '../src/lib/world-clock.mjs';
import {CITY_CONTENT} from '../src/lib/city-content.mjs';
import {nextClockChange,zoneState,TIME_ZONE_VERSION} from '../src/lib/time-zones.mjs';
import {TIME_ZONE_DATA} from '../src/lib/time-zone-data.mjs';
import {metadata} from '../src/lib/site.mjs';
const at=Date.parse;
test('Vancouver retains historical winter rules but no longer falls back in November 2026',()=>{
 assert.equal(TIME_ZONE_VERSION,'2026f');
 assert.equal(offsetMinutes(at('2026-01-15T12:00Z'),'America/Vancouver'),-480);
 assert.equal(offsetMinutes(at('2026-07-15T12:00Z'),'America/Vancouver'),-420);
 assert.equal(clockText(at('2026-11-01T08:59Z'),'America/Vancouver',true),'01:59');
 assert.equal(clockText(at('2026-11-01T09:00Z'),'America/Vancouver',true),'02:00');
 assert.equal(offsetMinutes(at('2026-11-14T12:00Z'),'America/Vancouver'),-420);
 assert.equal(offsetMinutes(at('2027-01-15T12:00Z'),'America/Vancouver'),-420);
 assert.equal(difference(at('2026-11-14T12:00Z'),'America/Vancouver','America/Los_Angeles'),'1h ahead');
 assert.equal(difference(at('2026-07-14T12:00Z'),'America/Vancouver','America/Los_Angeles'),'Same time');
 assert.equal(nextClockChange(at('2026-11-14T12:00Z'),'America/Vancouver'),null);
 assert.equal(zoneName(at('2026-11-14T12:00Z'),'America/Vancouver',true),'Pacific Time');
});
test('Egypt uses its own midnight transitions, not the European Sundays',()=>{
 assert.equal(clockText(at('2026-04-23T21:59Z'),'Africa/Cairo',true),'23:59');
 assert.equal(clockText(at('2026-04-23T22:00Z'),'Africa/Cairo',true),'01:00');
 assert.equal(clockText(at('2026-10-29T20:59Z'),'Africa/Cairo',true),'23:59');
 assert.equal(clockText(at('2026-10-29T21:00Z'),'Africa/Cairo',true),'23:00');
 const change=nextClockChange(at('2026-11-14T12:00Z'),'Africa/Cairo');
 assert.equal(new Date(change.at).toISOString(),'2027-04-29T22:00:00.000Z');
 assert.equal(change.after-change.before,60);
});
test('southern seasons span New Year and Auckland starts before Sydney',()=>{
 assert.equal(offsetMinutes(at('2027-01-15T12:00Z'),'Australia/Sydney'),660);
 assert.equal(offsetMinutes(at('2027-01-15T12:00Z'),'Australia/Adelaide'),630);
 assert.equal(offsetMinutes(at('2027-07-15T12:00Z'),'Australia/Adelaide'),570);
 assert.equal(difference(at('2026-09-28T12:00Z'),'Pacific/Auckland','Australia/Sydney'),'3h ahead');
 assert.equal(difference(at('2026-10-05T12:00Z'),'Pacific/Auckland','Australia/Sydney'),'2h ahead');
 assert.equal(dayDifference(at('2026-11-14T11:30Z'),'Pacific/Auckland','America/Los_Angeles'),1);
});
test('fractional offsets, matching China clocks and cancelled seasonal rules remain distinct',()=>{
 assert.equal(difference(at('2026-11-14T12:00Z'),'Asia/Kathmandu','Asia/Kolkata'),'15m ahead');
 for(const c of ['beijing','shanghai'])assert.equal(clockText(at('2026-11-14T16:00Z'),cityFor(c).zone,true),'00:00');
 assert.equal(offsetMinutes(at('2026-07-14T12:00Z'),'America/Mexico_City'),-360);
 assert.equal(offsetMinutes(at('2026-07-14T12:00Z'),'America/Chicago'),-300);
 assert.equal(offsetMinutes(at('2026-01-14T12:00Z'),'America/Sao_Paulo'),-180);
 assert.equal(offsetMinutes(at('2026-07-14T12:00Z'),'America/Sao_Paulo'),-180);
});
test('bundled table covers all supported identifiers with ordered, bounded transitions',()=>{
 for(const city of CITIES){const rows=TIME_ZONE_DATA.zones[city.zone];assert.ok(rows,city.slug);assert.equal(rows[0][0],TIME_ZONE_DATA.start);for(let i=0;i<rows.length;i++){assert.ok(Number.isInteger(rows[i][1]));assert.ok(rows[i][0]<TIME_ZONE_DATA.end);if(i)assert.ok(rows[i][0]>rows[i-1][0]);}assert.ok(zoneState(at('2100-12-31T00:00Z'),city.zone));}
 assert.equal(zoneState(at('2101-01-01T00:00Z'),'Asia/Shanghai'),null);
});
test('32 complete editorial records have city-specific sections, answers and valid comparison routes',()=>{
 assert.deepEqual(Object.keys(CITY_CONTENT).sort(),CITIES.map(c=>c.slug).sort());
 const overviews=new Set(),questions=new Set();
 for(const city of CITIES){const c=CITY_CONTENT[city.slug];overviews.add(c.overview);assert.equal(c.sections.length,2);assert.equal(c.faqs.length,3);assert.ok(c.study.length>100);assert.equal(new Set(c.compare).size,4);for(const other of c.compare){assert.ok(cityFor(other),other);assert.notEqual(other,city.slug);}for(const faq of c.faqs){assert.ok(faq.answer.length>65);questions.add(faq.question);}}
 assert.equal(overviews.size,32);assert.equal(questions.size,96);
});
test('city metadata has a unique title, canonical and visible navigation breadcrumb',()=>{
 const config={origin:'https://studytimely.com',indexable:true},titles=new Set();
 for(const city of CITIES){const m=metadata('/time/'+city.slug,config);titles.add(m.title);assert.equal(m.canonical,config.origin+'/time/'+city.slug);assert.equal(m.breadcrumb['@type'],'BreadcrumbList');assert.equal(m.breadcrumb.itemListElement[2].name,city.name);assert.equal(m.breadcrumb.itemListElement[2].item,m.canonical);assert.equal(m.schema['@type'],'WebApplication');}
 assert.equal(titles.size,32);assert.equal(metadata('/',config).breadcrumb,null);
});
test('built city HTML contains complete readable content, closed FAQ answers and related anchors before JS',async()=>{
 for(const city of CITIES){const html=await fs.readFile(new URL(`../dist/client/time/${city.slug}/index.html`,import.meta.url),'utf8'),c=CITY_CONTENT[city.slug];
  assert.match(html,/<article class="city-time-guide"/);assert.ok(html.includes(c.overview));assert.ok(html.includes('id="breadcrumb-schema"'));
  assert.equal((html.match(/<details/g)||[]).length,3,city.slug);
  for(const q of c.faqs)assert.ok(html.includes(q.answer.replaceAll('&','&amp;').replaceAll("'",'&#x27;')),city.slug+' answer');
  for(const other of c.compare)assert.ok(html.includes(`href="/time/${other}"`));
  for(const id of ['clock-changes','city-comparison','city-faq'])assert.ok(html.includes(`id="${id}"`));
  assert.ok(!html.includes('FAQPage'));assert.ok(!html.includes('Elsewhere, right now'));
 }
});
