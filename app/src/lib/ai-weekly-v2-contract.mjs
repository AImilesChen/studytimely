// Bounded, privacy-minimised detail contract shared by browser and Worker.
const bad=()=>{throw Error('Invalid detailed weekly report.');};
const n=(v,max=1000000)=>Number.isFinite(v)&&v>=0&&v<=max?v:bad();
const int=(v,max=100000)=>Number.isSafeInteger(v)&&v>=0&&v<=max?v:bad();
const s=(v,max=100)=>typeof v==='string'&&v.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)?v:bad();
const day=v=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v?v:bad();
const flag=v=>typeof v==='boolean'?v:bad();
const list=(v,max,fn)=>Array.isArray(v)&&v.length<=max?v.map(fn):bad();
const nullable=(v,fn=n)=>v===null?null:fn(v);
const same=(a,b)=>Math.abs(a-b)<.02;
export const DETAIL_SECTIONS=['goals_actual','allocation','execution','capacity','follow_up'];
export const DETAIL_TITLES={goals_actual:'Goals and the study you saved',allocation:'Subject time and upcoming priorities',execution:'Plan execution and estimate accuracy',capacity:'What fits in your next seven days',follow_up:'Follow-through and the longer view'};
export function detailedFacts(input,base){
 const d=input.detail;if(!d)bad();
 const subject=ref=>ref===null?null:base.subjects.some(x=>x.id===ref)?ref:bad();
 const target={minutes:nullable(d.target?.minutes,v=>n(v,10080)),changes:int(d.target?.changes,100),knownAtStart:flag(d.target?.knownAtStart)};
 if(target.knownAtStart!==(target.minutes!==null))bad();
 const baseline={known:flag(d.baseline?.known),planned:nullable(d.baseline?.planned,int),completed:nullable(d.baseline?.completed,int),added:int(d.baseline?.added),unknownCompletions:int(d.baseline?.unknownCompletions)};
 if(baseline.known!==(baseline.planned!==null&&baseline.completed!==null)||baseline.known&&baseline.completed>baseline.planned)bad();
 const pairs=list(d.pairs,12,p=>({ref:s(p.ref,20),subject:subject(p.subject),estimated:n(p.estimated,10080),actual:n(p.actual,500000000)}));
 if(pairs.some(p=>!/^T\d+$/.test(p.ref)||!p.estimated||!p.actual)||new Set(pairs.map(p=>p.ref)).size!==pairs.length)bad();
 const weeks=list(d.weeks,4,w=>({start:day(w.start),end:day(w.end),seconds:n(w.seconds,604800),count:int(w.count,50000),activeDays:int(w.activeDays,7),partial:flag(w.partial)}));
 if(weeks.length!==4||weeks.some((w,i)=>w.start>w.end||Date.parse(w.start)!==Date.parse(base.start)-(3-i)*7*86400000||Date.parse(w.end)!==Date.parse(base.end)-(3-i)*7*86400000||w.partial!==base.partial)||!same(weeks[3].seconds,base.seconds)||weeks[3].count!==base.count)bad();
 if(base.previous&&(!same(weeks[2].seconds,base.previous.seconds)||weeks[2].count!==base.previous.count))bad();
 const p=d.planning;if(!p)bad();try{new Intl.DateTimeFormat('en',{timeZone:p.zone});}catch{bad();}
 const tasks=list(p.tasks,40,t=>({ref:s(t.ref,20),subject:subject(t.subject),remaining:nullable(t.remaining,v=>n(v,10080)),deadline:t.deadline===''?'':day(t.deadline),priority:['high','normal','low'].includes(t.priority)?t.priority:bad()}));
 const taskRefs=new Set(tasks.map(t=>t.ref));if(taskRefs.size!==tasks.length||tasks.some(t=>!/^T\d+$/.test(t.ref)))bad();
 const tasksRef=ref=>taskRefs.has(ref)?ref:bad();
 const exams=list(p.exams,10,e=>({ref:s(e.ref,20),subject:subject(e.subject),date:day(e.date),timeKnown:flag(e.timeKnown)}));
 const capacityDays=list(p.days,7,r=>({date:day(r.date),capacity:n(r.capacity,1440),buffer:n(r.buffer,1440),free:n(r.free,1440)}));
 if(capacityDays.length!==7||capacityDays.some((r,i)=>Date.parse(r.date)!==Date.parse(p.start)+i*86400000||r.capacity>r.free+.02||r.buffer>r.free+.02))bad();
 const candidate=p.candidate===null?null:{id:'P1',scheduled:n(p.candidate.scheduled,10080),replacementCount:int(p.candidate.replacementCount,2000),keptCount:int(p.candidate.keptCount,2000),slots:list(p.candidate.slots,80,b=>({ref:tasksRef(b.ref),date:day(b.date),minutes:n(b.minutes,1440),startAt:n(b.startAt,1e14),endAt:n(b.endAt,1e14)})),unplaced:list(p.candidate.unplaced,40,u=>({ref:tasksRef(u.ref),minutes:nullable(u.minutes,v=>n(v,10080)),reason:s(u.reason,350),deadlineRisk:flag(u.deadlineRisk)}))};
 if(candidate){if(candidate.slots.some(b=>!b.minutes||b.endAt<=b.startAt||!same((b.endAt-b.startAt)/60000,b.minutes)||b.startAt<p.at||new Intl.DateTimeFormat('en-CA',{timeZone:p.zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(b.startAt))!==b.date))bad();if(p.candidate.id!=='P1'||!candidate.slots.length||!same(candidate.scheduled,candidate.slots.reduce((a,b)=>a+b.minutes,0)))bad();for(const r of capacityDays)if(candidate.slots.filter(b=>b.date===r.date).reduce((a,b)=>a+b.minutes,0)>r.capacity+.02)bad();if(candidate.slots.some(b=>!capacityDays.some(d=>d.date===b.date)))bad();const sorted=[...candidate.slots].sort((a,b)=>a.startAt-b.startAt);if(sorted.some((b,i)=>i&&b.startAt<sorted[i-1].endAt))bad();for(const t of tasks){const amount=candidate.slots.filter(b=>b.ref===t.ref).reduce((a,b)=>a+b.minutes,0);if(amount&&(t.remaining===null||amount>t.remaining+.02))bad();}}
 const planning={at:n(p.at,1e14),basis:s(p.basis,100),start:day(p.start),end:day(p.end),zone:s(p.zone),knownAvailability:flag(p.knownAvailability),tasks,exams,days:capacityDays,capacity:n(p.capacity,10080),buffer:n(p.buffer,10080),breakMinutes:int(p.breakMinutes,60),candidate,issue:s(p.issue||'',450)};
 if(!/^[a-f0-9:]+$/.test(planning.basis)||Date.parse(planning.end)!==Date.parse(planning.start)+6*86400000||!same(planning.capacity,capacityDays.reduce((a,b)=>a+b.capacity,0))||!same(planning.buffer,capacityDays.reduce((a,b)=>a+b.buffer,0)))bad();
 const follow=list(d.follow,8,r=>({ref:s(r.ref,20),subject:subject(r.subject),status:['completed','open','removed','unknown','undone'].includes(r.status)?r.status:bad(),remaining:nullable(r.remaining,v=>n(v,10080))}));
 if(follow.some(x=>!/^A\d+$/.test(x.ref))||new Set(follow.map(x=>x.ref)).size!==follow.length)bad();
 const sections={goals_actual:target.knownAtStart||weeks[2].count>0?'available':'limited',allocation:base.subjects.length&&exams.length?'available':'limited',execution:pairs.length||baseline.known?'available':'unavailable',capacity:planning.knownAvailability&&tasks.length&&tasks.some(t=>t.remaining!==null)?'available':'unavailable',follow_up:follow.length||weeks.filter(w=>w.count>0).length>1?'available':'unavailable'};
 const useful=Number(sections.execution==='available')+Number(sections.capacity==='available')+Number(sections.follow_up==='available');
 const depth=useful===0?'insufficient':useful>=2&&candidate?'full':'limited';
 const detail={target,baseline,pairs,weeks,planning,follow,coverage:{sections,depth}};
 if(JSON.stringify(detail).length>18000||new TextEncoder().encode(JSON.stringify({...base,detail})).length>22000)bad();return {...base,version:2,detail};
}
export function detailedEvidence(f){
 const d=f.detail,p=d.planning,known=p.tasks.filter(t=>t.remaining!==null),pairs=d.pairs;
 return {E01:`Saved study ${Math.round(f.seconds/60)} minutes; ${f.count} sessions; ${f.activeDays} study days. Daily totals: ${f.days.map(x=>x.date+':'+Math.round(x.seconds/60)).join(', ')}.`,
 E02:`Weekly target at period start: ${d.target.minutes===null?'unknown':d.target.minutes+' minutes'}. ${d.target.changes} in-period target changes. Do not treat a missing/changed target as a stable goal.`,
 E03:`Week-start baseline ${d.baseline.known?`${d.baseline.planned} planned and ${d.baseline.completed} dated completions`:'unknown'}. ${d.baseline.added} task additions in period; ${d.baseline.unknownCompletions} unknown completion dates.`,
 E04:`Subject allocation: ${f.subjects.map(x=>x.id+' '+x.name+' '+Math.round(x.seconds/60)+' minutes').join('; ')}. Allocation is not inherently balanced/imbalanced and does not identify weak knowledge.`,
 E05:`Completed matched task sample n=${pairs.length}: ${pairs.map(x=>`${x.ref}, subject=${x.subject||'not in current subject totals'}, initial=${x.estimated} minutes, lifetime recorded through cutoff=${Math.round(x.actual/60)} minutes`).join('; ')}. Excludes unknown estimates and unfinished work.`,
 E06:`Planning window ${p.start} to ${p.end}, ${p.zone}. Entered availability ${p.knownAvailability?'present':'missing'}. Available study capacity after configured breaks/buffer=${p.capacity} minutes; reserved buffer=${p.buffer}; preferred break=${p.breakMinutes} minutes. Known remaining task-list workload=${known.reduce((a,t)=>a+t.remaining,0)} minutes; known workload with a deadline by window end=${known.filter(t=>t.deadline&&t.deadline<=p.end).reduce((a,t)=>a+t.remaining,0)} minutes; ${p.tasks.length-known.length} tasks have unknown remaining work. Do not assume every task is due in this window; use the entered deadlines. Tasks=${JSON.stringify(p.tasks)}. Exams=${JSON.stringify(p.exams)}. Date-only exams exclude exam-day preparation. Candidate=${JSON.stringify(p.candidate)}. ${p.issue}`,
 E07:`Explicitly adopted previous-report task links through this report cutoff: ${JSON.stringify(d.follow)}. No links means no follow-through history, not no effort. Completion is not a causal benefit of AI.`,
 E08:`Comparable ${f.partial?'equal elapsed':'complete'} weekly windows: ${JSON.stringify(d.weeks)}. Totals describe recorded activity, not grades or attention.`};
}
export function detailedContent(value,f){
 const d=f.detail;if(value?.version!==2||value.scope_ref!==f.start+':'+f.end||value.analysis_status!==d.coverage.depth)bad();
 const evidence=rows=>{const out=list(rows,5,k=>Object.hasOwn(detailedEvidence(f),k)?k:bad());if(!out.length||new Set(out).size!==out.length)bad();return out;};
 const findings=list(value.findings,8,x=>({id:s(x.id,20),section_id:DETAIL_SECTIONS.includes(x.section_id)?x.section_id:bad(),observation:s(x.observation,700),evidence_refs:evidence(x.evidence_refs),interpretation:s(x.interpretation,900),uncertainty:s(x.uncertainty,600),recommendation:s(x.recommendation,700),check_next_week:s(x.check_next_week,600)}));
 if(findings.some(x=>!/^F\d+$/.test(x.id)||['observation','interpretation','uncertainty','recommendation','check_next_week'].some(k=>!x[k].trim()))||new Set(findings.map(x=>x.id)).size!==findings.length)bad();
 const ids=new Set(findings.map(x=>x.id)),id=k=>ids.has(k)?k:bad();
 const overview={headline:s(value.overview?.headline,180),summary:s(value.overview?.summary,1000),priority_ids:list(value.overview?.priority_ids,3,id)};
 if(!overview.headline.trim()||!overview.summary.trim()||!overview.priority_ids.length||new Set(overview.priority_ids).size!==overview.priority_ids.length)bad();
 const sections=list(value.sections,5,x=>({id:DETAIL_SECTIONS.includes(x.id)?x.id:bad(),status:d.coverage.sections[x.id],finding_ids:list(x.finding_ids,5,id),unavailable_reason:s(x.unavailable_reason||'',450)}));
 if(sections.length!==5||new Set(sections.map(x=>x.id)).size!==5||sections.some(x=>x.finding_ids.some(k=>findings.find(r=>r.id===k).section_id!==x.id)||x.status==='unavailable'&&x.finding_ids.length||x.status==='available'&&!x.finding_ids.length))bad();
 const plan=value.next_plan;if(!plan||plan.candidate_id!==(d.planning.candidate?.id||null))bad();
 const next_plan={candidate_id:plan.candidate_id,explanation:s(plan.explanation,1200),tradeoffs:list(plan.tradeoffs,4,x=>s(x,650)),fallbacks:list(plan.fallbacks,3,x=>s(x,650)),evidence_refs:evidence(plan.evidence_refs)};
 if(d.coverage.depth==='full'&&(overview.priority_ids.length<2||findings.length<2||!next_plan.explanation.trim()||!next_plan.fallbacks.length))bad();
 const output={version:2,scope_ref:value.scope_ref,analysis_status:d.coverage.depth,overview,findings,sections,next_plan,follow_up_status:d.follow.length?'available':'no_history',unknowns:list(value.unknowns,8,x=>s(x,450))};
 if(JSON.stringify(output).length>24000)bad();return output;
}
