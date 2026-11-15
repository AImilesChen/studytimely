# StudyTimely V2.11.0 production release

Published on 2026-11-15 at <https://studytimely.com/study-schedule-maker>. This supersedes the preceding Schedule local-only status. Detailed local functional/responsive acceptance is in `StudyTimely-Schedule-Local-2026-11-15.md`.

## Published behavior

The page now supports an editable repeating weekly timetable, full week list, phone weekday view, Study/Break/Fixed commitment types, separate planned totals, atomic multi-day creation, named overlap rejection, copying/moving blocks, midnight boundaries, unsaved example drafts, timer preparation, full-week text copying and printable preview. The guide has 3,218 English words, seven setup steps, a worked evening/weekly example and ten answered FAQs. Title, description, H1, canonical and WebApplication/BreadcrumbList describe the actual tool.

Planned blocks never create study history or ranking credit. Preparing a timer does not start it and preserves existing unfinished-session guards. All blocks are repeating weekday rules, not separate calendar appointments; there are no single-week exceptions or automatic reminders.

## Exact source and runtime

- Repository/branch: <https://github.com/AImilesChen/studytimely/tree/v2-google-community>. No main promotion.
- Runtime source: `404d00c56a962b3f8576729cf7e2a902281de930`.
- Git tree: `16f8ae1d39f0b2153896fa64da5fb7af0d20c6db`.
- Worker version: `109072e0-a82e-4f22-b77f-9f92a6c7c389`.
- Deployment: `91675841-9b02-419f-b369-acd33eb5c1e7`, created `2026-11-15T08:41:08.905052Z`, read back serving 100%.
- PWA: `5db331dd4d92d15a`, 61 precache resources.
- Artifact inventory SHA-256: `8d2caf47c19125c4ed39e41cd6b518df2785bcd9baaf4c4eeb5482ce61c0a982`.

Native Git push failed three times with network connection/reset errors. The GitHub connector could read but returned 403 for tree creation. Existing local Git credentials were then reused in memory with the official GitHub Git data API. The uploader matched the complete tree, author/committer metadata and original commit SHA before advancing the existing branch without force. The GitHub connector independently read back the exact commit/tree. No credential value was printed, written to evidence, committed or sent outside GitHub. No permission grant or branch protection change occurred.

Cloudflare reused existing authentication with `--keep-vars`. All nine binding names/types match before/after. No new dependency, API endpoint, D1 migration, secret, OAuth, hosting resource, tracking configuration or protected adapter change. Shared workspace JSON validation was extended for optional block kinds, and frontend/Worker were rebuilt and released together. Later documentation commits do not imply a new runtime deployment.

## Verification

- Release build: 55 pages plus 404. All **184 tests** passed with `STUDY_TEST_RELEASE=1`.
- Wrangler preflight, **61 candidate and 61 public HTTP checks** passed, covering routes, canonical/indexing, robots, sitemap, assets and licenses. No new route or sitemap membership.
- **124 public non-MP3 artifacts** match exact local SHA-256 hashes. The five unchanged licensed MP3s passed existing local build/license checks and were not downloaded again. The public 3,218-word guide, ten FAQs, expected section IDs/schema and PWA version passed verification; no QA content in the public initial HTML.
- Actual production in-app browser DOM showed the new header, overview, controls, example entry and full guide. Desktop geometry at1280px had document client/scroll widths1265px, and board/guide edges50.59375/1214.40625. The browser read `index,follow`, the correct canonical/title and deployed `/assets/index-C7MFgZRJ.js`.
- `production-desktop.jpg` was saved from the production browser and separately inspected. A later example/draft-flow call timed out and reset the browser session. Production draft completion, phone, print, copy, console-log and persistent-tab marking were not verified. No viewport override was set in this production run; the preceding local run reset its override.
- No Save, timer start, sync, profile, room, message or ranking mutation was attempted in production. The timed-out call may have opened an unsaved example draft. Local save/conflict/copy/timer/phone paths have the separate local evidence; they are not production interaction proof.

Ignored evidence: `docs/development/evidence/schedule-release-2026-11-15/` contains build/tests/preflight/deploy logs, before/after versions, runtime status, artifact manifest/hash report, HTTP report, production desktop screenshot and exact GitHub API sync/readback details. Native printer/PDF output and authenticated cloud sync remain unverified in this iteration. Search/analytics backends were not reverified.

## Compatibility and recovery

Existing blocks without `kind` are interpreted as Study. Updated validators/backups/merge paths preserve new Break and Fixed commitment classifications. Older app versions may discard these new classifications when saving/syncing, so update each device after finishing active work and keep a current workspace backup before cross-device synchronization. No forced PWA update or production workspace migration was performed.

Rollback Worker: `d0ef1bfa-912b-4647-9824-41d6c02968ea` (V2.10.0). No D1 restoration is required for a code rollback. However, old code does not understand new block types: back up affected workspaces first and avoid editing/syncing typed routines with the old client. An older client can retain activity names/times while losing the distinction between study, breaks and commitments. Restore a compatible backup with an updated app if needed; do not restore the whole production database for this frontend/shared-validation release.

Existing external community-review configuration, authenticated community acceptance and main-promotion gates remain independent and unchanged.
