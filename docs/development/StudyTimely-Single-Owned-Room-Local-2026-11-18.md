# Room ownership tiers — local correction, 18 November 2026

Expiry behavior below is superseded by [Subscription access](StudyTimely-Subscription-Access-Local-2026-11-18.md): retained extra rooms and places are read only, rather than continuing paid participation.

Implemented locally; uncommitted, unpushed and undeployed. Production/package remain V2.30.0. This handoff supersedes the earlier same-day interpretation that subscribers also had a one-room ownership limit.

## Confirmed policy

Free accounts can own one open room, with four members including the owner. A trusted active subscription grants up to ten open owned rooms, with capacity determined by the existing member_limit entitlement (8/12/24 as provisioned). No subscription can be claimed through client request fields. Joining others remains subject to the existing ten-total-membership and anti-abuse creation-rate limits; those policies were not expanded in this task.

An expired/revoked subscription falls back to one owned open room and four-person admission rights. Existing rooms, members, themes and recorded history remain. New room creation is blocked while at or above the current ownership allowance. Closing a room frees an ownership slot without deleting retained records; renewal restores the ten-room allowance. No Stripe/payment activation or new public entitlement-provisioning endpoint was added.

## Implementation

communityEntitlements now returns roomLimit1/10 from the trusted active entitlement row. GET /api/community/me includes roomOwnership.limit/openCount for the authenticated account. POST /rooms retains same-ID retry semantics, checks the authoritative count/entitlement and inserts with the server's final creation timestamp.

The unpublished 0011_single_owned_room.sql migration now enforces the tiered insert limit through a current trusted-entitlement lookup at that server timestamp. Ownership/reopening updates also have an entitlement-aware guard. Concurrent inserts cannot overfill; expired/revoked rights at insertion cannot rely on the earlier API precheck. Existing rows are not rewritten. Ordinary settings updates and closure remain allowed for grandfathered rooms.

The creation form shows the current allowance and capacity policy. At the limit it shows existing-room links, with initial keyboard focus targeted there. A ROOM_LIMIT conflict refreshes account information. FAQ and error text explain the separate free/subscriber limits and retention after expiry.

## Verification

Final local noindex build:56routes+404, PWA1c517447e12771a0,62resources. All393 tests passed, including ten ownership-policy/migration tests. Tests cover free1/subscriber10, exact tenth-room concurrency, trusted12-person capacity, forged request rights, same-ID retry, subscription expiry/renewal, final-write expiry/revocation, competing insert after precheck, independent joining, close/replacement with preserved credit, legacy three-room migration preservation, ownership/reopen guards and foreign keys.

Final actual isolated Worker/D1/DO HTTP acceptance verified seven groups: free1, denied second free room, trusted subscription10 allowance, a second12-person room, expiry preserving rooms/members, expiry rejecting creation, and renewal restoring creation. No timer was started. All62 HTTP/SEO/resource checks passed; git diff --check passed. Synthetic entitlements are test grants, not real billing acceptance.

Final local migrations0001–0011 were applied to a fresh synthetic DB ending0033, persistence app/.wrangler/room-tiers-2026-11-18. The earlier DB0032 on4305 contains the superseded one-room-for-all trigger; do not use it for final tier acceptance. Final fixture4306/__test/group-preview provides synthetic roles; its owner has three test rooms and a synthetic12-person/10-room grant. No production migration or user data change occurred. Fixture config, grants and registry are local-only and must never be deployed.

Ignored evidence: docs/development/evidence/room-limit-2026-11-18/, including tests/build, final tier-integration.json, tier-migrations.log and http.log. Browser control remains unavailable in this turn: no screenshot/keyboard/viewport UI acceptance is claimed, and native Windows automation was not used.

## Future publication

Record the correct production D1 recovery point and inspect migration history, then apply0011 and release the matched Worker/frontend. Do not apply the superseded local-only trigger definition. Existing rows must remain. An application rollback can retain the new database guard, but older UI advertises three rooms; any deliberate ownership-policy rollback needs a separately reviewed trigger change, not a full database restore. Existing real production-community and main-promotion gates remain independent.
