import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {emptyState,transition} from '../src/lib/model.mjs';
import {analysisRange,studyAnalysis,newReview} from '../src/lib/study-analysis.mjs';
const require=createRequire(import.meta.url),now=Date.parse('2026-11-21T12:00:00Z');
const compiled=await build({entryPoints:['src/components/CenterReview.jsx'],absWorkingDir:fileURLToPath(new URL('../',import.meta.url)),bundle:true,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime'],write:false,logLevel:'silent'});
function harness(){const cells=[];let cursor=0;const hooks={useState(initial){const i=cursor++;if(!(i in cells))cells[i]=typeof initial==='function'?initial():initial;return[cells[i],v=>cells[i]=typeof v==='function'?v(cells[i]):v];},useRef(initial){return cells[cursor++]??={current:initial};},useMemo(fn){return fn();},useEffect(){}};class Fields{constructor(form){this.form=form;}get(name){return this.form[name]??null;}}const mod={exports:{}};new Function('require','module','exports','FormData','window',compiled.outputFiles[0].text)(id=>id==='react'?hooks:require(id),mod,mod.exports,Fields,{confirm:()=>true});return{render(props){cursor=0;return mod.exports.CenterReview(props);}};}
function all(tree){if(tree==null||typeof tree!=='object')return[];if(Array.isArray(tree))return tree.flatMap(all);return[tree,...all(tree.props?.children)];}
function text(tree){if(tree==null||typeof tree==='boolean')return'';if(typeof tree!=='object')return String(tree);if(Array.isArray(tree))return tree.map(text).join('');return text(tree.props?.children);}
const button=(tree,label)=>all(tree).find(x=>x.type==='button'&&text(x).includes(label));
function store(){let id=0;return{ready:true,hasPending:false,data:emptyState('review'),calls:[],async command(type,payload){this.calls.push({type,payload});const result=transition(this.data,{type,...payload,epoch:this.data.epoch},{now,owner:'test',id:'review-'+(++id)});this.data=result.state;return result;}};}
const props=(s,patch={})=>({store:s,source:s.data,report:studyAnalysis(s.data,analysisRange({period:'week',zone:'UTC',now})),now,access:{active:true,status:'ready'},...patch});

test('review notes and their snapshot save atomically without starting a timer or adding study credit',async()=>{
 const s=store(),h=harness();let tree=h.render(props(s));all(tree).find(x=>x.type==='textarea').props.onChange({target:{value:'A short task helped.'}});tree=h.render(props(s));await button(tree,'Save private review').props.onClick();tree=h.render(props(s));assert.equal(s.data.workspace.learning.reviews.length,1);assert.equal(s.data.workspace.learning.reviews[0].good,'A short task helped.');assert.equal(s.data.workspace.learning.reviews[0].snapshot.total,0);assert.equal(s.data.timer,null);assert.equal(s.data.sessions.length,0);assert.match(text(tree),/Review saved privately/);
});
test('filters cannot silently replace a dirty review snapshot; stale edits retain notes',async()=>{
 const s=store(),h=harness();const report=props(s).report,review=newReview(report,s.data,'week',now);await s.command('review-save',{review});let tree=h.render(props(s));all(tree).find(x=>x.type==='select').props.onChange({target:{value:s.data.workspace.learning.reviews[0].id}});tree=h.render(props(s));all(tree).find(x=>x.type==='textarea').props.onChange({target:{value:'Keep this draft'}});s.data.workspace.learning.reviews[0]={...s.data.workspace.learning.reviews[0],updatedAt:now+1,good:'Changed elsewhere'};
 const other=studyAnalysis(s.data,analysisRange({period:'last-week',zone:'UTC',now}));tree=h.render(props(s,{report:other}));assert.match(text(tree),/filters above show a different view/);await button(tree,'Save review changes').props.onClick();tree=h.render(props(s,{report:other}));assert.equal(all(tree).find(x=>x.type==='textarea').props.value,'Keep this draft');assert.equal(s.data.workspace.learning.reviews[0].good,'Changed elsewhere');assert.match(text(tree),/changed|not saved/i);
});
test('access, demo and unapplied dates prevent review writes while retained notes remain readable',async()=>{
 for(const patch of [{demo:true},{access:{active:false,status:'ready'}},{datesPending:true}]){const s=store(),h=harness();const tree=h.render(props(s,patch));const save=button(tree,'Save private review');assert.equal(save.props.disabled,true);await save.props.onClick();assert.equal(s.calls.length,0);}
 const s=store(),review=newReview(props(s).report,s.data,'week',now);review.good='Retained note';await s.command('review-save',{review});const h=harness();let tree=h.render(props(s,{access:{active:false,status:'ready'}}));all(tree).find(x=>x.type==='select').props.onChange({target:{value:s.data.workspace.learning.reviews[0].id}});tree=h.render(props(s,{access:{active:false,status:'ready'}}));assert.equal(all(tree).find(x=>x.type==='textarea').props.value,'Retained note');assert.equal(all(tree).find(x=>x.type==='textarea').props.readOnly,true);
});
test('review save failure keeps its draft and double submission creates one snapshot',async()=>{
 const s=store(),h=harness();let release;const real=s.command.bind(s);s.command=async(...args)=>{await new Promise(r=>release=r);return real(...args);};let tree=h.render(props(s));const save=button(tree,'Save private review'),first=save.props.onClick();await save.props.onClick();release();await first;assert.equal(s.calls.length,1);
 const fail=store(),editor=harness();tree=editor.render(props(fail));all(tree).find(x=>x.type==='textarea').props.onChange({target:{value:'Keep my reflection'}});fail.command=async()=>null;tree=editor.render(props(fail));await button(tree,'Save private review').props.onClick();tree=editor.render(props(fail));assert.equal(all(tree).find(x=>x.type==='textarea').props.value,'Keep my reflection');assert.match(text(tree),/draft is still here/);
});
test('a next task is an explicit separate action and does not modify the saved review or minutes',async()=>{
 const s=store(),h=harness();let reset=false;const tree=h.render(props(s)),form=all(tree).find(x=>x.type==='form');await form.props.onSubmit({preventDefault(){},currentTarget:{title:'Practise five questions',plannedDate:'2026-11-22',minutes:'25',reset(){reset=true;}}});assert.equal(s.calls[0].type,'task-save');assert.equal(s.data.workspace.tasks[0].plannedDate,'2026-11-22');assert.equal(s.data.workspace.learning.reviews.length,0);assert.equal(s.data.sessions.length,0);assert.equal(reset,true);
});
