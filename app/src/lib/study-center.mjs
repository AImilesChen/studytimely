import {alive} from './workspace.mjs';
import {dayKey} from './model.mjs';
import {plannerGroups} from './planner.mjs';
import {trackerRange,trackerReport} from './tracker.mjs';
import {sortedExams,examTiming} from './exams.mjs';
import {nextSyllabusTopic,syllabusSummary} from './syllabus.mjs';
import {habitSummary} from './habits.mjs';

export function studyCenterReport(data,now){
 const today=dayKey(now),workspace=data.workspace||{},sessions=(data.sessions||[]).filter(s=>['study','focus','pomodoro'].includes(s.mode));
 const report=period=>trackerReport(sessions,trackerRange({period,today}));
 const day=report('today'),week=report('week'),recent=report('7'),tasks=alive(workspace.tasks),todayTasks=tasks.filter(t=>t.plannedDate===today||t.dueDate===today);
 const nextTasks=plannerGroups(tasks,{today}).flatMap(g=>g.tasks.map(task=>({task,reason:g.id==='overdue'?'Past due':g.id==='due'?'Due today':'Planned today'})));
 const exams=sortedExams(workspace.exams||[],now).filter(e=>['today','upcoming'].includes(examTiming(e,now).group)).slice(0,2).map(exam=>({exam,timing:examTiming(exam,now)}));
 const plans=alive(workspace.plans),topics=plans.map(plan=>({plan,next:nextSyllabusTopic(plan,sessions,today),summary:syllabusSummary(plan)})).filter(x=>x.next).slice(0,2);
 const weekday=new Date(today+'T12:00:00').getDay()||7,minute=new Date(now).getHours()*60+new Date(now).getMinutes();
 const nextBlock=alive(workspace.blocks).filter(b=>b.weekday===weekday&&b.end>minute&&(b.kind||'study')==='study').sort((a,b)=>a.start-b.start)[0]||null;
 return{today,day,week,recent,nextTasks,todayTasks,completedTodayPlan:todayTasks.filter(t=>t.done).length,exams,topics,nextBlock,
  habits:alive(workspace.habits).slice(0,3).map(habit=>({habit,summary:habitSummary(habit,sessions,now)})),
  latest:sessions.slice().sort((a,b)=>b.endedAt-a.endedAt||a.id.localeCompare(b.id)).slice(0,4),
  dailyGoal:data.dailyGoal||0,weeklyGoal:workspace.weeklyGoal||0};
}
