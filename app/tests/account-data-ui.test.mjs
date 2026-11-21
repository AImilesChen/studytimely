import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {metadata} from '../src/lib/site.mjs';
import {emptyState,transition} from '../src/lib/model.mjs';
import {backupOf} from '../src/lib/storage.mjs';
import {packDocument,recoveryChanges} from '../src/lib/cloud-sync.mjs';
const require=createRequire(import.meta.url),now=Date.now();
const result=await build({stdin:{contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {SyncCenter,RecoveryPreview} from './src/components/SyncCenter.jsx';import {LearningBackupTools} from './src/components/LearningBackupTools.jsx';import {DataGuideContent,DataGuidePage} from './src/components/DataGuideContent.jsx';export const sync=store=>renderToStaticMarkup(<SyncCenter store={store} confirm={()=>{}} onSignIn={()=>{}} signInReady/>);export const tools=store=>renderToStaticMarkup(<LearningBackupTools store={store}/>);export const guide=()=>renderToStaticMarkup(<DataGuideContent/>);export const publicGuide=()=>renderToStaticMarkup(<DataGuidePage/>);export const preview=p=>renderToStaticMarkup(<RecoveryPreview {...p}/>);`,resolveDir:fileURLToPath(new URL('../',import.meta.url)),loader:'jsx'},bundle:true,platform:'node',format:'cjs',external:['react','react-dom/server','react/jsx-runtime'],jsx:'automatic',loader:{'.css':'empty'},write:false,logLevel:'silent'});
const mod={exports:{}};new Function('require','module','exports',result.outputFiles[0].text)(require,mod,mod.exports);const ui=mod.exports;
function store(info={account:null,enabled:false}){return{data:emptyState('local'),ready:true,cloudSync:{info,status:'local',authChecked:true,auth:info.account?{user:{syncAccountId:info.account}}:null}};}

test('local data page has actual file controls and visible explanations instead of fake recovery menu entries',()=>{
 const html=ui.sync(store());for(const text of ['Saved on this device','Download learning backup','Choose backup file','Historical backups','Recently deleted','Sync browsers','No cloud workspace is connected','Signing in alone does not upload'])assert.ok(html.includes(text),text);
 assert.ok(!html.includes('<details'));assert.ok(!html.includes('sync-tabs'));assert.ok(!html.includes('Advanced preview'));assert.ok(!html.includes('sync-intro'));assert.equal((html.match(/>Download learning backup</g)||[]).length,1);
});
test('unfinished timers block the file merge while a downloadable backup remains available',()=>{
 const s=store();s.data.timer={status:'running',mode:'study',baseMs:1000};const html=ui.tools(s);
 assert.match(html,/<button[^>]*disabled=""[^>]*>Choose backup file/);assert.match(html,/<button(?![^>]*disabled)[^>]*>Download learning backup/);assert.ok(html.includes('Finish or reset the current timer'));
 s.memory=true;s.data.timer=null;assert.ok(ui.tools(s).includes('Use persistent browser storage before importing'));
});
test('cloud recovery distinguishes initial loading from empty records and does not offer a blank preview panel',()=>{
 const html=ui.sync(store({account:'account-a',enabled:true,generation:'generation'}));for(const text of ['Loading backups','Loading deleted','Loading devices','Create cloud backup'])assert.ok(html.includes(text),text);
 assert.ok(!html.includes('No retained deleted items'));assert.ok(!html.includes('No saved versions yet'));assert.ok(!html.includes('sync-preview-panel'));
});
test('a local protection copy is discoverable without enabling automatic sync',()=>{
 const info={account:null,enabled:false,backups:[{id:'local-copy',at:now,source:'Before import',records:packDocument(backupOf(emptyState('before')))}]};const html=ui.sync(store(info));assert.ok(html.includes('Before import'));assert.ok(html.includes('This browser'));assert.ok(html.includes('Preview version'));assert.ok(!html.includes('Create cloud backup'));
});
test('recovery preview shows actual affected records and keeps whole-workspace restore separate',()=>{
 const current=packDocument(backupOf(emptyState('local'))),state=transition(emptyState('file'),{type:'task-save',epoch:'file',title:'Read chapter'},{id:'task',owner:'qa',now}).state,records=packDocument(backupOf(state));
 const html=ui.preview({preview:{title:'Before recovery',date:now,records,current,changes:recoveryChanges(current,records),full:true},selected:['workspace.tasks:task'],setSelected(){},busy:false,canFullRestore:false,close(){},restoreSelected(){},restoreFull(){}});
 assert.ok(html.includes('Read chapter'));assert.ok(html.includes('Restore selected items'));assert.match(html,/<button[^>]*disabled=""[^>]*>Restore entire workspace/);assert.ok(html.includes('protective copy'));
});
test('account instructions stay visible and read-only while the public guide has independent search metadata',()=>{
 const guide=ui.guide();for(const text of ['Continue on another computer','Keep a file you can restore','Recover something you lost','An ordinary example','Does a backup contain my running timer?'])assert.ok(guide.includes(text),text);
 assert.ok(!/<(?:button|form|details)\b/.test(guide));assert.ok(guide.includes('/help/sync-and-backup'));
 const html=ui.publicGuide();assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.ok(html.includes('What StudyTimely saves and syncs'));assert.ok(html.includes('/privacy'));
 const config={origin:'https://studytimely.com',indexable:true},meta=metadata('/help/sync-and-backup',config);assert.equal(meta.robots,'index,follow');assert.equal(meta.schema['@type'],'Article');assert.equal(meta.breadcrumb['@type'],'BreadcrumbList');assert.equal(metadata('/account',config,'?view=settings').robots,'noindex,nofollow');
});
