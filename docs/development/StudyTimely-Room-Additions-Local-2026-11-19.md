# Restore the basic study room; advanced capabilities are additions

Implemented locally on 19 November 2026. Not committed, pushed or deployed. Production and package version remain V2.36.0. The user's explicit constraint is to preserve completed functionality and add advanced benefits on top of it.

## Preservation contract

- Keep the free room's four-place study-board experience. Do not replace empty seats with an aggregate invitation bar in a four-person room.
- Keep the existing personal room timer, presence/state, stickers, fixed messages, interactions/preferences, conversation/reporting/hiding, single-activity planning/participation, basic time/goal totals, member moderation, invitation controls and member exit.
- Advanced features must not replace the basic room, require preview activation to use free controls, or put disabled advanced controls at the top of the free study room.
- Keep one free active owned room/four places and existing eligibility/expiry/seat-selection rules. Do not automatically switch free rooms or enable the preview. Room/seat read-only status must be explained separately from inactive advanced features.
- Preserve the public guide, new public object icons, private-room noindex/no-store, existing data and current server-side safety/authentication limits.

## Implementation

`StudyCompanions.jsx` now uses the small presentation helper `companionRoster` in `room-presentation.mjs`. Free rooms retain a 2×2 desktop board, with actual members and individual empty invitation places. Larger rooms keep search/pagination and retained members; a quiet room starts with up to four visible places and an additional-capacity bar only where needed. Mobile uses a normal single-column page flow without a nested scroll container hiding half of the four places. No fictional participants or progress are introduced.

`Community.jsx` retains the existing functional components and callbacks. The default Study together view now also contains the same mounted `RoomActivities` instance and existing basic progress/goal components. Study activities and Group progress remain shortcuts to those components, rather than duplicate form instances. A task draft survived navigating away and back in browser verification. Room settings and Members are available directly from the room header.

An additional Advanced tools tab contains shared tasks, repeating activities, reports/challenges and scene/music controls using the existing `GroupTools` implementation. The free user sees an explanation and explicit optional-preview action, not disabled controls. Saved advanced content remains accessible through an explicit disclosure. Shared access follows the owner's entitlement; free guests in an eligible advanced room are not asked to activate their own room preview. Free-text eligibility remains personal and independently reviewed. Co-host controls remain in Manage; retained roles are still reachable after expiry. Advanced creation/edit controls use the existing active-access condition, while permitted owner role revocation remains available.

`RoomStudyAdditions.jsx` adds a contextual read-only explanation, a direct owner free-room selection button using the original versioned/confirmed callback, and a short room guide/FAQ/real tool links. Inactive-room copy names the selected free room; inactive-place copy does not incorrectly say the whole room is unavailable. Creation limits are still checked before room creation; the existing limit dialog now also offers the explicit preview route when available.

No server files, schema, API contracts, entitlement policy, timer engine, review service, account/sync implementation, dependencies, legal documents, public guide or Sites adapters were changed. `FocusGuide.jsx` retains its unrelated pre-existing status/content.

## Verification

- Final local build: 56 pages plus 404, noindex; PWA `229d3029577a37b7`, 76 resources.
- 657 full tests passed (646 existing plus eleven meaningful presentation/UI boundary tests). Final fourteen targeted presentation/UI/public-page tests passed after the final structural cleanup. The last change was only metadata-badge spacing, followed by a fresh build and HTTP checks.
- Eight new compiled-Worker/local-D1 basic-room scenarios passed: free participation without advanced access, timer start/pause, fixed message with external review disabled, single activity creation, creation-limit rejection, explicit preview addition, expiry preserving the free room, and explicit free-room switching.
- All twelve existing compiled-Worker/local-D1 advanced scenarios passed, including shared task/attendance separation, scoped co-host roles, recurrence, reports, expiry and export.
- 62 final local HTTP/SEO/asset checks passed. `git diff --check` passed.
- Actual in-app browser checked: four desktop places; free timer start/pause; fixed message/sticker; invitation copy; conversation dialog/Escape focus return; member moderation and room settings still present; task draft preserved across tabs; preview activation adds tools without replacing the room; preview end; explicit inactive-room explanation and confirmed free-room switch; restoration of the original free room; closure of the extra synthetic QA room; guide expansion.
- Responsive checks at 320, 390, 768 and 1500px had no page overflow. Four places remain two columns on desktop, one on phone. At 320px the conversation dialog fit the viewport. Light free-room and dark advanced-entry displays were inspected; all room-tab aria-controls targets existed. Browser page warning/error logs were empty at completion; viewport was reset and the local free room retained for review.
- All interactions used isolated synthetic accounts on localhost. The free QA timer recorded an actual 43-second test interval and is stopped; the account was returned to ready/free state. No audio was played, no production data or permissions changed, and no real external review call was made.

## Preview and evidence

Open http://127.0.0.1:4308/__test/group-preview and choose **以免费房主体验**. That local-only fixture route now has a distinct free-room entry alongside the existing host/member entries. Never deploy any fixture Worker or fixture login.

Actual screenshots are ignored under `docs/development/evidence/room-additions-2026-11-19/`: `03-final-free-room.jpg` is the accepted final four-place screenshot; `02-advanced-entry-dark.jpg` shows the independent advanced entry. The guide was verified through its rendered text/disclosure and also captured. Logs under `docs/development/evidence/` use the `room-additions-*` and `room-basics-*` prefixes.

Authenticated production acceptance and all existing independent release/community/main gates remain pending. A later explicit release requires a release build and production verification; this task does not publish the changes.


## Activity, progress and guide polish — 19 November 2026

Implemented the user's follow-up request locally. Production/package remain V2.36.0; no commit, push or deployment.

- Existing single activities now use a pale blue-gray workspace and a distinct panel, blue planning, green start/join, slate management and lavender participant details. Scheduled/focus/break/ended status labels are semantic. Disclosure rows have visible icons, borders, chevrons and open-state accents; activity updates expose a status message. Cancel remains a clearly labelled red action; its contrast on the light menu is preserved in dark mode.
- Kept the original activity handlers, scheduling rules, confirmation dialogs, form fields, membership/version checks and independent timer behaviour. Scheduled hosts can manually start after the original confirmation; no new time gate was introduced. The same RoomActivities instance stays mounted across basic tabs, retaining task drafts.
- Basic progress has three immediately visible figures: today's verified room time, shared daily goal and retained room time. There is one progress bar. Fractional progress is accurate: 43 seconds against 120 minutes shows 0.6%; a near-complete goal does not prematurely show 100%. Calculation/UTC/retention explanations expand below without repeating figures. Retained records are explicitly not a lifetime total or personal study history. Weekly reports remain a separate advanced destination.
- Guide cards have blue/mint/apricot action cues. Copy invitation respects existing owner/room/invitation access, returns visible success or clipboard-failure guidance, and never sends an invitation. Go to my place changes the tab, scrolls and focuses the existing control without starting a timer. Plan next activity opens the existing plan form; other members see View activities. Existing four FAQs/privacy content remain, with clearer chevrons/open states. Personal tool links remain; one duplicated full-guide link was removed and the independent management/safety destination clarified.
- No backend, schema, API contracts, billing/entitlements, review service, timer engine, storage, dependencies, media, legal/public guide, telemetry or production data changes. All previous restoration work and unrelated FocusGuide.jsx status are retained.

Verification: 660 full tests passed; final 14 focused presentation/UI tests passed. Final local build has 56 pages plus 404/noindex, PWA `3fb6ed62fe1c5832` with 76 resources; 62 final HTTP/SEO/assets checks passed. Eight basic, six activity and twelve advanced compiled-Worker/local-D1 scenario groups passed. The legacy activity verifier was updated to assert the current sender entitlement gate before explicit preview and unavailable-review gate after preview; runtime policy was not changed. Initial verifier failures were a default port mismatch and this stale assertion; the corrected final run passed. Activity scenarios covered registration privacy, host-only start, two exclusive real timer leases, checkout/end settlement, no duplicate credit, account export and Durable Object updates. No real user data or external review was involved.

Actual IAB acceptance: light/dark activities, management expansion, participant disclosure, guide/FAQ expansion, 0.6% progress, invitation-copy success, guide-to-original-plan dialog/cancel/Escape, private task draft retained, and return-to-place focusing Start studying while the stopped timer stayed at 00:00:43. Final room retained all four seats, 0 studying, no audio/media playback, no warning/error console logs. Widths 320/390/768/1280 had no horizontal page overflow; 320px plan dialog measured 288px wide, within viewport. Mobile management and progress fit. Viewport reset to 1280 and the free-room tab retained. Sampled new control text/background contrast ratios: plan 5.85, participate 4.98, cancel-on-menu 5.86, join disclosure 7.13, participant disclosure 7.55. Other prior production acceptance/release/community gates remain independent.

Actual screenshot evidence in the existing ignored evidence directory: `10-activities-light.jpg`, `11-progress-guide-light.jpg`, `12-progress-dark.jpg`, `13-activity-mobile-dark.jpg`, `14-progress-mobile-light.jpg`, `15-guide-light.jpg`. Current logs use `activity-*`. Entry remains http://127.0.0.1:4308/__test/group-preview → 以免费房主体验. Never deploy the fixture login/Worker.
