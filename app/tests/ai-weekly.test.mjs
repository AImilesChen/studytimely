import test from 'node:test';
import {richWeeklySource,detailedTestContent} from './weekly-v2-fixture.mjs';
import {detailedWeeklyInput} from '../src/lib/ai-weekly-detailed.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createWeeklyApi,weeklyMaintenance,weeklyAccountData,cancelAccountWeekly} from '../server/ai-weekly.mjs';
import {generateWeekly,weeklyConfiguration} from '../server/ai-weekly-provider.mjs';
import {weeklyInput,weeklyReview,weeklyStale} from '../src/lib/ai-weekly.mjs';
import {weeklyFacts,weeklyContent} from '../src/lib/ai-weekly-contract.mjs';
import {emptyState,transition,validateBackup} from '../src/lib/model.mjs';
import {backupOf} from '../src/lib/storage.mjs';
import {losesLearningHistory} from '../src/lib/learning-history.mjs';
import {exampleAnalysisData} from '../src/lib/study-analysis.mjs';
import {digest,hmac} from '../server/auth-shared.mjs';
import {weeklyReportHTML,downloadWeeklyReport} from '../src/lib/ai-weekly-export.mjs';
import {rememberWeeklyEntry,consumeWeeklyEntry} from '../src/lib/weekly-report-entry.mjs';

const at=Date.parse('2026-11-22T12:00:00Z'),secret='weekly-only-test-secret-not-a-real-credential-0000',token='a'.repeat(64),otherToken='b'.repeat(64),base='/api/learning/weekly-reports';
const source=()=>({...emptyState('weekly'),...exampleAnalysisData(at,'UTC')});
const facts=()=>weeklyInput(source(),{now:at,zone:'UTC'});
const content={summary:'A record of saved study to help choose the next step.',keep:[{text:'Consider keeping a repeatable study window.',evidence:['days']}],adjust:[],actions:[{title:'Review one exercise in a short session',why:'Use the recorded week to choose a manageable next step.',minutes:25,evidence:['total']}]};
async function setup({generate=async()=>({content,inputTokens:300,outputTokens:200}),limit=2,preview=false}={}){
 let clock=at,sequence=0,serial=Promise.resolve();const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');
 for(const f of fs.readdirSync(new URL('../migrations/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort())db.exec(fs.readFileSync(new URL('../migrations/'+f,import.meta.url),'utf8'));
 const DB={prepare(sql){return {bind(...args){return {first:async()=>db.prepare(sql).get(...args)||null,all:async()=>({results:db.prepare(sql).all(...args)}),run:async()=>({meta:db.prepare(sql).run(...args)})};}};},batch(statements){const task=serial.then(async()=>{db.exec('BEGIN');try{const out=[];for(const s of statements)out.push(await s.run());db.exec('COMMIT');return out;}catch(e){db.exec('ROLLBACK');throw e;}});serial=task.catch(()=>{});return task;}};
 const env={DB,AUTH_HMAC:secret,DEEPSEEK_API_KEY:'synthetic-key-no-real-api',AI_WEEKLY_ENABLED:'true',AI_WEEKLY_MONTHLY_LIMIT:String(limit),AI_WEEKLY_DAILY_TOKEN_LIMIT:'100000',...(preview?{AI_WEEKLY_PREVIEW:'true'}:{})};
 for(const [id,t] of [['a',token],['b',otherToken]]){db.prepare('INSERT INTO accounts(id,email,created_at) VALUES(?,?,?)').run(id,id+'@example.invalid',at);db.prepare('INSERT INTO sessions(token_hash,account_id,expires_at) VALUES(?,?,?)').run(await digest(t),id,at+30*86400000);}
 db.prepare('INSERT INTO community_entitlements(account_id,member_limit,free_text,expires_at,updated_at) VALUES(?,?,?,?,?)').run('a',24,0,at+86400000,at);
 const csrf=await hmac(secret,'csrf:'+token),otherCsrf=await hmac(secret,'csrf:'+otherToken),api=createWeeklyApi({now:()=>clock,generate,makeId:()=>`00000000-0000-4000-8000-${String(++sequence).padStart(12,'0')}`});
 const call=(suffix='',method='GET',data,options={})=>api(new Request('https://study.test'+base+suffix,{method,headers:{origin:'https://study.test','content-type':'application/json',cookie:'__Host-studytimely-session='+(options.other?otherToken:token),'x-csrf-token':options.other?otherCsrf:csrf,...options.headers},body:data?JSON.stringify(data):undefined}),env,{accountsEnabled:true,advancedAnalyticsPreview:true},options.ctx);
 let key=0;const input=(patch={})=>({requestKey:`11111111-1111-4111-8111-${String(++key).padStart(12,'0')}`,consent:true,facts:facts(),...patch});
 return {db,env,call,input,advance:n=>clock+=n,close:()=>db.close()};
}
test('V2 report creation is separately gated and persists a readable detailed report with one allowance',async()=>{
 let calls=0;const s=await setup({generate:async facts=>{calls++;return {content:detailedTestContent(facts),inputTokens:1000,outputTokens:2500};}});try{
  const f=detailedWeeklyInput(richWeeklySource(at),{now:at,zone:'UTC'});assert.equal((await s.call('','POST',s.input({facts:f}))).status,503);assert.equal(calls,0);
  s.env.AI_WEEKLY_DETAILED_ENABLED='true';s.env.AI_WEEKLY_DETAILED_MAX_OUTPUT='5000';assert.equal((await(await s.call('/status')).json()).detailedAvailable,true);
  const r=await s.call('','POST',s.input({facts:f}));assert.equal(r.status,200);const job=(await r.json()).report;assert.equal(job.status,'ready');assert.equal(weeklyReview(job).snapshot.aiWeek.version,2);assert.equal((await(await s.call('/status')).json()).used,1);assert.equal(calls,1);
 }finally{s.close();}
});
test('insufficient detail and unconfirmed limited reports never reserve quota or call a provider',async()=>{
 let calls=0;const s=await setup({generate:async facts=>{calls++;return {content:detailedTestContent(facts),inputTokens:1000,outputTokens:2500};}});try{
  s.env.AI_WEEKLY_DETAILED_ENABLED='true';s.env.AI_WEEKLY_DETAILED_MAX_OUTPUT='5000';
  const f=detailedWeeklyInput(source(),{now:at,zone:'UTC'});assert.equal(f.detail.coverage.depth,'limited');assert.equal((await s.call('','POST',s.input({facts:f}))).status,400);assert.equal(calls,0);assert.equal((await(await s.call('/status')).json()).reserved,0);
  const response=await s.call('','POST',s.input({facts:f,allowLimited:true}));assert.equal(response.status,200);assert.equal(calls,1);
  const sparse=richWeeklySource(at);sparse.workspace.learning.events=[];sparse.workspace.learning.startedAt=at;sparse.workspace.tasks=[];sparse.workspace.planning.availability=[];sparse.sessions=sparse.sessions.filter(x=>x.startedAt>=Date.parse('2026-11-09T00:00:00Z')&&x.endedAt<Date.parse('2026-11-16T00:00:00Z'));const unavailable=detailedWeeklyInput(sparse,{now:at,zone:'UTC'});assert.equal(unavailable.detail.coverage.depth,'insufficient');assert.equal((await s.call('','POST',s.input({facts:unavailable,allowLimited:true}))).status,400);assert.equal(calls,1);assert.equal((await(await s.call('/status')).json()).used,1);
 }finally{s.close();}
});
test('weekly facts are computed locally and strip task titles, private reflections and names by default',()=>{
 const data=source();data.workspace.tasks[0].title='PRIVATE TASK NEVER SEND';data.workspace.learning.reviews=[];const f=weeklyInput(data,{now:at,zone:'UTC'}),serial=JSON.stringify(f);
 assert.ok(f.seconds>0);assert.equal(f.days.length,7);assert.equal(f.start,'2026-11-09');assert.ok(!serial.includes('PRIVATE'));assert.ok(!serial.includes('Maths'));assert.ok(f.subjects.every(s=>s.name.startsWith('Subject ')));
 assert.equal(JSON.stringify(weeklyFacts(f)),serial);assert.ok(JSON.stringify(weeklyInput(data,{now:at,zone:'UTC',shareNames:true})).includes('Maths'));
 const scoped=weeklyInput(data,{now:at,zone:'UTC',subject:'Maths'});assert.equal(scoped.goals,null);assert.equal(scoped.filter.subject,'selected');
});
test('partial weeks use equal elapsed comparison and invalid/invented summary shapes fail',()=>{
 const f=weeklyInput(source(),{now:Date.parse('2026-11-18T12:00:00Z'),zone:'Europe/London',period:'week'});assert.equal(f.days.length,3);assert.equal(f.previous.end,'2026-11-11');assert.equal(f.partial,true);
 assert.throws(()=>weeklyFacts({...facts(),shareNames:'false'}));assert.throws(()=>weeklyFacts({...facts(),seconds:1}));assert.throws(()=>weeklyFacts({...facts(),days:[]}));assert.throws(()=>weeklyContent({...content,actions:[{...content.actions[0],evidence:['invented-fact']}]},facts()));
});
test('authentication, CSRF, explicit consent and separate Plus gates precede any AI call',async()=>{
 let calls=0;const s=await setup({generate:async()=>{calls++;return {content,inputTokens:300,outputTokens:200};}});try{
  assert.equal((await s.call('','POST',s.input(),{headers:{cookie:''}})).status,401);
  assert.equal((await s.call('','POST',s.input(),{headers:{'x-csrf-token':'wrong'}})).status,403);
  assert.equal((await s.call('','POST',s.input({consent:false}))).status,400);
  assert.equal((await s.call('','POST',s.input(),{other:true})).status,403);assert.equal(calls,0);
 }finally{s.close();}
});
test('valid output persists, retries and equivalent inputs reuse one report and charge once',async()=>{
 let calls=0;const s=await setup({generate:async()=>{calls++;return {content,inputTokens:300,outputTokens:200};}});try{
  const input=s.input(),first=await s.call('','POST',input);assert.equal(first.status,200);const job=(await first.json()).report;assert.equal(job.status,'ready');assert.equal(calls,1);
  const retry=await(await s.call('','POST',input)).json();assert.equal(retry.report.id,job.id);assert.equal(retry.reused,true);
  const cached=await(await s.call('','POST',s.input())).json();assert.equal(cached.report.id,job.id);assert.equal(calls,1);
  const status=await(await s.call('/status')).json();assert.equal(status.used,1);assert.equal(status.reserved,0);
  const changed=s.input({requestKey:input.requestKey,facts:weeklyInput(source(),{now:at,zone:'UTC',shareNames:true})});assert.equal((await s.call('','POST',changed)).status,409);
 }finally{s.close();}
});
test('background generation survives closing the response and simultaneous requests cannot double reserve',async()=>{
 let release,calls=0;const pending=new Promise(r=>release=r),work=[];const s=await setup({generate:async()=>{calls++;await pending;return {content,inputTokens:300,outputTokens:200};}});try{
  const ctx={waitUntil(p){work.push(p);}},responses=await Promise.all([s.call('','POST',s.input(),{ctx}),s.call('','POST',s.input(),{ctx})]);assert.ok(responses.every(r=>r.status===202));assert.equal(calls,1);assert.equal(s.db.prepare('SELECT COUNT(*) n FROM ai_weekly_reports').get().n,1);
  const id=(await responses[0].json()).report.id;assert.equal((await(await s.call('/status')).json()).reserved,1);release();await Promise.all(work);
  assert.equal((await(await s.call('/'+id)).json()).report.status,'ready');assert.equal((await(await s.call('/status')).json()).used,1);
 }finally{s.close();}
});
test('provider failures return user allowance while unknown provider cost remains accounted',async()=>{
 const s=await setup({generate:async()=>{throw Error('private provider error must not leak');}});try{
  const response=await(await s.call('','POST',s.input())).json();assert.equal(response.report.status,'failed');assert.ok(!JSON.stringify(response).includes('private provider error'));
  const status=await(await s.call('/status')).json();assert.equal(status.used,0);assert.equal(status.reserved,0);const budget=s.db.prepare('SELECT * FROM ai_weekly_daily_budget').get();assert.ok(budget.spent>0);assert.equal(budget.reserved,0);
 }finally{s.close();}
});
test('stale background work releases allowance and a late result cannot resurrect it',async()=>{
 let release;const pending=new Promise(r=>release=r),work=[];const s=await setup({generate:async()=>{await pending;return {content,inputTokens:300,outputTokens:200};}});try{
  const {report}=await(await s.call('','POST',s.input(),{ctx:{waitUntil(p){work.push(p);}}})).json();s.advance(91000);const status=await(await s.call('/status')).json();assert.equal(status.used,0);assert.equal(status.reserved,0);release();await Promise.all(work);assert.equal((await(await s.call('/'+report.id)).json()).report.status,'failed');assert.equal(s.db.prepare('SELECT reserved FROM ai_weekly_daily_budget').get().reserved,0);
 }finally{s.close();}
});
test('monthly and shared daily budgets are enforced, with a separate explicit preview policy',async()=>{
 const s=await setup({limit:1});try{assert.equal((await s.call('','POST',s.input())).status,200);assert.equal((await s.call('','POST',s.input({facts:weeklyInput(source(),{now:at,zone:'UTC',shareNames:true})}))).status,429);
  s.env.AI_WEEKLY_PREVIEW='true';s.env.AI_WEEKLY_DAILY_TOKEN_LIMIT='10000';s.db.prepare('UPDATE ai_weekly_daily_budget SET spent=10000').run();assert.equal((await s.call('','POST',s.input(),{other:true})).status,429);
  s.env.AI_WEEKLY_PREVIEW_ENDS_AT=String(at-1);assert.equal((await s.call('','POST',s.input(),{other:true})).status,403);
 }finally{s.close();}
});
test('other accounts cannot view/delete reports; expiry preserves reading and deletion without refunding used quota',async()=>{
 const s=await setup();try{const {report}=await(await s.call('','POST',s.input())).json();assert.equal((await s.call('/'+report.id,'GET',undefined,{other:true})).status,404);assert.equal((await s.call('/'+report.id,'DELETE',undefined,{other:true})).status,404);
  s.db.prepare('DELETE FROM community_entitlements').run();assert.equal((await s.call('/'+report.id)).status,200);assert.equal((await s.call('/'+report.id,'DELETE')).status,200);assert.equal((await s.call('/'+report.id)).status,404);assert.equal((await(await s.call('/status')).json()).used,1);
 }finally{s.close();}
});
test('AI snapshots use existing reviews, preserve notes and survive backup; deletion/import is idempotent',()=>{
 const f=facts(),job={id:'00000000-0000-4000-8000-000000000001',hash:'a'.repeat(64),generatedAt:at,facts:f,content};let data=emptyState('weekly');
 const command=(type,patch={})=>{data=transition(data,{type,...patch,epoch:data.epoch},{now:at,id:'atomic-command',owner:'test'}).state;};
 command('review-import-ai',{review:weeklyReview(job)});const id=data.workspace.learning.reviews[0].id;assert.equal(id,'ai-week-'+job.id);assert.equal(data.timer,null);const sessions=data.sessions.length;
 command('review-import-ai',{review:weeklyReview(job)});assert.equal(data.workspace.learning.reviews.length,1);const original=data.workspace.learning.reviews[0];command('review-save',{itemId:id,expectedUpdatedAt:original.updatedAt,review:{...original,good:'Private reflection never sent'}});assert.equal(data.workspace.learning.reviews[0].good,'Private reflection never sent');
 const exported=backupOf(data);assert.equal(validateBackup(exported).workspace.learning.reviews[0].snapshot.aiWeek.id,job.id);const old=structuredClone(exported);delete old.workspace.learning.reviews[0].snapshot.aiWeek;assert.equal(losesLearningHistory(exported,old),true);
 const saved=data.workspace.learning.reviews[0];command('review-delete',{itemId:id,expectedUpdatedAt:saved.updatedAt});command('review-import-ai',{review:weeklyReview(job)});assert.ok(data.workspace.learning.reviews[0].deletedAt);assert.equal(data.sessions.length,sessions);assert.equal(weeklyStale({facts:f},structuredClone(f)),false);
});
test('DeepSeek adapter uses JSON, disabled thinking, bounded output and validates actual returned content',async()=>{
 const env={DEEPSEEK_API_KEY:'fake-local-test-key',AI_WEEKLY_ENABLED:'true',AI_WEEKLY_MONTHLY_LIMIT:'4',AI_WEEKLY_DAILY_TOKEN_LIMIT:'100000'};let sent;
 const reply=await generateWeekly(facts(),env,{fetcher:async(url,options)=>{assert.equal(url,'https://api.deepseek.com/chat/completions');sent=JSON.parse(options.body);return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(content)}}],usage:{prompt_tokens:200,completion_tokens:300}});}});
 assert.equal(sent.model,'deepseek-flash');assert.equal(sent.thinking.type,'disabled');assert.equal(sent.response_format.type,'json_object');assert.equal(sent.max_tokens,1600);assert.equal(sent.tools,undefined);assert.deepEqual(reply.content,weeklyContent(content,facts()));assert.equal(weeklyConfiguration({}).configured,false);
 for(const value of ['   ',JSON.stringify({...content,actions:[{...content.actions[0],evidence:['made-up']}]})])await assert.rejects(generateWeekly(facts(),env,{fetcher:async()=>Response.json({choices:[{finish_reason:'stop',message:{content:value}}],usage:{prompt_tokens:200,completion_tokens:300}})}));
});
test('report retrieval remains private and available when generation is disabled or its credential is removed',async()=>{
 const s=await setup();try{const {report}=await(await s.call('','POST',s.input())).json();delete s.env.DEEPSEEK_API_KEY;const status=await(await s.call('/status')).json();assert.equal(status.available,false);assert.equal(status.authenticated,true);assert.equal(status.accountId,'a');const list=await(await s.call()).json();assert.equal(list.accountId,'a');assert.equal(list.reports[0].id,report.id);assert.equal((await s.call('','POST',s.input())).status,503);}finally{s.close();}
});
test('account export contains only its own AI reports and pending account deletion releases its reservation',async()=>{
 let release;const pending=new Promise(r=>release=r),jobs=[];const s=await setup({generate:async()=>{await pending;return {content,inputTokens:100,outputTokens:100};}});try{
  await s.call('','POST',s.input(),{ctx:{waitUntil(p){jobs.push(p);}}});assert.equal((await weeklyAccountData(s.env,'b')).length,0);assert.equal((await weeklyAccountData(s.env,'a')).length,1);
  await cancelAccountWeekly(s.env,'a',at);s.db.prepare('DELETE FROM accounts WHERE id=?').run('a');release();await Promise.all(jobs);assert.equal(s.db.prepare('SELECT COUNT(*) n FROM ai_weekly_reports').get().n,0);assert.equal(s.db.prepare('SELECT reserved FROM ai_weekly_daily_budget').get().reserved,0);
 }finally{s.close();}
});
test('readable report export escapes untrusted model text and contains no scripts or personal reflection fields',()=>{
 const ai={version:1,id:'00000000-0000-4000-8000-000000000001',hash:'a'.repeat(64),generatedAt:at,facts:facts(),content:{...content,summary:'<script>PRIVATE_SCRIPT()</script>'}};
 const html=weeklyReportHTML(ai);assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(html.includes('Worth keeping'));assert.ok(html.includes('Small steps for next week'));assert.ok(html.includes('default-src'));assert.ok(!html.includes('privateReflection'));
});
test('sign-in return targets Progress once, expires promptly and stores no report or personal data',()=>{
 const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
 rememberWeeklyEntry(storage,at);assert.equal([...map.values()][0],String(at+600000));assert.equal(consumeWeeklyEntry(storage,at),true);assert.equal(consumeWeeklyEntry(storage,at),false);rememberWeeklyEntry(storage,at);assert.equal(consumeWeeklyEntry(storage,at+600001),false);rememberWeeklyEntry(storage,at);map.set('studytimely-weekly-report-entry','Infinity');assert.equal(consumeWeeklyEntry(storage,at),false);
});

test('browser download creates a readable chart report and clicks an attached named link before cleanup',async t=>{
 const events=[],link={click(){events.push('click');},remove(){events.push('remove');}};let blob;
 const original=globalThis.document;globalThis.document={body:{append(a){assert.equal(a,link);events.push('append');}},createElement(tag){assert.equal(tag,'a');return link;}};t.after(()=>{if(original===undefined)delete globalThis.document;else globalThis.document=original;});
 t.mock.method(URL,'createObjectURL',value=>{blob=value;return 'blob:local-weekly-test';});t.mock.method(URL,'revokeObjectURL',url=>{assert.equal(url,'blob:local-weekly-test');events.push('revoke');});t.mock.method(globalThis,'setTimeout',callback=>{callback();return 1;});
 const ai={version:1,id:'00000000-0000-4000-8000-000000000001',hash:'a'.repeat(64),generatedAt:at,facts:facts(),content};downloadWeeklyReport(ai);assert.deepEqual(events,['append','click','remove','revoke']);assert.equal(link.download,`studytimely-weekly-${ai.facts.start}.html`);assert.equal(blob.type,'text/html;charset=utf-8');const html=await blob.text();assert.ok(html.includes('Daily saved time'));assert.ok(html.includes('Time by subject'));assert.ok(html.includes('<table'));assert.ok(!html.includes('<script'));
});
