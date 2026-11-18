import test from 'node:test';
import assert from 'node:assert/strict';
import {syncContext,syncPresentation} from '../src/lib/sync-view.mjs';
const user={user:{syncAccountId:'account-a'}};
test('anonymous focus/reconnect remains local and never requests sync or another login check',async()=>{
 let checks=0;const result=await syncContext({read:async()=>({sync:{account:null,enabled:false}}),getAuth:()=>null,refreshAuth:async()=>checks++});
 assert.equal(result.skip,true);assert.equal(result.status,'local');assert.equal(checks,0);assert.equal(syncPresentation({authChecked:true,info:{account:null,enabled:false},status:'local'}).tone,'local');
});
test('paused accounts and held cloud generations never enter an automatic exchange',async()=>{
 for(const info of [{account:'account-a',enabled:false},{account:'account-a',enabled:true,held:{}}]){const result=await syncContext({read:async()=>({sync:info}),getAuth:()=>user,refreshAuth:async()=>assert.fail('should not refresh')});assert.equal(result.skip,true);assert.equal(result.status,info.held?'held':'paused');}
});
test('expired login switching to a guest workspace returns a normal local state',async()=>{
 let sync={account:'account-a',enabled:true},auth=null;const result=await syncContext({read:async()=>({sync}),getAuth:()=>auth,refreshAuth:async()=>{sync={account:null,enabled:false};}});assert.equal(result.skip,true);assert.equal(result.status,'local');
});
test('enabled matching identity is ready; an unresolved wrong-account identity is blocked',async()=>{
 const read=async()=>({sync:{account:'account-a',enabled:true}});assert.equal((await syncContext({read,getAuth:()=>user,refreshAuth:async()=>assert.fail()})).skip,false);
 await assert.rejects(syncContext({read,getAuth:()=>({user:{syncAccountId:'other'}}),refreshAuth:async()=>{}}),/Sign in/);
});
test('status presentation distinguishes actual errors, offline saves, conflicts, checking and temporary storage',()=>{
 const info={account:'account-a',enabled:true,lastSuccess:123};assert.equal(syncPresentation({info,status:'synced'}).tone,'synced');assert.equal(syncPresentation({info,status:'offline'}).tone,'pending');assert.equal(syncPresentation({info,status:'error',error:'Connection unavailable'}).tone,'warning');assert.equal(syncPresentation({info,authChecked:false}).label,'Checking account…');assert.equal(syncPresentation({info,temporary:true}).tone,'warning');assert.equal(syncPresentation({info,pendingLocal:true}).tone,'warning');assert.match(syncPresentation({info:{...info,conflicts:{a:{}}}}).label,/1 item needs review/);
});
