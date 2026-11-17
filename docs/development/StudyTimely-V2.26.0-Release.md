# StudyTimely V2.26.0 — Group study activities

Published at https://studytimely.com/study-groups on 17 November 2026. The user authorized publication, then explicitly approved adding Cloudflare D1 read/write permission. Azure setup remains deferred by the user.

## Published behavior

Room owners can set a preset subject and pinned study notice, schedule/edit/copy/cancel activities and start/end an activity. Appointments include an IANA time zone, focus and break durations. Members explicitly join an activity, keep a private personal task, run their own room timer and check out with an outcome and optional private note. Starting an activity never starts members' timers. The summary reports actual starts, credited seconds and outcomes; a downloaded summary includes shared participation fields plus only the requesting member's private task/note. Activity time reuses the existing room-credit ledger and does not add a second leaderboard or personal-browser credit.

Invitations preserve the selected activity and join confirmation precedes private content loading. Room names replace the public marketing hero inside a room. Existing free limits remain three open rooms, ten memberships and capacity up to 24. Age/profile confirmation, ranking opt-in, Google login and manual workspace sync are unchanged. Activity records are retained for 90 days after the later scheduled/actual date; future appointments survive creation-date cleanup.

Standard titles and notices work without Azure. Free-text chat and custom public titles remain unavailable when automatic review is not configured. There is no payment integration. The public guide and active privacy/terms describe the new data flow; policy last-updated date is 2026-11-17.

## Source and deployment

- Repository: https://github.com/AImilesChen/studytimely/tree/v2-google-community
- Runtime commit: 958c38e15ac0083bee9b19c4a6dc3b7952c742c8
- Runtime tree: 511a25c7927db3a8168a15c1d61106715a7ff9df
- Worker: 485060ef-801f-4528-8f5b-469bba911aee
- Deployment: e489e23a-9193-4c94-b970-4c44e9f26271 at 2026-11-17T05:57:29.774292Z, 100%.
- PWA: 070a03e8a4358fe7, 62 resources.
- Source inventory: 259 files, SHA-256 d08544494419902b34e99113b968ca48fbdcc4e4a8ac79c90a95c2453cd6fb8e.
- Artifact inventory: 134 files, SHA-256 6ea96d235f229840b92c19a8af24513e8ec9d8b3ca3f3ec9690b4984763ace8b.
- Incremental migration: 0006_group_activities.sql, SHA-256 3888765f0352d90764e65824bf2d76668df02b6e9e52d34eaa3fe2f4c25b0500.

The release inventory now includes migration files. All nine Cloudflare binding names/types and existing plain-text, D1 and Durable Object definitions were preserved. No DNS, paid resource, dependency, secret rotation, tracking configuration or protected Sites adapter changed. Production used wrangler.jsonc, never the isolated fixture. Later documentation commits do not imply another runtime deployment.

## Database and authorization

Initial D1 read-only preflight returned 403; a read-only scope diagnostic confirmed the existing official CLI grant lacked D1. The user approved D1 access. The installed cf client rejected the requested scope set before consent; official Wrangler accepted the exact existing permissions plus D1 and offline renewal. The in-app browser timed out repeatedly, so the user completed the fresh device authorization manually; the CLI then confirmed success. No credentials were printed or committed.

Before mutation, the correct production binding/database and migrations 0001–0005 were checked; schema, aggregate existing row counts and a Time Travel recovery bookmark were recorded in ignored private evidence. A first compound-SELECT aggregate exceeded a D1 limit and was replaced by scalar subqueries; this was a read-only verifier correction. Only 0006 was applied. Readback verified all six migrations, added columns/tables/index/triggers, unchanged existing row counts, empty activity tables before new runtime deployment and no foreign-key violations. No reset, seed or restore was performed.

## Verification

Final release build: 56 routes plus 404, all 330 tests, 62 candidate HTTP/SEO/resource checks and Cloudflare deployment dry-run passed. The local handoff records six actual Worker/D1/Durable Object integration groups, two isolated synthetic browser users, 26 combined verified seconds with two check-outs, private-field isolation and summary download, invitation/edit/copy/cancel/refresh behavior, and 1440/768/390/320 layouts without overflow. The fixture-only Chinese preview entry was included in regression checks but is unavailable on production.

Public checks passed: 62 route/asset checks, robots/Sitemap/licenses, 128 exact non-MP3 artifact hashes, all 56 global navigation pages and expected PWA version. Public room listing responds normally; a nonexistent private activity collection returns 404 with no-store/noindex. Room/invite/activity query variants are noindex. Both tested fixture routes return 404. Anonymous auth reports Google configured without a user; personal ranking remains 401. Existing public ranking period APIs passed. The published group guide and privacy page contain activity data-flow text and current policy update date.

The production in-app browser could not complete this turn: authorization actions, an existing-tab read and a fresh production-tab open each timed out and reset the bridge. No production screenshot, console, signed-in activity workflow or new real Google two-person test is claimed. The successful production evidence is API/HTTP/artifact/database readback; visual and two-person workflow evidence is local before release. Existing independent production room/chat/moderation and main-promotion gates remain pending.

Ignored release evidence: docs/development/evidence/group-activities-release-2026-11-17/. Local visual/integration evidence: docs/development/evidence/group-activities-2026-11-17/. No real room, profile, ranking opt-in or study-credit mutation was created for publication checks.

## Recovery and later work

Code rollback target is previous V2.25.0 Worker acd628ee-c875-40ee-8ea1-32cb6251e10f. Retain additive schema 0006 on code rollback. Before running old code, review and pause activity-linked timers and active activities so an older Worker cannot credit them beyond the new activity bounds. A full Time Travel restore overwrites later data and requires a separate incident decision; do not restore blindly. The pre-migration bookmark is private ignored evidence.

Azure review, real production two-person acceptance, repeating activities, multiple administrators, reminders, advanced reports, optional automatic sync and payment remain future work. This release completes the implemented first-stage activity feature, not every future PRD feature or independent acceptance gate.
