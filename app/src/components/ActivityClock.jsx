import {Clock,Pause,Play} from '@phosphor-icons/react';
import {activityClock,activityClockText} from '../lib/activity-clock.mjs';
import {activityDuration} from '../lib/group-activities.mjs';
export function ActivityClock({activity,timer,now,own,joined,studying,live,readOnly,pending,onStart,onPause}){
 const view=activityClock(activity,timer,now);
 if(!['focus','break'].includes(view.phase))return null;
 const personal=joined&&!own?.checkedOutAt;
 return <section className="ga-live-clock" aria-label="Activity timing">
  <div className="ga-live-clock-shared"><span><Clock size={18}/>{view.phase==='focus'?'Focus time remaining':'Break time remaining'}</span><strong role="timer" aria-label={view.phase==='focus'?'Activity focus time remaining':'Activity break time remaining'}>{activityClockText(view.remaining)}</strong><small>The group’s shared schedule keeps running during personal pauses.</small></div>
  {personal&&<div className="ga-live-clock-personal"><span>This study interval</span><strong role="timer" aria-label="Your current activity study interval">{activityClockText(view.seconds)}</strong><p>{view.phase==='break'?'Focus interval finished':view.running?(studying?'Your timer is running':'Timer running in another tab or device'):view.needsCheck?'Check-in needed':view.matches?'Your timer is paused':'Your timer has not started'}</p><small>{activityDuration(own?.seconds)} verified in this activity · server updates periodically.</small>{view.phase==='focus'&&!readOnly&&<div className="ga-live-clock-actions">{view.matches&&studying?<button className="button primary ga-action-join" disabled={pending} onClick={onPause}><Pause size={18}/>Pause my activity timer</button>:<button className="button primary ga-action-join" disabled={pending||live} onClick={onStart}><Play size={18}/>{view.needsCheck?'Check in & continue':view.matches?'Resume my activity timer':'Start my activity timer'}</button>}</div>}{live&&!view.matches&&<p className="help">Pause your other room timer before starting this activity.</p>}<small>Pausing keeps verified time. Resuming starts a new interval.</small></div>}
 </section>;
}
