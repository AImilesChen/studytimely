# StudyTimely V2.12.0 production release

Published on 2026-11-15 at <https://studytimely.com/study-tracker>. This supersedes the preceding Tracker local-only status. Detailed local interaction and accounting evidence remains in `StudyTimely-Tracker-Local-2026-11-15.md`.

## Published behavior

Study Tracker now has one date/subject report for summary figures, charts, records and filtered CSV. Presets and inclusive custom dates support up to 366 days; unapplied date drafts disable export. Saved learning intervals are clipped at local day/range boundaries, distinct records count once and averages use dates with saved learning. Partial records retain their full duration and original times in Details/CSV. Existing whole-record deletion, accounting and tombstones are preserved.

Today's all-subject goal and collapsed all-subject lifetime/52-week activity remain separately scoped. First-use guidance and a nonpersistent 90-minute example replace empty charts. Full JSON backup remains separate from filtered CSV. Responsive shared edges, larger controls, detailed instructions, worked examples and ten complete FAQs are included. Public guide word count is 3,261 after normalizing HTML entities (about 3,260 words); the preceding local count used slightly different whitespace/entity normalization.

## Exact source and runtime

- Repository/branch: <https://github.com/AImilesChen/studytimely/tree/v2-google-community>. No main promotion.
- Runtime source: `00671c2569d45520abeab53a86ba341c0817ed07`, independently read back through GitHub connector.
- Git tree: `2b786c40d012e1a46b59d3d742e0d2602053f893`.
- Worker version: `38f86f0c-8921-4a7c-984d-697867425f2c`.
- Deployment: `a65a76cd-78f0-42fe-b81e-52c0d15c88ad`, created `2026-11-15T10:16:40.899934Z`, read back serving 100%.
- PWA: `e3eb74aa0ffef577`, 61 precache resources.
- Artifact inventory SHA-256: `2d0f93b2c6dae9e193277a72b0f11105c96e964397db7e967566c1d0d199041d`.

Native Git push and Cloudflare authentication initially could not access existing credentials inside the restricted shell. The approved release then used existing credentials through escalated native Git/Wrangler commands; push and deployment succeeded. No new permissions, token creation or credential values were required. Wrangler `--keep-vars` retained runtime variables. Nine binding names/types match the previous version. No dependencies, database migrations, API changes, OAuth, secrets, bindings, tracking configuration, legal text or protected deployment adapters changed. Later documentation commits do not represent another runtime release.

## Verification

- Release build passed: 55 pages plus 404. All **197 tests** passed with `STUDY_TEST_RELEASE=1`; Wrangler preflight passed.
- **61 release-candidate and 61 public HTTP checks** passed, including canonical/indexing, robots, sitemap, routes, assets and licenses.
- **124 public non-MP3 artifacts** exactly match local SHA-256 hashes. Five unchanged licensed MP3s passed existing local build/license checks and were not downloaded again.
- Public initial HTML has the full 3,261-word guide, ten FAQs, expected section IDs and WebApplication/BreadcrumbList. No private/synthetic session cards or duplicate workspace navigation appear before local loading. PWA version and tracker precache membership match the release.
- Actual production in-app browser showed the new empty-history onboarding and detailed guide. Example preview displayed 90 minutes/three records; selecting Maths displayed 50 minutes/two records. Closing the example returned to actual empty history without saving records.
- Inspected production screenshots: `production-desktop.jpg` shows the actual 1280px first-use page; `production-phone.jpg` shows the 390px filtered example charts stacked in one column. These are production screenshots, distinct from earlier local evidence. Phone image is a sample preview, not personal study history. Numeric overflow geometry was not read back in production; the images and separate local DOM checks supply the available layout evidence.
- Browser calls briefly timed out/reset. Recovery through the same in-app browser succeeded; final screenshot capture, example exit, warning/error logs (empty), viewport reset and persistent-tab marking all completed. No desktop/local application input was used.
- Real save/delete/export, date validation, midnight/DST and broad responsive acceptance have local/model evidence and were not repeated against production personal data. No real timer/session, goal, cloud sync, profile, room, message or ranking mutation occurred. No forced PWA update was performed.

Ignored evidence: `docs/development/evidence/tracker-release-2026-11-15/` contains build/tests/preflight/deploy logs, before/after versions, exact artifact inventory/public verification, HTTP report, runtime status and production screenshots. Search/analytics backend events and authenticated cloud synchronization were not reverified.

## Recovery and remaining scope

Rollback Worker: `109072e0-a82e-4f22-b77f-9f92a6c7c389` (V2.11.0). No database restoration is needed for a code rollback. There is no saved-data format change in this release; rolling back removes the new report interface while retaining existing supported records. Update only when active work is safely finished; existing PWA update guards remain authoritative.

Manual historical time editing/addition, notes and printable/copied review summaries remain later work. Existing external community-review configuration, authenticated community acceptance and main-promotion gates remain independent and unchanged.
