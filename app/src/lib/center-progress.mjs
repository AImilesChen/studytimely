import {analysisRange,comparisonRange,studyAnalysis,recordRows} from './study-analysis.mjs';
import {learningRecordHistory,allHistoryRecords} from './study-records.mjs';
import {habitSummary,habitMonday,habitShift} from './habits.mjs';

// Composition only: accounting and date clipping stay shared with Study Analytics.
export function centerProgress(data,{now,zone,selection={period:'week'},subject='',mode='',compare=false,allHistory=false,day=null}){
 const range=analysisRange({...selection,now,zone}),report=studyAnalysis(data,range,{subject,mode}),history=learningRecordHistory(data,now);
 const prior=compare?studyAnalysis(data,comparisonRange(range),{subject,mode}):null;
 const recordsReport=allHistory?allHistoryRecords(history,zone,now,{subject,mode}):report;
 const rows=recordRows(recordsReport,allHistory?null:day);
 return{range,report,prior,history,recordsReport,rows};
}

export function periodHabits(data,range,now){
 const end=Math.min(now,new Date(range.end+'T23:59:59.999').getTime());
 const sessions=[...new Map((data.sessions||[]).filter(s=>!Object.hasOwn(data.workspace?.deletedSessions||{},s.id)).map(s=>[s.id,s])).values()];
 return(data.workspace?.habits||[]).filter(h=>!h.deletedAt&&h.startDate<=range.end).map(habit=>{
  const summary=habitSummary(habit,sessions,end),days=Array.from({length:range.calendarDays},(_,i)=>summary.dayInfo(habitShift(range.start,i))).filter(d=>!d.inactive&&!d.future);
  const daily=days.filter(d=>d.policy?.period==='daily'&&!d.rest),weeks=new Map();
  for(const d of days.filter(d=>d.policy?.period==='weekly')){const start=habitMonday(d.day),row=weeks.get(start)||{start,end:habitShift(start,6),value:0,target:d.policy.target,kind:d.policy.kind};row.value+=d.value;weeks.set(start,row);}
  return{habit,planned:daily.length,reached:daily.filter(d=>d.met).length,weeks:[...weeks.values()].map(w=>({...w,partial:w.start<range.start||w.end>range.end||end<new Date(w.end+'T23:59:59.999').getTime()}))};
 });
}
