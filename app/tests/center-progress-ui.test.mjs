import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {emptyState} from '../src/lib/model.mjs';
import {exampleAnalysisData,analysisRange,studyAnalysis} from '../src/lib/study-analysis.mjs';
const require=createRequire(import.meta.url),React=require('react'),now=Date.parse('2026-11-21T12:00:00Z');let slot=0,allowed=true;
const built=await build({stdin:{contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {StudyCenterProgress,ProgressTrend,ProgressRecords} from './src/components/StudyCenterProgress.jsx';export function render(data,now){return renderToStaticMarkup(<StudyCenterProgress store={{data,ready:true,hasPending:false}} now={now} ready={true}/>);}export const trend=p=>renderToStaticMarkup(<ProgressTrend {...p}/>);export const records=p=>renderToStaticMarkup(<ProgressRecords {...p}/>);`,resolveDir:fileURLToPath(new URL('../',import.meta.url)),loader:'jsx'},bundle:true,platform:'node',format:'cjs',jsx:'automatic',external:['react','react-dom/server','react/jsx-runtime'],loader:{'.css':'empty'},write:false,logLevel:'silent'});
const mod={exports:{}};new Function('require','module','exports',built.outputFiles[0].text)(id=>id==='react'?{...React,useState(initial){slot++;return React.useState(slot===1&&initial===''?'UTC':initial?.status==='loading'&&Object.hasOwn(initial,'allowed')?{status:'ready',allowed,expiresAt:0}:initial);}}:require(id),mod,mod.exports);
function render(data,access=true){slot=0;allowed=access;return mod.exports.render(data,now);}
test('loaded Progress contains real filters, chart, records and an inline review with no nested navigation or icon tiles',()=>{
 const data={...emptyState('progress-ui'),...exampleAnalysisData(now,'UTC')},html=render(data);for(const text of ['Your learning, in perspective','Custom dates','Export records CSV','How your study time adds up','Where the time went','The study behind the numbers','A moment to look back','Save private review','Plan a next step from this review'])assert.ok(html.includes(text),text);assert.ok(!html.includes('<nav'));assert.ok(!html.includes('<svg'));assert.ok(!html.includes('<details'));assert.ok(!/href="\/study-(?:tracker|habit)/.test(html));assert.ok(html.includes('All subjects and study timers'));assert.ok(html.includes('Current self-marked coverage'));
});
test('zero history gives one actionable empty explanation and does not fabricate bars or values',()=>{
 const html=render(emptyState('empty'));assert.ok(html.includes('Your first saved session starts this story'));assert.ok(html.includes('View example'));assert.ok(!html.includes('class="cp-bar"'));assert.ok(!html.includes('Example data · not your records'));assert.ok(html.includes('Not recorded'));assert.ok(!html.includes('NaN'));
});
test('inactive advanced access keeps basic filtering and record export while making review fields read only',()=>{
 const html=render({...emptyState('basic'),...exampleAnalysisData(now,'UTC')},false);assert.ok(html.includes('Export records CSV'));assert.ok(html.includes('New snapshots and review editing require eligible advanced analytics access'));assert.equal((html.match(/readOnly=""/g)||[]).length,3);assert.match(html,/<button[^>]*disabled=""[^>]*>Save private review/);assert.ok(!html.includes('Full report'));
});
test('long trends group exact values visibly and record detail controls stay inside their table',()=>{
 const data={...emptyState('chart'),...exampleAnalysisData(now,'UTC')},report=studyAnalysis(data,analysisRange({period:'30',zone:'UTC',now}));slot=0;const chart=mod.exports.trend({report,onSelect(){}});assert.ok(chart.includes('grouped into consecutive dates'));assert.ok((chart.match(/class="cp-bar"/g)||[]).length<=14);assert.ok(chart.includes('View these records.'));slot=0;const records=mod.exports.records({rows:report.rows,range:report.range,zone:'UTC',allHistory:false,onHistory(){},onClearDay(){}});assert.ok(records.includes('aria-expanded="false"'));assert.ok(records.includes('aria-controls="cp-record-'));assert.ok(!records.includes('<dialog'));assert.ok(records.includes('without private reflections'));
});
