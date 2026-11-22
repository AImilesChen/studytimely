"""Validate the design example; never calls a model or modifies account data."""
from pathlib import Path
import json
from datetime import date

HERE=Path(__file__).parent
data=json.loads((HERE/'example-data.json').read_text(encoding='utf-8'))
def finding(id,section,observation,evidence,interpretation,uncertainty,recommendation,check):
 return dict(id=id,section_id=section,observation=observation,evidence_refs=evidence,interpretation=interpretation,uncertainty=uncertainty,recommendation=recommendation,check_next_week=check)
findings=[
 finding('F1','goals_actual','Saved study was 420 minutes against a stable 480-minute target. The original task plan has six of eight tasks completed.',['E01','E02','E03'],
  'The next week has less entered availability than this week. Reusing the old target would create a commitment that does not fit the supplied windows.',
  'A time shortfall does not establish its cause or prove less learning. The next-week time commitment is a user choice, not an AI-set goal.',
  'Review the old target alongside the candidate plan: it commits 255 study minutes and keeps 45 minutes unallocated. Confirm a realistic new target before saving.',
  'At the next review, compare recorded study with the target the user actually accepted, and show any changes made during the week.'),
 finding('F2','allocation','Maths has 270 recorded minutes and Biology 150. The next dated exam is Biology on 20 November; three selected Biology tasks need an estimated 135 minutes.',['E04','E06'],
  'Subject time does not need to be equal. The imminent entered deadline provides a concrete reason to protect the selected Biology work first.',
  'The report cannot know whether those tasks cover the entire exam syllabus or whether Biology is a weak subject.',
  'Keep B4, B5 and B6 in the candidate plan before the exam date; review the lower-priority Maths work for deferral.',
  'Check whether B4, B5 and B6 were completed before the entered exam date; do not convert that status into an exam-readiness score.'),
 finding('F3','execution','Three completed, linked Maths tasks have 90 initial estimated minutes and 135 recorded lifetime minutes through cutoff: 45 minutes more, or 50%.',['E05'],
  'For this sample, an average 30-minute estimate corresponded to 45 recorded minutes. Similar next tasks may need a larger estimate or smaller scope.',
  'Only three matched tasks are represented. Missing estimates and unfinished tasks are excluded; this is not a 50% prediction for all future Maths work.',
  'For the next comparable practice task, try an editable 40-50 minute estimate or two smaller parts. Check remaining work after the first part.',
  'Compare the next dated, completed task with its original estimate and recorded effort, keeping the same matching rules.'),
 finding('F4','capacity','The candidate task list requires 420 minutes. The five entered weekday windows provide 300 study minutes after breaks.',['E06'],
  'The list exceeds capacity by 120 minutes even before keeping any buffer. The selected candidate keeps 255 minutes of priorities and 45 minutes unallocated.',
  'Remaining work is user-estimated. The exam has a date but no start time, so the candidate does not assume exam-day Biology preparation capacity.',
  'Defer the optional M6 and M7 tasks, releasing 165 minutes while preserving them in the task list. Review the candidate rather than adding unavailable time.',
  'Check whether the accepted priorities and buffer were workable, and refresh the draft if availability or remaining work changed.'),
 finding('F5','follow_up','Of two explicitly accepted previous actions, A1 links to completed task M3 and A2 to open task B4 with 45 estimated minutes remaining.',['E07'],
  'The completed action should not be proposed as new work. The unfinished linked task is a concrete candidate for the next plan.',
  'Accepted action status does not show that advice caused a learning improvement. Unlinked tasks must not be counted as followed advice.',
  'Carry B4 into Monday while preserving its existing task identity and recorded work; do not recreate M3.',
  'At the next report, inspect the dated completion or updated remaining-work feedback for B4.'),
 finding('F6','follow_up','Four complete-week saved-time totals are 240, 300, 420 and 420 minutes under the same scope.',['E08'],
  'Recorded time rose and then stayed level. The next decision should account for deadlines and task completion rather than aim for a longer bar by default.',
  'A flat time total is not evidence of stalled understanding. These figures do not identify a cause or an optimal study duration.',
  'Keep the manageable rhythm if it suits the user; review the smaller next-week commitment against the time actually available.',
  'Review the same-scope time trend together with dated completion and estimate accuracy, not as a standalone learning-quality score.')]
output={'version':2,'scope_ref':data['scope_ref'],'analysis_status':'full',
 'overview':{'headline':'A steady week. A smaller next plan.','summary':'Protect the next dated deadline, allow room for similar tasks that took longer than estimated, and make the next plan fit the entered availability.','priority_ids':['F2','F3','F4']},
 'findings':findings,
 'sections':[{'id':s,'status':'available','finding_ids':[f['id'] for f in findings if f['section_id']==s],'unavailable_reason':''} for s in ['goals_actual','allocation','execution','capacity','follow_up']],
 'next_plan':{'candidate_id':'plan-001','explanation':'Keep the three Biology preparation tasks before the exam date, then retain the two selected Maths priorities. Reserve buffer instead of filling every available study minute.',
 'tradeoffs':['M6 optional practice and M7 note rewriting are deferred, not deleted.','The previous weekly target needs separate review; accepting a task plan does not silently change the target.'],
 'fallbacks':['If priority work remains after Wednesday, review Thursday before adding unavailable time.','Refresh the draft if the entered availability, task status or remaining-work estimates change.'],
 'evidence_refs':['E06']},'follow_up_status':'available',
 'unknowns':['Exam start time was not provided.','Remaining work is estimated, not guaranteed.','The records do not measure grades, attention or mastery.']}
schema=json.loads((HERE/'report-output.schema.json').read_text(encoding='utf-8'))
try:
 from jsonschema import Draft202012Validator
 Draft202012Validator.check_schema(schema)
 Draft202012Validator(schema).validate(output)
 schema_status='draft2020-12 schema and example passed'
except ImportError:
 schema_status='JSON structure/reference checks only; jsonschema package unavailable'

allowed_evidence={f'E{i:02}' for i in range(1,9)}
assert all(set(f['evidence_refs'])<=allowed_evidence for f in findings)
assert len({f['id'] for f in findings})==len(findings)
assert set(output['overview']['priority_ids'])<={f['id'] for f in findings}
assert output['next_plan']['candidate_id']==data['next_week']['candidate_plan_id']
assert len({s['id'] for s in output['sections']})==5
assert all(s['finding_ids'] for s in output['sections'])
tasks={t['id']:t for t in data['next_week']['candidates']}
assert all(p['task'] in tasks for p in data['plan'])
assert all(tasks[p['task']]['minutes']==p['focus'] for p in data['plan'])
def mins(value):h,m=map(int,value.split(':'));return 60*h+m
for p in data['plan']:
 parts=[x.strip() for x in p['slots'].split('+')]
 spans=[tuple(map(mins,v.split('-'))) for v in parts]
 assert sum(b-a for a,b in spans)==p['focus']
 assert all(18*60<=a<b<=19*60+10 for a,b in spans)
 assert all(spans[i+1][0]-spans[i][1]>=10 for i in range(len(spans)-1))
 if p['subject']=='Biology':assert date(2026,11,int(p['day'].split()[1]))<date.fromisoformat(data['next_week']['exam_date'])
assert sum(p['focus']+p['buffer'] for p in data['plan'])==300
assert output['scope_ref']==data['scope_ref']
(HERE/'example-model-output.json').write_text(json.dumps(output,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'schema':schema_status,'reference_checks':'passed','candidate_slots_and_breaks':'passed','live_provider_called':False}))
