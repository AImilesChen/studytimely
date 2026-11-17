import test from 'node:test';
import assert from 'node:assert/strict';
import {createAccountStatus,accountNavigation} from '../src/lib/account-status.mjs';
test('account entry distinguishes unknown, anonymous and signed-in sessions without identity data',async()=>{
 const status=createAccountStatus(async()=>({user:{email:'private@example.invalid',csrf:'private'}}));
 assert.equal(accountNavigation(status.getSnapshot()).label,'Account');await status.refresh();
 assert.deepEqual(status.getSnapshot(),{status:'ready',signedIn:true});assert.equal(accountNavigation(status.getSnapshot()).label,'My Study Center');
 status.publish(false);assert.equal(accountNavigation(status.getSnapshot()).href,'/account?view=signin');assert.equal(status.getServerSnapshot().signedIn,null);
});
test('concurrent checks are coalesced and an old request cannot undo an explicit logout',async()=>{
 let done,calls=0;const status=createAccountStatus(()=>{calls++;return new Promise(resolve=>done=resolve);});
 const a=status.refresh(),b=status.refresh();assert.equal(a,b);await Promise.resolve();assert.equal(calls,1);
 status.publish(false);done({user:{id:'old-session'}});await a;assert.equal(status.getSnapshot().signedIn,false);
});
test('failed checks retain known login state and recover on retry; subscriptions stop after cleanup',async()=>{
 let fail=true,notifications=0;const status=createAccountStatus(async()=>{if(fail)throw Error('Offline');return{user:null};});
 const stop=status.subscribe(()=>notifications++);status.publish(true);await status.refresh(true);assert.equal(status.getSnapshot().status,'error');assert.equal(accountNavigation(status.getSnapshot()).label,'My Study Center');
 fail=false;await status.refresh(true);assert.equal(accountNavigation(status.getSnapshot()).label,'Sign in');stop();const before=notifications;status.publish(true);assert.equal(notifications,before);
});
