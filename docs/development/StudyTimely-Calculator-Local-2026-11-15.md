# Study Time Calculator — local implementation

Publication update: this calculator was subsequently committed and published as V2.9.0. See `StudyTimely-V2.9.0-Release.md` for exact runtime source, production checks and limitations. The local-only statuses and build hashes below describe their respective earlier verification stages.

Implemented on 2026-11-15 against the accepted calculator analysis. Preview: http://127.0.0.1:4208/study-time-calculator . Built noindex HTTP preview: http://127.0.0.1:4209/study-time-calculator . This work is local and uncommitted; it was not pushed or deployed. Production remains V2.8.0 from `4279dedbe68c64fe7a1cb2462b0904a77eaaced1`. The package version is unchanged until a future release is prepared.

## Completed scope

The calculator has two modes. Daily budget converts either a focused-study target or an elapsed window including breaks into daily, weekly and total estimates. Before a deadline distributes the user's remaining focused hours/minutes across actual selected weekdays. Today can be excluded; the deadline date itself is excluded. Daily available time is optional and always includes breaks.

Study and breaks are distinct. A shorter last session is retained and no trailing break is added. Elapsed-window capacity handles the gap between sessions correctly: 120 available minutes at 25/5 fit 100 focused minutes and 15 break minutes. Whole-minute deadline distribution preserves the original workload exactly, including workloads smaller than the available-day count. Partial weeks use actual dates. Date-only arithmetic does not change weekday counts across daylight-saving transitions; the initial date comes from the user's local device date.

The result foregrounds daily focused study and the actual occupied daily window. Secondary figures show total study, study days, weekly targets and total elapsed time. A deadline weekly figure is explicitly a full-week upper target, not a claim about a remaining partial week. Optional availability produces an explicit capacity surplus/shortfall. Extra study-day suggestions do not modify the deadline. Impossible day lengths are rejected or marked infeasible; infeasible/stale results cannot be used to create a draft or prepare a timer.

An expandable calculation shows sessions, the shorter final segment, dates and total breaks. Result copying includes availability, dates, capacity status and the distinction between planning and recorded time; a selectable text fallback is shown if clipboard access fails. Edited inputs mark the preceding result stale until recalculation. Reset restores defaults. Calculation works independently of workspace storage readiness; task/focus handoffs require the existing local workspace to be ready.

## Existing-tool integration and privacy

Review a study task opens the existing Planner task dialog with a generic editable title, first study date, deadline when applicable, and first-day focused-minute estimate. It creates no task automatically. The draft lives only in App memory and is consumed once; cancelling leaves the task list unchanged. This version prepares one first-day task, not a dated multi-subject calendar.

Preparing a focus timer requires a confirmation explaining that the duration preference will change and the timer will remain idle. The existing model rejects timing changes that would alter an unfinished session; App also checks the current active session and shows an in-dialog explanation when preparation is blocked. No timer is automatically started, saved or reset. The independent alarm is unaffected.

Inputs/results remain in calculator page memory and are not persisted, exported, put into URLs or sent to analytics/cloud. Explicitly saved Planner tasks and confirmed duration preferences follow the existing storage/sync choices. The public privacy-policy source now explains this distinction. The calculation itself creates no study records or ranking credit.

## Layout and content

The page retains the existing brand, palette, fonts and primary navigation. Duplicate workspace navigation is removed only on this route. Following the alignment feedback, desktop uses equal-width, equal-height adjacent input/result panels with matching visible headings, padding and borders. Results no longer stick independently. The default daily form shows daily minutes, weeks and a study-days preset; specific weekdays remain available through a custom choice. Deadline/date and study-day controls share a desktop row and stack on narrow phones. Budget interpretation, optional availability in both modes, and session settings are under More options. The main Calculate action precedes these optional settings; an Update estimate action is also provided within the expanded section. Larger controls retain 66px numeric inputs with 28px values on desktop, and 62px inputs on phones.

The result foregrounds a large daily target and four secondary figures. Capacity information is a short paragraph rather than an additional status card; infeasible/shortfall cases retain the necessary explanation and disabled actions. Task review, focus preparation and copy actions now share a full-width area below both panels. The session calculation follows inside a collapsed disclosure, so opening it does not stretch either column. On phones the panels and three actions stack with common left/right edges.

The initial HTML contains approximately **1,390 English guide words** and **eight complete FAQ answers**. Guide sections explain both modes, steps, formulas, three worked examples, break accounting, feasibility and the roles of existing planning/tracking tools. Desktop/tablet body text is 18px with 1.8 line height; phones use 16px. Keywords describe actual functionality; no search volume, ranking, academic-results or universal-study-hours claim was introduced.

Updated Title/H1/description and WebApplication/BreadcrumbList metadata preserve the existing canonical `/study-time-calculator`. No new routes were added, and Sitemap eligibility is unchanged. FAQ answers are visible in the HTML while details are closed; there is no FAQ-rich-result or rating markup. Local preview stays noindex with an empty Sitemap.

## Verification

- Final local build after the alignment refinement passed: 55 pages plus 404; PWA `46e15229606af4da`, 61 precache resources.
- **163/163 tests passed**. Eleven new tests cover focused/elapsed budgets, break discontinuities, whole-minute totals, partial weeks, selected weekdays, today/deadline rules, shortfalls, invalid/overloaded cases, time-zone/DST boundaries, handoff accounting/protected active timing, metadata, complete initial HTML/links and timezone-independent SSR.
- **61 local HTTP/resource checks** passed, including metadata, canonical, redirects, robots, Sitemap and licenses. A production release build/deployment/production acceptance was not performed this turn.
- Actual in-app browser verified the default 60-minute target (70 occupied minutes/day, 20 study hours and 23h20m elapsed overall), 120-minute elapsed window (100 focused minutes/day), 40-hour deadline target with a 6h40m shortfall and four extra study days, disabled infeasible handoff, successful copy confirmation, over-24-hour inline error and reset.
- The browser observed a prefilled Planner draft (60 minutes and first selected date), then cancelled it and confirmed no task was created. The existing task-save model was separately tested for zero study credit.
- A custom 30-minute session reached Focus Timer at `00:30:00` with Start still available. A synthetic local timer was then started only to test protection: attempting a 25-minute preparation was blocked with an explicit in-dialog message. That synthetic unsaved session was moved to the test tab and discarded/reset through the UI. No saved study record was created.
- Default desktop 1280 × 720, tablet 768 × 1024, phone 390 × 844 and narrow phone 320 × 740 had matching document client/scroll widths. Mobile paired inputs were measured at identical top coordinates. Keyboard Enter expanded the FAQ answer. Saved desktop/phone screenshots were inspected. Final warning/error logs were empty and viewport override reset.
- All UI interaction used the in-app browser. No desktop/local application input, production account, profile, room, timer or ranking mutation was performed. `git diff --check` passed.

Evidence is ignored under `docs/development/evidence/calculator-2026-11-15/`: final build/tests/HTTP logs and desktop/390px/320px JPEG screenshots. The prior analysis captures remain in `calculator-audit-2026-11-15/` and are not treated as proof of the new implementation.

## Files and remaining scope

`calculator.mjs` contains the shared calculation/format/copy/draft helpers; the legacy calculation API remains compatible with an added impossible-day guard. `StudyCalculator.jsx`, `CalculatorGuide.jsx` and `calculator.css` implement the page. App and Management integrate ephemeral task/focus handoffs; route/site metadata and the policy source are updated. No dependency, schema, server/API, auth/secret, Cloudflare resource, tracking configuration or protected Sites-adapter file changed.

Multi-subject allocation, automatic calendar generation, credit-hour assumptions, print/export and completion-date forecasting remain later work as agreed. GSC/Bing indexing, submissions and GA4/Ahrefs backend receipt were not reverified for this local change. Existing real community-review configuration, authenticated production-community acceptance and main-promotion gates remain unchanged. A separately requested release must build and verify the exact publishable source before deployment.


## Earlier first-screen refinement verification

The final simplified form was checked in the in-app browser at 1691 × 843, 1280 × 720, 390 × 844 and 320 × 740. Document client/scroll widths matched. Paired mobile inputs had matching top coordinates; custom weekday controls remained usable at 320px. Weekend and custom Saturday-only estimates produced eight and four study days respectively for four weeks. The advanced elapsed-window calculation retained 100 focused minutes in a 120-minute window; the deadline mode and reset were also exercised. No warning/error logs were returned; the viewport override was reset. These checks supplement the earlier functional handoff checks above.

Final evidence: `simple-wide.jpg`, `simple-phone.jpg`, `simple-final-build.log`, `simple-tests.log` and `simple-http.log` in the ignored evidence directory. The final build, 163 tests and 61 HTTP checks passed after the refinement. Calculation logic, task/focus handoffs and guide scope are unchanged by this UI pass. No publication was performed.


## Alignment refinement verification (latest)

This pass follows the user's accepted comparison of StudiesTimer and inCalculators. Source capture from the comparison remains separate evidence; this is an implementation of the agreed layout within StudyTimely's existing design.

- Final build: 55 pages plus 404, local noindex, PWA `46e15229606af4da` with 61 resources. Existing 163 tests and 61 HTTP/resource checks passed after the final code changes. No new test framework or dependency was added.
- Real in-app browser measured equal card tops, bottoms, heights and widths in result states. At 1440 × 900 each default card was approximately 643.5px wide × 625.28px high. At 1158 × 835 each card was approximately 513.78px wide; the default result and the longer deadline result kept equal heights. The deadline result with availability set and options closed measured about 715.78px per card.
- At 900px the tool retained two equal columns, at 768px it stacked, and at 390px and 320px document client/scroll widths matched. Phone actions stacked at a common width with 56px height. Mobile paired primary inputs had matching top coordinates; custom weekday choices and the stacked deadline/calendar fields remained available.
- The default estimate still showed 1h daily focused study, 1h10 occupied, 20h total focused and 23h20 total elapsed. The 40h deadline case with 120 available minutes showed a 6h40 shortfall plus four additional study days, with task/focus actions disabled. Changing availability disabled all stale-result actions; Update estimate with 180 available minutes produced 50h focused capacity and 10h spare.
- Copy confirmation succeeded from the new action area on desktop and phone. Task review opened the correct 60-minute first-day draft, then Cancel returned an empty Planner; no task was saved. Focus preparation opened the existing confirmation, then was cancelled without changing a timer. Enter opened/closed the relocated calculation disclosure while both card heights remained equal. Existing active-session protection was covered by the regression tests; starting or preparing a real timer was not repeated this pass.
- Final warning/error logs were empty. Viewport override was reset and the calculator preview was retained. Browser work used only the in-app browser, with no desktop/local application input or production data mutation.

Latest inspected screenshots: `balanced-desktop.jpg` (scrolled desktop tool area with both aligned cards and the shared actions) and `balanced-phone-actions.jpg`. `balanced-phone.jpg` shows the stacked phone result. Evidence/logs are ignored under `docs/development/evidence/calculator-2026-11-15/`, using the `balanced-` prefix. Earlier screenshots/build hashes describe earlier iterations and are not the current UI. Final `git diff --check` passed. This remains local, uncommitted and unpublished; production stays V2.8.0 and package version is unchanged.
