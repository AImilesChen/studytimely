import {useEffect, useId, useRef, useState} from 'react';
import {ArrowRight, CheckCircle, NotePencil} from '@phosphor-icons/react';
import {ACTIVITY_OUTCOMES, activityDuration} from '../lib/group-activities.mjs';

export function ActivityCheckout({
  own, phase, pending, error, onSubmit, children, openRequest = 0, visible = true, readOnly = false
}) {
  const id = useId();
  const saved = Boolean(own.checkedOutAt);
  const ended = phase === 'ended';
  const [open, setOpen] = useState(Boolean(openRequest));
  const [failed, setFailed] = useState(false);
  const form = useRef(null);
  const toggle = useRef(null);
  const wantsFocus = useRef(Boolean(openRequest));

  useEffect(() => {
    if (openRequest) {
      wantsFocus.current = true;
      setOpen(true);
    }
  }, [openRequest]);

  useEffect(() => {
    if (!open || !visible || readOnly || !wantsFocus.current) return;
    const frame = requestAnimationFrame(() => {
      wantsFocus.current = false;
      form.current?.scrollIntoView({block: 'nearest'});
      form.current?.querySelector('select')?.focus({preventScroll: true});
    });
    return () => cancelAnimationFrame(frame);
  }, [open, visible, readOnly, openRequest]);

  function closeForm() {
    setOpen(false);
    wantsFocus.current = false;
    requestAnimationFrame(() => toggle.current?.focus({preventScroll: true}));
  }

  async function submit(event) {
    setFailed(false);
    if (await onSubmit(event)) closeForm();
    else setFailed(true);
  }

  const title = saved ? 'Result saved' : ended ? 'Result pending' : 'Finish your study';
  const action = saved ? 'Edit result & reflection' : ended ? 'Add result' : 'Finish & add result';
  const submitLabel = saved ? 'Save changes' : ended ? 'Save result' : 'Finish study & save result';
  const primary = ended && !saved && !open;

  return (
    <section className="ga-result-card" data-result={saved ? 'saved' : ended ? 'pending' : 'in-progress'} aria-labelledby={id + '-title'}>
      <header>
        <div className="ga-result-intro">
          <span className="ga-result-icon">{saved ? <CheckCircle size={20} aria-hidden="true"/> : <NotePencil size={20} aria-hidden="true"/>}</span>
          <div>
            <h4 id={id + '-title'} role={saved ? 'status' : undefined}>{title}</h4>
            {saved && <p>{ACTIVITY_OUTCOMES[own.outcome]}{own.reflection?.trim() ? ' · Private reflection saved' : ''}</p>}
            {!readOnly && <p className="ga-entry-hint">{saved ? 'Expand here to edit your shared result and private reflection.' : 'Expand here to choose a shared result and add an optional private reflection.'}</p>}
            {!saved && !ended && !readOnly && <p className="ga-entry-hint">Saving finishes your participation and stops your activity timer. It cannot be restarted for this activity.</p>}
            {ended && <p className="ga-personal-record"><strong>{activityDuration(own.seconds)}</strong> recorded in this activity</p>}
            {ended && !saved && readOnly && <p>This activity is read only.</p>}
          </div>
        </div>
        {!readOnly && (
          <button
            ref={toggle}
            type="button"
            className={primary ? 'button primary ga-action-join ga-result-primary' : 'button ga-result-toggle'}
            aria-expanded={open}
            aria-controls={id + '-form'}
            disabled={pending}
            onClick={() => {
              if (open) closeForm();
              else { wantsFocus.current = true; setOpen(true); }
            }}
          >
            {open ? 'Hide form' : action}{!open && <ArrowRight size={17} aria-hidden="true"/>}
          </button>
        )}
      </header>
      {!readOnly && (
        <form ref={form} id={id + '-form'} onSubmit={submit} className="ga-checkout ga-result-form" hidden={!open} aria-label="Study result and private reflection">
          <fieldset className="ga-result-fields" disabled={pending}>{children}</fieldset>
          {!saved && !ended && <p className="ga-result-consequence">Saving ends your participation and stops your activity timer. You cannot restart this activity timer afterwards.</p>}
          {failed && <p role="alert" className="field-error">{error || 'Your result could not be saved. Your entries are kept. Try again.'}</p>}
          <div className="ga-result-form-actions">
            <button className="button primary ga-action-join" disabled={pending}>{pending ? 'Saving…' : submitLabel}</button>
            <button className="button" type="button" disabled={pending} onClick={closeForm}>Cancel</button>
          </div>
        </form>
      )}
    </section>
  );
}
