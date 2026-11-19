import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
export async function verifyMusicLibrary(root){
 const folder=path.join(root,'public/music'),catalog=JSON.parse(await fs.readFile(path.join(folder,'catalog.json'),'utf8'));
 if(catalog.tracks.length!==25||catalog.tracks.filter(t=>t.plannedTier==='free').length!==5)throw Error('The reviewed music library must contain 25 recordings, including the original five free tracks.');
 const credits=await fs.readFile(path.join(folder,'CREDITS.txt'),'utf8'),license=await fs.readFile(path.join(folder,'CC-BY-4.0.pdf'));
 if(license.byteLength<10000||license.subarray(0,4).toString()!=='%PDF'||createHash('sha256').update(license).digest('hex')!==catalog.licenseDocument.sha256)throw Error('Missing music license text.');
 const seen=new Set();
 for(const t of catalog.tracks){
  if(seen.has(t.id)||!/^\/music\/[a-z0-9-]+\.[a-f0-9]{12}\.mp3$/.test(t.src)||t.license!=='CC BY 4.0'||new URL(t.source).hostname!=='incompetech.com')throw Error('Invalid reviewed music metadata.');
  seen.add(t.id);const audio=await fs.readFile(path.join(root,'public',t.src));
  const sha=createHash('sha256').update(audio).digest('hex');
  if(audio.byteLength!==t.bytes||sha!==t.sha256||!t.src.includes(sha.slice(0,12))||t.bytes>25*1024*1024)throw Error('Music bytes do not match the source manifest: '+t.id);
  if(!credits.includes(t.title)||!credits.includes(t.isrc)||!credits.includes(t.source))throw Error('Incomplete music attribution: '+t.id);
 }
 const natural=JSON.parse(await fs.readFile(path.join(root,'public/ambient/catalog.json'),'utf8')).sounds;
 const soundCredits=await fs.readFile(path.join(root,'public/ambient/CREDITS.txt'),'utf8');
 if(natural.length!==9||new Set(natural.map(s=>s.id)).size!==9)throw Error('The ambient library requires nine reviewed recordings.');
 for(const t of natural){
  if(t.license!=='CC0 1.0'||t.plannedTier!=='free'||new URL(t.source).hostname!=='freesound.org'||!/^\/ambient\/[a-z-]+\.[a-f0-9]{12}\.mp3$/.test(t.src))throw Error('Invalid field recording metadata.');
  const data=await fs.readFile(path.join(root,'public',t.src)),sha=createHash('sha256').update(data).digest('hex');
  if(data.length!==t.bytes||sha!==t.sha256||!t.src.includes(sha.slice(0,12))||data.length>1000000||!soundCredits.includes(t.title)||!soundCredits.includes(t.source))throw Error('Field recording integrity or credits mismatch: '+t.id);
 }
 return {tracks:catalog.tracks.length,fieldRecordings:natural.length,totalBytes:catalog.tracks.reduce((sum,t)=>sum+t.bytes,0)};
}
