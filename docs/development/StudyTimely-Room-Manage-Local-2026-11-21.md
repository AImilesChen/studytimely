# StudyTimely room management, local implementation

Implemented the user-approved Manage plan on 21 November 2026. Local changes only; production remains V2.45.0. The existing unrelated FocusGuide.jsx working-tree status is preserved.

## Behaviour

RoomManage replaces the folded allowance/theme panels and duplicated Room settings dialog. A main column contains directly editable room details and the real member/place list. A warm invitation panel contains the actual owner-only link, code, invitation switch and explicit code replacement. On narrow screens invitations come first. The header Room settings action focuses the same room details form. Inside Manage, Members focuses the matching member row/list rather than opening another management surface. Writes lock local tab switching and the room back action until completion.

One room-details save updates name, study theme and pinned notice through the existing home endpoint. Presets work without custom review; custom text keeps the existing review and access rules. Drafts survive version conflicts and failed requests. Explicit reload adopts the latest settings. Saved-but-refresh-failed states are distinguished from write failure and have a refresh recovery action.

Members show owner/co-host/member identity and actual online/studying/read-only states. Free-place checkboxes include the owner as a fixed place. Explicit empty selections are preserved; membership changes invalidate a pending seat selection until reviewed. Changes affecting active free participants ask for confirmation and retain study records. Eligible owners can assign/revoke up to two existing co-host roles. Member mute, eviction, block and unblock use existing server routes and confirmations for removal/blocking. Capacity is editable when allowance permits it. A single active room has no redundant room-choice dropdown; multiple rooms expose the existing versioned free-room selection below daily controls.

Ordinary members see room information and their own exit without owner invitation fields. Inactive owners get read-only information, access-selection recovery and the existing ability to close a room. Closed rooms show retained information without editing controls. Room reports load automatically when Manage becomes visible, with real empty/loading/error states and room-scoped actions. Reports concerning an owner stay in platform moderation. Platform review capacity and global queues remain in the existing directory-level moderator area, outside this room-management surface.

The optional shared finish-time controls were retained under Study together after removing the duplicated settings dialog. Personal nickname/ranking/message preferences retain one account link. Room rules are visible below the examples and the existing safety shortcut focuses them. Closing is separated at the bottom, explicitly irreversible, with confirmation.

## API changes

- PATCH /api/community/rooms/:id/home accepts an optional room name and saves it atomically with theme/notice. Existing callers without name retain their current behaviour. Review failures save none of the fields; final session/access/version guards remain.
- PATCH /api/community/rooms/:id/settings accepts narrow section payloads for invitation, capacity and close. Unknown/cross-section fields are rejected. Independent mutations use current stored fields and the supplied version, avoiding accidental writes from unrelated client drafts. Legacy full-settings callers remain supported. Close always disables invitations.
- GET /api/community/moderation?room=:id filters in SQL before LIMIT and excludes owner-subject reports from this room view. Existing account/owner/moderator authorisation remains. Unfiltered platform moderation is retained.

No schema migration, new dependency, configuration, OAuth, tracking, paid resource or production mutation was performed.

## Guidance and styling

RoomManageGuide gives three visible native illustrations and concrete invitation, place-selection and member-handling examples below the actual tools. They are labelled illustrative and contain no pretend clickable buttons or private records. Public /study-groups includes #group-room-management in initial HTML and its guide navigation. Private query routes remain noindex/no-store. Warm white, coral controls, shared typography, clear labels, focus treatments and 44px controls follow the approved style. No screenshot artwork or generic icon-card grid was added.

## Verification and limits

- Final local build: 56 pages plus 404, noindex preview. PWA 71e36edbbf2fd505, 76 precached resources. Existing chunk-size and mixed-import notices remain.
- All 721 existing/new tests passed, including atomic details, rejected custom review, owner/CSRF permissions, independent invitation mutations, stale versions, closing, scoped reports, role-aware rendering, free-place defaults and initial public management content.
- Six isolated compiled-Worker/D1 scenarios passed via scripts/verify-room-manage-local.mjs. The script created its own synthetic private room/member and closed the room after the checks. It never contacts a public origin.
- All 62 HTTP checks and six group route/content/privacy checks passed on http://127.0.0.1:4312.
- Git diff whitespace check passed. No commit, push or deployment for this task.

Preview: http://127.0.0.1:4312/__test/group-preview. Choose a synthetic room owner, then Manage. An in-app preview-opening request was queued. Browser interaction tools are unavailable in this session, so actual clipboard clicks, focus behaviour and desktop/mobile rendered screenshots have not been verified. Source/SSR/API assertions are not represented as browser acceptance.

The old 4310 service was absent. A restricted hidden restart failed module access, and a subsequent hidden process accepted sockets without serving requests. Only task-owned failed processes were stopped. An authorised local Wrangler foreground session with an isolated registry on 4312 responds normally and is retained for preview. Existing isolated fixture state is preserved. Never deploy this test Worker.


## Button and state clarity follow-up

Applied the approved screenshot review to the existing two-column layout. Untouched details now show a readable saved status. Editing reveals a primary Save changes action and an unsaved label; reverting values returns to the saved state. Draft comparison ignores metadata and place ordering, while retaining version and membership conflict checks. Native validation, reviewed custom text and error recovery stay in place.

Invitation copying is separate from joining: eligible active owners can copy the existing link when invitations are paused or the room is full. The panel states the joining restriction explicitly; server membership and invitation limits are unchanged. Copying has a lock and copying/copied/manual-fallback feedback next to the action. The invitation switch has a labelled 48px track, a 44px hit area, keyboard focus treatment and explicit on/off text. Replacement is a visible outlined action with its existing confirmation. If replacement saves but refresh fails, stale invitation values are withheld until refresh succeeds.

Owner place is fixed text rather than a disabled checkbox. Member place labels explain current study access or the free place retained after advanced access. Changed rows show a pending label. A nearby action strip counts affected members and explains read-only/timer consequences before Save place changes. Idle repeated capacity/empty-place copy was reduced to the membership summary and saved-place status. Member mute/remove/block controls are full labelled buttons with distinct normal, accented and destructive treatments. Disabled controls retain readable text. Existing confirmations and server operations are preserved.

Final preview build cbaf34e817b4cb9a rendered 56 pages plus 404, noindex, 76 precache resources. Thirty-four related room UI/manage/backend tests and seven public-content tests passed (41 total); the earlier full 721-test run predates this follow-up and was not repeated. Sixty-two HTTP checks and six group-content/privacy checks passed on 4312. Ten declared light/dark primary, secondary, destructive, saved-status and disabled-label colour pairs passed a 4.5:1 text threshold, minimum 5.16:1. This palette check does not establish whole-page accessibility or rendered visual acceptance. Evidence files use room-manage-controls-2026-11-21 prefixes under the ignored evidence directory.

The preview portal responded HTTP 200 at http://127.0.0.1:4312/__test/group-preview. Browser control remains unavailable; final click/clipboard/focus/mobile visual acceptance is pending, and the queued in-app opening is not represented as inspection. No backend, database schema, production or release configuration changes were made in this follow-up. No commit, push or deployment occurred. Production remains V2.45.0. Preserve the unrelated FocusGuide.jsx state.


## Personal preferences shortcut spacing correction

The user's supplied screenshot exposed a global-style collision: the account shortcut used a footer element, inheriting global footer horizontal/bottom padding and 12px anchor styling. Replaced it with a scoped account-preferences section containing a short heading, plain explanation and the existing /account?view=community link styled as a visible action. Removed obsolete rm-footer rules. Narrow layouts stack the explanation and full-width action. Account functionality, room permissions and the separate close-room section are unchanged. All 29 existing related UI tests and the local build passed. No browser visual acceptance, deployment or production change is claimed.
