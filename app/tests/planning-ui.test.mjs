import test from 'node:test';import assert from 'node:assert/strict';import Module from 'node:module';import path from 'node:path';import {buildSync} from 'esbuild';
import {emptyState} from '../src/lib/model.mjs';import {validatePlanning} from '../src/lib/planning-schema.mjs';import {planningFingerprint} from '../src/lib/planning-engine.mjs';
const root=path.resolve(import.meta.dirname,'..'),filename=path.join(root,'virtual-planning-ui.cjs'),code=buildSync({stdin:{contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {Planner} from './src/components/Planner.jsx';export {planningExample,BlockDetails} from './src/components/StudyPlanning.jsx';export {PlanningPlans} from './src/components/PlanningPlans.jsx';export {PlanningToday,PlanningWeek,PlanningSetup} from './src/components/PlanningViews.jsx';export const markup=(Component,props)=>renderToStaticMarkup(React.createElement(Component,props));export const render=props=>renderToStaticMarkup(React.createElement(Planner,props));`,resolveDir:root},bundle:true,platform:'node',format:'cjs',jsx:'automatic',external:['react','react-dom/server','react/jsx-runtime'],loader:{'.css':'empty'},write:false,logLevel:'silent'}).outputFiles[0].text,mod=new Module(filename);mod.filename=filename;mod.paths=Module._nodeModulePaths(root);mod._compile(code,filename);
test('planner initial markup has one heading, working views and detailed planning instructions, without private records',()=>{const now=Date.UTC(2026,10,18,12),data=mod.exports.planningExample(now,'UTC'),html=mod.exports.render({store:{data,ready:true},now});assert.equal((html.match(/<h1/g)||[]).length,1);for(const s of ['Today','Week','Plans','Create plan','planner-advanced','Generate, review and apply','explicit manual account action'])assert.ok(html.includes(s),s);assert.ok(!html.includes('example-slot-'));assert.ok(!html.includes('class="sp-block'));
});
test('example goal, task links and scheduled blocks are deterministic, valid and never mutate the real workspace',()=>{const now=Date.UTC(2026,10,18,12),real=emptyState('own'),before=JSON.stringify(real),a=mod.exports.planningExample(now,'UTC'),b=mod.exports.planningExample(now,'UTC');assert.deepEqual(a,b);validatePlanning(a.workspace.planning);assert.ok(a.workspace.planning.blocks.length>0);assert.ok(a.workspace.planning.blocks.every(x=>a.workspace.tasks.some(t=>t.id===x.taskId)));assert.equal(JSON.stringify(real),before);assert.equal(planningFingerprint(a),planningFingerprint(b));});


test('daily example is an agenda, week is a dated time grid, and inactive detail shows no post-study form',()=>{
 const now=Date.UTC(2026,10,18,12),data=mod.exports.planningExample(now,'UTC'),p=data.workspace.planning,tasks=data.workspace.tasks,b=p.blocks[0],noop=()=>{},common={source:data,p,tasks,clock:now,disabled:false,demo:true,simulations:{},onSelect:noop,onStart:noop,onTask:noop,onWeek:noop,onAdd:noop,canCreate:true,today:'2026-11-18'};
 const day=mod.exports.markup(mod.exports.PlanningToday,common);assert.ok(day.includes('Your next study step'));assert.ok(day.includes('Simulate start'));assert.ok(!day.includes('sp-timeline'));assert.ok(day.includes('Read the worked examples'));
 const week=mod.exports.markup(mod.exports.PlanningWeek,{...common,shown:p.blocks,week:{days:['2026-11-16','2026-11-17','2026-11-18','2026-11-19','2026-11-20','2026-11-21','2026-11-22']}});assert.ok(week.includes('Week calendar with time scale'));assert.ok(week.includes('18:00'));assert.ok(week.includes('top:0'));assert.ok(week.includes('height:120'));assert.ok(week.includes('Practise 10 questions'));
 const detail=mod.exports.markup(mod.exports.BlockDetails,{...common,b,sessions:[],onSimulate:noop,onSave:noop});assert.ok(detail.includes('Simulate start'));assert.ok(!detail.includes('Save feedback'));assert.ok(detail.includes('Adjust this session'));assert.ok(!detail.includes('details open'));
 const active=mod.exports.markup(mod.exports.BlockDetails,{...common,b,sessions:[],onSimulate:noop,onSave:noop,simulations:{[b.id]:{status:'running',seconds:0}}});assert.ok(active.includes('Simulate finish'));assert.ok(!active.includes('Move and lock'));assert.ok(!active.includes('Save feedback'));
 const finished=mod.exports.markup(mod.exports.BlockDetails,{...common,b,sessions:[],onSimulate:noop,onSave:noop,simulations:{[b.id]:{status:'finished',seconds:2400}}});assert.ok(finished.includes('Save feedback'));assert.ok(finished.includes('no real study record'));assert.ok(!finished.includes('Simulate start'));
});


test('Plans renders one selected detail beside navigation and its actions target the correct task, plan and session',()=>{
 const clock=Date.UTC(2026,10,18,12),source=mod.exports.planningExample(clock,'UTC'),g=source.workspace.planning.goals[0],calls=[],props={source,clock,selectedId:g.id,simulations:{},disabled:false,canCreate:true,demo:true};
 for(const name of ['Select','Create','Add','Edit','Archive','Task','Arrange','Schedule','Session','Start'])props['on'+name]=(...args)=>calls.push([name,...args]);
 const html=mod.exports.markup(mod.exports.PlanningPlans,props);for(const text of ['sp-plans-workspace','sp-plan-list','sp-plan-detail','Work remaining','Next learning session','Upcoming planned time','More plan actions','Simulate start','Remaining','Study time'])assert.ok(html.includes(text),text);assert.ok(!html.includes('sp-goals'));assert.ok(!html.includes('<h1'));assert.equal((html.match(/<tbody>/g)||[]).length,1);
 const tree=mod.exports.PlanningPlans(props),nodes=[];function walk(node){if(!node||typeof node!=='object')return;if(Array.isArray(node)){node.forEach(walk);return;}nodes.push(node);walk(node.props?.children);}walk(tree);
 const text=node=>Array.isArray(node)?node.map(text).join(''):typeof node==='string'?node:typeof node==='number'?String(node):node&&typeof node==='object'?text(node.props?.children):'';
 const button=label=>nodes.find(n=>n.type==='button'&&text(n)===label);
 button('Add task').props.onClick();assert.equal(calls.at(-1)[0],'Add');assert.equal(calls.at(-1)[1].id,g.id);
 button('Arrange study ').props.onClick();assert.equal(calls.at(-1)[0],'Arrange');assert.equal(calls.at(-1)[1].id,g.id);
 button('Simulate start').props.onClick();assert.equal(calls.at(-1)[0],'Start');assert.equal(calls.at(-1)[1].taskId,source.workspace.tasks[0].id);
 nodes.find(n=>n.type==='button'&&n.props['aria-label']?.startsWith('Edit remaining work')).props.onClick();assert.equal(calls.at(-1)[0],'Task');assert.equal(calls.at(-1)[1].id,source.workspace.tasks[0].id);
 nodes.find(n=>n.type==='button'&&n.props.className==='sp-plan-time').props.onClick();assert.equal(calls.at(-1)[0],'Session');assert.equal(calls.at(-1)[1].id,source.workspace.planning.blocks[0].id);
 button('Archive plan').props.onClick({currentTarget:{closest:()=>({open:true})}});assert.equal(calls.at(-1)[0],'Archive');assert.equal(calls.at(-1)[1].id,g.id);
});

test('Plans handles no goal, another selected goal and completed goals without suggesting fake learning',()=>{
 const clock=Date.UTC(2026,10,18,12),source=mod.exports.planningExample(clock,'UTC'),p=source.workspace.planning,noop=()=>{},props={source,clock,disabled:false,canCreate:true,onCreate:noop};
 p.goals.push({...p.goals[0],id:'second',title:'Finish Biology notes'});p.rules[2].goalId='second';source.workspace.tasks[2].done=true;
 let html=mod.exports.markup(mod.exports.PlanningPlans,{...props,selectedId:'second'});assert.ok(html.includes('You completed this plan'));assert.ok(!html.includes('Simulate start'));assert.ok(html.includes('selected-plan-title'));assert.ok(html.includes('Your plan'));
 p.goals=[];html=mod.exports.markup(mod.exports.PlanningPlans,props);assert.ok(html.includes('Create your first plan'));assert.ok(!html.includes('sp-plan-detail'));
});
