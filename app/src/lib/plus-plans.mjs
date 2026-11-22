// Public prices shared by the offer and the server's Stripe price verification.
export const PLUS_PLANS={
 plus_monthly:{amount:499,interval:'month',label:'Monthly'},
 plus_annual:{amount:3999,interval:'year',label:'Annual'}
};
export const publicPlans=()=>Object.entries(PLUS_PLANS).map(([plan,value])=>({plan,amount:value.amount,currency:'usd',interval:value.interval}));
export const annualSaving=Math.round((1-PLUS_PLANS.plus_annual.amount/(12*PLUS_PLANS.plus_monthly.amount))*100);
export const DEFAULT_PLUS_PLAN='plus_annual';
const key='studytimely-pricing-choice-v2',lifetime=30*60*1000;
export function rememberPricingPlan(storage,plan,now=Date.now()){
 if(!Object.hasOwn(PLUS_PLANS,plan))return;
 try{storage.setItem(key,JSON.stringify({plan,expires:now+lifetime}));}catch{}
}
export function readPricingPlan(storage,now=Date.now()){
 try{const value=JSON.parse(storage.getItem(key)||'null');
  if(value&&Object.hasOwn(PLUS_PLANS,value.plan)&&Number.isFinite(value.expires)&&value.expires>now&&value.expires<=now+lifetime)return value.plan;
  storage.removeItem(key);
 }catch{}
 return DEFAULT_PLUS_PLAN;
}
export function offerMatches(options){
 return options?.plans?.length===2&&publicPlans().every(expected=>options.plans.some(actual=>Object.keys(expected).every(k=>actual[k]===expected[k])));
}
export function verifiedBillingURL(value){
 const target=new URL(value);
 if(target.protocol!=='https:'||!['checkout.stripe.com','billing.stripe.com'].includes(target.hostname)||target.username||target.password||target.port)throw Error('The billing link could not be verified. Please try again.');
 return target.href;
}
