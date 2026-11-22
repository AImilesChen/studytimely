import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {ORIGINAL_SCENES,SCENE_CATEGORIES} from '../src/lib/original-scenes.mjs';
import {sceneImage,sceneThumbnail,sceneKind,focusConfig,sceneFor} from '../src/lib/focus-space.mjs';
import {libraryItem,sceneAssetPath} from '../src/lib/library-access.mjs';

test('the dated original collection has real verified full images and bounded public previews across six categories',async()=>{
 const manifest=JSON.parse(await fs.readFile(new URL('../../docs/development/wallpaper-assets-2026-11-22.json',import.meta.url),'utf8'));
 assert.equal(ORIGINAL_SCENES.length,12);assert.equal(manifest.assets.length,12);
 assert.deepEqual(new Set(ORIGINAL_SCENES.map(s=>s.category)),new Set(SCENE_CATEGORIES));
 for(const scene of ORIGINAL_SCENES){
  const row=manifest.assets.find(a=>a.id===scene.id);assert.ok(row,scene.id);
  assert.equal(row.src,sceneAssetPath(scene.id));assert.equal(row.thumbnail,sceneThumbnail(scene.id));
  for(const [path,hash] of [[row.src,row.sha256],[row.thumbnail,row.thumbnailSha256]]){
   const bytes=await fs.readFile(new URL('../public'+path,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);
   assert.equal(bytes.subarray(8,12).toString(),'WEBP');assert.ok(bytes.length<800000);
  }
  assert.equal(row.width/row.height,16/9);assert.ok(sceneImage(scene.id).startsWith('/library/full/'));
  assert.equal(libraryItem({allowed:false},'scene',scene.id).allowed,false);
  assert.equal(libraryItem({allowed:true,source:'subscription'},'scene',scene.id).allowed,true);
  assert.equal(libraryItem({allowed:true,expiresAt:10},'scene',scene.id,11).allowed,false);
  assert.equal(focusConfig({scene:scene.id,mix:scene.mix}).scene,scene.id);
  assert.equal(sceneKind(scene.id),scene.kind);
 }
 assert.equal(sceneFor('unsupported').id,'mist-lake');
});
