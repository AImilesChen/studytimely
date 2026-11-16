// Pure syllabus helpers shared by the interface and workspace commands.
const active=items=>(items||[]).filter(c=>!c.deletedAt);
export function syllabusLeaves(plan){const rows=active(plan?.chapters);return rows.filter(c=>!rows.some(x=>x.parentId===c.id));}
export function syllabusSummary(plan){const leaves=syllabusLeaves(plan);return {total:leaves.length,done:leaves.filter(c=>c.done).length,review:leaves.filter(c=>c.needsReview).length};}
export function topicTargetDate(plan,topic){return topic.targetDate||active(plan?.chapters).find(c=>c.id===topic.parentId)?.targetDate||'';}
export function topicSeconds(plan,topic,sessions){const ids=new Set([topic.id,...active(plan.chapters).filter(c=>c.parentId===topic.id).map(c=>c.id)]);return sessions.filter(s=>s.planId===plan.id&&ids.has(s.chapterId)).reduce((sum,s)=>sum+s.durationSeconds,0);}
export function nextSyllabusTopic(plan,sessions,today){
 const leaves=syllabusLeaves(plan),chosen=leaves.find(c=>c.id===plan?.nextChapterId&&(!c.done||c.needsReview));if(chosen)return {topic:chosen,reason:'Your selected next topic'};
 const due=leaves.filter(c=>!c.done&&topicTargetDate(plan,c)&&topicTargetDate(plan,c)<=today).sort((a,b)=>topicTargetDate(plan,a).localeCompare(topicTargetDate(plan,b)))[0];if(due)return {topic:due,reason:'Target date reached'};
 const review=leaves.find(c=>c.needsReview);if(review)return {topic:review,reason:'Marked for review'};
 const recent=sessions.filter(s=>s.planId===plan?.id&&leaves.some(c=>c.id===s.chapterId&&!c.done)).sort((a,b)=>b.endedAt-a.endedAt)[0];if(recent)return {topic:leaves.find(c=>c.id===recent.chapterId),reason:'Continue your last topic'};
 const first=leaves.find(c=>!c.done);return first?{topic:first,reason:'Next uncovered topic'}:null;
}
export function parseSyllabusOutline(input){
 if(typeof input!=='string'||input.length>100000)throw Error('Paste an outline of up to 100,000 characters.');
 const rows=[],warnings=[],lines=input.replaceAll('\r','').split('\n');let root=-1,childIndent=null;
 for(let i=0;i<lines.length;i++){
  const raw=lines[i];if(!raw.trim())continue;
  const indent=raw.match(/^\s*/)[0].replaceAll('\t','  ').length;
  const title=raw.trim().replace(/^(?:[-*•▪–]\s+|\d+[.)]\s+)/,'').trim();
  if(!title)continue;if(title.length>140)throw Error(`Line ${i+1}: use a topic name of 140 characters or fewer.`);
  if(rows.length>=1000)throw Error('Import up to 1,000 chapters and subtopics at a time.');
  let parentIndex=null;
  if(indent){if(root<0)warnings.push(`Line ${i+1}: no parent was found; shown as a chapter.`);else{parentIndex=root;if(childIndent===null)childIndent=indent;if(indent!==childIndent)warnings.push(`Line ${i+1}: indentation was flattened to one subtopic level. Check its parent.`);}}
  if(parentIndex===null){root=rows.length;childIndent=null;}
  rows.push({title,parentIndex,line:i+1});
 }
 return {rows,warnings};
}
export function materialiseOutline(rows,subject,makeId,now){const ids=rows.map(()=>makeId());return rows.map((r,i)=>({id:ids[i],title:r.title,subject,parentId:r.parentIndex===null?'':ids[r.parentIndex],targetDate:'',done:false,needsReview:false,updatedAt:now,deletedAt:0}));}
export function outlineDuplicates(rows,existing,subject){const seen=new Set(active(existing).filter(c=>c.subject===subject).map(c=>c.title.toLocaleLowerCase()));return rows.map(r=>{const key=r.title.toLocaleLowerCase(),duplicate=seen.has(key);seen.add(key);return duplicate;});}
export function losesSyllabusHistory(previous,incoming){const next=new Map((incoming?.workspace?.plans||[]).map(p=>[p.id,p]));return (previous?.workspace?.plans||[]).some(p=>p.syllabusVersion===2&&next.get(p.id)?.syllabusVersion!==2);}
