import assert from 'node:assert/strict';
import {testDatabase} from './d1.mjs';
import {issueSession} from '../../server/auth-shared.mjs';
import {createCommunityApi} from '../../server/community.mjs';
export const reviewResult=(severity=0,category='Violence')=>Response.json({categoriesAnalysis:['Hate','SelfHarm','Sexual','Violence'].map(c=>({category:c,severity:c===category?severity:0}))});
export const syntheticReviewEnv={COMMUNITY_REVIEW_ENABLED:'true',AZURE_CONTENT_SAFETY_ENDPOINT:'https://synthetic.cognitiveservices.azure.com',AZURE_CONTENT_SAFETY_KEY:'synthetic-not-a-real-key'};
export async function setupCommunity({reviewFetch=async()=>reviewResult(),reviewTimeoutMs=5000,subscribedFixtures=false}={}){
 const store=testDatabase(),env={DB:store.DB,AUTH_HMAC:'synthetic-community-secret-only-for-unit-tests',COMMUNITY_ADMIN_EMAILS:'admin@example.invalid',...syntheticReviewEnv};let clock=Date.UTC(2026,10,13,12);const api=createCommunityApi({now:()=>clock,reviewFetch,reviewTimeoutMs});
 async function call(path,method='GET',data,auth={},extra={}){const r=await api(new Request('https://study.test/api/community'+path,{method,headers:{origin:'https://study.test','content-type':'application/json',...(auth.cookie?{cookie:auth.cookie}:{}),...(auth.csrf?{'x-csrf-token':auth.csrf}:{}),...extra},body:data===undefined?undefined:JSON.stringify(data)}),env,true);return {status:r.status,...await r.json()};}
 async function user(name,google=true){const id=crypto.randomUUID(),address=name+'@example.invalid';store.db.prepare('INSERT INTO accounts(id,email,google_sub,created_at) VALUES(?,?,?,?)').run(id,address,google?'synthetic-'+id:null,clock);const session=await issueSession(new Request('https://study.test'),env,{id},clock),auth={cookie:session.cookie.split(';')[0],csrf:session.csrf};const saved=await call('/profile','PUT',{nickname:name,publicRanking:false,accepted:true},auth);if(google)assert.equal(saved.status,200,JSON.stringify(saved));const profile=store.db.prepare('SELECT id FROM community_profiles WHERE account_id=?').get(id);const u={id,profileId:profile?.id,...auth};if(subscribedFixtures&&google)subscribe(u);return u;}
 function subscribe(auth,{memberLimit=24,freeText=true,expiresAt=clock+365*86400000}={}){store.db.prepare('INSERT INTO community_entitlements(account_id,member_limit,free_text,expires_at,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(account_id) DO UPDATE SET member_limit=excluded.member_limit,free_text=excluded.free_text,expires_at=excluded.expires_at,updated_at=excluded.updated_at').run(auth.id,memberLimit,freeText?1:0,expiresAt,clock);}
 async function room(auth,visibility='private',capacity=subscribedFixtures?8:4){const id=crypto.randomUUID(),created=await call('/rooms','POST',{id,name:'Test quiet room',visibility,capacity,goalMinutes:120},auth);assert.equal(created.status,201,JSON.stringify(created));return {id,code:store.db.prepare('SELECT invite_token FROM community_rooms WHERE id=?').get(id).invite_token};}
 return {...store,env,call,user,room,subscribe,advance:n=>clock+=n,setTime:n=>clock=n,get now(){return clock;}};
}

// Historical review/accounting tests exercise subscriber paths with trusted synthetic grants.
export const setupSubscribedCommunity=options=>setupCommunity({...options,subscribedFixtures:true});
