# StudyTimely V2.13.0 production release

Published on 2026-11-15 at <https://studytimely.com/countdown-timer>. This supersedes the Countdown local-only status in AGENTS.md and the local handoff. The detailed local interaction evidence remains in `StudyTimely-Countdown-Local-2026-11-15.md`.

## Published behavior

The original clean timer face remains: three portrait flip cards, both colons, Start/reset, quick sound/music/alert/theme/focus controls and the existing tool dock. Set time opens a compact 340px desktop window or a phone bottom sheet. Presets, custom hours/minutes/seconds, end sound and volume are drafts until Apply; applying never starts a timer. Cancel, close, Escape and outside dismissal discard drafts. Running timers lock duration while reminder preferences remain editable. Focus hides the panel and surrounding workspace.

The countdown is a general duration timer and grants no study or leaderboard credit. Pause/resume and cross-tab ownership preserve the appropriate remaining time/deadline. A fresh observed completion may ring for up to 60 seconds; old completed timers do not autoplay on reload. The guide follows the actual Set time/Apply workflow and includes 2,721 English words and ten complete FAQs, with instructions, examples, troubleshooting and relevant tool links.

## Exact source and runtime

- Repository/branch: <https://github.com/AImilesChen/studytimely/tree/v2-google-community>. No main promotion.
- Runtime source: `c092fedc0831e275d07cb88b73d32729bc802571`.
- Git tree: `9a0c4491c98a7f2945c7f491efdbdaf5a99aa948`.
- Worker version: `4126259a-9c90-4c76-8bd3-fc3d654561cf`.
- Deployment: `46368d11-1d7d-4f92-8e61-b3dbe049ff52`, created `2026-11-15T13:25:30.252798Z`, read back serving 100%.
- PWA: `26cb2dc418b9ee5a`, 61 precache resources.
- Artifact inventory SHA-256: `43f4e1678d9363b5309b40f2677fdf59618c64d4e31a1de8b4f4da9369875ae6`.

Native Git transport repeatedly reset the connection. The existing credential helper and official GitHub Git-data API synchronized the exact tree/commit, checked the remote parent twice and read back the final branch without force. Credentials were neither printed nor stored. Existing Cloudflare CLI authentication published with `--keep-vars`; all nine binding names/types match the preceding runtime. No dependencies, database migration, backend API, OAuth, secrets, resource configuration, tracking, legal text or protected adapter files changed. Later documentation-only commits are not another runtime deployment.

## Verification

- Release build passed: 55 pages plus 404. All 209 tests passed with `STUDY_TEST_RELEASE=1`; Wrangler dry-run passed. The existing Vite large-chunk advisory remains nonblocking.
- 61 release-candidate and 61 public HTTP checks passed, including indexing/canonical, robots, sitemap, assets and licenses.
- 124 public non-MP3 artifacts exactly match the local SHA-256 inventory. Five unchanged licensed recordings passed existing local build/license checks and were not downloaded again.
- Public initial HTML contains the full guide, ten FAQs, expected section IDs, WebApplication and BreadcrumbList; the permanent expanded setup form is absent. PWA version and Countdown precache membership match this release.
- The actual production in-app browser showed the clean face and Set time window with presets, hours/minutes/seconds, end sound, 40% volume and Apply/Cancel. Cancel closed the window and retained Ready/00:25:00 without starting a timer. Desktop width 1280 and phone width 390 had no horizontal overflow. Phone Apply/Cancel were visible inside the 844px viewport.
- Actual production screenshots were saved and inspected: `production-desktop.jpg`, `production-panel.jpg` and `production-phone.jpg`. The panel screenshot includes tool-induced page scrolling; the clean desktop screenshot shows the original first screen. These are separate from earlier local screenshots.
- One combined browser call timed out after opening the panel; recovery in the same in-app browser confirmed its actual state and completed inspection. Final captured warning/error logs were empty, the panel was cancelled, viewport override reset and production tab marked deliverable. No native desktop input was used.
- No production countdown was started, settings saved, learning record created or cloud/community/profile data changed. Apply/pause/completion/audio/cross-tab and broader responsive interactions have local/model evidence and were not repeated against production personal state. Physical speaker audibility, device sleep, forced audio blocking, manual OS clock changes and native fullscreen remain outside this release's production acceptance.

Ignored evidence: `docs/development/evidence/countdown-release-2026-11-15/` contains build/test/preflight/deploy logs, before/after versions, runtime readback, exact GitHub synchronization report, artifact inventory/public hashes, HTTP report and screenshots. Search/analytics backend events, real cloud synchronization and authenticated community actions were not reverified.

## Recovery and remaining scope

Rollback Worker: `38f86f0c-8921-4a7c-984d-697867425f2c` (V2.12.0). No database restoration is needed. Active countdown storage remains compatible; reverting removes the revised interface/alert behavior. Complete active work before applying an available PWA update; existing update guards remain authoritative. Independent authenticated community acceptance and main-promotion gates remain unchanged.
