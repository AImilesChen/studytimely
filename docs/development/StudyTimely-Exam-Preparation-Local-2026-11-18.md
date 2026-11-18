# Exam preparation and coordinated scheduling — local handoff

Date: 2026-11-18. Status: implemented locally, not committed, pushed or deployed. Production and package remain V2.32.0.

## User workflow

Open Study Planner → Create plan → Exam preparation. The four-step wizard selects or creates an exam, selects syllabus topics or adds custom topics, reuses available study time, and previews the next 14 days before one atomic save. Optional settings (review rounds, spacing, exam importance and continuous mock-paper duration) stay secondary. Saved plans show the next learning action before the preparation outline. Today, Week and Plans retain their distinct roles.

Local built preview: http://127.0.0.1:4332/study-planner . Editable isolated example: http://127.0.0.1:4332/study-planner?example=prep&view=plans . Preview process session 62013. Opening this URL in Codex was queued; that is not browser visual or interaction acceptance.

Existing active exams and syllabus plans have preparation entry links. Internal navigation preserves only the supported planner context parameters. A preparation for an already-linked exam is selected instead of duplicated.

## Implemented behavior

- One topic can create an initial learning activity and zero to two purposeful review activities. New, weak and familiar are explicit user assessments, separate from activity completion and actual saved study time.
- Review prerequisites and calendar-day gaps are enforced. An optional mock paper requires one continuous window; correction work follows it. Calendar splitting does not copy tasks.
- All active exams share availability, fixed commitments, breaks, daily focus limits and existing arrangements. The scheduling heuristic considers deadlines, importance and weak topics. It does not promise a globally optimal schedule.
- Only the next 14 days are generated in the exam wizard. Existing general planner retains 7/14/30-day previews. The longer-term capacity estimate explains shortages and is not a guarantee of continuous mock-paper or spacing feasibility. Stage date ranges are labelled suggestions, not hard phase boundaries.
- Changed exam dates, remaining work, familiarity and availability prompt a new preview. There is no hidden/background rescheduling. Archived, taken or missing exams pause new preparation starts; past exams cannot start new preparation study.
- Cannot study today previews a day exception and coordinated schedule. Explicit apply and undo include the exception. Running timers and locked sessions are preserved.
- A finished actual session awaiting remaining-work feedback remains available and cannot be skipped, moved or replaced by replanning. Recorded learning never automatically proves task completion or mastery.
- Optional review/mock/correction activities can be excluded or restored without falsely completing tasks or deleting past learning. Dependent optional activities are handled together.
- The two-exam example allows planning edits and simulations only in memory. No real timer, repository record, cloud snapshot or ranking credit is written. Reset/exit discards the example.

## Data and publication implications

The ordinary planning workspace remains schema version 1. A workspace containing preparation uses version 2 and adds per-topic assessment/source links, preparation preferences and activity metadata. Existing version 1 workspaces remain accepted. Existing local epoch-bound companion storage, tombstones, transactional revision checks, JSON backup and manual cloud merge are retained. Version 2 merge preserves independent concurrent topic edits. Older-client strip attempts are rejected rather than silently dropping preparation data; a V2.32 client needs to refresh before editing a new preparation workspace.

Future publication must include matched frontend and Worker validation/noindex changes. No D1 migration, new binding, dependency, paid resource, AI request or billing integration is required. Keep existing advanced-planning free preview behavior. The privacy policy now discloses locally saved exam-preparation metadata. Existing authenticated community/moderation and main-promotion acceptance gates are unrelated and remain pending.

Prefer a forward fix or a matched rollback retaining planning version 2 validation. Do not overwrite new preparation data using an old client/runtime. Preserve backups and database records; a UI rollback is not authorization for a database restore.

## Verification

Final local build: 56 pages plus 404; preview noindex; PWA f6922b734ace69ea / 62 resources. Final full npm test: 505 passed, 0 failed. Fresh matching built preview HTTP checks: 62 passed, including robots, sitemap and license checks. Focused tests cover atomic/stale wizard saves, gaps, continuous papers, multiple-exam capacity, deadline edits, coverage versus confidence, rest-day apply/undo, optional exclusions, active timers and pending feedback, local companion/backup/cloud anti-stripping and isolated examples. React server markup and handler tests cover the wizard and plan views. Existing V2.32 validator was separately checked to reject version 2 instead of normalizing it away. Source diff whitespace checks passed.

Evidence logs (ignored): docs/development/evidence/exam-preparation-2026-11-18/{build.log,tests.log,http.log}.

There is no browser-control interface in this session. No actual browser click-through, phone viewport, keyboard/focus, visual theme, download or authenticated cross-device acceptance is claimed. No native browser substitute was used. The preview is provided for user review. No production user/account/timer/community state changed.

## Deliberate scope

No external calendar integration, recurring rules, closed-page scheduler, billing, payment gate or AI-generated timetable. The first delivery favors explicit input, understandable previews and existing real study actions.
