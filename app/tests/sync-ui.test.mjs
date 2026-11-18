import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const result=await build({stdin:{contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {StudyCenter} from './src/components/StudyCenter.jsx';import {SyncCenter} from './src/components/SyncCenter.jsx';import {emptyState} from './src/lib/model.mjs';export function center(){const store={data:emptyState('test'),ready:true,cloudSync:{info:{account:null,enabled:false},authChecked:true}};return renderToStaticMarkup(<StudyCenter store={store} now={0} navigate={()=>{}} onStart={()=>{}} loaded={true} settings={<div>SETTINGS_ONLY</div>}/>);}export function sync(info={account:null,enabled:false},status='local',error=''){const store={data:emptyState('test'),ready:true,cloudSync:{info,status,error,authChecked:true,pendingCount:0,auth:info.account?{user:{syncAccountId:info.account}}:null}};return renderToStaticMarkup(<SyncCenter store={store} confirm={()=>{}} onSignIn={()=>{}} signInReady={false}/>);}`,resolveDir:fileURLToPath(new URL('../',import.meta.url)),sourcefile:'sync-ui-check.jsx',loader:'jsx'},bundle:true,platform:'node',format:'cjs',jsx:'automatic',loader:{'.css':'empty'},write:false,logLevel:'silent'});
const bundle={exports:{}};new Function('require','module','exports',result.outputFiles[0].text)(createRequire(import.meta.url),bundle,bundle.exports);const ui=bundle.exports;
test('default account keeps learning sections and shows compact data actions after the learning content',()=>{
 const html=ui.center();for(const title of ['My Study Center','Overview','My learning','Progress','Community','Settings','Your next tasks','Your last seven days','Recent study'])assert.ok(html.includes(title),title);
 assert.ok(html.indexOf('Your data')>html.indexOf('Recent study'));assert.ok(html.includes('Manage sync &amp; recovery'));assert.ok(!html.includes('SETTINGS_ONLY'));assert.ok(!html.includes('Historical backups'));assert.ok(!html.includes('Cloud synchronization is manual.'));
});
test('unconfigured sync has one backup download and a compact introduction, without vacant recovery columns',()=>{
 const html=ui.sync();assert.ok(html.includes('Saved on this device'));assert.ok(html.includes('sync-intro'));assert.ok(!html.includes('Historical backups'));assert.ok(!html.includes('sync-preview-panel'));assert.ok(!html.includes('role="alert"'));assert.equal((html.match(/>Download backup</g)||[]).length,1);
});
test('configured but empty recovery omits the blank preview panel until a version is selected',()=>{
 const html=ui.sync({account:'account-a',generation:'gen',enabled:true,lastSuccess:123},'synced');assert.ok(html.includes('Historical backups'));assert.ok(html.includes('is-browsing'));assert.ok(!html.includes('sync-preview-panel'));assert.ok(html.includes('All changes synced'));
});
test('real connection failures render a single actionable status without a duplicate warning banner',()=>{
 const html=ui.sync({account:'account-a',enabled:true},'error','Connection unavailable');assert.equal((html.match(/Connection unavailable/g)||[]).length,1);assert.ok(html.includes('Retry connection'));assert.ok(html.includes('sync-status-warning'));
});
