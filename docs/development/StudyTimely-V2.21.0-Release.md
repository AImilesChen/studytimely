# StudyTimely V2.21.0 production release

Published on 16 November 2026 at <https://studytimely.com/exam-countdown>. This supersedes the local-only Exam Countdown handoff. The source is on the public [release branch](https://github.com/AImilesChen/studytimely/tree/v2-google-community); main was not promoted.

## Published behavior

Independent exam events support several papers linked to one syllabus, or a standalone name/date without any syllabus or account. Optional exact time, IANA zone, location and notes sit in expandable settings. Date-only entries use local calendar days; exact entries resolve the exam-zone start with explicit handling of repeated or skipped DST times. Past does not assume attendance. Upcoming/Today/Past/Taken/Archived lists, search, subject filtering, editing, archive/restore and deletion are included.

Whole-syllabus or selected chapter/topic scope displays shared current leaf coverage and review flags, warns about missing links and recommends a topic within the selected scope. Starting it uses the existing guarded Study/Focus/Pomodoro workflow and actual session accounting. Marking coverage remains a user decision. The calendar export is an iCalendar file, not a live subscription or an exam alarm; date-only events are all-day, timed events provide the UTC start without an invented duration.

The sparse first screen, labelled unsaved example and native form use the existing Graphite style and unified navigation. Tool and guide outer edges align, with 18px desktop and 16px mobile reading text. Initial HTML contains 2,999 English guide words, 11 complete FAQ answers, worked revision arithmetic, date/time-zone rules, calendar instructions, metadata, canonical, WebApplication and BreadcrumbList. No official timetable or readiness guarantee is implied.

## Exact runtime and checks

- Runtime commit: `70d9f7ba996574f579e9d67cf72967b23962c7a8`; tree: `ea94b00d2e27a3139c7fd490f3ae38a6263469c4`.
- Worker version: `4b55c34c-c10d-41ac-b67c-bc17831f1b67`.
- Deployment: `d995f2c6-38f1-4a99-8fa0-b2a3a069cd15`, created `2026-11-16T11:56:14.618972Z`, read back serving 100%.
- PWA: `b5f46501778b7a7b`, 62 precache resources.
- Source inventory SHA-256: `6d433f634445610ff69f38fe9579992b5dc556b53011348222f059763ab32aff`.
- Artifact inventory SHA-256: `83ed76fab0f93aa5dfe825559f422668d2898de76fa17e10d71bbdd4373a1987`.
- Release build: 56 pages plus 404; 297 release tests with `STUDY_TEST_RELEASE=1`; Wrangler dry-run; 62 candidate and 62 public HTTP checks passed. The existing bundle-size advisory remains.
- All 125 public non-MP3 files exactly matched the release manifest. All 56 pages retain the unified header and closed disclosures. Exam guide sections, eleven answers, schema, canonical, indexability and PWA were checked in real public responses. Unchanged licensed MP3 files were not downloaded again.
- The exact 21-file commit/tree was synchronized to GitHub with parent/head checks and no force. The GitHub connector independently read package version 2.21.0 on the release branch.
- Existing Cloudflare authorization worked without a new grant. Deployment used `--keep-vars`; all nine binding names/types and the plain/D1/Durable Object definitions were compared before/after. No secret values were changed or published.

Ignored evidence: `docs/development/evidence/exam-release-2026-11-16/` contains release build/test/preflight/deploy logs, manifest, source synchronization, HTTP/125-file verification and sanitized runtime summary. Raw runtime records remain ignored; do not publish them. Later documentation-only commits do not imply another runtime deployment.

## Data compatibility and recovery

The additive `workspace.examVersion:1` and `workspace.exams` fields retain event IDs, scope, metadata, status and tombstones through the shared validator, repository, backup/import and manual-sync merge. Legacy syllabus dates seed deterministic linked events once. Syllabus summaries now use the next active linked event; date editing routes to Exam Countdown. An older backup cannot regress a modern exam merely because its old plan timestamp is newer. Existing learning records remain intact.

The authenticated workspace PUT extends `UPDATE_REQUIRED` protection against uploads that strip the exam format or omit existing exam records. Frontend and Worker were released together. Update all tabs/devices and keep a backup before editing, syncing or downgrading. Finish active learning before accepting an application update.

Previous V2.20.0 Worker `ee56f390-8162-436d-8f03-1dde52ec1993` is the rollback point. No D1 migration or automatic database restoration is required, but that older build does not preserve independent exam events or include their stripping guard. Retain a newer-format backup and avoid old-version edits/sync if rolling back. Calendar imports remain separate and require manual review after date changes.

No new endpoint, dependency, D1 migration, OAuth implementation, secret value, resource, DNS/custom-domain configuration, legal text, tracking setup or protected Sites adapter changed. The independent production-community acceptance and main-promotion gates remain pending.

## Browser evidence and remaining limits

Fresh production in-app navigation timed out/reset. Inventory showed the opened exam URL and updated title, but rebinding the same tab also timed out. No production screenshot, live DOM interaction, responsive measurement, exam save or deliverable-tab mark was completed. Do not substitute local screenshots for production evidence. No native computer or external browser was used to bypass this limitation.

Actual local browser acceptance remains in `StudyTimely-Exam-Countdown-Local-2026-11-16.md`: create/edit/time-zone/reload, selected 2-topic versus whole 3-topic scope, 18-second topic-linked session saved in Study Tracker, second paper, search, archive/restore, taken/not-taken, calendar download, example, Data entry and Escape. Six actual viewport sizes had no document overflow, and narrow/landscape form buttons remained visible. Calendar bytes were inspected, but third-party import/update behavior was not tested.

Real authenticated cross-device sync, production populated-state interaction, offline installation, full accessibility coverage, analytics backend collection and external community/moderation acceptance were not exercised by this release.
