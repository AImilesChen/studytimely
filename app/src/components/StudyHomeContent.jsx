import {ArrowRight,BookOpen,Clock,CornersOut,Hourglass,Orange,Timer,CaretDown} from '@phosphor-icons/react';
import {FAQ,GUIDES} from '../lib/routes.mjs';
import {PwaStatus} from './PwaStatus.jsx';
import '../study-home.css';

const timers=[
 ['Study Timer','#timer',BookOpen,'Start now and count upwards. Useful when you do not know how long a task will take. Study time can be saved to your history.'],
 ['Pomodoro Timer','/pomodoro-timer',Orange,'Alternate focused study with breaks. Choose a routine or set your own intervals; only study periods count towards your total.'],
 ['Focus Timer','/focus-timer',Timer,'Choose a duration for one study task. Finish early or let it run out; your record uses the time you actually studied.'],
 ['Stopwatch','/stopwatch',Timer,'Measure elapsed time and mark laps for practice rounds. Choose Study Timer when you want a saved study record.'],
 ['Countdown Timer','/countdown-timer',Hourglass,'Count down to the end of an exercise, break or activity. Use a study timer to add time to your learning history.'],
 ['Flip Clock','/flip-clock',Clock,'Keep the current time in view with a clear desktop clock. It follows your device time and does not record study time.']
];
const groups=[
 ['Plan your next session','Give each task a date, subject and estimated duration in Study Planner. Start a linked session when you are ready to work. For a recurring routine, use Study Schedule Maker to arrange weekly blocks around classes and other commitments. Planned time stays separate from the time you actually record.',[['Study Planner','/study-planner'],['Study Schedule Maker','/study-schedule-maker']]],
 ['Prepare for your exams','Break a syllabus into chapters and smaller topics so you can see what remains to revise. Add your own exam dates and keep the countdown beside your topic progress. Connect a topic to a study session when you work on it. Your exam timetable comes from the dates you enter.',[['Syllabus Tracker','/syllabus-tracker'],['Exam Countdown','/exam-countdown']]],
 ['Review your progress','Look back at recorded sessions, subjects and daily study totals in Study Tracker. Use Study Habit Tracker for daily or weekly goals, planned rest days and your own check-ins. Compare what you planned with what you recorded, then adjust your next session. A task or check-in alone does not add study minutes.',[['Study Tracker','/study-tracker'],['Study Habit Tracker','/study-habit-tracker']]]
];
const otherLinks=[['Alarm','/alarm-clock'],['Study Time Calculator','/study-time-calculator'],['Groups','/study-groups'],['Leaderboards','/leaderboard'],['Account','/account']];

export function StudyHomeContent({navigate,onFocus,pwa,locked}){
 return <div className="study-home-content">
  <section aria-labelledby="study-intro-heading">
   <h2 id="study-intro-heading">A free online study timer for your daily routine</h2>
   <div className="study-copy-grid">
   <p>StudyTimely gives you a place to time a study session, take breaks and review what you have completed. Open the page and select Start when you are ready. The study timer counts upwards, so you can begin a chapter, an assignment or a practice set without first deciding how many minutes it should take.</p>
   <p>Use the core tools without an account. Your study records stay in the browser you use, with optional manual cloud sync when you choose it. If you prefer a fixed session length, switch to a focus countdown or a Pomodoro routine. Choose the timer around the task you have today.</p>
   </div>
  </section>
  <section aria-labelledby="timer-choices-heading">
   <h2 id="timer-choices-heading">Choose a timer for your next session</h2>
   <p className="section-intro">Start with the way you want to work: count upwards, plan a single countdown, or make time for regular breaks.</p>
   <div className="timer-choice-grid">{timers.map(([name,url,Icon,description])=><a className="timer-choice" key={name} href={url} onClick={url==='#timer'?undefined:navigate}>
    <Icon size={25} weight="light" aria-hidden="true"/><div><h3>{name}</h3><p>{description}</p></div><ArrowRight size={18} aria-hidden="true"/>
   </a>)}</div>
  </section>
  <section className="how-section" aria-labelledby="study-how-heading">
   <h2 id="study-how-heading">How to use the study timer</h2>
   <div className="steps">{GUIDES.study.map(([heading,body],i)=><div key={heading}><span>{String(i+1).padStart(2,'0')}</span><h3>{heading}</h3><p>{body}</p></div>)}</div>
   <button className="text-button" onClick={onFocus}>Enter Focus Mode <CornersOut size={18} aria-hidden="true"/></button>
   <aside className="study-session-example"><span>One session, step by step</span><p>For example, choose “Revise chapter 3” as your task, start the timer and pause for any interruption. When you finish, save the session rather than adding the time you originally hoped to study. Your history then gives you a record of the session you completed.</p></aside>
  </section>
  <section aria-labelledby="study-scenarios-heading">
   <h2 id="study-scenarios-heading">Use your study timer for reading, revision and practice</h2>
   <p className="section-intro">A useful session starts with a clear task. Here are three ways to pair that task with the timer and a next step.</p>
   <div className="study-scenario-grid">
    <div><h3>Read a chapter or take notes</h3><p>Use the count-up study timer when the length of a reading task is uncertain. Choose a chapter or section before you start, and finish the session when you reach that stopping point. A subject label helps you find the record later. If the task needs another session, add the remaining work to your <a href="/study-planner" onClick={navigate}>study plan</a>.</p></div>
    <div><h3>Revise for an exam</h3><p>Choose one topic and use <a href="/pomodoro-timer" onClick={navigate}>Pomodoro Timer</a> if you want a study-and-break routine. During the break, the timer keeps rest time separate from your study total. After the session, review your topic list and decide what to cover next. You can track chapters and subchapters in <a href="/syllabus-tracker" onClick={navigate}>Syllabus Tracker</a>.</p></div>
    <div><h3>Work through practice questions</h3><p>Set a <a href="/focus-timer" onClick={navigate}>focus countdown</a> for one practice set when you want a fixed working period. If you need to compare individual rounds instead, use Stopwatch and mark laps. Stopwatch is for elapsed and lap times; use Study Timer, Focus Timer or Pomodoro when you want the session in your study history.</p></div>
   </div>
  </section>
  <section aria-labelledby="study-rhythm-heading">
   <h2 id="study-rhythm-heading">Find a study rhythm that works for you</h2>
   <p className="section-intro">Use these examples as a starting point. Adjust the length to your task and leave room to rest.</p>
   <table className="study-rhythm-table"><caption className="sr-only">Example study and break intervals, with matching tools</caption><thead><tr><th scope="col">Study rhythm</th><th scope="col">Example timing</th><th scope="col">When to try it</th></tr></thead><tbody>
    <tr><th scope="row"><a href="/pomodoro-timer" onClick={navigate}>Shorter sessions</a></th><td><span className="rhythm-cell-label" aria-hidden="true">Example timing</span>25 min study<br/>5 min break</td><td><span className="rhythm-cell-label" aria-hidden="true">When to try it</span>A manageable starting point for reading or revision.</td></tr>
    <tr><th scope="row"><a href="/pomodoro-timer" onClick={navigate}>Longer sessions</a></th><td><span className="rhythm-cell-label" aria-hidden="true">Example timing</span>50 min study<br/>10 min break</td><td><span className="rhythm-cell-label" aria-hidden="true">When to try it</span>Tasks where you want fewer interruptions.</td></tr>
    <tr><th scope="row"><a href="/focus-timer" onClick={navigate}>Your own pace</a></th><td><span className="rhythm-cell-label" aria-hidden="true">Example timing</span>Custom duration<br/>or count upwards</td><td><span className="rhythm-cell-label" aria-hidden="true">When to try it</span>Choose one focus countdown, or <a href="#timer">start Study Timer</a> without setting a duration.</td></tr>
   </tbody></table>
   <div className="study-copy-grid study-rhythm-notes"><p>A 25/5 routine means 25 minutes of study followed by a 5-minute short break. A 50/10 routine uses a longer study period and break. Both are options in Pomodoro settings, alongside custom durations and a separate long break. Finish or reset an active timer before changing its duration.</p>
   <p>If a fixed interval does not fit your task, return to the count-up timer. You can stop at a useful point rather than waiting for a countdown. These examples are starting points for your own routine; no single interval is the right fit for every task or every day.</p></div>
  </section>
  <section aria-labelledby="study-workspace-heading">
   <h2 id="study-workspace-heading">Plan your study. Track your progress.</h2>
   <div className="study-workspace-grid">{groups.map(([title,description,links])=><div className="study-workspace-card" key={title}><h3>{title}</h3><p>{description}</p><ul>{links.map(([label,url])=><li key={url}><a href={url} onClick={navigate}>{label}<ArrowRight size={16} aria-hidden="true"/></a></li>)}</ul></div>)}</div>
   <aside className="study-planning-note"><h3>Estimate your study week</h3><p>Need to estimate the time available before you plan a week? Use the <a href="/study-time-calculator" onClick={navigate}>Study Time Calculator</a> to work with your own daily target, study days and number of weeks. The estimate helps with planning and does not create study records.</p></aside>
   <nav className="study-more-tools" aria-label="More study tools">{otherLinks.map(([label,url])=><a key={url} href={url} onClick={navigate}>{label}</a>)}</nav>
  </section>
  <section aria-labelledby="study-comfort-heading">
   <h2 id="study-comfort-heading">Make your study space comfortable</h2>
   <p className="section-intro">The quick toolbar beneath the timer puts sounds, themes and a quieter view within reach.</p>
   <div className="study-comfort-grid">
    <div><h3>Themes &amp; motion</h3><p>Open Themes to choose a light or dark look, or a colour palette that suits your desk. Turn on Reduce motion if you prefer simpler transitions. You can also find themes and ambient controls together in <a href="/aesthetic-timer" onClick={navigate}>Study Space</a>.</p></div>
    <div><h3>Ambient sounds</h3><p>Open Sounds to try rain, café murmur, forest, ocean waves, white noise or breeze and chimes. Mix sound textures at separate volumes, check the On indicator, or mute the mix. Sound starts only after you choose to play it.</p></div>
    <div><h3>Focus Mode</h3><p>Choose Focus to clear the surrounding workspace while your timer continues. You can keep your current session and take pauses as needed. Use Back to workspace when you want to see the full page, your study tools and progress again.</p></div>
    <div><h3>Timer alerts</h3><p>Ambient sound and end alerts have separate controls. Use Alert to enable, adjust and test the sound for a Pomodoro, Focus or Countdown period. Keep the page open and the device awake; browser audio is not a substitute for a dependable alarm.</p></div>
   </div>
  </section>
  <section aria-labelledby="study-records-heading">
   <h2 id="study-records-heading">Keep a useful record of your study time</h2>
   <div className="study-copy-grid study-records-grid">
    <div><h3>Review completed study time</h3><p>A daily goal is a reference for your plan, not time already completed. Saved study sessions add actual study time to your total; pauses, Pomodoro breaks and planned schedule blocks do not. Reviewing subjects and recent sessions can help you decide where to put your next study block.</p></div>
    <div><h3>Keep a backup</h3><p>Settings → Data lets you export a JSON backup or a sessions CSV, and import a compatible JSON backup. Clearing site data, private browsing or losing a device can remove local records. An optional account gives you a manual Sync now action; signing in alone does not upload your study history.</p></div>
   </div>
  </section>
  <PwaStatus pwa={pwa} locked={locked} compact/>
  <section className="faq" id="faq" aria-labelledby="study-faq-heading"><h2 id="study-faq-heading">Study timer FAQs</h2>{FAQ.study.map(([q,a])=><details key={q}><summary>{q}<CaretDown size={18} aria-hidden="true"/></summary><p>{a}</p></details>)}</section>
 </div>;
}
