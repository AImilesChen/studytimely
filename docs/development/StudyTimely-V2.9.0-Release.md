# StudyTimely V2.9.0 production release

Published on 2026-11-15 at https://studytimely.com/study-time-calculator. This supersedes the candidate publication status and the preceding local-only calculator entries. Local functional and responsive acceptance is documented in `StudyTimely-Calculator-Local-2026-11-15.md`.

## Published behavior

The calculator supports focused or elapsed daily budgets and remaining workload before an exclusive deadline. It counts selected calendar days, separates breaks, checks optional daily capacity and explains shortfalls. Results can be copied, reviewed as one editable first-day Planner draft, or used to prepare an idle Focus Timer after confirmation. Neither an estimate nor a draft creates recorded study time. Existing unfinished-timer protection remains in force.

The accepted layout has equal desktop columns with matching card boundaries, a large daily result and four secondary figures, shared task/focus/copy actions below both columns, and collapsed calculation details. Phones stack the panels and actions. The 1,390-word guide and eight complete FAQ answers are in initial HTML; canonical, metadata and WebApplication/BreadcrumbList describe the actual calculator. The privacy policy explains in-memory estimates and explicit task/preference saves.

## Exact source and runtime

- Public repository/branch: https://github.com/AImilesChen/studytimely/tree/v2-google-community . No main promotion.
- Runtime commit: `73ee56d6c9a5c0d66b14587139a113c83eaaf900`.
- Git tree: `17ff932375de6699d739f376988eb4fcf9ca99d9`.
- Worker version: `d0940339-0bf0-495c-a1e0-c0440b151345`.
- Deployment: `27f8b393-fe46-4c74-a92c-357895dc4ffe`, created `2026-11-15T06:19:53.571955Z`, read back serving 100%.
- PWA: `989471e0d9fdfec6`, 61 precache resources, including the calculator.
- Artifact inventory SHA-256: `23867780feed70f55eb792cbbeb047d4ea7d1adb26010633d677f75cc57cbd21`.

The runtime commit was pushed through Git using existing credentials. A GitHub connector branch read independently confirmed its exact commit and tree after publication; a later direct Git read encountered a connection reset. Existing Cloudflare credentials were reused without new permission grants. All nine binding names/types were compared before/after and match; `--keep-vars` retained existing variables. No database migration, production data mutation, new resource, dependency, OAuth, analytics configuration or protected Sites-adapter change was made. Later documentation-only commits do not imply another deployment.

## Verification

- Production-mode build prepared 55 pages plus 404. All **163 tests** passed with `STUDY_TEST_RELEASE=1`; Wrangler deployment preflight passed.
- **61 release-candidate and 61 public HTTP checks** passed, covering routes, metadata, canonical, redirects, robots, Sitemap, assets and licenses. Sitemap eligibility remains 49 routes; no route was added.
- **124 public non-MP3 files** match exact local artifact hashes. The production calculator contains 1,390 guide words, eight FAQ answers, expected section IDs and both schema blocks. The privacy clarification and PWA version were verified. Five unchanged licensed MP3s passed the existing local build/license checks and were not redownloaded.
- The real in-app browser opened the production calculator and observed the redesigned inputs, empty result, guide, then the actual default result: 1h focused per study day, 1h10 occupied, 20h total focused and 23h20 total elapsed. The shared task/focus/copy controls were present. No task or timer was created.
- A production DOM measurement at 1440 × 900 showed both cards at **643.5px wide × 625.28px high**, with identical top/bottom coordinates and document client/scroll widths both 1425px. The browser read `index,follow`, the correct canonical, eight guide FAQ elements and deployed script `/assets/index-qFTnxy3r.js`.
- Subsequent browser input/screenshot calls repeatedly timed out and reset the browser automation session. No production JPEG was obtained. Production phone, deadline interaction, copied result, task/focus handoff, console-log and viewport-restoration checks were not completed; do not claim them. Those functional/responsive paths have the separately recorded local browser evidence and final release-suite coverage. The last successful browser override was 1440 × 900; restore it when the browser connection becomes available. The production calculator tab was ID 13 and was not successfully marked to persist.

Evidence is ignored under `docs/development/evidence/calculator-release-2026-11-15/`: build/tests/preflight/deploy logs, source/artifact inventory, before/after runtime metadata, exact public artifact report, public HTTP report and `production-desktop-geometry.json`. A failed or timed-out screenshot attempt is not production visual evidence. All UI interaction used the in-app browser; no desktop/local application input, forced PWA update, real alarm, saved study session, profile, room, message or ranking mutation was performed.

## Recovery and limits

Rollback Worker: `be846bab-8ffd-405c-86e7-2e614a92d23c` (V2.8.0). A code rollback needs no database restoration; it removes the new calculator UI and planning handoffs. In-memory estimates are ephemeral. Preserve stored work and all bindings/variables; do not force an app update during unfinished work. Existing tabs may need to apply an offered app update after finishing or resetting their timer.

GSC/Bing indexing/submission status and GA4/Ahrefs backend receipt were not reverified. External community review remains unconfigured and the prior free-text sending restriction remains. Independent authenticated production-community acceptance and main-promotion gates are unchanged.
