import {Clock,Pause,Play} from '@phosphor-icons/react';
import {activityClock,activityClockText} from '../lib/activity-clock.mjs';
import {activityDuration} from '../lib/group-activities.mjs';
export function ActivityClock({activity,timer,now,own,joined,studying,live,readOnly,pending,onStart,onPause}){
 const view=activityClock(activity,timer,now);
 if(!['focus','break'].includes(view.phase))return null;
 const personal=joined&&!own?.checkedOutAt;
 return <section className="ga-live-clock" aria-label="Activity timing">
  <div className="ga-live-clock-shared"><span><Clock size={18}/>{view.phase==='focus'?'Focus time remaining':'Break time remaining'}</span><strong role="timer" aria-live="off" aria-label={view.phase==='focus'?'Activity focus time remaining':'Activity break time remaining'}>{activityClockText(view.remaining)}</strong><small>Shared activity schedule</small></div>
  {personal&&<div className="ga-live-clock-personal"><p className="ga-personal-state">{view.phase==='break'?'Focus interval finished':view.running?(studying?'Your timer is running':'Timer running in another tab or device'):view.needsCheck?'Check-in needed':view.matches?'Your timer is paused':'Your timer has not started'}</p><p className="ga-recorded-study">{activityDuration(own?.seconds)} recorded in this activity</p>{view.phase==='focus'&&!readOnly&&<div className="ga-live-clock-actions">{view.matches&&studying?<button className="button primary ga-action-join" disabled={pending} onClick={onPause}><Pause size={18}/>Pause study</button>:<button className="button primary ga-action-join" disabled={pending||live} onClick={onStart}><Play size={18}/>{view.needsCheck?'Check in & continue':view.matches?'Resume study':'Start my study'}</button>}</div>}{live&&!view.matches&&<p className="help">Pause your other room timer before starting this activity.</p>}{view.phase==='focus'&&view.matches&&!view.running&&<small>The group countdown continues while you pause.</small>}</div>}
 </section>;
}
