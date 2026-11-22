import {publicPlans} from '../src/lib/plus-plans.mjs';
import {result} from './auth-shared.mjs';

// Public offer discovery before commercial activation. No Stripe or billing
// tables are needed; even configured credentials cannot enable a purchase here.
export function pricingOptions(request,env={},config={},at=Date.now()){
 if(request.method!=='GET')return result({error:{code:'METHOD',message:'Use GET.'}},405,{Allow:'GET'});
 const preview=key=>config[key]===true&&(!config[key+'EndsAt']||config[key+'EndsAt']>at);
 return result({enabled:false,ready:false,environment:null,plans:publicPlans(),previews:{planning:preview('advancedPlanningPreview'),analytics:preview('advancedAnalyticsPreview'),library:preview('advancedLibraryPreview'),sync:env.SYNC_REQUIRE_PLUS!=='true'}});
}
