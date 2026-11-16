# Study Habit Tracker — local implementation

Implemented on 2026-11-16. This work is local, uncommitted, and not pushed or deployed. Production remains V2.18.0; the package version is unchanged. No main promotion was performed.

Clean delivery preview: http://127.0.0.1:4263/study-habit-tracker

The isolated interaction-test origin is http://127.0.0.1:4262. It contains three explicitly named QA habits and one synthetic, early-ended 112-second Maths record. Those records are not production data and are not included in the delivery preview or build. No cloud upload was performed.

## Delivered behavior

- Dedicated, aligned responsive page with one primary Add habit action, three editable starter drafts, compact overview, Today/All views and actionable habit cards. Examples require an explicit Save and never add activity.
- Four measures: saved minutes, distinct local learning days, saved sessions and self-reported check-ins. Automatic goals accept all subjects, unlabelled study or one named subject. Existing unscoped habits remain explicitly all-subject.
- Daily targets, Monday–Sunday weekly totals, planned rest days, current/best runs and recent completion fractions. Pending current periods are excluded from missed-period fractions. A weekly achievement never marks future calendar dates complete.
- Monthly calendar with date details, source labels, manual correction/undo for eligible dates and a text-list alternative. No check-in before the habit started or on a future date. Automatic dates require saved evidence.
- Dated rule history preserves earlier targets, planned days, measure and scope. Weekly changes take effect on Mondays. Editing on the same effective date replaces that date’s rule; choosing another effective date adds a rule and retains existing scheduled dates. Switching period starts a new current run; this is not a frozen completion ledger, since deleting underlying evidence can change past results.
- Study/Focus/Pomodoro preparation applies the matching subject and waits for explicit Start. It does not create a task, session or ranking credit. Existing unfinished timers block replacement atomically. Manual habits cannot prepare automatic learning.
- Optional overall weekly goal, local backup/account-sync entry points and real milestones. Manual check-ins never manufacture learning minutes. Local/free usage and existing manual-sync choice remain.

## SEO and layout

The initial HTML contains approximately 2,644 English guide words and ten fully answered FAQs. Content covers setup, choosing a measure, daily and weekly worked examples, evidence accounting, rest and rule changes, reading history, related tools, missing-progress diagnosis and backup/recovery. It does not promise a fixed habit-formation period or guaranteed learning outcomes.

Updated title, description, H1, canonical route, free WebApplication and BreadcrumbList metadata are included. Native FAQ disclosures and guide anchors work without invented ratings. The guide shares the board’s outer alignment, with readable line lengths, 18px desktop/16px phone prose and separate worked-example cards. Existing navigation remains unified.

Final local noindex build: 56 routes plus 404; PWA `a53e0037619766cb`, 62 precache resources. A release build and production acceptance are still required for a later publication. GSC, Bing and analytics collection were not reverified or modified by this task.

## Data and compatibility

The shared validator preserves optional habit `scope`, `planVersion: 2` and dated `policies`; the new `days` measure is included in backups/reloads/merges. Minute evidence is split by local intervals, distinct days need saved learning, and one session counts on its ending date. Display uses the current device’s local calendar.

The existing authenticated workspace PUT endpoint adds an `UPDATE_REQUIRED` safety check when an older snapshot would strip a stored modern habit’s rule history. Authentication, CSRF and optimistic concurrency remain in force. Explicit cloud clearing still uses the existing separate action. No new endpoint, D1 migration, permission or external integration was added.

Older clients/builds do not understand all new habit fields/measures. Back up and update every device before editing or manually syncing these habits. Deploy frontend and Worker together. A rollback to V2.18.0 may reject or strip new habit data; retaining a new-format backup is necessary. The server safety check cannot protect local edits made by an older frontend or an older rolled-back server.

## Verification

- 268 regression tests passed. After the final guide wording change, 25 targeted model/page/account tests passed again.
- 62 HTTP route/resource checks, robots, Sitemap and licenses passed against the final noindex build. `git diff --check` passed.
- Pure/repository tests cover legacy interpretation, scope filtering, days versus sessions, weekly/future separation, rest-aware runs, dated changes, Monday enforcement, stale editors, manual correction/undo, calendar boundaries, midnight accounting, atomic timer preparation, merge/history preservation and real IndexedDB reload/backup. The SQL-backed account test confirms old snapshots cannot erase modern cloud history and valid snapshots still sync.
- Actual in-app browser verified starter drafts, missing-name error, cancel without save, three goal types, subject creation, check-in/undo, refresh persistence, future effective-date preview/save, weekly overview goal, date details, text calendar and keyboard FAQ. A synthetic 112-second early-ended Maths record advanced minutes and one weekly learning day; future dates stayed neutral.
- Real UI observed ready 5-minute Focus preparation and blocked replacement of an unfinished timer. The synthetic session ended; the delivery origin contains no habit/session/timer data.
- Desktop 1280, tablet 768, phone 390 and narrow phone 320 had no horizontal body overflow. Phone modal Save/Cancel stayed available. Final board/guide edges align, console warning/error logs were empty, viewport override was reset and the clean preview tab was marked deliverable.

Ignored evidence: `docs/development/evidence/habits-2026-11-16/`. Final inspected image is `desktop-final.jpg`; `desktop-history.jpg` shows isolated QA data. Earlier UI evidence can precede minor wording/plural refinements. Build, regression, final targeted and HTTP logs are included. The native date field now handles both input and change events; actual future-date preview and save were observed after this correction.

Not exercised: real authenticated cloud sync, physical audio, device sleep, cross-device time-zone changes or production UI. SQL/API behavior was tested locally with synthetic accounts, not real Google identities. Reminders, archiving, automatic planning and paid features remain outside this scope.

No dependencies, credentials, OAuth configuration, bindings, protected Sites adapters, third-party resources or tracking configuration changed. Existing external moderation configuration and independent production-community/main-promotion gates remain pending.

## Post-setup layout refinement

This local refinement supersedes the preceding preview/layout/build figures, not the data compatibility cautions. Preview: http://127.0.0.1:4265/study-habit-tracker. It contains one saved starter habit to demonstrate the post-setup screen, zero saved learning and no active timer. It has not been published, pushed or committed.

Single visible habits now span the full content width; multiple habits retain the desktop two-column layout. The single-card progress uses 52px desktop/44px phone type and a prominent primary action next to the progress on desktop, or a full-width action on phones. The desktop overview is a compact 72px strip instead of the former approximately184px panel. Shorter headings and summary labels, larger readable week labels and reduced vertical gaps foreground the next study action. The phone description can span the full card width beneath its title/tools.

History is a native, initially closed disclosure. View history selects the relevant habit, opens the disclosure, scrolls to it and moves keyboard focus to its summary. The summary supports keyboard close/reopen. Calendar values, dated rules, text-list reading and manual corrections remain available inside it. The guide explains the new entry point; its initial HTML now has approximately2,662 English words and ten FAQs.

Final noindex build/PWA `bd3ce894bba8d742` has56 routes plus404 and62 precache resources. Fifteen related model/page tests,62 HTTP route/resource/robots/Sitemap/license checks and `git diff --check` passed. No repeated full regression or new implementation-mirroring tests were added for this presentation refinement. The prior268-test regression remains evidence for the earlier functional work.

Actual in-app browser verified single-card save/reload, default collapsed history, corresponding-habit selection/opening, keyboard collapse, preparation dialog/cancel, multi-habit two-column rendering and manual check-in/undo at the isolated QA origin. Desktop1440, tablet768, phone390 and320 had no horizontal overflow. At390×844 the primary action ends at approximately821px and is fully visible. Final desktop capture is1440×900; the viewport was reset and observed at1280×720, scroll0, history closed, zero progress, preview tab marked deliverable, warning/error logs empty. No timer was started, record added, cloud sync or production mutation performed in this refinement.

Ignored evidence: `docs/development/evidence/habits-refinement-2026-11-16/`. Inspected final images are `desktop-final.jpg`, `tablet-final.jpg` and `phone-final.jpg`; `desktop-first.jpg` is superseded. The original single-habit reproduction is in the preceding habits evidence folder. Runtime data/model/server/account behavior is unchanged by this refinement. Existing release and independent community/main gates still apply.
