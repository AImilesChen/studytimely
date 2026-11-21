import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const result=await build({stdin:{contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {StudyCenter} from './src/components/StudyCenter.jsx';import {StudyCenterCommunity} from './src/components/StudyCenterCommunity.jsx';import {CommunityPreferences} from './src/components/CommunityPreferences.jsx';import {SyncCenter} from './src/components/SyncCenter.jsx';import {emptyState} from './src/lib/model.mjs';export function community(mode){return renderToStaticMarkup(<StudyCenterCommunity mode={mode} auth={{user:{syncAccountId:"account-a",googleLinked:true},csrf:"test"}} loaded={true} navigate={()=>{}} onAccount={()=>{}}/>);}export function preferences(){return renderToStaticMarkup(<CommunityPreferences auth={{csrf:'test'}} profile={{id:'profile',nickname:'Learner',publicRanking:false,version:1}} blocks={[]} refresh={()=>{}} onProfile={()=>{}}/>);}export function center(){const store={data:emptyState('test'),ready:true,cloudSync:{info:{account:null,enabled:false},authChecked:true}};return renderToStaticMarkup(<StudyCenter store={store} now={0} navigate={()=>{}} onStart={()=>{}} loaded={true} settings={<div>SETTINGS_ONLY</div>}/>);}export function sync(info={account:null,enabled:false},status='local',error=''){const store={data:emptyState('test'),ready:true,cloudSync:{info,status,error,authChecked:true,pendingCount:0,auth:info.account?{user:{syncAccountId:info.account}}:null}};return renderToStaticMarkup(<SyncCenter store={store} confirm={()=>{}} onSignIn={()=>{}} signInReady={false}/>);}`,resolveDir:fileURLToPath(new URL('../',import.meta.url)),sourcefile:'sync-ui-check.jsx',loader:'jsx'},bundle:true,platform:'node',format:'cjs',jsx:'automatic',loader:{'.css':'empty'},write:false,logLevel:'silent'});
const bundle={exports:{}};new Function('require','module','exports',result.outputFiles[0].text)(createRequire(import.meta.url),bundle,bundle.exports);const ui=bundle.exports;
test('default account leads with today tasks, a single section navigation and an honest data source',()=>{
 const html=ui.center();for(const title of ['My Study Center','Today','Progress','My groups','Account &amp; data','What will you study today?','Your last seven days','Personal study saved in this browser'])assert.ok(html.includes(title),title);
 assert.ok(!html.includes('sc-sync-status'));assert.ok(!html.includes('Automatic sync off'));assert.equal((html.match(/class="sc-tab-emoji"/g)||[]).length,4);const header=html.match(/<header class="sc-heading">([\s\S]*?)<\/header>/)?.[1];assert.ok(header);assert.ok(!/<(?:button|a)\b/.test(header));
 assert.ok(!html.includes('SETTINGS_ONLY'));assert.ok(!html.includes('Historical backups'));assert.ok(!html.includes('Community preferences</summary>'));assert.ok(!html.includes('sc-bar-track'));assert.equal((html.match(/role="tablist"/g)||[]).length,1);assert.ok(html.includes('Loading this browser’s tasks'));
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

test('personal preferences expose the nickname, ranking choice and hidden-member state without disclosure',()=>{
 const html=ui.preferences();for(const text of ['Community nickname','Join public global leaderboards','Save preferences','No hidden members','private room names and your Google identity are not published'])assert.ok(html.includes(text),text);assert.ok(!html.includes('<details'));assert.ok(!html.includes('<summary'));assert.ok(html.includes('No unsaved preference changes'));
});

test('signed-in community sections survive the first render before the API data arrives',()=>{
 for(const mode of ['summary','rooms','preferences']){const html=ui.community(mode);assert.ok(html.includes('Loading your community details'),mode);assert.ok(!html.includes('Enter room'),mode);}
});
