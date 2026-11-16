import {zoneOffset,zonedFormatter} from './time-zones.mjs';
import {syllabusLeaves,nextSyllabusTopic} from './syllabus.mjs';

const fail=message=>{throw Error(message);};
const txt=(v,max,optional=false)=>typeof v==='string'&&v.length<=max&&(optional||v.trim())?v.trim():fail('Check the exam text and try again.');
export function examDay(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number(value.slice(0,4))>0&&Number.isFinite(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;}
export function localExamDay(at){const d=new Date(at);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function wallCandidates(date,time,zone){
 if(!examDay(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))fail('Choose a valid exam date and time.');
 if(typeof zone!=='string'||zone.length>100)fail('Choose a valid IANA time zone.');
 try{new Intl.DateTimeFormat('en-US',{timeZone:zone}).format(0);}catch{fail('Choose a valid IANA time zone, such as Europe/London.');}
 const wall=Date.parse(date+'T'+time+':00Z'),offsets=new Set();
 for(let h=-48;h<=48;h+=6)offsets.add(zoneOffset(wall+h*3600000,zone));
 return [...offsets].map(offset=>wall-offset*60000).filter(at=>at+zoneOffset(at,zone)*60000===wall).sort((a,b)=>a-b);
}
const instants=new Map();
export function examInstant(exam){
 if(!exam.time)return null;
 const key=JSON.stringify([exam.date,exam.time,exam.zone,exam.fold||'']);if(instants.has(key))return instants.get(key);
 const candidates=wallCandidates(exam.date,exam.time,exam.zone);
 if(!candidates.length)fail('This time does not exist because the clocks move forward. Choose another time.');
 if(candidates.length>1&&!['earlier','later'].includes(exam.fold))fail('This time occurs twice when the clocks change. Choose the first or second occurrence.');
 const at=exam.fold==='later'?candidates.at(-1):candidates[0];if(instants.size>1000)instants.clear();instants.set(key,at);return at;
}
export function validateExam(x){
 if(!x||typeof x!=='object')fail('Invalid exam record.');
 const stamp=v=>Number.isFinite(v)&&v>=0&&v<=Date.now()+86400000?v:fail('Invalid exam update time.');
 if(!examDay(x.date))fail('Choose a valid exam date.');
 if(!['upcoming','taken'].includes(x.status||'upcoming')||typeof (x.archived??false)!=='boolean')fail('Invalid exam status.');
 if(!Array.isArray(x.topicIds||[])||(x.topicIds||[]).length>1000||new Set(x.topicIds||[]).size!==(x.topicIds||[]).length)fail('Invalid exam scope.');
 const exam={id:txt(x.id,160),title:txt(x.title,140),date:x.date,subject:txt(x.subject||'',40,true),planId:txt(x.planId||'',150,true),scope:x.scope||'all',topicIds:(x.topicIds||[]).map(id=>txt(id,150)),time:txt(x.time||'',5,true),zone:txt(x.zone||'',100,true),fold:txt(x.fold||'',7,true),location:txt(x.location||'',300,true),notes:txt(x.notes||'',2000,true),status:x.status||'upcoming',archived:x.archived??false,updatedAt:stamp(x.updatedAt),deletedAt:x.deletedAt?stamp(x.deletedAt):0};
 if(!['all','selected'].includes(exam.scope)||(!exam.planId&&(exam.scope!=='all'||exam.topicIds.length))||(exam.scope==='selected'&&!exam.topicIds.length)||(exam.scope==='all'&&exam.topicIds.length))fail('Select at least one topic, or use the whole syllabus.');
 if(!['','earlier','later'].includes(exam.fold))fail('Choose a supported clock-change occurrence.');
 if(exam.time)examInstant(exam);else if(exam.zone||exam.fold)fail('A time zone needs an exact exam time.');
 return exam;
}
export function migrateExams(input,plans){
 if(input.examVersion!==undefined&&input.examVersion!==1)fail('Update StudyTimely to read this exam format.');
 if(!Array.isArray(input.exams||[])||(input.exams||[]).length>500)fail('Keep no more than 500 exam records, including deletion markers.');
 const exams=(input.exams||[]).map(validateExam),ids=new Set(exams.map(e=>e.id));if(ids.size!==exams.length)fail('Duplicate exam record.');
 if(input.examVersion===undefined)for(const p of plans)if(!p.deletedAt&&p.examDate&&!ids.has('legacy:'+p.id))exams.push(validateExam({id:'legacy:'+p.id,title:p.title,date:p.examDate,subject:p.subjects.length===1?p.subjects[0]:'',planId:p.id,updatedAt:p.updatedAt}));
 if(exams.length>500)fail('Too many exam records.');return exams;
}
export function losesExamHistory(previous,incoming){return previous?.workspace?.examVersion===1&&(incoming?.workspace?.examVersion!==1||!Array.isArray(incoming.workspace.exams)||previous.workspace.exams.some(e=>!incoming.workspace.exams.some(n=>n.id===e.id)));}
export function examTiming(exam,now){
 const target=examInstant(exam),today=exam.time?zonedFormatter(exam.zone,{year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).reduce((v,p)=>(v[p.type]=p.value,v),{}):null;
 const day=today?`${today.year}-${today.month}-${today.day}`:localExamDay(now),days=Math.round((Date.parse(exam.date+'T12:00Z')-Date.parse(day+'T12:00Z'))/86400000);
 const past=target===null?days<0:now>=target;
 return {days,past,group:exam.archived?'archived':exam.status==='taken'?'taken':past?'past':days===0?'today':'upcoming',seconds:target===null?null:Math.max(0,Math.ceil((target-now)/1000)),at:target};
}
export function sortedExams(exams,now){const order=e=>examInstant(e)??Date.parse(e.date+'T00:00:00');return exams.filter(e=>!e.deletedAt).slice().sort((a,b)=>order(a)-order(b)||a.title.localeCompare(b.title)||a.id.localeCompare(b.id));}
export function nextExam(exams,planId,now){return sortedExams(exams||[],now).find(e=>e.planId===planId&&['upcoming','today'].includes(examTiming(e,now).group));}
export function examScope(exam,plans,sessions=[],today=''){
 const plan=plans.find(p=>p.id===exam.planId&&!p.deletedAt);
 if(!plan)return {plan:null,missingPlan:!!exam.planId,leaves:[],done:0,review:0,missing:0,next:null};
 const active=plan.chapters.filter(c=>!c.deletedAt),ids=new Set(exam.topicIds),leaves=syllabusLeaves(plan).filter(c=>exam.scope==='all'||ids.has(c.id)||ids.has(c.parentId));
 const scoped={...plan,chapters:active.filter(c=>leaves.some(l=>l.id===c.id||l.parentId===c.id)),nextChapterId:leaves.some(c=>c.id===plan.nextChapterId)?plan.nextChapterId:''};
 return {plan,leaves,done:leaves.filter(c=>c.done).length,review:leaves.filter(c=>c.needsReview).length,missing:exam.scope==='selected'?exam.topicIds.filter(id=>!active.some(c=>c.id===id)).length:0,next:leaves.length?nextSyllabusTopic(scoped,sessions,today):null};
}
const escapeICS=s=>String(s).replaceAll('\\','\\\\').replace(/\r\n|\r|\n/g,'\\n').replaceAll(';','\\;').replaceAll(',','\\,');
function foldICS(line){let out='',row='',length=0;for(const char of line){const bytes=new TextEncoder().encode(char).length;if(length+bytes>75){out+=row+'\r\n';row=' ';length=1;}row+=char;length+=bytes;}return out+row;}
const utc=at=>new Date(at).toISOString().replaceAll('-','').replaceAll(':','').replace(/\.\d{3}/,'');
export function examCalendar(raw){
 const e=validateExam(raw),at=examInstant(e),end=new Date(Date.parse(e.date+'T12:00Z')+86400000).toISOString().slice(0,10).replaceAll('-','');
 const description=[e.subject&&'Subject: '+e.subject,e.time&&`Exam time: ${e.date} ${e.time} (${e.zone}${e.fold?', '+e.fold+' occurrence':''})`,e.notes,'Entered by you in StudyTimely. Check the official timetable. Calendar reminders are managed in your calendar app.'].filter(Boolean).join('\n');
 return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//StudyTimely//Exam Countdown//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:${encodeURIComponent(e.id)}@studytimely.com`,`DTSTAMP:${utc(e.updatedAt)}`,`LAST-MODIFIED:${utc(e.updatedAt)}`,at===null?`DTSTART;VALUE=DATE:${e.date.replaceAll('-','')}`:`DTSTART:${utc(at)}`,...(at===null?[`DTEND;VALUE=DATE:${end}`]:[]),`SUMMARY:${escapeICS(e.title)}`,`DESCRIPTION:${escapeICS(description)}`,...(e.location?[`LOCATION:${escapeICS(e.location)}`]:[]),'END:VEVENT','END:VCALENDAR'].map(foldICS).join('\r\n')+'\r\n';
}
