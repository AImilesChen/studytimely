import {fail} from './auth-shared.mjs';
export const CF_REVIEW_RESERVATION=300;
export const CF_REVIEW_DEFAULT_DAILY=5000;
export function cloudflareReviewLimit(env){const n=Number(env.COMMUNITY_REVIEW_DAILY_NEURONS??CF_REVIEW_DEFAULT_DAILY);return Number.isInteger(n)&&n>=CF_REVIEW_RESERVATION&&n<=8000?n:null;}
export function reviewDay(at){return 'cf-review:'+new Date(at).toISOString().slice(0,10);}
const q=(env,sql,...args)=>env.DB.prepare(sql).bind(...args);
export async function reviewBudgetStatus(env,at){
 const limit=cloudflareReviewLimit(env);if(!limit||!env.DB)return null;
 const row=await q(env,'SELECT * FROM community_review_budgets WHERE bucket=?',reviewDay(at)).first();
 return {limit,reserved:row?.reserved_units||0,spent:row?.spent_units||0,actualNeurons:row?.actual_neurons||0,attempts:row?.attempts||0,allowed:row?.allowed||0,blocked:row?.blocked||0,failed:row?.failed||0,retryAfter:row?.retry_after||0,retryAt:Date.parse(new Date(at).toISOString().slice(0,10)+'T00:00:00Z')+86400000};
}
export async function reserveReview(env,at){
 const limit=cloudflareReviewLimit(env);if(!limit)fail(503,'REVIEW_UNAVAILABLE','Safety review capacity is not configured. Sending is paused.');
 const id=crypto.randomUUID(),bucket=reviewDay(at),expiry=Date.parse(new Date(at).toISOString().slice(0,10)+'T00:00:00Z')+8*86400000;
 const out=await env.DB.batch([
  q(env,'INSERT INTO community_review_budgets(bucket,expires_at) VALUES(?,?) ON CONFLICT(bucket) DO NOTHING',bucket,expiry),
  q(env,"INSERT INTO community_review_attempts(id,bucket,reserved_units,started_at) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM community_review_budgets WHERE bucket=? AND spent_units+reserved_units+?<=? AND retry_after<=?) RETURNING id",id,bucket,CF_REVIEW_RESERVATION,at,bucket,CF_REVIEW_RESERVATION,limit,at),
  q(env,"UPDATE community_review_budgets SET reserved_units=reserved_units+?,attempts=attempts+1 WHERE bucket=? AND EXISTS(SELECT 1 FROM community_review_attempts WHERE id=? AND state='pending')",CF_REVIEW_RESERVATION,bucket,id)
 ]);
 if(!out[1].results?.length){const status=await reviewBudgetStatus(env,at);if(status?.retryAfter>at)fail(503,'REVIEW_UNAVAILABLE','Safety review is temporarily unavailable. Sending is paused; please try again in a minute.');fail(503,'REVIEW_LIMIT','Safety review capacity is used up for this UTC day. Sending is paused; room timers still work.');}
 return {id,bucket,reservation:CF_REVIEW_RESERVATION};
}
export async function settleReview(env,ticket,state,actual,at){
 if(!['allowed','blocked','failed'].includes(state))throw Error('Invalid review settlement');
 const known=Number.isFinite(actual)&&actual>=0,charged=known?Math.ceil(actual):ticket.reservation;
 const column={allowed:'allowed',blocked:'blocked',failed:'failed'}[state];
 await env.DB.batch([
  q(env,`UPDATE community_review_budgets SET reserved_units=reserved_units-?,spent_units=spent_units+?,actual_neurons=actual_neurons+?,${column}=${column}+1,retry_after=MAX(retry_after,?) WHERE bucket=? AND EXISTS(SELECT 1 FROM community_review_attempts WHERE id=? AND state='pending')`,ticket.reservation,charged,known?actual:0,state==='failed'?at+60000:0,ticket.bucket,ticket.id),
  q(env,"UPDATE community_review_attempts SET state=?,actual_neurons=?,charged_units=?,settled_at=? WHERE id=? AND state='pending'",state,known?actual:null,charged,at,ticket.id)
 ]);
}
