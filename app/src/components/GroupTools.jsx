import {createContext,useCallback,useContext,useEffect,useRef,useState} from 'react';
import {Plus,ArrowRight,CheckCircle,ShieldCheck} from '@phosphor-icons/react';
import {Dialog} from './Dialog.jsx';
import {WeeklyReport} from './WeeklyReport.jsx';
import {accountRequest} from '../lib/sync.mjs';
import {GROUP_TASK_TEMPLATES,WEEKDAYS,seriesDraft,seriesDates,dayPlus,ACTIVITY_SUBJECTS,ACTIVITY_KINDS} from '../lib/group-advanced.mjs';
import {activityWall,activityWhen} from '../lib/group-activities.mjs';
import {utcDay} from '../lib/community-model.mjs';
import {FOCUS_SCENES,sceneFor,sceneImage} from '../lib/focus-space.mjs';
import {MUSIC_TRACKS,musicTrack} from '../lib/music-catalog.mjs';
import './group-advanced.css';
const subjects=Object.entries(ACTIVITY_SUBJECTS),kinds=Object.entries(ACTIVITY_KINDS);
const GroupToolsData = createContext(null);
export function GroupPreview({me,busy,onChange}){const e=me?.entitlements;if(!e)return null;return <aside className="group-preview-strip"><div><strong>{e.source==='subscription'?'Group Plus':e.source==='preview'?'Advanced group preview':'Your free groups'}</strong><span>{e.source==='preview'?'Free to test · no payment or subscription created':`${me.roomOwnership.openCount}/${e.roomLimit} open rooms · up to ${e.memberLimit} places per room`}</span></div>{e.source==='free'&&e.previewAvailable&&<button className="button primary" disabled={busy} onClick={()=>onChange(true)}>Try advanced groups <ArrowRight size={17}/></button>}{e.source==='preview'&&<button className="text-button" disabled={busy} onClick={()=>onChange(false)}>End preview</button>}</aside>;}
function GroupToolsProvider({selected, auth, revision, workspace, initialWeek = '', children}) {
  const roomId = selected.room.id;
  const [data, setData] = useState(null);
  const [writing, setWriting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [week, setWeek] = useState(initialWeek);
  const alive = useRef(true);
  const ticket = useRef(0);
  const writeLock = useRef(false);
  const api = useCallback((endpoint = '', method = 'GET', values) =>
    accountRequest('/api/community/rooms/' + roomId + '/advanced' + endpoint,
      {method, data: values, csrf: auth?.csrf}), [roomId, auth?.csrf]);

  const load = useCallback(async () => {
    const request = ++ticket.current;
    try {
      const result = await api(week ? '?week=' + week : '');
      if (alive.current && request === ticket.current) {
        setData(result);
        setLoadError('');
      }
      return result;
    } catch (error) {
      if (alive.current && request === ticket.current) setLoadError(error.message);
      throw error;
    }
  }, [api, week]);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; ticket.current++; };
  }, []);
  useEffect(() => {
    load().catch(() => {});
  }, [revision, load, workspace?.previewActive]);

  return <GroupToolsData.Provider value={{
    data, setData, api, load, loadError, week, setWeek, writing, setWriting, writeLock
  }}>{children}</GroupToolsData.Provider>;
}

export function GroupTools(props) {
  return <GroupToolsProvider {...props}><GroupToolPanel {...props}/></GroupToolsProvider>;
}

function GroupToolPanel({
  view, selected, refresh, confirm, music, scene,
  onScene, onStudy, onPlan, onActivities, onInvite, activityOverview, onActivity, workspace
}) {
  const {data, setData, api, load, loadError, week, setWeek, writing, setWriting, writeLock} = useContext(GroupToolsData);
  const busy = writing || Boolean(workspace?.saving);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState(null);
  const alive = useRef(true);
  const headingRef = useRef(null);
  const primaryRef = useRef(null);
  const inlineFormRef = useRef(null);
  const initialFormShown = useRef(false);
  const headingId = 'tools-workspace-title' + (workspace?.id ? '-' + workspace.id : '');
  const formId = 'tools-inline-form' + (workspace?.id ? '-' + workspace.id : '');
  const formTitleId = 'tools-form-title' + (workspace?.id ? '-' + workspace.id : '');
  const failure = error || loadError;

  useEffect(() => {
    workspace?.onBusyChange?.(writing);
    return () => { workspace?.onBusyChange?.(false); };
  }, [writing, workspace?.onBusyChange]);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  async function write(endpoint, values) {
    if (busy || writeLock.current) return false;
    writeLock.current = true;
    setWriting(true);
    setError('');
    setNotice('');
    try {
      const result = await api('/' + endpoint, 'POST', values);
      if (!alive.current) return result;
      setNotice('Saved for this room.');
      try {
        await load();
        await refresh();
      } catch {
        if (alive.current) setError('Your change was saved. Refresh tools to load the latest room details.');
      }
      return result;
    } catch (error) {
      if (alive.current) setError(error.message);
      return false;
    } finally {
      writeLock.current = false;
      setWriting(false);
    }
  }

  function archive(task) {
    confirm({
      title: 'Archive this shared task?',
      body: 'It leaves the active board. Retained participation is kept for up to 90 days. Personal tasks and study records are unchanged.',
      action: 'Archive task',
      run: () => write('archive-task', {id: task.id, version: task.version})
    });
  }

  const permitted = !!data?.active && (!workspace || workspace.previewActive);
  const canManage = permitted && !!data.canManage;
  const active = permitted && !busy;
  const manage = canManage && !busy;
  const canPrepare = canManage || Boolean(workspace?.canPrepare);
  const canUseAtmosphere = Boolean(selected.member && selected.access?.canParticipate !== false && !selected.room.closed);
  const formBusy = busy || Boolean(workspace?.saving);
  const inline = Boolean(workspace);
  const createType = view === 'tasks' ? 'task' : view === 'series' ? 'series'
    : view === 'challenge' && !workspace && !data?.challenge ? 'challenge' : '';

  useEffect(() => {
    if (!data) return;
    if (!canPrepare) setForm(null);
    else if (inline && !initialFormShown.current) {
      initialFormShown.current = true;
      if (createType) setForm({type: createType, automatic: true});
    }
  }, [data, canPrepare, inline, createType]);

  useEffect(() => {
    if (form && !form.automatic && inline && canPrepare) {
      inlineFormRef.current?.querySelector('input, select')?.focus();
    }
  }, [form, inline, canPrepare]);

  function closeForm() {
    if (formBusy) return;
    setForm(null);
    setError('');
    if (workspace) (primaryRef.current || headingRef.current)?.focus({preventScroll: true});
  }

  function savedForm() {
    setForm(null);
    if (inline) headingRef.current?.focus({preventScroll: true});
  }

  function chooseWeek(value) {
    setData(null);
    setError('');
    setWeek(value);
  }

  const retry = <button type="button" className="text-button" disabled={busy}
    onClick={() => { setError(''); load().catch(() => {}); }}>
    {view === 'report' ? 'Retry weekly report' : 'Refresh tools'}
  </button>;
  const heading = workspace && <header className="tools-workspace-heading">
    <div>
      <h3 id={headingId} tabIndex={-1} ref={headingRef}>{workspace.title}</h3>
      <p>{workspace.description}</p>
    </div>
    {createType && canPrepare && !form && <button ref={primaryRef} className="button primary"
      type="button" aria-expanded={Boolean(form)} aria-controls={form ? formId : undefined}
      disabled={formBusy || !data} onClick={() => form ? closeForm() : setForm({type: createType})}>
      {view === 'tasks' && <Plus size={17} aria-hidden="true"/>} {view === 'tasks' ? 'Add shared task' : view === 'series' ? 'Repeat an activity' : 'Set a group goal'}
    </button>}
  </header>;

  if (!data) return <div className="group-tools">
    {heading}
    <p className="tools-loading" role={failure ? 'alert' : 'status'}>{failure || (view === 'report' ? 'Loading weekly report…' : 'Loading shared tools…')}</p>
    {failure && retry}
    {workspace && !workspace.previewActive && (view !== 'study' || !canUseAtmosphere) && workspace.renderAccess(false)}
  </div>;

  const formTitle = form?.type === 'task' ? (form.task ? 'Edit shared task' : 'New shared task')
    : form?.type === 'series' ? (form.series ? 'Edit repeating activity' : 'New repeating activity') : 'Group goal settings';
  const formContent = <>
    {failure && <p className="field-error" role="alert">{failure} {loadError && retry}</p>}
    {form?.type === 'task' && <TaskForm key={form.task?.id || 'new'} task={form.task}
      reviewAvailable={data.reviewAvailable} busy={formBusy} canSave={manage}
      save={async values => { if (manage && await write('tasks', values)) savedForm(); }}/>}
    {form?.type === 'series' && <SeriesForm key={form.series?.id || 'new'} series={form.series}
      busy={formBusy} api={permitted ? api : async (_endpoint, _method, values) => seriesDates(values, data.serverNow)}
      canSave={manage} save={async values => { if (manage && await write('series', values)) savedForm(); }}/>}
    {form?.type === 'challenge' && <ChallengeForm key={data.challenge?.id || 'new'} challenge={data.challenge} busy={formBusy} canSave={manage} now={data.serverNow}
      save={async values => { if (manage && await write('challenge', values)) savedForm(); }}/>}
  </>;
  const upcoming = (activityOverview?.recurring || []).filter(item => item.startsAt >= data.serverNow)
    .sort((a, b) => a.startsAt - b.startsAt).slice(0, 3);

  return <div className={'group-tools group-tools-' + view}>
    {heading}
    {failure && !form && <div role="alert" className="field-error">{failure} {retry}</div>}
    {notice && <p className="help" role="status">{notice}</p>}
    {!workspace && !data.active && <div className="group-tools-paused">
      <strong>{selected.access?.canParticipate === false ? 'Room access is paused' : 'Retained advanced content'}</strong>
      <span>Saved tasks, appointments and reports are kept. Free room tools remain available within your allowance.</span>
    </div>}
    {workspace && form && canPrepare && <section id={formId} className="tools-inline-form" ref={inlineFormRef}
      aria-labelledby={formTitleId}>
      <h4 id={formTitleId} className={form.automatic ? 'tools-form-label' : undefined}>{formTitle}</h4>
      {!form.automatic && <button className="text-button tools-form-cancel" type="button" disabled={formBusy} onClick={closeForm}>Cancel</button>}
      {!permitted && workspace.renderAccess(false)}
      {formContent}
    </section>}
    {workspace && !form && (view !== 'study' || !canUseAtmosphere) && (view !== 'challenge' || !canPrepare) && workspace.renderAccess(permitted)}
    {view === 'study' && <RoomAtmosphere data={data} manage={manage} canUse={canUseAtmosphere}
      canPrepare={canPrepare} busy={busy} write={write} music={music} scene={scene} onScene={onScene} workspace={workspace}/>}
    {view === 'series' && <section className="group-tool-card group-repeat-card" aria-label="Recurring schedules">
      {!workspace && <header><h2>Make it a weekly habit</h2><button className="button" disabled={!manage}
        onClick={() => setForm({type:'series'})}>Repeat an activity</button></header>}
      {workspace && upcoming.length > 0 && <ol className="tools-occurrences" aria-label="Upcoming recurring activities">
        {upcoming.map((item, index) => <li key={item.id}>
          <div>
            <strong>{index === 0 ? 'Next · ' : ''}{activityWhen(item.startsAt, item.zone)} · {item.zone}</strong>
            <span>{item.title}</span>
          </div>
          {onActivity && <button type="button" className="button" onClick={() => onActivity(item)}>View activity</button>}
        </li>)}
      </ol>}
      {workspace && data.series.some(series => series.enabled) && !upcoming.length &&
        <p className="help">{!activityOverview || activityOverview.loading ? 'Loading upcoming dates…'
          : activityOverview.error ? 'Upcoming dates are unavailable.' : 'No upcoming dates are currently scheduled.'}</p>}
      {workspace && !permitted && !selected.room.closed && selected.access?.canParticipate !== false &&
        (selected.owner || selected.canManage) && onPlan &&
        <button className="text-button tools-single-activity" type="button" onClick={onPlan}>Plan a single activity →</button>}
      {data.series.length === 0
        ? <p className="tools-empty">No recurring activities yet.{canManage && ' Choose weekdays and preview the next three dates.'}</p>
        : <div className="group-series-list">{data.series.map(series => <div key={series.id}>
          <div>
            <strong>{ACTIVITY_SUBJECTS[series.subject]} · {ACTIVITY_KINDS[series.kind]}</strong>
            <div className="tools-series-time">
              <span>{JSON.parse(series.weekdays).map(day => WEEKDAYS[day]).join(', ')} · {series.local_time} · {series.zone}</span>
              <span className="tools-series-status" data-paused={!series.enabled}>{series.enabled ? 'Repeating' : 'Paused'}</span>
            </div>
          </div>
          {canManage && <div className="community-row">
            <button className="text-button" disabled={busy} onClick={() => setForm({type:'series', series})}>
              {series.enabled ? 'Edit future dates' : 'Review & resume'}
            </button>
            {series.enabled && <button className="text-button" disabled={busy} onClick={() => confirm({
              title:'Pause future activities?',
              body:'Upcoming occurrences are cancelled. Completed and running activities keep their records.',
              action:'Pause series',
              run:() => write('series', {id:series.id, version:series.version, pause:true})
            })}>Pause</button>}
          </div>}
        </div>)}</div>}
    </section>}
    {view === 'tasks' && <section className="group-tool-card group-task-board" aria-label="Task list">
      {workspace && <h4 className="tools-board-title">Tasks in this room <span>{data.tasks.length}</span></h4>}
      {!workspace && <header><h2>Shared tasks</h2><button className="button primary" disabled={!manage}
        onClick={() => setForm({type:'task'})}>Add shared task</button></header>}
      {data.tasks.length === 0
        ? <p className="tools-empty">No shared tasks yet. {canManage ? 'Add a task for the group.' : 'Tasks from a room organiser will appear here.'}</p>
        : <div className="group-task-list">{data.tasks.map(task =>
          <article className={'group-shared-task ' + (task.own?.status === 'done' ? 'is-done' : '')} key={task.id}>
            {workspace && <span className="tools-task-status" data-own={task.own?.status} aria-hidden="true">
              {task.own?.status === 'done' ? '✓' : ''}
            </span>}
            <div className="group-task-copy">
              <span className="group-kicker">{ACTIVITY_SUBJECTS[task.subject]}</span>
              <h3>{task.title}</h3>
              <p>{task.participants} joined · {task.completed} finished{task.own && (task.own.status === 'done' ? ' · You finished' : ' · You joined')}</p>
            </div>
            {permitted && <div className="group-task-actions">
              {!task.own
                ? <button className="button" disabled={!active} onClick={() => write('claim', {id:task.id, status:'working', version:0})}>Join task</button>
                : <>
                  <button className={'button ' + (task.own.status === 'done' ? '' : 'primary')} disabled={!active}
                    onClick={() => write('claim', {id:task.id, status:task.own.status === 'done' ? 'working' : 'done', version:task.own.version})}>
                    {task.own.status === 'done' ? 'Reopen my part' : 'My part is done'}
                  </button>
                  <button className="text-button" disabled={!active}
                    onClick={() => write('claim', {id:task.id, status:'leave', version:task.own.version})}>Leave task</button>
                </>}
              {canManage && <>
                <button className="text-button" disabled={busy} onClick={() => setForm({type:'task', task})}>Edit</button>
                <button className="text-button" disabled={busy} onClick={() => archive(task)}>Archive</button>
              </>}
            </div>}
          </article>
        )}</div>}
    </section>}
    {['progress','report','challenge'].includes(view) && <Progress reportOnly={view === 'report'} challengeOnly={view === 'challenge'}
      data={data} week={week} setWeek={chooseWeek} manage={manage} active={active} busy={busy}
      write={write} setForm={setForm} confirm={confirm} onStudy={onStudy} onPlan={onPlan} onActivities={onActivities} workspace={workspace}
      canPrepare={canPrepare} onInvite={onInvite} canInvite={Boolean(selected.owner && selected.room.invitationsOpen && !selected.room.closed && selected.access?.canParticipate !== false)}/>}
 {view==='manage'&&<section className="group-tool-card"><header><div><span className="group-kicker"><ShieldCheck size={17}/>ROOM ORGANISERS</span><h2>A little help running your group</h2></div><span className="group-pill">{data.roles.length}/2 co-hosts</span></header><p>Co-hosts can organise activities, manage shared tasks and moderate regular members.</p><p className="help">Only the owner changes room access, assigns roles or closes the room. Co-hosts cannot manage the owner or each other.</p>{selected.owner?<div className="group-role-list">{selected.members.filter(m=>m.id!==selected.room.ownerId).map(m=>{const role=data.roles.some(r=>r.profile_id===m.id);return <div key={m.id}><div><strong>{m.nickname}</strong><span>{role?'Co-host':'Member'}{m.readOnly?' · read-only place':''}</span></div><button className="button" disabled={busy||(!role&&(!data.active||m.readOnly||data.roles.length>=2))} onClick={()=>confirm({title:role?'Remove co-host access?':'Make this member a co-host?',body:role?'Their membership and records are kept.':'They can manage shared learning tools and moderate regular members in this room.',action:role?'Remove co-host':'Make co-host',run:()=>write('roles',{profileId:m.id,enabled:!role})})}>{role?'Remove role':'Make co-host'}</button></div>;})}{selected.members.length===1&&<p className="group-empty">Invite a member before choosing a co-host.</p>}</div>:<p className="help">{data.roles.length?data.roles.map(r=>r.nickname).join(', ')+' help organise this room.':'There are no co-hosts yet.'}</p>}</section>}

    {workspace && (permitted || view === 'study' && canUseAtmosphere) && <p className="tools-usage">
      {view === 'tasks' ? 'Join a task below. When you finish, choose My part is done. Each member records their own part.'
        : view === 'series' ? 'Open a date to reserve your place. Each member starts their own timer when the activity begins.'
        : view === 'challenge' ? 'Confirmed room study time or attended activities move this goal forward.'
        : 'Apply the scene on this device. Music starts when you choose Play music.'}
    </p>}
    {!workspace && <Dialog open={!!form && canManage} title={formTitle}
      close={closeForm} className="group-tool-dialog" preserveScroll busy={busy}>
      <div className="settings-body">{formContent}</div>
    </Dialog>}
  </div>;
}
function TaskForm({task, reviewAvailable, busy, canSave = true, save}) {
  const [template, setTemplate] = useState(
    Object.entries(GROUP_TASK_TEMPLATES).find(([, title]) => title === task?.title)?.[0] || 'read'
  );
  const [custom, setCustom] = useState(Boolean(task && !Object.values(GROUP_TASK_TEMPLATES).includes(task.title)));
  const requestId = useRef(task?.id || crypto.randomUUID());

  function submit(event) {
    event.preventDefault();
    if (busy || !canSave || custom && !reviewAvailable) return;
    const fields = new FormData(event.currentTarget);
    save({
      ...Object.fromEntries(fields), id: requestId.current, version: task?.version || 0,
      template, title: custom ? fields.get('title') : ''
    });
  }

  return <form className="group-tool-form tools-task-form" onSubmit={submit}>
    <div className="tools-task-fields">
      <label className="field">Subject
        <select name="subject" defaultValue={task?.subject || 'general'} disabled={busy}>
          {subjects.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </label>
      <label className="field">Task
        {custom
          ? <input name="title" maxLength={120} required defaultValue={task?.title || ''}
              placeholder="What will your group work on?" disabled={busy}/>
          : <select value={template} onChange={event => setTemplate(event.target.value)} disabled={busy}>
              {Object.entries(GROUP_TASK_TEMPLATES).map(([id, title]) => <option key={id} value={id}>{title}</option>)}
            </select>}
      </label>
    </div>
    {(reviewAvailable || custom) && <label className="tools-custom-title">
      <input type="checkbox" checked={custom} disabled={busy || !reviewAvailable && !custom}
        onChange={event => setCustom(event.target.checked)}/>
      Write my own task
    </label>}
    <div className="tools-task-save">
      <button className="button primary" disabled={busy || !canSave || custom && !reviewAvailable}>
        {busy ? 'Saving…' : 'Save shared task'}
      </button>
      <p className="help">{custom
        ? reviewAvailable ? 'Your title is checked before it is shared.' : 'Custom titles are currently unavailable. Choose a ready-made task.'
        : 'Choose a small task for everyone to work on.'}</p>
    </div>
  </form>;
}
function SeriesForm({series,busy,api,save,canSave=true}){const [draft,setDraft]=useState(()=>({...(series?{...seriesDraft(series),date:series.local_date<activityWall(Date.now(),series.zone).date?activityWall(Date.now(),series.zone).date:series.local_date}:{subject:'general',kind:'focus',...activityWall(Date.now()+86400000,'UTC'),zone:'UTC',fold:'earlier',weekdays:[new Date(Date.now()+86400000).getUTCDay()],focusMinutes:25,breakMinutes:5})})),[preview,setPreview]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(false),requestId=useRef(series?.id||crypto.randomUUID()),revision=useRef(0);function change(patch){revision.current++;setPreview(null);setError('');setDraft(d=>({...d,...patch}));}async function check(){const n=revision.current;setLoading(true);setError('');try{const p=await api('/series-preview','POST',draft);if(n===revision.current)setPreview(p);}catch(e){setError(e.message);}finally{setLoading(false);}}return <form className="group-tool-form" onSubmit={async e=>{e.preventDefault();if(busy||loading)return;if(!preview)return check();if(!canSave)return;save({...draft,id:requestId.current,version:series?.version||0});}}><p className="help">{series?'Changes replace future scheduled occurrences. Members confirm a new reservation; past and running sessions stay as they are.':'Preview the next three dates. Each person reserves a place and starts their own timer.'}</p><div className="group-field-pair"><label className="field">Subject<select value={draft.subject} onChange={e=>change({subject:e.target.value})}>{subjects.map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></label><label className="field">Activity<select value={draft.kind} onChange={e=>change({kind:e.target.value})}>{kinds.map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></label></div><fieldset><legend>Repeat on</legend><div className="group-weekdays">{WEEKDAYS.map((label,i)=><label key={i}><input type="checkbox" checked={draft.weekdays.includes(i)} onChange={e=>change({weekdays:e.target.checked?[...draft.weekdays,i]:draft.weekdays.filter(d=>d!==i)})}/><span>{label}</span></label>)}</div></fieldset><div className="group-field-pair"><label className="field">From date<input type="date" required value={draft.date} onChange={e=>change({date:e.target.value})}/></label><label className="field">Local start time<input type="time" required value={draft.time} onChange={e=>change({time:e.target.value})}/></label></div><label className="field">Time zone<input required list="group-time-zones" value={draft.zone} onChange={e=>change({zone:e.target.value})}/><datalist id="group-time-zones">{['UTC','Europe/London','Europe/Paris','Asia/Shanghai','Asia/Tokyo','America/New_York','America/Los_Angeles','Australia/Sydney'].map(z=><option key={z} value={z}/>)}</datalist></label><div className="group-field-pair"><label className="field">Study minutes<input type="number" min={5} max={120} required value={draft.focusMinutes} onChange={e=>change({focusMinutes:Number(e.target.value)})}/></label><label className="field">Break minutes<input type="number" min={0} max={30} required value={draft.breakMinutes} onChange={e=>change({breakMinutes:Number(e.target.value)})}/></label></div><details><summary>When clocks change</summary><p className="help">Missing local times are skipped. For a repeated time, use:</p><select aria-label="Repeated local time" value={draft.fold} onChange={e=>change({fold:e.target.value})}><option value="earlier">First occurrence</option><option value="later">Second occurrence</option></select></details>{error&&<p role="alert" className="field-error">{error}</p>}{preview&&<div className="group-date-preview"><strong>Next three dates · {draft.zone}</strong>{preview.days.map(d=><span key={d.startsAt}>{activityWhen(d.startsAt,draft.zone)}</span>)}{preview.skipped.length>0&&<p>Skipped clock-change dates: {preview.skipped.join(', ')}</p>}<p className="help">Times remain in this zone when your device travels.</p></div>}<button className="button primary" disabled={busy||loading||!!preview&&!canSave}>{loading?'Checking dates…':preview?(series?'Save future dates':'Create repeating activity'):'Preview dates'}</button></form>;}
function Progress({data,week,setWeek,manage,busy,write,setForm,confirm,reportOnly=false,challengeOnly=false,onStudy,onPlan,onActivities,workspace,canPrepare,canInvite,onInvite}) {
  return <>
    {!reportOnly && <GroupGoal data={data} manage={manage} busy={busy} write={write} confirm={confirm}
      inline={Boolean(workspace)} canPrepare={canPrepare} canInvite={canInvite} onInvite={onInvite}
      renderAccess={workspace?.renderAccess} permitted={data.active && (!workspace || workspace.previewActive)}
      onSettings={() => setForm({type:'challenge'})}/>}
    {!challengeOnly && <WeeklyReport report={data.report} now={data.serverNow} week={week} onWeek={setWeek} busy={busy} onStudy={onStudy} onPlan={onPlan} onActivities={onActivities}/>}
  </>;
}

export function GroupGoal({data,manage,busy,write,confirm,inline=false,canPrepare=false,canInvite=false,onInvite,renderAccess,permitted,onSettings}) {
  const goal = data.challenge;
  const paused = goal?.progress === null;
  const [invitation, setInvitation] = useState('');
  const [copying, setCopying] = useState(false);
  const copyLock = useRef(false);
  async function invite() {
    if (!canInvite || !onInvite || copyLock.current) return;
    copyLock.current = true;
    setCopying(true);
    try {
      setInvitation(await onInvite()
        ? 'Room invitation copied. Send it to your study partners so they can join this room and contribute to the goal.'
        : 'Invitation could not be copied. Open Room settings to copy your invitation code.');
    } catch {
      setInvitation('Invitation could not be copied. Open Room settings to copy your invitation code.');
    } finally { copyLock.current = false; setCopying(false); }
  }
  return <section className="group-tool-card group-challenge-card" aria-label="Group goal">
    {!inline && <header><h2>Group goal</h2>
      {manage && <button className="button" disabled={busy} onClick={onSettings}>{goal ? 'Edit goal settings' : 'Set a group goal'}</button>}
    </header>}
    {goal ? <>
      <div className="group-challenge-value">
        {paused && <span className="tools-challenge-state">Progress paused</span>}
        <strong>{paused ? goal.goal : goal.progress + ' / ' + goal.goal}</strong>
        <span>{paused ? 'Target · ' : ''}{goal.kind === 'minutes' ? 'recorded study minutes together' : 'activities with attendance'}</span>
      </div>
      {!paused && <progress max={goal.goal} value={Math.min(goal.goal, goal.progress)} aria-label="Group goal progress"/>}
      <p className="tools-challenge-dates">{goal.start_day} – {goal.end_day} · UTC</p>
      {paused && <p className="help">Progress updates when advanced tools are active for this room.</p>}
      <p className="help">{goal.kind === 'minutes'
        ? 'Study in this room and check in when prompted. Confirmed minutes from all members add to this goal.'
        : 'Start your own timer in a scheduled room activity. Each activity with attendance counts once towards this goal.'}</p>
      {canInvite && onInvite && <div className="tools-goal-invitation">
        <button type="button" className="button" disabled={busy || copying} onClick={invite}>
          {copying ? 'Copying invitation…' : 'Invite members to this goal'}
        </button>
        <p className="help">Copies this room’s private invitation. New members contribute by studying here.</p>
        {invitation && <p role="status" className="help">{invitation}</p>}
      </div>}
    </> : <p className="tools-empty">No group goal yet. {canPrepare || manage ? 'Choose what to count, a target and an end date below.' : 'A goal set by a room organiser will appear here.'}</p>}
    {inline && canPrepare && <div className="tools-goal-settings">
      <h4>{goal ? 'Goal settings' : 'Set your first group goal'}</h4>
      <ChallengeForm key={goal?.id || 'new'} challenge={goal} now={data.serverNow} busy={busy} canSave={manage}
        access={!permitted && renderAccess?.(false)} save={values => write('challenge', values)}/>
    </div>}
    {goal && manage && <div className="tools-goal-end">
      <button type="button" className="button" disabled={busy} onClick={() => confirm({
        title:'End the current group goal?',
        body:'Recorded study time is kept. You can set a new goal after ending this one.',
        action:'End current goal',
        run:() => write('challenge', {id:goal.id, version:goal.version, archive:true})
      })}>End current goal</button>
      <p className="help">Ends this goal for everyone. Your study records are kept.</p>
    </div>}
  </section>;
}

export function ChallengeForm({challenge,busy,now,save,canSave=true,access}) {
  const requestId = useRef(challenge?.id || crypto.randomUUID());
  const [draft,setDraft] = useState(() => ({kind:challenge?.kind || 'minutes',goal:challenge?.goal ?? 600,
    endDay:challenge?.end_day || dayPlus(utcDay(now),6),version:challenge?.version || 0}));
  const [dirty,setDirty] = useState(false);
  useEffect(() => {
    if (challenge && !dirty && challenge.version >= draft.version) setDraft({kind:challenge.kind,goal:challenge.goal,endDay:challenge.end_day,version:challenge.version});
  }, [challenge?.version, dirty]);
  function change(patch) { setDirty(true); setDraft(previous => ({...previous,...patch})); }
  async function submit(event) {
    event.preventDefault();
    if (busy || !canSave) return;
    const result = await save({...draft,id:requestId.current});
    if (result) { setDraft(previous => ({...previous,version:result.version})); setDirty(false); }
  }
  return <form className="group-tool-form tools-goal-form" onSubmit={submit}>
    {challenge ? <p className="help">Counting <strong>{draft.kind === 'minutes' ? 'recorded study minutes together' : 'activities with attendance'}</strong>. Changing the target or end date keeps the original start date and recorded progress.</p>
      : <label className="field">What should count?<select value={draft.kind} disabled={busy} onChange={event => change({kind:event.target.value,goal:event.target.value === 'activities' ? 3 : 600})}>
        <option value="minutes">Recorded study minutes together</option><option value="activities">Activities with attendance</option>
      </select></label>}
    <div className="group-field-pair">
      <label className="field">{draft.kind === 'minutes' ? 'Target · minutes' : 'Target · activities'}
        <input type="number" min={1} max={draft.kind === 'activities' ? 100 : 120000} required disabled={busy}
          value={draft.goal} onChange={event => change({goal:event.target.value})}/>
      </label>
      <label className="field">End date · UTC
        <input type="date" min={utcDay(now)} max={dayPlus(utcDay(now),55)} required disabled={busy}
          value={draft.endDay} onChange={event => change({endDay:event.target.value})}/>
      </label>
    </div>
    <p className="help">{challenge ? 'To change what counts, end this goal and start a new one.' : 'Starts today.'} Reaching the target does not stop a timer.</p>
    {challenge && challenge.version !== draft.version && <p className="help" role="status">
      This goal changed while you were editing. <button type="button" className="text-button" disabled={busy}
        onClick={() => setDirty(false)}>Reload goal settings</button>
    </p>}
    {access}
    <button type="submit" className="button primary" disabled={busy || !canSave}>
      {busy ? 'Saving goal…' : challenge ? 'Save goal changes' : 'Create group goal'}
    </button>
  </form>;
}

export function RoomAtmosphere({data,manage,canUse,canPrepare,busy,write,music,scene,onScene,workspace}) {
  const environment = data.environment;
  const [draft,setDraft] = useState(() => ({scene:environment.scene,music:environment.music,
    quietChat:Boolean(environment.quiet_chat),version:environment.version}));
  const [dirty,setDirty] = useState(false);
  const [feedback,setFeedback] = useState('');
  useEffect(() => {
    if (!dirty && environment.version >= draft.version) setDraft({scene:environment.scene,music:environment.music,
      quietChat:Boolean(environment.quiet_chat),version:environment.version});
  }, [environment.scene,environment.music,environment.quiet_chat,environment.version,dirty]);
  const preview = sceneFor(draft.scene);
  const playing = music?.trackId === draft.music && ['playing','loading'].includes(music.status);
  const sceneApplied = scene === draft.scene;
  const canRecommend = Boolean(canUse && canPrepare);
  function change(patch) { setDirty(true); setFeedback(''); setDraft(previous => ({...previous,...patch})); }
  async function saveRecommendation(event) {
    event.preventDefault();
    if (!manage || busy) return;
    const result = await write('environment',draft);
    if (result) { setDraft(previous => ({...previous,version:result.version})); setDirty(false); }
  }
  return <section className="group-room-atmosphere" aria-label="Scene and music controls">
    <figure className="tools-scene-preview">
      <img src={sceneImage(draft.scene)} alt={preview.name + ' study background'}/>
      <figcaption>{draft.scene === environment.scene ? 'Suggested room scene' : 'Your scene preview'}</figcaption>
    </figure>
    <div className="tools-atmosphere-copy">
      <div className="group-field-pair tools-atmosphere-selectors">
        <label className="field">Background<select value={draft.scene} disabled={!canUse || busy} onChange={event => change({scene:event.target.value})}>
          {FOCUS_SCENES.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select></label>
        <label className="field">Music<select value={draft.music} disabled={!canUse || busy} onChange={event => change({music:event.target.value})}>
          {MUSIC_TRACKS.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select></label>
      </div>
      <div className="tools-atmosphere-actions">
        <button type="button" className="button primary" disabled={!canUse || !onScene || sceneApplied} onClick={() => {
          onScene(draft.scene); setFeedback('Scene applied on this device.');
        }}>{sceneApplied ? 'Scene applied' : 'Use scene'}</button>
        <button type="button" className="button" disabled={!canUse || !music?.ready}
          onClick={() => playing ? music.onPause() : music.onPlay(draft.music,[draft.music])}>
          {playing ? 'Pause music' : 'Play music'}
        </button>
      </div>
      <div className="group-room-volume">
        <label htmlFor="group-room-volume-input">Volume</label>
        <input id="group-room-volume-input" type="range" min="0" max="100" disabled={!canUse || !music?.ready}
          value={music?.volume ?? 35} onChange={event => music.onVolume(Number(event.target.value))}/>
        <span>{music?.volume ?? 35}%</span>
      </div>
      {music && ['playing','loading'].includes(music.status) && <p className="help">Now playing · {musicTrack(music.trackId)?.title || 'Instrumental music'}</p>}
      <p className="help">Your background, playback and volume apply on this device. Choosing a scene does not start audio.</p>
      {!canUse && <p className="help">An active room place is needed to use these controls.</p>}
      {feedback && <p className="help" role="status">{feedback}</p>}
      {music?.error && <p className="field-error" role="alert">{music.error}</p>}
    </div>
    {canRecommend && <form className="tools-room-recommendation" onSubmit={saveRecommendation}>
      <h4>Recommend this combination to the room</h4>
      <p className="help">Save the selected background and music as the room’s suggestion. Members choose whether to use them.</p>
      <label className="switch-row"><input type="checkbox" checked={draft.quietChat} disabled={busy}
        onChange={event => change({quietChat:event.target.checked})}/> Keep free-text chat for activity breaks</label>
      {environment.version > draft.version && <p className="help" role="status">
        The room recommendation changed. <button type="button" className="text-button" disabled={busy}
          onClick={() => setDirty(false)}>Reload room recommendation</button>
      </p>}
      {!(data.active && (!workspace || workspace.previewActive)) && workspace?.renderAccess(false)}
      <button type="submit" className="button primary" disabled={!manage || busy}>Save as room recommendation</button>
    </form>}
  </section>;
}
