import fs from 'node:fs';
import path from 'node:path';
export function licensesPlugin(){return{name:'local-third-party-notices',generateBundle(_options,bundle){
 const roots=new Set([path.resolve('node_modules/@fontsource-variable/inter')]);
 for(const chunk of Object.values(bundle)){if(chunk.type!=='chunk')continue;for(const [raw,info] of Object.entries(chunk.modules)){if(!info.renderedLength)continue;const id=raw.replaceAll('\\','/'),at=id.lastIndexOf('/node_modules/');if(at<0)continue;const rest=id.slice(at+14),parts=rest.split('/'),name=parts[0].startsWith('@')?parts.slice(0,2).join('/'):parts[0];roots.add(id.slice(0,at+14)+name);}}
 const notices=[];for(const root of [...roots].sort()){try{const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));const files=fs.readdirSync(root).filter(f=>/^(licen[sc]e|copying)(\.|$)/i.test(f));const text=files.map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');notices.push(`${pkg.name} ${pkg.version} (${pkg.license||'see license'})\n${text||'See the upstream package for complete license terms.'}`);}catch{}}
 const vendor=path.resolve(process.cwd(),'src/vendor/web-vitals.LICENSE.txt');if(fs.existsSync(vendor))notices.push('web-vitals 5.1.0 (Apache-2.0)\n'+fs.readFileSync(vendor,'utf8'));
 this.emitFile({type:'asset',fileName:'THIRD-PARTY-NOTICES.txt',source:notices.join('\n\n'+'='.repeat(72)+'\n\n')});
}};}
