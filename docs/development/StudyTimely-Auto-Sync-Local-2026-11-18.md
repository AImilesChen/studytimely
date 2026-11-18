# Cross-device automatic sync and recovery — local implementation, 18 November 2026

Status: implemented locally, with automated model/repository/API checks. Browser visual and interactive acceptance remains pending. This is not a production deployment. Production and package remain V2.33.0; local changes are based on f04f76c on v2-google-community. No source push or paid-service change was made in this task.

## User entry and behavior

My Study Center → Settings → Sync & recovery. The existing account/manual-sync controls are a secondary disclosure. This is a free advanced preview; Stripe and subscription checkout are not connected.

- Signing in alone never uploads study records. Each browser separately enables automatic sync and chooses cloud data, review/merge of that account’s local data, or explicit import of its unsigned-in workspace. A protection copy precedes replacement/merge.
- Guest and account workspaces, pending queues and conflict alternatives are kept separately in the existing IndexedDB store. Account changes use a new local epoch to reject late old-tab intents. Switching waits for an active study timer to finish; the independent device alarm remains on its device.
- Normal saves and the outbound journal commit in one IndexedDB transaction. Changes are debounced about 2.2 seconds; foreground polling is approximately 15 seconds, with connection/focus/visibility wakeups and bounded retries. Closed/sleeping browsers do not promise delivery. Active timer ticks are not cloud mutations.
- Stable record IDs, base versions, workspace generations and operation receipts make retry safe. Small independent edits are batched; connected tasks, rules, prerequisites, exam plans and generated arrangements stay atomic. A large independent history drains over multiple bounded batches.
- Different fields merge three ways. Conflicting fields retain local/cloud alternatives for a choice; unrelated records continue syncing. Structural conflicts are held for review. Deletion beats stale edits. Generation changes after cloud restore/clear hold older device queues for explicit review rather than replaying them.
- Remote data changes wait while a study timer has progress. Running timer state, alarms, audio, analytics choices, page reminders and local planner undo are excluded from automatic transfer. This version resumes plans/saved records across devices; it does not hand off a running timer.

## Recovery and device UI

Backups / Recently deleted / Devices tabs; desktop backup selection and preview columns become a single column on a phone. Sync status uses words and icons with green, blue or amber surfaces. Primary setup, selected radio options, backup selection, conflict choices and destructive confirmation have distinct states. Existing Inter and Phosphor icons are reused; no third-party image asset was added.

Cloud backups retain the latest changed-day version and additional pre-delete/pre-restore/pre-clear copies. A preview shows changed records and saved-time impact. Selective recovery follows linked plan/task/rule/exam/syllabus dependencies and shows included items. Restoring rejects stale local previews and changed accounts. Full restore uses the reviewed cloud version/generation and creates a protective copy before changing the generation. Completed sessions and archived plans remain included. IDs survive recovery; repeated restores cannot award duplicate personal time or community credit.

A private browser-session list supports naming and revoking other sessions. No raw session hash/token is returned. Revocation ends future cloud access and does not claim to erase remote browser files. JSON export/import remain available through existing data controls. Account export includes current automatic-sync records and recovery/device metadata. Account deletion cascades the new private tables. Clear local study data clears all cached account workspaces, protection copies and pending queues on this browser and disables automatic sync; it leaves cloud data separate.

## Bounds and storage decision

- Automatic cloud workspace: 4 MiB of validated study data; 128 KiB per record.
- Mutation request: at most 500 changed records / 512 KiB. Large independent histories are batched automatically; an indivisible linked group beyond the bound stays local with an export/review error.
- Cloud backups: up to 30 days and 40 versions. Count limits can shorten available history.
- Recently deleted: up to 30 days, 500 items and 16 MiB; older entries can be displaced by these bounds.
- Local protection copies: up to 10 / 30 days, pruned when creating copies and filtered in the UI. Browser eviction/clear can remove them sooner.
- Automatic snapshots/trash are split into bounded D1 chunks. No new R2 resource, binding or credential is needed for this implementation. D1’s documented string/row bound is 2,000,000 bytes; chunk tests enforce that bound. Batch transaction and limit details were checked against the [official D1 limits](https://developers.cloudflare.com/d1/platform/limits/) and [D1 batch documentation](https://developers.cloudflare.com/d1/worker-api/d1-database/).
- Existing manual snapshot limit remains 1 MiB. After v2 sync initialization, legacy PUT/DELETE snapshot clients are rejected with SYNC_UPGRADE. Same-epoch older local writes are also fenced before automatic upload.

Daily maintenance reuses the existing scheduled handler to expire private backups/trash/receipts; recovery reads enforce expiry immediately. Cleanup can add a maintenance interval to physical deletion. Existing disclosure documents now describe actual data scope, account caches, recovery retention and device revocation. This was a factual implementation update, not a new legal compliance review.

## API contract

All routes are under `/api/sync`, authenticated to the existing account. Existing same-origin, HTTPS, CSRF, private/no-store/noindex responses apply. Resource IDs are scoped to the requester; no public backup object or bearer download link is created.

| Route | Action |
| --- | --- |
| GET /state?since=&generation= | Current protocol, account ID, head version/generation and incremental changes; generation mismatch returns a full reset view |
| POST /enable | Explicit `confirm:true`; one-time validated migration of an existing manual cloud snapshot |
| POST /mutations | Durable `id`, `generation`, `version`, and record changes; CAS, fingerprinted receipt and atomic bounded writes |
| GET /backups | Unexpired private version metadata |
| GET /backups/:id | Validated, checksum-verified records for preview/download |
| POST /backups | Explicit manual cloud backup |
| POST /restore | Reviewed version/generation, `confirm:RESTORE`, full records or explicit clear; protective backup and new generation |
| GET /deleted; GET /deleted/item?key= | Private recently deleted metadata and linked recovery bundle |
| GET /devices | Opaque browser IDs, names, last seen and current flag |
| PATCH /devices/:id | User-chosen name, up to 60 characters |
| DELETE /devices/:id | Revoke another owned session; current session uses Sign out |

Errors include NO_AUTH/401, ORIGIN or CSRF/403, NOT_FOUND/404, CONFLICT or GENERATION/409, SYNC_LIMIT, malformed input, RATE_LIMIT/429 and UNAVAILABLE/503. A failure never labels a local save as an acknowledged upload. Pending changes, held edits and conflicts warn before leaving/sign-out. No private payloads or credentials are written to application logs.

## Verification and preview

Preview: <http://127.0.0.1:4298/__test/sync-preview>. This is a localhost-only fixture with synthetic accounts, 2 example tasks and 0 invented study minutes. The owner preview account is separate from the API QA account. Open it, enter the study center, then explicitly enable sync. No real Google sign-in or production account is involved.

- Full existing + new suite: **565 tests passed**. Twenty new tests cover the actual shared exchange engine, two-device edits, durable/atomic outbox, rollback, field conflicts, deletion, lost acknowledgements, concurrent duplicate requests, generation fences, old clients, linked preparation recovery, stale local previews, 9,000-session backups, bounded batching, stable session IDs/no community credit, private access, session revocation, clearing and scheduled expiry/account deletion.
- Local Wrangler/Workerd with a fresh synthetic D1: all 13 migrations applied, including additive `0013_automatic_sync.sql`. **65 live local API checks passed**, including migration/enable, incremental write, replay, private backup retrieval, cross-account denial, restore generation and session metadata.
- Build: 56 routes + 404, preview noindex, PWA `2b7fbef6b5c52bba` / 62 precache resources. Existing nonfatal bundle-size/dynamic-import advisories remain.
- **62 local route/resource HTTP checks passed**, including robots, sitemap and licenses. Account initial HTML contains no authenticated synthetic identity.
- Seven specified text/background pairs calculated at >=7.42:1. This is a narrow contrast check, not full accessibility acceptance.
- A final targeted account/storage/sync run passed 40 tests. Temporary mode is labelled separately, and pending local-save intents block sync/recovery/account workspace switches.
- `git diff --check` passed. Protected Sites adapters, dependencies/lockfile, real credentials, DNS, paid plans, Stripe, community time accounting and real production databases were not changed.

Evidence is ignored under `docs/development/evidence/auto-sync-2026-11-18/`: build/tests logs, Workerd checks, contrast calculation, local D1/runtime state. Existing generic HTTP checker also writes `docs/development/evidence/v2/http-checks.json`.

## Pending acceptance and release sequence

The in-app browser open request returned queued, but no usable browser-control/capture interface is exposed. No desktop/phone geometry, click/focus, real download, Google callback return, physical multi-device/offline/sleep behavior or new screenshots are claimed. No Chrome, standalone Playwright or OS capture substitute was used. `design-qa.md` remains blocked pending actual in-app browser acceptance.

Before release: verify the real desktop/mobile enable/merge/conflict/preview/restore/revoke flows; back up production D1; apply migration 0013 to the intended database; deploy matching frontend and Worker; verify the actual account-scoped sync flows and retention job. Never deploy fixture Workers or synthetic secrets. This task did not authorize a new production deployment. Preserve the independent real-community/main-promotion gate.

Operational scaling remains to be measured with real usage. D1 count/byte bounds are explicit; later migration of historical chunks to a private R2 adapter can be evaluated without changing the user workflow. This release does not promise background delivery when the app is closed or cross-device timer handoff.
