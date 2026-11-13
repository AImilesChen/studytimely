import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
export function testDatabase(){
 const db=new DatabaseSync(':memory:');let lastError=null;
 for(const name of fs.readdirSync(new URL('../../migrations/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort())db.exec(fs.readFileSync(new URL('../../migrations/'+name,import.meta.url),'utf8'));
 const DB={prepare(sql){return {bind(...values){const execute=method=>{try{return db.prepare(sql)[method](...values);}catch(e){lastError={sql,message:e.message};throw e;}};return {first:async()=>execute('get')||null,all:async()=>({results:execute('all')}),run:async()=>({meta:execute('run')})};}};},async batch(statements){db.exec('BEGIN');try{const out=[];for(const s of statements)out.push(await s.run());db.exec('COMMIT');return out;}catch(e){db.exec('ROLLBACK');throw e;}}};
 return {DB,db,get lastError(){return lastError;},close:()=>db.close()};
}
