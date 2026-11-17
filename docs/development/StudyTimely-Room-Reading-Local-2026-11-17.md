# Room reading and activity layout — local, 17 November 2026

Implemented after the user's activity screenshot feedback. Local only: no commit, push, deployment, remote database change or external AI call. Preserves all preceding uncommitted review/cache work and the existing V2.26.0 production state.

## Changes

- A sole selected upcoming activity renders one full detail panel, without a duplicate large selector card. When several activities exist, compact title/date/status selectors remain available. History moves below the selected activity.
- Removed activity slogans, repeated join/checkout headings, duplicate local timestamps and repeated instructional paragraphs from the default view. The organiser's date/time zone and focus/break durations remain visible. Device-equivalent and actual start/end times are available in Activity guide & privacy.
- Task labels and inputs use 16px, necessary help uses 15px (overriding a later legacy 13px management rule), main detail titles use 24px desktop/20px phone. The Join activity action is primary. Owner edit/cancel actions sit under Manage with keyboard-operable disclosure; confirmation dialogs remain intact.
- Detailed timing/credit definitions, participant visibility, uploaded private task/note retention, timezone interpretation, manual invitations and absence of reminders remain available in an expandable guide. The short private-task/90-day notice stays beside the submission action; irreversible checkout information remains visible before saving. Existing below-fold public SEO guides and policy text are preserved.
- Personal task and saved checkout forms collapse after successful actions. Group progress stays collapsed until ended/cancelled; ended activity summaries expand. Added chevrons communicate disclosure state and respect reduced-motion preferences. No API, accounting, authorization, review, retention or storage behaviour changed.

## Verification

- Build passed: 56 routes + 404, local noindex; PWA `52c2fc4051b60791`, 62 resources.
- 22 existing activity/chat/cache regression tests passed. No new implementation-mirroring tests were introduced for this copy/style change. The preceding complete 351-test run belongs to the prior chat/cache handoff.
- 62 HTTP/asset/robots/sitemap/license checks and `git diff --check` passed (existing CRLF conversion warnings only).
- In-app browser tested sole and multiple activity selection, plan-dialog cancel, creation of a separate synthetic Maths activity, join, host start, personal timer start/pause, private checkout save, host end, collapsed saved result, expanded ended summary, return to the original scheduled activity, owner edit-dialog cancel and keyboard Manage disclosure. The synthetic test accumulated 18 actual connected seconds; it was ended with no QA timer left running. No real accounts or production data were used.
- Actual desktop/390px/320px checks: no horizontal overflow, 16px task labels and 15px help confirmed, compact mobile owner actions and primary Join button verified. Captured warnings/errors empty. Viewport reset; tab 21 marked deliverable.

Preview: http://127.0.0.1:4295/__test/group-preview (choose the synthetic owner or member entry). The direct private room needs its matching fixture session. Never deploy the fixture Worker.

Ignored evidence under `docs/development/evidence/cf-review-optimize-2026-11-17/`: `room-copy-build.log`, `room-copy-tests.log`, `room-copy-http.log`, `room-copy-desktop.jpg`, `room-copy-phone.jpg`, `room-copy-320.jpg`, `room-copy-ended.jpg`. Screenshots inspected. Publication remains a separate user instruction; previous pending migrations/binding and real production community acceptance gates still apply.
