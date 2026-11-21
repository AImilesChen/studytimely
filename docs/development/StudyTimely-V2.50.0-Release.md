# StudyTimely V2.50.0

Published 21 November 2026 at https://studytimely.com/account?view=settings, with the public guide at https://studytimely.com/help/sync-and-backup. This supersedes the local Account & data implementation and its responsive refinements.

- Runtime commit: `c6aa2c5923697eecb9c5c7c9849bed42ad4ad7ce`; tree `67de32e249394615f2f8cffe5cfb045f7cc60d1d`; branch `v2-google-community`.
- Worker version: `fdbeceb4-8149-4ca0-adec-19f9ff9928d8`.
- Deployment: `2d73b886-b990-436a-9928-1761c1451c06`, created `2026-11-21T15:32:04.28568Z`, 100% traffic.
- PWA cache: `39670be2c25f78e1`, 77 precache resources.
- Rollback: V2.49.0 Worker `4a0f11dc-529b-48fb-865d-92eda776eb32`; no database migration or restore required. Browser protection copies created by this release remain local data; a Worker rollback does not erase them.

## Published behaviour

Account & data now leads with compact identity and actual sync status. Explicit sync setup compares local/cloud work before a choice is applied. Restorable learning-backup download and local-file import are grouped in one workspace. File preview shows before/after study totals, respects duplicate IDs, existing goals and deletion records, and never adds group ranking credit. Initial account/revision/epoch checks and an atomic expected-revision check prevent a stale preview from being applied. Cancel does not save. A subsequent sync-status refresh failure does not turn a committed local import into a failed-import claim.

Local protection copies precede changed imports/deletions even when automatic sync is off, without enabling or queuing cloud sync. This reuses existing bounded recovery storage. Historical versions, retained deleted items and sync browsers show real data or truthful loading/error/unavailable states. History reads are independent and reject stale account results. Existing timer, session, CSRF, version, conflict and full-restore confirmation safeguards remain.

Nickname/public-ranking preferences, account-data export, conditional existing legacy-snapshot controls and deletion follow the data tools. Account-data copies are explicitly distinguished from importable learning backups. Main controls and guidance are expanded. The existing serif/warm illustration style is retained, with 44px controls, a distinct gold file-picker button, aligned desktop columns and single-column mobile tools. Mobile account tabs form a visible two-by-two layout; the inherited oversized account frame and compressed email layout are corrected.

The public `/help/sync-and-backup` guide is prerendered with unique title, description, canonical, Article and BreadcrumbList metadata, a labelled example and expanded answers. Study Timer and Study Tracker link to it, and the release Sitemap includes it. Account/private variants remain noindex and private APIs retain authentication requirements. No new backend endpoints, permissions, schema, dependencies, secrets, OAuth, DNS, paid resources, tracking configuration or protected Sites adapters changed. Test fixtures and ignored preview/diagnostic helpers were not deployed.

## Verification

- Formal release build: 57 prerendered pages plus 404. Wrangler dry run and production-bundle fixture-exclusion/indexing preflight passed.
- **786 release-mode regression tests passed**, zero failures, including local-only protection/recovery, stale imports, identity switches, duplicate/deleted IDs, existing sync/API/two-device regressions and account/guide render states.
- Candidate and production each passed **63 HTTP route/resource checks** and six group-page checks, including robots, Sitemap, licences and private-query headers.
- **176/176 public non-audio/video files exactly match** the release artifacts. The actual guide HTML, source links, canonical, structured data, Sitemap eligibility, account noindex and anonymous API rejection checks passed. Synthetic fixture and diagnostic endpoints are absent.
- Deployment metadata confirms 100% traffic. All **12 bindings**, handlers and runtime settings match the previous version; keep-vars was used. No migration was run.
- Source inventory: 509 files, SHA256 `1c6b9e1a8bf5ac7562d96e22ac52902491dd85a3da3f6e9f60fa4bad43506789`.
- Artifact inventory: 218 files, SHA256 `48f63a213171550dbd52d61b0ab03df63d334f94e612fe5cffee9f049a3a0937`.
- Runtime source was pushed and independently read back on the existing authorised public release branch using the existing system proxy.

Local in-app browser acceptance is recorded in the local handoff: explicit sync choice/cancel, synthetic-file preview/cancel, actual learning-backup download, desktop/phone dark/light screenshots and 1280/390/320 geometry with no page-wide overflow. No cloud-enable or destructive action was submitted. After publication, the existing production tab navigated to the settings URL, but browser state inspection timed out and reset its connection; a second read after reconnect also timed out. The production tab was opened through Codex's native handoff. Fresh production screenshots/authenticated click-through are therefore not claimed. No production import, restore, sync-enable, export or deletion was submitted for verification.

The new guide's live search metadata and Sitemap were verified; external GSC/Bing submission and GA4 event acceptance were not rerun. Existing independent planner/community/moderation/main-promotion gates remain separate. The unrelated FocusGuide.jsx working-copy status remains excluded. Later documentation commits do not redeploy runtime.

Ignored evidence: `docs/development/evidence/account-data-release-2026-11-21/`.
