import test from 'node:test';
import assert from 'node:assert/strict';
import {analysisRange,comparisonRange,dayBoundary,zonedDay,studyAnalysis,recordRows,newReview,exampleAnalysisData,analysisFingerprint} from '../src/lib/study-analysis.mjs';
import {emptyState,transition} from '../src/lib/model.mjs';
import {backupOf,checkState} from '../src/lib/storage.mjs';
import {mergeBackups} from '../src/lib/sync.mjs';
import {validateLearning,losesLearningHistory,mergeLearning} from '../src/lib/learning-history.mjs';
import {advancedAccess} from '../src/lib/advanced-access.mjs';
import {reportLines,summarySVG,pdfFromImages,reviewExportData} from '../src/lib/report-export.mjs';
const at=s=>Date.parse(s),now=at('2026-11-18T12:30:00Z');
const range=(patch={})=>analysisRange({period:'week',zone:'UTC',now,...patch});
function session(id,start,end,patch={}){const a=at(start),b=at(end);return {id,subject:'Maths',mode:'focus',startedAt:a,endedAt:b,durationSeconds:(b-a)/1000,segments:[[a,b]],status:'Completed',...patch};}
function app(){let state=emptyState('test'),n=0,clock=at('2026-11-16T08:00:00Z');return {get state(){return state;},advance(ms){clock+=ms;},do(type,payload={}){const r=transition(state,{type,epoch:state.epoch,...payload},{id:'item-'+(++n),now:clock,owner:'test'});state=r.state;return r;}};}

test('IANA date boundaries include full spring and fall DST days and half-hour zones',()=>{
 assert.equal(dayBoundary('2026-03-09','America/New_York')-dayBoundary('2026-03-08','America/New_York'),23*3600000);
 assert.equal(dayBoundary('2026-11-02','America/New_York')-dayBoundary('2026-11-01','America/New_York'),25*3600000);
 assert.equal(zonedDay(at('2026-11-17T18:20:00Z'),'Asia/Kolkata'),'2026-11-17');
 assert.equal(zonedDay(at('2026-11-17T18:40:00Z'),'Asia/Kolkata'),'2026-11-18');
});
test('week/month/year comparisons use previous calendar periods and the same local time',()=>{
 const current=range(),previous=comparisonRange(current);assert.equal(previous.start,'2026-11-09');assert.equal(previous.end,'2026-11-11');assert.equal(previous.endAt,at('2026-11-11T12:30:00Z'));
 const year=comparisonRange(range({period:'year'}));assert.equal(year.start,'2025-01-01');assert.equal(year.end,'2025-11-18');
 const leap=comparisonRange(range({period:'month',now:at('2024-03-31T12:00:00Z')}));assert.equal(leap.end,'2024-02-29');
 const dst=comparisonRange(range({now:at('2026-11-03T18:30:00Z'),zone:'America/New_York'}));assert.equal(dst.endAt,at('2026-10-27T17:30:00Z'));
});
test('invalid/custom/future dates and oversized ranges are rejected',()=>{
 for(const patch of [{period:'custom',start:'2026-02-30',end:'2026-03-01'},{period:'custom',start:'2025-01-01',end:'2026-11-18'},{period:'custom',start:'2026-11-19',end:'2026-11-20'},{zone:'No/Such_Zone'}])assert.throws(()=>range(patch));
});
test('saved intervals are clipped, pauses and general timers excluded, duplicate ids deduplicated',()=>{
 const a=session('a','2026-11-15T23:50:00Z','2026-11-16T00:20:00Z'),b=session('b','2026-11-17T10:00:00Z','2026-11-17T11:00:00Z',{segments:[[at('2026-11-17T10:00:00Z'),at('2026-11-17T10:20:00Z')],[at('2026-11-17T10:40:00Z'),at('2026-11-17T11:00:00Z')]],durationSeconds:2400});
 const data={sessions:[a,a,b,session('watch','2026-11-17T10:00:00Z','2026-11-17T11:00:00Z',{mode:'stopwatch'})]};const r=studyAnalysis(data,range());assert.equal(r.total,3600);assert.equal(r.count,2);assert.equal(r.activeDays,2);assert.equal(r.series.reduce((n,d)=>n+d.seconds,0),r.total);assert.equal(r.hours.flat().reduce((n,v)=>n+v,0),r.total);assert.equal(r.rows[0].session.id,'b');
});
test('subject and timer-mode filters agree across totals, patterns and records',()=>{
 const data={sessions:[session('a','2026-11-17T09:00:00Z','2026-11-17T09:30:00Z'),session('b','2026-11-17T10:00:00Z','2026-11-17T10:25:00Z',{subject:'Biology',mode:'pomodoro'}),session('c','2026-11-17T11:00:00Z','2026-11-17T11:15:00Z',{subject:''})]};
 const r=studyAnalysis(data,range(),{subject:'Biology',mode:'pomodoro'});assert.equal(r.total,1500);assert.equal(r.subjects.length,1);assert.equal(r.hours.flat().reduce((n,v)=>n+v,0),1500);assert.equal(studyAnalysis(data,range(),{subject:'none'}).total,900);
});
test('chart drill-down clips exact selected days and weekday hours including half-hour zones',()=>{
 const data={sessions:[session('a','2026-11-16T18:00:00Z','2026-11-16T19:00:00Z')]},r=studyAnalysis(data,range({zone:'Asia/Kolkata'}));
 assert.equal(recordRows(r,{start:'2026-11-17',end:'2026-11-17'})[0].seconds,1800);
 assert.equal(recordRows(r,{weekday:0,hour:23})[0].seconds,1800);assert.equal(recordRows(r,{weekday:1,hour:0})[0].seconds,1800);
 assert.deepEqual(recordRows(r,{weekday:0,hour:9}),[]);
});
test('new planning evidence tracks completions and reopening without inventing old dates',()=>{
 const a=app();a.state.workspace.tasks=[{id:'old',title:'Old task',subject:'Maths',estimateMinutes:20,plannedDate:'',dueDate:'',priority:'normal',done:true,updatedAt:1,deletedAt:0}];
 a.do('analytics-init');a.do('task-save',{title:'Algebra',subject:'Maths',estimateMinutes:30,plannedDate:'2026-11-16'});const id=a.state.workspace.tasks.at(-1).id;
 a.advance(60000);a.do('task-save',{...a.state.workspace.tasks.at(-1),itemId:id,done:true});a.advance(60000);a.do('task-save',{...a.state.workspace.tasks.at(-1),itemId:id,done:false});
 const r=studyAnalysis(a.state,range());assert.equal(r.tasks.completed,1);assert.equal(r.tasks.unknown,1);assert.equal(r.tasks.rows.find(t=>t.id===id).done,false);
 const old=studyAnalysis(a.state,range({period:'last-week'}));assert.equal(old.tasks.completed,0);assert.equal(old.tasks.rows.length,0);
});
test('past reports preserve earlier estimates and do not include later task study',()=>{
 const a=app();a.do('task-save',{title:'Algebra',subject:'Maths',estimateMinutes:30,plannedDate:'2026-11-16'});const task=a.state.workspace.tasks[0];a.advance(3600000);a.do('task-save',{...task,itemId:task.id,estimateMinutes:90,done:true});
 a.state.sessions=[session('old','2026-11-16T08:10:00Z','2026-11-16T08:30:00Z',{taskId:task.id}),session('later','2026-11-18T08:00:00Z','2026-11-18T09:00:00Z',{taskId:task.id})];
 const r=studyAnalysis(a.state,range({period:'custom',start:'2026-11-16',end:'2026-11-16'}));assert.equal(r.tasks.rows[0].estimateMinutes,30);assert.equal(r.tasks.rows[0].actualSeconds,1200);
});
test('daily goal changes are historical and global targets do not turn into subject-only goals',()=>{
 const a=app();a.do('goal',{minutes:30});a.state.sessions=[session('m','2026-11-16T09:00:00Z','2026-11-16T09:20:00Z'),session('b','2026-11-16T10:00:00Z','2026-11-16T10:20:00Z',{subject:'Biology'})];a.advance(86400000);a.do('goal',{minutes:60});
 const r=studyAnalysis(a.state,range(),{subject:'Maths'});assert.equal(r.total,1200);assert.equal(r.goals.days[0].target,30);assert.equal(r.goals.days[0].seconds,2400);assert.equal(r.goals.days[0].reached,true);assert.equal(r.goals.days[1].target,60);
 const old=studyAnalysis(a.state,range({period:'last-week'}));assert.equal(old.goals.eligible,0);assert.equal(old.goals.unknown,7);
});
test('review snapshots stay unchanged after record deletion and can be regenerated explicitly',()=>{
 const a=app();a.do('analytics-init');a.state.sessions=[session('one','2026-11-16T09:00:00Z','2026-11-16T09:30:00Z')];const review=newReview(studyAnalysis(a.state,range()),a.state,'week',now);review.good='Finished a hard chapter';a.do('review-save',{review});const saved=a.state.workspace.learning.reviews[0],before=JSON.stringify(saved.snapshot);
 a.do('delete',{recordId:'one'});assert.equal(JSON.stringify(a.state.workspace.learning.reviews[0].snapshot),before);assert.notEqual(analysisFingerprint(a.state),saved.fingerprint);assert.equal(newReview(studyAnalysis(a.state,range()),a.state,'week',now).snapshot.total,0);
 assert.throws(()=>a.do('review-save',{itemId:saved.id,expectedUpdatedAt:1,review:saved}),/another tab/);
});
test('history, reflections, report zones and tombstones survive backup and deterministic merge',()=>{
 const a=app();a.do('task-save',{title:'Study',estimateMinutes:20});a.do('analytics-zone',{zone:'Asia/Kolkata'});const review=newReview(studyAnalysis(a.state,range()),a.state,'week',now);a.do('review-save',{review});const backup=backupOf(a.state),other=structuredClone(backup);a.advance(1000);const r=a.state.workspace.learning.reviews[0];a.do('review-delete',{itemId:r.id,expectedUpdatedAt:r.updatedAt});
 const merged=mergeBackups(backupOf(a.state),other);assert.equal(merged.workspace.learning.zone,'Asia/Kolkata');assert.ok(merged.workspace.learning.reviews[0].deletedAt);assert.equal(checkState(a.state).workspace.learning.events.length,a.state.workspace.learning.events.length);assert.deepEqual(mergeLearning(a.state.workspace.learning,other.workspace.learning),mergeLearning(other.workspace.learning,a.state.workspace.learning));assert.equal(losesLearningHistory(backup,{workspace:{}}),true);
});
test('malformed review/history imports are rejected before persistence',()=>{
 const a=app();a.do('analytics-init');const l=structuredClone(a.state.workspace.learning);l.events.push({...l.events[0]});assert.throws(()=>validateLearning(l),/Invalid/);
 const review=newReview(studyAnalysis(a.state,range()),a.state,'week',now);review.snapshot.subjects=[{name:{unsafe:'object'},seconds:1,share:1}];assert.throws(()=>a.do('review-save',{review}),/Invalid/);
});
test('example records are isolated, deterministic and explicitly synthetic',()=>{
 const d=exampleAnalysisData(now,'UTC'),before=JSON.stringify(d),r=studyAnalysis(d,range());assert.ok(r.count>0);assert.ok(r.tasks.completed>0);assert.ok(d.sessions.every(s=>s.id.startsWith('analysis-example-')));assert.equal(JSON.stringify(d),before);assert.equal(analysisFingerprint(d),analysisFingerprint(exampleAnalysisData(now,'UTC')));
});
test('feature access checks preview expiry and trusted subscription independently',()=>{
 assert.equal(advancedAccess({preview:true,now}).source,'preview');assert.equal(advancedAccess({preview:true,previewEndsAt:now-1,now}).allowed,false);assert.equal(advancedAccess({preview:true,previewEndsAt:now-1,subscriptionEndsAt:now+1,now}).source,'subscription');assert.equal(advancedAccess({subscriptionEndsAt:now,now}).allowed,false);
});
test('exports omit private tasks and reflections unless selected, and SVG escapes labels',()=>{
 const d=exampleAnalysisData(now,'UTC'),r=newReview(studyAnalysis(d,range()),d,'week',now);r.good='PRIVATE REFLECTION';r.snapshot.tasks[0].title='PRIVATE TASK';assert.ok(!reportLines(r).join('\n').includes('PRIVATE'));assert.ok(reportLines(r,{includeTasks:true,includeNotes:true}).join('\n').includes('PRIVATE TASK'));r.snapshot.subjects[0].name='<script>alert(1)</script>';assert.ok(!summarySVG(r).includes('<script>'));assert.ok(summarySVG(r).includes('&lt;script&gt;'));
});
test('PDF construction uses correct byte offsets and one page per image without remote assets',()=>{
 const jpeg=new Uint8Array([255,216,255,217]),pdf=pdfFromImages([{bytes:jpeg,width:100,height:200},{bytes:jpeg,width:100,height:200}]),text=new TextDecoder().decode(pdf);assert.ok(text.startsWith('%PDF-1.4'));assert.ok(text.includes('/Count 2'));const xref=Number(text.match(/startxref\n(\d+)/)[1]);assert.equal(new TextDecoder().decode(pdf.slice(xref,xref+4)),'xref');assert.ok(!text.includes('http'));assert.ok(text.includes('/DCTDecode'));
});
test('deleted reviews clear their private payload and stale imports do not restore it',()=>{
 const a=app();a.do('analytics-init');const review=newReview(studyAnalysis(a.state,range()),a.state,'week',now);review.good='A private reflection';a.do('review-save',{review});const old=backupOf(a.state),r=a.state.workspace.learning.reviews[0];a.advance(1000);a.do('review-delete',{itemId:r.id,expectedUpdatedAt:r.updatedAt});const deleted=a.state.workspace.learning.reviews[0];assert.equal(deleted.good,'');assert.equal(deleted.snapshot.tasks.length,0);assert.equal(deleted.snapshot.total,0);assert.equal(mergeBackups(backupOf(a.state),old).workspace.learning.reviews[0].good,'');
});
test('review-data export follows the same private-content choices as PDF export',()=>{
 const d=exampleAnalysisData(now,'UTC'),r=newReview(studyAnalysis(d,range()),d,'week',now);r.next='Private next step';assert.equal(reviewExportData(r).next,'');assert.equal(reviewExportData(r).snapshot.tasks.length,0);assert.equal(reviewExportData(r,{includeNotes:true}).next,r.next);assert.equal(reviewExportData(r,{includeTasks:true}).snapshot.tasks.length,r.snapshot.tasks.length);
});
test('the current local daily goal remains coherent with dated evidence after a merge',()=>{
 const a=app();a.do('goal',{minutes:30});const remote=backupOf(a.state),e=remote.workspace.learning.events.filter(e=>e.kind==='daily-goal').at(-1);remote.dailyGoal=90;e.minutes=90;e.at+=1000;e.id+=':remote';a.advance(2000);a.do('import',{backup:remote});assert.equal(a.state.dailyGoal,30);assert.equal(a.state.workspace.learning.events.filter(e=>e.kind==='daily-goal').at(-1).minutes,30);
});
test('malformed preview expiry fails closed rather than creating an unlimited preview',()=>{
 assert.equal(advancedAccess({preview:true,previewEndsAt:'bad',now}).allowed,false);assert.equal(advancedAccess({preview:true,previewEndsAt:-1,now}).allowed,false);
});
