import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {weeklyReportFigures} from '../src/lib/weekly-report-view.mjs';
import {weeklyReportHTML} from '../src/lib/ai-weekly-export.mjs';
import {studyAnalysis,analysisRange} from '../src/lib/study-analysis.mjs';
import {weeklyInput} from '../src/lib/ai-weekly.mjs';
import {exampleAnalysisData} from '../src/lib/study-analysis.mjs';
import {richWeeklySource,detailedTestContent} from './weekly-v2-fixture.mjs';
import {detailedWeeklyInput} from '../src/lib/ai-weekly-detailed.mjs';
const require=createRequire(import.meta.url),now=Date.parse('2026-11-22T12:00:00Z');
const built=await build({stdin:{contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {AIReportContent,WeeklyReportGuide,WeeklyStudyReport} from './src/components/WeeklyStudyReport.jsx';export const content=p=>AIReportContent(p);export const render=p=>renderToStaticMarkup(<AIReportContent {...p}/>);export const weekly=p=>renderToStaticMarkup(<WeeklyStudyReport {...p}/>);export const guide=()=>renderToStaticMarkup(<WeeklyReportGuide/>);`,resolveDir:fileURLToPath(new URL('../',import.meta.url)),loader:'jsx'},bundle:true,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime','react-dom/server'],write:false,logLevel:'silent'});
const mod={exports:{}};new Function('require','module','exports',built.outputFiles[0].text)(require,mod,mod.exports);
const facts=weeklyInput(exampleAnalysisData(now,'UTC'),{now,zone:'UTC'}),ai={version:1,id:'00000000-0000-4000-8000-000000000001',hash:'a'.repeat(64),generatedAt:now,facts,content:{summary:'Saved study, not proven mastery.',keep:[{text:'Keep a manageable study window.',evidence:['days']}],adjust:[],actions:[{title:'Review one exercise',why:'Choose a small next step.',minutes:25,evidence:['total']}]}};
function all(node){if(!node||typeof node!=='object')return[];return[node,...[node.props?.children].flat().flatMap(all)];}
test('eight-part guide is expanded, honest about its sample and does not add nested menus or icon tiles',()=>{
 const html=mod.exports.guide();for(const text of ['What will your report help you do?','Daily saved time','Time by subject','Maths','Biology','25 min','20 min','not your records','not a live AI result'])assert.ok(html.includes(text),text);for(const tag of ['<nav','<svg','<details'])assert.ok(!html.includes(tag));assert.ok(!html.includes('<button'));assert.equal((html.match(/class="weekly-mini-day"/g)||[]).length,7);assert.ok(html.includes('<table'));
});
test('generated content shows exact supplied facts and evidence with one explicit action per suggestion',()=>{
 let selected=null;const tree=mod.exports.content({ai,onAction:a=>selected=a}),buttons=all(tree).filter(n=>n.type==='button');assert.equal(buttons.length,1);assert.equal(selected,null);buttons[0].props.onClick();assert.deepEqual(selected,ai.content.actions[0]);
 const html=mod.exports.render({ai,onAction(){}});assert.ok(html.includes('Based on:'));assert.ok(html.includes('saved'));assert.ok(html.includes('not a measure'));assert.ok(html.includes('No specific adjustment'));
});
test('in-progress and absent baselines are labelled, and model text remains escaped text',()=>{
 const html=mod.exports.render({ai:{...ai,facts:{...facts,partial:true,previous:null},content:{...ai.content,summary:'<img src=x onerror=alert(1)>'}}});assert.ok(html.includes('This week so far'));assert.ok(html.includes('No previous saved sessions'));assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img src="x"'));
});

test('saved snapshot drives exact chart values and grouped subjects in both screen and download',()=>{
 const v=weeklyReportFigures(facts);assert.equal(weeklyReportFigures({...facts,start:'2026-11-09',end:'2026-11-15'}).rangeLabel,'9–15 Nov 2026');assert.equal(weeklyReportFigures({...facts,start:'2026-12-28',end:'2027-01-03'}).rangeLabel,'28 Dec 2026 – 3 Jan 2027');assert.equal(v.days.reduce((n,d)=>n+d.seconds,0),facts.seconds);assert.equal(v.subjects.reduce((n,d)=>n+d.seconds,0),facts.seconds);
 const many={...facts,seconds:100,subjects:Array.from({length:5},(_,i)=>({id:'subject-'+i,name:'Subject '+(i+1),seconds:20}))},grouped=weeklyReportFigures(many);assert.equal(grouped.subjects.length,4);assert.equal(grouped.subjects[3].name,'Other subjects');assert.equal(grouped.subjects[3].seconds,40);
 const html=mod.exports.render({ai}),download=weeklyReportHTML(ai);for(const text of ['Daily saved time','Time by subject',...v.days.map(d=>d.value),...v.subjects.map(s=>s.name)]){assert.ok(html.includes(text),text);assert.ok(download.includes(text),text);}assert.equal((html.match(/class="weekly-mini-day"/g)||[]).length,facts.days.length);assert.ok(download.includes('<table'));assert.ok(!download.includes('<script'));
 const zero=weeklyReportFigures({...facts,seconds:0,days:facts.days.map(d=>({...d,seconds:0})),subjects:[]});assert.ok(zero.days.every(d=>d.height===0));assert.ok(!JSON.stringify(zero).includes('NaN'));
});
test('download is in the report header before content and does not trigger planning',()=>{
 const html=mod.exports.render({ai,onAction(){},onDownload(){}});assert.ok(html.indexOf('Download full report (PDF)')<html.indexOf('weekly-key-figures'));assert.equal((html.match(/Download full report \(PDF\)/g)||[]).length,1);assert.ok(html.includes('<table class="weekly-action-table"'));
});
test('saved report starts with a compact update control; first-generation consent remains visible',()=>{
 const source=exampleAnalysisData(now,'UTC'),report=studyAnalysis(source,analysisRange({period:'last-week',now,zone:'UTC'})),props={store:{data:{...source,epoch:'ui'},hasPending:false},source,report,now,view:{snapshot:{aiWeek:ai}},auth:{}};
 const saved=mod.exports.weekly(props);assert.ok(saved.includes('Update report'));assert.ok(saved.includes('aria-expanded="false"'));assert.ok(!saved.includes('id="weekly-update-form"'));assert.ok(!saved.includes('type="checkbox"'));
 const first=mod.exports.weekly({...props,view:null});assert.equal((first.match(/class="weekly-preview"/g)||[]).length,1);assert.ok(!saved.includes('fictional week'));for(const title of ['Your week at a glance','Goals and actual study','Plan execution','Follow-through','Evidence and limits'])assert.ok(first.includes(title));assert.ok(first.includes('Send this weekly summary'));assert.ok(first.includes('type="checkbox"'));assert.ok(first.includes('Generate limited-evidence report'));assert.ok(!first.includes('Download full report (PDF)'));
});

test('AI identity and complete download scope are visible without opening history, including honest examples',()=>{
 const real=mod.exports.render({ai,onDownload(){},onHTML(){}});assert.ok(real.includes('AI weekly study report'));assert.ok(real.includes('AI-generated with DeepSeek'));assert.ok(real.includes('PDF includes every chart, analysis and suggestion'));assert.ok(real.includes('No extra analysis'));assert.ok(real.includes('HTML copy'));
 const sample={...ai,content:{...ai.content,summary:'Synthetic local test report: fixture output.'}},html=mod.exports.render({ai:sample,onDownload(){}}),download=weeklyReportHTML(sample);assert.ok(html.includes('Example · not AI-generated'));assert.ok(download.includes('Example · not AI-generated'));assert.ok(!download.includes('Suggestions generated by DeepSeek'));assert.ok(!html.includes('AI-generated with DeepSeek'));
 const pending=mod.exports.render({ai,onDownload(){},onHTML(){},exporting:'pdf'});assert.ok(pending.includes('Preparing PDF'));assert.equal((pending.match(/disabled=""/g)||[]).length,2);
});
test('detailed report exposes eight sections and planning readiness without additional navigation',()=>{
 const source=richWeeklySource(now),facts=detailedWeeklyInput(source,{now,zone:'UTC'}),detailed={...ai,version:2,facts,content:detailedTestContent(facts)},html=mod.exports.render({ai:detailed,onDownload(){},onHTML(){}});
 assert.equal((html.match(/class="weekly-detail-part /g)||[]).length,8);assert.ok(html.includes('Your proposed next seven days'));assert.ok(html.includes('What remains uncertain'));assert.ok(html.includes('eight parts'));assert.ok(!html.includes('<nav'));assert.ok(html.indexOf('Download full report')<html.indexOf('weekly-key-figures'));assert.ok(!html.includes('Private algebra'));
 const report=studyAnalysis(source,analysisRange({period:'last-week',now,zone:'UTC'})),first=mod.exports.weekly({source,report,now,store:{data:source,hasPending:false},auth:{}});assert.ok(first.includes('Detailed review'));assert.ok(first.includes('Evidence available'));assert.ok(first.includes('remaining workloads'));assert.ok(first.includes('Weekly study target'));assert.ok(first.includes('Work still remaining'));assert.ok(!first.includes('href="/study-planner'));
});
