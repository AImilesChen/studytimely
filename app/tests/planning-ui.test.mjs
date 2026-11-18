import test from 'node:test';import assert from 'node:assert/strict';import Module from 'node:module';import path from 'node:path';import {buildSync} from 'esbuild';
import {emptyState} from '../src/lib/model.mjs';import {validatePlanning} from '../src/lib/planning-schema.mjs';import {planningFingerprint} from '../src/lib/planning-engine.mjs';
const root=path.resolve(import.meta.dirname,'..'),filename=path.join(root,'virtual-planning-ui.cjs'),code=buildSync({stdin:{contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {Planner} from './src/components/Planner.jsx';export {planningExample,BlockDetails,TaskPlanForm} from './src/components/StudyPlanning.jsx';export {preparationExample} from './src/lib/planning-sandbox.mjs';export {examPreparationReport} from './src/lib/exam-preparation-report.mjs';export {ExamPreparationWizard} from './src/components/ExamPreparationWizard.jsx';export {ExamPreparationPanel,PreparationSettingsBody} from './src/components/ExamPreparationPanel.jsx';export {StudyTopicRow,StudyTaskDetail,StudyTaskDrawer,PlanningStudyTasks} from './src/components/PlanningStudyTasks.jsx';export {studyPlanDetail,studyTaskGroups} from './src/lib/planning-plan-view.mjs';export {PlanningPlans} from './src/components/PlanningPlans.jsx';export {PlannerReminderOptions,PlannerReminderNotice} from './src/components/PlannerReminders.jsx';export {PlannerStorageStatus} from './src/components/PlannerStorageStatus.jsx';export {PlanningBacklog} from './src/components/PlanningCalendarParts.jsx';export {PlanningSessionEditor} from './src/components/PlanningSessionEditor.jsx';export {PlanningToday,PlanningWeek,PlanningSetup} from './src/components/PlanningViews.jsx';export const markup=(Component,props)=>renderToStaticMarkup(React.createElement(Component,props));export const render=props=>renderToStaticMarkup(React.createElement(Planner,props));`,resolveDir:root},bundle:true,platform:'node',format:'cjs',jsx:'automatic',external:['react','react-dom/server','react/jsx-runtime'],loader:{'.css':'empty'},write:false,logLevel:'silent'}).outputFiles[0].text,mod=new Module(filename);mod.filename=filename;mod.paths=Module._nodeModulePaths(root);mod._compile(code,filename);
test('planner initial markup has one heading, working views and detailed planning instructions, without private records',()=>{const now=Date.UTC(2026,10,18,12),data=mod.exports.planningExample(now,'UTC'),html=mod.exports.render({store:{data,ready:true},now});assert.equal((html.match(/<h1/g)||[]).length,1);for(const s of ['Today','Week','Plans','Create plan','planner-advanced','Generate, review and apply','Cloud sync is an explicit choice in Account'])assert.ok(html.includes(s),s);assert.ok(!html.includes('example-slot-'));assert.ok(!html.includes('class="sp-block'));
});
test('example goal, task links and scheduled blocks are deterministic, valid and never mutate the real workspace',()=>{const now=Date.UTC(2026,10,18,12),real=emptyState('own'),before=JSON.stringify(real),a=mod.exports.planningExample(now,'UTC'),b=mod.exports.planningExample(now,'UTC');assert.deepEqual(a,b);validatePlanning(a.workspace.planning);assert.ok(a.workspace.planning.blocks.length>0);assert.ok(a.workspace.planning.blocks.every(x=>a.workspace.tasks.some(t=>t.id===x.taskId)));assert.equal(JSON.stringify(real),before);assert.equal(planningFingerprint(a),planningFingerprint(b));});


test('daily example is an agenda, week is a dated time grid, and inactive detail shows no post-study form',()=>{
 const now=Date.UTC(2026,10,18,12),data=mod.exports.planningExample(now,'UTC'),p=data.workspace.planning,tasks=data.workspace.tasks,b=p.blocks[0],noop=()=>{},common={source:data,p,tasks,clock:now,disabled:false,demo:true,simulations:{},onSelect:noop,onStart:noop,onTask:noop,onWeek:noop,onAdd:noop,canCreate:true,today:'2026-11-18'};
 const day=mod.exports.markup(mod.exports.PlanningToday,common);assert.ok(day.includes('Your next study step'));assert.ok(day.includes('View arrangement'));assert.ok(!day.includes('Simulate start'));assert.ok(!day.includes('sp-timeline'));assert.ok(day.includes('Read the worked examples'));
 const week=mod.exports.markup(mod.exports.PlanningWeek,{...common,shown:p.blocks,week:{days:['2026-11-16','2026-11-17','2026-11-18','2026-11-19','2026-11-20','2026-11-21','2026-11-22']}});assert.ok(week.includes('Week calendar with time scale'));assert.ok(week.includes('18:00'));assert.ok(week.includes('top:0'));assert.ok(week.includes('height:120'));assert.ok(week.includes('Practise 10 questions'));
 const detail=mod.exports.markup(mod.exports.BlockDetails,{...common,b,sessions:[],onSimulate:noop,onSave:noop});assert.ok(detail.includes('Simulate start'));assert.ok(!detail.includes('Save feedback'));assert.ok(detail.includes('Adjust this session'));assert.ok(!detail.includes('details open'));
 const active=mod.exports.markup(mod.exports.BlockDetails,{...common,b,sessions:[],onSimulate:noop,onSave:noop,simulations:{[b.id]:{status:'running',seconds:0}}});assert.ok(active.includes('Simulate finish'));assert.ok(!active.includes('Move and lock'));assert.ok(!active.includes('Save feedback'));
 const finished=mod.exports.markup(mod.exports.BlockDetails,{...common,b,sessions:[],onSimulate:noop,onSave:noop,simulations:{[b.id]:{status:'finished',seconds:2400}}});assert.ok(finished.includes('Save feedback'));assert.ok(finished.includes('no real study record'));assert.ok(!finished.includes('Simulate start'));
});


test('Plans renders one selected detail beside navigation and its actions target the correct task, plan and session',()=>{
 const clock=Date.UTC(2026,10,18,12),source=mod.exports.planningExample(clock,'UTC'),g=source.workspace.planning.goals[0],calls=[],props={source,clock,selectedId:g.id,simulations:{},disabled:false,canCreate:true,demo:true};
 for(const name of ['Select','Create','Add','Edit','Archive','Task','Arrange','Schedule','Session','Start'])props['on'+name]=(...args)=>calls.push([name,...args]);
 const html=mod.exports.markup(mod.exports.PlanningPlans,props);for(const text of ['sp-plans-workspace','sp-plan-list','sp-plan-detail','Work remaining','Next learning session','Study tasks','More plan actions','View arrangement','tasks complete','View calendar'])assert.ok(html.includes(text),text);assert.ok(!html.includes('sp-goals'));assert.ok(!html.includes('<h1'));assert.equal((html.match(/class="sp-topic-row/g)||[]).length,3);assert.ok(!html.includes('<tbody>'));
 const tree=mod.exports.PlanningPlans(props),nodes=[];function walk(node){if(!node||typeof node!=='object')return;if(Array.isArray(node)){node.forEach(walk);return;}nodes.push(node);walk(node.props?.children);}walk(tree);
 const text=node=>Array.isArray(node)?node.map(text).join(''):typeof node==='string'?node:typeof node==='number'?String(node):node&&typeof node==='object'?text(node.props?.children):'';
 const button=label=>nodes.find(n=>n.type==='button'&&text(n)===label);
 button('Add task').props.onClick();assert.equal(calls.at(-1)[0],'Add');assert.equal(calls.at(-1)[1].id,g.id);
 button('View calendar').props.onClick({currentTarget:{closest:()=>({open:true})}});assert.equal(calls.at(-1)[0],'Schedule');assert.equal(calls.at(-1)[1].id,g.id);
 button('View arrangement').props.onClick();assert.equal(calls.at(-1)[0],'Session');assert.equal(calls.at(-1)[1].taskId,source.workspace.tasks[0].id);
 const model=mod.exports.studyPlanDetail(source,g.id,clock),group=mod.exports.studyTaskGroups(model.rows)[0];walk(mod.exports.StudyTaskDetail({...props,group,selected:group.editRow,goal:g,zone:'UTC',onPick:()=>{},onClose:()=>{}}));
 nodes.find(n=>n.type==='button'&&n.props.className==='button sp-drawer-edit').props.onClick();assert.equal(calls.at(-1)[0],'Task');assert.equal(calls.at(-1)[1].id,source.workspace.tasks[0].id);
 button('Edit scheduled time').props.onClick();assert.equal(calls.at(-1)[0],'Session');assert.equal(calls.at(-1)[1].id,source.workspace.planning.blocks[0].id);
 button('Archive plan').props.onClick({currentTarget:{closest:()=>({open:true})}});assert.equal(calls.at(-1)[0],'Archive');assert.equal(calls.at(-1)[1].id,g.id);
});

test('Plans handles no goal, another selected goal and completed goals without suggesting fake learning',()=>{
 const clock=Date.UTC(2026,10,18,12),source=mod.exports.planningExample(clock,'UTC'),p=source.workspace.planning,noop=()=>{},props={source,clock,disabled:false,canCreate:true,onCreate:noop};
 p.goals.push({...p.goals[0],id:'second',title:'Finish Biology notes'});p.rules[2].goalId='second';source.workspace.tasks[2].done=true;
 let html=mod.exports.markup(mod.exports.PlanningPlans,{...props,selectedId:'second'});assert.ok(html.includes('Your plan is complete'));assert.ok(!html.includes('Simulate start'));assert.ok(html.includes('selected-plan-title'));assert.ok(html.includes('Your plan'));
 p.goals=[];html=mod.exports.markup(mod.exports.PlanningPlans,props);assert.ok(html.includes('Create your first plan'));assert.ok(!html.includes('sp-plan-detail'));
});


test('exam preparation example exposes the simple wizard and compact grouped study tasks without saving real work',()=>{
 const clock=Date.UTC(2026,10,18,12),source=mod.exports.preparationExample(clock,'UTC'),before=JSON.stringify(source),report=mod.exports.examPreparationReport(source,'prep-example-0',clock),noop=()=>{};
 const wizard=mod.exports.markup(mod.exports.ExamPreparationWizard,{source,clock,disabled:false,onSave:noop});for(const text of ['Step 1 of 4','Exam','Topics','Time','Preview','Add a new exam','Without an exact time'])assert.ok(wizard.includes(text),text);assert.ok(!wizard.includes('Daily focused limit'));
 const props={source,clock,selectedId:'prep-example-0',disabled:false,canCreate:true,demo:true,preparation:report,phase:'all',onPhase:noop,onArrange:noop,onTime:noop,onRest:noop,onTopic:noop,onSelect:noop,onCreate:noop,onAdd:noop,onEdit:noop,onArchive:noop,onTask:noop,onSchedule:noop,onSession:noop,onStart:noop};
 const html=mod.exports.markup(mod.exports.PlanningPlans,props);for(const text of ['Preparation settings','Study tasks','Review','Can’t study today','Mock exam &amp; corrections','View details'])assert.ok(html.includes(text),text);assert.ok(html.indexOf('Next learning session')<html.indexOf('Study tasks'));assert.ok(!html.includes('Preparation outline'));assert.ok(!html.includes('Topics &amp; familiarity'));assert.ok(!html.includes('Study time budget'));assert.equal((html.match(/class="sp-topic-row/g)||[]).length,4);assert.ok(!html.includes('details open'));
 const review=mod.exports.markup(mod.exports.PlanningPlans,{...props,phase:'review'});assert.equal((review.match(/class="sp-topic-row/g)||[]).length,3);assert.ok(!review.includes('class="sp-plan-task-title" disabled'));assert.equal(JSON.stringify(source),before);assert.equal(source.workspace.planning.examPlans.length,2);assert.equal(source.sessions.length,0);assert.equal(source.timer,null);
});


test('week renders subject colours, labelled compact activities and direct calendar creation; its sidebar separates arranged tasks',()=>{
 const clock=Date.UTC(2026,10,18,12),source=mod.exports.preparationExample(clock,'UTC'),p=source.workspace.planning,noop=()=>{},shown=p.blocks.filter(b=>!b.deletedAt),props={source,p,tasks:source.workspace.tasks,clock,shown,canCreate:true,onSelect:noop,onAdd:noop,today:'2026-11-18',week:{days:['2026-11-16','2026-11-17','2026-11-18','2026-11-19','2026-11-20','2026-11-21','2026-11-22']}};
 const html=mod.exports.markup(mod.exports.PlanningWeek,props);
 for(const text of ['--session-color:#f69ac5','--session-color:#79e1bd','is-compact','sp-event-title','Review','Add study on 2026-11-18','sp-free-time','Click a free time to add study'])assert.ok(html.includes(text),text);
 const side=mod.exports.markup(mod.exports.PlanningBacklog,{source,clock,goals:p.goals,goal:'',onGoal:noop,onAdd:noop,onTask:noop});
 for(const text of ['To arrange','Arranged','All remaining time arranged','Find a task','sp-backlog-list','Add task'])assert.ok(side.includes(text),text);
 assert.ok(!side.includes('Add a date exception'));assert.ok(!side.includes('details open'));
 const block=shown[0],editor=mod.exports.markup(mod.exports.PlanningSessionEditor,{source,b:block,clock,disabled:false,onSave:noop,onTime:noop});
 for(const text of ['Task name','Subject','Date','Start','Minutes','Save changes','Available time'])assert.ok(editor.includes(text),text);
 assert.ok(!editor.includes('Task completed'));assert.ok(!editor.includes('Remaining focused minutes'));
 const fresh=mod.exports.markup(mod.exports.PlanningSessionEditor,{source,draft:{date:'2026-11-19',start:1140,minutes:15},clock,onSave:noop});
 for(const text of ['Write a new task','value="2026-11-19"','value="19:00"','value="15"','Add to calendar'])assert.ok(fresh.includes(text),text);
});


test('preparation details retain budget and editable familiarity off the main page; only actionable issues show inline',()=>{
 const clock=Date.UTC(2026,10,18,12),source=mod.exports.preparationExample(clock,'UTC'),report=mod.exports.examPreparationReport(source,'prep-example-0',clock),calls=[],noop=()=>{};
 assert.equal(mod.exports.markup(mod.exports.ExamPreparationPanel,{report,disabled:false}), '');
 const warning=mod.exports.markup(mod.exports.ExamPreparationPanel,{report:{...report,shortfall:15},onTime:noop});assert.ok(warning.includes('15m more study time needed'));assert.ok(warning.includes('Adjust time'));assert.ok(!warning.includes('Preparation outline'));
 const props={report,disabled:false,onTime:()=>calls.push(['time']),onArrange:()=>calls.push(['arrange']),onTopic:(...v)=>calls.push(['topic',...v]),onExam:noop};
 const html=mod.exports.markup(mod.exports.PreparationSettingsBody,props);for(const text of ['Study time budget','Topics &amp; familiarity','Review setup','Available time','Familiarity with Quadratic equations'])assert.ok(html.includes(text),text);
 const nodes=[];function walk(n){if(!n||typeof n!=='object')return;if(Array.isArray(n)){n.forEach(walk);return;}nodes.push(n);walk(n.props?.children);}walk(mod.exports.PreparationSettingsBody(props));
 nodes.find(n=>n.type==='select').props.onChange({target:{value:'weak'}});assert.deepEqual(calls.at(-1),['topic',report.prep.topics[0].id,'weak']);
 nodes.find(n=>n.type==='button'&&n.props.onClick===props.onTime).props.onClick();assert.deepEqual(calls.at(-1),['time']);
});

test('large plans show five topic rows with pagination rather than expanded content or a growing list',()=>{
 const clock=Date.UTC(2026,10,18,12),source=mod.exports.preparationExample(clock,'UTC'),report=mod.exports.examPreparationReport(source,'prep-example-0',clock),detail=mod.exports.studyPlanDetail(source,'prep-example-0',clock),prep=structuredClone(report.prep),noop=()=>{};
 for(let i=0;i<8;i++)prep.topics.push({...prep.topics[0],id:'extra-'+i,title:'Extra topic '+i,learnTaskId:''});
 const html=mod.exports.markup(mod.exports.PlanningStudyTasks,{rows:detail.rows,prep,goal:detail.goal,zone:'UTC',phase:'all',onPhase:noop,onArrange:noop,onTask:noop,onStart:noop,onSession:noop});
 assert.equal((html.match(/class="sp-topic-row/g)||[]).length,5);assert.ok(html.includes('1–5 of 12'));assert.ok(html.includes('Next topic page'));assert.ok(!html.includes('sp-study-task-list'));assert.ok(!html.includes('Expand a topic'));assert.ok(!html.includes('<strong>Extra topic 7</strong>'));assert.ok(!html.includes('details open'));
});


test('topic selection opens details and drawer actions keep the canonical task and session identities',()=>{
 const clock=Date.UTC(2026,10,18,12),source=mod.exports.preparationExample(clock,'UTC'),detail=mod.exports.studyPlanDetail(source,'prep-example-0',clock),report=mod.exports.examPreparationReport(source,'prep-example-0',clock),group=mod.exports.studyTaskGroups(detail.rows,report.prep)[0],selected=group.rows[1],calls=[],before=JSON.stringify(source);
 const topic=mod.exports.StudyTopicRow({group,selected:true,expanded:true,onSelect:g=>calls.push(['topic',g.id])});topic.props.onClick({});assert.deepEqual(calls.at(-1),['topic',group.id]);assert.equal(topic.props['aria-haspopup'],'dialog');assert.equal(topic.props['aria-expanded'],true);
 const props={group,selected,goal:detail.goal,zone:'UTC',disabled:false,canCreate:true,demo:true,onPick:id=>calls.push(['pick',id]),onTask:(t,g)=>calls.push(['task',t.id,g.id]),onSession:b=>calls.push(['session',b.id]),onStart:b=>calls.push(['start',b.id]),onArrange:()=>{},onSchedule:()=>{},onClose:()=>{}};
 const nodes=[];function walk(n){if(!n||typeof n!=='object')return;if(Array.isArray(n)){n.forEach(walk);return;}nodes.push(n);walk(n.props?.children);}walk(mod.exports.StudyTaskDetail(props));
 nodes.find(n=>n.type==='button'&&n.props.className==='button primary sp-drawer-primary').props.onClick();assert.deepEqual(calls.at(-1),['start',selected.next.id]);
 nodes.find(n=>n.type==='button'&&n.props.className==='button sp-drawer-edit').props.onClick();assert.deepEqual(calls.at(-1),['task',selected.task.id,detail.goal.id]);
 nodes.find(n=>n.type==='button'&&n.props.className?.startsWith('sp-drawer-task')).props.onClick();assert.deepEqual(calls.at(-1),['pick',group.rows[0].task.id]);
 const html=mod.exports.markup(mod.exports.StudyTaskDetail,props);for(const s of ['Study new content','Review 1','Edit task','Simulate start','Edit scheduled time'])assert.ok(html.includes(s),s);assert.ok(!html.includes('Review: Quadratic equations'));assert.equal(JSON.stringify(source),before);
 const suspended=mod.exports.StudyTaskDrawer({...props,open:true,suspended:true,taskId:selected.task.id,phase:'all'});assert.equal(suspended.props.open,false);assert.ok(suspended.props.children);
 const resumed=mod.exports.StudyTaskDrawer({...props,open:true,suspended:false,taskId:selected.task.id,phase:'all'});assert.equal(resumed.props.open,true);assert.equal(resumed.props.children.props.selected.task.id,selected.task.id);
});

test('learning colours are accompanied by type labels and selection semantics, and completion preserves task type',()=>{
 const clock=Date.UTC(2026,10,18,12),source=mod.exports.preparationExample(clock,'UTC'),detail=mod.exports.studyPlanDetail(source,'prep-example-0',clock),report=mod.exports.examPreparationReport(source,'prep-example-0',clock),groups=mod.exports.studyTaskGroups(detail.rows,report.prep),noop=()=>{};
 const topic=mod.exports.markup(mod.exports.StudyTopicRow,{group:groups[0],selected:true,expanded:true,onSelect:noop});
 for(const s of ['data-kind="study"','data-kind="review"','Study','Review','aria-current="true"'])assert.ok(topic.includes(s),s);
 const group=groups.at(-1),completed={...group,rows:group.rows.map(r=>({...r,state:'complete',task:{...r.task,done:true}}))};
 const props={group:completed,selected:completed.rows[1],goal:detail.goal,zone:'Europe/London',canCreate:true,disabled:false,paused:true,onTask:noop,onPick:noop,onClose:noop};
 const html=mod.exports.markup(mod.exports.StudyTaskDetail,props);
 for(const s of ['data-kind="mock"','data-kind="corrections"','state-complete','Completed','Europe/London','aria-pressed="true"','Learning steps'])assert.ok(html.includes(s),s);
 assert.ok(!html.includes('Time zone ·'));assert.ok(!html.includes('>Paused<'));assert.ok(!html.includes('Start learning'));assert.ok(html.includes('Reopen task'));
});

test('a split task shows the selected session duration beside its time rather than the whole remaining workload',()=>{
 const clock=Date.UTC(2026,10,18,12),source=mod.exports.preparationExample(clock,'UTC'),detail=mod.exports.studyPlanDetail(source,'prep-example-0',clock),report=mod.exports.examPreparationReport(source,'prep-example-0',clock),original=mod.exports.studyTaskGroups(detail.rows,report.prep)[0],row={...original.rows[0],remaining:180},group={...original,rows:[row],remaining:180,total:1};
 assert.equal((row.next.endAt-row.next.startAt)/60000,40);
 const html=mod.exports.markup(mod.exports.StudyTaskDetail,{group,selected:row,goal:detail.goal,zone:'UTC',canCreate:true,onPick:()=>{}});
 assert.ok(html.includes('40m · UTC'));assert.ok(!html.includes('3h 0m · UTC'));assert.ok(html.includes('3h 0m remaining'));
});

test('future details expose explicit early study, missed details offer replanning and completed tasks can be reopened',()=>{
 const clock=Date.UTC(2026,10,18,12),source=mod.exports.planningExample(clock,'UTC'),p=source.workspace.planning,b=p.blocks[0],task=source.workspace.tasks.find(t=>t.id===b.taskId),noop=()=>{},props={source,p,b,clock,tasks:source.workspace.tasks,sessions:[],disabled:false,canCreate:true,onStart:noop,onSave:noop,onArrange:noop};
 let html=mod.exports.markup(mod.exports.BlockDetails,props);assert.ok(html.includes('Start early'));assert.ok(!html.includes('Save feedback'));
 html=mod.exports.markup(mod.exports.BlockDetails,{...props,clock:b.endAt+1});assert.ok(html.includes('Preview new times'));assert.ok(!html.includes('Start early'));assert.ok(!html.includes('Start learning'));
 task.done=true;html=mod.exports.markup(mod.exports.TaskPlanForm,{source,p,task,goal:p.goals[0].id,initialReopen:true,onSave:noop});assert.ok(html.includes('Reopen this completed task'));assert.ok(html.includes('checked=""'));
});

test('reminder settings explain page scope and example isolation; save status exposes a real pending-save retry',()=>{
 const noop=()=>{},reminders={prefs:{enabled:false,mode:'before'},supported:true,issue:'',busy:false,configure:noop};
 let html=mod.exports.markup(mod.exports.PlannerReminderOptions,{reminders,demo:true});for(const s of ['5 minutes before','At the start time','Closing this page stops reminders','Example plans do not send reminders','disabled=""'])assert.ok(html.includes(s),s);
 html=mod.exports.markup(mod.exports.PlannerStorageStatus,{store:{data:{epoch:'test'},ready:true,hasPending:true},demo:false,busy:false,failed:true,zone:'UTC',onOptions:noop,onRetry:noop});assert.ok(html.includes('Changes have not been saved'));assert.ok(html.includes('Retry saving'));assert.ok(!html.includes('Saved in this browser'));
});
test('the Plans primary action starts only current work and previews new times for missed work',()=>{
 const now=Date.UTC(2026,10,18,12),source=mod.exports.planningExample(now,'UTC'),goal=source.workspace.planning.goals[0],block=source.workspace.planning.blocks[0],calls=[],noop=()=>{},props={source,selectedId:goal.id,canCreate:true,demo:true,onStart:b=>calls.push(['start',b.id]),onArrange:g=>calls.push(['arrange',g.id]),onSelect:noop,onCreate:noop,onAdd:noop,onEdit:noop,onArchive:noop,onSchedule:noop,onSession:noop};
 const text=n=>Array.isArray(n)?n.map(text).join(''):typeof n==='string'?n:n&&typeof n==='object'?text(n.props?.children):'';
 const buttons=tree=>{const out=[];function walk(n){if(!n||typeof n!=='object')return;if(Array.isArray(n)){n.forEach(walk);return;}if(n.type==='button')out.push(n);walk(n.props?.children);}walk(tree);return out;};
 buttons(mod.exports.PlanningPlans({...props,clock:block.startAt+1})).find(n=>text(n)==='Simulate start').props.onClick();assert.deepEqual(calls.at(-1),['start',block.id]);
 buttons(mod.exports.PlanningPlans({...props,clock:block.endAt+1})).find(n=>text(n)==='Preview new times').props.onClick();assert.deepEqual(calls.at(-1),['arrange',goal.id]);
});
