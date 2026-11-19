# StudyTimely V2.36.0 — 19 November 2026

Published at https://studytimely.com/study-groups from the existing `v2-google-community` branch. This supersedes the local-only status of the advanced-group, room-refinement and object-icon follow-ups.

- Runtime source: `f32c1b408568154a596ba4eaac8af08e486c601a`.
- Exact source tree: `feaabd18dfd4387fee405a05feaf3ea5278c9d37`.
- Worker version: `d68e8b45-b608-4f76-a082-e51844a4979a`.
- Deployment: `91ba549c-1f5c-4400-8b04-244733707348`, published at `2026-11-19T14:19:11.551668Z`, 100% traffic.
- PWA: `61e007fea46fbc5d`, 76 resources.
- Source inventory: 422 files, SHA-256 `935344c663cfe232514474331bad17a04adf126d6f6536e1642a72f9f0c4d6b2`.
- Artifact inventory: 195 files, SHA-256 `20cf3ff47e9cb26baf8a0ec55119d1f721f85ae45fa0b6d83fd50764094c5352`.

## Delivered

Advanced groups are an explicit, optional free preview while available; they do not create a paid subscription. A free account retains one active owned room with four places. Eligible preview/subscription access supports ten owned rooms and applicable capacities up to 24. Joined rooms have a separate ten-room limit. Expiry preserves read-only records and pauses recurring activities. The host's room capacity does not grant guests free-text access.

The room has Study together, Activities & tasks, Group progress and Manage tabs. Shared tasks, repeating appointments, challenges, aggregate weekly reports/CSV, up to two scoped co-hosts and optional per-device scene/music recommendations are included. Task completion, reservations and messages do not create study time or start timers. Each person explicitly controls sound. Existing safety-review/moderation gates remain; external text review is still disabled in production.

Empty-seat tiles are replaced by a compact invitation bar. The member/message panels share edges, menus have consistent colours and icons, conversation/safety opens in a bounded dialog, and room management is consolidated. Community nickname/ranking/hidden-member preferences are in Account → Community with a working deep link. The public guide contains practical instructions, feature/access comparison, scenarios, twelve FAQs and related tools. Its six feature cards now use dedicated decorative SVG learning-object illustrations rather than generic icons in small rounded boxes.

## Migration and configuration

Only `0014_group_advanced.sql` was pending. It was applied to the existing `studytimely-accounts` database using the production configuration: 30 commands, additive group tables/fields/indexes and replacement allowance triggers. A current D1 Time Travel bookmark was recorded immediately before migration in ignored evidence. No database reset or restore occurred.

Aggregate pre/post checks confirmed unchanged counts for accounts, profiles, rooms, memberships, workspaces and sync records. Nine group tables and the migration row exist; `PRAGMA foreign_key_check` returned no violations. These are preservation/schema checks, not a claim of exhaustive production data verification.

All twelve binding definitions, handler definitions and script runtime settings match the previous version. Only the script etag changes. Existing secret names/values, Google scopes, daily cron, review-disabled policy and resource configuration are preserved. No dependency upgrade, paid resource, DNS, tracking or protected Sites-adapter changes. The official CLI required normal execution with access to the existing Windows credential store; no new login or permissions were actually needed. An initial restricted-context authentication check was misleading.

## Verification

- Release build of 56 pages plus 404, Wrangler dry-run and 646 release-mode tests passed. The initial test invocation omitted `STUDY_TEST_RELEASE=1`; after correcting the invocation, all tests passed without product-code changes.
- Twelve compiled-Worker/local-D1 scenarios passed using synthetic accounts and disabled external review. The fixture Worker and fixture login were not deployed.
- 62 candidate and 62 production HTTP/SEO/resource checks passed.
- All 153 deployed non-audio/video files match the exact release artifact hashes, including route HTML, client bundles, fonts, images and PWA files. One font timed out initially and passed a focused retry. The existing direct `/404.html` asset is served as 200; unknown-route 404 behavior passed the normal HTTP verifier. Audio/video assets were unchanged and were not re-downloaded for full hash checks in this release; all public-source assets other than the three intentionally excluded design-review files were present byte-for-byte in the build.
- Five additional production groups of checks passed: six feature marks and substantive canonical/indexable guide; private query noindex/no-store; fixture routes unavailable; anonymous private advanced-room/sync APIs rejected; public community API and Google provider available.
- Source was pushed and read back through Git transport on the previously authorised public repository release branch. No merge to main.
- Actual production IAB DOM showed the new guide, six feature cards, optional preview control, preserved signed-in account and existing rooms with free/read-only allowances. Opening an existing active room changed the browser URL, but subsequent browser control/get-tab/screenshot calls repeatedly timed out. Therefore no fresh production room-layout, mobile, dialog/focus, authenticated advanced-tool write or console acceptance is claimed. Earlier local light/dark/mobile/task/series/report/account-save evidence remains valid at its documented scope. No fresh production screenshot could be saved; do not label earlier local screenshots as production proof.
- No production timer was started, audio played, task/message created, preview enabled, role changed, subscription granted or account preference saved for acceptance. No new authentication was initiated. Existing independent authenticated community/moderation and main-promotion acceptance gates remain pending.

## Recovery and evidence

Prior Worker rollback reference: `fb32cda3-14d9-4d3f-86ed-e01c34fdf81a` (V2.35.0). Preserve the additive database schema and records during a normal Worker rollback. Do not restore the whole database as part of rollback; a Time Travel restore would replace intervening writes and needs a separately considered recovery decision. The local bookmark and aggregate records are in ignored `docs/development/evidence/group-release-2026-11-19/`.

That directory also holds release build/tests/dry-run, deployment/version snapshots, migration and schema checks, source push, exact production artifact checks and HTTP reports. Later documentation-only commits are not a new runtime deployment. Preserve the unrelated pre-existing `FocusGuide.jsx` status/content.
