import {
  ArrowRight, BookOpen, CalendarBlank, CaretDown, ChartBar, Clock, Copy, Play, UsersThree
} from '@phosphor-icons/react';
import {activityDuration} from '../lib/group-activities.mjs';
import {roomGoalProgress} from '../lib/room-presentation.mjs';
import './room-study-guide.css';

const questions = [
  ['What do the learning states mean?', 'Studying means a connected room timer is running. Ready, break, check-in needed and offline describe timer or connection state. These states cannot show how much someone is learning.'],
  ['What remains free?', 'One active owned room with four places, personal room timers, quick messages and stickers, silent encouragement, single activities, basic progress and essential member management.'],
  ['How do we communicate and stay safe?', 'Send quick updates or silent encouragement when a partner allows it. Open All messages & safety to report or hide messages. Free text requires eligible access and available safety review.'],
  ['Can the owner remove someone, and can I leave?', 'Leave through the room actions. Owners can remove members, mute messages or prevent rejoining through the member controls.']
];

const tools = [
  {href: '/', label: 'Study Timer', description: 'Run a personal timer.', icon: Clock},
  {href: '/study-planner', label: 'Personal study plan', description: 'Organise your next tasks.', icon: BookOpen},
  {href: '/study-tracker', label: 'Personal study analytics', description: 'Review your own study records.', icon: ChartBar}
];

export function RoomStudyGuide({
  navigate, canInvite = false, canPlan = false, canParticipate = false,
  onInvite, onMembers, onStudy, onPlan, onActivities, onAccess, onProgress, onProgressDetails,
  totals, goalMinutes, activityOverview, feedback = '', busy = false
}) {
  const today = Number.isFinite(totals?.today_seconds) ? Math.max(0, totals.today_seconds) : null;
  const hasGoal = Number.isFinite(goalMinutes) && goalMinutes > 0;
  const progress = today !== null && hasGoal ? roomGoalProgress(today, goalMinutes) : null;
  const activity = activityOverview?.notice;
  const activityUnavailable = activityOverview?.error;
  const activityLoading = activityOverview?.loading;
  const offerPlan = canPlan && activityOverview && !activity && !activityLoading && !activityUnavailable;
  const studyLabel = canParticipate ? 'Go to my place' : 'Review room access';

  let activityTitle = 'No activity arranged';
  let activityDescription = 'Your room organiser can arrange a session.';
  if (activity) {
    activityTitle = activity.title;
    activityDescription = activity.description;
  } else if (activityLoading) {
    activityTitle = 'Loading your room’s activities…';
    activityDescription = '';
  } else if (activityUnavailable) {
    activityTitle = 'Activity details are unavailable';
    activityDescription = 'Open activities to try again.';
  } else if (!activityOverview) {
    activityTitle = 'View your room’s appointments';
    activityDescription = '';
  } else if (offerPlan) {
    activityDescription = 'Plan a time to meet again.';
  }

  return (
    <section className="room-study-guide" aria-labelledby="room-study-guide-title">
      <h2 id="room-study-guide-title">Room overview</h2>
      <div className="room-session-overview">
        <article className="room-overview-card room-today-summary" aria-labelledby="room-today-title">
          <h3 id="room-today-title"><ChartBar size={19} aria-hidden="true"/> Today’s study</h3>
          <div className="room-overview-content">
            <dl>
              <div><dt>Recorded today · UTC</dt><dd>{today === null ? 'Not available' : activityDuration(today)}</dd></div>
              <div><dt>Shared daily goal</dt><dd>{hasGoal ? `${goalMinutes} min` : 'Not set'}</dd></div>
            </dl>
            {progress && (
              <progress aria-label="Today’s shared goal" aria-valuetext={progress.label + ' of the daily shared goal'} max={progress.goalSeconds} value={progress.value}/>
            )}
            <p>Confirmed study time from all room members.</p>
          </div>
          <button type="button" className="button room-overview-action" onClick={onProgress}>
            View group progress <ArrowRight size={16} aria-hidden="true"/>
          </button>
        </article>
        <article className="room-overview-card room-next-session" aria-labelledby="room-next-session-title">
          <h3 id="room-next-session-title">
            <CalendarBlank size={19} aria-hidden="true"/> {activity?.awaitingStart ? 'Activity awaiting start' : activity?.state === 'scheduled' ? 'Next activity' : activity ? 'Your activity' : 'Study activities'}
          </h3>
          <div className="room-overview-content">
            <strong className="room-next-session-name" role={activityLoading ? 'status' : undefined}>{activityTitle}</strong>
            {activityDescription && <p>{activityDescription}</p>}
            {activity && activityUnavailable && <p>Updates are unavailable. Open activities to retry.</p>}
          </div>
          <button type="button" className="button room-overview-action" disabled={busy} onClick={offerPlan ? onPlan : onActivities}>
            {offerPlan ? 'Plan next activity' : 'View activities'} <ArrowRight size={16} aria-hidden="true"/>
          </button>
        </article>
      </div>

      <p className="room-routine-tip">Pick a task, start your own timer and add a result after any activity you join.</p>

      <section className="room-study-help-section" aria-labelledby="room-help-title">
        <h3 id="room-help-title">Using this room</h3>
        <div className="room-study-help-layout">
          <div className="room-essential-answers">
            <article>
              <h4>Start studying anytime</h4>
              <p>Use your own timer when you’re ready. You can study without joining an activity.</p>
              <button type="button" className="room-guide-link" onClick={canParticipate ? onStudy : onAccess}>
                <Play size={15} aria-hidden="true"/> {studyLabel} <ArrowRight size={15} aria-hidden="true"/>
              </button>
            </article>
            <article>
              <h4>Understand the two clocks</h4>
              <p>Your seat shows your elapsed time. The activity countdown shows time left for the group. Your study time counts once.</p>
              <button type="button" className="room-guide-link" onClick={onProgressDetails}>
                See how time is counted <ArrowRight size={15} aria-hidden="true"/>
              </button>
            </article>
            <article>
              <h4>Add a result and private reflection</h4>
              <p>Open the activity you joined and choose <strong>Add result</strong> after it ends. Members see your result and only you see your reflection.</p>
              <button type="button" className="room-guide-link" onClick={onActivities}>
                Go to study activities <ArrowRight size={15} aria-hidden="true"/>
              </button>
            </article>
          </div>
          <aside className="room-help-more" aria-labelledby="room-help-more-title">
            <h4 id="room-help-more-title">Common questions</h4>
            {questions.map(([title, answer]) => (
              <details key={title}>
                <summary>{title}<CaretDown size={16} aria-hidden="true"/></summary>
                <p>{answer}</p>
              </details>
            ))}
            <a className="room-guide-link" href="/study-groups#group-how" target="_blank" rel="noopener noreferrer" aria-label="Full study group guide (opens in a new tab)">
              Full study group guide <ArrowRight size={15} aria-hidden="true"/>
            </a>
          </aside>
        </div>
      </section>

      <div className="room-guide-invitation">
        <div>
          <h3>{canInvite ? 'Invite a study partner' : 'Room members'}</h3>
          <p>{canInvite ? 'Share the invitation when a place is available. Offline members keep their places.' : 'See who has a place in this room.'}</p>
        </div>
        <button type="button" className="button room-overview-action" disabled={busy} onClick={canInvite ? onInvite : onMembers}>
          {canInvite ? <Copy size={17} aria-hidden="true"/> : <UsersThree size={17} aria-hidden="true"/>}
          {canInvite ? 'Copy invitation' : 'View members'}
        </button>
        {feedback && <p className="room-guide-feedback" role="status">{feedback}</p>}
      </div>

      <nav className="room-guide-tools" aria-labelledby="room-guide-tools-title">
        <h3 id="room-guide-tools-title">Personal study tools</h3>
        <ul>
          {tools.map(({href, label, description, icon: Icon}) => (
            <li key={href}>
              <a href={href} onClick={navigate}>
                <Icon size={19} aria-hidden="true"/>
                <span className="room-guide-tool-copy">
                  <strong className="room-guide-tool-title">{label}<ArrowRight size={17} aria-hidden="true"/></strong>
                  <small>{description}</small>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
