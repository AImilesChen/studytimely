# StudyTimely V2.34.0 release — 18 November 2026

Published at https://studytimely.com/account from `v2-google-community`.

- Runtime source: `efa1bb8f08d96556ba8f0cbd6c8e9ba073f33f16`; tree `f8bbeae111d27c0cb14dc3dc112bb8e3efed8f05`.
- Worker: `72e89eeb-c92b-4e1a-b2b5-701f839e5a22`; deployment `1e7cca00-e308-44c3-afe9-c9e1015021d9`, published `2026-11-18T16:20:25.846104Z` at 100% traffic.
- PWA: `cc3361041e725de3`, 62 resources.
- Source inventory: 317 files, SHA-256 `3de1ce03e0186e32960e4e349cf1527bc0c801b1eef0fa4c30cc796e03bcb3d7`.
- Build inventory: 220 files, SHA-256 `c11e0a2ef133586df8e92afc37e895bb3a785f2fb599754f54b3b09faeee9685`.

## Delivered behavior

The original learning-center Overview, learning, progress and community sections remain. A compact Your data card follows the learning content; account controls precede the full sync and recovery section in Settings. Default /account opens Overview. The explicit ?view=sync link opens Settings. Inactive recovery does not show large empty preview columns or duplicate backup controls.

Automatic sync requires an explicit account choice. Signing in does not upload unsigned-in records or enable syncing. Saved study records, plans, goals, subjects, habits and private reviews can sync; active timers, alarms, local reminders, presentation preferences and local planner undo remain device-owned. Offline changes are queued, revisions and generations fence stale writes, and unresolved field conflicts remain available for review. Account workspaces stay separate.

Private recovery supports backup previews, selected linked-item recovery, reviewed full-workspace restoration, recently deleted items and browser-session naming/revocation. Daily changed-day backups and protective versions have a 30-day / 40-version bound; local protection keeps up to 10 copies for 30 days. Automatic workspace limit is 4 MiB; legacy manual snapshot limit remains 1 MiB. No billing integration or new paid resources were enabled.

## Verification

- Final release build and official deployment dry-run passed.
- 574 full release-mode tests passed (0 failures).
- 67 synthetic local Workerd/D1 acceptance checks passed: authentication/CSRF, mutation/replay, incremental reads, isolation, backup readback, generation fencing and device metadata.
- 62 candidate and 62 production HTTP/SEO/resource checks passed.
- 136 deployed non-MP3 public file hashes match the exact build; 56 pages retain common navigation.
- Production anonymous sync state/backups/deleted/devices reject unauthenticated access with private no-store/noindex headers; fixture entries return 404. Google remains available; advanced learning/planning previews remain free.
- All original 12 Worker bindings and runtime settings match readback. External text review remains disabled; no AI binding, new OAuth scope, dependency upgrade, protected adapter, DNS or tracking change.
- Native Git source push succeeded through the existing Windows system proxy after direct networking failed; the GitHub connector separately confirms the branch. No merge to main.

Rendered-component tests cover the scoped account integration. Actual in-app browser interaction, mobile geometry, Google-return, physical two-device/offline/sleep and native download acceptance were not repeated: browser open requests only returned queued and no capture/control interface was available. `design-qa.md` remains blocked for visual acceptance. No production synthetic users, sessions, study records, messages or entitlement grants were created.

## Database and recovery

Only additive `0013_automatic_sync.sql` was applied to the existing `studytimely-accounts` D1 binding. Migration SHA-256: `531e52bed633e49023ef5b5d775051c7ec20d4bc0507a65b879b9dc8b68bd3f6`. Verified 13 migrations, eight new private sync tables, all prior table/index/trigger definitions preserved, and no foreign-key violations. No seed, reset or user-data restoration was performed.

Before migration, Cloudflare server-side Time Travel recovery metadata was recorded in ignored evidence. A complete production SQL export was rejected by automatic approval because it would download sensitive user data; that export was not executed. The release used a service-side recovery bookmark instead. No user rows were downloaded for the recovery checkpoint.

Rollback reference: prior V2.33.0 Worker `3beefb17-27a7-4448-bd30-b30428e84fe3`. Retain migration0013 and sync records. Older code does not provide automatic sync/recovery or its write fences, so prefer a forward fix; any emergency Worker rollback must assess legacy manual writes and pause new sync use. Database restore is a separate incident decision and can discard newer writes; do not automatically restore/reset the whole database.

Evidence is ignored under `docs/development/evidence/account-sync-release-2026-11-18/`. Existing independent real production two-person community/moderation acceptance and main-promotion gates remain pending. Later documentation commits do not imply another runtime release.
