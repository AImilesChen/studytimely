# StudyTimely V2.8.0 production release

Published on 2026-11-15 at https://studytimely.com/alarm-clock. This supersedes the local-only status in `StudyTimely-Alarm-Local-2026-11-15.md` and the preceding AGENTS entry.

The redesigned page includes the large local clock, dedicated alarm form, independent procedural tones and volume, quick times, edit/cancel, missed-alarm recovery and five-minute snooze. Alarm state is independent of local study timers and is not uploaded with study history or appearance/sound preferences. The complete approximately 1,316-word guide and ten FAQ answers are present in initial HTML, alongside updated metadata and WebApplication/BreadcrumbList data. The earlier local handoff describes implementation and browser limitations.

## Published source and runtime

- Public branch: https://github.com/AImilesChen/studytimely/tree/v2-google-community . No main promotion was performed.
- Runtime commit: `4279dedbe68c64fe7a1cb2462b0904a77eaaced1`.
- Exact Git tree: `3afe1eb5f7d2ac47c53247d187d3ee5b5089bd80`.
- Worker version: `be846bab-8ffd-405c-86e7-2e614a92d23c`.
- Deployment: `8b136bf1-fc06-4100-aff7-7f86a8f655e6`, created `2026-11-15T02:42:43.961369Z`; read back serving 100%.
- PWA: `4e9fc914b8a25771`, 61 precache resources. The alarm route remains in the offline app shell; closing the controlling tab or suspending the device still prevents dependable reminders.
- Artifact inventory SHA-256: `ae3fa723cb2a169d62671b745b2e21b0715c319debbde4ddf5dee252254c8118`.

The runtime commit was pushed and read back from GitHub before deploying that same build. Existing GitHub/Cloudflare credentials were reused, without new account grants. All nine runtime binding names/types were compared with the prior version and preserved; `--keep-vars` retained existing variables. No migration, production data mutation, new resource, dependency, OAuth, analytics configuration or protected Sites-adapter change was made. Later documentation-only commits do not imply another deployment.

## Verification

- Final release build: 55 pages plus 404. All **152 tests** passed with `STUDY_TEST_RELEASE=1`, and Wrangler deployment preflight passed.
- **61 release-candidate and 61 public HTTP checks** passed, including route availability, metadata, canonical, redirects, robots, Sitemap, resources and licenses. The Sitemap still has 49 eligible URLs; this release does not add a route.
- **124 public non-MP3 files** matched the exact local artifact SHA-256 values. Checks include all generated pages, current JS/CSS, PWA files, fonts and public policies. The alarm HTML has 1,316 guide words, ten complete closed FAQ answers and expected schema/section IDs. The published privacy policy explains the local independent alarm. Five unchanged licensed MP3s were verified by the existing local build check and were not downloaded again for this release.
- The real in-app browser displayed the production clock, new form, three sound choices, quick times, focus control and guide. It observed the deployed JS `/assets/index-D2Zt99GW.js`, public `index,follow`, correct canonical and ten FAQ elements. The desktop screenshot was saved and separately opened for visual verification.
- Actual production document client/scroll widths matched at desktop (1265px content in the default 1280px viewport) and 390px phone (375px content). Phone guide text measured 16px. Entering phone Focus hid header/settings/guide with document dimensions exactly 390 × 844; returning restored the page. Temporary viewport override was reset. Final page warning/error logs were empty.
- In-app automation had several timeouts and required restoring its browser bindings. The screenshot call saved the desktop JPEG before the subsequent call timed out; its file was later inspected successfully. No production phone screenshot was obtained. Phone DOM geometry/focus checks were observed directly and are distinct from the prior local visual screenshots.
- Production alarm scheduling, sound audibility, snooze, refresh recovery and simultaneous study accounting were not repeated against real browser data. Those flows passed local browser/engine acceptance and the release suite. This release check created no real alarm, study session, profile, room, chat message or ranking entry. Native fullscreen remains unavailable in this in-app environment; no system fullscreen success is asserted.

Evidence: ignored `docs/development/evidence/alarm-release-2026-11-15/`, including build/test/preflight/deploy logs, source/artifact inventory, before/after version metadata, public HTTP report, exact hash report and `production-desktop.jpg`. Existing local interaction evidence remains under `alarm-2026-11-15/`.

## Recovery and operational limits

Previous Worker: `d5052831-304a-4337-af8c-63ab88e57495` (V2.7.0). A code rollback requires no D1 restore or migration reversal. Keep bindings and variables intact. The previous application does not run the independent reminder engine, so after any rollback users must refresh and review/reschedule their alarms rather than assume an already scheduled reminder continues.

Keep the controlling tab open and the device awake; browser suspension, muted/blocked audio, sleep and locked phones can prevent reminders. Existing tabs may offer a PWA update; finish or pause active work before applying an update and resuming alarm checks. Browser automation did not force an update or reset users' stored work.

GSC/Bing indexing, Sitemap submission status and GA4/Ahrefs backend receipt were not reverified; no new configuration or ranking claim is implied. External community review remains unconfigured, so the prior production free-text sending restriction and independent authenticated-community/main-promotion gates remain unchanged.
