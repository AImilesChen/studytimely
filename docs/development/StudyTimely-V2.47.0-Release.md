# StudyTimely V2.47.0

Published 21 November 2026 at https://studytimely.com/account. This release supersedes the local Study Center redesign, direct-tool, illustrated-guide and duplicate-navigation follow-ups.

- Runtime commit: `952ff1ae4bd8240cc9fa3944f3e672920f8da6b2`, tree `8f1ee4eabb2ee58288a8d2e50820779151a3820c`, branch `v2-google-community`.
- Worker version: `f4a6d17c-aa7d-4d2f-8cb3-0a9ab1230748`.
- Deployment: `8880cb12-a253-4d59-9cc2-c8d7fda2ba15`, created `2026-11-21T12:35:25.09024Z`, 100% traffic.
- PWA cache: `6b04a11cfa2ee60a`, 76 precache resources.
- Rollback: V2.46.0 Worker `e808bc02-2099-48f8-8721-9fde8a30a25b`; no database restore required.

## Published behaviour

The center has four distinct sections: Today, Progress, My groups and Account & data. Today contains the actual task, daily-goal, exam-date, habit and course-topic controls. The duplicate Study plans tab/render branch is removed; old `view=learning` entries resolve to Today without losing other query parameters or hashes. Task lists and progress open within the center where appropriate.

Exam dates save directly and show local-calendar countdowns. Habits expose measurement, target and study-day settings, plus real progress and manual check-in/undo where applicable. Course creation and topic outlines save atomically; existing-course additions preserve metadata and check versions. Coverage checkboxes and guarded linked-study actions work in place. Plans, check-ins and coverage do not manufacture saved study minutes. Existing automatic sync, local storage and timer guards remain.

Personal nickname, ranking and hidden-member preferences are directly visible under Account & data. Room-management and group-directory shortcuts target them. The authenticated first-render crash is fixed using the actual `syncAccountId` contract and an explicit non-null, matching-response check. Local clock/date readiness is also checked before reports run. Empty, loading and populated reports are distinct; daily values are visible without disclosure.

Four read-only illustrated guide rows, one connected revision example and three expanded questions explain the tools and storage. The continuous reading layout uses alignment, typography and thin rules, with fewer nested card borders. Examples are labelled and never persisted. `/account` remains noindex; public tool metadata and protected Sites adapter files are unchanged.

## Verification

- Formal release build: 56 pages plus 404; Wrangler dry run passed.
- All **745 release-mode tests passed**, including real component handlers against the existing model, first authenticated rendering, direct forms, stale saves, duplicate submission guards, legacy entry mapping and single-instance tools.
- Candidate and production each passed **62 HTTP checks**. The existing six group-page privacy/content checks also passed against both URLs.
- All **175 public non-audio/video artifact hashes match** the release build. The served account page has exactly four center tabs, one copy of each plan form and four guide illustrations with no tutorial controls/disclosures.
- Private query robots/cache policies remain intact; protected APIs reject anonymous access and the existing Google provider is available. Synthetic fixtures and local diagnostic endpoints return 404 in production.
- Deployment metadata confirms 100% traffic on the new version. All **12 bindings**, handlers and runtime settings match the previous Worker. Keep-vars was used. No schema migration was run.
- Source inventory: 483 files, SHA256 `5901302baf01d8fb67edd4a660b7b6a69bc0e598d18a1551d76dec58d10dda2a`. Artifact inventory: 217 files, SHA256 `fac99bcf58fe44789da02d9e09f3fa38af44358a879612706972a9f907388078`.

Production browser opening was queued. Direct browser-control tools remain unavailable, so fresh production screenshots, authenticated click-through and phone visual acceptance are not claimed. The earlier local browser diagnostic confirmed the black-screen failure and repaired client rendering; that is separate from production acceptance. No authenticated production record, timer, profile, invitation, grant or room mutation was made for verification.

The first source push was rejected by automatic review because remote trust/authorisation was not established in that call. The existing explicit user authorisation for public `AImilesChen/studytimely` in AGENTS.md was verified; a fresh reviewed push was allowed. Direct network calls then stalled and were stopped; the existing system proxy completed the same branch push and read-only verification. Runtime source is now pushed to the existing release branch. No alternate write API was used to bypass review.

No dependency, credential, OAuth, DNS, paid resource, analytics configuration or production resource change was made. The local diagnostic helper was moved into ignored `app/.wrangler/` and was neither committed nor deployed. The pre-existing FocusGuide.jsx status remains excluded. Existing independent planner/community/moderation/main-promotion acceptance gates remain separate. Later documentation commits do not redeploy runtime.

Ignored evidence: `docs/development/evidence/study-center-release-2026-11-21/`.
