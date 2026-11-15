# Study Planner local implementation — 2026-11-15

Status: implemented and verified locally. No commit, push, version bump or production deployment was performed for this work. Production remains V2.9.0, runtime `73ee56d6c9a5c0d66b14587139a113c83eaaf900`.

## Product and interface

- Replaced the compact task-management form with a dedicated Planner page. Removed its duplicate workspace tool navigation while preserving the global navigation.
- Added today's open task count, estimated time, actual saved task-session time today and past-due count. Estimates never create study credit. Actual time is split across local midnight using the existing session accounting.
- Added a seven-day strip, week navigation, selected-day/week/unscheduled/all/completed views and a past-due entry. Search and subject filters are available in a disclosure.
- Added quick task creation, a full editor, separate planned study date and deadline, priority, completion/reopening, and task-linked study/Pomodoro/focus timers. Moving a task changes its study date without changing its deadline.
- Saving reveals the saved task in its relevant date or Unscheduled view and clears active filters. Undated tasks with deadlines remain visible under Unscheduled and applicable deadline groups. Groups avoid duplicate tasks.
- Example buttons and the existing calculator handoff open editable drafts; cancelling does not save a task. Native date inputs submit named FormData values for reliable date editing.
- Desktop and phone controls, dialog actions, readable guide typography and common content edges are scoped to the Planner stylesheet.

## Search content

The initial server-rendered HTML includes approximately 2,903 English guide words and eight answered FAQs. It covers six concrete setup steps, study dates versus deadlines, daily and weekly planning, an illustrative 100-minute three-task plan, rescheduling an essay while preserving its deadline, planned versus recorded time, timer workflows, overdue and missing-task troubleshooting, related tools, local storage/backups and optional manual sync. The guide explains browser limitations and does not promise notifications, automatic scheduling or guaranteed completion forecasts.

Updated the title, description, H1 and existing WebApplication/BreadcrumbList metadata for `/study-planner`. Canonical and sitemap route remain unchanged. No artificial ratings or FAQ rich-result claims were added. Private tasks are not included in the server HTML.

## Verification

- Final local noindex build: 55 pages plus 404; PWA `f35362d4d63c4feb`, 61 precache resources.
- 173 automated tests passed, including ten new Planner model/HTML tests. Coverage includes save destinations, deadline grouping, deduplication, filters, sorting, rescheduling, midnight accounting, date boundaries and timezone-stable initial rendering.
- 61 local HTTP/metadata/resource checks passed. `git diff --check` passed.
- Real in-app browser tested quick creation, editing, clearing/choosing dates, deadline preservation, completion, reopening, filters, next-week grouping, draft cancellation and calculator handoff. A synthetic task-linked 32-second saved session appeared in the Planner, then its known QA history record and both QA tasks were removed through the application UI. Final local page has zero tasks and zero saved task time; no production records were changed.
- Responsive observations covered desktop 1440, tablet 768 and phones 390/320 without body horizontal overflow. Phone dialog Save/Cancel remained visible, and a FAQ expanded using the keyboard. Final desktop warning/error logs were empty. Browser viewport override was reset.

Evidence is ignored under `docs/development/evidence/planner-2026-11-15/`: `desktop-final.jpg`, `guide-worked-example.jpg`, `phone-task-dialog.jpg`, `narrow-faq.jpg`, and build/test/HTTP logs. `first-pass.jpg` and `desktop-with-qa-tasks.jpg` are superseded observations, not final deliverables.

Development preview: <http://127.0.0.1:4212/study-planner>. Built noindex preview: <http://127.0.0.1:4213/study-planner>. Preview processes are local and must remain running to use these URLs.

## Scope and release handoff

No dependency, database schema, server API, OAuth, secret, binding, hosting resource or tracking configuration changes. Existing browser-local task models, manual optional cloud sync and timer guards are retained. Protected adapter files are unchanged. Recurring tasks, subtasks, automatic rescheduling, calendar export, reminders and monthly planning are not implemented in this iteration.

Package version remains 2.9.0. Publication requires a fresh release build/preflight and production acceptance; local screenshots are not production proof. Existing independent authenticated community/moderation acceptance and main-promotion gates remain. The prior documentation-only HEAD `fdea542923d1ac1c8fb46b23be44a9d9fa2743e1` had not been pushed at the start of this turn; this implementation did not attempt that unrelated sync.

## Alignment follow-up

The guide-only 880px limit is removed. Its headings, paragraphs, table containers and FAQs now use the same full content width and outer edges as the tool board. Real in-app browser measurements: desktop1440px edges89.5/1335.5; phone390px edges18.75/356.25; neither had body horizontal overflow. Final warning/error logs empty and viewport reset. Local build passed; no functional tests repeated for the CSS-only rule. Screenshot: evidence/planner-2026-11-15/aligned-guide-desktop.jpg. This supersedes the previous guide width and guide screenshot appearance. No publishing was performed.
