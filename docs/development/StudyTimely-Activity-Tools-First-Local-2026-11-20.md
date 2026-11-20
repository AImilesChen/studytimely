# Study activities: tools first, examples below

Local redesign on 20 November 2026. Supersedes the tutorial-first ordering in StudyTimely-Activity-Visual-Guide-Local-2026-11-20.md. Not committed, pushed or deployed; production/package remain V2.40.0. Existing unrelated edits are preserved.

## Result

The room navigation leads directly to the activity heading, toolbar and full-width current activity. The toolbar has the existing refresh/plan actions and a How to use link that scrolls to and focuses the lower tutorial heading. The activity keeps its original task, timer, result forms and permission-aware controls.

Activity summary and other records follow the current activity in a separate responsive section. The selected ended activity no longer repeats in its own history list. The no-booking alternative is a compact text action. The lower tutorial uses two columns of image/text steps on desktop and four sequential image/text rows on phones. Extra tutorial frames, current-step badges and duplicated introductory text are removed. Time and privacy answers remain directly visible below; scheduled/started/ended timestamps now belong to the activity summary. Existing screenshots and enlargement Dialog are retained.

Changed in this pass: RoomActivities.jsx, ActivityWalkthrough.jsx, RoomWorkspaceNav.jsx, room-activity-guide.css and the existing UI test's guide selector. No backend, schema, API, entitlement, timer engine, dependency, asset, account configuration or protected adapter change. No production records or local study/result submissions were made.

## Verification

- Local build: 56 pages plus 404, noindex; final PWA 8d33fda157b47cfc, 76 resources.
- 43 existing room UI/navigation/activity/content tests passed after the structure changes. 62 existing HTTP route/asset/robots/sitemap/license checks passed. Final CSS width fix verified in the browser; diff check passed. No new test suite or framework added.
- Actual in-app browser: free owner, ended activity, existing 30-second record and pending result; Add result opens the original form, Cancel returns to the control. Summary exposes original totals, member record, timestamps, JSON download and repeat entry. Example modal/Escape and How to use focus/scroll checked.
- Light/dark desktop inspected at 1280×900 CSS pixels. The pending-result button ends at y=798.45 and is visible before any examples. The examples begin below the full activity/records area. Captures are 1265×889, DPR 1; scrollbar/capture bounds explain the difference from CSS dimensions.
- Phone 390×844: document width 375, no horizontal overflow; original result form fits with a 302px content width. Phone 320×740: an initial 345px toolbar overflow was found, fixed with a bounded wrapping toolbar, and rechecked at 305px document width / 273px toolbar width. Room tabs intentionally scroll internally. Phone content remains tools → records → examples; no claim that every tool fits the narrow first viewport.
- Browser console warnings/errors empty. Temporary viewport reset and the free-room activity preview tab retained. The fixture Worker must never be deployed.

Preview: http://127.0.0.1:4308/__test/group-preview → free owner → Study activities.

## Design QA

final result: passed

Source: the user's current screenshots codex-clipboard-00e451e5-fdb8-4e54-97c2-41f8beb4788c.png and codex-clipboard-5bdb8a3d-0130-47ba-b61c-6e499e27c007.png in the supplied Temp directory, plus the approved tools-first arrangement. Both source screenshots and both final captures were opened together in the same comparison input. Source images are supplied crops at different scales; this is a hierarchy/reflow redesign rather than a pixel-identical clone. The final free-owner ended activity uses the same existing record as the source.

Evidence directory: G:/CodexHome/visualizations/2026/11/20/01a1f805-75b4-74d2-a8ea-bee79e06a206/activity-audit/.

- 21-final-tools-first.jpg: final usable work area above the tutorial.
- 20-final-cases-below.jpg: final lower reading section and privacy answers.
- 19-tools-first-dark.jpg: dark theme, same current record.
- 16-phone-result-form.jpg and 17-cases-below-phone.jpg: phone interactions and reading order.
- 18-tools-first-320.jpg: corrected narrow toolbar and internal tab scrolling.

Typography retains Inter and the existing room palette, with a 24px page title, 22px activity title, 24px confirmed-time value and 14–15px instructional copy. Spacing establishes the tools/reading boundary; shared edges align the toolbar, work area and tutorial. The main current action retains its apricot emphasis. Tool, tutorial and privacy sections have distinct visual roles, with fewer nested surfaces. Screenshot captions preserve real action names and opening modes, descriptive alt text and explicit sample context.

Iteration findings fixed: tutorial displacing actual tools; sidebar height creating imbalance; duplicate selected activity in history; double padding on the expanded work surface; 320px toolbar overflow. Post-fix desktop/phone captures were inspected. No current P0/P1/P2 findings remain. Earlier planner visual acceptance and independent community/moderation/main-promotion gates remain separate. Physical devices and full assistive-technology conformance are not claimed.

## Single-summary alignment follow-up

User reported a visibly left-heavy summary area. CSS-only fix removes the old 720px cap when no other activity directory exists. Desktop uses a full-width information bar with identity/count/member on the left, explanatory copy in the middle and the original native summary toggle at the right. Expanded details remain below; <=900px stacks naturally with a static toggle. The tools/examples boundary is tightened from 48px/32px to32px/28px. Existing multi-record grid and all activity handlers are unchanged.

Local build56+404noindex/PWA d34693395abd847a-76 and diff check passed; no new tests for this low-impact CSS change. Actual IAB1280x900 collapsed/open summary and320x740 open/closed checked; desktop bar1201px, action44px high, phone summary273px/document305px in320viewport. No overflow or data submissions. The supplied screenshot and final desktop capture were opened together. Evidence:22-summary-balanced-desktop.jpg and23-summary-balanced-phone.jpg in the existing activity-audit evidence folder. Current scoped final result: passed. Still local only, no publication. Temporary viewport reset and tab retained.

## Always-visible summary redesign

User explicitly rejected the remaining summary disclosure and the disconnected expanded layout. Replaced the native details/summary with a default-visible Activity summary/Participants panel. Header keeps the count and original export/repeat handlers; three aligned group metrics lead into member records and session timing in two columns. Existing real data, status derivation, exports and private-reflection export notice retained; no personal tasks or reflections added to member rows. Removed obsolete one-summary positioning/width overrides. Background, border and radius now match the upper activity panel; both dark backgrounds measured rgb(32,44,52).

Build56+404noindex/PWA0bafe1c7f1acf8dd-76,43existingroom/activity/content tests,62HTTP and diffcheck passed. IAB1280x900 light/dark panel1201px/two columns581.94+529.06/three equal metrics383.66px, zero details or hidden elements in summary. Repeat opens original booking dialog and Cancel makes no booking.320px document305px/panel273px; fixed wrapped30sec value by displaying compact metric rows below360px; all values26.25px high and zero folds. Consoleempty. No study/result/API/DB/policy/production mutation; theme restoredlight,viewportreset,tabretained.

Current scoped final result: passed. Supplied dark screenshot and final dark capture opened together; input is a crop, not a pixel-clone target. Evidence:24-summary-visible-phone.jpg,25-summary-visible-dark.jpg,26-summary-visible-light.jpg in the thread activity-audit directory. This supersedes the preceding collapsed information-bar follow-up. Still local only; independent acceptance gates unchanged.

## Summary colour hierarchy follow-up

User approved functional soft colour groups. Kept the always-visible structure and original handlers/data, adding Phosphor labels and scoped colour roles: green participation, blue group time, amber submitted-result count; a fully submitted nonempty count uses the green completion role. The blue time metric has a1.2width share and30px value versus26px on desktop for other metrics. Member records use a soft green-gray surface; session timing a neutral gray-blue surface. No extra borders around these inner groups. <=600px uses coloured label/value rows; long dates wrap naturally at320px.

Local build56+404noindex/PWA bf03074ebd3b11bb-76,16existingUItests and diffcheck passed. Actual IAB1280x900 light/dark,390x844 and320x740 inspected.320doc305px/panel273px; no child reaches outside viewport and metric values remain single-line. Eight sampled actual foreground/background pairs contrast5.86–8.37; this is sampled colour evidence, not full accessibility conformance. Summary still has zero details/hidden elements. Console empty; no study, result, export or booking submission. Viewport reset/theme restoredlight/tabretained. Local only; production2.40.0 unchanged.

Current scoped final result: passed. Before25-summary-visible-dark.jpg and after28-summary-colors-dark.jpg opened together at the same1280x900CSS/DPR1 state (1265x889content captures). Statistics, member/time labels and action hierarchy inspected together. New27-summary-colors-light.jpg and29-summary-colors-phone.jpg also inspected. The additional surface padding and modest numeric emphasis are intentional; no currentP0/P1/P2 findings. Earlier independent gates remain unchanged.
