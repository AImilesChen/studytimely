import {build} from 'vite';
import {buildPwa} from './build-pwa.mjs';
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {ROUTES} from '../src/lib/routes.mjs';
import {metadata} from '../src/lib/site.mjs';
import {build as bundleWorker} from 'esbuild';
const root=path.resolve(import.meta.dirname,'..');process.chdir(root);
const release=process.argv.includes('--release'),config=JSON.parse(await fs.readFile('site.config.json','utf8'));
const policyFiles=['privacy-policy.en.md','terms-of-use.en.md','cookies-and-local-storage.en.md'];
if(release){
 const missing=[];let origin;
 try{origin=new URL(config.origin);if(origin.protocol!=='https:'||origin.pathname!=='/'||origin.search||origin.hash||/localhost|\.test$|\.invalid$/.test(origin.hostname))missing.push('valid public HTTPS origin');}catch{missing.push('origin');}
 if(!/^\S+@\S+\.\S+$/.test(config.supportEmail))missing.push('supportEmail');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(config.effectiveDate))missing.push('effectiveDate');
 if(config.policiesReviewed!==true)missing.push('policiesReviewed');if(config.indexable!==true)missing.push('indexable');
 if(config.ga4Id&&(!/^G-[A-Z0-9]+$/.test(config.ga4Id)||!config.analyticsPolicyReviewed))missing.push('reviewed analytics configuration');
 for(const file of policyFiles){const text=await fs.readFile(path.join(root,'../docs/compliance/v1.1',file),'utf8');if(text.includes('[待确认')||text.includes('INTERNAL DRAFT'))missing.push('final policy: '+file);}
 if(config.accountsEnabled&&(!config.accountsReviewed||config.localAccountsTest))missing.push('production account setup and policy review');
 if(missing.length)throw Error('Release configuration is incomplete: '+missing.join(', ')+'. Local preview remains available.');
}
process.env.STUDY_RELEASE=release?'1':'0';
await build();
await build({build:{ssr:'src/entry-server.jsx',outDir:'dist/ssr',emptyOutDir:true}});
const {render}=await import(pathToFileURL(path.join(root,'dist/ssr/entry-server.js')));
const base=await fs.readFile('dist/client/index.html','utf8'),now=Date.now();
const effective={...config,indexable:release&&config.indexable};
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function documentFor(route){
 const m=metadata(route,effective);
 let html=base.replace(/<title>.*?<\/title>/s,`<title>${escape(m.title)}</title>`).replace(/\s*<meta (?:name="(?:description|robots)"|property="og:(?:title|description|image|url)")[^>]*>/g,'');
 const head=`<meta name="description" content="${escape(m.description)}"><meta name="robots" content="${m.robots}"><meta property="og:title" content="${escape(m.title)}"><meta property="og:description" content="${escape(m.description)}"><meta property="og:image" content="${escape(m.ogImage)}">`+(m.canonical?`<link rel="canonical" href="${escape(m.canonical)}"><meta property="og:url" content="${escape(m.canonical)}">`:'')+(m.schema?`<script id="page-schema" type="application/ld+json">${JSON.stringify(m.schema).replaceAll('<','\\u003c')}</script>`:'')+(config.gscVerification?`<meta name="google-site-verification" content="${escape(config.gscVerification)}">`:'')+(config.bingVerification?`<meta name="msvalidate.01" content="${escape(config.bingVerification)}">`:'');
 return html.replace('</head>',head+'</head>').replace('<div id="root"></div>',`<div id="root" data-rendered-at="${now}">${render(route,now)}</div>`);
}
for(const route of ROUTES){const dir=route.path==='/'?'dist/client':path.join('dist/client',route.path.slice(1));await fs.mkdir(dir,{recursive:true});await fs.writeFile(path.join(dir,'index.html'),documentFor(route.path));}
await fs.writeFile('dist/client/404.html',documentFor('/404'));
await fs.writeFile('dist/client/robots.txt',release?`User-agent: *\nAllow: /\nDisallow: /analytics-frame.html\nSitemap: ${config.origin.replace(/\/$/,'')}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n');
const urls=release?ROUTES.filter(r=>r.indexable!==false&&!['privacy','terms','cookies'].includes(r.id)).map(r=>`<url><loc>${escape(config.origin.replace(/\/$/,'')+r.path)}</loc></url>`).join(''):'';
await fs.writeFile('dist/client/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
// Explicit individual paths, all inside dist/client; never remove a source or archive.
for(const name of ['design-review.html','design-review.css','design-review.js']){const file=path.join(root,'dist/client',name);if(existsSync(file))await fs.unlink(file);}
const pwa=await buildPwa(root,ROUTES);console.log('PWA cache:',pwa);
await fs.writeFile('dist/cloudflare-entry.mjs',`import {createWorker} from '../server/cloudflare.mjs';\nexport default createWorker(${JSON.stringify({origin:config.origin,indexable:release,accountsEnabled:config.accountsEnabled===true,analyticsEnabled:!!config.ga4Id&&config.analyticsPolicyReviewed})});\n`);
await bundleWorker({entryPoints:['dist/cloudflare-entry.mjs'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'dist/cloudflare/worker.mjs'});
await import('./prepare-sites-build.mjs');
console.log(`Pre-rendered ${ROUTES.length} pages + 404. Environment: ${release?'release':'local preview (noindex)'}.`);
