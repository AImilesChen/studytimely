import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {roomActivityNotice} from '../src/lib/room-activity-navigation.mjs';

const root=path.resolve(import.meta.dirname,'..'),dir=await fs.mkdtemp(path.join(root,'.wrangler/room-notice-ui-'));
const file=path.join(dir,'notice.mjs');
await build({stdin:{contents:"export {RoomActivityNotice} from './src/components/RoomActivityNotice.jsx';",resolveDir:root,loader:'jsx'},outfile:file,bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic',logLevel:'silent'});
const {RoomActivityNotice}=await import(pathToFileURL(file).href);
const render=props=>renderToStaticMarkup(createElement(RoomActivityNotice,props));

test('room shortcut is a compact entry, never a second timer, task form or automatic playback control',()=>{
 const now=Date.UTC(2026,10,20,18),activity={id:'one',title:'Maths focus',status:'running',startedAt:now-60000,focusMinutes:25,breakMinutes:5};
 const html=render({notice:roomActivityNotice([activity],{activity,own:{}},now)});
 assert.match(html,/Maths focus/);assert.match(html,/Enter activity/);
 assert.equal((html.match(/<button/g)||[]).length,1);
 assert.doesNotMatch(html,/role="timer"|<form|<input|<audio|Pause study|\d\d:\d\d:\d\d/);
});

test('result shortcut is explicit, and missing activities render no placeholder block',()=>{
 assert.equal(render({}), '');
 const html=render({notice:{id:'one',title:'Revision',state:'result',description:'Your activity has ended',label:'Add your result',action:'result'}});
 assert.match(html,/<button[^>]*>Add your result/);assert.match(html,/Study activity shortcut/);
 const error=render({error:'Unavailable'});assert.match(error,/View activities/);assert.doesNotMatch(error,/role="timer"/);
});

test.after(async()=>{assert.ok(path.resolve(dir).startsWith(path.join(root,'.wrangler','room-notice-ui-')));await fs.rm(dir,{recursive:true,force:true});});
