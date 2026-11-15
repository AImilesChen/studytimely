# Study Schedule Maker — local implementation, 2026-11-15

Implemented locally from the accepted weekly-routine proposal. Not committed, pushed or deployed this turn; production remains V2.10.0 (`48a893f9bc8751984acb2dafb88e9cf0583b2176`). Package remains 2.10.0.

## Delivered

- Dedicated `/study-schedule-maker` page with common tool/guide edges and no duplicate workspace navigation. Compact weekly totals distinguish study, breaks and fixed commitments.
- A local-wall-clock weekly grid with automatically bounded time range, full-day option and keyboard-accessible block editing; Week list exposes full titles and edit/copy/delete/study actions. Phones show a selected weekday and expandable seven-day list.
- Explicit repeating-week semantics, rather than misleading date navigation. Editing/deleting affects the weekly rule; multi-day creation makes independent blocks. Single-week exceptions are not supported.
- Create/edit/copy dialogs support types, subjects, multiple weekdays, duration preview and end-at-midnight. Overnight activity must be split between weekdays. Named conflicts list their times and activities; adjacent boundaries are valid.
- New `blocks-save` model transition validates and saves the complete weekday selection atomically. Existing `block-save` remains supported. No partial save on one conflicting day; no changed state after invalid input. Existing overlap rejection now names the conflict.
- Optional block `kind` is normalized to Study for legacy records; new Break and Fixed commitment types survive the shared workspace validator, backups and merge paths. Concurrent imported overlaps remain recoverable and are flagged, with a warning that summed durations can double-count overlapping minutes.
- Study action prepares Focus, count-up Study or Pomodoro subject/settings after explicit review. It does not auto-start, mark completion or create history. Existing unfinished-session and other-tab model guards remain authoritative. Schedule sessions are not linked to an individual weekly occurrence or task; task-linked recording remains in Planner.
- Copy week produces all weekdays/types/totals/zone. If clipboard access fails, a manual-copy dialog is available. Print preview provides a readable table and browser Print / save PDF action; print CSS hides unrelated app UI and also supports normal browser printing.
- Empty-state example preview is explicitly unsaved. Example buttons open editable drafts; cancellation creates no blocks.

## Guide and metadata

Initial HTML contains about **3,218 English words**, seven setup steps and ten complete FAQ answers. Sections explain routine/date semantics, an evening example and its weekly totals, subject balance, breaks and capacity, rescheduling/conflicts, timer preparation, copying/printing, related tools, storage/backups and real limitations. The illustrative Monday/Wednesday routine has 115 study minutes and 20 break minutes each evening: 230 study minutes and 40 break minutes weekly. It does not promise notifications, automated allocation, task completion or study credit from planned blocks.

Updated title/description/H1 and existing WebApplication/BreadcrumbList scope. Public URL and sitemap membership unchanged. No FAQ rich-result/ratings claims or user schedule data in initial HTML. Preview remains noindex.

## Verification

- Final local build: 55 pages plus 404; PWA `1bbc6b73d16010e3`, 61 resources.
- **184 regression tests passed** (173 existing plus 11 new). After final presentation refinements, all 11 Schedule model/HTML tests were rerun successfully against final build output. Tests cover atomic weekday batches, conflicts/boundaries, independent copy/move behavior, old records, backup/merge preservation, type-separated totals, midnight, copy output, timer guards, complete initial guide and timezone-stable SSR.
- **61 local HTTP/route/resource checks passed** against built preview, including metadata, canonical, noindex robots, empty preview sitemap, assets and licenses. `git diff --check` passed; protected adapter diff is empty.
- Actual in-app browser on isolated localhost:4216 verified two-day save, native time editing, adjacent breaks, conflict disabling, copy-to-other-day with changed type, 23:30–24:00, moving the repeating block, Week list, whole-week clipboard contents and printable preview. Preparing a 45-minute Focus Timer produced `00:45:00` with Start still required. A synthetic started/paused timer blocked a second preparation and was then discarded/reset; Tracker showed zero sessions and zero actual time.
- All five known synthetic QA blocks were removed through application UI. Final routine has zero blocks/totals; example draft cancellation was observed without a save. No production data, account, cloud sync, group, message or leaderboard mutation occurred.
- Responsive checks: 1440, default 1280, tablet 768, phones 390/320; no body horizontal overflow observed. Tool and guide share edges (default desktop 50.59375/1214.40625; phone390 18.75/356.25). Phone dialog clipping was fixed: Save bottom771.9 inside dialog bottom784.9 at390; Save bottom675.2 inside dialog bottom688.2 at320. FAQ keyboard expansion worked, phone prose16px. Final warning/error logs empty, viewport reset and preview tab marked deliverable.

Ignored evidence: `docs/development/evidence/schedule-2026-11-15/` includes final `desktop-final.jpg`, `phone-dialog-final.jpg`, `print-preview-final.jpg`, `guide-example.jpg`, logs and example preview. Earlier desktop-empty/phone-dialog/print-preview images are superseded; example-preview screenshot predates only the weekday-label font correction. Do not present QA screenshots or local images as production proof.

## Scope and remaining verification

Development preview: <http://127.0.0.1:4216/study-schedule-maker>. Built noindex preview: <http://127.0.0.1:4217/study-schedule-maker>. Both require their local processes to remain running.

No new dependency, route, external service, API endpoint, D1 schema/migration, secret, OAuth, binding, tracking configuration or protected adapter change. Shared workspace JSON validation is extended for optional block types, so the production Worker must be rebuilt together with the frontend when released. Optional sync validation was tested at the model/backup/merge layer; authenticated cloud sync was not exercised in this turn.

Older running app versions do not understand block types and can lose classification when saving or syncing. Before using types across devices, back up and update the app on each device after finishing any active work. No forced PWA update was performed. The existing schema version remains compatible for legacy blocks; do not claim old clients preserve new kinds.

Actual printer output, system PDF destination and pagination were not exercised; only the in-page printable preview and print stylesheet were checked. Manual clipboard-fallback behavior was not forced. No automatic scheduler, single-week override, drag-only control, calendar integration or reminders added. GSC/Bing/analytics backends and independent authenticated-community/main-promotion gates remain unchanged. Publication needs fresh authorized release checks and production acceptance.
