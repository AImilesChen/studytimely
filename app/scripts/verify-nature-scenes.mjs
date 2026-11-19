import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {FOCUS_SCENES,sceneImage,sceneKind,focusConfig,validateFocusDevice,emptyFocusDevice} from '../src/lib/focus-space.mjs';
const base=process.env.PREVIEW_ORIGIN||'http://127.0.0.1:4305';
const results=[];
for(const scene of FOCUS_SCENES){
 const path=sceneImage(scene.id),r=await fetch(base+path),body=Buffer.from(await r.arrayBuffer());
 assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/^image\/webp/);
 const source=await fs.readFile(new URL('../public'+path,import.meta.url));
 assert.deepEqual(body,source);assert.ok(body.length<800000);
 const config=focusConfig({scene:scene.id,mix:scene.mix}),doc=emptyFocusDevice();
 doc.presets=[{id:'reviewed',name:scene.name,config}];assert.equal(validateFocusDevice(doc).presets[0].config.scene,scene.id);
 results.push({id:scene.id,kind:sceneKind(scene.id),bytes:body.length,sha256:createHash('sha256').update(body).digest('hex')});
}
const page=await(await fetch(base+'/aesthetic-timer')).text();assert.ok(page.includes('/focus-scenes/mist-lake-generated-v1.webp'));
await fs.writeFile(new URL('../../docs/development/evidence/focus-nature-library-2026-11-19/http-scenes.json',import.meta.url),JSON.stringify({base,results},null,2));
console.log(`Verified ${results.length} scene HTTP responses, exact bytes and saved preset compatibility.`);
