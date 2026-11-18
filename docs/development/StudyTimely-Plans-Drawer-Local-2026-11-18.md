# Study Planner topic list and task drawer

Implemented locally on 18 November 2026. This supersedes the accordion presentation in the Plans simplification handoff. Earlier exam-preparation and calendar work remains in the same dirty tree. Nothing was committed, pushed or deployed; production and package remain V2.32.0.

## Behaviour

- Plans shows compact topic rows instead of nested expandable cards. Each row has a topic name, study/review summary, remaining work and View details. Five rows are shown per page; larger plans offer search across topic and canonical task titles and subjects. No internal scrolling list is used in the main task area.
- Clicking a row opens a separate 560px right-side native modal drawer; mobile CSS makes it full-screen. Its header and action footer stay fixed while the middle scrolls. Individual study/review/mock/correction steps are selectable rows, with clearly labelled states and a solid blue selection.
- The drawer footer exposes Edit task plus the appropriate existing action: start, continue, feedback or arrange. Completed and omitted tasks do not receive a start action. Paused preparation still permits access to an existing active session or pending feedback. Empty familiar topics explain why no task is included.
- Generated repetitive titles are shortened inside the drawer only. Explicitly edited names and all canonical task/session identities are retained. Study/review/mock/correction records are not merged or copied.
- Existing task/session editors and schedule previews suspend the drawer. Closing them resumes the same topic and task selection when it remains available. Explicit navigation to Week or the real timer retains existing routing. The shared Dialog accepts optional origin/fallback focus refs; existing callers keep their prior defaults.
- The next learning session uses an opaque mint background and dark text. Normal topic rows, selected rows and the drawer use separate opaque surfaces in both themes. Topic titles use 16px type and a two-line limit; drawer titles use 24px type.

## References and scope

Official TickTick and Todoist examples informed the compact list and separate details pattern. Sources and inspected official image provenance are recorded in ignored evidence `planner-design-references-2026-11-18/sources.json`. Todoist's published task-view example is a design reference, not proof of its latest application runtime. No competitor image is distributed as an app asset.

Main files: PlanningStudyTasks.jsx, planning-task-detail.mjs, planning-task-drawer.css, PlanningPlans.jsx, StudyPlanning.jsx, Dialog.jsx, planning-plans-compact.css and PlannerGuide.jsx. Focused presentation/handler tests were added or updated. No dependency, storage key, persisted schema, API endpoint, timer accounting, paid entitlement, AI service or D1 migration changed in this redesign. The earlier unpublished Worker validation and preparation version-2 guards remain required for any future combined release.

## Verification

- `npm run build`: 56 pages plus 404, preview noindex, PWA `3357112bfd98e7a6`, 62 resources. Existing storage chunk advisory remains non-fatal.
- `npm test`: 526 passed, zero failed/skipped. Includes pagination/search/clamping, generated versus renamed titles, active/feedback/completed/omitted/paused actions, canonical edit/start targets, and suspended/resumed drawer props. These are model/rendered-markup/handler checks, not real browser interaction acceptance.
- Fresh matching preview `npm run check:http`: 62 route/asset checks, robots, Sitemap and licenses passed.
- `git diff --check`: passed.
- Calculated text contrast for seven principal new foreground/background pairs ranges from 7.11:1 to 13.09:1. This is a palette calculation, not full accessibility acceptance.

Preview: http://127.0.0.1:4340/study-planner?example=prep&view=plans ; process session 2779. The example remains isolated in memory. Opening this URL in Codex returned queued; this does not prove the page rendered.

Ignored evidence: `docs/development/evidence/plans-drawer-2026-11-18/` contains build, full tests, HTTP logs and palette calculations. Current tools provide no in-app browser control/capture interface. Actual desktop/mobile geometry, theme screenshots, drawer/editor click-through, keyboard focus restoration and console inspection remain unverified. No Chrome/native browser substitute was used. Preserve the existing independent production community/moderation/main-promotion gates.
