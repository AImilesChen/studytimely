import {analysisRange,studyAnalysis,comparisonRange} from './study-analysis.mjs';
import {weeklyFacts,validateSavedWeekly} from './ai-weekly-contract.mjs';

export function weeklyInput(data,{now,zone,period='last-week',subject='',mode='',shareNames=false}){
 if(!['week','last-week'].includes(period))throw Error('Choose this week or last week.');
 const range=analysisRange({period,zone,now}),report=studyAnalysis(data,range,{subject,mode}),previous=studyAnalysis(data,comparisonRange(range),{subject,mode});
 if(report.subjects.length>50)throw Error('Choose a subject before generating a report for more than 50 subjects.');
 const pairs=report.tasks.rows.filter(t=>t.completedInPeriod&&t.historyKnown&&t.estimateMinutes>0&&t.actualSeconds>0&&!t.unknownCompletion);
 return weeklyFacts({version:1,start:range.start,end:range.end,zone,partial:range.partial,cutoffAt:range.endAt,shareNames,filter:{subject:subject?'selected':'all',mode},
  seconds:report.total,count:report.count,activeDays:report.activeDays,days:report.series,subjects:report.subjects,
  completed:report.tasks.completed,unknownCompletions:report.tasks.unknown,planned:report.tasks.planned,completedPlanned:report.tasks.completedPlanned,overdue:report.tasks.overdue,
  goals:!subject&&!mode?{eligible:report.goals.eligible,reached:report.goals.reached}:null,
  estimates:pairs.length?{count:pairs.length,plannedMinutes:pairs.reduce((n,t)=>n+t.estimateMinutes,0),actualSeconds:pairs.reduce((n,t)=>n+t.actualSeconds,0)}:null,
  previous:{start:previous.range.start,end:previous.range.end,seconds:previous.total,count:previous.count,activeDays:previous.activeDays}});
}
export function weeklyReview(job){
 const ai=validateSavedWeekly({version:job.facts.version||1,id:job.id,hash:job.hash,generatedAt:job.generatedAt,facts:job.facts,content:job.content}),f=ai.facts;
 return {period:'week',start:f.start,end:f.end,zone:f.zone,subject:'',mode:f.filter.mode==='all'?'':f.filter.mode,generatedAt:ai.generatedAt,fingerprint:'ai:'+ai.hash,
  snapshot:{version:1,total:f.seconds,count:f.count,activeDays:f.activeDays,average:f.activeDays?f.seconds/f.activeDays:null,subjects:f.subjects.map(s=>({name:s.name,seconds:s.seconds,share:f.seconds?s.seconds/f.seconds:0})),
   series:f.days,tasks:[],taskCount:0,completed:f.completed,unknownCompletion:f.unknownCompletions,goals:{},insights:[],aiWeek:ai},good:'',difficulty:'',next:''};
}
export function weeklyStale(saved,current){
 if(!saved||!current)return false;
 const stable=f=>{const {cutoffAt,...rest}=f;if(rest.version===2){const {at,...planning}=rest.detail.planning;return {...rest,detail:{...rest.detail,planning}};}return rest;};
 return JSON.stringify(stable(saved.facts))!==JSON.stringify(stable(current));
}
