# StudyTimely V2.38.0 — 20 November 2026

Published at https://studytimely.com/study-groups from `v2-google-community`, superseding local activity-clock and result-entry status.

- Runtime source: `c9cc550209fbaf08fa9c4e4c48a0decf9c6d0942`.
- Exact source tree: `cd3eed25ba5c4b6835d29d088ad2c15552c78992`.
- Worker version: `8e330f94-68de-4170-a0a5-2b1519cc261d`.
- Deployment: `e7237d64-52fe-40c2-a86e-3ba51b1f3c4a`, `2026-11-20T02:05:34.648328Z`, 100% traffic.
- PWA: `215d7e645c590af3`, 76 resources; 56 pages plus 404.
- Source inventory: 416 files, SHA-256 `d2a2ebcbbd5790cd66d3a82cc02b4de987d2d82eb68a39de5e5140ab59d62ac7`.
- Artifact inventory: 195 files, SHA-256 `e48064f2e06ca98a9af0ab42bcb44f4a0b512ee592742103a794613360d7cf03`.

## Delivered

Activity timing appears above task editing: shared focus/break countdown, personal current-interval clock and existing start/pause controls. The current interval uses matching room/activity timer data and the existing server-adjusted per-second clock; verified activity totals remain separately labelled. Pauses, new intervals on resume, stale heartbeats, check-in and other-tab/device states respect original server rules. Both seat and activity views display existing timer data; no second timer engine or credit stream was introduced.

The ambiguous Finish & check out strip is replaced by a separate result card and real Finish & add result button. It explicitly distinguishes member-visible result and private optional reflection, and explains that saving ends participation and prevents restart of this activity timer. Forms open on break/ended transitions, remain mounted when hidden, and preserve drafts on Cancel/Hide. Saved cards show result/edit action. Pending disables fields and buttons; failed saving retains the form and displays the error locally. Only explicit save calls the original versioned checkout endpoint; opening/cancelling never submits. Participant summary gains a View details/Hide details action cue; guide/privacy stays neutral.

Original four seats, independent personal timers, activity registration, private task/result fields and safety/entitlement rules are preserved. No backend/API/schema/DB migration, dependency, credential/scope, review-provider, timer credit/lease/persistence, tracking, DNS, legal or protected adapter changes. Existing review remains disabled. Unrelated FocusGuide.jsx status/content retained.

## Verification

- 668 release-mode tests, release build and Wrangler dry-run passed.
- Six compiled-Worker/local-D1 activity scenario groups passed: private invitation/notice, registration isolation and owner start, independent exclusive real timer leases and checkout/end settlement without duplicate credit, private account export, free-text grant/review gates and Durable Object updates. Synthetic localhost only, no external reviewer.
- 62 candidate and 62 production HTTP/SEO/resource checks passed.
- All 153 deployed non-audio/video assets match exact release artifact hashes. Unchanged audio/video was not re-downloaded for full hashes. Production JavaScript includes both new live-clock labels and explicit result/reflection actions.
- Production public guide, canonical/index metadata, private room/invite/activity query noindex/no-store, fixture exclusion, anonymous private-API rejection and Google-provider availability passed.
- All twelve binding definitions, script handler definitions and runtime settings match V2.37.0 apart from script etag. New version carries 100% traffic.
- Source pushed to the authorised public repository release branch; no main merge or new authorisation. Existing credentials and system proxy were reused.
- No production timers, task/result/messages, preview grants, subscriptions, roles, preferences or user records were changed for acceptance. No audio played or forced PWA update.
- Fresh authenticated production UI/mobile/dialog/focus/console/screenshot acceptance is not claimed: in-app browser automation is unavailable. SSR/model/API checks do not replace browser visual evidence. User screenshots and earlier unrelated local browser evidence remain scoped to their documented versions. Existing independent authenticated community/moderation and main-promotion gates remain pending.

## Recovery and evidence

Rollback reference: `7333f9ac-276d-4d32-8a4b-e660ab3c7178` (V2.37.0). No database restore is needed; preserve current records and schema. Never deploy fixtures.

Ignored evidence: `docs/development/evidence/activity-release-2026-11-20/` contains build/tests/API/dry-run/deploy/manifest, candidate/production HTTP, production hash/private-route checks, deployment/version snapshots and push logs. Later documentation-only commits do not change the deployed runtime.
