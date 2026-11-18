# V2.31.1 — Clear subjects and daily learning records

Published at https://studytimely.com/study-tracker on 18 November 2026. This supersedes the records-usability local-only handoff.

- Runtime source: `d0d86cbcac625fd0af3066b76364aa865a1a7221`, tree `d6779916381713e6bb0b869a43f10a9cb70e1a0a`, branch `v2-google-community`.
- Worker: `156a502d-d3a6-4073-876c-0a74738776cd`.
- Deployment: `0c180472-dc9d-4097-9729-3f8df4a8db19`, `2026-11-18T06:20:38.49648Z`, 100% traffic.
- PWA: `f8471b9220950373`, 62 resources.
- Source inventory: 326 files, SHA-256 `e65cc08107746ac7a8dcba435d6f8a9953c53260c6d8277115f36f872fdfabdb`.
- Artifact inventory: 142 files, SHA-256 `bb70101c5334cc5092a1c7cffb95559ab7c6af516a531ecd1254d09069951c83`.

## Published behavior

The related-tools caption is left aligned with readable table type. Subject choices now use configured labels and retained learning subjects across history, and show Unlabelled only when applicable. Add subject opens a local validated form for future session labels, preserving old records and not starting a timer. Example data cannot save subjects.

First-use, date-range and filtered empty states have distinct explanations and working recovery actions. View all history opens a Records-only multi-year view rather than limiting recovery to the current year. Charts, goals and review analysis retain the existing 366-day limit. CSV exports all matched sessions from the latest local snapshot.

Records are grouped by report-zone calendar date with full daily totals, tasks, recorded windows, mode, counted duration and existing detail/deletion controls. Midnight sessions retain their original identity while contributing only their intervals on each date. Pauses, DST offsets and partial daily rows are explicit. Initially 100 daily entries load; Show more records loads further batches. A partial day discloses loaded versus matched entries while retaining its complete total. The narrow-screen layout stacks records and shortens date labels.

The Records toolbar hides previous-period comparison; its comparison sentence, empty average caption and duplicate backup action are removed. One footer backup action remains. The independent 52-week calendar is labelled clearly and does not generate an empty grid for a wholly empty history. Detailed guide content and ten complete FAQs remain in initial HTML.

## Release checks

All 455 release-mode regression tests passed, including the 12 records model/component-render checks. Coverage includes multi-year recovery, subject availability, deletion markers, original record identity, filtered CSV, midnight/pauses, 23/25-hour dates, half-hour zones, pagination totals and UTC offsets. The release build generated 56 routes plus 404. Deployment dry-run and 62 candidate HTTP checks passed.

After publication, 62 public page/resource, robots, Sitemap, canonical and redirect checks passed. All 136 non-MP3 public resource hashes matched the final manifest, including 56 navigation pages, updated record/subject client styles and guide content. New bundle controls, guide instructions, anonymous analytics preview, no-store/noindex headers, real configured Google provider metadata, public room API, private-query guards and fixture 404 responses were verified. Licensed music files were unchanged from earlier acceptance.

The exact current V2.31.0 runtime and all twelve binding definitions were checked before release, then every existing binding and script runtime setting was read back unchanged. Review remains disabled, provider Cloudflare, configured daily budget 5000, no AI binding or inference call. No database migration, account/community mutation, API/storage format, dependency, protected adapter, billing, tracking, DNS, secret rotation or new OAuth authorization was required. Existing twelve D1 migrations remain in place.

Two Git HTTPS attempts timed out. The existing Git credential helper and official GitHub API then synchronized the exact 11-file runtime commit with matching tree/commit hashes, guarded parent checks and a non-forced branch update. No credentials were printed or stored in source/evidence. Later documentation-only commits do not imply another deployment.

In-app browser controls were unavailable; no local Chrome/native substitute was used. Genuine server-rendering and model checks do not establish actual production click/focus/scroll/mobile-layout or CSV-download acceptance, which remains unverified. The independent real two-person community/moderation acceptance and main-promotion gates remain pending.

## Recovery and evidence

Rollback target: matched V2.31.0 Worker `6b31ee3f-0983-423a-b75d-4c5bc30f95a4`. It retains the previously shipped room expiry/seat restrictions. No database rollback or history rewrite is required for this frontend revision; keep schema and saved data. Do not roll back to pre-V2.31 runtimes that lack those access gates merely to revert this presentation change.

Ignored evidence: `docs/development/evidence/records-usability-release-2026-11-18/` contains build/tests, source paths and manifest, before/after runtime metadata, deployment logs, candidate/public HTTP reports, exact public resource hashes and guarded GitHub synchronization evidence. The preceding local records handoff describes the data rules and verification limits in more detail.
