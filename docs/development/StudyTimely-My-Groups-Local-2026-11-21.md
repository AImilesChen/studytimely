# My groups — local implementation, 21 November 2026

Publication update: this local handoff and its room-selector follow-up were published in V2.49.0 on 21 November 2026. See [verified release record](StudyTimely-V2.49.0-Release.md). The local-only status below records the earlier handoff, not the current production status.

## Scope and status

Implemented the user-approved My groups plan at `/account?view=community`, applying practical-visual-design to the existing Study Center. This is local development after V2.48.0; production and the package version remain unchanged. No publishing, migration or production-user operation was performed. Preserve the unrelated FocusGuide.jsx working-copy status.

The working page replaces the former room-link list plus duplicated discovery/ranking cards. Desktop has a room-selection column and one selected room workspace. On narrow screens a native, labelled room selector precedes the working controls; the duplicate sidebar is hidden. The actual timer, invitations and activity controls remain visible. Apricot identifies the study desk, honey identifies joining, and rose identifies access/confirmation issues. Existing study-partner art and cat stickers are reused without an icon-card grid.

## Working flows

- My groups defaults to an existing running room timer, then a usable preferred room, then an available room. Distinct same-name rooms retain their IDs. Selecting a room only changes the view; a running timer is not moved, started or stopped. An active timer in another room has an explicit return action, and foreign tab/device leases cannot be paused here.
- The selected workspace displays the actual room theme/notice, members and timestamp-derived online/timer states, own timer controls, confirmed room contribution and shared goal. Stale updates have an explicit refresh state. Room totals use UTC and remain separate from personal browser records.
- Room inactivity, missing member place and room closure have different explanations. An owner can explicitly confirm a version-checked free-room switch with its timer/access consequences. Member-only or closed-room views do not pretend to offer activation or studying.
- Owner invitations are available only for an active open room with invitations enabled and an open place. Clipboard failure exposes the actual link for manual copying. Room changes discard the copy state, including late clipboard callbacks. Members never receive the owner invite code from room details.
- The invitation form accepts a valid code or same-site invitation URL, previews the room, explains full/read-only rooms and requires explicit sharing acknowledgement. Joining never starts a timer. Public discovery is filtered by theme, name and available place, loads more in place, and excludes private rooms.
- Creation uses visible name/theme/visibility fields, a four-place initial capacity and an explained 120-minute initial shared daily goal. The preset theme saves with creation atomically; uncertain retries reuse the same request ID. At the ownership limit, a clear allowance explanation replaces an unusable create form.
- A new community profile can be created inline with the existing age/rules acknowledgement, a nickname and ranking off. Temporary join/create drafts are tab-local, account-scoped and expire after ten minutes. A sign-in/link flow initiated here can return to My groups; an unavailable public room gets an actionable notice rather than a silent lost selection. A user who deliberately switched to another account section is not forced away from that section on login completion.
- The next activity can be reserved inline with a private task. Joining remains distinct from starting one's activity timer. Organiser scheduling/start/management and other detailed tools remain in the existing full room; the page labels where those controls are. This is not a second copy of all room navigation.
- Three default-visible illustrated guide steps, a labelled ordinary-session example and two expanded answers explain the exact buttons, read-only rules and zero-minute state. The guide has no fake clickable controls.

## Shared contracts and boundaries

`MyGroupsClient` composes existing community endpoints, serialises mutations, rejects stale/disposed reads, preserves error drafts and scopes its data to the current authenticated identity. `useMyGroups` subscribes to selected-room updates and reuses existing room leases and heartbeat rules. `room-timer-client.mjs` is also consumed by the full Community room page, preserving one shared start/pause/heartbeat wire protocol. Credit settlement, caps, check-ins and authority remain on the server.

The existing `/me` room summary gains theme, creation time and effective-place metadata. Creation accepts an optional validated preset subject and inserts it atomically using the existing column; omitted subject retains the old general default. Invitation preview gains an authoritative read-only flag. These are additive contracts; there are no new endpoints, schema changes, subscriptions or reviewer activation. Existing CSRF/session/owner/member/version and final-write checks remain in force.

The public `/study-groups` guide gains a prerendered explanation of finding and returning to a usable study group, linked to My groups and the existing access guide. Personal account/query pages stay noindex. No private room content is added to public search content or Sitemap, and no automated partner matching is advertised.

## Validation

- Final full local regression after responsive/copy-state polish: **774 passed, zero failed**, including 14 new client/API/render cases.
- New controller tests use the real community API and isolated D1 helper: atomic themed creation/retry, explicit invitation consent, full/retained rooms, free-room switching with correct timer settlement, foreign leases, activity task privacy, duplicate writes, disposed/stale reads, heartbeat teardown and scoped draft expiry.
- Render checks cover ready/read-only/member/closed/foreign/loading/error states, real forms and reservation controls, absence of extra navigation, and the read-only illustrated guide.
- The localhost-only `scripts/verify-my-groups-local.mjs` passed six compiled local Worker scenarios: synthetic nickname setup, themed creation, consent-based private joining, real lease start/pause, private activity reservation and anonymous private-room rejection. No real Google login or production data was used.
- Final build `11d0955cf9943450`: 56 prerendered pages plus 404 in local noindex mode. Existing bundle-size/import warnings remain. No dependencies or protected Sites adapters changed.
- 62 HTTP route/resource checks and the six existing public-group/privacy checks pass. The new public guide is present in initial HTML and account HTML remains noindex. Source formatting checks pass.

## Preview and evidence limits

Preview: `http://127.0.0.1:4318/account?view=community&preview=my-groups-ready`.

The ignored local proxy's explicit `/__preview/my-groups` entry prepares only the existing localhost synthetic free-owner fixture and redirects to this account view. It has a localhost-upstream guard, stores no credentials in source and must never be deployed. It reuses the isolated 4312 fixture Worker. The helper is outside production entries and ignored by Git.

The browser diagnostic at 14:16:45 UTC confirmed a nonempty React root, selected room, two room choices, two illustrations and actual timer/invitation controls. Distinct study/invitation surfaces were painted. At the observed 619-pixel viewport, document width was 604 pixels, with no page-wide overflow. Final native-selector changes are checked separately below. These callbacks are runtime/geometry evidence, not screenshots or full click-through acceptance.

The final callback at 14:21:41 UTC again confirmed the selected room and its timer/invitation controls, two illustrations and five form fields including the new narrow-screen selector. The React root was nonempty, no error/rejection event was recorded, and document width stayed 604 at the observed 619-pixel viewport. The final 62 HTTP checks and six public-group/privacy checks passed against this build.

Direct browser-control tools are unavailable, so no fresh desktop/phone screenshots, manual clipboard behaviour, OAuth round-trip or full accessibility certification is claimed. Existing runtime/API/handler/render evidence remains distinct from those unverified checks. Matching frontend and Worker should be published together when the user requests release. Never deploy the test fixture or diagnostic helper.

## Room selector visibility follow-up

The user identified that the desktop room list blended into its background. Each room choice now has its own filled surface, complete border and 12px separation. The selected room uses a high-contrast peach fill in dark mode or rust fill in light mode, with explicit “Viewing this room” and a decorative check. Unselected choices show “View room” and an arrow before hover. The heading and existing narrow-screen native selector say “Choose a room”; room readiness remains a separate status. Switching still calls the existing on-page selection handler and does not start or transfer a timer. Keyboard focus has a visible offset outline.

Calculated opaque colour contrasts: selected text 8.85:1 dark / 6.79:1 light; option borders against their outer sidebar 3.14:1 or better. These calculations are not a full accessibility audit. The existing 18 targeted client/render/account-readiness tests passed, as did a fresh local build and 62 HTTP route/resource checks. New preview cache: `c042ef8bff7f0635`. Preview: `http://127.0.0.1:4318/account?view=community&preview=clear-room-choices`. No fresh visual screenshot or manual click-through is claimed. This follow-up remains local and unpublished.
