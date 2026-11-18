# Subscription expiry and participation — local implementation

18 November 2026. Uncommitted, unpushed and undeployed; production/package remain V2.30.0. This supersedes the preceding local handoff's expiry behavior: retaining a room no longer means retaining its paid participation rights.

## Rules implemented

- Free ownership: one active room, up to four participating places including the owner. Active trusted subscription: up to ten rooms, with8/12/24 participating places according to member_limit. Free guests use the room owner's rights, not their own subscription. Existing membership-count and creation-rate protections remain.
- Once an entitlement ends, extra rooms and excess places become read only. Memberships, retained messages, themes, tasks and credited records stay; retention periods are unchanged. Timer starts, quick/free-text messages, reactions, presence changes and activity mutations require current participation rights. Joining a read-only room is blocked.
- Owners can choose the free room and up to three other free participants. Defaults are the earliest open room and earliest joined eligible members, with stable ID tie-breaks and the owner included. A saved explicit seat list is authoritative; an empty list keeps only the owner active. Selecting future defaults while subscribed does not restrict the active subscription.
- Changing free access pauses affected timers and preserves confirmed history. Closing/deleting a selected room falls back to the next eligible oldest room. Renewal restores eligible rooms/places without re-adding people who left or restarting timers. A lower renewed capacity enables only that many current places.
- Read-only members retain history access, reporting, blocking, own-message deletion and leaving. Owners retain safety moderation, free-access selection and room closure. No automatic kicks/deletions, unsolicited messages or payment activation were added.

## Implementation and interface

New0012 creates owner-scoped room preferences and adds free-seat selection fields to rooms. Existing unshipped0011 remains the corrected free1/subscriber10 creation guard. Central room-access SQL is reused by room APIs, reviewed writes, activity writes, joins, timer starts/credit settlement and live presence updates. It evaluates current owner entitlement and selected room/seats rather than trusting browser flags. Anonymous responses omit owner-only selection IDs.

Room snapshots expose effective access and each retained member's readOnly state. Member cards distinguish read-only places from offline users. The room displays a read-only notice, current-plan controls, free-room dropdown and free-place checkboxes. Current subscription expiry gets an owner-only in-page reminder during the last seven days; no email, push or background reminder service is claimed. Access refreshes every30seconds, on live updates and after a read-only denial. Buttons are disabled/hidden consistently while retained conversation and safety controls remain available.

Selections use exact-session ownership checks, optimistic versions, member validation and60 selection attempts/hour. Membership changes refresh the checkbox roster so departed selected members do not occupy invisible draft slots. Backend guards remain authoritative if a client is stale or offline.

Room timer settlement is shared with daily maintenance. Paid timer deadlines are bounded by the grant expiry; a later renewal cannot backfill the expired interval. On heartbeat, room read or maintenance, disallowed timers settle only through the valid boundary and pause. Disconnected gaps retain the existing90second protection. Session counters add only ledger rows actually inserted, preventing a permission race from showing uncredited time. There is no claim of an exact-time push to an offline client: expiry is effective at authorization/credit checks, and UI catches up on refresh.

Account export includes the owner's room preference and owned-room free-seat fields; account deletion cascades the new preferences. Public guide and privacy copy describe retained data and restricted participation.

## Verification

- Full suite **403 passed**, including ten ownership tests and ten subscription-access tests. After that full pass, the final UI-only roster-draft filter was rebuilt and HTTP-checked. Final build56routes+404, noindex, PWA `f4987de3afdfb7c3`,62resources.
- **62 final HTTP/SEO/resource checks passed**, plus git diff --check. No dependencies, protected Sites adapters, tracking configuration, real OAuth credentials or production resources changed.
- Coverage includes expiry/renewal,8/12/24 capacities reverting to four, extra-room locking, owner/selected-seat defaults, stale versions, CSRF/other-owner denial, exact expiry credit, maintenance, credit-insertion revocation, reviewed-message expiry, invite/insertion race, retained reporting/exit, export and cascade deletion. Previous room/history/timer/moderation tests also passed.
- Ten actual local Worker/D1/DO integration groups passed: subscribed12-person capacity with six current members; future free-room/seat selection; expiry locking; rejected timer/message use; retained history/reporting; switching the free room; four participating/two read-only places; privacy deletion; renewal restoring both rooms/all six eligible places without starting a timer. Grants were synthetic local data, not real billing. No UI timer was started by this integration.
- In-app browser control is unavailable in this turn. No screenshot, keyboard or viewport acceptance is claimed; native Windows automation was not used, preserving the user's preference.

Ignored evidence: `docs/development/evidence/room-limit-2026-11-18/`, especially access-full-tests.log, access-integration.json, access-http.log, access-migrations.log and build.log. Final isolated DB ends0034, persistence `app/.wrangler/room-access-2026-11-18`, localhost4307. All12 migrations were applied there only. Earlier local DB0032/0033 and ports4305/4306 contain superseded policy/schema and are not final acceptance. The final synthetic host has two12-person rooms and a current trusted grant; one room retains six members. The fixture is never production code.

## Publication requirements

Publication is not performed in this task. A future release must record the correct production D1 recovery point/history, apply the reviewed0011 and additive0012, then deploy matching Worker/frontend together. Keep existing rows. Before rollback, assess that V2.30.0 and earlier lack expiry/seat restrictions; rolling back application code can re-enable paid usage of retained groups even if the additive schema remains. Prefer a forward fix or a matched access-preserving rollback. A full database restore is a separate incident decision, not a presentation rollback. Real Google/two-person production acceptance, external moderation activation and main promotion remain independent pending gates.
