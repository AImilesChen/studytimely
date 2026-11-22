import {validateSavedWeekly} from './ai-weekly-contract.mjs';
import {weeklyReportFigures,weeklyReportOrigin,shortWeeklyEvidence} from './weekly-report-view.mjs';
import {duration} from './study-analysis.mjs';
import {pdfFromImages} from './report-export.mjs';
import {saveWeeklyFile} from './ai-weekly-export.mjs';
import {detailedReportSections,detailedCoverage} from './weekly-detailed-view.mjs';

// Reuse the site's existing on-device PDF writer; no popup, print dialog or upload.
// Canvas rasterizes browser fonts, including subject names unsupported by PDF base fonts.
export async function weeklyReportPDF(value,{createCanvas=()=>document.createElement('canvas'),fontsReady=()=>document.fonts?.ready}={}){
 const ai=validateSavedWeekly(value),f=ai.facts,v=weeklyReportFigures(f),origin=weeklyReportOrigin(ai);
 await fontsReady();
 const canvas=createCanvas();canvas.width=1190;canvas.height=1684;
 const c=canvas.getContext('2d');if(!c)throw Error('PDF export is unavailable in this browser. Use the HTML copy instead.');
 const pages=[],left=76,width=1038,bottom=1534;let y=80;
 const font=(size=27,bold=false)=>{c.font=`${bold?'700':'400'} ${size}px Arial, sans-serif`;};
 function page(){c.fillStyle='#fffaf2';c.fillRect(0,0,1190,1684);y=80;}
 async function finish(){
  c.fillStyle='#705146';font(19);c.fillText(`${origin.example?'EXAMPLE · NOT AI-GENERATED':'AI WEEKLY STUDY REPORT'} · ${v.rangeLabel}`,left,1595);c.fillText(`StudyTimely · ${pages.length+1}`,left,1630);
  const blob=await new Promise(r=>canvas.toBlob(r,'image/jpeg',.95));if(!blob)throw Error('A PDF page could not be prepared. Your saved report is unchanged.');
  pages.push({bytes:new Uint8Array(await blob.arrayBuffer()),width:1190,height:1684});page();
 }
 async function room(height){if(y+height>bottom)await finish();}
 function lines(text,maxWidth=width,size=27,bold=false){
  font(size,bold);const out=[];let part='';
  for(const char of Array.from(String(text))){
   if(char==='\n'){out.push(part);part='';continue;}
   if(c.measureText(part+char).width>maxWidth&&part){const split=part.lastIndexOf(' ');if(split>part.length/2){out.push(part.slice(0,split));part=part.slice(split+1)+char;}else{out.push(part);part=char;}}else part+=char;
  }
  out.push(part);return out;
 }
 async function text(value,{size=ai.version===2?24:27,bold=false,color='#30251f',lineHeight=ai.version===2?34:38,x=left,maxWidth=width}={}){
  const wrapped=lines(value,maxWidth,size,bold);if(wrapped.length*lineHeight<=bottom-80)await room(wrapped.length*lineHeight);
  for(const line of wrapped){await room(lineHeight);font(size,bold);c.fillStyle=color;c.fillText(line,x,y+size);y+=lineHeight;}
 }
 async function heading(label){await room(135);y+=16;await text(label,{size:ai.version===2?29:31,bold:true,lineHeight:ai.version===2?42:46});}
 page();
 await text('STUDYTIMELY · AI WEEKLY STUDY REPORT',{size:22,bold:true,color:'#b94b2d',lineHeight:36});
 await text(v.rangeLabel,{size:45,bold:true,lineHeight:64});
 await text(origin.badge,{size:23,bold:true,color:'#8b491f',lineHeight:35});
 await text(`${f.zone}${f.partial?' · Week so far':''} · ${f.filter.subject==='selected'?'Selected subject':'All subjects'} · ${f.filter.mode==='all'?'All study timers':f.filter.mode}`,{size:22,color:'#705146',lineHeight:32});
 y+=18;await room(115);c.fillStyle='#fbe5d6';c.fillRect(left,y,width,110);
 const metrics=[['Saved study',duration(f.seconds)],['Study days',`${f.activeDays} / ${f.days.length}`],['Saved sessions',String(f.count)]];
 metrics.forEach(([label,value],i)=>{const x=left+22+i*width/3;font(21);c.fillStyle='#705146';c.fillText(label,x,y+32);font(35,true);c.fillStyle='#30251f';c.fillText(value,x,y+82);});y+=132;
 await text(v.comparison,{size:22,color:'#705146',lineHeight:32});
 if(ai.version===1){await heading('Your week at a glance');await text(ai.content.summary);}
 if(ai.version===2)await text(detailedCoverage[ai.content.analysis_status]+' · Eight-part report',{size:22,color:'#8b491f',lineHeight:32});
 await heading('Daily saved time');await room(240);
 const max=Math.max(1,...v.days.map(d=>d.seconds)),step=width/v.days.length;
 v.days.forEach((d,i)=>{const x=left+i*step+14,h=d.seconds/max*125;font(20,true);c.fillStyle='#30251f';c.fillText(d.value,x,y+26);c.fillStyle=i%2?'#a87817':'#b94b2d';c.fillRect(x,y+166-h,step-34,h);font(21);c.fillStyle='#705146';c.fillText(d.label,x,y+201);font(18);c.fillText(d.date.slice(5),x,y+229);});y+=247;
 await heading('Time by subject');await text(f.shareNames?'Saved subject names':'Names kept private',{size:21,color:'#705146',lineHeight:30});
 for(const s of v.subjects){const wrapped=lines(s.name||'Unlabelled study',width-220,25);await room(wrapped.length*33+35);const rowTop=y;await text(s.name||'Unlabelled study',{size:25,lineHeight:33,maxWidth:width-220});font(25,true);c.fillStyle='#30251f';c.fillText(s.value,left+width-180,rowTop+25);c.fillStyle='#fbe5d6';c.fillRect(left,y+5,width,10);c.fillStyle='#b94b2d';c.fillRect(left,y+5,width*s.share/100,10);y+=32;}
 async function findings(label,rows,empty){
  await heading(label);
  if(!rows.length){await text(empty,{color:'#705146'});return;}
  for(const r of rows){await text(r.text);await text('Based on: '+r.evidence.map(k=>shortWeeklyEvidence(f,k)).join(' · '),{size:21,color:'#705146',lineHeight:31});y+=12;}
 }
 if(ai.version===2){
  async function table(t){
   if(!t?.rows.length)return;const col=width/t.headers.length;
   const totalHeight=[t.headers,...t.rows].reduce((sum,row)=>sum+Math.max(...row.map(v=>lines(v,col-22,21).length))*29+18,0);if(totalHeight<bottom-160)await room(totalHeight+15);
   async function row(values,bold=false){const wrapped=values.map(v=>lines(v,col-22,21,bold)),height=Math.max(...wrapped.map(r=>r.length))*29+18;await room(height);const top=y;c.fillStyle=bold?'#fbe5d6':'#fffaf2';c.fillRect(left,top,width,height);values.forEach((v,i)=>{font(21,bold);c.fillStyle='#30251f';wrapped[i].forEach((line,j)=>c.fillText(line,left+i*col+10,top+25+j*29));});y+=height;c.fillStyle='#dcc3b2';c.fillRect(left,y,width,1);}
   await room(140);await row(t.headers,true);for(const values of t.rows){const height=Math.max(...values.map(v=>lines(v,col-22,21).length))*29+18;if(y+height>bottom){await finish();await row(t.headers,true);}await row(values);}y+=15;
  }
  for(const [i,s]of detailedReportSections(ai).entries()){
   await heading(`${String(i+1).padStart(2,'0')} · ${s.title}`);
   if(s.notice)await text('Evidence limit: '+s.notice,{size:23,color:'#8b491f',lineHeight:34});
   for(const p of s.paragraphs||[])await text(p);
   await table(s.table);await table(s.extraTable);
   for(const r of s.findings||[]){const paragraphs=[r.observation,r.interpretation,'Limits: '+r.uncertainty,'Try next: '+r.recommendation,'Check next week: '+r.check_next_week],height=paragraphs.reduce((sum,p,i)=>sum+lines(p,width,24,i===0).length*34,0)+lines('Evidence: '+r.evidence_refs.join(', '),width,21).length*31+15;await room(height<bottom-80?height:120);await text(r.observation,{bold:true});await text(r.interpretation);await text('Limits: '+r.uncertainty);await text('Try next: '+r.recommendation);await text('Check next week: '+r.check_next_week);await text('Evidence: '+r.evidence_refs.join(', '),{size:21,color:'#705146',lineHeight:31});y+=15;}
   for(const list of s.lists||[]){if(!list.items.length)continue;await room(145);await text(list.title,{bold:true});for(const item of list.items)await text('• '+item);}
  }
 }else{
 await findings('Worth keeping',ai.content.keep,'Not enough recorded evidence for a stable practice yet.');
 await findings('Room to adjust',ai.content.adjust,'No specific adjustment supported by this snapshot.');
 await heading('Small steps for next week');
 for(const [i,a] of ai.content.actions.entries()){
  await room(105);await text(`${i+1}. ${a.title}`,{size:28,bold:true});await text(`Suggested estimate: ${a.minutes} min`,{size:23,color:'#8b491f',lineHeight:34});await text(a.why);y+=18;
 }
 }
 await heading('About this report');
 await text(`${origin.description} This is the same saved report shown on the website, including its charts, analysis and suggestions. Downloading does not generate new analysis or use a report allowance.`,{size:22,color:'#705146',lineHeight:32});
 if(ai.version===1)await text('Personal reflections and raw session/task details are not included. Saved time does not prove attention, grades or understanding. Review suggestions before adding them to your plans.',{size:22,color:'#705146',lineHeight:32});
 await text(`${origin.example?'Example prepared':'Generated'}: ${new Date(ai.generatedAt).toISOString()}`,{size:21,color:'#705146',lineHeight:32});
 await finish();return new Blob([pdfFromImages(pages)],{type:'application/pdf'});
}
export async function downloadWeeklyPDF(ai){
 const blob=await weeklyReportPDF(ai);saveWeeklyFile(blob,`studytimely-ai-weekly-${ai.facts.start}.pdf`);
}
