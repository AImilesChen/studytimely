import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {emptyState,transition} from '../src/lib/model.mjs';
const require=createRequire(import.meta.url),now=new Date('2026-11-21T12:00:00').getTime(),today='2026-11-21';
const compiled=await build({entryPoints:['src/components/StudyCenterPlans.jsx'],absWorkingDir:fileURLToPath(new URL('../',import.meta.url)),bundle:true,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime'],write:false,logLevel:'silent'});
function harness(){
 const cells=[];let cursor=0;
 const hooks={useState(initial){const i=cursor++;if(!(i in cells))cells[i]=initial;return[cells[i],v=>cells[i]=typeof v==='function'?v(cells[i]):v];},useRef(initial){const i=cursor++;return cells[i]??={current:initial};}};
 class Fields{constructor(form){this.form=form;}get(name){return this.form[name]??null;}}
 const mod={exports:{}};new Function('require','module','exports','FormData',compiled.outputFiles[0].text)(id=>id==='react'?hooks:require(id),mod,mod.exports,Fields);
 return{render(name,props){cursor=0;return mod.exports[name](props);}};
}
function all(tree){if(!tree||typeof tree!=='object')return[];if(Array.isArray(tree))return tree.flatMap(all);if(typeof tree.type==='function')return all(tree.type(tree.props));return[tree,...all(tree.props?.children)];}
function text(tree){if(tree==null||typeof tree==='boolean')return'';if(typeof tree!=='object')return String(tree);if(Array.isArray(tree))return tree.map(text).join('');return text(typeof tree.type==='function'?tree.type(tree.props):tree.props?.children);}
const button=(tree,label)=>all(tree).find(x=>x.type==='button'&&text(x).includes(label));
function formEvent(values){const fields=Object.fromEntries(Object.entries(values).map(([k,value])=>[k,{value}]));return{preventDefault(){},currentTarget:{...values,reset(){for(const field of Object.values(fields))field.value='';},elements:{namedItem:name=>fields[name]||null}}};}
function store(){let id=0;return{ready:true,hasPending:false,data:emptyState('center-plans'),calls:[],async getSnapshot(){return structuredClone(this.data);},async command(type,payload){this.calls.push({type,payload});const result=transition(this.data,{type,...payload,epoch:this.data.epoch},{now,owner:'test',id:'item-'+(++id)});this.data=result.state;return result;}};}
const props=s=>({store:s,ready:true,now,today,onStart(){}});

test('the three plan tools show usable forms without navigation links or collapsed controls',()=>{
 for(const name of ['CenterExams','CenterHabits','CenterCourses']){const tree=harness().render(name,props(store()));assert.equal(all(tree).filter(x=>x.type==='form').length,1,name);assert.equal(all(tree).filter(x=>['a','details','dialog'].includes(x.type)).length,0,name);assert.ok(all(tree).some(x=>x.type==='input'),name);}
});
test('exam dates save and show a countdown inline; taken exams retain their record',async()=>{
 const h=harness(),s=store();let tree=h.render('CenterExams',props(s));await all(tree).find(x=>x.type==='form').props.onSubmit(formEvent({title:'Biology paper',date:'2026-11-24',subject:'Biology'}));
 tree=h.render('CenterExams',props(s));assert.equal(s.data.workspace.exams.length,1);assert.match(text(tree),/3 days left/);assert.match(text(tree),/Exam date saved/);await button(tree,'Mark taken').props.onClick();tree=h.render('CenterExams',props(s));assert.equal(s.data.workspace.exams[0].status,'taken');assert.equal(s.data.workspace.exams[0].deletedAt,0);assert.match(text(tree),/record has been kept/);assert.equal(s.data.sessions.length,0);
});
test('habits save actual rules and manual check-ins can be added and undone without minutes',async()=>{
 const h=harness(),s=store();let tree=h.render('CenterHabits',props(s));const measure=all(tree).find(x=>x.type==='select'&&x.props.value==='minutes');measure.props.onChange({target:{value:'checkin'}});tree=h.render('CenterHabits',props(s));
 await all(tree).find(x=>x.type==='form').props.onSubmit(formEvent({title:'Review vocabulary'}));tree=h.render('CenterHabits',props(s));assert.equal(s.data.workspace.habits[0].target,1);assert.equal(s.data.workspace.habits[0].kind,'checkin');await button(tree,'Check in today').props.onClick();tree=h.render('CenterHabits',props(s));assert.equal(s.data.workspace.habits[0].checks[today].checked,true);assert.match(text(tree),/Goal reached/);await button(tree,'Undo today').props.onClick();assert.equal(s.data.workspace.habits[0].checks[today].checked,false);assert.equal(s.data.sessions.length,0);
});
test('automatic study goals do not offer a manual progress button',async()=>{
 const h=harness(),s=store();let tree=h.render('CenterHabits',props(s));await all(tree).find(x=>x.type==='form').props.onSubmit(formEvent({title:'Study 25 minutes'}));tree=h.render('CenterHabits',props(s));assert.equal(s.data.workspace.habits[0].kind,'minutes');assert.equal(s.data.workspace.habits[0].target,25);assert.ok(!button(tree,'Check in today'));assert.equal(all(tree).find(x=>x.type==='progress').props.value,0);
});
test('a course and its outline save atomically; coverage and study actions work inline',async()=>{
 const h=harness(),s=store(),started=[];const p=()=>({...props(s),onStart:target=>started.push(target)});let tree=h.render('CenterCourses',p());await all(tree).find(x=>x.type==='form').props.onSubmit(formEvent({title:'Biology',subject:'Science',topics:'Cells\n  Membranes\n  Enzymes'}));
 tree=h.render('CenterCourses',p());assert.equal(s.calls.length,1);assert.equal(s.calls[0].type,'plan-save');assert.equal(s.data.workspace.plans[0].chapters.length,3);assert.match(text(tree),/0 \/ 2 topics covered/);const check=all(tree).find(x=>x.type==='input'&&x.props.type==='checkbox');await check.props.onChange({target:{checked:true}});tree=h.render('CenterCourses',p());assert.match(text(tree),/1 \/ 2 topics covered/);button(tree,'Start this topic').props.onClick();assert.equal(started[0].planId,s.data.workspace.plans[0].id);assert.equal(started[0].mode,'study');assert.equal(s.data.sessions.length,0);
});
test('adding topics to a course preserves existing records and rejects stale course changes',async()=>{
 const s=store();await s.command('plan-save',{title:'Maths',chapters:[],subjects:[]});const h=harness();let tree=h.render('CenterCourses',props(s));const form=all(tree).find(x=>x.type==='form');s.data.workspace.plans[0]={...s.data.workspace.plans[0],updatedAt:s.data.workspace.plans[0].updatedAt+1};await form.props.onSubmit(formEvent({topics:'Algebra',subject:'Maths'}));tree=h.render('CenterCourses',props(s));assert.match(text(tree),/This course changed/);assert.equal(s.calls.length,1);assert.equal(s.data.workspace.plans[0].chapters.length,0);
 const fresh=harness();tree=fresh.render('CenterCourses',props(s));await all(tree).find(x=>x.type==='form').props.onSubmit(formEvent({topics:'Algebra',subject:'Maths'}));assert.equal(s.data.workspace.plans.length,1);assert.equal(s.data.workspace.plans[0].chapters[0].title,'Algebra');
});
test('failed saves retain inputs and repeat submissions cannot create duplicate plans',async()=>{
 const s=store(),h=harness();let resolve;const real=s.command.bind(s);s.command=async(...args)=>{await new Promise(r=>resolve=r);return real(...args);};let tree=h.render('CenterCourses',props(s));const form=all(tree).find(x=>x.type==='form'),event=formEvent({title:'Course',topics:'First topic',subject:''});const saving=form.props.onSubmit(event);await form.props.onSubmit(event);await new Promise(r=>setImmediate(r));resolve();await saving;assert.equal(s.calls.length,1);
 const failure=harness();s.command=async()=>null;tree=failure.render('CenterExams',props(s));const exam=formEvent({title:'Keep this draft',date:'2026-11-24'});await all(tree).find(x=>x.type==='form').props.onSubmit(exam);assert.equal(exam.currentTarget.elements.namedItem('title').value,'Keep this draft');assert.match(text(failure.render('CenterExams',props(s))),/Not saved/);
});
