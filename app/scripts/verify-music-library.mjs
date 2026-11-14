import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
export async function verifyMusicLibrary(root){
 const folder=path.join(root,'public/music'),catalog=JSON.parse(await fs.readFile(path.join(folder,'catalog.json'),'utf8'));
 if(catalog.tracks.length!==5)throw Error('The reviewed music library must contain five recordings.');
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
 return {tracks:catalog.tracks.length,totalBytes:catalog.tracks.reduce((sum,t)=>sum+t.bytes,0)};
}
