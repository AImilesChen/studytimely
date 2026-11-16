# StudyTimely V2.18.0 production release

Published on 16 November 2026 at <https://studytimely.com/focus-timer>. This supersedes the local-only Focus Timer implementation and subsequent settings-button refinement. Detailed local interaction evidence remains in StudyTimely-Focus-Timer-Local-2026-11-16.md.

## Published behavior

The original sparse portrait HH:MM:SS face, colons, Start/reset and quick sound/music/theme controls remain. A subtle outlined Session settings pill uses the existing GearSix icon and text, without the former double underline. It has a40px desktop height and12px Start separation,44px phone touch target and36px short-landscape height. Hover/expanded/focus states remain visible without becoming a second primary action.

The button and this page's header gear open the same dedicated settings window. Presets15/25/45/60 minutes, custom1-second–4-hour duration, subject selection and optional new subject are drafts until Apply. Apply never starts learning. Cancel/X/Escape/outside dismissal leave unapplied drafts unused. The new local focus-settings action reuses existing model validation and timing protection, saves a new subject atomically and rejects invalid/busy/stale changes without leaking a label. All unfinished timers are protected, with an explanation and return path. No storage schema or saved-record format changed.

Saved feedback displays actual time and links to history. The lower report separates all saved study today from the latest saved focus session across history, with date/result/subject and optional task title. Backup & restore opens the actual Data settings tab. Completion does not mark a task done or promise public leaderboard credit. Shared learning accounting, pause exclusion, early finish, reset confirmation, ownership and interrupted-time review remain.

The initial HTML contains approximately2,540 English words including ten complete FAQ answers. It explains actual operating steps, four duration examples, a30-minute session with an excluded three-minute pause, timing-tool differences, saved-time rules, sound/music/alert controls, troubleshooting, backup/sync boundaries and contextual next steps. Desktop18px/phone16px paragraphs and aligned section boundaries preserve a readable measure. App readiness follows the guide. Search title/description and BreadcrumbList now describe the single-session study intent; canonical/free WebApplication remain. No routes, fabricated ratings, FAQ-rich-result claims or ranking guarantees were added.

## Exact runtime

- Repository/branch: <https://github.com/AImilesChen/studytimely/tree/v2-google-community>. Main was not promoted.
- Runtime commit: `0afe5ee473c652741af929717a17dd331323675b`.
- Git tree: `6e5cca0dc6f6c66633eec7632ba1ace4e8869ba6`.
- Worker version: `34d2bfbc-d825-4fd9-a694-e6ad6224eea1`.
- Deployment: `9362234b-1556-4c2c-8a68-545ab3b37111`, created `2026-11-16T05:30:44.549926Z`, read back serving100%.
- PWA: `59318bf33e1ab3ca`,62 precache resources.
- Source inventory SHA-256: `952762f1f0088a27e6de96cda690f1083716103811eda50128105537a4a30185`.
- Artifact inventory SHA-256: `8515a4995057cf4d1d061a79d23243ef5552dc15aff76fba58e093bb81ab88be`.

The established existing-credential GitHub Git-data API helper synchronized the exact commit and tree, checked the parent twice and read back the branch without force. It transferred only the14 reviewed files and logged no credentials. This release reused that verified synchronization path instead of repeating earlier connection-reset native pushes. Cloudflare used existing authorization and --keep-vars; before/after binding names/types match for all nine bindings. Later documentation-only commits are not a new runtime deployment.

## Verification

- Fresh release build rendered56 routes plus404. All252 tests with STUDY_TEST_RELEASE=1, Wrangler dry-run and62 release-candidate HTTP checks passed. The existing large-chunk advisory remains nonblocking.
- All62 public HTTP checks passed, including route/assets, headings, canonical/indexing, robots, Sitemap and licenses. The existing public route set remains unchanged.
- All125 public non-MP3 artifacts exactly match the release SHA-256 inventory. Five unchanged licensed MP3s retain existing license/build checks and were not downloaded again. All56 pages retain the unified header without legacy workspace bars. Focus initial HTML verifies the new settings button, detailed guide, ten answered FAQs, real section anchors, canonical/indexability and absence of the old three-line generic tutorial.
- Actual production in-app browser loaded the new Focus page at25 minutes ready, with no saved focus sessions. The settings button opened the real window with all four presets, custom fields, subject, Apply and Cancel. Computed desktop button height40px, no text underline and decorative icon semantics were observed. Actual browser title, canonical, index,follow and ten FAQ elements matched the release.
- At390x844, the actual production settings sheet had no horizontal document overflow, panel bottom844 and Apply bottom820. After saving the phone screenshot, Cancel closed the panel, the viewport reset to1280x720 and the final timer remained00:25:00 ready. Captured warning/error logs were empty and the production tab was marked deliverable. No production timer was started, settings draft applied, subject created or history/community/cloud data changed.
- Saved production-settings-desktop.jpg and production-settings-phone.jpg were inspected. production-guide.jpg captures the live detailed operating steps: the browser restored an earlier scroll position, so it is not a full first-screen screenshot. Detailed unscrolled first-screen screenshots remain labelled local evidence in the prior handoff. The production panel screenshot also includes the new pill and timer controls.
- Broad timing/save/pause/reset/IndexedDB tests and actual synthetic2-record/21-second local workflow are documented in the local handoff, not represented as production learning actions. Six-size full page geometry, keyboard/outside dismissal, Focus hide/restore and FAQ navigation remain local acceptance evidence. Sleep, physical sound/clock accuracy, forced storage/offline failures, native fullscreen, full accessibility compliance, authenticated sync/community operations and external search/analytics backend collection were not reverified.

Ignored evidence: docs/development/evidence/focus-release-2026-11-16/ contains build/tests/preflight/deploy logs, manifest, exact GitHub synchronization, before/after runtime and binding readback, candidate/public HTTP reports, exact public artifacts and production screenshots. Public HTML guide counter yields2546 words with tag-based splitting; the local HTML-parser counter yields2543. The guide text is the same. Raw runtime responses remain outside Git.

## Recovery and unchanged boundaries

Rollback Worker: `9d4b0fab-a4d0-49d1-a04b-65cb1370bcab` (V2.17.0). It removes the new interface and guide while retaining compatible existing learning records. No database restoration is needed. Finish active work before accepting a PWA update. No migration, backend API, OAuth, secret, resource configuration, dependency, legal, tracking configuration or protected Sites adapter changes were made. Existing independent authenticated community acceptance and main-promotion gates remain pending and unchanged.
