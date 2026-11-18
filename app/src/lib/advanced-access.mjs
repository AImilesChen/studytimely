export function advancedAccess({preview=false,previewEndsAt=0,subscriptionEndsAt=0,now=Date.now()}={}){
 const paid=Number.isFinite(subscriptionEndsAt)&&subscriptionEndsAt>now,ends=Number(previewEndsAt);
 const trial=preview===true&&Number.isFinite(ends)&&ends>=0&&(!ends||ends>now);
 return {allowed:paid||trial,source:paid?'subscription':trial?'preview':'free',expiresAt:paid?subscriptionEndsAt:trial?ends:0};
}
