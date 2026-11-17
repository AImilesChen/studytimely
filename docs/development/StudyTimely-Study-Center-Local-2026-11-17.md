# My Study Center — first-stage local implementation

Publication update: the implementation below, plus dynamic Sign in / My Study Center navigation, is now published as V2.25.0. See [the release record](StudyTimely-V2.25.0-Release.md) for the actual runtime commit, deployment and production verification. Historical local-only statements below describe the state before that release.

Clean preview: <http://127.0.0.1:4286/account>. This origin has no learning records and uses an isolated local fixture database. Port 4287 contains explicitly labelled synthetic QA records in separate browser storage and a separate fixture persistence directory. Neither is production. Production/package remain V2.24.0. No commit, push or deployment was performed.

## Implemented

Account now opens a responsive My Study Center with Overview, My learning, Progress, Community and Settings tabs. Overview aggregates saved personal study today/week, daily goal and today's planned-or-due task completion. It includes the next three overdue/planned/due tasks, seven-day activity with readable daily values, recent sessions, upcoming exams, today's next study block, habits and selected/next syllabus topics. My learning links existing tools and summarizes course coverage; Progress reuses saved intervals and subject distributions. Each detailed tool remains the source of its own editing workflows.

Task Study and topic Study buttons use existing App.startTarget with its unfinished-timer confirmation. A return link opens the active timer without automatically resetting/resuming it. Complete saves task status without creating time. Reschedule changes plannedDate while preserving dueDate. It submits the actual form date via FormData and includes expectedUpdatedAt to reject concurrent task changes. An initial controlled-date submission issue was caught by browser QA and corrected; refresh and downloaded-backup inspection verified the final date.

Read-only community cards load existing personal membership and ranking endpoints for Google-linked accounts; signed-out, link-required, loading, empty and retry states are distinct. They show joined rooms, optional ranking status, separate room credit for today (UTC), and genuine rank if available. Room links preserve the existing room query. No public ranking choice is changed. Personal saved learning is not summed with community credit.

The original account controller, Google/legacy sign-in, registration declaration, manual merge/sync and export/delete handlers are retained under Settings. Browser backup download is available without signing in. Technical sync explanation and account deletion controls are collapsed separately. Account connection errors have Retry. Successful Google-return messages keep Overview selected; registration/error/action messages can reveal Settings. No automatic upload/sync or new declarations are added. The top status describes a cloud snapshot, not guaranteed up-to-date backup coverage.

Source modules: components/Account.jsx, StudyCenter.jsx, StudyCenterCommunity.jsx; lib/study-center.mjs; study-center.css; App props and account route metadata. Private /account remains noindex and outside the public Sitemap. No backend, schema, data format, dependencies, secret, policy, tracking, protected adapter or production resource changes.

## Verification

Final noindex build produced 56 routes plus 404, PWA adbf2484bdc16d62 with 62 resources. All 312 tests and 62 HTTP checks passed. Four new model tests cover cross-midnight intervals, exclusion of general timers, planning versus actual credit, deduplicated today's tasks, historical completions/deletions, upcoming/archived/taken exams, study-block eligibility and mutation-free empty reports.

Actual IAB QA imported a validated local sample through the existing backup UI on 4287: three sessions, three tasks, one habit, course and exam. Overview correctly showed 25m today, 50m week, 75m last seven days. Complete changed the plan count without changing learning. Reschedule to 18 November persisted after refresh and appeared in the downloaded backup. Linked task timing ran for 15 seconds, was paused, and Return preserved it; attempting a topic switch required confirmation and Cancel kept the original paused task. Finish saved only the 15 seconds and totals became 25m15s/50m15s. No QA timer remains running.

The fixture sign-in created only a synthetic local account; no real Google or legal declaration was accepted. Existing local records were not uploaded just by sign-in. Community/profile-required states loaded; manual Sync now then saved the explicit local sample, retained four sessions and survived refresh. Exported browser backup had four sessions, three tasks and the correct moved date. Signing out preserved browser learning. No real or production profile/cloud/community data was changed.

Five tabs, My learning coverage, Progress subject totals, Home/End keyboard tab navigation and phone Settings were exercised. Widths 1440/768/390/320 had no horizontal overflow; desktop frame max was 1280px. Final desktop and 390px phone screenshots were saved and inspected. The first populated-phone capture was cropped during a rapid viewport change and is not delivery evidence; final-phone.jpg was captured in a separate call after resizing and is accepted. Final preview is clean 4286, Overview selected, zero learning/task records, default 1280×720 viewport, empty warning/error logs and tab marked deliverable. QA tab closed.

Ignored evidence: docs/development/evidence/study-center-2026-11-17/ includes build/tests/HTTP, responsive geometry, synthetic preparation/backup and screenshots. final-desktop.jpg and final-phone.jpg are current delivery. An early dev server shared persistence with QA and encountered SQLite locking during rebuild; the final delivery server has its own persistence directory. Only local existing migrations were applied, not new migrations or remote changes. Wrangler config/registry was redirected to workspace-local storage.

## Scope limits

This implements the agreed first stage. Automated next-action recommendations beyond existing planner/syllabus ordering, plan-versus-actual reporting, exam workload checks, weekly review and opt-in automatic sync remain second-stage work. Real Google round-trip, first registration, all forced failures, multi-device concurrency, full accessibility, installation/offline and production acceptance were not reverified. Existing independent production room/chat/moderation/main-promotion gates remain unchanged. A future authorized release must rebuild, synchronize and verify the real site.

## V2.25.0 publication candidate

The user authorized releasing this Study Center together with a clearer global account entry. The header and mobile menu now use Sign in for an anonymous session and My Study Center for a signed-in session. The shared transient status stores only a boolean, coalesces requests, preserves known state on network failure and rejects stale responses after an explicit sign-out. Server rendering uses a neutral Account label until the client checks the session; the desktop entry reserves its width. Focus and visibility refresh the status. No identity is persisted by the navigation component.

Sign in opens /account?view=signin with Settings selected and the existing Google sign-in section above browser backup controls. Repeated same-route entry works. Signed-in navigation opens the normal overview. Leaderboard and community sign-in actions use the explicit entry too. No automatic Google authorization, sync, age declaration, or profile/ranking setting change is introduced.

Local in-app browser verified anonymous desktop, repeated same-route entry, 390px mobile menu, fixture sign-in → My Study Center → Overview, and fixture sign-out → Sign in without a reload. Four synthetic local sessions remained intact after sign-out. Captured warnings/errors were empty. The final production candidate passed 315 tests, 62 HTTP checks, git diff whitespace checking and Cloudflare deployment dry-run with existing bindings. These checks do not substitute for the pending production readback recorded in the separate release report.
