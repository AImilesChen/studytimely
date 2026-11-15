# StudyTimely V2.14.0 production release

Published on 2026-11-15 at <https://studytimely.com/stopwatch>. This supersedes the preceding local-only Stopwatch status. Detailed interaction and accounting evidence remains in `StudyTimely-Stopwatch-Local-2026-11-15.md`.

## Published behavior

The original clean three-card stopwatch, colons, quick tools and mode dock remain. Lap is visible before starting and enabled only while running. View results opens a dedicated report with total elapsed, completed laps, fastest/slowest/average completed lap and a separate unfinished segment. Pauses and unfinished segments do not inflate completed-lap statistics. Optional page-local hundredths, newest/oldest sorting, 50-row paging, fresh paused-snapshot copy/selectable text and CSV export are available. Reset/New run ask before replacing progress.

Stopwatch interruption handling is separate from verified learning. Long callback gaps do not request a study declaration; detected clock discrepancies pause at checked time, and the measured run stops at exactly 24 hours. Running ownership transfer preserves elapsed timing; paused state and recorded laps remain intact. Legacy review recovery does not fabricate learning credit. Current runs remain local and excluded from JSON backups/account sync. The page creates no study or ranking records.

The full initial-HTML guide has 2,843 English words and twelve complete FAQs covering actual instructions, worked lap arithmetic, practical uses, exports, tool choice, recovery, precision limits and offline preparation. Metadata/WebApplication match actual capabilities, BreadcrumbList is included and the misleading generic learning-goal/workspace panels are removed.

## Exact source and runtime

- Repository/branch: <https://github.com/AImilesChen/studytimely/tree/v2-google-community>. No main promotion.
- Runtime source: `7f175f8541cdbddd8f8d9c111d2f16742bb42c49`.
- Git tree: `95543ef51ff020fc271ce400c66f4c50244b80ba`.
- Worker: `fe0fd7f4-8d2e-4544-b0ae-c250f26fc0cb`.
- Deployment: `e81749a7-878c-47be-acbb-9342dca9e9fe`, created `2026-11-15T14:25:20.130726Z`, read back serving 100%.
- PWA: `5457005a11e897ec`, 61 precache resources.
- Artifact inventory SHA-256: `9ab4d765b01366662a98ffe2bdd363dd7288ccda24b99066f7e4dd3190d2c03e`.

The native Git push failed with a connection reset. The existing in-memory credential helper and official GitHub Git-data API then synchronized the exact commit/tree, checked the remote parent twice and read back the updated branch without force. No credential values were printed or stored. Existing Cloudflare authentication deployed with `--keep-vars`; all nine binding names/types match the preceding runtime. No dependencies, schema migration, backend API, OAuth, secrets, resource configuration, analytics/legal text or protected deployment adapter changes were made. Later documentation-only commits do not represent another runtime deployment.

## Verification

- Release build passed: 55 pages plus 404. All 220 tests passed with `STUDY_TEST_RELEASE=1`; Wrangler preflight passed. Existing large-chunk advisory remains nonblocking.
- 61 release-candidate and 61 public HTTP checks passed, covering indexing/canonical, robots, sitemap, routes, assets and licenses.
- 124 public non-MP3 artifacts exactly match the local SHA-256 inventory. Five unchanged licensed MP3s passed existing local build/license checks and were not downloaded again.
- Public initial HTML contains the full guide, twelve FAQs, expected section IDs, WebApplication/BreadcrumbList and real controls. Generic study-workspace panels and invented result rows are absent. PWA version and Stopwatch precache membership match the release.
- Actual production in-app browser showed the new Ready/00:00:00 face, disabled-before-start Lap, View results, optional hundredths, results onboarding and detailed guide. View results navigated to and focused the report; Back to stopwatch restored the hero.
- Actual production desktop width 1280 and phone width 390 had no horizontal overflow. Phone report/guide left edges both measured 18.75px. `production-desktop.jpg` and `production-phone.jpg` were saved and inspected; they show actual production, distinct from local synthetic lap screenshots.
- Final captured warning/error logs were empty. Viewport override was reset, timer stayed at zero and the production tab was marked deliverable. Only the in-app browser was controlled.
- No production timer was started/reset, no preferences or study history changed and no cloud/community/profile/ranking action was taken. Start/lap/statistics/pause/CSV/copy summary/ownership/legacy recovery/24-hour behavior have local/model evidence and were not repeated against production personal state. Actual external clipboard paste, device sleep, OS clock manipulation, forced failures and native fullscreen remain outside production acceptance.

Ignored evidence: `docs/development/evidence/stopwatch-release-2026-11-15/` contains build/tests/preflight/deploy logs, exact GitHub synchronization, before/after versions, runtime readback, source/artifact inventory, public HTTP/artifact checks and production screenshots. Search/analytics backend events and authenticated account synchronization were not reverified.

## Recovery

Rollback Worker: `4126259a-9c90-4c76-8bd3-fc3d654561cf` (V2.13.0). No database restoration is needed. Active timer format remains compatible; rollback removes the dedicated stopwatch report/interface and revised interruption handling. Finish active work before accepting a PWA update; existing update guards remain in place. Independent authenticated community acceptance and main-promotion gates remain unchanged.
