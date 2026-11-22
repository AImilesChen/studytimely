import test from 'node:test';
import assert from 'node:assert/strict';
import {weeklyReportPDF} from '../src/lib/ai-weekly-pdf.mjs';
import {weeklyInput} from '../src/lib/ai-weekly.mjs';
import {exampleAnalysisData} from '../src/lib/study-analysis.mjs';
import {richWeeklySource,detailedTestContent} from './weekly-v2-fixture.mjs';
import {detailedWeeklyInput} from '../src/lib/ai-weekly-detailed.mjs';
import {detailedReportSections} from '../src/lib/weekly-detailed-view.mjs';
const now=Date.parse('2026-11-22T12:00:00Z'),facts=weeklyInput(exampleAnalysisData(now,'UTC'),{now,zone:'UTC'});
const ai={version:1,id:'00000000-0000-4000-8000-000000000001',hash:'a'.repeat(64),generatedAt:now,facts,content:{summary:'Saved study, not proven mastery.',keep:[{text:'Keep a manageable study window.',evidence:['days']}],adjust:[{text:'Allow room for one small next step.',evidence:['total']}],actions:[{title:'Review one exercise',why:'Choose a manageable next step.',minutes:25,evidence:['days']}]}};
function fakeCanvas(){
 const painted=[],images=[];let page=[];const ctx={font:'27px Arial',fillStyle:'',measureText(s){return {width:Array.from(s).length*Number(this.font.match(/(\d+)px/)[1])*.55};},fillText(text,x,y){const row={text,x,y};painted.push(row);page.push(row);},fillRect(){}};
 return {painted,images,canvas:{getContext:()=>ctx,toBlob(callback){images.push(page);page=[];callback(new Blob([new Uint8Array([255,216,255,217])],{type:'image/jpeg'}));}}};
}
test('PDF uses saved report figures, all four parts and provenance, and excludes private notes',async()=>{
 const fake=fakeCanvas(),pdf=await weeklyReportPDF({...ai,good:'PRIVATE_NOTE_NEVER_EXPORT'}, {createCanvas:()=>fake.canvas,fontsReady:async()=>{}});
 assert.equal(pdf.type,'application/pdf');const raw=new TextDecoder().decode(await pdf.arrayBuffer());assert.ok(raw.startsWith('%PDF-1.4'));assert.match(raw,/\/Count [1-9]/);assert.ok(!raw.includes('http'));const text=fake.painted.map(r=>r.text).join(' ');
 for(const value of ['AI WEEKLY STUDY REPORT','AI-generated with DeepSeek','Daily saved time','Time by subject','Worth keeping','Room to adjust','Small steps for next week','Review one exercise','Suggested estimate: 25 min','same saved report'])assert.ok(text.includes(value),value);
 assert.ok(!text.includes('PRIVATE_NOTE'));assert.ok(fake.painted.every(r=>r.y>=0&&r.y<=1630));
});
test('long valid responses paginate fully and examples never claim live generation',async()=>{
 const fake=fakeCanvas(),sentence='A long but valid observation about the recorded week. ',long={...ai,content:{summary:'Synthetic local test report: '+sentence.repeat(10),keep:[{text:sentence.repeat(8),evidence:['days']},{text:sentence.repeat(8),evidence:['days']}],adjust:[{text:sentence.repeat(8),evidence:['total']},{text:sentence.repeat(8),evidence:['total']}],actions:Array.from({length:3},(_,i)=>({title:'Optional next task '+i,why:sentence.repeat(8),minutes:25,evidence:['days']}))}};
 await weeklyReportPDF(long,{createCanvas:()=>fake.canvas,fontsReady:async()=>{}});assert.ok(fake.images.length>=3);assert.ok(fake.painted.every(r=>r.y<=1630));const text=fake.painted.map(r=>r.text).join(' ');assert.ok(text.includes('Optional next task 2'));assert.ok(text.includes('Example · not AI-generated'));assert.ok(!text.includes('AI-generated with DeepSeek'));assert.ok(text.includes('No live AI generation'));
});
test('unavailable canvas and failed image encoding return actionable errors without a partial download',async()=>{
 await assert.rejects(weeklyReportPDF(ai,{createCanvas:()=>({getContext:()=>null}),fontsReady:async()=>{}}),/HTML copy/);
 const fake=fakeCanvas();fake.canvas.toBlob=callback=>callback(null);await assert.rejects(weeklyReportPDF(ai,{createCanvas:()=>fake.canvas,fontsReady:async()=>{}}),/saved report is unchanged/);
});
test('detailed PDF preserves all eight sections, complete reasoning and schedule without private task names',async()=>{
 const f=detailedWeeklyInput(richWeeklySource(now),{now,zone:'UTC'}),detailed={...ai,version:2,facts:f,content:detailedTestContent(f)},fake=fakeCanvas();await weeklyReportPDF(detailed,{createCanvas:()=>fake.canvas,fontsReady:async()=>{}});const text=fake.painted.map(r=>r.text).join(' ').replace(/\s+/g,' ');
 for(const part of detailedReportSections(detailed))assert.ok(text.includes(part.title),part.title);for(const finding of detailed.content.findings)for(const key of ['observation','interpretation','uncertainty','recommendation','check_next_week'])assert.ok(text.includes(finding[key]),key);assert.ok(fake.painted.every(r=>r.y<=1630));assert.ok(fake.images.length>2);assert.ok(!text.includes('Private algebra'));assert.ok(text.includes('Example · not AI-generated'));
});
