import {fail,rateLimit} from './auth-shared.mjs';
import {localContentIssue,contentIssueMessage} from '../src/lib/community-safety.mjs';
const categories=['Hate','SelfHarm','Sexual','Violence'];
export function reviewConfiguration(env){
 if(env.COMMUNITY_REVIEW_ENABLED!=='true'||!env.AZURE_CONTENT_SAFETY_KEY)return null;
 try{const url=new URL(env.AZURE_CONTENT_SAFETY_ENDPOINT);if(url.protocol!=='https:'||url.username||url.password||url.port||url.search||url.hash||!['','/'].includes(url.pathname)||!/^[-a-z0-9]+\.cognitiveservices\.azure\.com$/.test(url.hostname))return null;return {endpoint:url.origin,key:env.AZURE_CONTENT_SAFETY_KEY};}catch{return null;}
}
export function enforceLocalContent(text){const issue=localContentIssue(text);if(issue)fail(422,'CONTENT_BLOCKED','*** Message blocked; it was not shared. '+contentIssueMessage(issue));}
export async function reviewChat(text,env,{at=Date.now(),fetcher=fetch,timeoutMs=5000}={}){
 enforceLocalContent(text);
 const config=reviewConfiguration(env);if(!config)fail(503,'REVIEW_UNAVAILABLE','Automatic safety review is not configured. Sending is paused; room timers still work.');
 // Reserve attempts atomically. Failed calls consume budget too; never silently buy more.
 await rateLimit(env,'review-second','all-chat',4,1000,at);
 const d=new Date(at),month=d.toISOString().slice(0,7),expiry=Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,2);
 const requested=Number(env.COMMUNITY_REVIEW_MONTHLY_LIMIT||4500),limit=Number.isInteger(requested)&&requested>=1&&requested<=4500?requested:4500;
 const reserved=await env.DB.prepare('INSERT INTO rate_limits(bucket,count,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 WHERE count<? RETURNING count').bind('chat-review:'+month,expiry,limit).first();
 if(!reserved)fail(503,'REVIEW_LIMIT','Safety review capacity is used up for this UTC month. Sending is paused; room timers still work.');
 const controller=new AbortController();let timeout;
 try{
  // A raced timeout also guards a provider/transport that ignores AbortSignal.
  const data=await Promise.race([(async()=>{const response=await fetcher(config.endpoint+'/contentsafety/text:analyze?api-version=2024-09-01',{method:'POST',redirect:'manual',headers:{'Content-Type':'application/json','Ocp-Apim-Subscription-Key':config.key},body:JSON.stringify({text,categories,outputType:'FourSeverityLevels'}),signal:controller.signal});if(!response.ok)throw Error('review unavailable');return response.json();})(),new Promise((_,reject)=>{timeout=setTimeout(()=>{controller.abort();reject(Error('timeout'));},timeoutMs);})]);
  const scores=data?.categoriesAnalysis;
  if(!Array.isArray(scores)||scores.length!==categories.length||categories.some(c=>scores.filter(x=>x.category===c&&[0,2,4,6].includes(x.severity)).length!==1))throw Error('invalid review');
  // Conservative study-space policy, with a higher threshold for contextual violence/history.
  if(scores.some(x=>x.severity>=(x.category==='Sexual'?2:4)))fail(422,'CONTENT_BLOCKED','*** Message blocked; it was not shared. Please keep the conversation safe and focused on learning.');
 }catch(e){if(e.code==='CONTENT_BLOCKED')throw e;fail(503,'REVIEW_UNAVAILABLE','Safety review is temporarily unavailable. Your message was not sent. Please try again later.');}
 finally{clearTimeout(timeout);controller.abort();}
}
