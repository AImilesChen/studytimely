# Study companions — local handoff, 17 November 2026

Implemented locally on `v2-google-community`, based on documentation HEAD `cdc4295`. Changes are uncommitted, unpushed and **not deployed**. Production remains V2.27.0. No Stripe, paid plan, production database, credentials, DNS, analytics or protected Sites adapter changed.

## Room experience

- The first room view has a four-seat companion board beside recent messages and quick communication. Own timer controls are visible. Activities, room overview, totals and moderation remain in expandable secondary sections; an activity invitation still opens its activity section.
- Members see connected timer, break, ready, check-in-needed and offline states. These describe connection/timer records, not proof of attention. Shared quick messages cannot start timers, finish tasks or earn credit. Session display remains provisional until server settlement.
- Ten fixed English messages are grouped into Check in, Encourage and Study together. Server-controlled catalogue IDs resolve text. The three silent interaction types are tap, cheer and celebrate. No custom effect payload, sound, external review or push notification.
- Reminder preference is per room. Focusing, offline or opted-out recipients cannot receive a new interaction. Blocks, membership, room closure, mute, session and CSRF checks apply. Atomic rolling cooldowns: same pair five minutes, recipient one minute, sender two per minute across rooms. Recipient-only fresh events animate with reduced-motion support; a sent notice does not claim a read acknowledgement.
- Mobile uses a single readable seat column, compact empty seats, short Start label and a real quick-message anchor. Desktop keeps the board and communication side by side. Original page width/theme system is retained.

## Capacity and future subscription entitlement

Free rooms default to four places including owner; offline members retain places. Existing rooms retain their members/capacity after entitlement expiry, while joins/restores are capped by effective owner rights. Public directory and invitation previews use the effective join limit. Room creation and resizing require server entitlement; joins and restores recheck the limit in their final SQL operation. Existing limit of three owned open rooms and ten memberships is unchanged.

Free users may join an entitled larger room. Free-text sending is an **author entitlement**, independent of the owner’s capacity. It also requires normal automatic review and moderation; final message insertion rechecks entitlement expiry after asynchronous review. Existing messages stay readable to other members. The current free UI has no unusable text composer or purchase button.

`community_entitlements` is trusted future provisioning groundwork only. There is no public grant, checkout or subscription endpoint. No real user has been assigned a paid entitlement. Historical review/accounting unit suites use an explicitly named subscribed fixture; new tests exercise the default free path, expiry, forgery, concurrency and revocation. The localhost UI fixture remains free.

## Data and code

- New additive migration: `app/migrations/0009_study_companions.sql`. Adds entitlement records, room availability/reminder preferences, a new catalogue ID column preserving the original message constraint, ephemeral interaction events and atomic cooldown triggers.
- Applied only to isolated local D1 `00000000-0000-0000-0000-000000000028`, persistence `.wrangler/study-companions-2026-11-17`. Production migration 0009 is pending.
- New modules: `server/community-entitlements.mjs`, `server/companion-actions.mjs`, `src/lib/companion-model.mjs`, `src/components/StudyCompanions.jsx`, `src/study-companions.css`.
- Existing community API, member capacity, quick-message catalogue, account export, guide/FAQ and policies updated. Presence heartbeats now propagate refreshes at a room-throttled rate; client refresh requests coalesce without losing a trailing notification.
- Interaction metadata expires after ten minutes and is purged on subsequent interaction writes or daily maintenance. Feed contains only the intended recipient’s fresh unblocked effects. Account export includes own preferences, retained interactions and entitlement metadata; account deletion cascades these records. No raw draft text is stored for interaction events.

## Verified

- Final preview build: 56 pages + 404, noindex, PWA `8fea3412f51b9d3b`, 62 resources. Existing bundle-size and mixed static/dynamic storage-import warnings remain.
- `npm test`: **362/362 passed**, including 11 companion tests, legacy review/accounting/activity safety and own export/deletion isolation. An earlier test/build overlap read a changing dist tree and failed a robots assertion; the final complete suite ran after the build and passed.
- Final HTTP check: **62 checks passed**, including routes, assets, robots, Sitemap and notices. No production requests or actual model calls were made for this change.
- Actual local Worker + D1 + Durable Objects with independent synthetic sessions: capacity/forgery/fifth join, fixed messages without AI, arbitrary-text gate, connected peer timer, focus suppression, real elapsed credit, break, recipient-only effect/refresh, cooldown, opt-out, own export and last-socket offline transition passed.
- In-app browser: default desktop, 1920×1080 desktop, 390×844 and 320×740 phone layouts; no page horizontal overflow. Verified sending encouragement, starting/pausing own timer, peer timer state, focus-disabled interaction buttons, received celebration notice, saved interaction preference, quick-message anchor, owner capacity display, secondary moderation and reversible synthetic member removal. No new browser warnings/errors in final log check.
- Final local D1 readback: zero running timers; `PRAGMA foreign_key_check` returned no rows. Timers in screenshots are actual elapsed synthetic test sessions, not seeded learning results.

Evidence (ignored): `docs/development/evidence/study-companions-2026-11-17/`, including integration result, local QA helpers and inspected desktop/phone screenshots. Build/test logs are in `app/.wrangler/companions-*.log`.

## Preview and next release

Open `http://127.0.0.1:4297/__test/group-preview` and choose the host or member synthetic identity; no new room or real Google account is needed. The in-app room tab is retained as a deliverable. The old preview ports/databases were not reset.

Publication was not requested for this revision. A later authorised release must back up/check the production D1 binding, apply 0009 before matching Worker/frontend publication, preserve old members/data and verify actual production configuration. Do not deploy the localhost fixture Worker/config. AI review remains disabled on production until separately verified and enabled; subscription enforcement must not be bypassed to test it. Real two-person production acceptance and the independent main-promotion gate remain pending. Payment provisioning and billing are deferred.
