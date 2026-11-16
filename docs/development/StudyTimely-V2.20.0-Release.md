# StudyTimely V2.20.0 production release

Published on 16 November 2026 at <https://studytimely.com/syllabus-tracker>. This supersedes the local-only syllabus delivery. Local interaction and responsive evidence is recorded in StudyTimely-Syllabus-Local-2026-11-16.md.

## Published behavior

The dedicated syllabus workspace supports explicitly saved personal outlines, previews of the seven existing starters, a labelled nonpersistent example, reviewed plain-text imports, editable hierarchy and titles, duplicate hints, excluded entries, and atomic capacity/stale/orphan validation. Users can group topics by subject, collapse chapters, search, filter uncovered/review topics, mark coverage independently of review flags, and select a next topic.

The next-topic rule is visible and deterministic: personal selection, due uncovered topic, review flag, recent uncovered learning, then outline order. Completing a selected topic with no review flag clears that selection. Parent study time and fallback target dates roll up from/to children while overall learning records are counted once. Existing Study/Focus/Pomodoro targets keep their IDs and actual saved time; completing a timer does not automatically complete a topic. The returning workspace offers optional coverage/review actions for its latest linked record.

Personal copies reset IDs, dates, coverage and review flags. Per-tab view state survives navigation and reload. Backup & restore opens the existing Data panel. Mobile removes repeated heading actions and retains them in Syllabus options; native import dialog buttons remain inside the viewport. Anonymous local use remains available; account sync remains optional and manual.

Initial HTML contains approximately 2,743 English guide words, detailed steps and worked arithmetic, ten complete FAQ answers, updated metadata, canonical, WebApplication and BreadcrumbList. Templates remain editable starters with existing source/scope/check-date notes, not complete official specifications. Tool and guide boundaries align, with 18px desktop and 16px phone reading styles.

## Exact runtime

- Repository/branch: <https://github.com/AImilesChen/studytimely/tree/v2-google-community>. Main was not promoted.
- Runtime commit: `e4dcaeb37c1ef8d734fa86dc7eb9e76d4e6e53eb`.
- Git tree: `0e92083b3ff5c4c1c2e7af7696eeaf2289db774a`.
- Worker version: `ee56f390-8162-436d-8f03-1dde52ec1993`.
- Deployment: `dd541f01-36c3-4e46-91a8-76549b3a227d`, created `2026-11-16T09:46:31.455579Z`, read back serving 100%.
- PWA: `488c577e4685626b`, 62 precache resources.
- Source inventory SHA-256: `73c2030e83a2725b7f72315c258fb82271ed4520d798c08282404d3b928124cf`.
- Artifact inventory SHA-256: `5c120576b6dcef9c03d45bbb972e759fbb74676278c7fa455fc92d19684603da`.

The existing-credential Git-data API helper synchronized the exact 18-file commit/tree with parent/head checks and no force. The GitHub connector independently read V2.20.0 from the release branch. The credential helper initially failed in restricted execution; the authorized elevated retry succeeded. Cloudflare deployment used --keep-vars; all nine binding names/types and the existing plain/D1/Durable Object definitions were compared before and after.

Cloudflare credentials had expired. Automatic in-app authorization-page access timed out repeatedly. The user completed the first device authorization, but saving the refreshed credential was denied by local configuration-directory permissions. After adjusting execution permissions, the user completed a second device authorization; CLI success and authenticated account reads were verified. The grant remained the same six previously approved permissions. OAuth/device codes and credential values were not added to Git.

## Verification and limits

- Fresh release build: 56 routes plus 404. All 281 release tests with STUDY_TEST_RELEASE=1, Wrangler dry-run and 62 candidate HTTP checks passed. The existing bundle-size advisory remains; no performance score is claimed.
- All 62 public HTTP checks passed for routes/assets, H1/canonical/indexability, redirects/404s, robots, Sitemap and licenses. All 125 public non-MP3 artifacts exactly matched the release inventory. The five unchanged licensed MP3 recordings were not downloaded again; existing build/license checks remain.
- All 56 initial pages retain the unified header and closed navigation disclosures. The new syllabus guide, ten FAQ answers, section anchors, application/breadcrumb metadata, existing Habit Tracker content and final PWA version were checked against actual public responses.
- Published Worker version and 100% deployment were read back through the authenticated Cloudflare API. Existing account, Google, email, room, moderator and support bindings remain present; no secret values were printed or changed.
- A fresh production in-app browser navigation timed out and reset its runtime. No production screenshot, live DOM interaction, syllabus creation, timer run, account sync or production deliverable-tab mark was completed. Do not substitute local populated screenshots for production evidence. Actual import/edit/coverage/review/filter/copy/26-second linked save/keyboard/backup and six-size layout acceptance remain the prior local evidence.
- Real authenticated cross-device sync, production populated-state interactions, external moderation/community, analytics backend collection, physical audio/sleep, offline PWA updates and complete accessibility compliance were not exercised by this publication.

Ignored evidence: docs/development/evidence/syllabus-release-2026-11-16/ contains build/tests/preflight/deploy logs, manifest, Git synchronization report, candidate/public verification, 125-file hash report, deployment/binding readbacks and runtime summary. Raw authorization/runtime records remain ignored. Later documentation commits do not imply another runtime deployment.

## Compatibility and recovery

Optional plan syllabusVersion:2/nextChapterId and chapter needsReview fields survive the shared validator, local repository, backups and merge. Legacy completion flags, IDs and learning links are retained. The authenticated workspace PUT extends UPDATE_REQUIRED protection to reject an older snapshot that would strip versioned syllabus metadata. Unknown future formats fail explicitly. No new API endpoint, D1 migration or storage schema-version change was introduced.

Deploy frontend and Worker together. Update all open tabs/devices and retain a backup before editing, manually syncing or downgrading. The previous V2.19.0 Worker `4135d4d5-b3e8-40dd-b5db-c3b9d7f23c23` is the rollback point. No automatic database restoration is required, but that version lacks the new syllabus stripping guard and older clients can lose the new local fields. Preserve a newer-format backup and avoid old-version syllabus edits/sync. Finish active learning before accepting an application update.

No dependency, OAuth implementation, secret values, paid resources, DNS/custom-domain definitions, legal terms, tracking configuration or protected Sites adapters changed. Existing external-review configuration and the independent authenticated community/main-promotion acceptance gates remain unchanged.
