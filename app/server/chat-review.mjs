import {fail,rateLimit} from './auth-shared.mjs';
import {localContentIssue,contentIssueMessage} from '../src/lib/community-safety.mjs';
import {cloudflareReviewLimit,reserveReview,settleReview,reviewBudgetStatus,CF_REVIEW_RESERVATION} from './review-budget.mjs';
import {reviewCacheKey,cachedApproval,cacheApproval} from './review-cache.mjs';
export const CF_REVIEW_MODEL='@cf/meta/llama-guard-3-8b';
const categories=['Hate','SelfHarm','Sexual','Violence'];
export function reviewConfiguration(env){
 if(env.COMMUNITY_REVIEW_ENABLED!=='true')return null;
 const provider=env.COMMUNITY_REVIEW_PROVIDER||'azure';
 if(provider==='cloudflare')return typeof env.AI?.run==='function'&&cloudflareReviewLimit(env)?{provider,name:'Cloudflare Workers AI'}:null;
 if(provider!=='azure'||!env.AZURE_CONTENT_SAFETY_KEY)return null;
 try{const url=new URL(env.AZURE_CONTENT_SAFETY_ENDPOINT);if(url.protocol!=='https:'||url.username||url.password||url.port||url.search||url.hash||!['','/'].includes(url.pathname)||!/^[-a-z0-9]+\.cognitiveservices\.azure\.com$/.test(url.hostname))return null;return {provider,name:'Microsoft Azure AI Content Safety',endpoint:url.origin,key:env.AZURE_CONTENT_SAFETY_KEY};}catch{return null;}
}
export async function reviewAvailability(env,at=Date.now()){
 const config=reviewConfiguration(env);if(!config)return {available:false,state:'unconfigured',provider:null};
 if(config.provider==='cloudflare')try{const b=await reviewBudgetStatus(env,at);if(!b)return {available:false,state:'unavailable',provider:config.name};if(b.retryAfter>at)return {available:false,state:'unavailable',provider:config.name,retryAt:b.retryAfter};if(b.spent+b.reserved+CF_REVIEW_RESERVATION>b.limit)return {available:false,state:'capacity',provider:config.name,retryAt:b.retryAt};}catch{return {available:false,state:'unavailable',provider:config.name};}
 return {available:true,state:'ready',provider:config.name};
}
export function enforceLocalContent(text){const issue=localContentIssue(text);if(issue)fail(422,'CONTENT_BLOCKED','*** Message blocked; it was not shared. '+contentIssueMessage(issue));}
function blocked(){fail(422,'CONTENT_BLOCKED','*** Message blocked; it was not shared. Please keep the conversation safe and focused on learning.');}
export function cloudflareReviewInput(text){
 if(typeof text!=='string'||!text.trim()||text.length>500||new TextEncoder().encode(text).length>2000)fail(400,'INVALID','Use between 1 and 500 characters.');
 const detectionCopy=text.normalize('NFKC').replace(/\p{Cf}/gu,'');
 return {messages:[{role:'user',content:'Write a message for a study group.'},{role:'assistant',content:detectionCopy}],max_tokens:24,temperature:0,response_format:{type:'json_object'}};
}
export function parseCloudflareReview(data){
 const answer=data?.response,tokens=data?.usage;
 if(typeof answer?.safe!=='boolean'||!Array.isArray(answer.categories)||answer.categories.some(c=>!/^S(?:[1-9]|1[0-4])$/.test(c))||new Set(answer.categories).size!==answer.categories.length||answer.safe!==!answer.categories.length)throw Error('Invalid review result');
 if(!Number.isInteger(tokens?.prompt_tokens)||tokens.prompt_tokens<1||tokens.prompt_tokens>6000||!Number.isInteger(tokens?.completion_tokens)||tokens.completion_tokens<1||tokens.completion_tokens>24)throw Error('Invalid review usage');
 const estimated=(tokens.prompt_tokens*44003+tokens.completion_tokens*2730)/1e6;
 if(tokens.neurons!==undefined&&(!Number.isFinite(tokens.neurons)||tokens.neurons<0))throw Error('Invalid review usage');
 return {safe:answer.safe,neurons:Math.max(estimated,tokens.neurons??0)};
}
export async function reviewChat(text,env,{at=Date.now(),fetcher=fetch,timeoutMs=5000,diagnostic=()=>{}}={}){
 enforceLocalContent(text);
 const config=reviewConfiguration(env);if(!config)fail(503,'REVIEW_UNAVAILABLE','Automatic safety review is not configured. Sending is paused; room timers still work.');
 // Validate every path before consulting the approval cache.
 const validatedInput=cloudflareReviewInput(text),cfInput=config.provider==='cloudflare'?validatedInput:null;
 const key=await reviewCacheKey(text,env,config,config.provider==='cloudflare'?CF_REVIEW_MODEL:'azure-2024-09-01-four-severity');
 if(await cachedApproval(env,key,at)){
  const availability=await reviewAvailability(env,at);
  if(!availability.available)fail(503,availability.state==='capacity'?'REVIEW_LIMIT':'REVIEW_UNAVAILABLE','Safety review is temporarily paused. Your message was not sent. Please try again later.');
  return {cached:true};
 }
 await rateLimit(env,'review-second','all-chat',4,1000,at);
 let ticket,actual,settled=false;
 if(config.provider==='cloudflare')ticket=await reserveReview(env,at);
 else{
  const d=new Date(at),month=d.toISOString().slice(0,7),expiry=Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,2);
  const requested=Number(env.COMMUNITY_REVIEW_MONTHLY_LIMIT||4500),limit=Number.isInteger(requested)&&requested>=1&&requested<=4500?requested:4500;
  const reserved=await env.DB.prepare('INSERT INTO rate_limits(bucket,count,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 WHERE count<? RETURNING count').bind('chat-review:'+month,expiry,limit).first();
  if(!reserved)fail(503,'REVIEW_LIMIT','Safety review capacity is used up for this UTC month. Sending is paused; room timers still work.');
 }
 const controller=new AbortController();let timeout;
 try{
  const work=async()=>{
   if(config.provider==='cloudflare')return env.AI.run(CF_REVIEW_MODEL,cfInput);
   const response=await fetcher(config.endpoint+'/contentsafety/text:analyze?api-version=2024-09-01',{method:'POST',redirect:'manual',headers:{'Content-Type':'application/json','Ocp-Apim-Subscription-Key':config.key},body:JSON.stringify({text,categories,outputType:'FourSeverityLevels'}),signal:controller.signal});if(!response.ok)throw Error('review unavailable');return response.json();
  };
  const data=await Promise.race([work(),new Promise((_,reject)=>{timeout=setTimeout(()=>{controller.abort();reject(Error('timeout'));},Math.max(1,Math.min(timeoutMs,10000)));})]);
  if(config.provider==='cloudflare'){
   const reviewed=parseCloudflareReview(data);actual=reviewed.neurons;
   const exceeded=actual>ticket.reservation;
   await settleReview(env,ticket,exceeded?'failed':reviewed.safe?'allowed':'blocked',actual,at);settled=true;
   if(exceeded)throw Error('Review usage exceeded reservation');if(!reviewed.safe)blocked();
  }else{
   const scores=data?.categoriesAnalysis;
   if(!Array.isArray(scores)||scores.length!==categories.length||categories.some(c=>scores.filter(x=>x.category===c&&[0,2,4,6].includes(x.severity)).length!==1))throw Error('invalid review');
   if(scores.some(x=>x.severity>=(x.category==='Sexual'?2:4)))blocked();
  }
  await cacheApproval(env,key,at);
  return {cached:false};
 }catch(e){
  // Optional test/operations metadata only: never include text or upstream responses.
  try{diagnostic({provider:config.provider,code:e?.message==='timeout'?'TIMEOUT':String(e?.message||'').startsWith('Invalid review')?'INVALID_RESULT':e?.code==='CONTENT_BLOCKED'?'BLOCKED':'UPSTREAM_ERROR'});}catch{}
  if(ticket&&!settled)try{await settleReview(env,ticket,'failed',actual,at);}catch{/* A retained pending reservation also fails closed. */}
  if(e?.code==='CONTENT_BLOCKED')throw e;fail(503,'REVIEW_UNAVAILABLE','Safety review is temporarily unavailable. Your message was not sent. Please try again later.');
 }finally{clearTimeout(timeout);controller.abort();}
}
