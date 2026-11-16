# Syllabus Tracker local delivery — 16 November 2026

Status: implemented and verified locally; not committed, pushed or deployed in this task. Production remains unchanged by this work. Package version remains 2.19.0.

Clean preview: http://127.0.0.1:4268/syllabus-tracker (noindex). Its in-app browser tab is retained at 1280 × 720, scroll zero, no dialog and no saved syllabus or learning activity. QA used the separate origin on port 4267: two explicitly named synthetic outlines and one saved 26-second Biology session. No production, account, community or cloud data was mutated.

## Delivered behavior

- Dedicated SyllabusPage replaces the old syllabus-only interface. Exam Countdown keeps its existing presentation and shares the validated plan records.
- First-use screen offers personal creation, seven existing editable starters and a clearly labelled, nonpersistent biology example. Using the example requires explicit creation and resets sample progress.
- Plain-text import supports chapters/subtopics, bullets, numbered prefixes, tabs, indentation warnings, editable names/parents, duplicate-name hints, inclusion controls and paginated previews. Import is atomic, keeps existing IDs/progress and rejects orphaned children, stale previews and capacity violations. A skipped parent remains visibly labelled excluded in its child selector.
- Full-width selected outline, subject grouping, collapsible chapters, search, subject/status filters, and compact secondary menus. Mobile removes duplicated creation actions from the heading; they remain in Syllabus options.
- Leaf-based coverage remains independent of the new needsReview flag and saved learning. Chapter time rolls up direct/child sessions without adding duplicate history. Chapter target dates apply to undated children; explicit child dates take precedence.
- Next topic order: explicit selection, due uncovered topic, review flag, latest studied uncovered topic, outline order. Completing a selected topic with no remaining review flag clears the selection. No mastery inference, AI scheduler or automatic completion.
- Existing Study/Focus/Pomodoro start and unfinished-timer protection retained. Last saved session offers optional coverage/review actions on return. Per-tab selected outline, query, filters, expanded chapters and timer choice survive navigation/reload through session storage.
- Copying personal outlines resets IDs, dates, coverage and review flags. Existing source links/check dates are retained without claiming templates are complete official syllabuses or reverified this turn.
- Backup/restore opens the existing Data panel. Anonymous local use and manual optional account sync are preserved.

## Data and deployment contract

New optional plan fields: syllabusVersion:2 and nextChapterId. New chapter field: needsReview (legacy default false). Existing IDs, done flags and learning links are retained. Shared validation, merge, repository reload and JSON backups preserve the new metadata. Unknown future syllabus formats fail explicitly.

The authenticated workspace PUT now extends the existing UPDATE_REQUIRED guard to reject an older client snapshot that would strip versioned syllabus metadata. No new endpoint, D1 migration, dependency, secret, OAuth, binding, resource, tracking or legal configuration was added. Four protected Sites adapters are unchanged.

Deploy the frontend and Worker together. Update all tabs/devices and export a backup before editing/syncing or rolling back. An older frontend/server can strip fields and lacks the new guard; a rollback is not an automatic restoration of prior data. The unchanged independent production-community/main-promotion gate still applies.

## Content and indexing

Initial HTML includes approximately 2,743 English guide words and ten fully answered FAQs: creation, practical topic sizing, worked 3/8 and 4/8 examples, coverage arithmetic, review decisions, dates, starter scope, related tools, storage and manual sync. One H1, updated title/description, canonical, WebApplication and BreadcrumbList were checked. Guide and tool share left/right boundaries, with 18px desktop and 16px phone reading text. No invented ratings or rich-result guarantees. Local robots and Sitemap remain nonindexable.

## Verification

- Build: 56 routes plus 404; final noindex PWA 2f7ce6425d53c99a, 62 resources. Existing large-chunk warning remains; no performance score is claimed.
- Regression: 281 tests passed before final presentation/error-message refinements. Final related suite: 33 passed, including real repository reload, backup validation, merge symmetry/legacy metadata preservation, cloud rejection with SQLite, import atomicity, linked learning and stale editor protection. One earlier editorial assertion was corrected to match the actual equivalent guide wording; no behavior change was required for that failure.
- Final HTTP verification: 62 route/asset checks plus robots, Sitemap and licenses; git diff --check passed.
- In-app browser: actual import/preview/duplicate skip/nesting warning/save; checkbox coverage plus independent review; review/subject/search/no-result filters; selected next topic; saved 26-second linked Study session and parent roll-up without automatic coverage; optional mark-covered; template source/scope/expanded outline/Cancel/Escape focus restoration; fresh personal copy with reset progress; multi-subject append; orphan error/recovery/Cancel; nonpersistent example; FAQ keyboard expansion and Data entry observed.
- Final actual viewport checks: 1440×900, 1280×720, 768×1024, 390×844, 320×740 and 900×500. No body horizontal overflow; board/guide edges align. Phone 390, narrow 320 and short landscape 900×500 import buttons fit inside the native dialog after sticky-footer correction. Temporary QA tabs were closed. Final QA error/warning logs were empty.
- Captured final populated desktop, topic-list, phone, first-use and FAQ screenshots; desktop/phone/first-use images inspected. Populated images contain explicitly named local QA data, not production activity.

Ignored evidence: docs/development/evidence/syllabus-2026-11-16/ (build.txt, tests.txt, final-targeted-tests.txt, html-check.json, responsive.json, dialogs.json, browser-review.json and screenshots). Final layout evidence uses responsive.json/dialogs.json from the fresh final QA tab; an earlier viewport handle followed another tab and those mismatched requested-size observations were discarded.

## Limits

Real authenticated cross-device cloud sync, production behavior, physical audio/sleep, full accessibility audit, offline-update behavior and external analytics collection were not exercised in this task. Existing algorithms/server tests are not production acceptance. PDF extraction, school-platform integration, automatic scheduling, mastery predictions and Planner task conversion remain outside this release scope.
