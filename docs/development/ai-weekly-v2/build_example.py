"""Reviewable V2 report format, fictional facts, and matching HTML/PDF example.

Design artifacts only. This does not change the app or invoke DeepSeek.
Run with the bundled Python (reportlab and pypdf).
"""
from pathlib import Path
from html import escape
import json
from datetime import date, timedelta
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'docs/development/evidence/ai-weekly-v2-2026-11-22'
PDF=OUT/'output/pdf/StudyTimely-Detailed-AI-Weekly-Example.pdf'
OUT.mkdir(parents=True,exist_ok=True);PDF.parent.mkdir(parents=True,exist_ok=True)

# Deliberately fictional. Stable anonymous task IDs can be mapped locally by the UI.
DATA={
 'kind':'fictional_example','runtime_connected':False,
 'week':{'start':'2026-11-09','end':'2026-11-15','zone':'Europe/London','complete':True,'snapshot_at':'2026-11-16T07:00:00Z'},
 'weekly_goal_minutes':480,'previous_minutes':420,
 'days':[{'date':str(date(2026,11,9)+timedelta(days=i)),'minutes':v} for i,v in enumerate([65,70,75,70,70,70,0])],
 'sessions':12,'subjects':[{'name':'Maths','minutes':270},{'name':'Biology','minutes':150}],
 'planned_at_week_start':8,'completed_from_baseline':6,'added_midweek':0,'completion_dates_unknown':0,
 'matched_completed_tasks':[
  {'id':'M1','estimate_minutes':25,'recorded_minutes':40},
  {'id':'M2','estimate_minutes':30,'recorded_minutes':45},
  {'id':'M3','estimate_minutes':35,'recorded_minutes':50}],
 'open_tasks':[{'id':'M4','recorded_minutes':135,'remaining_minutes':60},{'id':'B4','recorded_minutes':75,'remaining_minutes':45}],
 'four_weeks_minutes':[240,300,420,420],
 'next_week':{'start':'2026-11-16','end':'2026-11-22','gross_weekday_window':'18:00-19:10','planned_break_minutes_per_day':10,'available_study_minutes_per_day':60,'available_days':['Mon','Tue','Wed','Thu','Fri'],'weekend_available':False,'exam_date':'2026-11-20','exam_subject':'Biology','exam_time':None,
 'candidates':[{'id':'B4','subject':'Biology','minutes':45,'label':'Finish transport recap','priority':'exam'}, {'id':'B5','subject':'Biology','minutes':45,'label':'Review the next exam topic','priority':'exam'},{'id':'B6','subject':'Biology','minutes':45,'label':'Complete exam-question practice','priority':'exam'},{'id':'M4','subject':'Maths','minutes':60,'label':'Finish the current practice set','priority':'deadline'},{'id':'M5','subject':'Maths','minutes':60,'label':'Review the recorded error list','priority':'deadline'},{'id':'M6','subject':'Maths','minutes':90,'label':'Extra optional practice set','priority':'optional'},{'id':'M7','subject':'Maths','minutes':75,'label':'Rewrite the course notes','priority':'optional'}]},
 'previous_actions':[{'id':'A1','task_id':'M3','label':'Complete functions practice','status':'completed','completed_date':'2026-11-11'},{'id':'A2','task_id':'B4','label':'Finish transport recap','status':'in_progress','completed_date':None}],
 'plan':[{'day':'Mon 16','subject':'Biology','task':'B4','focus':45,'buffer':15,'slots':'18:00-18:45'}, {'day':'Tue 17','subject':'Biology','task':'B5','focus':45,'buffer':15,'slots':'18:00-18:45'},{'day':'Wed 18','subject':'Biology','task':'B6','focus':45,'buffer':15,'slots':'18:00-18:45'},{'day':'Thu 19','subject':'Maths','task':'M4','focus':60,'buffer':0,'slots':'18:00-18:30 + 18:40-19:10'},{'day':'Fri 20','subject':'Maths','task':'M5','focus':60,'buffer':0,'slots':'18:00-18:30 + 18:40-19:10'}]
}
DATA['scope_ref']='fictional-weekly-v2-20261115-London'
DATA['next_week']['candidate_plan_id']='plan-001'
DATA['next_week']['locked_blocks']=[]
TOTAL=sum(d['minutes'] for d in DATA['days']);CAPACITY=5*60
REQUIRED=sum(t['minutes'] for t in DATA['next_week']['candidates'])
FOCUS=sum(p['focus'] for p in DATA['plan']);BUFFER=sum(p['buffer'] for p in DATA['plan'])
assert TOTAL==420==sum(s['minutes'] for s in DATA['subjects'])
assert FOCUS==255 and BUFFER==45 and FOCUS+BUFFER==CAPACITY
assert REQUIRED==420 and REQUIRED-CAPACITY==120 and REQUIRED-FOCUS==165
assert sum(t['recorded_minutes'] for t in DATA['matched_completed_tasks'])==135
assert sum(t['estimate_minutes'] for t in DATA['matched_completed_tasks'])==90
assert (135-90)/90==.5
assert all(p['focus']+p['buffer']==60 for p in DATA['plan'])
assert all(p['day'].split()[0] in DATA['next_week']['available_days'] for p in DATA['plan'])
assert date(2026,11,20).weekday()==4
assert {p['task'] for p in DATA['plan']}=={'B4','B5','B6','M4','M5'}

def para(text):return {'type':'paragraph','text':text}
def heading(n,title):return {'type':'heading','number':n,'title':title}
def note(label,text):return {'type':'note','label':label,'text':text}
def table(headers,rows,widths=None):return {'type':'table','headers':headers,'rows':rows,'widths':widths}

PAGES=[
 {'eyebrow':'01 / YOUR WEEK, EXPLAINED','title':'A steady week. A smaller next plan.','blocks':[
  para('You saved seven hours across six study days. The important next move is to make your upcoming workload fit the time you actually have, while protecting preparation for Friday\'s Biology exam.'),
  {'type':'metrics','items':[['Saved study','7h 00m'],['Weekly goal','8h 00m'],['Planned tasks done','6 / 8'],['Study days','6 / 7']]},
  heading('01','Three decisions worth taking away'),
  note('Keep','Keep the six-day rhythm if it suits you. Your recorded study days were close in length: 65-75 minutes. There is no need to make every day longer simply to make the chart look better.'),
  note('Adjust','Allow more room for similar Maths tasks. Three completed, linked tasks took 135 minutes against 90 estimated minutes. Treat that as a planning signal for these tasks, not a judgement of your ability.'),
  note('Prioritise','Protect 135 minutes of Biology preparation before the exam date. Your original next-week list needs 420 minutes, but your entered availability supports 300 minutes. Review what to defer before adding work.'),
  heading('02','Goals and the study you saved'),
  {'type':'daily_chart'},
  table(['Measure','This week','Comparison'],[['Saved study','420 min','420 min previously: unchanged'],['Weekly target','480 min','60 min short; 87.5% reached'],['Baseline planned tasks','8','6 completed; 2 still open'],['Dated completions missing','0','No unknown dates in this example']], [170,105,240]),
  para('The time target was set before this week and stayed unchanged. Missing an hour does not tell us why the target was missed. The records do not measure learning quality, attention or grades.'),
  {'type':'source','text':'Basis: E01 daily totals; E02 target history; E03 baseline task/completion snapshot. Full fictional-data scope is on page 4.'}
 ]},
 {'eyebrow':'02 / WHERE THE PLAN NEEDS ADJUSTMENT','title':'Give the next deadline enough room.','blocks':[
  heading('03','Subject time in the context of your next goal'),
  {'type':'subjects'},
  para('Maths received 270 minutes (64.3%) and Biology 150 minutes (35.7%). This split is not automatically a problem: equal time is not a requirement. It matters now because your next dated exam is Biology on Friday 20 November, and three selected preparation tasks still need an estimated 135 minutes.'),
  para('The draft on page 3 reserves those three tasks first, then keeps two Maths priorities. It does not claim Biology is a weak subject or that more hours will guarantee exam readiness. Review the priorities against what your teacher or course actually requires.'),
  heading('04','Why similar tasks may need a larger estimate'),
  table(['Completed task','Initial estimate','Recorded effort','Difference'],[['Maths M1','25 min','40 min','+15 min'],['Maths M2','30 min','45 min','+15 min'],['Maths M3','35 min','50 min','+15 min'],['Matched sample total','90 min','135 min','+45 min (+50%)']], [155,120,120,120]),
  para('For these three tasks, an average 30-minute estimate corresponded to 45 recorded minutes. For the next comparable practice task, try an editable 40-50 minute estimate, or split the work into two smaller parts. Check what remains after the first part rather than automatically extending every session.'),
  para('The sample contains only three completed tasks with both an original estimate and linked records. It excludes unfinished work and tasks with missing estimates. The recorded effort is lifetime effort through the cutoff, not a claim that all future Maths work takes 50% longer. The cause of the mismatch is unknown.'),
  heading('05','What fits before the next deadline'),
  table(['Entered next-week capacity','Minutes'],[['Five weekday windows: 18:00-19:10','350 gross'],['Planned breaks: 10 min each day','-50'],['Available study capacity','300'],['Current candidate task list','420'],['Minimum gap before adding buffer','120']], [365,150]),
  para('The proposed plan schedules 255 study minutes and leaves 45 minutes unallocated for work that runs over. That means deferring 165 minutes, rather than only the bare 120-minute gap. The exam time was not entered, so Biology preparation is placed before the exam date; no exam-day preparation time is assumed.'),
  {'type':'source','text':'Basis: E04 subject totals; E05 three matched task estimates; E06 next-week availability, breaks, task remaining-time estimates and exam date. Remaining time is user-estimated, not predicted by AI.'}
 ]},
 {'eyebrow':'03 / A PLAN YOU CAN REVIEW','title':'Five priorities. Forty-five minutes of room.','blocks':[
  heading('06','Your proposed next-week plan'),
  para('This draft schedules 255 study minutes plus 45 minutes of buffer. It does not automatically change the previous 480-minute weekly target: review that target against this smaller commitment. Confirm the deadline, remaining-work estimates and availability before saving.'),
  table(['Day','Task / purpose','Study','Buffer'],[['Mon 16','Biology B4: finish transport recap','45 min','15 min'],['Tue 17','Biology B5: next exam topic','45 min','15 min'],['Wed 18','Biology B6: exam-question practice','45 min','15 min'],['Thu 19','Maths M4: finish current set','60 min','0'],['Fri 20','Maths M5: review error list','60 min','0'],['Total','5 selected tasks','255 min','45 min']], [67,275,85,88]),
  para('For each 45-minute Biology block, use 18:00-18:45; the entered 10-minute break leaves 15 minutes as unscheduled room. Each 60-minute Maths allocation is split into 18:00-18:30 and 18:40-19:10, with a 10-minute break. Saturday and Sunday remain unscheduled because no availability was entered.'),
  table(['Defer for your review','Time released','Why'],[['M6: extra optional practice','90 min','Lower priority than the entered deadline work'],['M7: rewrite course notes','75 min','Optional in this task list; keep original task'],['Total deferred','165 min','No tasks are deleted']], [205,95,215]),
  note('If work runs over','Use the available buffer first. If Biology still has unfinished preparation after Wednesday, review Thursday\'s Maths allocation before adding time you have not entered. The report cannot know whether your remaining-time estimate covers everything needed for the exam.'),
  note('When you accept','Review the draft in place, then explicitly save the selected changes. The draft is not a commitment until you accept it. Keep any existing commitments you cannot move; review a fresh draft if your free time changes.'),
  heading('07','What happened to the previous suggestions?'),
  table(['Previously accepted action','Recorded status','This report\'s response'],[['A1: complete functions practice','Done 11 Nov (M3)','Do not suggest it as new work'],['A2: finish transport recap','Open (B4); 45 min remaining','Carry it into Monday\'s draft']], [200,150,165]),
  para('One accepted action was completed; one is still in progress. This is follow-through on linked tasks, not proof that an AI suggestion caused better learning. The relationship exists only because these fictional tasks were explicitly linked to a previous report.'),
  {'type':'source','text':'Basis: E06 reviewed candidate plan; E07 accepted-action/task links and dated task status. This fictional example illustrates linked follow-through, not an actual user history.'}
 ]},
 {'eyebrow':'04 / WHAT TO CHECK NEXT','title':'Make the next review easier to act on.','blocks':[
  heading('07','Follow-up continued: the longer view'),
  {'type':'weeks'},
  para('Across the four recorded weeks, saved study rose from 4 to 5 to 7 hours, then stayed at 7 hours. The latest week is a plateau in recorded time, not evidence of stalled understanding. Use completion and estimate accuracy alongside the time chart rather than chasing a longer bar.'),
  table(['Check at the next review','What it tells you'],[['Were the three Biology priorities completed before the exam date?','Whether the selected deadline work was finished; not an exam-readiness score'],['How close were the next comparable task estimates?','Whether the 40-50 minute trial estimate was useful for this kind of work'],['Was 255 min + 45 min buffer workable?','Whether the next plan needs fewer tasks or more realistic remaining-time estimates']], [260,255]),
  heading('08','Evidence and limits'),
  table(['Evidence','What this example includes'],[['E01 / E02','12 saved sessions; all 7 calendar dates; 6 study days; a stable 480-minute weekly target'],['E03','8 tasks at the week-start baseline; 6 dated completions; 0 midweek additions; 0 unknown completion dates'],['E04 / E05','Subject totals; 3 completed tasks with initial estimates and linked recorded effort'],['E06','User-entered next-week windows, breaks, remaining work, selected priorities and a date-only Biology exam'],['E07 / E08','Two prior accepted-action links; four complete-week totals using consistent scope']], [100,415]),
  para('All figures, task references, task names, exam details and action history in this example are fictional. This is an AI-written format demonstration, not an analysis of your account or a live DeepSeek result. A real report should identify its saved week, cutoff and missing information just as clearly.'),
  para('Unrecorded study is not included. The 6/8 completion figure follows the original task baseline; the timing comparison covers only the three matched completed tasks. Next-week remaining-time values are your estimates. Check them if a task still seems too large.'),
  para('Saved time and self-marked completion do not establish grades, attention or mastery. A report can help you review a plan; it cannot tell whether the task list covers everything you need for an exam. Your private reflections remain separate from the generated analysis.'),
  note('Before your next review','After each priority session, check what remains and confirm completion when finished. At the next review, compare the linked tasks and their estimates with the plan you actually accepted. Keep the same saved report online or download it; the copy does not contain extra analysis.'),
  {'type':'source','text':'Review artifact only. No live model request, actual-user analysis, entitlement change, task write, deployment or purchase was performed.'}
 ]}
]

SPEC={
 'version':2,'status':'design_contract_not_runtime_implemented','language':'en','intent':'A grounded weekly decision aid, not a longer statistics paraphrase.',
 'reader_outcomes':['Understand the week without reading a long essay','Find 1-3 supported planning decisions','Review a feasible next-week draft','Track previously accepted recommendations'],
 'sections':[
  {'id':'executive','name':'本周最重要的结论','answers':'先保持什么、先改什么、下一周先做什么？','format':'one-screen overview, up to three evidence-linked decisions','required':True},
  {'id':'goals_actual','name':'目标与实际','answers':'与事先设定的目标和上个可比周期差多少？','format':'metric strip, daily chart, short interpretation','required':True},
  {'id':'allocation','name':'科目投入与近期重点','answers':'投入与已输入的目标、考试及剩余任务是否匹配？','format':'subject bars plus deadline-aware interpretation','required':False},
  {'id':'execution','name':'计划执行与估时偏差','answers':'哪些任务没做完？哪些同类任务估时明显不准？','format':'matched estimate/actual table, sample coverage, tentative adjustment','required':False},
  {'id':'capacity','name':'下周容量与截止日期','answers':'现有任务到底排不排得下？需要舍弃什么？','format':'availability/required-time/buffer table and explicit trade-off','required':False},
  {'id':'next_plan','name':'可审阅的下周安排','answers':'具体做什么，放在哪一天，遇到超时怎么调整？','format':'validated candidate schedule, keep/defer list, fallback action','required':True},
  {'id':'follow_up','name':'建议追踪与多周变化','answers':'上次采纳的建议做了没有？最近几周发生了什么变化？','format':'accepted-action status table and comparable trend','required':False},
  {'id':'evidence','name':'数据依据与分析边界','answers':'这些结论可信吗？有哪些没有记录？','format':'short coverage/unknowns notes; detailed audit at the end','required':True}],
 'reasoning_unit':{'observation':'What the verified record shows','evidence_refs':'Existing evidence IDs, visible sample size and time scope','interpretation':'Why this may matter to the stated goal; qualify unknown causes','action':'A concrete optional adjustment','check_next_week':'A measurable follow-up, without grading learning quality'},
 'output_contract':{'version':2,'analysis_status':['full','limited','insufficient'],'overview':'headline + 1-3 reasoning units','sections':'ordered section IDs with available/limited/unavailable states and evidence-linked prose','selected_plan_id':'must reference an application-validated candidate, not invented time slots','actions':'at most three priorities with stable recommendation IDs and supported task refs','unknowns':'explicit missing fields; do not replace missing values with zero'},
 'generation_pipeline':['Build bounded factual snapshots locally with an explicit cutoff/timezone','Compute metrics and generate deadline/availability-safe candidate plans with existing deterministic engines','Show eligible analysis areas and missing inputs before generation','Obtain explicit consent; preserve default subject anonymisation and exclusion of private notes/raw logs/task titles','DeepSeek receives whitelisted aggregates, stable anonymous references and approved candidate plans','Validate schema, evidence refs, quoted numbers, task IDs, candidate IDs and constraints; reject invalid output','Render an overview plus full sections and export the same saved content','Apply only after user confirmation; link accepted recommendation IDs to created or changed tasks','At the next report, evaluate linked status and comparable metrics without claiming causality'],
 'current_data_gaps':[
  {'item':'Original weekly target','state':'history exists but weekly AI pack currently sends only daily goal counts'},
  {'item':'Task-level estimate/effort pairs and week-start plan baseline','state':'local task history exists; current AI pack contains aggregate totals, not bounded task-level pairs'},
  {'item':'Exam deadline, availability, remaining work and candidate schedules','state':'planning/exam engines exist; not yet wired into weekly AI contract'},
  {'item':'Comparable four-week subject trends','state':'add bounded snapshots and stable anonymous subject mapping across weeks; previous-period AI facts currently contain only totals/counts/days'},
  {'item':'Recommendation adoption and follow-through','state':'add persistent recommendation-to-task links and dated status snapshots; not currently part of AI weekly data'}],
 'thin_data_policy':{'before_generation':'Explain which analyses are supported and what inputs are missing, without forcing a long onboarding form','limited_report':'Show a candid starting report; do not pad missing sections with generic encouragement','allowance':'Proposed: do not silently consume a full-depth report allowance for an insufficient-data summary; commercial policy still needs confirmation','first_report':'Previous-action section says no history; no invented previous advice'},
 'quality_gates':['Every priority includes evidence, a reason, an actionable adjustment and a next check','No invented attention/efficiency/mastery score, diagnosis, grades or guaranteed gains','Counts and comparisons use consistent scope; current weeks compare equal elapsed periods','No causation inferred from time or task status; subject allocation is not automatically imbalance','Matched estimates use completed, historically known tasks; state lifetime/period effort and n','Unknown task completion/goal/remaining-time history is excluded or labelled','Schedule accounts for breaks, locked/running blocks, deadlines and user availability; no automatic calendar write','Do not fabricate an optimal study method from time totals','Every exported finding and graph matches its saved online snapshot; reading/downloading uses no new AI call','Preview/mock/provider-produced labels remain distinct','Sparse input, inconsistent records, missing availability, first report, overdue exams and stale plans all need representative acceptance cases'],
 'layout':{'web':'single report, one clear download action, short overview followed by expanded analysis; no nested feature menu','print':'approximately 3-4 pages when data supports depth, reflow without truncation; do not pad to a page count','type':'serif short titles + readable sans body, figures aligned to common edges','colour':'existing warm paper, terracotta emphasis, ochre for comparisons, restrained apricot/honey annotations','prose':'detailed enough to explain decisions, concise within each section; never use word count as a substitute for value'},
 'release_limit':'This artifact does not change the current runtime, subscription pricing/allowance or public feature promises. Real DeepSeek configuration, trial output evaluation and cost measurement are still required.'}

HERE=Path(__file__).parent
(HERE/'report-contract.json').write_text(json.dumps(SPEC,ensure_ascii=False,indent=2),encoding='utf-8')
(HERE/'example-data.json').write_text(json.dumps(DATA,ensure_ascii=False,indent=2),encoding='utf-8')
(HERE/'example-report.json').write_text(json.dumps({'provenance':'AI-written illustrative content from fictional inputs; no live provider request','pages':PAGES},ensure_ascii=False,indent=2),encoding='utf-8')

def html_block(b):
 t=b['type'];e=escape
 if t=='paragraph':return '<p>'+e(b['text'])+'</p>'
 if t=='heading':return '<h2><small>'+e(b['number'])+'</small>'+e(b['title'])+'</h2>'
 if t=='source':return '<p class="source">'+e(b['text'])+'</p>'
 if t=='note':return '<aside><strong>'+e(b['label'])+'</strong><p>'+e(b['text'])+'</p></aside>'
 if t=='metrics':return '<dl class="metrics">'+''.join('<div><dt>'+e(a)+'</dt><dd>'+e(v)+'</dd></div>' for a,v in b['items'])+'</dl>'
 if t=='table':return '<div class="table-scroll"><table><thead><tr>'+''.join('<th scope="col">'+e(x)+'</th>' for x in b['headers'])+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+e(str(x))+'</td>' for x in row)+'</tr>' for row in b['rows'])+'</tbody></table></div>'
 if t=='daily_chart':
  return '<figure><figcaption>Daily saved study <span>minutes; not a learning-quality score</span></figcaption><div class="bars">'+''.join('<div><b>'+str(d['minutes'])+'m</b><div class="track"><i style="height:'+str(d['minutes']/75*100)+'%"></i></div><span>'+date.fromisoformat(d['date']).strftime('%a')+'</span></div>' for d in DATA['days'])+'</div></figure>'
 if t=='subjects':return '<figure><figcaption>Recorded time by subject</figcaption>'+''.join('<div class="subject"><span>'+e(s['name'])+'</span><b>'+str(s['minutes'])+' min</b><div><i style="width:'+str(s['minutes']/420*100)+'%"></i></div></div>' for s in DATA['subjects'])+'</figure>'
 if t=='weeks':return '<div class="weeks">'+''.join('<div><span>Week '+str(i+1)+'</span><strong>'+str(m//60)+'h</strong></div>' for i,m in enumerate(DATA['four_weeks_minutes']))+'</div>'
 raise ValueError(t)

css='''*{box-sizing:border-box}body{margin:0;color:#30251f;background:#f2f0e8;font:16px/1.75 Arial,sans-serif}header{max-width:980px;margin:auto;padding:28px 36px 18px;display:flex;justify-content:space-between;gap:24px;align-items:center}header b{font:700 23px Georgia,serif}header a{background:#ae4228;color:white;border-radius:7px;padding:10px 16px;font-size:14px;text-decoration:none;min-height:44px}.example{max-width:908px;margin:0 auto 24px;padding:12px 16px;border-left:3px solid #ae4228;background:#fae3d3;font-size:13px}main{max-width:980px;margin:auto;padding:0 36px 44px}.paper{background:#fffaf2;padding:32px 38px;margin:0 0 24px;border-top:3px solid #ae4228}.eyebrow{font-size:11px;color:#8b491f;font-weight:700;letter-spacing:.12em}h1{font:700 35px/1.15 Georgia,serif;letter-spacing:-.025em;margin:12px 0 18px}h2{font:700 23px/1.3 Georgia,serif;margin:27px 0 13px}h2 small{font:600 12px Arial;margin-right:12px;color:#a87817}p{margin:10px 0 14px}aside{padding:12px 16px;margin:12px 0;background:#faedc3;border-left:2px solid #b58a2b}aside p{margin:3px 0;font-size:14px;line-height:1.7}aside strong{color:#8b491f;font-size:13px}.metrics{display:grid;grid-template-columns:repeat(4,1fr);background:#fbe5d6;padding:18px 0;margin:22px 0}.metrics div{padding:0 16px;border-right:1px solid #d9b49d}.metrics div:last-child{border:0}dt{font-size:12px;color:#705146}dd{font-size:27px;font-weight:bold;margin:5px 0 0}.table-scroll{max-width:100%;overflow:auto}table{width:100%;border-collapse:collapse;text-align:left;font-size:13px;margin:12px 0}th{background:#fbe5d6;color:#705146;font-size:12px}th,td{padding:10px 12px;border-bottom:1px solid #dcc3b2;vertical-align:top}.source{font-size:11px;color:#705146;border-top:1px solid #dcc3b2;padding-top:14px;margin-top:20px}figure{margin:18px 0}figcaption{font-size:13px;font-weight:bold;margin-bottom:12px}figcaption span{font-weight:normal;color:#705146;margin-left:8px;font-size:11px}.bars{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:12px}.bars>div{text-align:center;font-size:12px}.bars b{font-size:11px}.track{height:80px;display:flex;align-items:end;border-bottom:1px solid #dcc3b2;margin:5px 10px}.track i{width:100%;background:#b94b2d;border-radius:3px 3px 0 0}.bars>div:nth-child(2n) i{background:#a87817}.subject{display:grid;grid-template-columns:1fr auto;font-size:13px;gap:5px 18px;margin:14px 0}.subject>div{grid-column:1/-1;height:8px;background:#fbe5d6}.subject i{display:block;height:100%;background:#b94b2d}.subject:nth-of-type(2n) i{background:#a87817}.weeks{display:grid;grid-template-columns:repeat(4,1fr);border-block:1px solid #dcc3b2;padding:15px 0}.weeks div{display:flex;flex-direction:column}.weeks span{font-size:12px;color:#705146}.weeks strong{font-size:27px}footer{color:#705146;font-size:11px;margin-top:24px}.meta{font-size:12px;color:#705146}@media(max-width:640px){header{padding:20px;display:block}header a{display:inline-block;margin-top:12px}.example{margin:0 16px 18px}main{padding:0 16px 26px}.paper{padding:22px 18px}h1{font-size:29px}h2{font-size:22px}.metrics{grid-template-columns:repeat(2,1fr);gap:16px 0}.metrics div:nth-child(2){border:0}.metrics dd{font-size:24px}table{min-width:480px}.bars{gap:3px}.track{margin:5px}.bars b{font-size:10px}}@media print{body{background:white;font-size:11px}header,.example{display:none}main{padding:0;max-width:none}.paper{padding:0;margin:0;break-after:page;border-top:2px solid #ae4228}.paper:last-child{break-after:auto}table{min-width:0;font-size:10px}h1{font-size:27px}h2{font-size:18px}aside,figure,tr{break-inside:avoid}*{print-color-adjust:exact}}'''
html='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Detailed AI weekly report - fictional format example</title><style>'+css+'</style><header><b>StudyTimely</b><a href="output/pdf/'+PDF.name+'" download>Download this example (PDF)</a></header><div class="example"><strong>FORMAT EXAMPLE - FICTIONAL DATA.</strong> AI-written illustrative content, not a live DeepSeek result or analysis of your account. No tasks or plans are changed.</div><main>'
for i,p in enumerate(PAGES):html+='<article class="paper"><div class="eyebrow">'+p['eyebrow']+'</div><h1>'+escape(p['title'])+'</h1><p class="meta">AI weekly study report · 9-15 Nov 2026 · Europe/London · Complete week</p>'+''.join(map(html_block,p['blocks']))+'<footer>Fictional example · AI-written format demonstration · '+str(i+1)+' / '+str(len(PAGES))+'</footer></article>'
html+='</main></html>';(OUT/'report-example.html').write_text(html,encoding='utf-8')

# Build the downloadable example from exactly the same content blocks.
for name,file in [('Body','arial.ttf'),('BodyBold','arialbd.ttf'),('Title','georgia.ttf')]:pdfmetrics.registerFont(TTFont(name,'C:/Windows/Fonts/'+file))
C=canvas.Canvas(str(PDF),pagesize=(595.28,841.89),pageCompression=1)
C.setTitle('StudyTimely detailed AI weekly report - fictional example')
C.setAuthor('StudyTimely - illustrative format review')
W,H=595.28,841.89;L=40;CW=W-80
PS=ParagraphStyle('body',fontName='Body',fontSize=9.4,leading=13,textColor=colors.HexColor('#30251f'),spaceAfter=6)
SM=ParagraphStyle('small',parent=PS,fontSize=7.2,leading=10,textColor=colors.HexColor('#705146'))
CELL=ParagraphStyle('cell',parent=PS,fontSize=8.05,leading=11)
HEAD=ParagraphStyle('head',parent=CELL,fontName='BodyBold',fontSize=7.7,leading=10.5)

def drawp(text,y,style=PS,x=L,width=CW):
 q=Paragraph(escape(text),style);_,h=q.wrap(width,800);q.drawOn(C,x,y-h);return y-h-style.spaceAfter
def drawchart(y,kind):
 if kind=='daily_chart':
  C.setFont('BodyBold',8);C.setFillColor(colors.HexColor('#705146'));C.drawString(L,y,'Daily saved study (minutes)');y-=20;step=CW/7
  for i,d in enumerate(DATA['days']):
   x=L+i*step+8;h=d['minutes']/75*44;C.setFont('BodyBold',7);C.setFillColor(colors.HexColor('#30251f'));C.drawString(x,y,str(d['minutes'])+'m');C.setFillColor(colors.HexColor('#b94b2d' if i%2==0 else '#a87817'));C.rect(x,y-55,step-19,h,fill=1,stroke=0);C.setFillColor(colors.HexColor('#705146'));C.setFont('Body',7);C.drawString(x,y-68,date.fromisoformat(d['date']).strftime('%a'))
  return y-80
 if kind=='subjects':
  for i,s in enumerate(DATA['subjects']):
   C.setFont('BodyBold',8.3);C.setFillColor(colors.HexColor('#30251f'));C.drawString(L,y,s['name']);C.drawRightString(L+CW,y,str(s['minutes'])+' min');C.setFillColor(colors.HexColor('#fbe5d6'));C.rect(L,y-12,CW,5,fill=1,stroke=0);C.setFillColor(colors.HexColor('#b94b2d' if i==0 else '#a87817'));C.rect(L,y-12,CW*s['minutes']/420,5,fill=1,stroke=0);y-=32
  return y-2
 if kind=='weeks':
  for i,m in enumerate(DATA['four_weeks_minutes']):
   x=L+i*CW/4;C.setFont('Body',8);C.setFillColor(colors.HexColor('#705146'));C.drawString(x,y,'Week '+str(i+1));C.setFont('BodyBold',19);C.setFillColor(colors.HexColor('#30251f'));C.drawString(x,y-24,str(m//60)+'h')
  return y-44
 raise ValueError(kind)

min_y=[]
for page_no,p in enumerate(PAGES,1):
 C.setFillColor(colors.HexColor('#fffaf2'));C.rect(0,0,W,H,fill=1,stroke=0);C.setFillColor(colors.HexColor('#b94b2d'));C.rect(L,H-38,CW,2,fill=1,stroke=0)
 y=H-56;C.setFont('BodyBold',7.5);C.setFillColor(colors.HexColor('#8b491f'));C.drawString(L,y,'STUDYTIMELY · '+p['eyebrow']);y-=14
 title=Paragraph(escape(p['title']),ParagraphStyle('title',fontName='Title',fontSize=24,leading=27,textColor=colors.HexColor('#30251f')));_,th=title.wrap(CW,200);title.drawOn(C,L,y-th);y-=th+9
 y=drawp('FICTIONAL EXAMPLE · AI-written content, not a live DeepSeek result · 9-15 Nov 2026',y,SM);y-=3
 for b in p['blocks']:
  t=b['type']
  if t=='paragraph':y=drawp(b['text'],y)
  elif t=='source':y-=2;y=drawp(b['text'],y,SM)
  elif t=='heading':
   y-=7;C.setFillColor(colors.HexColor('#a87817'));C.setFont('BodyBold',8);C.drawString(L,y-12,b['number']);y=drawp(b['title'],y,ParagraphStyle('h',fontName='Title',fontSize=15,leading=18,textColor=colors.HexColor('#30251f'),spaceAfter=8),L+23,CW-23)
  elif t=='note':
   q=Paragraph('<b>'+escape(b['label'])+'</b> · '+escape(b['text']),ParagraphStyle('n',parent=PS,fontSize=9,leading=13));_,h=q.wrap(CW-22,1000);C.setFillColor(colors.HexColor('#faedc3'));C.rect(L,y-h-12,CW,h+12,fill=1,stroke=0);q.drawOn(C,L+11,y-h-6);y-=h+20
  elif t=='metrics':
   C.setFillColor(colors.HexColor('#fbe5d6'));C.rect(L,y-52,CW,52,fill=1,stroke=0)
   for i,(lab,value) in enumerate(b['items']):
    x=L+12+i*CW/4;C.setFont('Body',7.5);C.setFillColor(colors.HexColor('#705146'));C.drawString(x,y-15,lab);C.setFont('BodyBold',18);C.setFillColor(colors.HexColor('#30251f'));C.drawString(x,y-39,value)
   y-=65
  elif t=='table':
   rows=[[Paragraph(escape(str(x)),HEAD if i==0 else CELL) for x in row] for i,row in enumerate([b['headers']]+b['rows'])]
   widths=b['widths'] or [CW/len(b['headers'])]*len(b['headers']);widths=[w/sum(widths)*CW for w in widths]
   tab=Table(rows,colWidths=widths,hAlign='LEFT');tab.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#fbe5d6')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),('LINEBELOW',(0,0),(-1,-1),.4,colors.HexColor('#dcc3b2'))]));_,h=tab.wrap(CW,800);tab.drawOn(C,L,y-h);y-=h+11
  else:y=drawchart(y,t)
  min_y.append((page_no,t,round(y,2)))
 C.setFillColor(colors.HexColor('#705146'));C.setFont('Body',7);C.drawString(L,27,'Fictional data · Format review only · No live provider request');C.drawRightString(W-L,27,f'{page_no} / {len(PAGES)}');C.showPage()
C.save()
assert min(v[2] for v in min_y)>42, f'Page overflow: {min_y}'
from pypdf import PdfReader
r=PdfReader(PDF);assert len(r.pages)==4
for page_no,p in enumerate(r.pages,1):
 text=p.extract_text();assert 'FICTIONAL EXAMPLE' in text;assert str(page_no)+' / 4' in text
all_text=' '.join(p.extract_text() for p in r.pages)
for phrase in ['+45 min (+50%)','255 min','45 min','165 min','No tasks are deleted','not a live DeepSeek result']:
 assert phrase in all_text, phrase
evidence={'pages':len(r.pages),'minimum_content_y':min(v[2] for v in min_y),'content_bottom_by_page':{n:min(v[2] for v in min_y if v[0]==n) for n in range(1,5)},'arithmetic_checks':'passed','pdf_text_checks':'passed','runtime_changed':False,'live_provider_called':False}
(OUT/'verification.json').write_text(json.dumps(evidence,indent=2),encoding='utf-8')
print(json.dumps({'pdf':str(PDF),'html':str(OUT/'report-example.html'),**evidence}))
