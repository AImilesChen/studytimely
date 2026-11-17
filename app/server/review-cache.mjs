import {hmac} from './auth-shared.mjs';
// Bump whenever local rules, review prompt, thresholds or parsing policy change.
export const REVIEW_POLICY_VERSION='2026-11-17-study-chat-v1';
export const REVIEW_CACHE_MS=5*60000;
export async function reviewCacheKey(text,env,config,model){
 return hmac(env.AUTH_HMAC,JSON.stringify(['study-review',REVIEW_POLICY_VERSION,config.provider,model,config.endpoint||'',text]));
}
export async function cachedApproval(env,key,at){
 try{
  const row=await env.DB.prepare('SELECT policy_version,created_at,expires_at FROM community_review_cache WHERE cache_key=?').bind(key).first();
  return !!row&&row.policy_version===REVIEW_POLICY_VERSION&&Number.isInteger(row.created_at)&&row.created_at<=at&&row.expires_at>at&&row.expires_at<=row.created_at+REVIEW_CACHE_MS;
 }catch{return false;} // Cache failures require a fresh review, never an approval.
}
export async function cacheApproval(env,key,at){
 try{await env.DB.batch([
  env.DB.prepare('DELETE FROM community_review_cache WHERE expires_at<=? OR policy_version<>?').bind(at,REVIEW_POLICY_VERSION),
  env.DB.prepare('INSERT INTO community_review_cache(cache_key,policy_version,created_at,expires_at) VALUES(?,?,?,?) ON CONFLICT(cache_key) DO UPDATE SET policy_version=excluded.policy_version,created_at=excluded.created_at,expires_at=excluded.expires_at').bind(key,REVIEW_POLICY_VERSION,at,at+REVIEW_CACHE_MS)
 ]);}catch{/* Optional optimisation: a successful fresh review remains valid without caching. */}
}
