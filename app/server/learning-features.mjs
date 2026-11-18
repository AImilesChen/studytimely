import {advancedAccess} from '../src/lib/advanced-access.mjs';
import {readCookie,digest,result} from './auth-shared.mjs';
export async function learningFeatures(request,env,config,at=Date.now()){
 if(request.method!=='GET')return result({error:{code:'METHOD',message:'Use GET.'}},405,{Allow:'GET'});
 if(request.headers.get('sec-fetch-site')==='cross-site')return result({error:{code:'ORIGIN',message:'Open this from StudyTimely.'}},403);
 let subscriptionEndsAt=0;const token=readCookie(request);
 if(config.accountsEnabled===true&&env.DB&&token&&/^[a-f0-9]{64}$/.test(token)){
  const row=await env.DB.prepare('SELECT e.expires_at FROM sessions s JOIN community_entitlements e ON e.account_id=s.account_id WHERE s.token_hash=? AND s.expires_at>? AND e.expires_at>?').bind(await digest(token),at,at).first();subscriptionEndsAt=row?.expires_at||0;
 }
 return result({planning:advancedAccess({preview:config.advancedPlanningPreview===true,previewEndsAt:config.advancedPlanningPreviewEndsAt||0,subscriptionEndsAt,now:at}),analytics:advancedAccess({preview:config.advancedAnalyticsPreview===true,previewEndsAt:config.advancedAnalyticsPreviewEndsAt||0,subscriptionEndsAt,now:at}),checkedAt:at});
}
