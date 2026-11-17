# Study room usability — local implementation, 17 November 2026

Status: implemented and verified locally; uncommitted, unpushed and undeployed. Production remains V2.29.0. Package version is unchanged.

## Result

- Quick-message categories have a strong selected fill. Message buttons use a separate background, clearer borders, 14px labels and larger targets. Existing study-cat assets and finite animations remain in use.
- A room toolbar exposes Members and owner Room settings. Ordinary members have Leave room here. Owners can also open a member's controls from the member card's labelled ellipsis button.
- The member dialog shows connection status, recent connection time, last retained UTC study day, and recorded minutes. The new last-study-day metadata is returned only to current room members. These records do not establish attention or learning.
- Owner controls distinguish Remove from room from Block rejoining. Removing frees the place and permits a later ordinary invited return. Blocking prevents return until the owner chooses Allow rejoining. Allow rejoining does not add the member, restart a timer or reserve a place.
- Departing members' timers pause and their activity participation is withdrawn; credited study history remains. Ordinary members can leave explicitly and receive a success confirmation without a false private-room access error.
- Activities have one heading, current-step guidance, a visible personal task after joining, a collapsed task editor and compact live progress. Detailed participant records and secondary progress remain available on demand. Room settings moved from the long lower page into a top-triggered dialog.
- Mobile member actions use full-width rows. Shared daily progress has a compact summary; no goal/timer accounting rules changed.

## Backend and compatibility

Existing member PATCH accepts `evict`, `ban` and `unban`. Legacy `remove` (block) and `restore` behavior are retained for old clients. Final mutations recheck the live session, membership, current owner/admin role, target owner protection and room closure atomically. Existing legacy restore capacity protections remain.

No migration, new dependency, payment integration or reviewer activation. Existing migrations 0001–0010 are sufficient. Release the matching Worker and frontend together. Source/privacy guide describes the new member visibility and access behavior. Owner transfer and automated inactivity removals were not added.

## Verification

- Full suite: **383 passed**, including eight new member-management tests. The full run preceded the final ban-error wording, owner-card loading guard and mobile CSS refinement. The final eight functional tests passed after the two functional/copy changes; CSS-only refinement was then rebuilt and verified in the browser.
- Final local build: 56 pre-rendered routes plus 404; noindex preview; PWA `d6d36e250f1ad5c1`, 62 resources.
- Final HTTP verification: **62 route/asset checks**, robots, sitemap and licenses passed. `git diff --check` passed before this handoff and is rerun after documentation.
- Synthetic local Worker/D1/DO preview: owner card menu, removal confirmation, released place, invited rejoin, member-only Leave room, successful departure, block/invitation rejection, blocked list, Allow rejoining without silent membership, explicit rejoin, scheduled activity join/task display, and room settings save/restoration were exercised in the in-app browser.
- Keyboard Escape closed the member dialog and returned focus to its card trigger. Desktop light/dark, 390px and 320px were checked; no horizontal overflow. At 320px member actions were readable single rows after the final CSS correction. At desktop the quick-message labels measured 14px and buttons 52px high.
- A fixed Starting study message was sent only in the disposable local room and appeared with its cat sticker. No timer was started during this acceptance; both final member timers showed 00:00:00. Final browser warnings/errors were empty, dialogs closed and viewport override reset. IAB tab29 was retained as a deliverable.

Evidence (ignored): `docs/development/evidence/room-usability-2026-11-17/`, containing test/build/HTTP logs and actual screenshots. Do not treat these as production or real Google authentication evidence. Full accessibility, production two-person participation and actual external moderation remain independent pending acceptance.

## Preview

Open **http://127.0.0.1:4303/__test/group-preview** and choose host or member. This local fixture already supplies a room and two synthetic accounts; users need not create another room. Fixture config: `app/tests/fixtures/wrangler.members-local.jsonc`, isolated synthetic database ending0031, persistence `.wrangler/room-usability-2026-11-17`. Do not deploy this fixture.

Production resources, real member data, credentials, reviewer settings, AI usage and public Git were not modified. Free room size and subscription availability remain unchanged.
