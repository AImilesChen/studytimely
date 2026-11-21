import {useCallback, useEffect, useRef, useState} from 'react';
import {
  ArrowClockwise, ArrowRight, BookOpen, CalendarBlank, CaretDown, CheckCircle, Clock,
  DownloadSimple, GearSix, Info, LockSimple, PencilSimple, Play, Plus, UsersThree
} from '@phosphor-icons/react';
import {ActivityCheckout} from './ActivityCheckout.jsx';
import {ActivityClock} from './ActivityClock.jsx';
import {ActivityWalkthrough} from './ActivityWalkthrough.jsx';
import {RoomActivityNotice} from './RoomActivityNotice.jsx';
import {initialRoomActivity, roomActivityNotice} from '../lib/room-activity-navigation.mjs';
import {Dialog} from './Dialog.jsx';
import {recentRoomActivities} from '../lib/room-progress.mjs';
import {accountRequest} from '../lib/sync.mjs';
import {downloadJSON} from '../lib/storage.mjs';
import {zonedFormatter} from '../lib/time-zones.mjs';
import {
  ACTIVITY_SUBJECTS, ACTIVITY_KINDS, ACTIVITY_OUTCOMES, activityPhase,
  activityWall, activityWhen, activityDuration
} from '../lib/group-activities.mjs';
import '../room-activities.css';

const subjectOptions = Object.entries(ACTIVITY_SUBJECTS).map(([id, label]) => <option value={id} key={id}>{label}</option>);
const phaseLabel = {scheduled: 'Scheduled', focus: 'Focus time', break: 'Break time', ended: 'Ended', cancelled: 'Cancelled'};
const zones = ['UTC','Europe/London','Europe/Paris','Europe/Berlin','America/New_York','America/Chicago','America/Los_Angeles','America/Toronto','America/Vancouver','Asia/Shanghai','Asia/Tokyo','Asia/Singapore','Asia/Kolkata','Asia/Dubai','Australia/Sydney','Australia/Adelaide','Pacific/Auckland'];
export {RoomHome} from './RoomHome.jsx';

export function RoomActivities({
  room, auth, profile, canOrganize, members, revision, now, chatReviewAvailable, timer, live,
  studying, onStart, onPause, refresh, confirm, view = 'full', onOpen, onStudyTogether, onOverview, navigationRequest
}) {
  const [list, setList] = useState(null);
  const [id, setId] = useState('');
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [notice, setNotice] = useState('');
  const [formError, setFormError] = useState('');
  const [checkoutRequest, setCheckoutRequest] = useState({activityId: '', value: 0});

  const handledNavigation = useRef(0);
  const detailPanel = useRef(null);
  const taskEditor = useRef(null);
  const scrollPending = useRef(false);
  const current = useRef('');
  const alive = useRef(true);
  const requestVersion = useRef(0);
  const listVersion = useRef(0);
  const createId = useRef('');
  current.current = id;

  const base = '/api/community/rooms/' + room.id + '/activities';
  const readOnly = room.closed || room.readOnly;
  const manager = !readOnly && (room.ownerId === profile.id || Boolean(canOrganize));
  const api = useCallback((suffix = '', method = 'GET', data) => (
    accountRequest(base + suffix, {method, data, csrf: auth.csrf})
  ), [base, auth.csrf]);

  const loadList = useCallback(async () => {
    const ticket = ++listVersion.current;
    const data = await api();
    if (alive.current && ticket === listVersion.current) setList(data.activities);
    return data.activities;
  }, [api]);
  const loadDetail = useCallback(async (target = current.current) => {
    if (!target) return;
    const ticket = ++requestVersion.current;
    try {
      const data = await api('/' + target);
      if (alive.current && current.current === target && ticket === requestVersion.current) setDetail(data);
    } catch (failure) {
      if (alive.current && current.current === target && ticket === requestVersion.current) throw failure;
    }
  }, [api]);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  useEffect(() => {
    let gone = false;
    loadList().catch(failure => { if (!gone) setError(failure.message); });
    return () => { gone = true; };
  }, [loadList]);

  useEffect(() => {
    if (!list || id) return;
    const requested = new URL(location.href).searchParams.get('activity');
    setId(initialRoomActivity(list, requested, now || Date.now(), readOnly));
  }, [id, list, readOnly]);

  useEffect(() => {
    setError('');
    setCheckoutError('');
    if (id) loadDetail(id).catch(failure => setError(failure.message));
  }, [id, loadDetail]);

  useEffect(() => {
    if (!list) return;
    loadList().catch(failure => setError(failure.message));
    if (current.current) loadDetail().catch(failure => setError(failure.message));
  }, [revision]);

  useEffect(() => {
    const tick = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadList().catch(failure => setError(failure.message));
        loadDetail().catch(failure => setError(failure.message));
      }
    }, 30000);
    return () => clearInterval(tick);
  }, [loadList, loadDetail]);

  async function run(action) {
    if (pending) return;
    setPending(true);
    setError('');
    setNotice('');
    try {
      await action();
      await Promise.all([loadList(), loadDetail()]);
      await refresh();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setPending(false);
    }
  }

  function select(next) {
    if (next !== id) {
      setCheckoutRequest(previous => ({activityId: '', value: previous.value}));
    }
    if (next === id && view === 'full' && detailPanel.current) {
      detailPanel.current.scrollIntoView({block: 'start'});
      detailPanel.current.focus({preventScroll: true});
    } else {
      scrollPending.current = true;
    }
    setId(next);
    setNotice('');
    const url = new URL(location.href);
    url.searchParams.set('activity', next);
    history.replaceState({}, '', url.pathname + url.search);
  }

  function openForm(type, activity) {
    setForm({type, activity});
    setFormError('');
    createId.current = crypto.randomUUID();
  }

  async function saveActivity(values) {
    if (pending) return;
    setPending(true);
    setFormError('');
    try {
      const editing = form.type === 'edit';
      const result = await api(editing ? '/' + form.activity.id : '', editing ? 'PATCH' : 'POST', {
        ...values, ...(editing ? {version: form.activity.version} : {id: createId.current})
      });
      setForm(null);
      select(editing ? form.activity.id : result.id);
      await loadList();
      await refresh();
      setNotice(editing ? 'Activity updated. Members can review the new time.' : 'Activity scheduled. Share the room invitation.');
    } catch (failure) {
      setFormError(failure.message);
    } finally {
      setPending(false);
    }
  }

  const selected = detail?.activity.id === id ? detail : null;
  const activity = selected?.activity;
  const own = selected?.own;
  const joined = Boolean(own && !own.withdrawnAt);
  const phase = activity ? activityPhase(activity, now) : '';
  const registrationOpen = ['scheduled', 'focus'].includes(phase);
  const canJoin = !readOnly && registrationOpen && !own?.checkedOutAt;
  const canEditTask = canJoin && joined;
  const canReport = joined && ['focus', 'break', 'ended'].includes(phase);
  const canStartGroup = manager && phase === 'scheduled';
  const awaitingStart = phase === 'scheduled' && activity.startsAt < now;
  const items = list || [];
  const otherActivities = items.filter(item => item.id !== id && ['scheduled', 'focus', 'break'].includes(activityPhase(item, now)));
  const historyItems = items.filter(item => item.id !== id && ['ended', 'cancelled'].includes(activityPhase(item, now)))
    .sort((a, b) => (b.endedAt || b.startsAt) - (a.endedAt || a.startsAt));
  const shortcut = roomActivityNotice(items, selected, now, readOnly);

  useEffect(() => {
    if (selected && scrollPending.current && view === 'full') {
      scrollPending.current = false;
      detailPanel.current?.scrollIntoView({block: 'start'});
      detailPanel.current?.focus({preventScroll: true});
    }
  }, [selected, view]);

  useEffect(() => {
    onOverview?.({
      roomId: room.id, notice: shortcut, recent: list ? recentRoomActivities(items, now) : [],
      recurring: list?.filter(item => item.seriesId && item.status === 'scheduled') ?? null,
      loading: list === null && !error, error: Boolean(error)
    });
  }, [room.id, list, selected, error, readOnly, shortcut?.id, shortcut?.state, shortcut?.title, shortcut?.description, onOverview]);

  useEffect(() => {
    if (!navigationRequest || navigationRequest.roomId !== room.id || navigationRequest.request === handledNavigation.current || !list) return;
    if (!list.some(item => item.id === navigationRequest.activityId)) return;
    handledNavigation.current = navigationRequest.request;
    openNotice({id:navigationRequest.activityId,action:navigationRequest.action});
  }, [navigationRequest, list, room.id]);

  function openNotice(item) {
    if (item?.id && (item.id !== id || item.action === 'view')) select(item.id);
    if (item?.action === 'result') setCheckoutRequest(previous => ({activityId: item.id, value: previous.value + 1}));
    onOpen?.();
  }

  function editTask() {
    if (!taskEditor.current) return;
    taskEditor.current.open = true;
    taskEditor.current.scrollIntoView({block: 'nearest'});
    taskEditor.current.querySelector('select,input')?.focus({preventScroll: true});
  }

  function transition(operation) {
    return run(() => api('/' + id + '/' + operation, 'POST', {version: activity.version}));
  }

  function startGroup() {
    confirm({
      title: 'Start this activity now?',
      body: 'This opens the focus interval for everyone. Each member starts their own timer.',
      action: 'Start activity',
      run: () => transition('start')
    });
  }

  async function saveTask(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    await run(async () => {
      await api('/' + id + '/participation', 'PUT', {...values, version: Number(values.version)});
      if (taskEditor.current) taskEditor.current.open = false;
      setNotice(joined ? 'Task saved.' : 'Joined. Your timer starts when you choose.');
    });
  }

  async function checkout(event) {
    event.preventDefault();
    if (pending) return false;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setPending(true);
    setCheckoutError('');
    setNotice('');
    try {
      const saved = await api('/' + id + '/checkout', 'POST', {...values, version: Number(values.version)});
      if (alive.current && current.current === id) {
        ++requestVersion.current;
        setDetail(previous => {
          if (previous?.activity.id !== id || !previous.own || previous.own.version >= saved.version) return previous;
          return {
            ...previous,
            own: {
              ...previous.own, version: saved.version, outcome: values.outcome,
              reflection: values.reflection.trim(), checkedOutAt: saved.checkedOutAt, seconds: saved.seconds
            }
          };
        });
      }
      const refreshed = await Promise.allSettled([loadList(), loadDetail(), refresh()]);
      if (refreshed.some(result => result.status === 'rejected')) setNotice('Result saved. Refresh to update the activity summary.');
      return true;
    } catch (failure) {
      setCheckoutError(failure.message);
      return false;
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div hidden={view !== 'summary'}><RoomActivityNotice notice={shortcut} error={error} onOpen={openNotice}/></div>
      <section hidden={view !== 'full'} className="ga-workspace ga-workspace-focused" aria-labelledby="room-activities-title">
        <div className="ga-heading">
          <div>
            <h3 id="room-activities-title" tabIndex={-1}>Study activities</h3>
            <p className="ga-view-intro">Plan a session, bring your own task and study at your own pace.</p>
            <p className="ga-access-note"><strong>Single activities are free.</strong> Automatic repeats require advanced access.</p>
          </div>
          <div className="community-row ga-toolbar">
            <a className="text-button ga-examples-link" href="#activity-examples" onClick={event=>{event.preventDefault();const heading=document.getElementById('ga-walkthrough-title');heading?.scrollIntoView({block:'start'});heading?.focus({preventScroll:true});}}><BookOpen size={17} aria-hidden="true"/>How to use</a>
            <button type="button" className="icon-button ga-action-refresh" aria-label="Refresh activities" disabled={pending} onClick={() => run(() => {})}><ArrowClockwise size={19} aria-hidden="true"/></button>
            {manager && <button type="button" className="button ga-action-plan" disabled={pending} onClick={() => openForm('create')}><Plus size={17} aria-hidden="true"/>Plan an activity</button>}
          </div>
        </div>
        {!list && !error && <p role="status">Loading activities…</p>}
        {error && <div className="field-error" role="alert">{error} <button type="button" className="text-button" disabled={pending} onClick={() => run(() => {})}>Retry activities</button></div>}
        {notice && <p className="ga-feedback" role="status">{notice}</p>}
        {pending && <p className="ga-updating" role="status">Updating activity…</p>}
        {list?.length === 0 && !id && !error && (
          <div className="ga-empty">
            <CalendarBlank size={23} aria-hidden="true"/>
            <div><h4>No study activities yet</h4><p>{manager ? 'Choose a time for your group using Plan an activity.' : 'The room organiser can schedule a session.'}</p></div>
          </div>
        )}

        <div className="ga-session-layout" data-selected={Boolean(activity)}>
        <div className="ga-session-main">
        {activity && (
          <section id="room-activity-detail" ref={detailPanel} tabIndex={-1} className="ga-detail ga-session" data-phase={phase} aria-labelledby="ga-current-title">
            <div className="ga-heading ga-session-heading">
              <div className="ga-session-lead">
                <ActivityDate at={activity.startsAt} zone={activity.zone}/>
                <div className="ga-session-identity">
                <ActivityStatus phase={phase} awaitingStart={awaitingStart}/>
                {joined && phase === 'scheduled' && <span className="ga-joined-label"><CheckCircle size={15} aria-hidden="true"/> Joined</span>}
                <h3 id="ga-current-title">{activity.title}</h3>
                <p className="ga-session-meta">
                  <span><CalendarBlank size={16} aria-hidden="true"/><time dateTime={new Date(activity.startsAt).toISOString()}>{activityWhen(activity.startsAt, activity.zone)}</time> · {activity.zone}</span>
                  <span><Clock size={16} aria-hidden="true"/>{activity.focusMinutes} min study{activity.breakMinutes > 0 && ' · ' + activity.breakMinutes + ' min break'}</span>
                </p>
                </div>
              </div>
              {manager && ['scheduled', 'focus', 'break'].includes(phase) && (
                <div className="community-row ga-session-controls">
                  {canStartGroup && joined && !awaitingStart && (
                    <button type="button" className="button primary ga-action-start" disabled={pending} onClick={startGroup}><Play size={17} aria-hidden="true"/>Start activity</button>
                  )}
                  <details className="ga-manage" key={'manage-' + id}>
                    <summary><GearSix size={17} aria-hidden="true"/><span>Manage activity<small>{phase === 'scheduled' ? 'Edit or cancel this booking' : 'End the session for everyone'}</small></span><CaretDown size={17} aria-hidden="true"/></summary>
                    <div className="community-row">
                      {phase === 'scheduled' ? (
                        <>
                          {!joined && !awaitingStart && <button type="button" className="button" disabled={pending} onClick={startGroup}>Start activity</button>}
                          {!awaitingStart && <button type="button" className="button" disabled={pending} onClick={() => openForm('edit', activity)}>Edit activity</button>}
                          <button type="button" className="text-button ga-action-danger" disabled={pending} onClick={() => confirm({
                            title: 'Cancel this activity?',
                            body: 'Members can see it was cancelled. The room and other activities stay available.',
                            action: 'Cancel activity', run: () => transition('cancel')
                          })}>Cancel activity</button>
                        </>
                      ) : (
                        <button type="button" className="text-button ga-action-danger" disabled={pending} onClick={() => confirm({
                          title: 'End the activity for everyone?',
                          body: 'Activity timers stop for all members. Recorded study time is kept and members can add their results. Independent room timers are unaffected.',
                          action: 'End activity for everyone', run: () => transition('end')
                        })}>End activity for everyone</button>
                      )}
                    </div>
                  </details>
                </div>
              )}
            </div>

            {awaitingStart && (
              <div className="ga-past-start">
                <div>
                  <strong>This activity hasn’t started</strong>
                  <p>{manager ? 'The scheduled time has passed. Choose a new time or start when your group is ready.' : 'The scheduled time has passed. The organiser can choose a new time or start the activity.'}</p>
                </div>
                {manager && (
                  <div className="ga-past-start-actions">
                    <button type="button" className="button ga-action-plan" disabled={pending} onClick={() => openForm('edit', activity)}><CalendarBlank size={16} aria-hidden="true"/>Set a new time</button>
                    <button type="button" className="text-button" disabled={pending} onClick={startGroup}><Play size={16} aria-hidden="true"/>Start now</button>
                  </div>
                )}
              </div>
            )}
            {phase === 'scheduled' && joined && !awaitingStart && (
              <p className="ga-phase-note">{manager ? 'Start when your group is ready. Each member starts their own timer.' : 'Waiting for the organiser to start.'}</p>
            )}
            {phase === 'cancelled' && <p className="ga-phase-note">This session was cancelled.</p>}
            {joined && own.task && (
              <div className="ga-session-task">
                <span><LockSimple size={16} aria-hidden="true"/>Your task · private</span>
                <strong>{own.task}</strong>
                {canEditTask && <button type="button" className="text-button" disabled={pending} onClick={editTask}><PencilSimple size={16} aria-hidden="true"/>Edit task</button>}
              </div>
            )}
            <ActivityClock activity={activity} timer={timer} now={now} own={own} joined={joined} studying={studying} live={live} readOnly={readOnly} pending={pending} onStart={() => run(() => onStart(false, id))} onPause={() => run(onPause)}/>
            {canJoin && (
              <details ref={taskEditor} className="ga-task-disclosure" data-joining={!joined} key={'task-' + id}>
                {joined ? (
                  <summary><BookOpen size={17} aria-hidden="true"/><span><strong>Edit task or withdraw</strong><small>Expand here to change your subject or private task, or leave this activity.</small></span><CaretDown size={17} aria-hidden="true"/></summary>
                ) : (
                  <summary className="ga-join-panel">
                    <span className="ga-join-copy"><strong>Choose what you’ll study</strong><small>Open the form to choose a subject and enter a private task. Then select Confirm &amp; join.</small></span>
                    <span className="ga-join-action"><span className="ga-join-closed">Join activity</span><span className="ga-join-open">Hide form</span><CaretDown size={16} aria-hidden="true"/></span>
                  </summary>
                )}
                <form onSubmit={saveTask} className="ga-task-form">
                  {activity.seriesId && <p className="help">This is one date of a repeating activity. Changes to this date ask members to confirm again.</p>}
                  <PersonalTaskFields own={own} subject={activity.subject}/>
                  <p className="help">Your task is private and kept for up to 90 days. You start your own timer.</p>
                  <div className="community-row">
                    <button className={joined ? 'button ga-action-save' : 'button primary ga-action-join'} disabled={pending}>{joined ? 'Save personal task' : 'Confirm & join'}</button>
                    {joined && <button className="text-button" type="button" disabled={pending} onClick={() => confirm({
                      title: 'Withdraw from this activity?',
                      body: 'Your activity timer stops. Already verified time is retained; you can rejoin while registration is open.',
                      action: 'Withdraw',
                      run: () => run(() => api('/' + id + '/withdraw', 'POST', {version: own.version}))
                    })}>Withdraw</button>}
                  </div>
                </form>
              </details>
            )}
            {canReport && (
              <ActivityCheckout key={'checkout-' + id} own={own} phase={phase} pending={pending} error={checkoutError} onSubmit={checkout}
                openRequest={checkoutRequest.activityId === id ? checkoutRequest.value : 0} visible={view === 'full'} readOnly={readOnly}>
                <CheckOutFields own={own}/>
              </ActivityCheckout>
            )}
          </section>
        )}
        {id && !activity && !error && <p role="status">Opening activity…</p>}
        </div>
        {(activity || otherActivities.length > 0 || historyItems.length > 0) && (
          <aside className="ga-session-sidebar" aria-label="Activity information and records" data-directory={otherActivities.length > 0 || historyItems.length > 0}>
            {activity && (
              <ActivitySummary key={'summary-' + id} detail={selected} phase={phase} members={members} profileId={profile.id}
                onRepeat={manager && ['ended', 'cancelled'].includes(phase) ? () => openForm('copy', activity) : undefined}
                pending={pending}/>
            )}
            {(otherActivities.length > 0 || historyItems.length > 0) && <div className="ga-records-directory">
              {otherActivities.length > 0 && <ActivityList title="Other activities" items={otherActivities} now={now} selectedId={id} select={select}/>}
              {historyItems.length > 0 && <ActivityList title="Recent activities" items={historyItems} now={now} selectedId={id} select={select} history/>}
            </div>}
          </aside>
        )}
        </div>

        {onStudyTogether && <div className="ga-drop-in ga-drop-in-inline"><p>Studying without a booking?</p><button type="button" className="text-button" onClick={onStudyTogether}>Go to Study together<ArrowRight size={16} aria-hidden="true"/></button></div>}

        <ActivityWalkthrough/>

        <section className="ga-help-visible" aria-labelledby="ga-help-title">
          <h4 id="ga-help-title"><Info size={18} aria-hidden="true"/>Time &amp; privacy</h4>
          <dl className="ga-help-topics">
            <div><dt>Who can see my task or result?</dt><dd>Your task and optional reflection are private. Members see your nickname, subject, recorded time and the result you choose.</dd></div>
            <div><dt>Where is my time recorded?</dt><dd>Confirmed activity time counts once in <strong>Group progress</strong> and stays separate from your personal study history. Activity records are kept for up to 90 days.</dd></div>
          </dl>
        </section>

        <Dialog open={Boolean(form)} title={form?.type === 'edit' ? 'Edit study activity' : 'Plan a study activity'}
          close={() => { if (!pending) setForm(null); }} initialFocus="select" className="ga-form-dialog" preserveScroll>
          {form && <ActivityForm key={form.type + '-' + (form.activity?.id || 'new')} source={form.type === 'edit' ? form.activity : null}
            copy={form.type === 'copy' ? form.activity : null} roomSubject={room.subject} now={now} custom={chatReviewAvailable}
            busy={pending} error={formError} save={saveActivity} cancel={() => setForm(null)}/>}
        </Dialog>
      </section>
    </>
  );
}

function ActivityDate({at, zone}) {
  const date = zonedFormatter(zone, {month: 'short', day: 'numeric'}).formatToParts(at);
  return (
    <span className="ga-date-tile" aria-hidden="true">
      <span>{date.find(part => part.type === 'month')?.value}</span>
      <strong>{date.find(part => part.type === 'day')?.value}</strong>
    </span>
  );
}

function ActivityStatus({phase, pendingResult = false, awaitingStart = false}) {
  const label = pendingResult ? 'Result pending' : awaitingStart ? 'Start time passed' : phaseLabel[phase];
  const tone = pendingResult ? 'result-pending' : awaitingStart ? 'start-overdue' : phase;
  return <span className="ga-status" data-phase={tone}>{label}</span>;
}

function ActivityList({title, items, now, selectedId, select, history = false}) {
  function rows(entries) {
    return (
      <ul className="ga-session-list">
        {entries.map(item => (
          <li key={item.id}>
            <button type="button" className="ga-session-row" aria-pressed={selectedId === item.id} aria-controls="room-activity-detail" onClick={() => select(item.id)}>
              <strong>{item.title}</strong>
              <span className="ga-session-row-date">{activityWhen(item.startsAt, item.zone)} · {item.zone}</span>
              <ActivityStatus phase={activityPhase(item, now)} pendingResult={item.awaitingResult} awaitingStart={item.status === 'scheduled' && item.startsAt < now}/>
              <ArrowRight size={16} aria-hidden="true"/>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className="ga-session-directory" aria-label={title}>
      <h4>{title}</h4>
      {rows(items.slice(0, 4))}
      {items.length > 4 && <details className="ga-session-more"><summary>Show {items.length - 4} more {history ? 'past activities' : 'activities'}<CaretDown size={16} aria-hidden="true"/></summary>{rows(items.slice(4))}</details>}
    </section>
  );
}

function ActivitySummary({detail, phase, members, profileId, onRepeat, pending}) {
  const {activity, summary, participants, own} = detail;
  const complete = ['ended', 'cancelled'].includes(phase);
  return (
    <section className="ga-side-card ga-summary-panel" aria-label={complete ? 'Activity summary' : 'Participants'}>
      <header className="ga-summary-panel-heading">
        <div>
          <div className="ga-summary-title"><h4><UsersThree size={18} aria-hidden="true"/>{complete ? 'Activity summary' : 'Participants'}</h4><span className="ga-joined-count">{summary.reserved} joined</span></div>
          <p>Confirmed room time and each member’s recorded result.</p>
        </div>
        {(phase === 'ended' || onRepeat) && <div className="ga-summary-actions">
          {phase === 'ended' && <button type="button" className="button" onClick={() => downloadJSON({app: 'StudyTimely', activity, summary, participants, own, exportedAt: new Date().toISOString()}, 'studytimely-activity.json')}><DownloadSimple size={17} aria-hidden="true"/>Download JSON</button>}
          {onRepeat && <button type="button" className="button ga-action-plan" disabled={pending} onClick={onRepeat}>Plan a similar activity</button>}
        </div>}
      </header>
      <dl className="ga-summary-metrics">
        <div data-metric="members"><dt><UsersThree size={18} aria-hidden="true"/>Started a timer</dt><dd>{summary.attended}</dd></div>
        <div data-metric="time"><dt><Clock size={18} aria-hidden="true"/>Recorded group study</dt><dd>{activityDuration(summary.seconds)}</dd></div>
        <div data-metric="results" data-complete={summary.reserved>0 && summary.checkedOut===summary.reserved}><dt><CheckCircle size={18} aria-hidden="true"/>Results submitted</dt><dd>{summary.checkedOut} <span>/ {summary.reserved}</span></dd></div>
      </dl>
      <div className="ga-summary-columns">
        <section className="ga-summary-members" aria-label="Member records">
          <h5><UsersThree size={17} aria-hidden="true"/>Member records</h5>
          {participants.length ? <ul className="ga-participants">
            {participants.map(person => {
              const presence = members.find(member => member.id === person.profile_id);
              let status = presence?.online ? 'In the room' : 'Offline';
              if (person.withdrawn_at) status = 'Withdrawn';
              else if (person.checked_out_at) status = ACTIVITY_OUTCOMES[person.outcome];
              else if (phase === 'ended') status = 'Result pending';
              else if (phase === 'cancelled') status = 'Cancelled';
              else if (phase === 'break') status = 'Break time';
              else if (presence?.studying && presence.activity_id === activity.id) status = 'Studying';
              return <li key={person.profile_id}>
                <div><strong>{person.nickname}{person.profile_id === profileId ? ' · you' : ''}</strong><span>{ACTIVITY_SUBJECTS[person.subject]} · {status}</span></div>
                <strong>{activityDuration(person.seconds)}</strong>
              </li>;
            })}
          </ul> : <p className="help">No one has joined yet.</p>}
        </section>
        <section className="ga-summary-schedule" aria-label="Session timing">
          <h5><CalendarBlank size={17} aria-hidden="true"/>Session timing</h5>
          <dl className="ga-session-timeline">
            <div><dt>Scheduled</dt><dd>{activityWhen(activity.startsAt,activity.zone)}</dd></div>
            {activity.startedAt>0&&<div><dt>Started</dt><dd>{activityWhen(activity.startedAt,activity.zone)}</dd></div>}
            {activity.endedAt>0&&phase==='ended'&&<div><dt>Ended</dt><dd>{activityWhen(activity.endedAt,activity.zone)}</dd></div>}
          </dl>
          <p className="ga-summary-zone">Times shown in {activity.zone}.</p>
        </section>
      </div>
      {phase === 'ended' && own?.reflection && <p className="ga-summary-export-note">Your download includes your private reflection.</p>}
    </section>
  );
}

function PersonalTaskFields({own,subject}){
 const latest=()=>({task:own?.task||'',subject:own?.subject||subject,version:own?.version||0}),[draft,setDraft]=useState(latest),[dirty,setDirty]=useState(false);
 useEffect(()=>{if(!dirty||draft.task.trim()===(own?.task||'')&&draft.subject===(own?.subject||subject)){setDraft(latest());setDirty(false);}},[own?.version]);
 const change=values=>{setDraft(d=>({...d,...values}));setDirty(true);};
 return <><input type="hidden" name="version" value={draft.version}/><div className="ga-form-two"><label className="field">Your study subject<select name="subject" value={draft.subject} onChange={e=>change({subject:e.target.value})}>{subjectOptions}</select></label><label className="field">Your personal task<input name="task" value={draft.task} onChange={e=>change({task:e.target.value})} required maxLength="240" placeholder="e.g. Practise ten algebra questions"/></label></div>{draft.version!==(own?.version||0)&&<p className="field-error">Your saved participation changed. Your draft is kept. <button type="button" className="text-button" onClick={()=>{setDraft(latest());setDirty(false);}}>Load latest task</button></p>}</>;
}
function CheckOutFields({own}){
 const latest=()=>({outcome:own.outcome||'',reflection:own.reflection||'',version:own.version}),[draft,setDraft]=useState(latest),[dirty,setDirty]=useState(false);
 useEffect(()=>{if(!dirty||draft.reflection.trim()===own.reflection&&draft.outcome===own.outcome){setDraft(latest());setDirty(false);}},[own.version]);
 const change=values=>{setDraft(d=>({...d,...values}));setDirty(true);};
 return (
  <>
   <input type="hidden" name="version" value={draft.version}/>
   <label className="field">
    <span className="ga-result-field-label">Study result <small>Shared with members</small></span>
    <select name="outcome" value={draft.outcome} onChange={event=>change({outcome:event.target.value})} required>
     <option value="">Choose your result</option>
     {Object.entries(ACTIVITY_OUTCOMES).map(([key,label])=><option key={key} value={key}>{label}</option>)}
    </select>
   </label>
   <label className="field">
    <span className="ga-result-field-label">Private reflection <small>Only you · optional</small></span>
    <textarea name="reflection" maxLength="500" rows="2" value={draft.reflection} onChange={event=>change({reflection:event.target.value})} placeholder="What went well? What would you do next time?"/>
   </label>
   {draft.version!==own.version&&<p className="field-error">Your saved participation changed. Your draft is kept. <button type="button" className="text-button" onClick={()=>{setDraft(latest());setDirty(false);}}>Load latest result</button></p>}
  </>
 );
}
function ActivityForm({source,copy,roomSubject,now,custom,busy,error,save,cancel}){
 const [zone,setZone]=useState(source?.zone||'UTC'),[wall,setWall]=useState(()=>activityWall(source?.startsAt||now+15*60000,source?.zone||'UTC'));
 useEffect(()=>{if(source)return;const local=Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';setZone(local);setWall(activityWall(now+15*60000,local));},[]);
 const defaults=source||copy||{},existingTitle=source&&source.title!==`${ACTIVITY_SUBJECTS[source.subject]} · ${ACTIVITY_KINDS[source.kind]}`?source.title:'';
 return <form className="settings-body ga-activity-form" onSubmit={e=>{e.preventDefault();save(Object.fromEntries(new FormData(e.currentTarget)));}}><div className="ga-form-two"><label className="field">Study subject<select name="subject" defaultValue={defaults.subject||roomSubject||'general'}>{subjectOptions}</select></label><label className="field">Activity type<select name="kind" defaultValue={defaults.kind||'focus'}>{Object.entries(ACTIVITY_KINDS).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label></div>
 {custom?<label className="field">Custom activity title (optional, reviewed before sharing)<input name="customTitle" maxLength="80" defaultValue={existingTitle} placeholder="Leave empty to use the subject and activity type"/></label>:existingTitle?<><input name="customTitle" type="hidden" value={existingTitle}/><p className="help">Activity title: {existingTitle}</p></>:null}
 <div className="ga-form-two"><label className="field">Date<input name="date" type="date" value={wall.date} onChange={e=>setWall(v=>({...v,date:e.target.value}))} required/></label><label className="field">Time<input name="time" type="time" value={wall.time} onChange={e=>setWall(v=>({...v,time:e.target.value}))} required/></label></div><label className="field">Time zone<select name="zone" value={zone} onChange={e=>setZone(e.target.value)}>{[...new Set([...zones,zone])].sort().map(z=><option key={z}>{z}</option>)}</select></label>
 <div className="ga-form-two"><label className="field">Study minutes<input name="focusMinutes" type="number" min="5" max="120" defaultValue={defaults.focusMinutes||25} required/></label><label className="field">Break minutes<input name="breakMinutes" type="number" min="0" max="30" defaultValue={defaults.breakMinutes??5} required/></label></div><details><summary>If the clock moves back</summary><label className="field">Repeated local time<select name="fold" defaultValue=""><option value="">Ask me if this time occurs twice</option><option value="earlier">First occurrence</option><option value="later">Second occurrence</option></select></label></details><p className="help">Members start their own timers. No automatic invitations or reminders.</p>{error&&<p className="field-error" role="alert">{error}</p>}<div className="ga-form-actions"><button className="button" type="button" disabled={busy} onClick={cancel}>Cancel</button><button className="button primary" disabled={busy}>{busy?'Saving…':source?'Save activity':'Schedule activity'}</button></div></form>;
}
