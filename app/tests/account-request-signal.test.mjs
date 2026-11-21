import test from 'node:test';
import assert from 'node:assert/strict';
import {accountRequest} from '../src/lib/sync.mjs';

test('an aborted preview request stays uncertain and is never retried automatically',async()=>{
 const original=globalThis.fetch,controller=new AbortController();let calls=0;
 globalThis.fetch=async(_path,options)=>{calls++;assert.equal(options.signal,controller.signal);assert.equal(options.method,'POST');controller.abort();throw new DOMException('Aborted','AbortError');};
 try{await assert.rejects(accountRequest('/api/community/group-preview',{method:'POST',data:{enabled:true},signal:controller.signal}),e=>e.code==='REQUEST_TIMEOUT'&&/may have been saved/.test(e.message));assert.equal(calls,1);}finally{globalThis.fetch=original;}
});
