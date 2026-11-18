# Study Planner calendar usability — local handoff

2026-11-18. Implemented locally; no commit, push or deployment. Production/package remain V2.32.0. This work builds on and preserves the uncommitted exam-preparation implementation.

## User-visible changes

The Week workspace now has a bounded 260px desktop task pane and a matching-height calendar. The task pane scrolls internally, has search and a fixed Add task button. To arrange subtracts all future planned reservations from remaining work; fully arranged tasks are collapsed separately. Done and omitted activities are excluded. Inactive preparations are not offered for new manual placement. Existing tasks stay editable without making copies.

The calendar uses a distinct neutral surface, subtle available-window hatching, patterned fixed commitments and stronger subject-coloured activity blocks. Colours reuse the analytics palette. Library icons distinguish study, review, mock papers and corrections. Short appointments prioritize names and keep real time-scale geometry. Accessible names and the session editor contain the complete title/time/type/subject; feedback, active, missed and locked states have textual or icon support. Mobile uses the existing daily agenda pattern instead of shrinking seven columns.

Click a free focus time or a date's plus to add a session. The compact editor accepts a new task or an unfinished existing task, date, start and minutes. A new task's estimate initially equals that arranged duration; remaining work can later be edited separately. Existing-task choices exclude fully arranged tasks and disable tasks needing an estimate. Clicking a planned appointment directly exposes editable title, subject and time. Save changes and Start learning are explicit actions. Lock/skip and remaining-work details remain secondary. Completed or awaiting-feedback states retain their existing separate controls.

The general task editor now exposes only name, subject and remaining work first; plan/date/prerequisite and source-link options are secondary. Date exceptions moved into Available time.

## Model and guards

A new local planning-session command creates/links a task and dated appointment in one normal repository transaction, or edits the original task/appointment identities atomically. Failed overlap, scope, stale-revision or availability checks leave no half-created task or metadata edits. Manually arranged or moved appointments are locked against automatic generation. This operation creates no actual learning, timer or leaderboard credit.

Shared manual validation covers commitments/rest days/buffer, deadlines, daily cap, task unarranged amount, prerequisites, review gaps, uninterrupted papers, and active/pending-feedback protection. Normal manual sessions can use a continuous free window up to the preferred focus length, retaining configured breaks when adjoining other focus work. They need not align with the arbitrary start of an auto-generated preferred slot. Moving a prerequisite cannot invalidate already arranged dependent work. Example commands remain memory-only and do not alter the real workspace; unfinished simulations block schedule changes.

No new stored field, migration, dependency, binding, backend endpoint, billing or AI service was introduced by this calendar pass. The preceding preparation version-2 schema and matched Worker/frontend publication requirements still apply. No protected Sites adapters were edited.

## Verification

- Final local build: 56 routes plus 404; noindex; PWA a9c42a4d3522ae43 / 62 resources.
- Full npm test: 516 passed, 0 failed.
- Fresh built preview HTTP verification: 62 passed, including robots, sitemap and notices.
- New model/UI coverage: atomic create/edit failure, identity retention and backups, reservations, inactive/feedback protections, commitments/deadlines/rest, daily cap/breaks/dependents, midnight/DST and pointer drafts, isolated example, rendered labelled compact activities and editors.
- CSS colour calculation for six palette entries: white-on-dark task fills approximately 5.93–7.16:1; dark-on-light fills approximately 12.38–13.36:1. This is a colour calculation, not full browser or accessibility certification.
- git diff --check passed. Existing build storage chunk advisory remains; no new build error.

Evidence logs (ignored): docs/development/evidence/planning-calendar-2026-11-18/{build.log,tests.log,http.log}.

Matching built preview: http://127.0.0.1:4334/study-planner?example=prep&view=week . Preview process session 12080. The example permits safe edits and simulations. Production unchanged. Codex opening is requested separately; queued status does not prove a tab was rendered or inspected.

No in-app browser-control interface is available this turn. Actual visual, keyboard/focus, phone viewport, click-through and authenticated synchronization acceptance remain unverified; no native/Chrome substitute was used. Drag-and-drop is deliberately deferred; direct click/edit is implemented. Existing independent production-community/moderation and main-promotion gates remain.

Future publication must rebuild release mode and validate the entire dirty exam-preparation/calendar tree together. Preserve version-2 anti-stripping and local companion guards, actual study records and current D1 schema; prefer a forward fix over an incompatible older-runtime rollback.
