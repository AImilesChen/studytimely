import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {emptyState,transition} from '../src/lib/model.mjs';
import {studyCenterReport} from '../src/lib/study-center.mjs';

// Exercise the real component handlers and model without a browser or new dependencies.
const compiled=await build({entryPoints:['src/components/StudyCenterActions.jsx'],absWorkingDir:fileURLToPath(new URL('../',import.meta.url)),bundle:true,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime'],write:false,logLevel:'silent'});
const require=createRequire(import.meta.url),now=new Date('2026-11-21T12:00:00').getTime(),today='2026-11-21';
function harness(){
 const cells=[];let cursor=0;
 const hooks={useEffect(){},useState(initial){const i=cursor++;if(!(i in cells))cells[i]=initial;return[cells[i],v=>{cells[i]=typeof v==='function'?v(cells[i]):v;}];},useRef(initial){const i=cursor++;return cells[i]??=( {current:initial} );}};
 class FormFields{constructor(form){this.form=form;}get(name){return this.form[name]??null;}}
 const mod={exports:{}};new Function('require','module','exports','FormData',compiled.outputFiles[0].text)(id=>id==='react'?hooks:require(id),mod,mod.exports,FormFields);
 return{render(name,props){cursor=0;return mod.exports[name](props);}};
}
function elements(tree){if(!tree||typeof tree!=='object')return[];if(Array.isArray(tree))return tree.flatMap(elements);return[tree,...elements(tree.props?.children)];}
const button=(tree,text)=>elements(tree).find(x=>x.type==='button'&&elementsText(x).includes(text));
function elementsText(tree){if(tree==null||typeof tree==='boolean')return'';if(typeof tree!=='object')return String(tree);if(Array.isArray(tree))return tree.map(elementsText).join('');return elementsText(tree.props?.children);}
function store(){let n=0;return{ready:true,hasPending:false,data:emptyState('center-test'),calls:[],async getSnapshot(){return structuredClone(this.data);},async command(type,payload){this.calls.push({type,payload});const result=transition(this.data,{type,...payload,epoch:this.data.epoch},{now,owner:'test',id:'item-'+(++n)});this.data=result.state;return result;}};}

test('new users can add a task on today’s screen; planning adds no study credit',async()=>{
 const h=harness(),s=store(),props=()=>({store:s,ready:true,today,report:studyCenterReport(s.data,now),onStart(){},navigate(){}});
 let tree=h.render('TodayTasks',props());const form=elements(tree).find(x=>x.type==='form');assert.ok(form);let reset=false;
 await form.props.onSubmit({preventDefault(){},currentTarget:{title:'Practise algebra',subject:'Maths',minutes:'25',reset(){reset=true;}}});
 tree=h.render('TodayTasks',props());assert.equal(s.data.workspace.tasks.length,1);assert.equal(s.data.workspace.tasks[0].plannedDate,today);assert.equal(s.data.workspace.tasks[0].dueDate,'');assert.equal(s.data.workspace.tasks[0].estimateMinutes,25);assert.equal(s.data.sessions.length,0);assert.equal(reset,true);assert.ok(button(tree,'Start this task'));assert.match(elementsText(tree),/Task added to today/);
});

test('completion feedback stays with today’s tasks and never creates saved study time',async()=>{
 const h=harness(),s=store();await s.command('task-save',{title:'Read a chapter',plannedDate:today});
 const props=()=>({store:s,ready:true,today,report:studyCenterReport(s.data,now)});
 await button(h.render('TodayTasks',props()),'Mark done').props.onClick();
 const tree=h.render('TodayTasks',props());assert.equal(s.data.workspace.tasks[0].done,true);assert.match(elementsText(tree),/Task completed. Saved study time is unchanged/);assert.equal(studyCenterReport(s.data,now).day.total,0);
});

test('stale task edits are rejected without overwriting a newer change',async()=>{
 const h=harness(),s=store();await s.command('task-save',{title:'Original',plannedDate:today});const report=studyCenterReport(s.data,now);
 const tree=h.render('TodayTasks',{store:s,ready:true,today,report});s.data.workspace.tasks[0]={...s.data.workspace.tasks[0],updatedAt:s.data.workspace.tasks[0].updatedAt+1,title:'Changed elsewhere'};
 await button(tree,'Mark done').props.onClick();const after=h.render('TodayTasks',{store:s,ready:true,today,report});assert.match(elementsText(after),/This task changed/);assert.equal(s.data.workspace.tasks[0].done,false);assert.equal(s.calls.length,1);
});

test('pending saves disable task changes and rapid submissions create only one task',async()=>{
 const h=harness(),s=store();let release;const command=s.command.bind(s);s.command=async(...args)=>{await new Promise(resolve=>release=resolve);return command(...args);};
 const props={store:s,ready:true,today,report:studyCenterReport(s.data,now)},tree=h.render('TodayTasks',props),form=elements(tree).find(x=>x.type==='form');
 const event={preventDefault(){},currentTarget:{title:'One task',reset(){}}},first=form.props.onSubmit(event);await form.props.onSubmit(event);release();await first;assert.equal(s.calls.length,1);
 s.hasPending=true;assert.equal(button(h.render('TodayTasks',props),'Add to today').props.disabled,true);
});

test('daily goal can be saved and removed inline; failed saves keep an actionable form',async()=>{
 const h=harness(),s=store(),props=()=>({store:s,ready:true,minutes:s.data.dailyGoal,seconds:0});
 button(h.render('DailyGoal',props()),'Set goal').props.onClick();let tree=h.render('DailyGoal',props());let form=elements(tree).find(x=>x.type==='form');
 await form.props.onSubmit({preventDefault(){},currentTarget:{minutes:'45'}});tree=h.render('DailyGoal',props());assert.equal(s.data.dailyGoal,45);assert.match(elementsText(tree),/Daily goal saved/);assert.equal(s.data.sessions.length,0);
 button(tree,'Edit goal').props.onClick();form=elements(h.render('DailyGoal',props())).find(x=>x.type==='form');const command=s.command.bind(s);s.command=async()=>false;
 await form.props.onSubmit({preventDefault(){},currentTarget:{minutes:'0'}});tree=h.render('DailyGoal',props());assert.ok(elements(tree).find(x=>x.type==='form'));assert.match(elementsText(tree),/Your goal was not saved/);assert.equal(s.data.dailyGoal,45);s.command=command;form=elements(tree).find(x=>x.type==='form');await form.props.onSubmit({preventDefault(){},currentTarget:{minutes:'0'}});tree=h.render('DailyGoal',props());assert.equal(s.data.dailyGoal,0);assert.match(elementsText(tree),/Daily goal removed/);
});

test('zero, loading and populated trends are distinct and daily figures are never folded',()=>{
 const h=harness(),s=store(),recent=studyCenterReport(s.data,now).recent;
 const empty=h.render('SavedTrend',{ready:true,recent,today});assert.match(elementsText(empty),/No saved study sessions/);assert.equal(elements(empty).filter(x=>x.props?.className==='sc-bar-track').length,0);
 const loading=h.render('SavedTrend',{ready:false,today});assert.match(elementsText(loading),/Loading saved learning/);assert.doesNotMatch(elementsText(loading),/No saved/);
 recent.total=1200;recent.series[6].seconds=1200;const filled=h.render('SavedTrend',{ready:true,recent,today});assert.equal(elements(filled).filter(x=>x.props?.className==='sc-bar-track').length,7);assert.equal(elements(filled).filter(x=>x.type==='details').length,0);assert.match(elementsText(filled),/20m/);assert.match(elementsText(filled),/Today/);
});
test('all open tasks and progress can be opened without navigating away from the center',async()=>{
 const s=store(),h=harness();await s.command('task-save',{title:'Future task',plannedDate:'2026-11-28'});
 const p=()=>({store:s,ready:true,today,report:studyCenterReport(s.data,now)});let tree=h.render('TodayTasks',p());assert.doesNotMatch(elementsText(tree),/Future task/);button(tree,'All open tasks').props.onClick();tree=h.render('TodayTasks',p());assert.match(elementsText(tree),/Future task/);assert.equal(elements(tree).filter(x=>x.type==='a').length,0);button(tree,'Today’s tasks').props.onClick();assert.doesNotMatch(elementsText(h.render('TodayTasks',p())),/Future task/);
 let opened=0;const trend=harness().render('SavedTrend',{ready:true,recent:studyCenterReport(s.data,now).recent,today,onReport:()=>opened++});button(trend,'View progress').props.onClick();assert.equal(opened,1);assert.equal(elements(trend).filter(x=>x.type==='a').length,0);
});
