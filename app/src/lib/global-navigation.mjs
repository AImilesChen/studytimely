export const PRIMARY_LINKS=[
 {label:'Study Groups',path:'/study-groups',description:'Find a room and study together.',kind:'community'},
 {label:'Leaderboards',path:'/leaderboard',description:'Explore optional study rankings.',kind:'community'},
 {label:'Account',path:'/account',description:'Sign in and manage cloud sync.',kind:'account'}
];
export const TOOL_GROUPS=[
 {title:'Timers',links:[['Study Timer','/'],['Flip Clock','/flip-clock'],['Pomodoro','/pomodoro-timer'],['Focus Timer','/focus-timer'],['Stopwatch','/stopwatch'],['Countdown','/countdown-timer'],['Alarm','/alarm-clock']]},
 {title:'Plan & track',links:[['Study History','/study-tracker'],['Study Planner','/study-planner'],['Weekly Schedule','/study-schedule-maker'],['Habit Tracker','/study-habit-tracker'],['Syllabus Tracker','/syllabus-tracker'],['Exam Countdown','/exam-countdown']]},
 {title:'More tools',links:[['World Clock','/time'],['Study Space','/aesthetic-timer'],['Study Time Calculator','/study-time-calculator']]}
];
export function primaryLinks({communityEnabled=true,accountsEnabled=true}={}){return PRIMARY_LINKS.filter(link=>link.kind==='community'?communityEnabled:accountsEnabled);}
export const isToolPath=path=>TOOL_GROUPS.some(group=>group.links.some(([,url])=>url===path))||path.startsWith('/time/');
