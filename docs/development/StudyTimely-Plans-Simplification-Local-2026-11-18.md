# Plans simplification — local handoff

2026-11-18. Implemented locally on top of the uncommitted exam-preparation/calendar work. No commit, push, deployment or package bump; production remains V2.32.0.

## User outcome

Plans now prioritizes a compact title/deadline, one task-completion/remaining-work summary, the next study action, and grouped Study tasks. The three large preparation-stage cards, always-visible shared budget, familiarity panel and duplicate main-view progress indicators are removed from the execution view. Preparation settings opens the existing native Dialog pattern. Only paused status, budget shortages and changed/overdue arrangements show inline notices.

The six-task Maths example displays three topic groups and one mock/correction group. Native disclosures default closed. Each original task still has individual edit, arrangement, start, active-session or feedback actions inside its group. Group-level actions use the canonical next task and session; group completion never claims mastery. Mock and correction tasks share a display group but remain distinct records. Ordinary custom tasks retain separate groups. The list initially renders at most five groups; View all and a bounded scrolling region handle longer plans without extending the whole page. Mobile keeps readable card text and wraps controls.

Preparation settings contains the shared budget, editable topic familiarity, existing review setup and suggested phase dates, with real Available time, replan and exam-date navigation. Review rounds/spacing shown here describe the existing setup; individual activities remain editable or optional in the task list. No new automatic regeneration or unsupported review-setup editor was added. Modal updates report errors and do not mark tasks complete or create learning time.

Can’t study today remains beside the next action and uses the existing explicit preview/apply/undo flow. Active or pending-feedback sessions can still be continued even if the preparation subsequently pauses. Completion counts now consistently exclude omitted tasks.

## Source

- app/src/components/PlanningPlans.jsx: compact execution view and settings entry.
- app/src/components/PlanningStudyTasks.jsx: grouped disclosures, canonical per-task controls, bounded five-group initial list.
- app/src/components/ExamPreparationPanel.jsx: actionable inline notices and on-demand settings.
- app/src/lib/planning-plan-view.mjs: pure display grouping, omitted-task count correction.
- app/src/planning-plans-compact.css and StudyPlanning import: scoped desktop/mobile styles.
- PlannerGuide and focused model/React markup/handler checks updated.

No schema, storage key, API endpoint, timer accounting, schedule engine, dependency, binding, paid service, auth or protected Sites adapter changed in this pass. Grouping does not copy, merge, delete or complete persisted tasks. All previous uncommitted work is retained.

## Verification

Final preview build: 56 pages plus 404; noindex; PWA 66edff7f04db00df / 62 resources. Full npm test: 521 passed, 0 failed. Fresh matching preview HTTP: 62 passed including robots/sitemap/notices. git diff --check passed. The existing storage chunk advisory remains non-fatal.

Checks cover six activities in four groups with exact preserved identities and totals, omitted versus completed work, empty familiar topics, active/feedback precedence, custom tasks, correct plan/task/session handler targets, five-group initial display, collapsed settings, actual familiarity and time controls, and normal versus exceptional inline notices. These are model and rendered-markup/handler checks, not browser interaction acceptance.

Matching preview: http://127.0.0.1:4336/study-planner?example=prep&view=plans . Preview process session 96318. Opening in Codex is requested; a queued response does not prove rendering or inspection. The example stays in memory and does not alter real learning data.

Ignored evidence: docs/development/evidence/plans-simplification-2026-11-18/{build.log,tests.log,http.log}.

No in-app browser-control interface was available; no native/Chrome substitute was used. Actual viewport geometry, theme screenshots, keyboard/focus, click-through and authenticated cross-device acceptance remain unverified. Future publication must rebuild and check the entire preparation/calendar/Plans tree with matching Worker validation. Preserve preparation version-2 guards, backups, study records and D1 data. Existing independent production-community/moderation/main-promotion gates remain.


## Expanded-topic visual refinement

The subsequent user screenshots showed insufficient differentiation between closed and open groups. This scoped refinement changes only PlanningStudyTasks markup and its stylesheet. Native disclosures now show visible Expand/Collapse text, an accented/bolder open title, tinted open header and outlined open container. The expanded body has a separate neutral surface and individual study/review/mock/correction cards with labelled type accents. The repeated group-level start button is hidden only while open; individual canonical task actions remain available. Light theme uses darker accent text. Native keyboard/disclosure semantics and default-collapsed state are retained; no open-state persistence or new model fields.

Final refinement build: 56 pages plus 404, preview noindex, PWA 2aed11fcb88f828b / 62 resources. Nine existing related UI/handler tests passed and 62 fresh preview HTTP checks passed; diff check passed. The preceding 521 full-suite pass remains the baseline; the full suite was not repeated for this presentation-only refinement. Calculated expanded-title text contrast across the palette is at least approximately 5.16:1 in dark and 5.29:1 in light; no full accessibility claim. Ignored logs: docs/development/evidence/plans-disclosure-2026-11-18/.

Updated matching preview: http://127.0.0.1:4338/study-planner?example=prep&view=plans (process session 43470). Opening in Codex is requested; queued opening is not screenshot or click-through evidence. In-app browser control remains unavailable, so actual expanded/collapsed rendering, mobile geometry and focus acceptance are not claimed. No native substitute. No commit/push/deploy or production/package change.
