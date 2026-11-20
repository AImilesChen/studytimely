# StudyTimely V2.39.0 — 20 November 2026

Published at https://studytimely.com/study-groups from the authorised `v2-google-community` release branch. This supersedes the unpublished status in the two room-workspace local handoffs.

- Runtime commit: `71f672e2e72160449e8a27ceb4c1bcb492096600`.
- Exact Git tree: `1820a3d03610c0aebcac6579b9147730c32f9bdb`.
- Worker version: `3ebf33dc-54e4-4d29-a52b-a49e7f96656f`.
- Deployment: `7eac39b4-e0c0-4f3c-a6bc-d01bff2f84fc`, `2026-11-20T05:55:50.886437Z`, 100% traffic.
- PWA: `50d1fbd530a566de`, 76 precached resources; 56 pages plus 404.
- Source inventory: 427 files, SHA-256 `8b4663977a8a72ae0244345657fcb9ec1d9493e2c4c911bd53e335065f664241`.
- Artifact inventory: 195 files, SHA-256 `58d6167f3781cd1c5558e56a88d3700c66716a17dffcc93e27a169f37b6ade06`.

## Delivered

The room header is compact: name, privacy, theme and actual allowance sit beside the original permission-aware member/settings controls. Room navigation and the existing four seats appear earlier. The synthetic preview label is compact and remains excluded from production.

Study together retains the four-seat board, independent personal timers, invitations and quick interaction. It shows a compact activity shortcut. Full activity editing, the shared countdown and result workflow belong to Study activities; original progress belongs to Group progress. One mounted activities component and hidden subviews preserve drafts and timer state across navigation. There is one large shared countdown in the activity view, ordinary recorded-time text, explicit task editing and result actions, and a separate owner-only End activity for everyone action. No timer engine, server credit or lease rules changed.

The bottom Your next step section uses actual recorded time only when positive, links to progress and activity planning, and retains original invitation/timer/access shortcuts within seven answered help questions. The public guide adds immediate-versus-scheduled workflows, a clearly labelled revision example and two FAQs. Private rooms retain noindex/no-store; no private-room SEO essay was added.

Existing free and advanced entitlement policies, four seats, safety controls and backend behavior are preserved. No migration, dependency, credential, OAuth, DNS, review-provider, tracking, legal or protected adapter changes. Existing review remains disabled. The unrelated FocusGuide.jsx working-tree status was preserved and excluded from commits.

## Verification

- Release build, Wrangler deployment dry-run and 680 release-mode tests passed. The initial suite was accidentally run without STUDY_TEST_RELEASE against release HTML; it was rerun with the correct configuration, with all 680 passing and no code change to accommodate it.
- Six compiled local Worker/D1/Durable Object activity scenario groups passed, including private task isolation, independent leases, checkout/end settlement without duplicate credit, private exports, entitlement/review gates and WebSocket updates. Synthetic localhost only.
- 62 candidate and 62 production HTTP/SEO/resource checks passed.
- All 153 deployed non-audio/video files match release artifact hashes. Unchanged audio/video was not re-downloaded for full hashing; no audio played.
- Production bundle contains the new room header, activity shortcut, shared schedule, next-step and explicit result actions. The previous large personal-interval label is absent.
- Public guide, canonical/index metadata, private room/invite/activity query noindex/no-store, production fixture exclusion, anonymous private API rejection and Google-provider availability passed.
- All twelve production binding definitions, handlers and runtime settings match the pre-deployment version; new version receives 100% traffic. Existing variables were preserved with --keep-vars.
- Runtime source was pushed to the existing authorised public release branch. No main merge or production user-data mutation was performed.
- Fresh authenticated browser/mobile/layout/click/focus/console/screenshot acceptance remains unverified: in-app browser automation is unavailable. Opening the production browser panel returned queued, not evidence of a loaded page. SSR, HTTP and API evidence do not replace visual acceptance. Existing independent community/moderation and main-promotion gates remain pending.

## Recovery and evidence

Rollback reference: V2.38.0 Worker `8e330f94-68de-4170-a0a5-2b1519cc261d`. No database restore is required; preserve current user records. Never deploy fixture Workers.

Ignored evidence: `docs/development/evidence/room-workspace-release-2026-11-20/` contains build, tests, API scenarios, dry-run, source push, manifest, deployment/version snapshots, candidate/production HTTP, configuration equality and production hash results. Later documentation-only commits do not change the runtime version above.
