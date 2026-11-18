import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlanningSandbox} from '../src/lib/planning-sandbox.mjs';
import {studyPlanDetail,studyTaskGroups} from '../src/lib/planning-plan-view.mjs';
import {studyTaskPage,preferredStudyTask,studyDetailTitle,studyTaskAction,studyGroupTypes} from '../src/lib/planning-task-detail.mjs';

const now=Date.parse('2026-11-18T12:00Z');
function example(){const source=createPlanningSandbox(now,'UTC','prep').data,prep=source.workspace.planning.examPlans[0],detail=studyPlanDetail(source,prep.id,now);return {source,groups:studyTaskGroups(detail.rows,prep)};}

test('topic pagination stays at five rows, clamps changed page counts and searches hidden task names',()=>{
 const {source,groups}=example(),before=JSON.stringify(source),many=Array.from({length:12},(_,i)=>({...groups[0],id:'topic-'+i,title:'Chapter '+i,rows:groups[0].rows.map(r=>({...r,task:{...r.task,title:i===10?'Essay revision':r.task.title}}))}));
 assert.equal(studyTaskPage(many).rows.length,5);assert.equal(studyTaskPage(many).pages,3);assert.equal(studyTaskPage(many,{page:2}).rows.length,2);assert.equal(studyTaskPage(many,{page:99}).page,2);assert.equal(studyTaskPage(many,{page:-1}).page,0);
 const result=studyTaskPage(many,{query:'essay',page:2});assert.equal(result.total,1);assert.equal(result.page,0);assert.equal(result.rows[0].id,'topic-10');assert.equal(studyTaskPage(many,{query:'not found'}).start,0);assert.equal(JSON.stringify(source),before);
});

test('drawer selection respects the type filter, explicit user selection and active or pending-feedback work',()=>{
 const {groups}=example(),g=groups[0],review=g.rows.find(r=>r.prep.stage==='review');
 assert.equal(preferredStudyTask(g,'','review').task.id,review.task.id);assert.equal(preferredStudyTask(g,g.rows[0].task.id,'review').task.id,g.rows[0].task.id);
 const active={...g,rows:g.rows.map(r=>r.task.id===review.task.id?{...r,state:'active'}:r)};assert.equal(preferredStudyTask(active).task.id,review.task.id);
 active.rows.find(r=>r.task.id===review.task.id).state='feedback';assert.equal(preferredStudyTask(active).state,'feedback');assert.equal(preferredStudyTask({rows:[]}),null);
});

test('drawer labels shorten generated repetition while retaining names the learner actually edited',()=>{
 const {groups}=example(),g=groups[0];assert.equal(studyDetailTitle(g.rows[0],g),'Study new content');assert.equal(studyDetailTitle(g.rows[1],g),'Review 1');
 const renamed={...g.rows[0],task:{...g.rows[0].task,title:'Read the worked examples'}};assert.equal(studyDetailTitle(renamed,g),'Read the worked examples');
 const paper=groups.at(-1);assert.equal(studyDetailTitle(paper.rows[0],paper),'Mock exam');assert.equal(studyDetailTitle(paper.rows[1],paper),'Corrections');
});

test('fixed drawer actions preserve continue/feedback states, pause restrictions and explicit completion',()=>{
 const {source,groups}=example(),before=JSON.stringify(source),r=groups[0].rows[0];
 assert.deepEqual(studyTaskAction(r,{demo:true}),{type:'start',label:'Simulate start'});assert.equal(studyTaskAction(r).label,'Start learning');
 assert.equal(studyTaskAction(r,{paused:true}).type,'none');assert.equal(studyTaskAction({...r,state:'active'},{paused:true}).type,'session');assert.equal(studyTaskAction({...r,state:'feedback'},{paused:true}).label,'Save feedback');
 assert.equal(studyTaskAction({...r,task:{...r.task,done:true}}).label,'Completed');assert.equal(studyTaskAction({...r,state:'omitted'}).label,'Left out');assert.equal(studyTaskAction({...r,next:null,remaining:null}).type,'edit');assert.equal(studyTaskAction({...r,next:null,remaining:0}).type,'edit');assert.equal(studyTaskAction({...r,next:null}).type,'arrange');assert.equal(JSON.stringify(source),before);assert.equal(source.sessions.length,0);
});

test('topic type labels retain study and review identities across completion and omit excluded work',()=>{
 const {source,groups}=example(),before=JSON.stringify(source),topic=groups[0],paper=groups.at(-1);
 assert.deepEqual(studyGroupTypes(topic),[{kind:'study',count:1},{kind:'review',count:1}]);
 assert.deepEqual(studyGroupTypes(paper),[{kind:'mock',count:1},{kind:'corrections',count:1}]);
 const completed={...topic,rows:topic.rows.map(row=>({...row,state:'complete',task:{...row.task,done:true}}))};assert.deepEqual(studyGroupTypes(completed),studyGroupTypes(topic));
 assert.deepEqual(studyGroupTypes({...topic,rows:topic.rows.map(row=>({...row,state:'omitted'}))}),[]);
 assert.deepEqual(studyGroupTypes({rows:[]}),[]);assert.equal(JSON.stringify(source),before);
});
