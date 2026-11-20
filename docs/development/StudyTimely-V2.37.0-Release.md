# StudyTimely V2.37.0 — 20 November 2026

Published at https://studytimely.com/study-groups from the existing `v2-google-community` branch. This supersedes local-only room restoration and activity/progress/guide polish status.

- Runtime source: `d6d38dc97530c5ead07c1ea7eaa883f9397bb3ac`.
- Exact source tree: `b812a9d5aa1292e1c8d60ac0faaaa3a424e89d1d`.
- Worker version: `7333f9ac-276d-4d32-8a4b-e660ab3c7178`.
- Deployment: `c224e0f7-eb42-4065-8f2b-46dcf236a29f`, published `2026-11-20T01:37:22.04282Z`, 100% traffic.
- PWA: `b7473212bf2a5c1b`, 76 resources; 56 pre-rendered pages plus 404.
- Source inventory: 428 files, SHA-256 `9388b92d9cf36af262020066eb34e6f5ceae05bbb1e9c6f87ad9471ae33afa7a`.
- Artifact inventory: 195 files, SHA-256 `306c0b96ada0a4bdb85dd2ee338602510f92c727c60cf78a012f083e32d5e0b9`.

## Delivered

Restores the familiar four-seat free-room board and individual invitation tiles. Study together retains personal timers, quick messages/stickers, the same mounted single-activity form and basic progress. Advanced benefits have their own explicit-entry panel and add to the original functions. Free-room and member-seat restrictions have distinct explanations; changing the active free room uses the existing versioned action and pause confirmation. No preview is activated automatically.

Activities now distinguish blue planning, green start/join, slate management, lavender participant details and semantic statuses. Native expanded states, icons, borders and update feedback are clearer. Scheduled hosts retain the original manual start and confirmation. Registration/tasks do not start timers or award study time.

Basic progress shows today's room time, daily goal and retained room time once, with one progress bar. 43 seconds against 120 minutes displays 0.6%, and an unfinished goal cannot round to 100%. UTC/reset/retention explanations remain expandable. Guide cards add permission-aware invitation copy, focus-only return to one's seat and the existing activity-plan dialog shortcut. FAQs, privacy guidance and tool links remain; duplicate guide links were consolidated.

## Verification

- Release build, Wrangler dry-run and all 660 release-mode tests passed. An initial test/build overlap read a temporarily missing build file; tests were rerun after the build completed and passed without product changes.
- 62 candidate and 62 production HTTP/SEO/resource checks passed.
- All 153 deployed non-audio/video assets match the exact artifact SHA-256 values. Existing audio/video files are unchanged and were not re-downloaded for full hashes in this release.
- Production JavaScript contains the restored-room and new activity/progress/guide code. Public guide/canonical/index metadata, private query noindex/no-store, fixture exclusion, anonymous private API rejection and Google-provider availability passed.
- All twelve production binding definitions and script handlers/runtime settings match V2.36.0, apart from script etag. No migration, server/API/policy/timer engine/dependency/credential/OAuth/review/tracking/legal/DNS/protected-adapter changes. Review remains disabled; existing secrets and cron are preserved.
- Source was pushed to the previously authorised public repository release branch; no main merge. Unrelated FocusGuide.jsx pre-existing status/content was preserved.
- Existing local evidence covers free timer/message/invitation/moderation/settings, explicit preview/end/free-room switch, activity draft preservation, guide shortcut/dialog/cancel/Escape, light/dark and 320/390/768/1280 layouts. Eight basic, six activity and twelve advanced compiled-Worker/local-D1 scenario groups passed before release; no backend implementation changed in this release.
- No production user records, timers, messages, tasks, roles, subscriptions, preferences or preview grants were changed for acceptance. Audio was not played.
- Fresh authenticated production UI/mobile/dialog/console acceptance is not claimed: the former in-app browser-control namespace is unavailable in this session. Opening the production page through the Codex panel tool was queued, not visual verification. Exact deployed artifacts and production HTTP/API checks above were verified; prior local screenshots remain local evidence.

## Network and recovery

Existing Cloudflare login initially could not refresh over direct networking. Reusing the system's existing proxy restored the existing credential; no new login or scopes were requested. Direct Node production checks also timed out and passed after using that proxy. Optional-scope Wrangler warnings did not prevent publishing; no permission expansion was performed.

Rollback reference: `d68e8b45-b608-4f76-a082-e51844a4979a` (V2.36.0). This release needs no database rollback. Keep the current additive schema and records; do not restore the database during a normal Worker rollback.

Ignored evidence is in `docs/development/evidence/room-release-2026-11-20/`: release build/tests/auth/dry-run/deploy/manifest, candidate/production HTTP, deployment/version snapshots, exact artifact and private-route checks and source push logs. Existing independent authenticated community/moderation and main-promotion gates remain pending. Later documentation-only commits are not a new runtime deployment. Never deploy any fixture Worker or fixture login.
