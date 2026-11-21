import {useEffect, useRef, useState} from 'react';
import {GroupTools} from './GroupTools.jsx';
import {GROUP_TOOL_CARDS, ToolLesson} from './GroupToolsGuide.jsx';
import {GroupToolsContent} from './GroupToolsContent.jsx';

const toolCopy = {
  tasks: {
    summary: 'Work on the same study task'
  },
  series: {
    summary: 'Set a regular time to study'
  },
  challenge: {
    summary: 'Track a goal together'
  },
  study: {
    summary: 'Use a scene or music'
  }
};

export function RoomAdvancedArea({
  selected, me, busy, onPreview, onRefresh, onManage, initialTool = 'tasks', ...tools
}) {
  const available = !!selected.access?.advancedActive;
  const closed = !!selected.room.closed;
  const canTry = !closed && selected.owner && me?.entitlements?.source === 'free'
    && me.entitlements.previewAvailable;
  const [saving, setSaving] = useState(false);
  const [recovery, setRecovery] = useState('');
  const [localError, setLocalError] = useState('');
  const [toolBusy, setToolBusy] = useState(false);
  const [selectedTool, setSelectedTool] = useState(initialTool);
  const current = GROUP_TOOL_CARDS.find(tool => tool.id === selectedTool) || GROUP_TOOL_CARDS[0];
  const opening = useRef(false);
  const panel = useRef(null);

  useEffect(() => {
    if (available) setRecovery('');
  }, [available]);

  function chooseTool(id) {
    setSelectedTool(id);
    if (window.matchMedia('(max-width: 720px)').matches) {
      requestAnimationFrame(() => {
        const title = panel.current?.querySelector('h3');
        title?.scrollIntoView({block: 'start'});
        title?.focus({preventScroll: true});
      });
    }
  }

  async function enable() {
    if (!canTry || busy || opening.current || recovery) return;
    opening.current = true;
    setSaving(true);
    setLocalError('');
    let outcome = '';
    let message = '';
    try {
      const result = await onPreview(true, {
        onSaved: () => { outcome = 'saved'; },
        onUncertain: () => { outcome = 'uncertain'; },
        onError: error => { message = error; }
      });
      if (!result) {
        setRecovery(outcome);
        setLocalError(message || 'The preview could not be enabled. Try again.');
      }
    } catch (error) {
      setRecovery(outcome);
      setLocalError(error.message);
    } finally {
      opening.current = false;
      setSaving(false);
    }
  }

  async function refreshAccess() {
    setLocalError('');
    let message = '';
    try {
      if (await onRefresh(error => { message = error; })) {
        setRecovery('');
      } else {
        setLocalError(message || 'Access could not be refreshed. Try again.');
      }
    } catch (error) {
      setLocalError(error.message);
    }
  }

  function renderAccess(active) {
    if (active) return null;

    let detail = 'The room owner controls advanced access. You can view saved content here.';
    if (closed) detail = 'This room is closed. Its saved content is read only.';
    else if (recovery === 'saved') detail = 'The preview was saved. Refresh access to load the latest room permissions.';
    else if (recovery === 'uncertain') detail = 'The preview request may have been saved. Refresh access to check before retrying.';
    else if (!available && canTry) detail = 'Prepare your settings here. Enable the free preview to save shared changes for your group. Personal scene and music controls remain available. No payment or subscription.';
    else if (selected.access?.canParticipate === false) detail = 'Your place is read only. Check Room settings for available places.';
    else if (available) detail = 'The tool is checking the room’s latest permissions.';
    else if (selected.owner) detail = 'The free preview is currently unavailable. Saved content stays read only.';

    return <div className="tools-access-line">
      <p role="status"><strong>{saving ? 'Enabling preview…' : canTry ? 'Sharing is off' : 'Read only'}</strong> · {detail}</p>
      <div className="tools-access-actions">
        {(saving || !available && canTry && !recovery) && <button type="button" className="button primary" disabled={busy || saving} onClick={enable}>
          {saving ? 'Enabling preview…' : 'Enable free preview'}
        </button>}
        {!closed && (recovery || available && selected.access?.canParticipate !== false || localError) && onRefresh &&
          <button type="button" className="text-button" disabled={busy || saving} onClick={refreshAccess}>
            {busy && !saving ? 'Refreshing access…' : 'Refresh access'}
          </button>}
        {!closed && selected.access?.canParticipate === false && onManage &&
          <button type="button" className="text-button" onClick={onManage}>Room access &amp; settings</button>}
      </div>
      {localError && <p className="field-error" role="alert">{localError}</p>}
    </div>;
  }

  return <section className="tools-hub" aria-labelledby="room-advanced-title">
    <header className="tools-page-heading">
      <h2 id="room-advanced-title" className="tools-hub-title">Group tools</h2>
      <p>Choose a tool to work with your group. Its controls and example appear below.</p>
    </header>
    <div className="tools-layout">
      <nav className="tools-sidebar" aria-label="Group tools">
        <ul className="tools-list">
          {GROUP_TOOL_CARDS.map(tool => <li key={tool.id}>
            <button type="button" aria-pressed={current.id === tool.id} aria-controls="group-tool-workspace"
              disabled={saving || busy || toolBusy} onClick={() => chooseTool(tool.id)}>
              <span className="tools-list-copy">
                <span className="tools-list-name">{tool.title}</span>
                <span className="tools-list-summary">{toolCopy[tool.id].summary}</span>
              </span>
              <img src={'/images/group-tools/' + tool.id + '-art.jpg'} alt="" width="320" height="240"/>
            </button>
          </li>)}
        </ul>
      </nav>
      <section id="group-tool-workspace" className="tools-workspace" ref={panel}
        aria-labelledby={'tools-workspace-title-' + current.id}>
        <GroupTools key={selected.room.id + current.id} {...tools} selected={selected} view={current.id}
          workspace={{
            id: current.id,
            title: current.title,
            description: current.description,
            renderAccess,
            canPrepare: !closed && selected.owner && (canTry || available || saving || Boolean(recovery))
              && selected.access?.canParticipate !== false,
            saving,
            onBusyChange: setToolBusy,
            previewActive: available
          }}/>
      </section>
    </div>
    <ToolLesson tool={current} titleAs="h3"/>
    <GroupToolsContent/>
  </section>;
}
