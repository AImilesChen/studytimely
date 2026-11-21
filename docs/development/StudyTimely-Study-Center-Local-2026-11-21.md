# Study Center local redesign — 21 November 2026

Status: implemented locally under the approved practical-visual-design plan. Production and package version remain V2.46.0. No commit, push or deployment performed.

## Behaviour and layout

- One section navigation: Today, Study plans, Progress, My groups, Account & data. Each section explains its purpose. Personal browser storage and the existing sync state appear above the navigation.
- Today prioritises the actual task list and an inline quick-add form. New tasks use the existing `task-save` command, the local study date and no deadline. Completion and date changes retain version checks; feedback stays inside the task section. Task actions use the existing guarded `onStart` callback, which starts the selected task after any required active-timer confirmation.
- Three compact metrics replace the oversized four-column row. Daily goal edits use the existing `goal` command directly on this page, including removal with zero. Saving does not start a timer or create study credit.
- The desktop task column and supporting plans use a 2:1 grid. Exams, habits, topics and any next scheduled block share a compact supporting list. Phone content order is tasks, metrics, upcoming plans, history.
- Zero-history charts contain no fabricated bars. Populated charts expose all seven dated numeric values without disclosure. Loading messages distinguish unfinished reads from empty data.
- Overview groups are summarised. The My groups section contains the complete room list, owner/member role, member/capacity count, access state and explicit entry buttons. It uses `/api/community/me` without making room visibility depend on an additional ranking request. Personal and UTC group credit remain separate.
- Personal preferences are directly visible under Account & data, including nickname, optional public ranking, and hidden-member state. Existing profile versions, privacy explanations and API contracts are retained. `/account?view=preferences` focuses this section; the group directory and room Manage links now use it. Existing `/account?view=community` still opens My groups.
- `/exam-countdown?action=add` opens the existing exam editor after local loading; `?exam=ID` selects the requested existing exam. `/study-planner?tasks=all` opens and focuses the existing manual task list in its All view.
- A short, clearly illustrative example below the tools explains planning 25 minutes versus saving 20 actual minutes. No example records are persisted. Account & data retains the existing SyncCenter backup, recovery, consent, merge and timer guards, without adding a duplicate backup card.
- Warm light/dark surfaces, coral action colour, visible outlined secondary actions, shared alignment and at least 44px action targets. Native emoji replace decorative outline icons in this section navigation. Site-wide header and unrelated timer styling are unchanged.

## Verification

- Final local build: 56 prerendered pages plus 404; noindex preview mode; PWA cache `c1b0ca2db82088ab`. Existing bundle-size and shared-import warnings remain.
- Full regression run: **732 passed, zero failed**. This includes seven additional component/action cases. After final focus/loading refinements, the related component and sync tests were rerun successfully.
- Handler tests execute the real components against the existing model: adding a task, completion without credit, stale-version rejection, rapid-submit protection, pending-save disabling, inline goal save/removal/failure, and honest empty/loading/populated trend output. SSR checks cover section navigation, data-source text, visible preferences and unchanged sync recovery states.
- HTTP verification: **62 route/resource checks passed**, including robots, Sitemap and licences. Account, preference, exam-add and all-task URLs returned 200 in the isolated local preview.
- Contrast calculations: light primary text 5.47:1, dark primary text 8.59:1, muted light text on the warm instructional surface 4.65:1. These are scoped colour-pair calculations, not a full accessibility certification.
- `git diff --check` passed. The pre-existing FocusGuide.jsx change was preserved.

## Preview and outstanding visual acceptance

Local account URL: `http://127.0.0.1:4312/account`. The existing local Worker and synthetic-account portal at `/__test/group-preview` are isolated from production. Never deploy test fixtures.

Opening the preview was queued through the Codex app. Browser-control tools were unavailable in this session, so fresh rendered desktop/phone screenshots, real browser clicks, clipboard and keyboard focus behaviour have **not** been visually verified. Automated handler/SSR/HTTP results do not substitute for those checks. No authenticated production writes or real Google login were performed.

No database, dependencies, OAuth, permissions, bindings, analytics, public SEO metadata, or protected Sites adapter files changed. Existing independent production acceptance gates remain unchanged.

## Black-screen repair — 21 November follow-up

The user reported a blank preview. A local-only diagnostic proxy captured the actual browser error `Cannot read properties of null (reading 'me')` and an empty React root. The API identity uses `user.syncAccountId`, not `user.id`. Comparing two missing IDs had incorrectly classified a null community response as loaded on the first authenticated render.

`StudyCenterCommunity` now requires a non-null response and a real matching sync-account ID, uses that ID for fetch dependencies, and shows an explicit loading state before data arrives. Account changes cannot expose the previous response. A separate clock/date readiness guard prevents reports from running against the initial zero clock or an unreconciled local date.

Regression evidence: the new authenticated first-render test failed with the exact null-property exception before the fix, then passed for summary, rooms and preferences. Loaded-screen tests cover all five sections and clock initialisation. Final related suite: **18 passed**, zero failed. Rebuilt preview cache `deae505bcf0e4b42`; **62 HTTP checks passed** against the new proxy.

Verified browser runtime at `http://127.0.0.1:4313/account?preview=center-fix`: the diagnostic callback reported one root child, heading `My Study Center`, 3,466 text characters and 31 buttons, with no new error/rejection events after opening the repaired build. This confirms actual client rendering; it is not a screenshot/layout or full interaction acceptance. Previous unverified visual/phone/clipboard limitations still apply.

The local-only `app/.wrangler/preview-diagnostics.mjs` proxies the isolated 4312 Worker, disables offline caching for this disposable preview, and retains at most 40 diagnostic events in memory. It is excluded from the application entry/build and must not be deployed as a production server. Browser data was not cleared. Production remains unchanged.

## Direct tools follow-up

The user rejected the three outgoing sidebar buttons. The overview and Study plans section now render actual controls using the existing workspace commands:

- Exam name/date/subject form, saved local-date countdowns and a version-checked Mark taken action. Date-only creation is explicitly labelled; existing timed exams retain their original time and zone.
- Habit name, measure, daily/weekly target and study-day controls, followed by saved progress. Manual habits support today’s check-in and undo. Timer-derived minute/session habits have no manual progress-awarding button.
- Course selection or creation, optional subject and one-topic-per-line outline, followed by a topic checklist and guarded start-study actions. A course and its outline save atomically with `plan-save`; appending topics checks the visible course version and preserves existing chapters and metadata. Topic coverage uses the existing versioned `chapter-save` command.

All three forms are visible without opening a disclosure or leaving the center. They occupy full-width rows below today’s task workspace, with a narrow explanatory column and an aligned working form. The old Coming up next link sidebar is removed. All open tasks now toggles the actual task list in place; the overview’s View progress action selects the center’s Progress tab.

No application dependencies, accounting rules or backend contracts changed. Failed saves retain drafts, repeated submissions are guarded, and creating plans/checking habits/marking topics never fabricates study time. Existing optional sync and timer safeguards remain.

Final build: `308817507f729a37`, asset `index-MQZibPZL.js`, noindex preview. **744 regression tests passed**, zero failed, including **27 focused center cases**; **62 HTTP checks passed** and `git diff --check` passed. New tests exercise all three real forms and handlers, countdown/status changes, manual versus automatic habits, atomic outlines, coverage/start callbacks, stale edits, failure drafts and duplicate submission prevention.

Fresh preview URL: `http://127.0.0.1:4314/account`, proxied to the same isolated local Worker. HTTP confirms all three tool forms and the current asset are delivered. The previous 4313 browser event still reflected older content after reopening, so a new origin was provided to avoid reusing that browser context. Fresh screenshot/mobile and click-through acceptance remain unverified; the local diagnostic endpoint records only runtime health and tool form/field/link counts. No production deployment or clearing of browser data was performed.

## Continuous illustrated guide follow-up

Under the user's approved content plan and request to reduce modular/template styling, the former coloured three-step panel is replaced by `StudyCenterGuide.jsx` and its scoped stylesheet. Four default-visible rows explain tasks, exam dates, habits and course topics using read-only HTML illustrations beside the actual button names and expected outcomes. Each figure explicitly says it is illustrative and contains no input or action controls. A single revision example connects an exam, course outline, daily habit, task and saved timer record; three expanded questions explain zero totals, manual versus automatic habits and local/optional-sync storage.

The guide appears immediately after the working tools in Today, and after the tools/tasks in Study plans. Its reading path uses shared column alignment, typography, open space and thin rules. Large colour panels, tutorial navigation and repeated outer cards are avoided. The three real planning workspaces lose their nested card borders; the supporting history column becomes a quiet divider rather than a competing panel. Illustration frames remain solely to depict sample UI. Narrow screens use a single column and keep all instructions visible.

The personal `/account` route remains non-indexable; no new public SEO page, metadata, marketing promise, schema or external navigation was added. Actual tool state, storage, auth, sync and study accounting are unchanged. Guide content is English and does not read or persist personal data.

Validation: final build cache `dc84d83dfa3654be`, 56 prerendered pages plus 404 in noindex preview mode; **27 related regressions passed** and **62 HTTP checks passed**. A standalone render confirms four figures, three questions, zero guide buttons/forms/disclosures and approximately 701 English words including labels/examples. An initial ad-hoc counter accidentally included illustration definition terms as FAQ terms; its scope was corrected without a product change. `git diff --check` passes. The previous full 744-test run remains the functional baseline; it was not needlessly repeated for this presentation/copy change.

Preview: `http://127.0.0.1:4314/account?preview=guide#sc-guide-title`. Opening was queued in the Codex browser. Fresh rendered screenshots and phone visual acceptance remain unverified because direct browser-control tools are unavailable. No publishing was performed.

## Remove duplicated Study plans section

At the user's request, the duplicate Study plans tab, its render branch and its section description were removed. Today is the sole home for tasks, exam dates, habits, courses and their guide. The four sections are now Today, Progress, My groups and Account & data. The existing data and commands are unchanged.

Legacy `view=learning` entries resolve to Today through the shared section resolver and have the retired view parameter removed with `replaceState`, preserving other query parameters and the hash. Sync, sign-in and personal-preference entry behaviour is retained. Keyboard navigation derives its order from the four remaining tabs.

Build cache `1099c6ff89fc2bb6`; **14 relevant tests passed**, including legacy-section resolution, all four loaded sections, single-instance tools/guide and authenticated loading. Four preview URLs returned 200 with exactly four center tabs and no retired tab. The HTTP tab count was scoped to the center navigation because the complete document includes other tab controls. No functional model, persistence, permission or indexability changes; no publishing. Preview: `http://127.0.0.1:4314/account?preview=single-today`.
