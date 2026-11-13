import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),project=path.resolve(root,'..');
const hash=b=>createHash('sha256').update(b).digest('hex');
async function files(dir){const out=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);out.push(...(e.isDirectory()?await files(p):[p]));}return out.sort();}
const source=[];
for(const p of ['src','server','scripts','tests'])source.push(...await files(path.join(root,p)));
for(const p of ['package.json','package-lock.json','vite.config.mjs','site.config.json','wrangler.jsonc','index.html'])source.push(path.join(root,p));
for(const p of ['privacy-policy.en.md','terms-of-use.en.md','cookies-and-local-storage.en.md'])source.push(path.join(project,'docs/compliance/v1.1',p));
async function inventory(list,base){return await Promise.all(list.sort().map(async file=>{const b=await fs.readFile(file);return{path:path.relative(base,file).replaceAll('\\','/'),bytes:b.length,sha256:hash(b)};}));}
const sources=await inventory(source,project),artifacts=await inventory([...await files(path.join(root,'dist/client')),path.join(root,'dist/cloudflare/worker.mjs')],path.join(root,'dist'));
const manifest={at:new Date().toISOString(),origin:'https://studytimely.com',environment:'production-candidate',gitCommit:process.env.RELEASE_COMMIT||null,sourceTreeSha256:hash(JSON.stringify(sources)),artifactTreeSha256:hash(JSON.stringify(artifacts)),sources,artifacts};
await fs.mkdir(path.join(project,'docs/development/evidence/v1.1'),{recursive:true});
await fs.writeFile(path.join(project,'docs/development/evidence/v1.1/build-manifest.json'),JSON.stringify(manifest,null,2));
console.log(JSON.stringify({sourceTreeSha256:manifest.sourceTreeSha256,artifactTreeSha256:manifest.artifactTreeSha256,sourceFiles:sources.length,artifactFiles:artifacts.length}));
