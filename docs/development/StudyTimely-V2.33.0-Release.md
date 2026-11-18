# V2.33.0 — Exam preparation and the daily planning workflow

Published at https://studytimely.com/study-planner on 18 November 2026. This supersedes the local-only deployment status in the preceding preparation, calendar, Plans and daily-flow handoffs.

- Runtime source: `3d2eb6a502d220f5de8e0c998a4bd754cf684a96`, branch `v2-google-community`.
- Worker: `3beefb17-27a7-4448-bd30-b30428e84fe3`.
- Deployment: `538eb39a-9184-44dd-a19a-2e8c3d27f1c5`, `2026-11-18T13:33:53.777699Z`, 100% traffic.
- PWA: `ed709d91beab98cd`, 62 resources.
- Source inventory: 368 files, SHA-256 `e3d53a9564d80131578abf2d18145188de8714728c8b07b49229eec8500cd11b`.
- Artifact inventory: 142 files, SHA-256 `e7c7da9de339eae7fc655303e65c0b12d1c53ad9a987b35d646908f13509702c`.

## Published behaviour

Exam preparation links an exam and syllabus/custom topics through a four-step preview/save flow. Study, spaced reviews, optional continuous mock papers and corrections share availability with other plans. Rest days, changed estimates/deadlines, optional scope and future unlocked arrangements use explicit preview/apply/undo. Actual learning, planned minutes, completion and self-assessed familiarity remain separate.

The Week workspace has bounded pending tasks, subject-coloured calendar arrangements and direct task/date/time editing with atomic validation. Plans uses compact topic rows, five-topic pagination/search and separate content-height task details. Stable blue/purple/orange/rose type colours, text labels and library icons distinguish study/review/mock/corrections. Selection and completion retain independent markers. Short details put actions near their content; long details retain one scrollable middle.

Today and Plans share current/active/feedback/future/missed/unarranged/completed next actions. Future arrangements open details and explicitly offer Start early; missed work offers a new schedule preview. Completed tasks can be reopened with positive remaining work while preserving their identity and saved learning. Save status, pending-write retry, protected draft inputs and a successful manual-sync timestamp clarify persistence without promising automatic cloud sync.

Plan options now provides opt-in quiet page reminders, either five minutes before or at the start. Reminders default off, require the planner to remain open and visible, defer while editing or timing, and do not run in the example. Web Locks and a device-local occurrence ledger prevent repeats across tabs and reloads; changed/cancelled/completed/paused arrangements invalidate stale notices. No OS notification, background push, sound or automatic timer start is added. Device reminder metadata and the sync timestamp are excluded from study backups/cloud snapshots and reset with their workspace association.

Advanced planning remains the existing anonymous free preview. No billing, subscription grant, recurring-task engine, external calendar, automatic cloud sync or AI service was activated. Editable examples remain isolated in memory.

## Verification

- Final release build: 56 pages plus 404; **545 release-mode tests passed**, zero failed/skipped.
- Deployment dry-run, **62 candidate HTTP checks** and **56-page navigation** passed.
- Predeploy verification matched all 368 source files and 142 artifacts to the manifest and exact runtime commit. One extra trailing CSS blank line was removed before commit; this did not change the minified artifact.
- After deployment, **62 public HTTP checks passed** and **136 non-MP3 public files matched exact hashes**. All56 public navigation pages, PWA version/cache list, planner guide, new controls/styles, anonymous preview flags, no-store/noindex API headers, private planner variants (including preparation examples), fixture404s, Google-provider metadata and existing community read guards passed. No production account, timer, plan, reminder, cloud, room or message was created for acceptance.
- Cloudflare readback confirms 100% traffic on the new Worker, all12 existing binding definitions and script runtime settings unchanged. Review remains disabled/providerCloudflare/day5000, without an AI binding. No D1 migration, restore, new resource, permission expansion or secret rotation was performed.
- Native Git pushed the exact runtime commit to the previously authorised public repository; an independent GitHub connector read confirms package2.33.0, and native remote-ref readback confirms the exact commit.

The first restricted credential read was unavailable; the existing official Wrangler credentials worked under the authorised execution context. No device-login flow or new grant was requested. Existing non-fatal build advisory remains.

## Acceptance limits

No usable in-app browser-control/capture interface is exposed. Opening the production URL in Codex returned queued; no screenshot, actual browser click/focus/scroll, mobile geometry, real reminder delivery, download or authenticated manual-sync acceptance is claimed. Model/repository/component/HTTP tests do not replace browser acceptance. Root `design-qa.md` remains blocked. No alternate browser or OS capture was used. Independent two-person production community/moderation acceptance and main promotion remain pending.

## Recovery and evidence

Prefer a forward fix or a matched build retaining preparation version2, local companion protection and cloud downgrade rejection. Previous Worker `45aad34d-1767-4ff1-b253-9dc3160c8691` is the V2.32.0 baseline and predates preparation version2: do not automatically downgrade the UI/API and resume old-client writes after new preparation data exists. Preserve full backups, recorded learning and all current D1 data and room gates. No database restore is part of a normal UI rollback.

Ignored evidence: `docs/development/evidence/exam-preparation-release-2026-11-18/` contains build/tests, candidate/public checks, exact file hashes, reviewed source paths, manifest, dry-run/deploy logs and runtime before/after. Later documentation commits do not represent another runtime deployment.
