# StudyTimely V2.46.0

Published 21 November 2026 at https://studytimely.com/study-groups. This supersedes the local Manage implementation, action-clarity follow-up and account-shortcut spacing correction.

- Runtime commit: e5aeefb36626074fb543140a05194941d57c2b4b, tree 6c0ab9c1516de7f8c8cc93206c299a39f6c0bfe2, branch v2-google-community.
- Worker version: e808bc02-2099-48f8-8721-9fde8a30a25b.
- Deployment: 6402c652-b627-4a79-b126-2feb2884eb98, created 2026-11-21T09:15:57.367984Z, 100% traffic.
- PWA: c4b4baf3deb1339a, 76 precache resources. Live community pages remain outside the offline cache.
- Rollback: V2.45.0 Worker db29e11e-da34-427d-882d-ef91ef7e1d43. No database restore is required.

## Published behaviour

Manage now directly displays room details, member/place controls and an owner-only invitation panel. The header Room settings shortcut focuses this same form. A single active room has no redundant free-room dropdown. Eligible organiser controls, inactive/closed room states, ordinary-member views and existing safety confirmations are retained. Room reports load within the current room; global platform moderation remains outside this room surface. Personal nickname/ranking/hidden-message preferences have a compact, clearly labelled account link that no longer inherits site-footer spacing. The optional shared finish-time controls remain under Study together.

Details show a readable saved status until values change, then a primary save action. Reverting a draft restores the saved state. Place changes identify affected members and explain the consequences next to Save place changes. Owner place is fixed text. Mute, removal, blocking and invitation replacement have explicit button treatments. Invitations show on/off status and a visible switch. Active eligible owners can copy a link while joining is paused or the room is full; server joining limits remain enforced. Clipboard states and fallback instructions are adjacent to copying. Stale invitation values are withheld after a saved-but-refresh-failed replacement until recovery succeeds.

The existing home endpoint optionally saves the room name atomically with theme/notice under existing review/version/access checks. Narrow invitation/capacity/close payloads on settings preserve independent stored fields and reject cross-section fields. Close always disables invitations. Room-filtered moderation queries filter before LIMIT and leave owner-subject reports to platform moderation. No schema migration or new dependency is needed.

Three visible native illustrated examples and a public #group-room-management guide explain invitation, seats and member handling. Private room/invitation queries remain noindex/no-store. Preset themes remain usable when custom text review is paused.

## Verification

- Final release build: 56 pages plus 404. Wrangler dry run passed. All 725 release-mode tests passed.
- Six compiled local Worker/D1 scenarios passed, using new synthetic accounts and a private test room that was closed afterwards. No real Google identity, production room data or external content reviewer was used.
- Candidate and production each passed 62 HTTP checks and six group route/content/privacy checks. All 175 public HTML/non-audio/video resources matched their exact release hashes.
- The matching published bundle contains the direct Manage controls, action states, invitation switch and compact preferences component. The public guide appears in initial HTML. Synthetic endpoints remain 404; protected APIs, including room-filtered moderation, reject anonymous access. The existing Google provider remains available.
- Deployment metadata confirms all traffic on the new version. All 12 resource bindings, handler names and runtime settings match the prior Worker. Keep-vars was used.
- Previously checked ten light/dark action and state palette pairs have a minimum text contrast of 5.16:1. This is not a whole-page accessibility claim.

Browser-control tools remain unavailable in this session. No fresh production screenshot, authenticated clickthrough, clipboard, keyboard-focus or mobile-layout acceptance is claimed. Source, SSR, local API and production HTTP/hash checks are recorded separately. No authenticated production timer, room, invitation, member, report, goal, grant or preference write was initiated for verification.

No migration, credentials, OAuth, DNS, paid resource, tracking, protected adapter or fixture deployment changed. The existing unrelated FocusGuide.jsx working-tree status remains excluded. Prior independent planner/community/moderation/main-promotion gates stay separate.

Ignored evidence: docs/development/evidence/room-manage-release-2026-11-21/. Source inventory: 476 files, SHA256 58d6ebb8d955ee5fb7672958441ceaf6049a846aaae0da8e2c729ba7e0b2d2e7. Artifact inventory: 217 files, SHA256 9da6066b23906ec4296c101407eedeec998e5b61fbcae00b037ac1c9df540480. Runtime source is pushed to the existing release branch; later documentation commits do not redeploy runtime. Never deploy local fixture Workers.
