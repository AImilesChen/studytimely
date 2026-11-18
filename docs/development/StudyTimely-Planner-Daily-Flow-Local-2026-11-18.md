# Planner daily workflow and page reminders

Implemented locally on 18 November 2026 following approval of the six-part usability plan. No commit, push or deployment. Package and production remain V2.32.0. All earlier unpublished exam-preparation, calendar and Plans work is retained.

## User behaviour

- The next-session card is more compact; ordinary filters use neutral surfaces and coloured icons, with filled colour reserved for selection. Topic rows are approximately 88px before content wrapping. Repeated type-chip icons were removed. Existing study/review/mock/correction colours and light/dark preference remain.
- Today and Plans share a next-action model: continue an active session, save pending feedback, start current work, preview new times for missed work, view a future arrangement, arrange remaining work, or view completed learning records. Future session details explicitly offer Start early. A missed session no longer offers a misleading direct start. Relative Today/Tomorrow uses the planning time zone.
- A missed occurrence stops requesting another replan when its remaining work is fully arranged in future sessions. Current timers and feedback take precedence over paused preparation. Optional/excluded and completed work are not treated as new learning.
- Completed tasks offer Reopen task. The task editor requires explicit reopening with positive remaining work. It reuses the same task/rule identity and retains reviewed arrangements and saved study intervals; no historical credit or duplicate task is created.
- Setup guides goal/task creation, availability and schedule preview. Existing completed setup disappears. Real saves display loading/saved/temporary/failure state. Pending storage writes can be retried with the original intent; form inputs freeze while the pending write is unresolved so newer edits are not silently discarded. Validation failures retain the open draft. The calendar editor associates its date/time issue with the field group.
- Plan options contains reminder preferences and links to availability and manual sync. A successful explicit Account sync records a device-local completion timestamp, displayed as Last manual sync; it is not a claim that subsequent changes were uploaded. The timestamp is written only after both local merge and cloud PUT succeed.

## Reminder contract

Reminders default off. The user chooses either five minutes before or at the start, then saves. This is one quiet in-page notice, not operating-system notification, background push, sound or automatic timer start. Checks run every 15 seconds while this planner is open and visible. They defer during dialogs/previews, temporary/pending storage mode and active/paused/review timers. Example mode never sends real reminders or edits real reminder preferences.

The service reads the latest repository snapshot before a claim and coordinates the preference/claim write through Web Locks. An occurrence key includes workspace epoch, block identity, start and end; one occurrence is shown once even across tabs/reload or timing-option changes. Missing storage/lock capability disables this reminder feature without blocking plans. A failed write produces no alert. Late wake-ups outside a two-minute window are discarded. Replanning/deletion/completion/optional exclusion/paused preparation and workspace reset invalidate stale notices; opening a reminder checks current data again. The repeat ledger is bounded to 500 entries and prunes entries older than 21 days during successful checks.

Two device-only local-storage records hold reminder settings/deduplication metadata and the successful manual-sync timestamp. They are excluded from workspace backups and cloud snapshots. Clear local study data attempts to remove these two keys; epoch checks prevent older metadata from reviving. No task names, account identities or credentials are stored in these records. Public guide, privacy and local-storage descriptions match this scope.

Implementation references: [MDN Web Locks](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API), [MDN visibility changes](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event). These describe browser APIs, not proof of application acceptance.

## Verification and preview

- Final preview build: 56 pages plus 404, noindex; PWA `4fb79fbd3e8ca9a0`, 62 resources. Existing storage-chunk advisory remains non-fatal.
- Full `npm test`: **545 passed, zero failed/skipped**.
- Fresh matching HTTP verification: **62 route/asset checks**, robots, Sitemap and licenses passed.
- Anonymous local `/api/learning/features` readback permits planning and analytics through their existing free preview flags. No entitlement, subscription or billing was enabled.
- `git diff --check` passed.

Tests include state ordering, time-zone boundaries, canonical primary-action targets, future/early/missed actions, optional/paused/completed cases, reminder deduplication across competing service instances, storage/lock failure, changed occurrences, stale wake-ups, reset cleanup, reminder settings/example scope and save-status markup. An isolated fake-IndexedDB repository test runs own-workspace creation, scheduling, reload, real model timer start/finish, explicit feedback, reopening and rest-day apply/undo, checking exactly one saved minute and preserved identities. This is a storage/model integration test, not a browser-user acceptance claim.

Preview: http://127.0.0.1:4348/study-planner?example=prep&view=plans ; process session 29175. Use my own plans switches to this origin's actual local workspace; reminder settings are disabled in the example. Codex open returned queued, not proof of rendering. Other preview origins and their local data were not cleared or transferred.

Ignored evidence: `docs/development/evidence/planner-daily-flow-2026-11-18/{build.log,tests.log,http.log}`.

## Limits and future release

No usable in-app browser-control/capture interface is available; the prior browser runtime attempt exposed no `agent`. No Chrome, standalone Playwright or OS-capture substitute was used. Desktop/mobile visual comparison, focus return, actual browser storage retry, Web Locks delivery and timer click-through remain unverified. Root `design-qa.md` remains blocked. No complete UI acceptance is claimed.

No dependency, persisted workspace-schema version, D1 migration, binding, paid service, AI call, external-calendar integration, automatic cloud sync or recurring-task engine is added in this pass. The new command option reopens an existing task without changing the stored schema. The shared store change only removes these optional device records after a successful wipe. Future release must include the complete matched frontend/Worker tree and retain prior preparation version-2/older-client protections. Existing production community/moderation/main-promotion gates remain independent and pending.
