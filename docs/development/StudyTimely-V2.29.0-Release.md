# V2.29.0 — Study reactions and room themes

Published at https://studytimely.com/study-groups on 17 November 2026. Five original study-cat stickers now accompany the ten fixed quick messages. Click/Enter can replay short silent CSS motions locally; new recent messages animate once, and focus/reduced-motion keep them quiet. Message text remains visible. The room theme label appears in the header and public directory, and owners edit presets, fixed notices and optionally reviewed custom themes through a compact dialog.

- Runtime commit: `db53e32a79a726d8bcce6bd2872f87b2b6b7dcd1`; exact tree `8d5cd9db9867ecfe8bb2d13f01b3654e85430044` on `v2-google-community`.
- Worker: `b7b1b7ea-18b7-4671-bfcc-45343137aefb`.
- Deployment: `98035cca-fe9d-439e-a4d7-33061b334acc`, `2026-11-17T13:42:44.322342Z`,100% traffic.
- PWA: `10cf390522010acf`,62 resources.
- Source inventory: 301 files, SHA-256 `478fd25f5ce7cf8a9ee0aebf123a8746332c2c3b348358972acd7ea3c94ec402`.
- Artifact inventory: 142 files, SHA-256 `9dd453b2b40b16931af08350807358b812888e5c0a7647414de96dd7b9ee3ab7`.

## Activation and data

Existing automatic review stays disabled, providercloudflare/daily5000, with no AI binding. Fixed quick messages and preset themes work. New custom-theme text is paused until a separate verified review activation; the interface retains drafts and explains the fallback. Payments and subscriber text chat remain unavailable. No new inference calls, OAuth grant, paid plan, DNS, secret rotation, dependency, tracking or protected Sites adapter changes.

The correct production DB and nine existing migration names were checked against the deployed DB binding. Before migration, counts, schema, old room columns, foreign keys and a Cloudflare Time Travel recovery bookmark were recorded. Applied only additive `0010_room_themes.sql`, SHA-256 `0018e000e8889c89911c2fe8a1791074d6494ba84d5471953cf0e8c0bdadb60f`. All ten migrations, all previous room columns, unrelated schema, unchanged existing row counts, empty theme defaults and valid foreign keys were verified before deploying. No reset, seed or restore. Final post-release readback passed; counts: `{"cached_approvals": 0, "custom_themes": 0, "entitlements": 0, "review_attempts": 0, "rooms": 2}`. This task did not change room messages, timers, theme text or real user learning records through the production UI.

Custom theme saves use strict text normalization/length/local contact checks and existing reviewer budget/cache/circuit controls. Owner/member/CSRF checks precede review; exact session, membership, mute, room closure, CAS version and current owner/admin permission are rechecked before publication. Review failures do not publish drafts. Older clients preserve existing approved custom text when omitting customTheme; explicitly empty text restores the preset. The owner export and privacy/usage guide include the theme data.

## Acceptance

Final release build56routes+404,375 release-mode tests, deployment dry-run and62 candidate HTTP checks passed. After cutover,62 public HTTP checks and136 exact public non-MP3 artifact hashes passed, including all five active sticker assets, updated client code/styles and privacy/guide copy. All56 navigation pages, robots/Sitemap/canonical, private-query noindex, account/leaderboard authentication guards, public room API metadata, fixture404s and PWA were verified. MP3 files remain unchanged from the earlier licensed-music acceptance.

Source push succeeded to the explicitly approved public repository AImilesChen/studytimely; independent git ls-remote returned the exact runtime commit. A trailing blank line in the local QA script was removed before the first push by amending only this unpublished commit; no shared history was rewritten. Release documentation is a later separate commit and does not imply another deployment.

Local actual Worker/D1/DO tests with two synthetic members verified approved theme sharing/notification/directory/export, blocked/outage behavior, preset fallback, unchanged inference counters for fixed updates and no added credit. In-app browser local acceptance covered theme save/cancel/error/drafts, dynamic controls, click/Enter/arrival/stop/refresh-static, Reduce motion, focus suppression and light/dark desktop/mobile layouts. Desktop1440 and phones390/320 had no horizontal overflow. A brief local timer acceptance recorded one real connected second and was paused afterwards; no synthetic learning time was fabricated.

Production IAB creation/navigation to the real Groups URL timed out and reset the browser kernel; a same-URL existing-tab recovery also timed out/reset. No production screenshot, console read, room editing/message action or final production tab mark is claimed. Public hash/API acceptance is genuine, but does not replace authenticated production-interaction acceptance. The independent real two-person/moderation acceptance and main-promotion gate remain pending.

## Recovery and evidence

Rollback target: V2.28.1 Worker `5fbc41eb-d5d7-47c4-bd0d-2e84f8ffc380`. Keep additive0010 and its approved data on rollback; a database point-in-time restore is a separate incident decision because it can discard later writes. Older runtime does not show stickers/custom themes or export the new field. Do not deploy any local fixture or enable an unverified reviewer/payment path as part of rollback.

Ignored release evidence: `docs/development/evidence/study-cats-release-2026-11-17/` (manifest, build/test logs, before/after runtime and DB metadata, recovery bookmark, migration/dry-run/deploy logs, final readback and public hash/HTTP reports). Local screenshots and asset inventories: `study-cat-stickers-2026-11-17/`; earlier theme integration: `room-theme-stickers-2026-11-17/`. Generated prompts/provenance: StudyTimely-Study-Cat-Prompts-2026-11-17.json and StudyTimely-Study-Cat-Stickers-Local-2026-11-17.md.

Migration procedure was checked against the official Cloudflare documentation: https://developers.cloudflare.com/d1/reference/migrations/ . CLI/deploy reference: https://developers.cloudflare.com/workers/wrangler/commands/ . No third-party deployment adapter was introduced.
