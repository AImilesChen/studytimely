import test from 'node:test';
import assert from 'node:assert/strict';
import {richWeeklySource,detailedTestContent} from './weekly-v2-fixture.mjs';
import {detailedWeeklyInput,detailedPlanning} from '../src/lib/ai-weekly-detailed.mjs';
import {weeklyFacts,weeklyContent,weeklyEvidence,validateSavedWeekly} from '../src/lib/ai-weekly-contract.mjs';
import {weeklyReview,weeklyStale} from '../src/lib/ai-weekly.mjs';
import {transition,validateBackup} from '../src/lib/model.mjs';
import {backupOf} from '../src/lib/storage.mjs';
import {mergeLearning} from '../src/lib/learning-history.mjs';
import {weeklyReportHTML} from '../src/lib/ai-weekly-export.mjs';
import {detailedReportSections} from '../src/lib/weekly-detailed-view.mjs';
import {generateWeekly,weeklyConfiguration,weeklyReservation} from '../server/ai-weekly-provider.mjs';
const now=Date.parse('2026-11-22T12:00:00Z'),options={now,period:'last-week',zone:'UTC'},id='00000000-0000-4000-8000-000000000099';
function saved(data=richWeeklySource()){const facts=detailedWeeklyInput(data,options);return {version:2,id,hash:'a'.repeat(64),generatedAt:now,facts,content:detailedTestContent(facts)};}
function importReport(data,ai=saved(data)){return transition(data,{type:'review-import-ai',review:weeklyReview(ai),epoch:data.epoch},{now,id:'import',owner:'test'}).state;}
const command=(data,type,payload={},at=now)=>transition(data,{type,...payload,epoch:data.epoch,expectedRevision:data.workspace.planning.revision},{now:at,id:type+'-test',owner:'test'}).state;
test('rich detailed input contains real history and checked slots, but no private titles or raw windows',()=>{
 const state=richWeeklySource(),f=detailedWeeklyInput(state,options),json=JSON.stringify(f);assert.equal(f.version,2);assert.equal(f.detail.coverage.depth,'full');assert.equal(f.detail.weeks.length,4);assert.equal(f.detail.weeks[3].seconds,f.seconds);assert.ok(f.detail.pairs.length);assert.equal(f.detail.target.minutes,300);assert.ok(f.detail.planning.candidate.slots.length);assert.ok(!json.includes('Private'));assert.ok(!json.includes('future-task'));assert.ok(!json.includes('Maths'));assert.ok(!json.includes('window-'));assert.deepEqual(weeklyFacts(f),f);assert.ok(f.detail.planning.tasks.some(t=>t.remaining===null));
 const schedule=detailedPlanning(state,{at:now}).schedule;for(const block of schedule.blocks){assert.ok(block.endAt>block.startAt);assert.ok(block.startAt>=now);}assert.equal(schedule.plannedMinutes,100);
});
test('missing week-start history and already-started task estimates stay unknown; sparse input is insufficient',()=>{
 const data=richWeeklySource();data.workspace.learning.startedAt=now;data.workspace.learning.events=[];data.workspace.planning.availability=[];data.workspace.tasks=[];data.sessions=data.sessions.slice(-1);const f=detailedWeeklyInput(data,{...options,period:'week'});assert.equal(f.detail.target.minutes,null);assert.equal(f.detail.baseline.known,false);assert.equal(f.detail.baseline.completed,null);assert.equal(f.detail.coverage.depth,'insufficient');
 const rich=richWeeklySource(),task=rich.workspace.tasks.find(t=>t.id==='future-task-1');rich.sessions.push({...rich.sessions[0],id:'task-progress',taskId:task.id});const unknown=detailedPlanning(rich,{at:now});assert.equal(unknown.facts.tasks.find(t=>t.ref===unknown.refs.get(task.id)).remaining,null);assert.ok(!unknown.schedule.blocks.some(b=>b.taskId===task.id));
});
test('date-only exams never put preparation on exam day; partial four-week windows stay comparable',()=>{
 const data=richWeeklySource(),task=data.workspace.tasks.find(t=>t.id==='future-task-1'),p=data.workspace.planning;
 data.workspace.exams=[{id:'exam-test',title:'Private exam',subject:'Maths',date:'2026-11-23',time:'',timeZone:'UTC',status:'upcoming',archived:false,updatedAt:now-100,deletedAt:0}];p.goals=[{id:'exam-goal',kind:'exam',title:'Private goal',subject:'Maths',deadline:'2026-11-23',examId:'exam-test',updatedAt:now-100,deletedAt:0}];p.rules=[{id:task.id,goalId:'exam-goal',remainingMinutes:60,earliestDate:'',dependsOn:[],sourcePlanId:'',sourceChapterId:'',updatedAt:now-100,deletedAt:0}];
 const checked=detailedPlanning(data,{at:now});assert.ok(checked.schedule.blocks.filter(b=>b.taskId===task.id).every(b=>b.endAt<=Date.parse('2026-11-23T00:00:00Z')));
 const f=detailedWeeklyInput(richWeeklySource(),{...options,now:Date.parse('2026-11-18T12:00:00Z'),period:'week'});assert.equal(f.days.length,3);assert.ok(f.detail.weeks.every(w=>w.partial&&w.end.slice(-2)!==undefined));assert.equal(f.detail.weeks[2].seconds,f.previous.seconds);
});
test('invented evidence, candidate, capacity, overlap and incomplete reasoning are rejected',()=>{
 const ai=saved();assert.deepEqual(validateSavedWeekly(ai),ai);const mutate=fn=>{const a=structuredClone(ai);fn(a);assert.throws(()=>validateSavedWeekly(a));};
 mutate(a=>a.content.findings[0].evidence_refs=['invented']);mutate(a=>a.content.next_plan.candidate_id='P2');mutate(a=>a.content.findings[0].uncertainty='');mutate(a=>a.content.findings[0].interpretation='');mutate(a=>a.facts.detail.planning.candidate.scheduled++);mutate(a=>a.facts.detail.planning.candidate.slots[0].minutes++);mutate(a=>a.facts.detail.weeks[0].seconds=-1);mutate(a=>a.content.sections[0].finding_ids=[]);
});
test('AI planning evidence distinguishes all known backlog from known work due in the window',()=>{
 const f=saved().facts,first=f.detail.planning.tasks.find(t=>t.remaining===60);first.deadline='2026-12-20';const evidence=weeklyEvidence(weeklyFacts(f)).E06;assert.ok(evidence.includes('Known remaining task-list workload=100 minutes'));assert.ok(evidence.includes('known workload with a deadline by window end=40 minutes'));
});
test('explicit adoption is atomic, repeat-safe and reversible without completing tasks or saving study',()=>{
 const initial=richWeeklySource(),ai=saved(initial),withReport=importReport(initial,ai),sessions=structuredClone(withReport.sessions),tasks=structuredClone(withReport.workspace.tasks);
 const added=command(withReport,'planning-apply-weekly',{reportId:id});assert.ok(added.workspace.planning.blocks.length);assert.deepEqual(added.sessions,sessions);assert.deepEqual(added.workspace.tasks,tasks);assert.equal(added.workspace.learning.events.filter(e=>e.kind==='ai-plan').length,1);assert.ok(added.workspace.planning.undo.aiAdoptionId);assert.throws(()=>command(added,'planning-apply-weekly',{reportId:id}));
 const restored=command(added,'planning-undo');assert.ok(restored.workspace.planning.blocks.every(b=>b.deletedAt));assert.ok(restored.workspace.learning.events.some(e=>e.kind==='ai-plan-undone'));assert.throws(()=>command(restored,'planning-apply-weekly',{reportId:id}));
 validateBackup(backupOf(added));assert.deepEqual(mergeLearning(added.workspace.learning,restored.workspace.learning).events.filter(e=>e.kind==='ai-plan-undone').length,1);
});
test('changed inputs or elapsed slots cannot silently replace a current plan',()=>{
 const initial=richWeeklySource(),withReport=importReport(initial),before=JSON.stringify(withReport);const changed=structuredClone(withReport);changed.workspace.tasks.find(t=>t.id==='future-task-1').updatedAt++;assert.throws(()=>command(changed,'planning-apply-weekly',{reportId:id}),/changed/);assert.equal(JSON.stringify(withReport),before);
 const first=saved(initial).facts.detail.planning.candidate.slots[0];assert.throws(()=>command(withReport,'planning-apply-weekly',{reportId:id},first.startAt+1),/passed/);assert.equal(JSON.stringify(withReport),before);
});
test('timestamp metadata alone does not suggest spending another report allowance',()=>{
 const ai=saved(),later=structuredClone(ai.facts);later.detail.planning.at+=60000;assert.equal(weeklyStale(ai,later),false);later.detail.planning.basis+='a';assert.equal(weeklyStale(ai,later),true);
});
test('adding and undoing a report preserves locked sessions and restores replaced unlocked sessions',()=>{
 const state=richWeeklySource(),p=state.workspace.planning;p.blocks=[{id:'old-unlocked',taskId:'future-task-1',startAt:Date.parse('2026-11-23T19:00:00Z'),endAt:Date.parse('2026-11-23T19:30:00Z'),locked:false,status:'planned',source:'generated',updatedAt:now-100,deletedAt:0},{id:'keep-locked',taskId:'future-task-2',startAt:Date.parse('2026-11-24T18:00:00Z'),endAt:Date.parse('2026-11-24T18:20:00Z'),locked:true,status:'planned',source:'manual',updatedAt:now-100,deletedAt:0}];
 const ai=saved(state);assert.equal(ai.facts.detail.planning.candidate.replacementCount,1);const added=command(importReport(state,ai),'planning-apply-weekly',{reportId:id});assert.ok(added.workspace.planning.blocks.find(b=>b.id==='old-unlocked').deletedAt);assert.deepEqual(added.workspace.planning.blocks.find(b=>b.id==='keep-locked'),p.blocks[1]);const undone=command(added,'planning-undo');assert.equal(undone.workspace.planning.blocks.find(b=>b.id==='old-unlocked').deletedAt,0);assert.deepEqual(undone.workspace.planning.blocks.find(b=>b.id==='keep-locked'),p.blocks[1]);
});
test('follow-through only counts explicitly adopted tasks through the selected report cutoff',()=>{
 const state=richWeeklySource(),added=command(importReport(state),'planning-apply-weekly',{reportId:id});assert.equal(detailedWeeklyInput(added,options).detail.follow.length,0);
 const task=added.workspace.tasks.find(t=>t.id==='future-task-1'),completed=command(added,'task-save',{...task,itemId:task.id,done:true},now+3600000),next=detailedWeeklyInput(completed,{...options,now:Date.parse('2026-11-29T12:00:00Z')});assert.equal(next.detail.follow.length,2);assert.ok(next.detail.follow.some(x=>x.status==='completed'));assert.ok(next.detail.follow.some(x=>x.status==='open'));assert.ok(!JSON.stringify(next.detail.follow).includes('Private'));
});
test('screen content model and full HTML export preserve all eight sections and reasoning',()=>{
 const ai=saved(),parts=detailedReportSections(ai),html=weeklyReportHTML(ai);assert.equal(parts.length,8);for(const part of parts)assert.ok(html.includes(part.title));for(const finding of ai.content.findings)for(const key of ['observation','interpretation','uncertainty','recommendation','check_next_week'])assert.ok(html.includes(finding[key]));assert.ok(html.includes('Example'));assert.ok(!html.includes('Private'));assert.ok(!html.includes('<script'));
 const malicious=structuredClone(ai);malicious.content.findings[0].observation='<img src=x onerror=alert(1)>';assert.ok(weeklyReportHTML(malicious).includes('&lt;img'));assert.ok(!weeklyReportHTML(malicious).includes('<img src=x'));
});
test('detailed provider generation has a separate bounded gate and rejects truncated output',async()=>{
 const f=saved().facts,env={AI_WEEKLY_ENABLED:'true',DEEPSEEK_API_KEY:'test-placeholder-key',AI_WEEKLY_MONTHLY_LIMIT:'4',AI_WEEKLY_DAILY_TOKEN_LIMIT:'100000',AI_WEEKLY_DETAILED_ENABLED:'true',AI_WEEKLY_DETAILED_MAX_OUTPUT:'5000'};assert.equal(weeklyConfiguration({...env,AI_WEEKLY_DETAILED_ENABLED:'false'}).detailed,false);assert.ok(weeklyReservation(f,env)>5000);
 let request;const fetcher=async(url,init)=>{request=JSON.parse(init.body);return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(detailedTestContent(f))}}],usage:{prompt_tokens:1200,completion_tokens:2400}});};const output=await generateWeekly(f,env,{fetcher});assert.equal(request.max_tokens,5000);assert.equal(output.content.version,2);assert.ok(!JSON.stringify(request).includes('Private'));
 await assert.rejects(()=>generateWeekly(f,{...env,AI_WEEKLY_DETAILED_ENABLED:'false'},{fetcher}));await assert.rejects(()=>generateWeekly(f,env,{fetcher:async()=>Response.json({choices:[{finish_reason:'length',message:{content:'{}'}}],usage:{prompt_tokens:100,completion_tokens:5000}})}));
});
test('an incomplete live-style response is rejected without an automatic second paid request',async()=>{
 const f=saved().facts,env={AI_WEEKLY_ENABLED:'true',DEEPSEEK_API_KEY:'test-placeholder-key',AI_WEEKLY_MONTHLY_LIMIT:'1',AI_WEEKLY_DAILY_TOKEN_LIMIT:'25000',AI_WEEKLY_DETAILED_ENABLED:'true',AI_WEEKLY_DETAILED_MAX_OUTPUT:'5000'},content=detailedTestContent(f);content.findings.find(x=>x.section_id==='capacity').interpretation='';let calls=0;
 await assert.rejects(()=>generateWeekly(f,env,{fetcher:async()=>{calls++;return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(content)}}],usage:{prompt_tokens:1851,completion_tokens:1961}});}}));assert.equal(calls,1);
});
test('Workers-compatible provider requests reject redirects without forwarding the credential',async()=>{
 const f=saved().facts,env={AI_WEEKLY_ENABLED:'true',DEEPSEEK_API_KEY:'test-placeholder-key',AI_WEEKLY_MONTHLY_LIMIT:'1',AI_WEEKLY_DAILY_TOKEN_LIMIT:'25000',AI_WEEKLY_DETAILED_ENABLED:'true',AI_WEEKLY_DETAILED_MAX_OUTPUT:'5000'};let calls=0;
 await assert.rejects(()=>generateWeekly(f,env,{fetcher:async(url,init)=>{calls++;assert.equal(url,'https://api.deepseek.com/chat/completions');assert.equal(init.redirect,'manual');return new Response(null,{status:302,headers:{Location:'https://untrusted.example.invalid'}});}}),/AI_PROVIDER/);assert.equal(calls,1);
});
