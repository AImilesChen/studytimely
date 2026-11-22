import {detailedFacts,detailedContent,detailedEvidence} from './ai-weekly-v2-contract.mjs';
// Deliberately small, provider-neutral contract. No notes, task text or raw sessions.
export const WEEKLY_AI_VERSION=1;
export const WEEKLY_AI_MAX_OUTPUT=1600;
const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;
const fail=()=>{throw Error('Invalid weekly report data.');};
const number=(v,max=1000000000)=>Number.isFinite(v)&&v>=0&&v<=max?v:fail();
const integer=(v,max=1000000)=>Number.isSafeInteger(v)&&v>=0&&v<=max?v:fail();
const text=(v,max)=>typeof v==='string'&&v.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)?v:fail();
export function weeklyFacts(input){
 if(input?.version===2)return detailedFacts(input,weeklyFacts({...input,version:1}));
 if(!input||input.version!==1||!date(input.start)||!date(input.end)||input.start>input.end||typeof input.partial!=='boolean'||typeof input.shareNames!=='boolean')fail();
 const span=Math.round((Date.parse(input.end)-Date.parse(input.start))/86400000)+1;
 if(span<1||span>7||new Date(input.start+'T12:00:00Z').getUTCDay()!==1)fail();
 try{new Intl.DateTimeFormat('en',{timeZone:input.zone});}catch{fail();}
 const days=input.days;if(!Array.isArray(days)||days.length!==span||days.some((d,i)=>!date(d.date)||Date.parse(d.date)!==Date.parse(input.start)+i*86400000))fail();
 const rows=days.map(d=>({date:d.date,seconds:number(d.seconds,172800)}));
 const seconds=number(input.seconds,604800);if(Math.abs(rows.reduce((n,d)=>n+d.seconds,0)-seconds)>.01)fail();
 if(!Array.isArray(input.subjects)||input.subjects.length>50)fail();
 const subjects=input.subjects.map((s,i)=>({id:'subject-'+i,name:input.shareNames?text(s.name,40):'Subject '+(i+1),seconds:number(s.seconds,604800)}));
 if(Math.abs(subjects.reduce((n,s)=>n+s.seconds,0)-seconds)>.01)fail();
 const previous=input.previous;
 if(previous&&(!date(previous.start)||!date(previous.end)||previous.start>=input.start||Date.parse(previous.start)!==Date.parse(input.start)-7*86400000||Date.parse(previous.end)!==Date.parse(input.end)-7*86400000))fail();
 const activeDays=rows.filter(d=>d.seconds>0).length,count=integer(input.count,50000);if(seconds>0&&!count||seconds===0&&count)fail();
 const goals=input.goals?{eligible:integer(input.goals.eligible,7),reached:integer(input.goals.reached,7)}:null;if(goals&&goals.reached>goals.eligible)fail();
 const estimates=input.estimates?{count:integer(input.estimates.count,5000),plannedMinutes:number(input.estimates.plannedMinutes,50000000),actualSeconds:number(input.estimates.actualSeconds,500000000)}:null;
 return {version:1,start:input.start,end:input.end,zone:text(input.zone,100),partial:input.partial,cutoffAt:number(input.cutoffAt,1e14),
  shareNames:input.shareNames===true,filter:{subject:input.filter?.subject==='selected'?'selected':'all',mode:['study','focus','pomodoro'].includes(input.filter?.mode)?input.filter.mode:'all'},
  seconds,count,activeDays,days:rows,subjects,completed:integer(input.completed,5000),unknownCompletions:integer(input.unknownCompletions,5000),
  planned:integer(input.planned,5000),completedPlanned:integer(input.completedPlanned,5000),overdue:integer(input.overdue,5000),goals,estimates,
  previous:previous?{start:previous.start,end:previous.end,seconds:number(previous.seconds,604800),activeDays:integer(previous.activeDays,7),count:integer(previous.count,50000)}:null};
}
export function weeklyEvidence(f){
 if(f.version===2)return detailedEvidence(f);
 return {total:'Saved study: '+Math.round(f.seconds/60)+' minutes in '+f.count+' sessions across '+f.activeDays+' days.',
  days:f.days.map(d=>d.date+': '+Math.round(d.seconds/60)+' saved minutes').join('; '),
  tasks:f.completed+' dated task completions; '+f.planned+' tasks planned in this period; '+f.completedPlanned+' of those completed in this period; '+f.overdue+' unfinished tasks with an earlier deadline. Unknown completion dates: '+f.unknownCompletions+'.',
  ...(f.previous?.count?{comparison:'Same-length previous period: '+Math.round(f.previous.seconds/60)+' saved minutes across '+f.previous.activeDays+' days.'}:{}),
  ...(f.goals?.eligible?{goals:f.goals.reached+' of '+f.goals.eligible+' days with known positive daily goals reached.'}:{}),
  ...(f.estimates?.count?{estimates:f.estimates.count+' completed tasks with known initial estimates: '+f.estimates.plannedMinutes+' estimated minutes versus '+Math.round(f.estimates.actualSeconds/60)+' lifetime recorded minutes through cutoff. Not a measure of learning quality.'}:{}),
  ...Object.fromEntries(f.subjects.map(s=>[s.id,s.name+': '+Math.round(s.seconds/60)+' saved minutes.']))};
}
export function weeklyDisplayEvidence(f){
 const evidence=weeklyEvidence(f);
 return {...evidence,days:f.activeDays+' of '+f.days.length+' dates have saved study; daily figures are available in Progress.',
  tasks:f.completed+' dated completions · '+f.planned+' planned tasks · '+f.overdue+' unfinished tasks with an earlier deadline'+(f.unknownCompletions?' · '+f.unknownCompletions+' completion dates unknown':'')+'.'};
}
export const WEEKLY_OUTPUT_SCHEMA={type:'object',additionalProperties:false,properties:{
 summary:{type:'string'},keep:{type:'array',maxItems:2,items:{$ref:'#/$defs/observation'}},adjust:{type:'array',maxItems:2,items:{$ref:'#/$defs/observation'}},
 actions:{type:'array',minItems:1,maxItems:3,items:{type:'object',additionalProperties:false,properties:{title:{type:'string'},why:{type:'string'},minutes:{type:'integer',minimum:5,maximum:120},evidence:{type:'array',minItems:1,maxItems:3,items:{type:'string'}}},required:['title','why','minutes','evidence']}}},
 required:['summary','keep','adjust','actions'],$defs:{observation:{type:'object',additionalProperties:false,properties:{text:{type:'string'},evidence:{type:'array',minItems:1,maxItems:3,items:{type:'string'}}},required:['text','evidence']}}};
export function weeklyContent(value,facts){
 if(facts.version===2)return detailedContent(value,facts);
 if(!value||!Array.isArray(value.keep)||!Array.isArray(value.adjust)||!Array.isArray(value.actions)||value.keep.length>2||value.adjust.length>2||!value.actions.length||value.actions.length>3)fail();
 const known=weeklyEvidence(facts),evidence=rows=>{if(!Array.isArray(rows)||!rows.length||rows.length>3||rows.some(k=>!Object.hasOwn(known,k)))fail();return [...new Set(rows)];};
 return {summary:text(value.summary,650),keep:value.keep.map(r=>({text:text(r.text,450),evidence:evidence(r.evidence)})),adjust:value.adjust.map(r=>({text:text(r.text,450),evidence:evidence(r.evidence)})),
  actions:value.actions.map(r=>{if(!r.title?.trim()||!Number.isInteger(r.minutes)||r.minutes<5||r.minutes>120)fail();return {title:text(r.title,140),why:text(r.why,450),minutes:r.minutes,evidence:evidence(r.evidence)};})};
}
export function validateSavedWeekly(value){
 if(!value||![1,2].includes(value.version)||typeof value.id!=='string'||!/^[a-f0-9-]{36}$/.test(value.id)||typeof value.hash!=='string'||!/^[a-f0-9]{64}$/.test(value.hash))fail();
 const facts=weeklyFacts(value.facts);if(facts.version!==value.version)fail();return {version:value.version,id:value.id,hash:value.hash,generatedAt:number(value.generatedAt,1e14),facts,content:weeklyContent(value.content,facts)};
}
