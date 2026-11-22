import {ApiError,fail,body,result,digest} from './auth-shared.mjs';
import {packDocument,unpackRecords,checkRecords,applyRecords,SYNC_MAX_BYTES,SYNC_BATCH_BYTES,SYNC_RECORD_BYTES,canonical,validSyncKey,recoverySelection,recordLabel} from '../src/lib/cloud-sync.mjs';
import {emptyState} from '../src/lib/model.mjs';
import {backupOf} from '../src/lib/storage.mjs';
const DAY=86400000,encoder=new TextEncoder(),size=v=>encoder.encode(JSON.stringify(v)).length;
const idOK=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{8,100}$/.test(v);
export async function handleAutomaticSync({request,env,identity,sessionHash,at,limit}){
 const path=new URL(request.url).pathname.slice('/api/sync'.length),method=request.method,q=(sql,...args)=>env.DB.prepare(sql).bind(...args),account=identity.id;
 const head=()=>q('SELECT generation,version,bytes,updated_at FROM sync_heads WHERE account_id=?',account).first();
 const records=async()=>Object.fromEntries((await q('SELECT record_key,document FROM sync_records WHERE account_id=?',account).all()).results.filter(r=>r.document!=='null').map(r=>[r.record_key,JSON.parse(r.document)]));
 async function device(){
  await q('INSERT INTO sync_devices(id,account_id,session_hash,name,last_seen) VALUES(?,?,?,?,?) ON CONFLICT(session_hash) DO UPDATE SET last_seen=excluded.last_seen',crypto.randomUUID(),account,sessionHash,'StudyTimely browser',at).run();
 }
 async function backupStatements(data,source,id=crypto.randomUUID(),guard='1',args=[],replace=false){
  const document=JSON.stringify(data),checksum=await digest(document),parts=[];for(let i=0;i<document.length;i+=120000)parts.push(document.slice(i,i+120000));
  const statements=[q('INSERT INTO sync_backups(account_id,id,source,document,checksum,created_at) SELECT ?,?,?,?,?,? WHERE '+guard+' ON CONFLICT(account_id,id) '+(replace?'DO UPDATE SET checksum=excluded.checksum,created_at=excluded.created_at':'DO NOTHING'),account,id,source,'',checksum,at,...args)];
  if(replace)statements.push(q('DELETE FROM sync_backup_chunks WHERE account_id=? AND backup_id=? AND '+guard,account,id,...args));
  statements.push(...parts.map((part,i)=>q('INSERT INTO sync_backup_chunks(account_id,backup_id,position,document) SELECT ?,?,?,? WHERE '+guard+' AND EXISTS(SELECT 1 FROM sync_backups WHERE account_id=? AND id=? AND checksum=?) ON CONFLICT(account_id,backup_id,position) DO NOTHING',account,id,i,part,...args,account,id,checksum)));return statements;
 }
 async function prune(){await env.DB.batch([q('DELETE FROM sync_trash WHERE account_id=? AND record_key IN (SELECT record_key FROM (SELECT record_key,SUM(bytes) OVER(ORDER BY deleted_at DESC,record_key) AS total FROM sync_trash WHERE account_id=?) WHERE total>?)',account,account,16*1024*1024),q('DELETE FROM sync_trash WHERE account_id=? AND deleted_at<?',account,at-30*DAY),q('DELETE FROM sync_trash WHERE account_id=? AND record_key NOT IN (SELECT record_key FROM sync_trash WHERE account_id=? ORDER BY deleted_at DESC LIMIT 500)',account,account),q('DELETE FROM sync_backups WHERE account_id=? AND created_at<?',account,at-30*DAY),q('DELETE FROM sync_backups WHERE account_id=? AND id NOT IN (SELECT id FROM sync_backups WHERE account_id=? ORDER BY created_at DESC LIMIT 40)',account,account)]);}
 if(path==='/state'&&method==='GET'){
  const current=await head();if(!current)return result({enabled:false,accountId:account,protocol:1});
  await device();const url=new URL(request.url),since=Number(url.searchParams.get('since')||0),generation=url.searchParams.get('generation');
  if(!Number.isSafeInteger(since)||since<0)fail(400,'INVALID','Invalid sync cursor.');
  // A read batch provides a consistent head + changes under concurrent writers.
  const [h,rows]=await env.DB.batch([q('SELECT generation,version,bytes,updated_at FROM sync_heads WHERE account_id=?',account),q('SELECT record_key,document,revision FROM sync_records WHERE account_id=? AND (revision>? OR (SELECT generation FROM sync_heads WHERE account_id=?)<>?)',account,since,account,generation||'')]);
  const fresh=h.results?.[0]||current,reset=generation!==fresh.generation;
  // If a generation changed between the pre-read and batch, return a fresh full read.

  return result({enabled:true,accountId:account,protocol:1,generation:fresh.generation,version:fresh.version,updatedAt:fresh.updated_at,reset,changes:Object.fromEntries(rows.results.map(r=>[r.record_key,JSON.parse(r.document)])),limits:{workspaceBytes:SYNC_MAX_BYTES,backupDays:30,maxBackups:40}});
 }
 if(path==='/enable'&&method==='POST'){
  await limit('sync-enable',account,12,3600000);const input=await body(request);if(input.confirm!==true)fail(400,'CONSENT','Enable automatic sync explicitly.');
  let current=await head();if(current)return result({enabled:true,generation:current.generation,version:current.version});
  const legacy=await q('SELECT document FROM workspaces WHERE account_id=?',account).first();
  let initial;try{initial=packDocument(legacy?.document?JSON.parse(legacy.document):backupOf(emptyState('cloud')));checkRecords(initial);}catch{fail(400,'INVALID','The previous cloud backup needs review before migration. Download it first.');}
  const generation=crypto.randomUUID(),queries=[q('INSERT INTO sync_heads(account_id,generation,version,bytes,updated_at) VALUES(?,?,1,?,?) ON CONFLICT(account_id) DO NOTHING',account,generation,size(initial),at)];
  for(const [key,value]of Object.entries(initial))queries.push(q('INSERT INTO sync_records(account_id,record_key,document,revision) SELECT ?,?,?,1 WHERE EXISTS(SELECT 1 FROM sync_heads WHERE account_id=? AND generation=?) ON CONFLICT(account_id,record_key) DO NOTHING',account,key,JSON.stringify(value),account,generation));
  await env.DB.batch(queries);current=await head();await device();return result({enabled:true,generation:current.generation,version:current.version});
 }
 if(path==='/mutations'&&method==='POST'){
  await limit('sync-write',account,600,3600000);const input=await body(request,SYNC_BATCH_BYTES+4096);
  if(!idOK(input.id)||typeof input.generation!=='string'||!Number.isSafeInteger(input.version)||input.version<1||!input.changes||Array.isArray(input.changes)||Object.keys(input.changes).length>500)fail(400,'INVALID','Invalid sync batch.');
  if(Object.keys(input.changes).some(k=>!validSyncKey(k)))fail(400,'INVALID','Invalid sync record key.');
  const fingerprint=await digest(canonical(input));const receipt=await q('SELECT generation,version,fingerprint FROM sync_receipts WHERE account_id=? AND mutation_id=?',account,input.id).first();
  if(receipt){if(receipt.fingerprint!==fingerprint)fail(409,'MUTATION_REUSED','This operation ID was already used.');return result({accepted:true,generation:receipt.generation,version:receipt.version,replayed:true});}
  const current=await head();if(!current)fail(409,'NOT_ENABLED','Enable sync before uploading.');
  if(current.generation!==input.generation)fail(409,'GENERATION','Cloud data was restored or cleared. Review your saved local changes before uploading.');
  if(current.version!==input.version)fail(409,'CONFLICT','Another device saved changes. Pull and merge before retrying.');
  const before=await records();for(const [key,value] of Object.entries(input.changes)){if(key.startsWith('workspace.learning.reviews:')&&before[key]?.snapshot?.aiWeek&&value&&!value.deletedAt&&!value.snapshot?.aiWeek)fail(400,'UPDATE_REQUIRED','Update StudyTimely before changing a saved AI review. Its report has been preserved.');}const next=applyRecords(before,input.changes);let document;try{document=checkRecords(next);}catch(e){fail(400,e.code||'INVALID',e.message);}
  for(const [key,v]of Object.entries(input.changes))if(key.length>650||size(v)>SYNC_RECORD_BYTES)fail(413,'SYNC_LIMIT','An item is too large.');
  const version=current.version+1,receiptGuard='EXISTS(SELECT 1 FROM sync_receipts WHERE account_id=? AND mutation_id=? AND version=? AND fingerprint=?)',receiptArgs=[account,input.id,version,fingerprint],guard=receiptGuard+' AND EXISTS(SELECT 1 FROM sync_heads WHERE account_id=? AND generation=? AND version=?)',guardArgs=[...receiptArgs,account,current.generation,version];
  const statements=[q('INSERT INTO sync_receipts(account_id,mutation_id,generation,version,created_at,fingerprint) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM sync_heads WHERE account_id=? AND generation=? AND version=?) ON CONFLICT(account_id,mutation_id) DO NOTHING',account,input.id,current.generation,version,at,fingerprint,account,current.generation,current.version),q('UPDATE sync_heads SET version=?,bytes=?,updated_at=? WHERE account_id=? AND generation=? AND version=? AND '+receiptGuard,version,size(document),at,account,current.generation,current.version,...receiptArgs)];
  for(const [key,v]of Object.entries(input.changes))statements.push(q('INSERT INTO sync_records(account_id,record_key,document,revision) SELECT ?,?,?,? WHERE '+guard+' ON CONFLICT(account_id,record_key) DO UPDATE SET document=excluded.document,revision=excluded.revision',account,key,JSON.stringify(v),version,...guardArgs));
  statements.push(...await backupStatements(next,'Daily backup','daily-'+new Date(at).toISOString().slice(0,10),guard,guardArgs,true));
  if(Object.entries(input.changes).some(([k,v])=>before[k]&&(v===null||(!before[k].deletedAt&&v?.deletedAt))))statements.push(...await backupStatements(before,'Before deletion',crypto.randomUUID(),guard,guardArgs));
  for(const [key,value]of Object.entries(input.changes)){
   const deleted=before[key]&&(value===null||(!before[key].deletedAt&&value?.deletedAt));
   if(deleted&&!key.startsWith('deletedSessions:')&&key!=='meta'){
    const selected=recoverySelection(before,before,[key]),bundle=Object.fromEntries(selected.keys.map(k=>[k,before[k]]));
    const serialized=JSON.stringify(bundle);statements.push(q('INSERT INTO sync_trash(account_id,record_key,document,label,deleted_at,bytes) SELECT ?,?,?,?,?,? WHERE '+guard+' ON CONFLICT(account_id,record_key) DO UPDATE SET document=excluded.document,label=excluded.label,deleted_at=excluded.deleted_at,bytes=excluded.bytes',account,key,'',recordLabel(key,before[key]),at,size(bundle),...guardArgs),q('DELETE FROM sync_trash_chunks WHERE account_id=? AND record_key=? AND '+guard,account,key,...guardArgs));
    for(let i=0;i<serialized.length;i+=120000)statements.push(q('INSERT INTO sync_trash_chunks(account_id,record_key,position,document) SELECT ?,?,?,? WHERE '+guard,account,key,i/120000,serialized.slice(i,i+120000),...guardArgs));
   }else if(value&&!value.deletedAt)statements.push(q('DELETE FROM sync_trash WHERE account_id=? AND record_key=? AND '+guard,account,key,...guardArgs));
  }
  await env.DB.batch(statements);const saved=await q('SELECT version,fingerprint FROM sync_receipts WHERE account_id=? AND mutation_id=?',account,input.id).first();if(!saved)fail(409,'CONFLICT','Another device saved changes. Pull and merge before retrying.');if(saved.fingerprint!==fingerprint)fail(409,'MUTATION_REUSED','This operation ID was already used.');await prune();return result({accepted:true,generation:current.generation,version:saved.version});
 }
 if(path==='/backups'&&method==='GET'){
  await prune();const rows=(await q('SELECT id,source,checksum,created_at FROM sync_backups WHERE account_id=? ORDER BY created_at DESC',account).all()).results;return result({backups:rows.map(r=>({id:r.id,source:r.source,checksum:r.checksum,createdAt:r.created_at}))});
 }
 const backupMatch=path.match(/^\/backups\/([a-zA-Z0-9_-]+)$/);
 if(backupMatch&&method==='GET'){
  const row=await q('SELECT document,checksum,source,created_at FROM sync_backups WHERE account_id=? AND id=? AND created_at>=?',account,backupMatch[1],at-30*DAY).first();if(!row)fail(404,'NOT_FOUND','This backup is no longer available.');
const chunks=(await q('SELECT document FROM sync_backup_chunks WHERE account_id=? AND backup_id=? ORDER BY position',account,backupMatch[1]).all()).results.map(r=>r.document).join('');
  if(await digest(chunks)!==row.checksum)fail(503,'CHECKSUM','This backup failed its integrity check. It has not been restored.');const data=JSON.parse(chunks);try{checkRecords(data);}catch{fail(409,'UPDATE_REQUIRED','Update StudyTimely before restoring this version.');}return result({records:data,checksum:row.checksum,source:row.source,createdAt:row.created_at});
 }
 if(path==='/backups'&&method==='POST'){
  await limit('sync-backup',account,10,3600000);const input=await body(request);if(input.source!=='Manual backup')fail(400,'INVALID','Invalid backup source.');const data=await records();if(!data.meta)fail(409,'NOT_ENABLED','Enable sync first.');const statements=await backupStatements(data,'Manual backup');await env.DB.batch(statements);await prune();return result({saved:true});
 }
 if(path==='/restore'&&method==='POST'){
  await limit('sync-restore',account,8,3600000);const input=await body(request,6*1024*1024),current=await head();
  if(input.confirm!=='RESTORE'||!current||input.version!==current.version||input.generation!==current.generation)fail(409,'CONFLICT','Cloud data changed. Review the restore preview again.');
  let target;try{target=input.clear?packDocument(backupOf(emptyState('clear'))):input.records;checkRecords(target);}catch(e){fail(400,'INVALID',e.message);}
  const before=await records(),generation=crypto.randomUUID(),id=crypto.randomUUID(),old=JSON.stringify(before),guard='EXISTS(SELECT 1 FROM sync_heads WHERE account_id=? AND generation=?)';
  const statements=[q('UPDATE sync_heads SET generation=?,version=version+1,bytes=?,updated_at=? WHERE account_id=? AND generation=? AND version=?',generation,size(target),at,account,current.generation,current.version),...await backupStatements(before,input.clear?'Before cloud clear':'Before restore',id,guard,[account,generation]),q('DELETE FROM sync_records WHERE account_id=? AND '+guard,account,account,generation)];
  for(const [key,value]of Object.entries(target))statements.push(q('INSERT INTO sync_records(account_id,record_key,document,revision) SELECT ?,?,?,? WHERE '+guard,account,key,JSON.stringify(value),current.version+1,account,generation));
  await env.DB.batch(statements);if((await head()).generation!==generation)fail(409,'CONFLICT','Another device saved data. Review the restore again.');await prune();return result({restored:true,generation,version:current.version+1});
 }
 if(path==='/deleted'&&method==='GET'){await prune();return result({items:(await q('SELECT record_key,label,deleted_at FROM sync_trash WHERE account_id=? AND deleted_at>=? ORDER BY deleted_at DESC',account,at-30*DAY).all()).results.map(r=>({key:r.record_key,label:r.label,deletedAt:r.deleted_at}))});}
 if(path==='/deleted/item'&&method==='GET'){const key=new URL(request.url).searchParams.get('key');const row=await q('SELECT document FROM sync_trash WHERE account_id=? AND record_key=? AND deleted_at>=?',account,key,at-30*DAY).first();if(!row)fail(404,'NOT_FOUND','This deleted item is no longer available.');const data=(await q('SELECT document FROM sync_trash_chunks WHERE account_id=? AND record_key=? ORDER BY position',account,key).all()).results.map(r=>r.document).join('');return result({records:JSON.parse(data)});}
 if(path==='/devices'&&method==='GET'){await device();await q("INSERT INTO sync_devices(id,account_id,session_hash,name,last_seen) SELECT 'browser-'||lower(hex(randomblob(16))),account_id,token_hash,'Unlabelled browser',0 FROM sessions WHERE account_id=? AND expires_at>? AND token_hash NOT IN (SELECT session_hash FROM sync_devices)",account,at).run();return result({devices:(await q('SELECT id,name,last_seen,session_hash=? AS current FROM sync_devices WHERE account_id=? AND session_hash IN (SELECT token_hash FROM sessions WHERE expires_at>?) ORDER BY last_seen DESC',sessionHash,account,at).all()).results.map(r=>({id:r.id,name:r.name,lastSeen:r.last_seen,current:!!r.current}))});}
 const deviceMatch=path.match(/^\/devices\/([a-zA-Z0-9_-]+)$/);
 if(deviceMatch&&method==='PATCH'){const input=await body(request);if(typeof input.name!=='string'||!input.name.trim()||input.name.length>60)fail(400,'INVALID','Use a device name up to 60 characters.');await q('UPDATE sync_devices SET name=? WHERE account_id=? AND id=?',input.name.trim(),account,deviceMatch[1]).run();return result({saved:true});}
 if(deviceMatch&&method==='DELETE'){const row=await q('SELECT session_hash FROM sync_devices WHERE account_id=? AND id=?',account,deviceMatch[1]).first();if(!row)fail(404,'NOT_FOUND','This session is no longer available.');if(row.session_hash===sessionHash)fail(400,'CURRENT_DEVICE','Use Sign out for this browser.');await q('DELETE FROM sessions WHERE token_hash=? AND account_id=?',row.session_hash,account).run();return result({revoked:true});}
 fail(405,'METHOD','This sync action is not supported.');
}

export async function automaticSyncMaintenance(env,at=Date.now()){
 if(!env.DB)return;const q=(sql,...args)=>env.DB.prepare(sql).bind(...args);
 await env.DB.batch([q('DELETE FROM sync_backups WHERE created_at<?',at-30*86400000),q('DELETE FROM sync_trash WHERE deleted_at<?',at-30*86400000),q('DELETE FROM sync_receipts WHERE created_at<?',at-30*86400000)]);
}
