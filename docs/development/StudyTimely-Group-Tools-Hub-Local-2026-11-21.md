# Group tools hub — local implementation, 21 November 2026

Implemented the approved functional-entry and public-content plan locally. Production/package remain V2.44.0; no commit, push or deployment. Preserve the unrelated FocusGuide.jsx working-tree status.

## Implemented behaviour

Advanced tools is now Group tools. Four real, keyboard-focusable entry buttons open the existing task board, recurrence, challenge and atmosphere components. The same entries remain available to inspect descriptions and retained content without granting write access. Four emoji/filled-colour cards use a two-column desktop grid and single-column media rule. Active rooms initially show the current tool; Close tool returns focus to its entry. Weekly reports and room capacity/co-hosts navigate through existing callbacks. No fake counts or study totals are inserted.

Access information is directly visible, explains owner/member roles, closed/read-only states, free basics and account-wide optional preview scope. Enabling is explicit, displays progress and remembers the chosen tool. Preview refresh now retrieves account and selected room directly rather than depending on public-directory loading. The POST uses an optional AbortSignal with a15second deadline. Ambiguous network/timeout outcomes require access refresh before another enable attempt; a saved-but-refresh-failed state does not prompt another grant. A later confirmed active state clears recovery flags so subsequent expiry is not mislabelled as a pending save. Other account requests have no new timeout by default. No server grant or entitlement rule changed.

Existing tool writes distinguish server save success from subsequent reload failure: saved work is acknowledged and the form closes; reload errors ask for refresh. Custom title review, manager/member controls, recurrence/date preview, timer-credit calculations, privacy, CSV and audio opt-in remain unchanged. Empty retained task boards explain read-only access. No audio or room timer was started in browser acceptance.

## Public content and images

/study-groups has a new #group-tools-guide anchor, initial-HTML tool purposes, four operation paths, access rules, visible answers and a labelled revision-routine example. Existing activity/weekly sections remain. Title/description name shared tools and qualified optional-preview scope; no new route or fabricated review/schema/price. Private query noindex/no-store and public canonical policies stay unchanged. Development build remains noindex. No GSC/Bing/GA4 platform acceptance or ranking claim.

Four JPEGs under app/public/images/group-tools/ are unmodified native local-IAB screenshots of synthetic task completion, saved recurrence, zero-progress challenge and atmosphere controls; each1265×712. They were captured after real local operations. No external/generated image or fabricated study credit. CSS focus windows show relevant controls from these originals in both guide thumbnails and dialogs; this is presentation cropping, not altered screenshot pixels. Earlier Browser screenshot clip calls returned top-left regions instead of intended offsets and were rejected/overwritten by native full captures. One early recurrence modal shot clipped the header/dates and was also rejected. Native source captures can include surrounding unrelated controls; the guide uses labelled focus windows, not a claim of pixel-identical cloning.

## Verification

- Full704unit/SSR/API tests passed before the last focus-window, close-focus and recovery-flag refinements; final24related tests passed after those changes.
- Existing12compiled local Worker/D1 scenarios passed: explicit preview, owner/member/co-host boundaries, task participation, recurring dates, challenge, CSRF, expiry/read-only, export and local cleanup. No production database contacted.
- Final build56pages+404, preview noindex, PWA681a68a19b02e65c/76.62HTTP checks passed on that build. Four source image responses matched exact local bytes; public initial content, unique IDs and private-query noindex/no-store checks passed.
- Actual IAB verified free owner selecting a retained board without a grant, explicit free-preview enable and subsequent active controls, creating/joining/completing a task, recurrence preview of next three dates and saving a series, opening its edit form, creating a600minute challenge with genuine0progress, applying a scene without audio and opening recommendation editing. Async save/load results were read again after settling; initial intermediate DOM was not treated as final.
- Remaining acceptance: the browser-control tool became unavailable during final reload, after it initially showed the loading shell. Therefore final whole-page visual, light theme, phone layout, final CSS focus windows, image dialog/Escape/close-focus and post-refinement recovery interaction are NOT browser-verified. Member/expiry boundaries are covered by server/SSR tests, not a fresh member browser session. Do not label visual QA fully passed or borrow old screenshots as final whole-page evidence.

## Environment and handoff

Isolated synthetic preview: http://127.0.0.1:4310/__test/group-preview. The portal selects free owner/advanced owner/member; never deploy this fixture. An initial restricted4308Worker failed to compile but kept the port listening; the confirmed task-owned stale process was stopped and4310worked. A hidden task-local preview process was later retained after tool/session changes. No real account or production timer/result/message/goal/room/grant/preference writes occurred.

Ignored evidence: docs/development/evidence/group-tools-hub-2026-11-21/ (build, full/final tests,12scenario log, exact assets/content, HTTP, preview logs). Screenshot assets are product examples, not production evidence. All existing independent planner/community/moderation/main-promotion/release gates remain separate. Further deployment requires final acceptance and a user publication request.

## Approved illustrated workspace revision, 21 November 2026

Environment is local preview at http://127.0.0.1:4310/__test/group-preview. The user selected the generated warm paper, coral and hand-painted design reference exec-79ba5d1d-ca6a-4fe4-8957-eca8c0b2f35a.png.

RoomGroupTools now presents four illustrated sidebar entries beside the active workspace. Eligible organisers get an automatically visible creation form on first opening a tool. The task form places subject and task together, keeps the custom-title checkbox adjacent to its label, and uses the existing saving and participation APIs. Preview activation is explicit. Drafts stay mounted across activation and recovery. Inactive rooms can prepare a recurrence and preview dates locally with the existing date model, with server permission required for saving. Each workspace includes a visible illustrated lesson, and public initial HTML includes all four lessons. Room explanatory copy covers the shared routine and personal privacy.

GroupToolsGuide, GroupTools, RoomGroupTools and group-tools-hub.css contain the final presentation. Relevant existing UI and public-content expectations were updated.

Four original illustrations were generated using the built-in image generation tool. Full-resolution originals are in G:/CodexHome/generated_images/01a1f805-75b4-74d2-a8ea-bee79e06a206. Web exports are app/public/images/group-tools/tasks-art.jpg, series-art.jpg, challenge-art.jpg and study-art.jpg. Their combined size is 237854 bytes.

Prompt set used the approved reference as style guidance with warm pencil and gouache texture, coral, ochre and olive accents, an ivory background, and legible thumbnail composition. Subjects were a study notebook with two reading partners, a repeating desk calendar, a target beside a partly filled progress bar, and a library window with headphones. All four prompts requested standalone artwork without text or interface screenshots.

Final build succeeded with 56 pages and 404, local noindex, PWA 683ca77f8d25ef06. Fifty relevant activity, advanced-access and room UI tests passed, followed by 23 final room UI and public-content checks. Twelve isolated local D1 scenarios and 62 HTTP checks passed. Current served CSS, JavaScript and all four illustrations matched the built files exactly. Eight text/background pairs in each theme had minimum measured contrast 5.13 to 1.

Visual acceptance is pending because the in-app browser control capability is unavailable in this session. The preview panel open request was queued. Desktop, phone, keyboard, draft preservation and save interactions for this final illustrated UI still require direct browser observation. Automated checks cover source rendering, data rules and HTTP behaviour. Production version remains the previously recorded V2.44.0 deployment.

## Full-width guidance and editorial content follow-up

The approved whole-page revision moves ToolLesson outside the two-column workspace. Sidebar entries have a shorter consistent minimum height and the navigation surface follows its own content height. Room atmosphere uses one integrated media preview with a scene caption, name, track and controls beneath the image.

GroupToolsContent supplies visible purpose descriptions, three illustrated use cases, a four-step study routine, an accessible recording comparison table, five answered access/privacy questions and related learning links. It is reused in the room and public /study-groups initial HTML. The earlier short room footer and overlapping public routine/answers were replaced. Editorial sections use the toolbar’s warm surfaces, coral accents, serif headings, dividers and existing artwork.

Final build 7183787566fc2f65 completed with 56 pages and 404. Twenty-three room UI/public-content tests, six group-page HTTP checks and 62 shared HTTP checks passed. Public lesson count, unique editorial anchors and served CSS/JavaScript exact bytes were verified. The group-page HTTP script contained two obsolete pre-existing copy expectations. Those were updated to the current functional introduction and progress guidance before the successful rerun.

Direct desktop and phone visual review is pending because this session has no available in-app browser control capability. Preview open request was queued. This follow-up is implemented locally.

## All four tools expanded on one page

The user requested direct access to every tool. RoomGroupTools now renders the tasks, recurrence, challenge and atmosphere workspaces together. The illustrated sidebar contains in-page anchors with scroll and heading focus. Draft forms remain mounted when using the directory. All four illustrated lessons follow the workspaces, before the existing editorial content.

GroupToolsProvider loads one shared room snapshot. Each panel retains its own form, notice and error, while a shared mutation lock serialises writes and a reload updates all four panels. Existing standalone report and organiser callers use the same provider through GroupTools. Workspace, heading and inline form IDs are unique per tool. The obsolete selected-tool state was removed from Community.

Final local build c6b00d87e1fd45c3 completed with 56 pages and 404. Fifty related room UI, advanced tool and activity tests passed, including all four simultaneous regions, anchor targets and permission boundaries. Twelve local D1 scenarios and 62 HTTP checks passed. Direct browser interaction and desktop/phone visual acceptance for this final expanded layout are pending. Preview panel request was queued at the existing local portal.

## Final clarified interaction, single selected tool

This supersedes the preceding all-tools-expanded revision. The user clarified that selecting one tool on the left should display only that tool on the right. RoomGroupTools now uses selectable illustrated buttons and renders one keyed GroupTools instance. Its matching illustrated lesson sits below the whole workspace, followed by GroupToolsContent. The active menu entry has a visible coral selection treatment. Automatic forms have an accessible label without a repeated visible New task/appointment heading.

The unused all-tools board and anchor navigation were removed. Saving disables tool switching until the pending operation completes. Standalone reports and organiser tools retain GroupToolsProvider. Seventeen room UI tests verified one selected workspace and matching lesson for each of the four possible initial tools. Six public-content tests and 62 HTTP checks passed. Build 027e4ad345420f95 contains 56 pages and 404 in local preview mode. The existing portal serves the local build. Browser click-through and final desktop/phone visual acceptance are pending because in-app browser control is unavailable in this session.


## Direct atmosphere controls and editable group goal

Implemented the approved two-tool flow while retaining the single selected workspace. Room atmosphere now shows background and music selectors, scene preview, Use scene, Play/Pause and volume together. Personal controls require an active room place, independently of advanced access. Applying a scene does not play audio. Organisers can explicitly save the selected combination as the room recommendation. Shared publication still requires advanced access; eligible owners see explicit preview activation beside saving. Draft choices survive activation. The existing quiet-chat preference is retained.

Shared challenge is labelled Group goal throughout the tool and its lessons. Current progress and settings appear together. The owner or an eligible co-host can edit target and deadline without ending the goal. The POST challenge endpoint now supports version-checked updates to those fields and preserves kind, original start day and recorded time. End current goal has a separate confirmation. It returns the pane to a new-goal form. Owners with invitations open can copy the existing private room invitation from the goal pane, with copy success/failure feedback. No public goal URL is introduced.

Concurrent changes retain the draft and expose a deliberate reload action. Existing authorisation, CSRF, room boundary, final-write entitlement/session checks and counting rules remain in force. No schema migration, new dependencies, production mutations or deployment occurred. The matching illustrated lessons and public editorial descriptions now explain these controls.

Final local build b3506dc4fff821e9 completed with 56 pages plus 404. All 62 focused tests passed (room presentation, public initial HTML, advanced tools and activities), including free personal controls, simultaneously visible goal settings, version conflicts, fixed metric, preserved original start/progress and permission denial. The compiled local Worker passed 13 isolated D1 integration scenarios, including goal edits and stale updates. All 62 HTTP checks and six group route/privacy/initial-content checks passed. Existing build chunk-size/dynamic-import notices remain. Git diff whitespace check passed.

Preview: http://127.0.0.1:4310/__test/group-preview. The in-app preview opening request was queued. Browser interaction tools remain unavailable in this session, so actual music playback, clipboard clicks and final desktop/mobile visual acceptance are not claimed. Prior unrelated working-tree changes are retained. Production remains the existing release.
