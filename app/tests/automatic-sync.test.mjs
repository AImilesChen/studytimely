import {exchangeSync} from '../src/lib/sync-exchange.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {IDBFactory,IDBObjectStore} from 'fake-indexeddb';
import {automaticSyncMaintenance} from '../server/automatic-sync.mjs';
import {previewPreparation} from '../src/lib/exam-preparation-report.mjs';
import {createAccountsApi} from '../server/accounts.mjs';
import {emptyState,transition} from '../src/lib/model.mjs';
import {createRepository,backupOf} from '../src/lib/storage.mjs';
import {packDocument,unpackRecords,rebaseRecords,diffRecords,recoverySelection,recordKey,checkRecords,selectSyncBatch,applyRecords} from '../src/lib/cloud-sync.mjs';
function setup(){
 const db=new DatabaseSync(':memory:');for(const n of fs.readdirSync(new URL('../migrations/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort())db.exec(fs.readFileSync(new URL('../migrations/'+n,import.meta.url),'utf8'));
 const DB={prepare(sql){return{bind(...values){for(const value of values)if(typeof value==='string')assert.ok(Buffer.byteLength(value)<2000000,'D1 bound string exceeded 2 MB');const statement={sql,values,async first(){return db.prepare(sql).get(...values)||null;},async all(){return {results:db.prepare(sql).all(...values)};},async run(){const p=db.prepare(sql);if(p.columns().length)return {results:p.all(...values)};return {results:[],meta:p.run(...values)};}};return statement;}};},async batch(statements){db.exec('BEGIN');try{const out=[];for(const s of statements)out.push(await s.run());db.exec('COMMIT');return out;}catch(e){db.exec('ROLLBACK');throw e;}}};
 let at=Date.now();const api=createAccountsApi({now:()=>at,makeCode:()=>'123456'}),env={DB,AUTH_HMAC:'synthetic-sync-secret-not-a-real-production-key',EMAIL:{async send(){}}};
 const call=async(path,method='GET',data,auth={})=>api(new Request('https://study.test'+path,{method,headers:{origin:'https://study.test','content-type':'application/json',cookie:auth.cookie||'','x-csrf-token':auth.csrf||''},body:data===undefined?undefined:JSON.stringify(data)}),env);
 const login=async(email='sync@example.invalid')=>{await call('/api/auth/request-code','POST',{email,accepted:true});const r=await call('/api/auth/verify-code','POST',{email,code:'123456'});assert.equal(r.status,200);const a=await r.json();return{cookie:r.headers.get('set-cookie').split(';')[0],csrf:a.csrf,id:db.prepare('SELECT id FROM accounts WHERE email=?').get(email).id};};
 const json=async(path,method,data,auth)=>{const r=await call(path,method,data,auth),b=await r.json();assert.equal(r.status,200,JSON.stringify(b));return b;};
 return{db,env,call,json,login,advance:ms=>at+=ms,close:()=>db.close()};
}
async function device(s,auth){const r=createRepository({indexedDB:new IDBFactory()});await r.load();await r.switchAccount(auth.id);await s.json('/api/sync/enable','POST',{confirm:true},auth);const remote=await s.json('/api/sync/state','GET',undefined,auth);await r.configureSync({records:remote.changes,...remote},'cloud');return r;}
async function transfer(s,auth,repo){return exchangeSync({accountId:auth.id,local:(method,...args)=>repo[method](...args),request:async(path,options={})=>{const response=await s.call('/api/sync'+path,options.method||'GET',options.data,auth),data=await response.json();if(!response.ok)throw Object.assign(new Error(data.error.message),{status:response.status,code:data.error.code});return data;}});}
async function save(repo,title,id='task-one',patch={}){const state=await repo.read(),old=state.workspace.tasks.find(t=>t.id===id);return repo.command({type:'task-save',epoch:state.epoch,...old,title,...patch,...(old?{itemId:id,expectedUpdatedAt:old.updatedAt}:{})},{owner:'qa',id:old?crypto.randomUUID():id,now:Date.now()});}
test('record transport preserves advanced data, explicit zero goals and stable saved-session IDs',()=>{
 let state=transition(emptyState('e'),{type:'task-save',epoch:'e',title:'Maths'},{id:'t',owner:'qa',now:Date.now()}).state;
 const records=packDocument(backupOf(state)),copy=unpackRecords(records);assert.deepEqual(packDocument(copy),records);checkRecords(records);
 const cloud=structuredClone(records);cloud.meta.dailyGoal=30;const local=structuredClone(cloud);local.meta.dailyGoal=0;assert.equal(rebaseRecords(cloud,local,cloud).records.meta.dailyGoal,0);
});
test('field-aware merge combines different fields, exposes same-field conflicts and honours deletion',()=>{
 const base=packDocument(backupOf(emptyState('e'))),key=recordKey('workspace.tasks','t');base[key]={id:'t',title:'old',dueDate:'2026-12-01',updatedAt:1,deletedAt:0};
 const local=structuredClone(base),cloud=structuredClone(base);local[key].title='Laptop';cloud[key].dueDate='2026-12-02';assert.equal(Object.keys(rebaseRecords(base,local,cloud).conflicts).length,0);assert.equal(rebaseRecords(base,local,cloud).records[key].title,'Laptop');
 cloud[key].title='Phone';assert.ok(rebaseRecords(base,local,cloud).conflicts[key]);cloud[key].deletedAt=4;assert.equal(rebaseRecords(base,local,cloud).records[key].deletedAt,4);
});
test('local edit and durable outbox commit together; quota failure rolls back both and reload retains pending',async()=>{
 const r=createRepository({indexedDB:new IDBFactory()});await r.load();await r.switchAccount('account-qa');const base=packDocument(backupOf(await r.read()));await r.configureSync({records:base,generation:'g',version:1},'cloud');
 const original=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,key){if(key==='automatic-sync-v1')throw new DOMException('Quota','QuotaExceededError');return original.call(this,value,key);};
 try{await assert.rejects(save(r,'not committed'));}finally{IDBObjectStore.prototype.put=original;}
 assert.equal((await r.read()).workspace.tasks.length,0);assert.equal((await r.syncInfo()).sync.pending,null);
 await save(r,'Persisted');const pending=(await r.prepareSync()).sync.inflight;assert.ok(pending.changes['workspace.tasks:task-one']);assert.deepEqual((await r.prepareSync()).sync.inflight,pending);r.close();
});
test('account switch isolates guest and two accounts; old-tab intents cannot write the new workspace',async()=>{
 const r=createRepository({indexedDB:new IDBFactory()});await r.load();await save(r,'Guest');await r.switchAccount('account-a');assert.equal((await r.read()).workspace.tasks.length,0);await save(r,'A');const old=await r.read();await r.switchAccount('account-b');assert.equal((await r.read()).workspace.tasks.length,0);
 await assert.rejects(r.command({type:'goal',minutes:50,epoch:old.epoch},{id:'late',owner:'qa',now:Date.now()}));await save(r,'B');await r.switchAccount('account-a');assert.equal((await r.read()).workspace.tasks[0].title,'A');await r.switchAccount(null);assert.equal((await r.read()).workspace.tasks[0].title,'Guest');r.close();
});
test('two devices sync offline edits, merge different fields and hold one conflict while independent items sync',async()=>{
 const s=setup();let a,b;try{const auth=await s.login();a=await device(s,auth);b=await device(s,auth);await save(a,'Original');await transfer(s,auth,a);await transfer(s,auth,b);
 await save(a,'New title');await save(b,'Original','task-one',{dueDate:'2026-12-20'});await transfer(s,auth,a);await transfer(s,auth,b);await transfer(s,auth,b);await transfer(s,auth,a);
 assert.equal((await a.read()).workspace.tasks[0].dueDate,'2026-12-20');assert.equal((await b.read()).workspace.tasks[0].title,'New title');
 await save(a,'From A');await save(b,'From B');await transfer(s,auth,a);const conflict=await transfer(s,auth,b);assert.ok(conflict.sync.conflicts['workspace.tasks:task-one']);await save(b,'Independent','task-two');await transfer(s,auth,b);await transfer(s,auth,a);assert.ok((await a.read()).workspace.tasks.some(t=>t.id==='task-two'));
 await b.resolveSync('workspace.tasks:task-one','cloud');await transfer(s,auth,b);assert.equal((await b.read()).workspace.tasks[0].title,'From A');
 }finally{a?.close();b?.close();s.close();}
});
test('lost acknowledgement replays idempotently and does not erase an edit made during upload',async()=>{
 const s=setup();let a;try{const auth=await s.login();a=await device(s,auth);await save(a,'First');const batch=(await a.prepareSync()).sync.inflight;
 const one=await s.json('/api/sync/mutations','POST',batch,auth);await save(a,'Second');const replay=await s.json('/api/sync/mutations','POST',batch,auth);assert.equal(one.version,replay.version);assert.equal(replay.replayed,true);
 await transfer(s,auth,a);assert.equal((await a.read()).workspace.tasks[0].title,'Second');await transfer(s,auth,a);const remote=await s.json('/api/sync/state','GET',undefined,auth);assert.equal(remote.changes['workspace.tasks:task-one'].title,'Second');
 const changed=await s.call('/api/sync/mutations','POST',{...batch,changes:{}},auth);assert.equal(changed.status,409);
 }finally{a?.close();s.close();}
});
test('deletion wins against an offline edit, trash restores stable IDs and snapshots have verified content',async()=>{
 const s=setup();let a,b;try{const auth=await s.login();a=await device(s,auth);b=await device(s,auth);await save(a,'Recover me');await transfer(s,auth,a);await transfer(s,auth,b);await save(b,'Stale offline edit');const st=await a.read();await a.command({type:'workspace-delete',collection:'tasks',itemId:'task-one',epoch:st.epoch},{id:'del',owner:'qa',now:Date.now()});await transfer(s,auth,a);await transfer(s,auth,b);assert.ok((await b.read()).workspace.tasks[0].deletedAt);
 const trash=await s.json('/api/sync/deleted','GET',undefined,auth);assert.equal(trash.items[0].label,'Recover me');const saved=await s.json('/api/sync/deleted/item?key=workspace.tasks%3Atask-one','GET',undefined,auth);const restored=recoverySelection(packDocument(backupOf(await a.read())),saved.records,['workspace.tasks:task-one']);await a.restoreLocal(restored.records);await transfer(s,auth,a);assert.equal((await a.read()).workspace.tasks[0].id,'task-one');assert.equal((await a.read()).workspace.tasks[0].deletedAt,0);
 await s.json('/api/sync/backups','POST',{source:'Manual backup'},auth);const versions=await s.json('/api/sync/backups','GET',undefined,auth);assert.ok(versions.backups.length);const version=versions.backups[0];assert.ok((await s.json('/api/sync/backups/'+version.id,'GET',undefined,auth)).records.meta);
 s.db.prepare('UPDATE sync_backup_chunks SET document=? WHERE backup_id=?').run('corrupt',version.id);assert.equal((await s.call('/api/sync/backups/'+version.id,'GET',undefined,auth)).status,503);
 }finally{a?.close();b?.close();s.close();}
});
test('restore is CAS guarded, saves protective backup, fences old queues and old manual clients',async()=>{
 const s=setup();let a,b;try{const auth=await s.login();a=await device(s,auth);b=await device(s,auth);await save(a,'Cloud');await transfer(s,auth,a);await transfer(s,auth,b);await save(b,'Offline pending');const remote=await s.json('/api/sync/state','GET',undefined,auth);
 assert.equal((await s.call('/api/workspace','PUT',{version:0,document:backupOf(emptyState('e'))},auth)).status,409);
 const restored=await s.json('/api/sync/restore','POST',{confirm:'RESTORE',version:remote.version,generation:remote.generation,clear:true},auth);assert.notEqual(restored.generation,remote.generation);
 assert.equal((await s.call('/api/sync/restore','POST',{confirm:'RESTORE',version:remote.version,generation:remote.generation,clear:true},auth)).status,409);
 const held=await transfer(s,auth,b);assert.ok(held.sync.held);assert.equal(held.sync.enabled,false);assert.equal((await b.read()).workspace.tasks[0].title,'Offline pending');assert.equal((await s.json('/api/sync/state','GET',undefined,auth)).changes['workspace.tasks:task-one'],undefined);
 assert.ok((await s.json('/api/sync/backups','GET',undefined,auth)).backups.some(v=>v.source==='Before cloud clear'));
 }finally{a?.close();b?.close();s.close();}
});
test('active timer survives cloud pull unchanged and switches only after timer is finished',async()=>{
 const s=setup();let a,b;try{const auth=await s.login();a=await device(s,auth);b=await device(s,auth);const st=await b.read();await b.command({type:'start',mode:'study',epoch:st.epoch},{id:'running',owner:'qa',now:Date.now()});const timer=(await b.read()).timer;await save(a,'Remote');await transfer(s,auth,a);const wait=await transfer(s,auth,b);assert.equal(wait.sync.deferred,true);assert.deepEqual((await b.read()).timer,timer);await assert.rejects(b.switchAccount('different-account'),/timer/);await assert.rejects(b.configureSync({records:packDocument(backupOf(emptyState('e'))),version:1,generation:'g'},'cloud'),/timer/);
 }finally{a?.close();b?.close();s.close();}
});
test('sync APIs enforce owner, CSRF, origin, logout, device revocation and 30-day retention',async()=>{
 const s=setup();try{const auth=await s.login(),other=await s.login('other@example.invalid');await s.json('/api/sync/enable','POST',{confirm:true},auth);assert.equal((await s.call('/api/sync/state')).status,401);assert.equal((await s.call('/api/sync/enable','POST',{confirm:true},{cookie:auth.cookie})).status,403);assert.equal((await s.json('/api/sync/state','GET',undefined,other)).enabled,false);
 const first=(await s.json('/api/sync/devices','GET',undefined,auth)).devices;assert.equal(first.length,1);assert.equal(first[0].session_hash,undefined);await s.json('/api/sync/backups','POST',{source:'Manual backup'},auth);const version=(await s.json('/api/sync/backups','GET',undefined,auth)).backups[0];assert.equal((await s.call('/api/sync/backups/'+version.id,'GET',undefined,other)).status,404);
 s.advance(61000);const again=await s.login();await s.json('/api/sync/devices','GET',undefined,again);const devices=(await s.json('/api/sync/devices','GET',undefined,auth)).devices;assert.equal(devices.length,2);await s.json('/api/sync/devices/'+devices.find(d=>!d.current).id,'DELETE',{},auth);assert.equal((await s.call('/api/sync/state','GET',undefined,again)).status,401);
 s.advance(31*86400000);assert.equal((await s.call('/api/sync/state','GET',undefined,auth)).status,401);
 }finally{s.close();}
});

test('concurrent duplicate retry cannot overwrite a newer successful batch',async()=>{
 const s=setup();let a;try{const auth=await s.login();a=await device(s,auth);await save(a,'A');const batch=(await a.prepareSync()).sync.inflight,original=s.env.DB.batch;let count=0,release,ready;const gate=new Promise(r=>release=r),blocked=new Promise(r=>ready=r);
 s.env.DB.batch=async statements=>{if(statements[0].sql.startsWith('INSERT INTO sync_receipts')){count++;if(count===2){ready();await gate;}}return original(statements);};
 const first=s.call('/api/sync/mutations','POST',batch,auth),duplicate=s.call('/api/sync/mutations','POST',batch,auth);await blocked;assert.equal((await first).status,200);const remote=await s.json('/api/sync/state','GET',undefined,auth),value={...remote.changes['workspace.tasks:task-one'],title:'B'};
 await s.json('/api/sync/mutations','POST',{id:crypto.randomUUID(),generation:remote.generation,version:remote.version,changes:{'workspace.tasks:task-one':value}},auth);release();assert.equal((await duplicate).status,200);
 const after=await s.json('/api/sync/state','GET',undefined,auth);assert.equal(after.changes['workspace.tasks:task-one'].title,'B');assert.equal(after.version,3);
 }finally{a?.close();s.close();}
});
test('linked preparation recovery restores the complete valid plan and preserves preparation version2',()=>{
 const at=Date.now(),state=emptyState('prep'),date=new Date(at+14*86400000).toISOString().slice(0,10),draft={exam:{title:'Final',subject:'Maths',date},topics:[{title:'Algebra',minutes:40,confidence:'new'}],rounds:1,gapDays:2,mockMinutes:30,importance:'normal',windows:Array.from({length:7},(_,i)=>({weekday:i+1,start:1080,end:1260})),settings:{zone:'UTC',maxDailyMinutes:180}},preview=previewPreparation(state,draft,'exam-recover',at);
 const records=packDocument(backupOf(preview.data)),key=Object.keys(records).find(k=>k.startsWith('workspace.tasks:')),recovered=recoverySelection(packDocument(backupOf(emptyState('empty'))),records,[key]);
 const restored=unpackRecords(recovered.records);assert.equal(restored.workspace.planning.version,2);assert.equal(restored.workspace.planning.examPlans.length,1);assert.equal(restored.workspace.exams.length,1);assert.ok(restored.workspace.planning.rules.length>1);checkRecords(recovered.records);
});
test('large cloud backup is chunked below D1 row limits, previews and full restores without losing sessions',async()=>{
 const s=setup();try{const auth=await s.login();await s.json('/api/sync/enable','POST',{confirm:true},auth);let remote=await s.json('/api/sync/state','GET',undefined,auth);const data=backupOf(emptyState('large'));
 data.sessions=Array.from({length:9000},(_,i)=>({id:'saved-'+String(i).padStart(5,'0')+'x'.repeat(80),mode:'study',subject:'Maths',startedAt:1000+i*10000,endedAt:6000+i*10000,durationSeconds:5,status:'Completed',segments:[[1000+i*10000,6000+i*10000]]}));
 const records=packDocument(data);assert.ok(Buffer.byteLength(JSON.stringify(records))>2000000);checkRecords(records);
 await s.json('/api/sync/restore','POST',{confirm:'RESTORE',version:remote.version,generation:remote.generation,records},auth);await s.json('/api/sync/backups','POST',{source:'Manual backup'},auth);const saved=(await s.json('/api/sync/backups','GET',undefined,auth)).backups.find(b=>b.source==='Manual backup');const back=await s.json('/api/sync/backups/'+saved.id,'GET',undefined,auth);assert.equal(unpackRecords(back.records).sessions.length,9000);assert.ok(s.db.prepare('SELECT count(*) n FROM sync_backup_chunks WHERE backup_id=?').get(saved.id).n>1);
 }finally{s.close();}
});
test('restoring an already saved session repeatedly preserves its ID and cannot award community credit',async()=>{
 const s=setup();let a;try{const auth=await s.login();a=await device(s,auth);let st=await a.read(),at=Date.now();await a.command({type:'start',mode:'study',epoch:st.epoch},{id:'one-session',owner:'qa',now:at});await a.command({type:'finish',epoch:st.epoch},{id:'end-session',owner:'qa',now:at+30000});await transfer(s,auth,a);
 const original=packDocument(backupOf(await a.read())),id=(await a.read()).sessions[0].id;st=await a.read();await a.command({type:'delete',recordId:id,epoch:st.epoch},{id:'delete-session',owner:'qa',now:at+31000});await transfer(s,auth,a);
 const item=await s.json('/api/sync/deleted/item?key='+encodeURIComponent(recordKey('sessions',id)),'GET',undefined,auth),restore=recoverySelection(packDocument(backupOf(await a.read())),item.records,[recordKey('sessions',id)]);
 await a.restoreLocal(restore.records);await transfer(s,auth,a);await a.restoreLocal(restore.records);await transfer(s,auth,a);assert.equal((await a.read()).sessions.length,1);assert.equal((await a.read()).sessions[0].durationSeconds,30);assert.equal((await a.read()).sessions[0].id,id);assert.equal(s.db.prepare('SELECT count(*) n FROM community_daily').get().n,0);
 }finally{a?.close();s.close();}
});
test('clear browser data removes every cached account, local protection copy and pending queue while cloud remains',async()=>{
 const s=setup();let a;try{const auth=await s.login();a=await device(s,auth);await save(a,'Cloud safe');await transfer(s,auth,a);await a.switchAccount('other-account');await save(a,'Other local');await a.switchAccount(auth.id);await save(a,'Unsynced');const cleared=await a.wipe();assert.equal(cleared.sync.enabled,false);assert.equal(cleared.sync.pending,null);assert.equal(cleared.sync.backups.length,0);await a.switchAccount('other-account');assert.equal((await a.read()).workspace.tasks.length,0);assert.equal((await s.json('/api/sync/state','GET',undefined,auth)).changes['workspace.tasks:task-one'].title,'Cloud safe');
 }finally{a?.close();s.close();}
});
test('scheduled cleanup expires private backups, trash and receipts after 30 days',async()=>{
 const s=setup();let a;try{const auth=await s.login();a=await device(s,auth);await save(a,'Expired');await transfer(s,auth,a);const st=await a.read();await a.command({type:'workspace-delete',collection:'tasks',itemId:'task-one',epoch:st.epoch},{id:'del',owner:'qa',now:Date.now()});await transfer(s,auth,a);assert.ok(s.db.prepare('SELECT count(*) n FROM sync_trash').get().n);await automaticSyncMaintenance(s.env,Date.now()+31*86400000);for(const table of ['sync_trash','sync_trash_chunks','sync_backups','sync_backup_chunks','sync_receipts'])assert.equal(s.db.prepare('SELECT count(*) n FROM '+table).get().n,0);assert.ok(s.db.prepare('SELECT count(*) n FROM sync_records').get().n);
 }finally{a?.close();s.close();}
});

test('local restore rejects a stale preview or switched account instead of replacing new edits',async()=>{
 const r=createRepository({indexedDB:new IDBFactory()});await r.load();await r.switchAccount('account-a');await save(r,'Before');const snapshot=packDocument(backupOf(await r.read()));await save(r,'After');await assert.rejects(r.restoreLocal(snapshot,'Before recovery',{account:'account-a',records:snapshot}),/changed/);assert.equal((await r.read()).workspace.tasks[0].title,'After');await r.switchAccount('account-b');await assert.rejects(r.restoreLocal(snapshot,'Before recovery',{account:'account-a'}),/account changed/);r.close();
});
test('same-epoch writes from an older local client cannot be uploaded by the new coordinator',async()=>{
 const indexedDB=new IDBFactory(),r=createRepository({indexedDB});await r.load();await r.switchAccount('account-a');await r.configureSync({records:packDocument(backupOf(await r.read())),generation:'g',version:1},'cloud');
 const old=await r.read();old.revision++;old.dailyGoal=99;await new Promise((resolve,reject)=>{const request=indexedDB.open('studytimely',1);request.onsuccess=()=>{const db=request.result,tx=db.transaction('local-state','readwrite');tx.objectStore('local-state').put(old,'v1');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=reject;};});
 await assert.rejects(r.prepareSync(),e=>e.code==='UPDATE_REQUIRED');r.close();
});

test('large independent history drains in bounded batches while linked preparations stay atomic',()=>{
 const base=packDocument(backupOf(emptyState('e'))),large=structuredClone(base);
 for(let i=0;i<1100;i++){const id='history-'+i;large[recordKey('sessions',id)]={id,mode:'study',subject:'Maths',startedAt:1000+i*10000,endedAt:6000+i*10000,durationSeconds:5,status:'Completed',segments:[[1000+i*10000,6000+i*10000]]};}
 let cloud=base,batches=0;while(Object.keys(diffRecords(cloud,large)).length){const batch=selectSyncBatch(cloud,diffRecords(cloud,large));assert.ok(Object.keys(batch).length<=500);cloud=applyRecords(cloud,batch);batches++;assert.ok(batches<5);}assert.equal(batches,3);assert.equal(unpackRecords(cloud).sessions.length,1100);
});

test('account export includes private sync metadata without tokens and account deletion cascades recovery data',async()=>{
 const s=setup();let a;try{const auth=await s.login();a=await device(s,auth);await save(a,'Private task');await transfer(s,auth,a);await s.json('/api/sync/devices','GET',undefined,auth);const exported=await s.json('/api/account/export','GET',undefined,auth);assert.ok(exported.automaticSync.records['workspace.tasks:task-one']);assert.ok(exported.automaticSync.backups.length);assert.equal(exported.automaticSync.devices[0].session_hash,undefined);await s.json('/api/account','DELETE',{confirm:'DELETE'},auth);for(const table of ['sync_heads','sync_records','sync_receipts','sync_backups','sync_backup_chunks','sync_trash','sync_trash_chunks','sync_devices'])assert.equal(s.db.prepare('SELECT count(*) n FROM '+table).get().n,0);
 }finally{a?.close();s.close();}
});
