import test from 'node:test';import assert from 'node:assert/strict';import path from 'node:path';import Module from 'node:module';import {buildSync} from 'esbuild';
import {learningRecordHistory,groupRecordDays} from '../src/lib/study-records.mjs';
const root=path.resolve(import.meta.dirname,'..'),filename=path.join(root,'virtual-records-render.cjs');
const code=buildSync({stdin:{contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {RecordSubjectFilter,RecordEmptyState,StudyRecordList} from './src/components/StudyRecords.jsx';export const subject=p=>renderToStaticMarkup(React.createElement(RecordSubjectFilter,p));export const empty=p=>renderToStaticMarkup(React.createElement(RecordEmptyState,p));export const list=p=>renderToStaticMarkup(React.createElement(StudyRecordList,p));`,resolveDir:root},bundle:true,platform:'node',format:'cjs',jsx:'automatic',external:['react','react-dom/server','react/jsx-runtime'],write:false,logLevel:'silent'}).outputFiles[0].text;
const mod=new Module(filename);mod.filename=filename;mod.paths=Module._nodeModulePaths(root);mod._compile(code,filename);const render=mod.exports;
const start=Date.parse('2026-11-17T23:50:00Z'),end=Date.parse('2026-11-18T00:20:00Z'),session={id:'night',subject:'Maths',mode:'focus',status:'Completed',startedAt:start,endedAt:end,durationSeconds:1800,segments:[[start,end]],taskTitle:'Practise algebra'},now=end+3600000;

test('subject setup and conditional unlabelled option render real saved labels including archived subjects',()=>{
 const empty=render.subject({history:learningRecordHistory({sessions:[]},now),value:''});assert.match(empty,/No subjects yet/);assert.match(empty,/disabled=""/);assert.ok(!empty.includes('Unlabelled'));assert.match(empty,/Add subject/);
 const own=render.subject({history:learningRecordHistory({subjects:['Biology'],sessions:[session]},now),value:'Maths'});assert.match(own,/value="Maths" selected=""/);assert.match(own,/Biology/);assert.ok(!own.includes('Unlabelled'));
 const unlabelled=render.subject({history:learningRecordHistory({sessions:[{...session,subject:''}]},now),value:'none'});assert.match(unlabelled,/value="none" selected=""/);
});
test('empty states offer relevant real actions and avoid duplicate backup or misleading history-loss copy',()=>{
 const first=render.empty({kind:'first'}),dates=render.empty({kind:'dates'}),filtered=render.empty({kind:'filtered'});assert.match(first,/href="\/"/);assert.match(first,/Start studying/);assert.match(first,/Explore example/);assert.ok(!first.includes('Clear filters'));assert.match(dates,/View all history/);assert.ok(!dates.includes('Clear filters'));assert.match(filtered,/Clear filters/);assert.match(filtered,/View all history/);for(const html of [first,dates,filtered])assert.ok(!html.includes('Backup &amp; restore'));
});
test('daily lists render both midnight portions, useful task detail and accessible session actions',()=>{
 const days={...groupRecordDays(learningRecordHistory({sessions:[session]},now).rows,'UTC'),zone:'UTC'},html=render.list({days});assert.match(html,/Tuesday, 17 November 2026/);assert.match(html,/Wednesday, 18 November 2026/);assert.match(html,/23:50 – 24:00/);assert.match(html,/00:00 – 00:20/);assert.match(html,/Practise algebra/);assert.match(html,/10m/);assert.match(html,/20m/);assert.equal((html.match(/aria-label="View Maths session details/g)||[]).length,2);assert.match(html,/Pauses are excluded/);
});

test('repeated clock hours disclose the UTC offsets instead of suggesting negative learning time',()=>{
 const a=Date.parse('2026-11-01T05:50:00Z'),b=Date.parse('2026-11-01T06:20:00Z'),s={...session,startedAt:a,endedAt:b,segments:[[a,b]]},days={...groupRecordDays(learningRecordHistory({sessions:[s]},now).rows,'America/New_York'),zone:'America/New_York'},html=render.list({days});assert.match(html,/01:50 GMT-4/);assert.match(html,/01:20 GMT-5/);assert.match(html,/30m/);
});
