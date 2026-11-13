import {ROUTES} from '../src/lib/routes.mjs';
import {createAccountsApi} from './accounts.mjs';
const accountApi=createAccountsApi();
const accountPaths=new Set(['/api/auth/me','/api/auth/request-code','/api/auth/verify-code','/api/auth/logout','/api/workspace','/api/account/export','/api/account']);
const paths=new Set(ROUTES.map(r=>r.path));
export function createWorker(config={indexable:false}){return{async fetch(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(accountPaths.has(path))return accountApi(request,env,config.accountsEnabled===true);
 const headers={'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()'};
 if(!config.indexable)headers['X-Robots-Tag']='noindex, nofollow';
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{...headers,Allow:'GET, HEAD'}});
 if(config.origin){
  const primary=new URL(config.origin);
  if([primary.hostname,'www.'+primary.hostname].includes(url.hostname)&&url.origin!==primary.origin){primary.pathname=path;primary.search=url.search;return new Response(null,{status:308,headers:{...headers,Location:primary.href}});}
 }
 if(path==='/study-timer'||path==='/study-timer/'||path==='/index.html')return new Response(null,{status:301,headers:{...headers,Location:'/'}});
 const trimmed=path!=='/'?path.replace(/\/$/,''):path;
 if(path!==trimmed&&paths.has(trimmed))return new Response(null,{status:308,headers:{...headers,Location:trimmed+url.search}});
 if(path.endsWith('/index.html')&&paths.has(path.slice(0,-11)))return new Response(null,{status:301,headers:{...headers,Location:path.slice(0,-11)||'/'}});
 if(path.startsWith('/design-review')||path==='/site.config.json'||path.startsWith('/api/'))return new Response('Not found',{status:404,headers:{...headers,'X-Robots-Tag':'noindex'}});
 let assetPath=paths.has(path)?(path==='/'?'/index.html':path+'/index.html'):path;
 const assetUrl=new URL(request.url);assetUrl.pathname=assetPath;assetUrl.search='';
 let response=await env.ASSETS.fetch(new Request(assetUrl,{method:request.method}));
 const missing=response.status===404;
 if(missing&&request.headers.get('accept')?.includes('text/html')){assetUrl.pathname='/404.html';response=await env.ASSETS.fetch(new Request(assetUrl,{method:request.method}));}
 const out=new Headers(response.headers);for(const [key,value] of Object.entries(headers))out.set(key,value);
 if(path==='/analytics-frame.html'||path==='/analytics-frame.js'||missing)out.set('X-Robots-Tag','noindex, nofollow');
 if(path.startsWith('/assets/'))out.set('Cache-Control','public, max-age=31536000, immutable');else out.set('Cache-Control','no-cache');
 const analytics=config.analyticsEnabled&&path==='/analytics-frame.html'?" https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com https://analytics.ahrefs.com":'';
 out.set('Content-Security-Policy',`default-src 'self'; script-src 'self'${analytics}; style-src 'self' 'unsafe-inline'; img-src 'self' data:${analytics}; font-src 'self'; connect-src 'self'${analytics}; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'`);
 return new Response(request.method==='HEAD'?null:response.body,{status:missing?404:response.status,headers:out});
}};}
