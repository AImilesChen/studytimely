# Study group page refinement — local, 19 November 2026

Production remains V2.35.0. This work is uncommitted and has not been pushed or deployed. It builds on the existing local advanced-group implementation; migration 0014 remains local-only. No billing, entitlement policy, review service, dependencies, authentication permissions or production data were changed for this refinement.

## User-facing changes

- Room navigation uses consistent icons and semantic colours: mint for studying together, blue for activities/tasks, lavender for progress and repeating activities, slate for management. Challenges retain their apricot accent. Selection also has a border/indicator and accessible selected/pressed state.
- Replaced large empty-seat tiles with an available-places and invitation bar. The member and encouragement panels share top and bottom edges. Removed site-footer spacing inherited by the member status footer. In the inspected two-member room, the idle panels measured about 588px high, versus the audit’s 858px member panel. Temporary copy feedback adds a line to both aligned panels.
- Kept the recent three messages and quick-message controls in the right panel. Full conversation, reporting and chat/privacy controls open in a bounded dialog; Escape returns focus to the opening button. Existing sender access, review availability and safety gates are preserved.
- Room settings are surfaced in Manage, alongside reports, room theme, organisers and rules. Community nickname, optional ranking and hidden-member preferences now live in My Study Center → Community, with a compact room link. Internal navigation now preserves allowlisted account-view parameters, so the link actually opens Community.
- The public `/study-groups` guide now contains three usage steps, an optional local agenda builder, six feature cards, free/advanced-preview comparison, three practical scenarios, twelve expandable questions and links to real study tools. It explicitly distinguishes the free preview from a paid subscription and avoids claiming timer state proves attention.
- Updated public metadata, WebApplication and breadcrumb structured data. Room/invitation/activity query URLs retain noindex and no-store handling. Local builds remain noindex throughout.
- Fixed 320px room-menu overflow using two columns with wrapping labels. Main body copy is 14–16px; new secondary labels are at least 12px.

## Validation

- Final local build: 56 pages plus 404; PWA `45ca0cda0941ae7b`, 76 resources.
- 646 unit/regression tests passed, zero failures/skips. New meaningful coverage includes allowlisted account deep links, public guide initial HTML/schema and private query URL headers. Final CSS-only narrow-screen/type adjustments were followed by a fresh build and five relevant content/navigation tests, all passing.
- Final HTTP verification: 62 route/asset, robots, sitemap and licence checks passed.
- Compiled Worker with isolated local D1: all twelve advanced-group scenarios passed, including entitlement boundaries, role scope, task/attendance separation, repeat scheduling, reports and expiry. This uses synthetic accounts and disables real external review.
- Browser acceptance: light/dark room surfaces and semantic menus; matching panel geometry; invitation-copy feedback; quick-message category switching; conversation dialog and Escape focus return; Manage reports with empty-state feedback; Community deep link and successful preference save; shared-task, recurring-activity and progress/report content; public feature cards/FAQ expansion; local agenda edit/copy/readback.
- Responsive DOM checks at 320, 390 and 768px found no page overflow after the menu correction. At 390px the conversation dialog fit the viewport. Desktop visual inspection used 1280px. Full-page browser capture was unavailable; screenshots are actual viewport captures, not a claim of mobile screenshot acceptance. Browser viewport override was reset and the inspected light-theme room tab retained for review.
- No audio was played. The browser had no audio/video elements running and no warning/error console entries at final inspection.
- `git diff --check` passed (only existing line-ending notices). The pre-existing FocusGuide.jsx status/content is preserved.

## Review links and evidence

- Synthetic-account entry: http://127.0.0.1:4308/__test/group-preview (choose host or learner).
- Public guide: http://127.0.0.1:4308/study-groups
- UI evidence (ignored): `docs/development/evidence/group-refinement-2026-11-19/` — final room light, room dark, public feature cards and management captures.
- Logs (ignored): `group-refinement-build.log`, `group-refinement-tests.log`, `group-refinement-final-targeted.log`, `group-refinement-http.log` and `group-refinement-api.log` under `docs/development/evidence/`.

Real authenticated production acceptance remains pending. Never publish the fixture Worker or the local synthetic-account entry. Existing community, moderation and main-site release gates are unchanged. A later production release must include the previously pending advanced-group migration and its release checks; this task does not authorise deployment.

## Feature-icon refinement — same-day follow-up

The six public guide feature cards now use a dedicated SVG illustration component, `GroupFeatureMark.jsx`: reading partners, task clipboard/pencil, appointment calendar/clock, weekly journal, organiser badge and headphones/leaf. Removed the generic rounded-square icon containers; kept consistent ink outlines and mint/blue/lilac/cream fills. Marks are decorative and hidden from assistive technology because adjacent headings provide meaning. Existing functional-control icons, text, business rules and interactions are unchanged.

Final local build: 56 pages plus 404, PWA c01604bced1bd72e / 76 resources. Three existing group-content tests and 62 HTTP checks passed; no additional tests were added for this cosmetic change. Browser inspected light/dark at 1280px, confirmed all six marks, checked 320px without horizontal overflow and found no console warnings/errors. Viewport restored and the feature section retained for review. Actual screenshots are 07-feature-marks-light.jpg, 08-feature-marks-dark.jpg and 09-feature-marks-final.jpg in the existing ignored evidence folder. No audio, external assets, dependencies or deployment; production remains V2.35.0. FocusGuide.jsx pre-existing status preserved.
