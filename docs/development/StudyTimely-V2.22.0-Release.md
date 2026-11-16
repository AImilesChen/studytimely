# StudyTimely V2.22.0 production release

Published on 16 November 2026 at <https://studytimely.com/flip-clock>. This supersedes the local Flip Clock handoff. The public [release branch](https://github.com/AImilesChen/studytimely/tree/v2-google-community) contains the exact runtime source. Main was not promoted. The user's separate Study Groups width question was deferred when they prioritised this publication; no group layout change is included.

## Published changes

The accepted clock hero, three portrait panels, colons, external date, quick tools and dock remain unchanged. The twelve-city World clock panel remains. The clock route's learning-progress teaser and generic learning-data note are removed, while the homepage keeps its study overview.

A dedicated 2,663-word English guide and twelve complete FAQ answers explain the real display controls, fullscreen/Focus, desk setups, device time and zone, troubleshooting, preferences, installation/offline limits and related tools. Buttons open the existing Timer/Appearance panels or Focus view. Contents, return links and city/tool destinations work through the existing navigation. The optional clock-specific PwaStatus description leaves other contexts unchanged.

The SEO title and description are updated; the accepted H1, canonical and WebApplication are retained, and BreadcrumbList matches a visible breadcrumb. Guide content and answers appear in initial HTML. Scoped below-fold styles align the World clock panel and guide, with 18px desktop and 16px mobile text. No internet-time synchronisation, always-on screen, automatic study credit or system screen-saver capability is claimed.

## Runtime and verification

- Runtime commit: `1630eaccc0aa0cb410eb0a41c2113e33418969e0`.
- Git tree: `87c40cdc9c03daabc75225ef73129c63cf18d8de`.
- Worker version: `be98f161-2da7-42bf-9ff6-828db1f363d0`.
- Deployment: `a1838c32-a08b-49a2-a917-e423c6bb90a1`, created `2026-11-16T12:46:05.300822Z`, read back serving 100%.
- PWA: `f7025b50346f6308`, 62 precache resources.
- Source inventory SHA-256: `1872f39b043a7f403974a2cec1d99805aa2e03e4c81bd9c24d35a1f969f8e336`.
- Artifact inventory SHA-256: `bd815e69fc4691192fd2f538900b1c4bf02432da0aab645c98b1ce14753835eb`.

The exact eleven-file source commit/tree was synchronized with parent/head checks and no force. The GitHub connector independently read version 2.22.0 on the release branch. Existing Cloudflare authorization worked without a new grant. Deployment used `--keep-vars`; the nine binding names/types and plain/D1/Durable Object definitions were compared before and after.

Release build produced 56 pages plus 404. All 299 release tests (`STUDY_TEST_RELEASE=1`), Wrangler dry-run and 62 candidate HTTP checks passed. All 62 public HTTP checks passed on rerun; the first run encountered a network timeout requesting the unknown `/not-a-page` URL. No application change was needed, and the rerun verified its expected 404 along with redirects, robots, sitemap, canonical and resources.

All 125 public non-MP3 artifacts exactly matched the release inventory. All 56 initial pages retain unified navigation and closed disclosures. Public responses verify the new clock title, guide, twelve answers, anchors, canonical, indexability and both schema types, with no clock study teaser and the homepage teaser retained. Existing exam/syllabus/habit guides and the PWA version were checked too. Unchanged licensed MP3 recordings were not downloaded again. The existing bundle-size advisory remains; no performance-score improvement is claimed.

## Browser evidence and limits

A fresh in-app tab was created and production navigation returned successfully. The subsequent DOM/screenshot verification timed out and reset the browser runtime. No accepted production screenshot, live DOM result, phone measurement, setting change or final production deliverable-tab mark was obtained. Local screenshots are not production proof.

Prior local evidence remains in `StudyTimely-Flip-Clock-Local-2026-11-16.md`: six actual viewport measurements preserve hero positions/sizes, align guide/panel edges and show no document overflow; real Timer/Appearance actions, seconds and date/format changes, size/reduced-motion changes, Focus/Escape, FAQ mouse/keyboard and Beijing navigation were observed. Default display settings were restored. Native fullscreen did not enter in the in-app test and is not claimed as verified. Installation, offline operation, physical audio, screen sleep, full accessibility, analytics backend collection and actual cloud/account/community workflows were not exercised by this release.

Ignored evidence: `docs/development/evidence/flip-clock-release-2026-11-16/` contains release build/test/preflight/deploy logs, candidate/public checks, first-run timeout and successful retry, 125-file hash report, manifest, source synchronization and sanitized runtime summary. Raw runtime records remain ignored and must not be published. Later documentation-only commits do not imply another runtime deployment.

## Recovery and unchanged scope

Previous V2.21.0 Worker `4b55c34c-c10d-41ac-b67c-bc17831f1b67` is the rollback point. This release introduces no storage/data-format or migration change, so no automatic database restoration is required for rollback. Existing independent-exam compatibility precautions from V2.21.0 continue to apply to older versions.

No clock engine, presentation hook, timer accounting, API, model/storage format, D1 migration, dependency, credential, binding, paid resource, DNS, legal text, tracking configuration or protected Sites adapter changed. The independent production-community acceptance and main-promotion gates remain pending. Finish active learning before accepting a waiting app update.
