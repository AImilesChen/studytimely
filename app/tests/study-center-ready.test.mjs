import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),React=require('react');
let slot=0,view='overview',date='2026-11-21';
// Seed the root's mounted date/view state, so these tests cover the loaded screen,
// rather than only the server's pre-hydration loading placeholders.
const code=await build({stdin:{contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {StudyCenter} from './src/components/StudyCenter.jsx';import {emptyState} from './src/lib/model.mjs';export {centerSection} from './src/components/StudyCenter.jsx';export function render(now){const store={ready:true,data:emptyState('test'),cloudSync:{authChecked:true}};return renderToStaticMarkup(<StudyCenter store={store} now={now} loaded={true} auth={{user:{syncAccountId:'account-a',googleLinked:true}}} settings={<p>Account controls</p>}/>);}`,resolveDir:fileURLToPath(new URL('../',import.meta.url)),loader:'jsx'},bundle:true,platform:'node',format:'cjs',external:['react','react-dom/server','react/jsx-runtime'],jsx:'automatic',loader:{'.css':'empty'},write:false,logLevel:'silent'});
const mod={exports:{}};
new Function('require','module','exports',code.outputFiles[0].text)(id=>id==='react'?{...React,useState(initial){slot++;return React.useState(slot===1?view:slot===2?date:initial);}}:require(id),mod,mod.exports);
function render(section,day,now){slot=0;view=section;date=day;return mod.exports.render(now);}
test('all four loaded account sections render for the real signed-in identity shape',()=>{
 for(const section of ['overview','progress','community','settings']){
  const html=render(section,'2026-11-21',new Date('2026-11-21T12:00:00').getTime());assert.ok(html.includes('My Study Center'),section);assert.equal((html.match(/<main /g)||[]).length,1,section);
  assert.equal((html.match(/class="sc-tab-emoji"/g)||[]).length,4);assert.ok(!html.includes('sc-sync-status'));assert.equal(html.includes('Open timer without a task'),section==='overview');
 }
});
test('loaded storage cannot trigger reports against the initial zero clock or an unreconciled date',()=>{
 const initial=render('overview','1970-01-01',0);assert.ok(initial.includes('Loading this browser’s tasks'));assert.ok(initial.includes('Loading saved learning'));
 const midnight=render('overview','2026-11-20',new Date('2026-11-21T00:00:00').getTime());assert.ok(midnight.includes('Loading this browser’s tasks'));
 const ready=render('overview','2026-11-21',new Date('2026-11-21T12:00:00').getTime());assert.ok(ready.includes('Today’s study task'));assert.ok(!ready.includes('Loading this browser’s tasks'));
});
test('today exposes all three working plan forms without outgoing tool links',()=>{
 const html=render('overview','2026-11-21',new Date('2026-11-21T12:00:00').getTime());
 for(const label of ['Add an exam in My Study Center','Create a habit in My Study Center','Save course topics in My Study Center'])assert.ok(html.includes(label),label);
 for(const route of ['/exam-countdown','/study-habit-tracker','/syllabus-tracker'])assert.ok(!html.includes(`href="${route}`),route);
 for(const label of ['Save exam date','Save habit','Save course &amp; topics'])assert.ok(html.includes(label),label);
 assert.ok(!html.includes('Coming up next'));
});

test('the retired learning entry resolves to Today and each tool has one home',()=>{
 assert.equal(mod.exports.centerSection('learning'),'overview');assert.equal(mod.exports.centerSection('preferences'),'settings');assert.equal(mod.exports.centerSection('sync'),'settings');assert.equal(mod.exports.centerSection('progress'),'progress');
 const html=render(mod.exports.centerSection('learning'),'2026-11-21',new Date('2026-11-21T12:00:00').getTime());
 assert.equal((html.match(/role="tab"/g)||[]).length,4);assert.ok(!html.includes('center-tab-learning'));assert.ok(html.includes('center-tab-overview'));for(const name of ['Add an exam in My Study Center','Create a habit in My Study Center','Save course topics in My Study Center'])assert.equal(html.split(name).length-1,1,name);assert.equal((html.match(/<article class="sc-guide"/g)||[]).length,1);
});
