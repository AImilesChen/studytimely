# StudyTimely V2.48.0

Published 21 November 2026 at https://studytimely.com/account?view=progress. This release supersedes the local Progress workspace, illustrated colour correction and compact-header follow-ups.

- Runtime commit: `ed8a3f96f710210d1f8707ea3787ecbc62297299`, tree `db9cd91ca1cc0900a5d8398cf52e632ad4335d13`, branch `v2-google-community`.
- Worker version: `0b130235-184e-4fa7-89d8-1563f8f243c1`.
- Deployment: `27207a09-65bc-45f8-be03-9a0408f65b52`, created `2026-11-21T13:33:11.213326Z`, 100% traffic.
- PWA cache: `7309234ab83fce92`, 76 precache resources.
- Rollback: V2.47.0 Worker `f4a6d17c-aa7d-4d2f-8cb3-0a9ab1230748`; no database restore required.

## Published behaviour

Progress is an on-page study review workspace. Date, subject and timer filters control the saved-time summary, trend, subject allocation and record list. Selecting a date drills into its records; record details expand in place. All saved records reaches older years without extending the chart range. CSV uses the actual applied list filters and counted intervals, excludes private reflections and retains the existing formula-safe export handling.

The page separates dated task completion evidence, historical daily goals, device-calendar habit progress and current self-marked course coverage. Unknown completion dates remain unknown, rest days are excluded, partial weekly windows are labelled and coverage does not imply mastery. None of these planning/completion measures creates study minutes.

Private weekly/monthly review notes save atomically with their displayed snapshots through existing commands. Changed filters do not replace a dirty snapshot; stale versions and failed saves retain the draft. Snapshot updates are explicit. A separate next-step form creates a task without starting a timer or adding minutes. Existing advanced-analytics availability applies to comparison/review editing; basic filters, statistics and record export remain available. Labelled examples are read-only and cannot save reviews or next tasks.

Warm apricot, honey and rose surfaces distinguish data, habits and reflection. Existing local cat stickers and a few unboxed emoji restore personality without an icon-card grid. Four account tabs have small emoji and clear text labels. The header now holds only a compact title and local-data/date information; the timer entry is in Today's task workspace, while normal sync state and controls belong to Account & data. Real sync warnings remain visible. Legacy section/sync entries, keyboard navigation, active-timer safeguards and review departure confirmation remain.

The account route remains non-indexable. Today retains its actual planning tools and illustrated guide. No new public SEO page, dependencies, migrations, backend routes, sync contracts, community accounting rules, OAuth, credentials, DNS, paid resources, tracking settings or protected Sites adapters changed. Test fixtures and the ignored diagnostic helper were not deployed.

## Verification

- Formal release build: 56 prerendered pages plus 404; Wrangler dry run passed.
- **760 release-mode regression tests passed**, zero failed. These include real component/model handlers, filtered and overnight intervals, tombstones/deduplication, long history, habit rest/partial-week evidence, honest empty/access states, versioned snapshots, save failures, duplicate submissions, separate next tasks and compact account navigation.
- Candidate and production each passed **62 HTTP route/resource checks** and the existing six group-page checks. Robots, Sitemap and licence checks passed.
- All **175 public non-audio/video files match** the exact release artifacts. The production account has four illustrated tabs, no permanent header action links/buttons and no sync-status shortcut. The shipped bundle/styles include the direct Progress controls and final illustrated palette.
- Private account and group-query indexing policies remain intact. Synthetic fixture/diagnostic endpoints return 404; protected APIs reject anonymous access; the existing Google provider and analytics feature endpoint are available.
- Deployment metadata confirms 100% traffic. All **12 bindings**, handlers and runtime settings match V2.47.0; keep-vars was used. No migration was run.
- Source inventory: 492 files, SHA256 `51270468a6f65fd4d9f9a35ed696224afa60f11f15f18258756dbaface4d2d5e`.
- Artifact inventory: 217 files, SHA256 `590bbf55084f960965d5082d5c9408f2ef70734d54e6687abc3ab535d9232b50`.
- The runtime commit was pushed to the existing authorised public release branch and independently read back with `ls-remote`. Existing proxy transport was used; no remote history rewrite or new permissions were needed.

Production browser opening was queued in Codex. Direct browser-control tools remain unavailable, so fresh production screenshots, authenticated click-through and phone visual acceptance are not claimed. Earlier local diagnostic callbacks confirmed rendered illustrations, different section backgrounds and no page-wide overflow at the observed 619-pixel viewport; those are distinct from production visual acceptance. No scripted authenticated production mutations were performed.

The pre-existing FocusGuide.jsx working-copy status remains excluded. Existing independent planner/community/moderation/main-promotion acceptance gates remain separate. Later documentation commits do not imply another runtime deployment.

Ignored evidence: `docs/development/evidence/center-progress-release-2026-11-21/`.
