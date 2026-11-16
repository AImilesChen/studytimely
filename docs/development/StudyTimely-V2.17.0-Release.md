# StudyTimely V2.17.0 production release

Published on 16 November 2026 at <https://studytimely.com/aesthetic-timer>. This supersedes the local-only unified-navigation handoff. The shared header is included on all 56 rendered routes.

## Published behavior

All legacy WorkspaceNav bars have been removed, including the inconsistent second horizontal navigation on management pages and the repeated lower tool list. Desktop Tools now opens a grouped dropdown beneath the header. Phones retain the native Menu dialog with the same sixteen tool destinations. Study Groups, Leaderboards and Account remain directly accessible on desktop and are prominent cards inside the mobile menu. The current tool is marked, including World Clock on its city pages. Previously dependent workspace pages receive safe header spacing; their own controls and the timer dock are preserved.

The desktop dropdown supports click, keyboard opening, initial link focus, Escape, outside pointer/focus dismissal and navigation dismissal. Changes of path, Focus mode and breakpoint close it. Deferred focus restoration fixes the mobile-dialog-to-desktop transition. The unused WorkspaceNav component and obsolete styles were deleted. App/offline readiness remains available without the repeated tool bar.

There are no new routes, SEO copy, database migrations, data formats, dependencies, backend/API, authentication/OAuth, secrets, tracking, legal, resource or protected Sites adapter changes.

## Exact source and deployment

- Repository/branch: <https://github.com/AImilesChen/studytimely/tree/v2-google-community>. Main was not promoted.
- Runtime commit: `1f00fe42b830fd7d18c696bb2ccec9d21c67e2b5`.
- Git tree: `d6944c454518576589a264702d09ff4e9395f453`.
- Worker version: `9d4b0fab-a4d0-49d1-a04b-65cb1370bcab`.
- Deployment: `b32076bd-d7fa-4995-8426-26eb908d1530`, created `2026-11-16T02:41:45.111823Z`, read back serving 100%.
- PWA: `d5a0697f53b53add`, 62 precache resources.
- Artifact inventory SHA-256: `6b9d2a1ae7ac1458f581b73162f8ad02279361c25886fc83093865fddc98b0d5`.
- Source inventory SHA-256: `40597e62c5d0bd0bd5184e2ca999f1b35a212fdeaf8d6bf3ebd5bd65c84f2e2b`.

Native Git push returned a connection reset. The established in-memory credential helper and official GitHub Git-data API synchronized the exact runtime commit/tree and read back the branch. The helper checked the parent twice, did not force-push and permitted deletion only of the reviewed obsolete WorkspaceNav component. No credential values were logged or stored. Deployment used existing Cloudflare authorization and --keep-vars; before/after inventories confirm all nine binding names/types retained. Later documentation-only commits do not imply another runtime deployment.

## Verification and limits

- Fresh release build rendered 56 routes plus 404. All 244 regression tests with STUDY_TEST_RELEASE=1, Wrangler preflight and 62 release-candidate HTTP checks passed. The existing large-chunk advisory remains nonblocking.
- All 62 public HTTP checks passed, covering routes/assets, unique headings, canonical/indexing, robots, Sitemap and licenses.
- All 125 public non-MP3 artifact hashes exactly match the release inventory. Five unchanged licensed MP3s retain existing local license/build checks and were not downloaded again. Public HTML on all 56 routes contains the shared header, initially closed dropdown and mobile Menu, with no legacy workspace bar.
- Actual production in-app browser at /aesthetic-timer confirmed the clean header and absence of the old horizontal bar. Tools expanded into three groups with sixteen destinations and Study Space marked Current; Escape closed it, with aria-expanded=false observed. production-dropdown.jpg was saved and visually inspected.
- At 390x844, the actual production header exposed Menu. Opening it showed the shared tool catalogue, community/account cards and Current marker. production-phone-menu.jpg was saved and visually inspected. Escape closed it, the viewport override was reset and the final desktop state showed the normal closed Tools trigger. Captured warning/error logs were empty, and the production tab was marked deliverable.
- Early production browser calls timed out and reset their handles. After recovery, the observed production interactions above completed successfully. No failed attempt is counted as a passed interaction. Production browsing changed only transient menu/viewport state; no timer, preference, favourite, history, account sync or community data was changed.
- Broader keyboard/Tab-out/outside-pointer behavior, actual tool navigation, six viewport bounds/no-overflow checks, timer-switch Cancel protection and Focus hide/restore remain local evidence in StudyTimely-Unified-Navigation-Local-2026-11-16.md. They were not all repeated on production. Local synthetic stopwatch state was reset to zero without creating study history. Native fullscreen, forced offline/storage errors, full accessibility compliance, authenticated community/sync flows and external search/analytics collection were not reverified in this release.

Ignored evidence: docs/development/evidence/unified-navigation-release-2026-11-16/ contains build/test/preflight/deploy logs, manifest, exact GitHub synchronization, before/after runtime and binding readback, HTTP reports, public artifact verification and production screenshots. Raw runtime responses stay outside Git. Local interaction evidence remains in docs/development/evidence/unified-navigation-2026-11-16/.

## Recovery

Rollback Worker: `f28c538f-2065-43f8-9dd0-9af3f9e07788` (V2.16.0). No database restoration is needed; storage formats are unchanged. Rollback restores the earlier mixed navigation. Finish active work before accepting a PWA update. Existing independent authenticated community acceptance and main-promotion gates remain pending and unchanged.
