# Exam Countdown — local implementation, 16 November 2026

The exam page now manages independent exam events and provides a next revision action. This is a local, uncommitted implementation on `v2-google-community`; no source push or production deployment was performed. Production and the package version remain V2.20.0. The existing production community acceptance and main-promotion gates are unchanged.

Clean preview: <http://127.0.0.1:4270/exam-countdown>. The retained in-app browser tab uses this origin, with no exams, syllabuses, sessions or open dialogs. QA used a separate local origin, port 4271; synthetic exams and an 18-second learning session never touched production or a cloud account. Local previews are noindex.

## Delivered behavior

- Sparse first-use screen, labelled nonpersistent example, and a short required form: exam name and date. Subject, syllabus, scope, exact time, time zone, location and notes are optional.
- Separate exam events support several papers against the same syllabus. A selected exam has a large calendar-day countdown and full date; exact times show their exam zone and remaining duration. Upcoming/Today/Past/Taken/Archived lists, search, subject filtering, editing, archive/restore, taken/not-taken and confirmed deletion are provided.
- Date-only labels follow the device's local calendar date. Exact-time labels follow the exam zone, and the remaining duration follows the resolved instant. A skipped DST time is rejected; a repeated time requires the first/second occurrence. Past means the scheduled date/start passed, not that the user attended or finished the exam.
- Whole-syllabus or selected chapter/topic scope uses shared current leaf coverage and review flags. A chapter includes its descendants, including later additions. Missing selected entries or a missing linked syllabus are disclosed. The next-topic recommendation is restricted to that scope, with the existing reason text.
- Start this topic uses the existing guarded Study/Focus/Pomodoro workflow. It preserves topic identity and records actual time; a timer does not automatically mark coverage or review. Planner and calculator links open their real tools without claiming automatic task creation.
- Calendar export produces an `.ics` download with CRLF, escaping, UTF-8 folding, a stable UID, and update timestamps. Date-only events use an all-day date and exclusive next-day end; exact events supply a UTC start, without inventing exam duration or alarms. Imported calendar copies require manual review/reimport after edits.
- The detailed English guide contains 2,999 words and 11 answered FAQs in initial HTML. It covers setup, calendar days, exact-time rules, multiple papers, syllabus scope, revision steps, a worked study budget, calendar import and data management. The hypothetical example explicitly distinguishes 21 calendar days from 15 actual study days × 45 minutes = 675 minutes = 11h15m.
- Route-specific title/description, canonical, WebApplication and BreadcrumbList are included. No fabricated ratings or official exam timetable. Desktop reading text is 18px, mobile 16px; tool and guide outer edges align. The unified header Tools dropdown and other timer layouts are preserved.

## Data compatibility and release requirements

`workspace.examVersion: 1` and `workspace.exams` are additive local/backup/cloud-document fields. No D1 migration, new endpoint, dependency, binding, secret, OAuth, resource, DNS or tracking change was made. The four protected Sites adapters are unchanged.

Old active syllabus dates deterministically become `legacy:<plan-id>` events only when normalising an unversioned workspace. Repeated reload/validation does not duplicate them. A syllabus created with its optional exam date also creates a linked event. The legacy plan date is retained as a compatibility mirror for its migrated event, while ordinary paper events have independent dates. Syllabus editing now routes date management to Exam Countdown, and its date summary uses the next active linked exam.

Exam changes and tombstones survive repository reload, backup, import and merge. An older backup's derived exam cannot replace a modern edited/deleted exam simply because its old syllabus has a newer timestamp. Import and manual-sync merge retain raw format provenance for that decision. Existing sessions and topic IDs are retained. Deleting a syllabus keeps its exam date available with a missing-link warning; deleting an exam keeps its outline and saved sessions.

The existing authenticated workspace PUT rejects older clients that would strip the exam format or omit existing exam records, alongside the existing habit/syllabus guards. Release the frontend and Worker together. Refresh all clients and back up before editing/syncing or rolling back: an old frontend or Worker does not understand independent exams and may strip them. A workspace backup is not a live calendar subscription, and restoring it is a merge rather than an undo operation.

## Verification

- Final local build: 56 prerendered routes + 404; PWA `a4a9aa9cb68bc3f4`, 62 precache resources. Vite still reports the existing large-bundle advisory.
- 297 tests passed after the final runtime changes. Added tests cover deterministic migration, separate papers, stale edits/deletions/status changes, missing scopes, parent/leaf coverage, old-backup import and sync, real IndexedDB reload, time zones and DST, calendar escaping/folding and timer accounting. Authenticated API tests verify an old upload is rejected while cloud records remain unchanged.
- 62 local HTTP/asset/robots/sitemap/license checks passed. Independent exam initial-HTML checks verify the guide, eleven answers, real destinations and both schema types.
- Actual in-app browser: created a standalone exam; saved exact time and Asia/Shanghai zone across reload; downloaded the calendar file and inspected its start; linked a two-topic chapter; started Cell structure, finished and observed its 18-second record in Study Tracker; created a second paper with whole-outline scope; searched, archived/restored and marked taken/not taken.
- Real viewport measurements: 1440×900, 1280×720, 768×1024, 390×844, 320×740, 900×500. No document horizontal overflow. Tool/guide edges match and reading text is 18px/16px. Save buttons are inside the native dialog and viewport at 390, 320 and 900×500. Escape restores focus. Example does not save sample data; Backup & restore reaches Settings → Data.
- Captured QA warning/error logs were empty. Browser download confirmation took unusually long to return; no calendar-import result is inferred from the successful download. Saved screenshots were visually inspected. Git diff check passed.

Ignored evidence: `docs/development/evidence/exam-2026-11-16/` contains `tests.txt`, `seo.json`, `responsive.json`, `browser-checks.json`, and desktop/mobile/guide screenshots. Shared HTTP evidence is under `docs/development/evidence/v2/http-checks.json`. QA fixture names and screenshots are explicitly synthetic.

Not verified: real authenticated cloud synchronization, third-party calendar import/update behavior, offline installation, comprehensive assistive-technology coverage, or production browser behavior. This implementation does not add push reminders, official timetable feeds, PDF extraction, automated revision scheduling or payment.

Engineering references: [iCalendar RFC 5545](https://www.rfc-editor.org/rfc/rfc5545) and [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat). Supported-zone calculations reuse the already licensed/pinned time-zone module; other zones/ranges fall back to host rules.
