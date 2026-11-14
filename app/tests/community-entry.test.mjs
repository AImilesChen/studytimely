import test from 'node:test';
import assert from 'node:assert/strict';
import {invitationCode,studyAgenda,saveCommunityEntry,readCommunityEntry,COMMUNITY_ENTRY_KEY} from '../src/lib/community-entry.mjs';
import {createWorker} from '../server/cloudflare.mjs';
import {metadata} from '../src/lib/site.mjs';

test('invitations accept codes and trusted links without forwarding arbitrary URLs',()=>{
 const code='safe_Invitation-Code12345';
 assert.equal(invitationCode(code),code);
 assert.equal(invitationCode('https://studytimely.com/study-groups?invite='+code),code);
 assert.equal(invitationCode('http://127.0.0.1:4200/study-groups?invite='+code,'http://127.0.0.1:4200'),code);
 for(const value of ['', 'short','https://studytimely.com.evil.test/study-groups?invite='+code,'https://evil.test/study-groups?invite='+code,'https://studytimely.com/account?invite='+code,'https://someone@studytimely.com/study-groups?invite='+code,'https://studytimely.com/study-groups?invite='+code+'&invite=second-value'])assert.throws(()=>invitationCode(value));
});
test('agenda durations are validated and all stages contribute to the displayed total',()=>{
 const agenda=studyAgenda({topic:'  Chemistry\nrevision  ',focusMinutes:'50',breakMinutes:'10'});
 assert.equal(agenda.title,'Chemistry revision');assert.equal(agenda.total,65);assert.match(agenda.text,/50 min/);assert.match(agenda.text,/10 min/);
 for(const input of [{focusMinutes:'2.5',breakMinutes:'5'},{focusMinutes:'0',breakMinutes:'5'},{focusMinutes:121,breakMinutes:5},{focusMinutes:25,breakMinutes:31},{focusMinutes:25,breakMinutes:0}])assert.throws(()=>studyAgenda({topic:'Revision',...input}));
 assert.throws(()=>studyAgenda({topic:' ',focusMinutes:25,breakMinutes:5}));
});
test('account return intent is short-lived, bounded and never creates a room',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 assert.equal(saveCommunityEntry(storage,{action:'create',topic:'Revision'},1000),true);
 assert.deepEqual(readCommunityEntry(storage,2000),{action:'create',topic:'Revision',expires:601000});
 assert.equal(readCommunityEntry(storage,601000),null);assert.equal(values.has(COMMUNITY_ENTRY_KEY),false);
 values.set(COMMUNITY_ENTRY_KEY,JSON.stringify({action:'redirect',expires:5000,url:'https://evil.test'}));assert.equal(readCommunityEntry(storage,2000),null);
 values.set(COMMUNITY_ENTRY_KEY,JSON.stringify({action:'join',expires:9999999999}));assert.equal(readCommunityEntry(storage,2000),null);
 const denied={setItem(){throw Error();},getItem(){throw Error();}};assert.equal(saveCommunityEntry(denied,{action:'join'}),false);assert.equal(readCommunityEntry(denied),null);
});
test('the public landing may index while invitation and room responses remain noindex',async()=>{
 const config={origin:'https://studytimely.com',indexable:true},worker=createWorker(config),env={ASSETS:{fetch:()=>new Response('public prerender only',{headers:{'content-type':'text/html'}})}};
 assert.equal(metadata('/study-groups',config).robots,'index,follow');
 assert.equal(metadata('/study-groups',{...config,indexable:false}).robots,'noindex,nofollow');
 assert.equal((await worker.fetch(new Request(config.origin+'/study-groups'),env)).headers.get('x-robots-tag'),null);
 for(const query of ['?room=private-room','?invite=private-code','?room=']){
  const response=await worker.fetch(new Request(config.origin+'/study-groups'+query),env);assert.match(response.headers.get('x-robots-tag'),/noindex/);assert.equal(response.headers.get('referrer-policy'),'no-referrer');
  assert.equal(response.headers.get('cache-control'),'no-store');
 }
});
