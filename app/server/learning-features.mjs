import {advancedAccess} from '../src/lib/advanced-access.mjs';
import {readCookie,digest,result} from './auth-shared.mjs';
import {LIBRARY_POLICY_VERSION} from '../src/lib/library-access.mjs';
export async function subscriptionExpiry(request,env,config,at){
 const token=readCookie(request);
 if(config.accountsEnabled!==true||!env.DB||!token||!/^[a-f0-9]{64}$/.test(token))return 0;
 const row=await env.DB.prepare('SELECT e.expires_at,s.expires_at AS session_expires_at FROM sessions s JOIN community_entitlements e ON e.account_id=s.account_id WHERE s.token_hash=? AND s.expires_at>? AND e.expires_at>?').bind(await digest(token),at,at).first();
 return row?Math.min(row.expires_at,row.session_expires_at??row.expires_at):0;
}
export async function libraryAccess(request,env,config,at=Date.now()){
 return {...advancedAccess({preview:config.advancedLibraryPreview===true,previewEndsAt:config.advancedLibraryPreviewEndsAt||0,subscriptionEndsAt:await subscriptionExpiry(request,env,config,at),now:at}),policyVersion:LIBRARY_POLICY_VERSION};
}
export async function learningFeatures(request,env,config,at=Date.now()){
 if(request.method!=='GET')return result({error:{code:'METHOD',message:'Use GET.'}},405,{Allow:'GET'});
 if(request.headers.get('sec-fetch-site')==='cross-site')return result({error:{code:'ORIGIN',message:'Open this from StudyTimely.'}},403);
 const subscriptionEndsAt=await subscriptionExpiry(request,env,config,at);
 return result({planning:advancedAccess({preview:config.advancedPlanningPreview===true,previewEndsAt:config.advancedPlanningPreviewEndsAt||0,subscriptionEndsAt,now:at}),analytics:advancedAccess({preview:config.advancedAnalyticsPreview===true,previewEndsAt:config.advancedAnalyticsPreviewEndsAt||0,subscriptionEndsAt,now:at}),library:{...advancedAccess({preview:config.advancedLibraryPreview===true,previewEndsAt:config.advancedLibraryPreviewEndsAt||0,subscriptionEndsAt,now:at}),policyVersion:LIBRARY_POLICY_VERSION},checkedAt:at});
}
