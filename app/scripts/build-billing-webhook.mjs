import {build} from 'esbuild';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
await build({absWorkingDir:root,entryPoints:['server/billing-webhook-worker.mjs'],bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,outfile:'.wrangler/billing-webhook/worker.mjs'});
console.log('Built isolated Stripe sandbox webhook receiver.');
