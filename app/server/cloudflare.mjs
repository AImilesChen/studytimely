import {pricingOptions} from './pricing-options.mjs';
import {SCENE_VIDEOS} from '../src/lib/scene-media.mjs';
import {automaticSyncMaintenance} from './automatic-sync.mjs';
import {learningFeatures,libraryAccess} from './learning-features.mjs';
import {createWeeklyApi,weeklyMaintenance} from './ai-weekly.mjs';
import {result} from './auth-shared.mjs';
import {PLUS_SCENES,sceneAssetPath} from '../src/lib/library-access.mjs';
import {MUSIC_TRACKS} from '../src/lib/music-catalog.mjs';
import {AMBIENT_RECORDINGS} from '../src/lib/ambient-catalog.mjs';
import {musicAssetResponse} from './music-assets.mjs';
import {ROUTES} from '../src/lib/routes.mjs';
import {createAccountsApi} from './accounts.mjs';
import {createGoogleAuth} from './google-auth.mjs';
import {createCommunityApi,communityMaintenance} from './community.mjs';
const accountApi=createAccountsApi({emailRecoveryOnly:true}),googleApi=createGoogleAuth(),communityApi=createCommunityApi();
const weeklyApi=createWeeklyApi();
const accountPaths=new Set(['/api/auth/me','/api/auth/request-code','/api/auth/verify-code','/api/auth/logout','/api/workspace','/api/account/export','/api/account']);
const paths=new Set(ROUTES.map(r=>r.path));
const musicFiles=new Map([...MUSIC_TRACKS,...AMBIENT_RECORDINGS,...MUSIC_TRACKS.filter(t=>t.sampleSrc).map(t=>({src:t.sampleSrc,bytes:t.sampleBytes}))].map(t=>[t.src,t.bytes]));
const sceneVideos=new Map(SCENE_VIDEOS.map(s=>[s.src,s.bytes]));
const plusMedia=new Set([...MUSIC_TRACKS.filter(t=>t.plannedTier==='expanded').map(t=>t.src),...sceneVideos.keys(),...PLUS_SCENES.map(sceneAssetPath)]);
export function createWorker(config={indexable:false}){return{async fetch(request,env,ctx){
 const url=new URL(request.url),path=url.pathname;
 let decodedPath;try{decodedPath=decodeURIComponent(path);}catch{return result({error:{code:'INVALID_PATH',message:'Use a valid content URL.'}},400);}
 if(decodedPath.includes('%')||decodedPath.includes('\\')||decodedPath.split('/').some(part=>part==='.'||part==='..')||decodedPath.includes('//'))return result({error:{code:'INVALID_PATH',message:'Use the canonical content URL.'}},400);
 // Match the same decoded path as the asset service, including encoded aliases.
 const mediaPath=decodedPath.startsWith('/library/full/')?decodedPath.slice('/library/full'.length):decodedPath;
 const protectedMedia=plusMedia.has(mediaPath);
 if(decodedPath.startsWith('/library/full/')&&!protectedMedia)return result({error:{code:'NOT_FOUND',message:'Content not found.'}},404);
 if(protectedMedia){
  try{const access=await libraryAccess(request,env,config);if(!access.allowed)return result({error:{code:'LIBRARY_ACCESS',message:'Plus access is needed for this full recording or moving scene. Free content and music samples remain available.'}},403);}
  catch{return result({error:{code:'LIBRARY_UNAVAILABLE',message:'Access could not be checked. Try again; free content remains available.'}},503);}
 }
 if(path==='/api/billing/options')return pricingOptions(request,env,config);
 if(path==='/api/learning/features')return learningFeatures(request,env,config);
 if(path.startsWith('/api/learning/weekly-reports'))return weeklyApi(request,env,config,ctx);
 if(path.startsWith('/api/auth/google/'))return googleApi(request,env);
 if(path.startsWith('/api/community/'))return communityApi(request,env,config.communityEnabled===true,ctx);
 if(accountPaths.has(path)||path.startsWith('/api/sync/'))return accountApi(request,env,config.accountsEnabled===true);
 const headers={'X-Content-Type-Options':'nosniff','Referrer-Policy':['/study-groups','/leaderboard','/account'].includes(path)?'no-referrer':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()'};
 if(!config.indexable||path==='/pricing'||['/study-tracker','/study-planner'].includes(path)&&(url.searchParams.has('example')||url.searchParams.has('view')||path==='/study-planner'&&(url.searchParams.has('exam')||url.searchParams.has('syllabus')))||path==='/study-groups'&&(url.searchParams.has('room')||url.searchParams.has('invite')||url.searchParams.has('activity')))headers['X-Robots-Tag']='noindex, nofollow';
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
 let assetPath=protectedMedia?mediaPath:paths.has(path)?(path==='/'?'/index.html':path+'/index.html'):path;
 const assetUrl=new URL(request.url);assetUrl.pathname=assetPath;assetUrl.search='';
 const musicAsset=musicFiles.has(assetPath);
 let response=await env.ASSETS.fetch(new Request(assetUrl,{method:request.method}));
 if(musicAsset)response=await musicAssetResponse(request,response,musicFiles.get(assetPath));
 if(sceneVideos.has(assetPath))response=await musicAssetResponse(request,response,sceneVideos.get(assetPath),'video/mp4');
 const missing=response.status===404;
 if(missing&&request.headers.get('accept')?.includes('text/html')){assetUrl.pathname='/404.html';response=await env.ASSETS.fetch(new Request(assetUrl,{method:request.method}));}
 const out=new Headers(response.headers);for(const [key,value] of Object.entries(headers))out.set(key,value);
 if(path==='/analytics-frame.html'||path==='/analytics-frame.js'||missing)out.set('X-Robots-Tag','noindex, nofollow');
 if(protectedMedia){out.set('Cache-Control','private, no-store');out.set('Vary','Cookie');out.set('X-Robots-Tag','noindex, nofollow');}
 else if(path.startsWith('/assets/')||musicAsset||sceneVideos.has(path))out.set('Cache-Control','public, max-age=31536000, immutable');else out.set('Cache-Control','no-cache');
 if(path==='/study-groups'&&(url.searchParams.has('room')||url.searchParams.has('invite')||url.searchParams.has('activity'))){out.set('Cache-Control','no-store');out.delete('Content-Length');out.delete('ETag');}
 if(path==='/study-groups'&&(url.searchParams.has('room')||url.searchParams.has('invite')||url.searchParams.has('activity'))&&request.method!=='HEAD'&&out.get('Content-Type')?.includes('text/html')) {
  const html=await response.text();
  response=new Response(html.replace(/(<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["'])[^"']*(["'])/i,'$1noindex,nofollow$2'),{status:response.status});
  out.delete('Content-Length');out.delete('ETag');
 }
 const analytics=config.analyticsEnabled&&path==='/analytics-frame.html'?" https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com https://analytics.ahrefs.com":'';
 out.set('Content-Security-Policy',`default-src 'self'; script-src 'self'${analytics}; style-src 'self' 'unsafe-inline'; img-src 'self' data:${analytics}; font-src 'self'; connect-src 'self'${config.communityEnabled&&path==='/study-groups'?' '+(url.protocol==='https:'?'wss://':'ws://')+url.host:''}${analytics}; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'`);
 return new Response(request.method==='HEAD'?null:response.body,{status:missing?404:response.status,headers:out});
},async scheduled(event,env,ctx){if(config.accountsEnabled)ctx.waitUntil(automaticSyncMaintenance(env,event.scheduledTime));if(config.accountsEnabled&&env.AI_WEEKLY_ENABLED==='true')ctx.waitUntil(weeklyMaintenance(env,event.scheduledTime));if(config.communityEnabled)ctx.waitUntil(communityMaintenance(env,event.scheduledTime));}};}
