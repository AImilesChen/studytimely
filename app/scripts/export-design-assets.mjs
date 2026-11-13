import fs from 'node:fs/promises';
import path from 'node:path';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as Icons from '@phosphor-icons/react';
import {Resvg} from '@resvg/resvg-js';
import * as fontkit from 'fontkit';

// Export the actual licensed library assets used by the UI, never traced screenshots.
const root=path.resolve(import.meta.dirname,'../..');
const dest=path.join(root,'docs/design/assets');
const names=['BookOpen','Clock','Orange','Timer','Hourglass','Moon','Sun','GearSix','CornersOut','CornersIn','ArrowClockwise','X','ArrowRight','ChartBar','Check','SpeakerHigh','Trash','CaretDown','Bell','CalendarBlank','ListChecks'];
await fs.mkdir(path.join(dest,'icons'),{recursive:true});
for(const name of names){
 const svg=renderToStaticMarkup(React.createElement(Icons[name],{size:256,weight:'light',color:'currentColor','aria-hidden':undefined}));
 await fs.writeFile(path.join(dest,'icons',`${name}.svg`),svg);
}
const mark=renderToStaticMarkup(React.createElement(Icons.BookOpen,{size:256,weight:'regular',color:'#f0efe7'}));
await fs.writeFile(path.join(dest,'brand/mark-library-light.svg'),mark);
await fs.writeFile(path.join(dest,'brand/mark-library-dark.svg'),mark.replaceAll('#f0efe7','#262823'));
await fs.copyFile(path.join(root,'design-prototype/node_modules/@phosphor-icons/react/LICENSE'),path.join(dest,'licenses/Phosphor-MIT.txt'));
await fs.mkdir(path.join(root,'design-prototype/public/design-assets'),{recursive:true});
await fs.cp(path.join(dest,'icons'),path.join(root,'design-prototype/public/design-assets/icons'),{recursive:true});
const fontPath=path.join(root,'design-prototype/node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2');
const font=fontkit.create(await fs.readFile(fontPath)).getVariation({wght:550});
const run=font.layout('StudyTimely');
const scale=72/font.unitsPerEm;
const textWidth=run.positions.reduce((s,p)=>s+p.xAdvance,0)*scale;
const textPaths=(x,y,color)=>`<g fill="${color}" transform="translate(${x} ${y})"><g transform="scale(${scale} ${-scale})">${run.glyphs.map((g,i)=>{const x=run.positions.slice(0,i).reduce((s,p)=>s+p.xAdvance,0)+run.positions[i].xOffset;return `<path transform="translate(${x} ${run.positions[i].yOffset})" d="${g.path.toSVG()}"/>`;}).join('')}</g></g>`;
const markBody=mark.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
const svg=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const label=(text,x,y,size,color)=>{const r=font.layout(text),s=size/font.unitsPerEm;let at=0;return `<g fill="${color}" transform="translate(${x} ${y}) scale(${s} ${-s})">`+r.glyphs.map((g,i)=>{const p=r.positions[i],out=`<path transform="translate(${at+p.xOffset} ${p.yOffset})" d="${g.path.toSVG()}"/>`;at+=p.xAdvance;return out;}).join('')+'</g>';};
const markAt=(x,y,size,color)=>`<g transform="translate(${x} ${y}) scale(${size/256})" color="${color}" fill="${color}">${markBody.replaceAll('#f0efe7',color)}</g>`;
async function asset(name,source){await fs.writeFile(path.join(dest,'brand',name+'.svg'),source);const png=new Resvg(source,{fitTo:{mode:'width',value:Number(source.match(/width="([\d.]+)"/)[1])}}).render().asPng();await fs.writeFile(path.join(dest,'brand',name+'.png'),png);}
for(const [variant,color] of [['light','#f0efe7'],['dark','#262823']]){
 await asset('wordmark-'+variant,svg(Math.ceil(textWidth+32),108,textPaths(16,80,color)));
 await asset('logo-horizontal-'+variant,svg(Math.ceil(textWidth+146),128,markAt(10,16,96,color)+textPaths(130,88,color)));
 await asset('logo-stacked-'+variant,svg(Math.ceil(textWidth+48),248,markAt((textWidth+48-128)/2,12,128,color)+textPaths(24,218,color)));
}
const appIcon=svg(512,512,'<rect width="512" height="512" rx="112" fill="#101110"/>'+markAt(88,88,336,'#f0efe7'));
await asset('app-icon',appIcon);
for(const size of [16,32,48,180,192,512]){await fs.writeFile(path.join(dest,'brand',`icon-${size}.png`),new Resvg(appIcon,{fitTo:{mode:'width',value:size}}).render().asPng());}
// OG is a code-native composition of real UI tokens, not a fabricated product screenshot.
const og=svg(1200,630,'<rect width="1200" height="630" fill="#101110"/>'+markAt(58,44,58,'#f0efe7')+`<g transform="translate(132 48) scale(.5)">${textPaths(0,72,'#f0efe7')}</g>`+label('Free Online Study Timer',64,220,49,'#f0efe7')+label('Stay Focused. Track Your Progress.',66,268,24,'#b1b3ad')+[0,1,2].map((i)=>`<rect x="${66+i*361}" y="322" width="330" height="222" rx="25" fill="#20211f"/>`+label(i===1?'25':'00',126+i*361,487,164,'#f0efe7')+`<path d="M ${66+i*361} 433 H ${396+i*361}" stroke="#101110" stroke-width="3"/>`).join(''));
await asset('og-image',og);
await fs.copyFile(fontPath,path.join(root,'design-prototype/public/design-assets/inter-latin-wght-normal.woff2'));
await fs.copyFile(fontPath,path.join(dest,'Inter-latin-variable.woff2'));
await fs.cp(path.join(dest,'brand'),path.join(root,'design-prototype/public/design-assets/brand'),{recursive:true,filter:p=>!p.endsWith('logo-generated-original.png')});
console.log(`Exported ${names.length} licensed icons, outlined Inter lockups, application icon sizes and OG 1200x630.`);
