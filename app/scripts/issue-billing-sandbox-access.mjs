import fs from 'node:fs/promises';
import {signSandboxAccess} from '../server/billing-sandbox-access.mjs';
// Local operator utility only. Never bundled into a Worker or public asset.
const dir=new URL('../.wrangler/billing-site/',import.meta.url),origin='https://studytimely-billing-sandbox.chenminjian08.workers.dev';
const {AUTH_HMAC}=JSON.parse(await fs.readFile(new URL('auth-private.json',dir),'utf8'));
if(typeof AUTH_HMAC!=='string'||AUTH_HMAC.length<32)throw Error('Configure the independent sandbox AUTH_HMAC in the ignored private file first.');
let identities={};try{identities=JSON.parse(await fs.readFile(new URL('identities-private.json',dir),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const at=Date.now();for(const term of ['monthly','annual']){
 const prior=identities[term],payload={purpose:'payment-sandbox-access',origin,id:prior?.id||'sandbox-'+crypto.randomUUID(),email:'payment-'+term+'@studytimely.invalid',issuedAt:at,expiresAt:at+7*86400000};
 identities[term]=payload;await fs.writeFile(new URL('access-'+term+'.txt',dir),await signSandboxAccess(payload,AUTH_HMAC));
}
await fs.writeFile(new URL('identities-private.json',dir),JSON.stringify(identities,null,2));
console.log('Private sandbox access files issued for seven days under app/.wrangler/billing-site/. Values were not printed. Existing test identities were preserved.');
