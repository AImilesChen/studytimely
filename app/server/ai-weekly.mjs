import {ApiError,fail,body,result,identity,rateLimit,hmac} from './auth-shared.mjs';
import {subscriptionExpiry} from './learning-features.mjs';
import {weeklyFacts} from '../src/lib/ai-weekly-contract.mjs';
import {canonical} from '../src/lib/cloud-sync.mjs';
import {analysisRange,dayBoundary} from '../src/lib/study-analysis.mjs';
import {weeklyConfiguration,generateWeekly,weeklyReservation} from './ai-weekly-provider.mjs';

const base='/api/learning/weekly-reports',keyOK=v=>typeof v==='string'&&/^[a-f0-9-]{36}$/.test(v);
const q=(env,sql,...args)=>env.DB.prepare(sql).bind(...args);
const object=row=>row?{id:row.id,hash:row.input_hash,status:row.status,startedAt:row.started_at,generatedAt:row.finished_at,facts:row.facts?JSON.parse(row.facts):null,content:row.content?JSON.parse(row.content):null,error:row.error_code||null}:null;
async function access(request,env,config,at){
 const paid=await subscriptionExpiry(request,env,config,at),end=Number(env.AI_WEEKLY_PREVIEW_ENDS_AT||0),preview=env.AI_WEEKLY_PREVIEW==='true'&&Number.isSafeInteger(end)&&end>=0&&(!end||end>at);
 return {allowed:paid>at||preview,source:paid>at?'subscription':preview?'preview':'free'};
}
async function settle(env,id,status,at,{content=null,error='',inputTokens=0,outputTokens=0}={}){
 // Idempotent settlement. Unknown provider consumption is conservatively spent,
 // even on timeout; user report allowance is charged ONLY for valid ready output.
 const row=await q(env,'SELECT * FROM ai_weekly_reports WHERE id=? AND status=? AND reserved=1',id,'pending').first();if(!row)return;
 const charged=status==='ready'?1:0,spent=inputTokens+outputTokens||row.reservation;
 await env.DB.batch([
  q(env,"UPDATE ai_weekly_daily_budget SET reserved=reserved-?,spent=spent+? WHERE day_key=? AND EXISTS(SELECT 1 FROM ai_weekly_reports WHERE id=? AND status='pending' AND reserved=1)",row.reservation,spent,row.day_key,id),
  q(env,"UPDATE ai_weekly_reports SET status=?,content=?,error_code=?,finished_at=?,reserved=0,charged=?,input_tokens=?,output_tokens=? WHERE id=? AND status='pending' AND reserved=1",status,content?JSON.stringify(content):null,error,at,charged,inputTokens,outputTokens,id)
 ]);
}
export async function weeklyMaintenance(env,at=Date.now(),accountId=null){
 if(!env.DB)return;
 const pending=(await q(env,"SELECT id FROM ai_weekly_reports WHERE status='pending' AND started_at<?"+(accountId?' AND account_id=?':'')+' LIMIT 200',at-90000,...(accountId?[accountId]:[])).all()).results;
 for(const row of pending)await settle(env,row.id,'failed',at,{error:'AI_TIMEOUT'});
 // Retain successful reports until explicitly deleted. Failed inputs expire,
 // but usage receipts remain for this month's quota and operational accounting.
 if(!accountId)await q(env,"UPDATE ai_weekly_reports SET facts='',content=NULL WHERE status IN ('failed','deleted') AND started_at<?",at-7*86400000).run();
}
export async function weeklyAccountData(env,accountId){
 if(!await q(env,"SELECT name FROM sqlite_master WHERE type='table' AND name='ai_weekly_reports'").first())return [];
 return (await q(env,"SELECT * FROM ai_weekly_reports WHERE account_id=? AND status<>'deleted' ORDER BY started_at DESC",accountId).all()).results.map(object);
}
export async function cancelAccountWeekly(env,accountId,at){
 if(!await q(env,"SELECT name FROM sqlite_master WHERE type='table' AND name='ai_weekly_reports'").first())return;
 const rows=(await q(env,"SELECT id FROM ai_weekly_reports WHERE account_id=? AND status='pending'",accountId).all()).results;
 for(const row of rows)await settle(env,row.id,'deleted',at,{error:'ACCOUNT_DELETED'});
}
export function createWeeklyApi({now=Date.now,generate=generateWeekly,makeId=()=>crypto.randomUUID()}={}){
 return async function weeklyApi(request,env,config,ctx){
  const url=new URL(request.url),path=url.pathname,method=request.method,at=now(),configured=weeklyConfiguration(env);
  try{
   if(![base,base+'/status'].includes(path)&&!new RegExp('^'+base+'/[a-f0-9-]{36}$').test(path))fail(404,'NOT_FOUND','Weekly report not found.');
   if(!['GET','POST','DELETE'].includes(method))fail(405,'METHOD','Use a supported weekly report action.');
   if(config.accountsEnabled!==true)fail(503,'AI_NOT_CONFIGURED','Weekly AI reports are not enabled. Your statistics and private reflections still work.');
   if(path===base+'/status'&&method==='GET'&&!configured.configured){
    let reader=null;if(env.DB&&env.AUTH_HMAC?.length>=32&&await q(env,"SELECT name FROM sqlite_master WHERE type='table' AND name='ai_weekly_reports'").first())reader=await identity(request,env,at,false);
    return result({available:false,provider:'DeepSeek',reason:'AI_NOT_CONFIGURED',authenticated:!!reader,...(reader?{accountId:reader.id}:{}),allowed:false,limit:0,used:0,reserved:0});
   }
   const user=await identity(request,env,at,path!==base+'/status');
   if(!user)return result({available:configured.configured,detailedAvailable:configured.detailed,provider:'DeepSeek',authenticated:false,allowed:false,limit:configured.monthly,used:0,reserved:0});
   await weeklyMaintenance(env,at,user.id);
   const scope=await access(request,env,config,at),month=new Date(at).toISOString().slice(0,7),day=new Date(at).toISOString().slice(0,10);
   if(path===base+'/status'&&method==='GET'){
    const quota=await q(env,'SELECT COALESCE(SUM(charged),0) AS used,COALESCE(SUM(reserved),0) AS reserved FROM ai_weekly_reports WHERE account_id=? AND month_key=?',user.id,month).first();
    const next=new Date(at);next.setUTCMonth(next.getUTCMonth()+1,1);next.setUTCHours(0,0,0,0);
    return result({available:configured.configured,detailedAvailable:configured.detailed,provider:'DeepSeek',authenticated:true,accountId:user.id,allowed:scope.allowed,source:scope.source,limit:configured.monthly,...quota,resetsAt:next.getTime()});
   }
   if(path===base&&method==='GET'){
    const rows=(await q(env,"SELECT * FROM ai_weekly_reports WHERE account_id=? AND status IN ('pending','ready','failed') ORDER BY started_at DESC LIMIT 200",user.id).all()).results;
    return result({accountId:user.id,reports:rows.map(object)});
   }
   if(path!==base&&path!==base+'/status'){
    const id=path.slice(base.length+1),row=await q(env,'SELECT * FROM ai_weekly_reports WHERE id=? AND account_id=? AND status<>?',id,user.id,'deleted').first();if(!row)fail(404,'NOT_FOUND','Weekly report not found.');
    if(method==='GET')return result({report:object(row)});
    if(method==='DELETE'){await settle(env,id,'deleted',at,{error:'CANCELLED'});await q(env,"UPDATE ai_weekly_reports SET status='deleted',facts='',content=NULL WHERE id=? AND account_id=?",id,user.id).run();return result({deleted:true});}
    fail(405,'METHOD','Use GET or DELETE for a saved weekly report.');
   }
   if(path!==base||method!=='POST')fail(405,'METHOD','Use GET for weekly report availability.');
   if(!configured.configured)fail(503,'AI_NOT_CONFIGURED','AI reports are not connected yet. Statistics and private reflections remain available.');
   if(!scope.allowed)fail(403,'PLUS_REQUIRED','AI weekly reports need Plus or an explicitly enabled AI preview. Existing reports stay readable.');
   const input=await body(request,24000);if(input.consent!==true)fail(400,'AI_CONSENT','Confirm sending the displayed weekly summary to DeepSeek.');
   if(!keyOK(input.requestKey))fail(400,'INVALID','Use a valid generation request.');
   let facts;try{facts=weeklyFacts(input.facts);}catch{fail(400,'INVALID','The weekly summary is invalid. Refresh the report and try again.');}
   if(facts.version===2&&!configured.detailed)fail(503,'AI_DETAILED_NOT_CONFIGURED','Detailed reports are not enabled yet. Existing saved reports remain available.');
   if(facts.version===2&&facts.detail.coverage.depth==='insufficient')fail(400,'INSUFFICIENT_DETAIL','Add planning or historical evidence before generating a detailed report. No allowance was used.');
   if(facts.version===2&&facts.detail.coverage.depth==='limited'&&input.allowLimited!==true)fail(400,'LIMITED_CONSENT','Confirm that you want a limited-evidence report before using a report allowance.');
   const ranges=['week','last-week'].map(period=>analysisRange({period,zone:facts.zone,now:at})),range=ranges.find(r=>r.start===facts.start&&r.end===facts.end&&r.partial===facts.partial);
   if(!range||facts.cutoffAt>range.endAt||facts.cutoffAt<range.startAt||!facts.partial&&facts.cutoffAt!==dayBoundary(new Date(Date.parse(facts.end)+86400000).toISOString().slice(0,10),facts.zone))fail(400,'INVALID_PERIOD','Generate this week or last week using your selected time zone.');
   if(!facts.count||!facts.seconds)fail(400,'NO_RECORDS','Save a study session in this week before generating a report. The example remains available.');
   const serial=canonical(facts),hash=await hmac(env.AUTH_HMAC,serial),old=await q(env,'SELECT * FROM ai_weekly_reports WHERE account_id=? AND request_key=?',user.id,input.requestKey).first();
   if(old){if(old.input_hash!==hash)fail(409,'REQUEST_CHANGED','This request belongs to a different snapshot. Refresh before generating.');return result({report:object(old),reused:true},old.status==='pending'?202:200);}
   const cached=await q(env,"SELECT * FROM ai_weekly_reports WHERE account_id=? AND input_hash=? AND status IN ('pending','ready') ORDER BY started_at DESC LIMIT 1",user.id,hash).first();if(cached)return result({report:object(cached),reused:true},cached.status==='pending'?202:200);
   await rateLimit(env,'ai-weekly-start',user.id,10,3600000,at);
   const id=makeId(),reservation=weeklyReservation(facts,env);
   await env.DB.batch([
    q(env,'INSERT INTO ai_weekly_daily_budget(day_key) VALUES(?) ON CONFLICT(day_key) DO NOTHING',day),
    q(env,`INSERT INTO ai_weekly_reports(id,account_id,request_key,input_hash,facts,status,month_key,day_key,reservation,started_at)
      SELECT ?,?,?,?,?,'pending',?,?,?,? WHERE
      (SELECT COALESCE(SUM(charged+reserved),0) FROM ai_weekly_reports WHERE account_id=? AND month_key=?)<?
      AND NOT EXISTS(SELECT 1 FROM ai_weekly_reports WHERE account_id=? AND status='pending')
      AND NOT EXISTS(SELECT 1 FROM ai_weekly_reports WHERE account_id=? AND input_hash=? AND status='ready')
      AND (SELECT COUNT(*) FROM ai_weekly_reports WHERE account_id=? AND status IN ('ready','pending'))<200
      AND EXISTS(SELECT 1 FROM ai_weekly_daily_budget WHERE day_key=? AND reserved+spent+?<=?)`,id,user.id,input.requestKey,hash,serial,month,day,reservation,at,user.id,month,configured.monthly,user.id,user.id,hash,user.id,day,reservation,configured.daily),
    q(env,"UPDATE ai_weekly_daily_budget SET reserved=reserved+? WHERE day_key=? AND EXISTS(SELECT 1 FROM ai_weekly_reports WHERE id=? AND status='pending')",reservation,day,id)
   ]);
   const row=await q(env,'SELECT * FROM ai_weekly_reports WHERE id=?',id).first();
   if(!row){const concurrent=await q(env,"SELECT * FROM ai_weekly_reports WHERE account_id=? AND input_hash=? AND status IN ('pending','ready') ORDER BY started_at DESC LIMIT 1",user.id,hash).first();if(concurrent)return result({report:object(concurrent),reused:true},concurrent.status==='pending'?202:200);fail(429,'AI_CAPACITY','Your report allowance, another running report, saved-report limit or daily service capacity prevents a new report. Existing reports remain available.');}
   const work=async()=>{try{const output=await generate(facts,env);await settle(env,id,'ready',now(),output);}catch{await settle(env,id,'failed',now(),{error:'AI_GENERATION_FAILED'});}};
   if(ctx?.waitUntil){ctx.waitUntil(work());return result({report:object(row)},202);}
   await work();return result({report:object(await q(env,'SELECT * FROM ai_weekly_reports WHERE id=?',id).first())});
  }catch(e){return result({error:{code:e instanceof ApiError?e.code:'AI_UNAVAILABLE',message:e instanceof ApiError?e.message:'Weekly reports are temporarily unavailable. No failed report uses your report allowance.'}},e instanceof ApiError?e.status:503);}
 };
}
