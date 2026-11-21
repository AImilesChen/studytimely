import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {metadata} from '../src/lib/site.mjs';
import {createWorker} from '../server/cloudflare.mjs';

test('public group metadata describes the real free room and has matching application and breadcrumb URLs',()=>{const m=metadata('/study-groups',{origin:'https://studytimely.com',indexable:true});assert.equal(m.canonical,'https://studytimely.com/study-groups');assert.equal(m.schema['@type'],'WebApplication');assert.equal(m.schema.applicationCategory,'EducationalApplication');assert.equal(m.schema.url,m.canonical);assert.equal(m.breadcrumb.itemListElement.at(-1).item,m.canonical);assert.match(m.description,/four-person/);assert.match(m.description,/preview/);});
test('room, invitation and activity variants stay uncacheable and noindex while the public landing can index',async()=>{const worker=createWorker({origin:'https://studytimely.com',indexable:true}),env={ASSETS:{fetch:()=>new Response('public page without member data',{headers:{'content-type':'text/html'}})}};for(const query of ['?room=opaque','?invite=opaque','?activity=opaque','?room=opaque&activity=opaque']){const r=await worker.fetch(new Request('https://studytimely.com/study-groups'+query),env);assert.match(r.headers.get('x-robots-tag'),/noindex/);assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(await r.text(),'public page without member data');}assert.equal((await worker.fetch(new Request('https://studytimely.com/study-groups'),env)).headers.get('x-robots-tag'),null);});

test('public group tools instructions are crawlable and separate optional access from free study',async()=>{
 const html=await fs.readFile(new URL('../dist/client/study-groups/index.html',import.meta.url),'utf8');
 const section=html.match(/<section id="group-tools-guide"[\s\S]*?(?=<section id="group-weekly-reports")/)?.[0];assert.ok(section);
 for(const text of ['Shared study tools','recurring activities','applies to rooms they own on that account','Who can create shared tasks','What happens when access ends?','illustrative revision session','Personal timers','Free study rooms and advanced tools','Three ways to study together','What counts towards your group’s progress?','From a shared task to a regular study routine'])assert.ok(section.includes(text),text);
 assert.equal((section.match(/class="tools-lesson"/g)||[]).length,4);assert.doesNotMatch(section,/<details|<form/);
 for(const id of ['tasks','series','challenge','study'])assert.ok(section.includes('/images/group-tools/'+id+'-art.jpg'));
});
test('initial group HTML contains actionable advanced guidance and answers rather than an empty client-only shell',async()=>{const html=await fs.readFile(new URL('../dist/client/study-groups/index.html',import.meta.url),'utf8');assert.equal((html.match(/<h1[ >]/g)||[]).length,1);for(const title of ['How to study together online','Weekly study reports for your group','How to use weekly study reports','What does a dash mean?','Tools that support studying together','One room. Four places.','What happens when advanced access ends?','How do weekly study appointments work?','Does a shared task reveal my personal study plan?'])assert(html.includes(title),title);assert(html.includes('does not create a paid subscription'));assert(html.includes('cannot prove attention'));assert(html.includes('up to 24 members'));for(const id of ['group-how','group-weekly-reports','group-benefits','group-access','group-questions'])assert(html.includes('id="'+id+'"'));assert(!html.includes('QA Host'));assert(!html.includes('Preview study group'));});

test('public guide gives concrete room/activity paths without exposing private test room data',async()=>{
 const html=await fs.readFile(new URL('../dist/client/study-groups/index.html',import.meta.url),'utf8');
 for(const text of ['Study now or arrange a session?','Study together → Start studying','Study activities → Plan an activity','Example: 25 minutes of exam revision.','Do I need to book a session before studying?','Where do I add my task, study result and private reflection?'])assert.ok(html.includes(text),text);
 assert.ok(html.includes('Under Group tools, open Recurring activities'));
 assert.ok(!html.includes('Under Activities &amp; tasks'));
 assert.ok(!html.includes('room-workspace-header')&&!html.includes('room-preview-note'));
});

test('public guide has a concrete five-step example, real allowance comparison and visible essential answers in initial HTML',async()=>{
 const html=await fs.readFile(new URL('../dist/client/study-groups/index.html',import.meta.url),'utf8');
 assert.match(html,/A free online study room for your small group/);
 const figure=html.match(/<figure class="group-revision-example">([\s\S]*?)<\/figure>/)?.[1];assert.ok(figure);
 assert.match(html,/id="group-activity-scheduling">How to schedule an online group study session/);
 assert.equal((figure.match(/<li>/g)||[]).length,5);assert.match(figure,/Thursday at 18:00, Europe\/London/);assert.match(figure,/No timer starts automatically/);
 assert.match(figure,/Start my study/);assert.match(figure,/Add result/);
 const table=html.match(/<table>([\s\S]*?)<\/table>/)?.[1];assert.ok(table);assert.match(table,/scope="col"/);assert.match(table,/1 active room/);assert.match(table,/Up to 24 members/);assert.match(table,/Single study activities/);assert.match(table,/Single and repeating activities/);
 const essentials=html.match(/<div class="group-faq-essentials">([\s\S]*?)<\/div>/)?.[1];assert.ok(essentials);assert.equal((essentials.match(/<article>/g)||[]).length,5);assert.doesNotMatch(essentials,/<details|<summary/);
 assert.match(essentials,/Do I need to book a session/);assert.match(essentials,/Are online study groups free/);
 assert.match(essentials,/camera or a microphone/);assert.match(essentials,/Why has our group study time not increased/);
 assert.doesNotMatch(html,/<details class="group-agenda-disclosure"/);
 assert.match(html,/110 \/ 120 minutes, or 91.7%/);assert.match(html,/Illustrative example, not live room data/);
 assert.doesNotMatch(html,/QA Free Host|QA Learner|room-next-session-name/);
});


test('initial public HTML explains room management and separates owner controls from personal preferences',async()=>{
 const html=await fs.readFile(new URL('../dist/client/study-groups/index.html',import.meta.url),'utf8');
 const section=html.match(/<section id="group-room-management"[\s\S]*?(?=<section id="group-tools-guide")/)?.[0];
 assert.ok(section);for(const text of ['How to invite partners and manage a study room','Copy invitation link','Choose who can study','Handle member problems','Closing a room is permanent','custom text review is paused'])assert.ok(section.includes(text),text);
 assert.equal((section.match(/<figure/g)||[]).length,3);assert.doesNotMatch(section,/sample-invitation-code|<input|<button|<details/);
 assert.ok(html.includes('href="#group-room-management"'));
});
