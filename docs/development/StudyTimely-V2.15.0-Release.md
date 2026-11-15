# StudyTimely V2.15.0 production release

Published on 2026-11-15 at <https://studytimely.com/pomodoro-timer>. This supersedes the preceding local-only Pomodoro handoff, including its compact hero and phase-icon refinements. Detailed functional and responsive evidence remains in StudyTimely-Pomodoro-Local-2026-11-15.md.

## Published behavior

The clean three-card face, colons, title/subtitle, quick tools and dock remain. Study/Short break/Long break have decorative BookOpen/Coffee/Armchair icons and full text/selected/disabled semantics. A passive outlined Round pill replaces the old multi-line hero explanation. Current/next phase detail stays in the lower plan; View routine is removed from the hero. Ordinary settings success is screen-reader status.

Session settings and the header gear open a draft-only desktop window/phone sheet: presets/custom lengths, subject, finite-or-continuous full-round target, independent study/break auto-start, alert toggle/volume/test and atomic Apply. Cancel/X/Escape/outside discard drafts. Timing/target/subject changes are locked during an existing routine. End study early saves actual learning without advancing full rounds; Skip break adds no learning; Reset current period and Restart routine preserve existing history as described by their confirmation. Finite targets stop after their final study without a trailing break. Ownership/stale-operation/deadline/recovery protection and task links remain. Interrupted breaks do not request learning declarations; actual study interruption still requires review.

The plan distinguishes 100 study minutes, 115 minutes through the last study and 130 minutes including the following long break in the default continuous four-round block. The report separates full rounds, precise actual saved time and early-ended periods. Plans/breaks/pauses do not become learning. Active routine storage/backup/account-sync formats are unchanged.

Initial HTML includes 3,307 normalized English guide words and twelve full FAQs, actual instructions, worked examples, interval choices, interruption/record/recovery/storage/audio/offline explanations and related tools. Metadata/WebApplication/BreadcrumbList match the actual page.

## Exact source and deployment

- Repository: <https://github.com/AImilesChen/studytimely/tree/v2-google-community>. No main promotion.
- Runtime commit: `ebe22b2c2b0933fd99e464e162a30bf1b192beca`.
- Git tree: `35ab954d6f05b9af79cefbb8dbfbe52d8ad4a8e8`.
- Worker version: `76f4e379-d3ea-4de0-b1e8-baba42c3b50c`.
- Deployment: `26b8b770-e2b8-4963-8f9c-c43fd33e32aa`, created `2026-11-15T16:12:55.011244Z`, read back serving 100%.
- PWA: `002d4d80388b7627`, 61 precache resources.
- Artifact inventory SHA-256: `64212b8eb6fd8cddd4a631c19dc890831b4fd40b704ec75ea20956f6f55e901d`.

Native Git push returned a connection reset. The existing in-memory credential helper and official GitHub Git-data API then synchronized the identical commit/tree, checked the remote parent twice and read back the branch without force. No credentials were printed or stored. Cloudflare deploy used existing authentication and --keep-vars; all nine binding names/types match the preceding runtime. No database migration, dependency/backend API/auth/OAuth/secret/resource/tracking/legal or protected-adapter changes were made. Later documentation commits do not imply a new runtime deployment.

## Verification and limits

- Release build (55 pages plus 404), all 237 tests with STUDY_TEST_RELEASE=1, Wrangler dry-run and 61 release-candidate HTTP checks passed. Existing large-chunk advisory remains nonblocking.
- All 61 public route/asset/robots/Sitemap/canonical/license checks passed. All 124 public non-MP3 files exactly match the candidate SHA-256 inventory. The five unchanged licensed MP3s have existing local build/license checks and were not downloaded again.
- Public initial HTML contains the full guide/twelve FAQs, correct section IDs and schema, Session settings and Round 1/4; obsolete generic workspace/hero progress text is absent. Public PWA identity and Pomodoro precache membership match.
- Actual production in-app DOM confirmed ready 00:25:00, three named phase buttons, Round 1/4, clean controls, default plan and zero routine progress. Saved and inspected production-final.jpg confirms the three icons, pill, cards/colons/header/tools/dock. production-desktop.jpg is an earlier guide capture, not hero proof.
- Browser operations repeatedly timed out and reset. Returning to the timer anchor and the final screenshot succeeded. Opening/cancelling settings, phone geometry/visuals, final console logs and tab deliverable marking were not verified in production. No viewport override was set during this production run. Do not claim local mobile screenshots or geometry as production proof.
- No production timer was started/reset or learning/settings/cloud/community data changed. Detailed timing/settings/phase/ownership/finite-target/early-end/restart and responsive acceptance remains local/model evidence. Physical audio, device sleep, OS clock changes, native fullscreen, forced failures, offline disconnection and real authenticated synchronization/ranking remain unverified. Search/analytics backends were not rechecked.

Ignored evidence: docs/development/evidence/pomodoro-release-2026-11-15/ contains build/test/candidate/public/preflight/deploy logs, exact GitHub synchronization, before/after runtime readbacks, bindings summary, source/artifact manifest, public hashes and production screenshots.

## Recovery

Rollback Worker: `fe0fd7f4-8d2e-4544-b0ae-c250f26fc0cb` (V2.14.0). No database restoration is needed. Existing timer/record formats remain compatible; rollback removes dedicated Pomodoro actions/interface and revised rest recovery. Finish active work before accepting an app update; existing update guards remain. Independent authenticated community acceptance and main-promotion gates are unchanged.
