import {DomainError,dayKey,dailyTotals} from './model.mjs';
export const HABIT_KINDS=['minutes','sessions','days','checkin'];
export const habitDay=dayKey;
export const habitShift=(day,n)=>{const d=new Date(day+'T12:00:00');d.setDate(d.getDate()+n);return dayKey(d);};
export const habitWeekday=day=>new Date(day+'T12:00:00').getDay()||7;
export const habitMonday=day=>habitShift(day,1-habitWeekday(day));
const validDay=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&d>='1970-01-01'&&d<='2100-12-31'&&Number.isFinite(Date.parse(d+'T12:00:00Z'))&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d;
const invalid=m=>{throw new DomainError('INVALID',m);};
const integer=(n,min,max,label)=>{if(!Number.isInteger(n)||n<min||n>max)invalid(`${label}: use a whole number from ${min} to ${max}.`);return n;};
export const habitTargetMax=(kind,period)=>kind==='minutes'?(period==='daily'?1440:10080):kind==='checkin'||kind==='days'?(period==='daily'?1:7):1000;
export const habitUnit=(kind,count)=>kind==='minutes'?'min':kind==='sessions'?(count===1?'session':'sessions'):kind==='days'?(count===1?'learning day':'learning days'):(count===1?'check-in':'check-ins');
export const habitScopeName=scope=>!scope?'All subjects':scope==='none'?'Unlabelled study':scope.slice(8);
export function habitRule(input){
 const {kind,period}=input;if(!HABIT_KINDS.includes(kind)||!['daily','weekly'].includes(period))invalid('Choose a supported habit goal and period.');
 const target=integer(Number(input.target),1,habitTargetMax(kind,period),'Target'),studyDays=input.studyDays;
 if(!Array.isArray(studyDays)||!studyDays.length||new Set(studyDays).size!==studyDays.length||studyDays.some(d=>!Number.isInteger(d)||d<1||d>7))invalid('Choose at least one planned study day.');
 const scope=input.scope||'';if(typeof scope!=='string'||!(scope===''||scope==='none'||scope.startsWith('subject:')&&scope.slice(8).trim()&&scope.slice(8).length<=40))invalid('Choose all subjects or a valid subject label.');
 return {kind,period,target,studyDays:[...studyDays].sort((a,b)=>a-b),scope:kind==='checkin'?'':scope};
}
export function habitPolicies(h){return h.policies?.length?h.policies:[{...habitRule(h),from:h.startDate,id:'legacy:'+h.id,updatedAt:h.updatedAt||0}];}
export function habitPolicy(h,day){return habitPolicies(h).filter(p=>p.from<=day).at(-1)||null;}
export function validateHabit(x){
 if(!x||typeof x.id!=='string'||!x.id||x.id.length>150||typeof x.title!=='string'||!x.title.trim()||x.title.length>140||!Number.isFinite(x.updatedAt)||x.updatedAt<0||!validDay(x.startDate))invalid('Invalid study habit.');
 if(x.planVersion===2&&!Array.isArray(x.policies))invalid('Updated habits need their dated rule history. Update the app or restore a complete backup.');
 const rule=habitRule(x),checks={};if(!x.checks||typeof x.checks!=='object'||Array.isArray(x.checks)||Object.keys(x.checks).length>20000)invalid('Invalid check-ins.');
 for(const [day,c]of Object.entries(x.checks)){if(!validDay(day)||!c||typeof c.checked!=='boolean'||!Number.isFinite(c.updatedAt)||c.updatedAt<0)invalid('Invalid check-in date.');checks[day]={checked:c.checked,updatedAt:c.updatedAt};}
 if(x.policies!==undefined&&(!Array.isArray(x.policies)||!x.policies.length||x.policies.length>256))invalid('Too many habit rule changes.');
 const policies=(x.policies||[{...rule,from:x.startDate,id:'legacy:'+x.id,updatedAt:x.updatedAt}]).map(p=>{if(!validDay(p.from)||p.from<x.startDate||typeof p.id!=='string'||!p.id||p.id.length>150||!Number.isFinite(p.updatedAt)||p.updatedAt<0)invalid('Invalid habit rule history.');return {...habitRule(p),id:p.id,from:p.from,updatedAt:p.updatedAt};}).sort((a,b)=>a.from.localeCompare(b.from));
 if(policies[0].from!==x.startDate||new Set(policies.map(p=>p.from)).size!==policies.length)invalid('Habit rules must have a unique effective date and cover the start date.');
 const deletedAt=x.deletedAt||0;if(!Number.isFinite(deletedAt)||deletedAt<0)invalid('Invalid habit deletion.');
 return {id:x.id,title:x.title.trim(),updatedAt:x.updatedAt,deletedAt,startDate:x.startDate,...rule,checks,planVersion:x.planVersion===2?2:1,policies};
}
export function habitSave(w,action,{id,now}){
 const today=dayKey(now),old=action.itemId?w.habits.find(h=>h.id===action.itemId&&!h.deletedAt):null;
 if(action.itemId&&!old)invalid('This habit changed or was removed.');
 if(old&&action.expectedUpdatedAt!==undefined&&old.updatedAt!==action.expectedUpdatedAt)invalid('This habit changed in another tab. Close and reopen it before saving.');
 const rule=habitRule(action),from=old?(action.effectiveFrom||today):today;
 if(!validDay(from)||from<today||from>habitShift(today,366))invalid('Choose an effective date from today through the next year.');
 const existing=old&&habitPolicy(old,today);
 if(old&&(rule.period==='weekly'||existing?.period==='weekly')&&habitWeekday(from)!==1)invalid('Weekly rule changes take effect on a Monday. Choose the next Monday to keep this week unchanged.');
 const policies=old?habitPolicies(old).filter(p=>p.from!==from):[];
 policies.push({...rule,from,id,updatedAt:now});
 const h=validateHabit({...old,id:old?.id||id,title:action.title,updatedAt:now,deletedAt:0,startDate:old?.startDate||today,...rule,checks:old?.checks||{},planVersion:2,policies});
 w.habits=old?w.habits.map(x=>x.id===old.id?h:x):[...w.habits,h];return h;
}
export function habitCheck(w,action,now){
 const h=w.habits.find(h=>h.id===action.itemId&&!h.deletedAt),day=action.day;
 if(!h||!validDay(day)||day< h.startDate||day>dayKey(now))invalid('Choose a day between the habit start and today.');
 if(habitPolicy(h,day)?.kind!=='checkin')invalid('This date uses automatic learning records, not a manual check-in.');
 if(typeof action.checked!=='boolean')invalid('Choose a check-in state.');
 h.checks[day]={checked:action.checked,updatedAt:now};h.updatedAt=now;
}
export function mergeHabit(a,b,choose){
 const winner=choose(a,b),checks={...a.checks};for(const [day,c]of Object.entries(b.checks))checks[day]=choose(checks[day],c);
 const modern=a.planVersion===2||b.planVersion===2,inputs=modern?[a,b].filter(h=>h.planVersion===2):[a,b];
 const byDate=new Map();for(const h of inputs)for(const p of habitPolicies(h))byDate.set(p.from,choose(byDate.get(p.from),p));
 const policies=[...byDate.values()].sort((a,b)=>a.from.localeCompare(b.from)),last=policies.at(-1);
 return validateHabit({...winner,...habitRule(last),planVersion:modern?2:1,policies,checks});
}
export function losesHabitHistory(previous,incoming){const next=new Map((incoming?.workspace?.habits||[]).map(h=>[h.id,h]));return (previous?.workspace?.habits||[]).some(h=>h.planVersion===2&&next.get(h.id)?.planVersion!==2);}
export function habitSummary(h,sessions,now){
 const today=dayKey(now),policies=habitPolicies(h),currentPolicy=habitPolicy(h,today)||policies[0],indices=new Map();
 function index(scope){if(indices.has(scope))return indices.get(scope);const filtered=sessions.filter(s=>['study','focus','pomodoro'].includes(s.mode)&&(!scope||(scope==='none'?!s.subject:s.subject===scope.slice(8)))),minutes=dailyTotals(filtered),counts={};for(const s of filtered){const day=dayKey(s.endedAt);counts[day]=(counts[day]||0)+1;}const i={minutes,counts};indices.set(scope,i);return i;}
 function value(day,p){if(day<h.startDate||day>today||!p)return 0;if(p.kind==='checkin')return h.checks[day]?.checked?1:0;const i=index(p.scope);return p.kind==='minutes'?(i.minutes[day]||0)/60:p.kind==='days'?i.minutes[day]>0?1:0:i.counts[day]||0;}
 function dayInfo(day){const p=habitPolicy(h,day),future=day>today,inactive=day<h.startDate,rest=p?!p.studyDays.includes(habitWeekday(day)):false,v=value(day,p),met=!future&&!inactive&&p?.period==='daily'&&v>=p.target;
 const status=future?'future':inactive?'inactive':rest?'rest':p.period==='weekly'?(v>0?'activity':'pending'):met?'complete':v>0?'partial':day===today?'pending':'missed';return {day,value:v,met:!!met,rest,future,inactive,status,policy:p,manual:p?.kind==='checkin'};}
 function weekInfo(start){const from=start<h.startDate?h.startDate:start,p=habitPolicy(h,from),end=habitShift(start,6);if(!p||p.period!=='weekly')return {value:0,met:false,eligible:false};let sum=0;for(let d=from;d<=end&&d<=today;d=habitShift(d,1))sum+=value(d,habitPolicy(h,d));return {value:sum,met:start<=today&&sum>=p.target,eligible:true};}
 let current=0,best=0,run=0,scheduled=0,completed=0;
 if(currentPolicy.period==='daily'){
  for(let d=h.startDate;d<=today;d=habitShift(d,1)){const info=dayInfo(d);if(info.policy.period!=='daily'){run=0;continue;}if(info.rest)continue;if(info.met){run++;best=Math.max(best,run);}else if(d!==today)run=0;if(d>=habitShift(today,-27)&&(d<today||info.met)){scheduled++;if(info.met)completed++;}}
  for(let d=today;d>=h.startDate;d=habitShift(d,-1)){const info=dayInfo(d);if(info.policy.period!=='daily')break;if(info.rest)continue;if(d===today&&!info.met)continue;if(!info.met)break;current++;}
 }else{
  for(let d=habitMonday(h.startDate);d<=today;d=habitShift(d,7)){const info=weekInfo(d);if(!info.eligible){run=0;continue;}if(info.met){run++;best=Math.max(best,run);}else if(d!==habitMonday(today))run=0;if(d>=habitShift(habitMonday(today),-21)&&(d<habitMonday(today)||info.met)){scheduled++;if(info.met)completed++;}}
  for(let d=habitMonday(today);d>=habitMonday(h.startDate);d=habitShift(d,-7)){const info=weekInfo(d);if(!info.eligible)break;if(d===habitMonday(today)&&!info.met)continue;if(!info.met)break;current++;}
 }
 const day=dayInfo(today),week=weekInfo(habitMonday(today)),v=currentPolicy.period==='weekly'?week.value:day.value;
 return {value:v,met:v>=currentPolicy.target,rest:day.rest,current,best,unit:currentPolicy.period==='weekly'?'weeks':'planned days',rule:currentPolicy,recent:{completed,scheduled},days:Array.from({length:7},(_,i)=>dayInfo(habitShift(habitMonday(today),i))),dayInfo};
}
export function habitCalendar(h,sessions,now,month){
 const today=dayKey(now),first=validDay(month+'-01')?month+'-01':today.slice(0,7)+'-01',start=habitMonday(first),report=habitSummary(h,sessions,now);
 return Array.from({length:42},(_,i)=>({...report.dayInfo(habitShift(start,i)),inMonth:habitShift(start,i).startsWith(first.slice(0,7))}));
}
