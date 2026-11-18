import {duration} from './study-analysis.mjs';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function reviewExportData(review,{includeTasks=false,includeNotes=false}={}){return {...review,good:includeNotes?review.good:'',difficulty:includeNotes?review.difficulty:'',next:includeNotes?review.next:'',snapshot:{...review.snapshot,tasks:includeTasks?review.snapshot.tasks:[]}};}
export function reportLines(review,{includeTasks=false,includeNotes=false}={}){
 const s=review.snapshot,lines=[`StudyTimely | ${review.period==='month'?'Monthly':'Weekly'} review`,`${review.start} — ${review.end}`,`Time zone: ${review.zone}${review.subject?' | Subject: '+review.subject:''}${review.mode?' | Mode: '+review.mode:''}`,`Generated: ${new Date(review.generatedAt).toISOString()}`,'',`Recorded study: ${duration(s.total)}`,`Saved sessions: ${s.count} | Study days: ${s.activeDays}`,`Known task completions: ${s.completed??0}`,'','TIME BY SUBJECT'];
 for(const subject of s.subjects)lines.push(`${subject.name||'Unlabelled'}: ${duration(subject.seconds)} (${Math.round(subject.share*100)}%)`);
 lines.push('','OBSERVATIONS');for(const i of s.insights)lines.push(i.text);
 if(includeTasks){lines.push('','TASKS | estimates and lifetime recorded time');for(const t of s.tasks)lines.push(`${t.title}: ${t.estimateMinutes===null?'estimate unknown':t.estimateMinutes+' min planned'} | ${duration(t.actualSeconds)} recorded | ${t.done?'completed':'in progress'}`);if(s.taskCount>s.tasks.length)lines.push(`Showing ${s.tasks.length} of ${s.taskCount} tasks.`);}
 if(includeNotes)lines.push('','WHAT WENT WELL',review.good||'—','','WHAT WAS DIFFICULT',review.difficulty||'—','','NEXT STEP',review.next||'—');
 lines.push('','Saved learning intervals only; pauses and breaks excluded.','Task completion is self-reported. Recorded time does not prove mastery.');return lines;
}
export function summarySVG(review){const s=review.snapshot,max=Math.max(1,...s.series.map(d=>d.seconds)),series=s.series.length>31?s.series.filter((_,i)=>i%Math.ceil(s.series.length/31)===0):s.series;return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1000" viewBox="0 0 1200 1000"><rect width="1200" height="1000" rx="32" fill="#101210"/><g font-family="Arial,sans-serif" fill="#f3f1e9"><text x="64" y="88" font-size="28" font-weight="700">StudyTimely</text><text x="64" y="160" font-size="40">${review.period==='month'?'Monthly':'Weekly'} study review</text><text x="64" y="206" font-size="22" fill="#b7bcb4">${escape(review.start)} — ${escape(review.end)} · ${escape(review.zone)}</text><text x="64" y="320" font-size="72">${escape(duration(s.total))}</text><text x="64" y="365" font-size="22" fill="#b7bcb4">Recorded study · ${s.activeDays} study days · ${s.count} sessions</text><line x1="64" y1="420" x2="1136" y2="420" stroke="#363c34"/>${series.map((d,i)=>`<rect x="${70+i*1060/series.length}" y="${660-d.seconds/max*175}" width="${Math.max(2,1060/series.length-8)}" height="${Math.max(2,d.seconds/max*175)}" rx="4" fill="#b8d2a5"/>`).join('')}<text x="64" y="710" font-size="20" fill="#b7bcb4">${series.length<s.series.length?'Selected dates from the report':'Recorded time by day'}</text>${s.subjects.slice(0,4).map((p,i)=>`<text x="64" y="${765+i*42}" font-size="24">${escape(p.name||'Unlabelled')} · ${escape(duration(p.seconds))}</text>`).join('')}<text x="64" y="970" font-size="18" fill="#b7bcb4">Recorded time describes activity, not learning quality. studytimely.com</text></g></svg>`;}
function download(blob,filename){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export async function exportSummaryImage(review){
 const blob=new Blob([summarySVG(review)],{type:'image/svg+xml'}),url=URL.createObjectURL(blob);
 try{const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('The summary image could not be prepared.'));img.src=url;});const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1000;canvas.getContext('2d').drawImage(img,0,0);const png=await new Promise(r=>canvas.toBlob(r,'image/png'));if(!png)throw Error('Image export is unavailable in this browser.');download(png,`studytimely-summary-${review.start}.png`);}finally{URL.revokeObjectURL(url);}
}
export function pdfFromImages(pages){
 // PDF image pages are generated locally. No report or reflection is uploaded.
 const encode=s=>new TextEncoder().encode(s),parts=[],offsets=[0];let size=0;
 const push=s=>{const bytes=typeof s==='string'?encode(s):s;parts.push(bytes);size+=bytes.length;};
 const object=(id,content)=>{offsets[id]=size;push(`${id} 0 obj\n`);push(content);push('\nendobj\n');};
 push('%PDF-1.4\n');object(1,'<< /Type /Catalog /Pages 2 0 R >>');object(2,`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] >>`);
 pages.forEach((p,i)=>{const id=3+i*3;object(id,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im ${id+1} 0 R >> >> /Contents ${id+2} 0 R >>`);offsets[id+1]=size;push(`${id+1} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${p.width} /Height ${p.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.bytes.length} >>\nstream\n`);push(p.bytes);push('\nendstream\nendobj\n');const stream='q 595 0 0 842 0 0 cm /Im Do Q\n';object(id+2,`<< /Length ${encode(stream).length} >>\nstream\n${stream}endstream`);});
 const xref=size;push(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);for(const off of offsets.slice(1))push(String(off).padStart(10,'0')+' 00000 n \n');push(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
 const out=new Uint8Array(size);let pos=0;for(const p of parts){out.set(p,pos);pos+=p.length;}return out;
}
export async function exportReviewPDF(review,options){
 await document.fonts?.ready;
 const canvas=document.createElement('canvas');canvas.width=1190;canvas.height=1684;const ctx=canvas.getContext('2d');if(!ctx)throw Error('PDF export is unavailable in this browser.');
 const pages=[];let y=90;function page(){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#192118';ctx.font='28px Inter, Arial, sans-serif';y=90;}
 async function finish(){ctx.fillStyle='#697364';ctx.font='20px Arial';ctx.fillText(`StudyTimely · ${pages.length+1}`,70,1630);const blob=await new Promise(r=>canvas.toBlob(r,'image/jpeg',.94));if(!blob)throw Error('PDF page could not be prepared.');pages.push({bytes:new Uint8Array(await blob.arrayBuffer()),width:1190,height:1684});page();}
 page();
 const values=review.snapshot.series,max=Math.max(1,...values.map(d=>d.seconds));ctx.font='bold 36px Inter, Arial';ctx.fillText('Your learning rhythm',70,105);ctx.font='24px Inter, Arial';ctx.fillStyle='#697364';ctx.fillText(review.start+' — '+review.end+' · '+review.zone,70,150);
 const width=1040/Math.max(1,values.length);values.forEach((d,i)=>{ctx.fillStyle='#83a86e';const height=d.seconds/max*180;ctx.fillRect(70+i*width,370-height,Math.max(2,width-7),height);});ctx.fillStyle='#192118';ctx.font='28px Inter, Arial, sans-serif';y=435;
 for(const line of reportLines(review,options)){
  let part='';for(const char of Array.from(line)){if(ctx.measureText(part+char).width>1040){if(y>1560)await finish();ctx.fillText(part,70,y);y+=42;part=char;}else part+=char;}
  if(y>1560)await finish();ctx.fillText(part,70,y);y+=42;
 }
 await finish();download(new Blob([pdfFromImages(pages)],{type:'application/pdf'}),`studytimely-${review.period}-review-${review.start}.pdf`);
}
