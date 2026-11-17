# Group study activities — first-stage local delivery

The user authorized implementing the first-stage group learning workflow, with payment postponed. When asked about content-safety credentials, the user explicitly chose to complete the other functionality first. No real provider, Stripe, paid resource or production account was configured by this work.

## Current state and preview

Preview-entry correction after user feedback: the portable review link is now http://127.0.0.1:4290/__test/group-preview . It presents Chinese owner/member buttons and explicitly uses synthetic identities. GET is read-only; a same-origin POST issues only a local synthetic session and reuses the existing room/activity. If the isolated fixture is empty it creates an empty room and scheduled appointment, never fake time or results. Owner goes directly to the room; a member without membership receives the invitation confirmation first. The original private-room URL needs the matching session and is not a sufficient cross-browser handoff. This is fixture-only; production authentication/access is unchanged. Two focused tests passed, HTTP returned 200/noindex, and the in-app browser button opened the real retained local room/ended activity. The entry page is marked deliverable; accepted screenshot `guided-preview-entry.jpg`. Source: tests/fixtures/group-preview.mjs and group-preview.test.mjs. No application rebuild or production release was needed for this fixture-only correction.

Implemented and verified locally, uncommitted/unpushed/undeployed. Production and package remain V2.25.0. The current isolated preview is http://127.0.0.1:4290/study-groups. Its named fixture database is `studytimely-activities-synthetic`, persistence `app/.wrangler/group-activities-2026-11-17`; it is not the production database. The in-app browser keeps a synthetic owner's room open with two members, one ended activity, one cancelled activity and a future appointment. No QA timer is running. All profile acceptance in this fixture is explicitly synthetic; no real Google login or legal declaration was performed.

The local fixture has automatic text review disabled, matching the user's missing-provider choice. Its UI is marked as synthetic and no external review request is made. Never deploy `wrangler.activities-local.jsonc` or `v2-worker.mjs`.

## Implemented workflow

Room owners select a study direction and a preset pinned study notice. A visible copy-invitation button includes the selected activity when relevant. The directory's marketing hero remains on the public page; an opened room uses its own name as H1, so activity controls are higher on the page. General room totals and independent timing controls are retained in disclosures.

Owners schedule a single activity using a subject, type, explicit IANA time zone, date, focus interval (5–120 minutes) and break (0–30 minutes). The interface shows the organiser's time and the viewer's device equivalent, plus actual start/end times. Existing pinned zone rules and DST candidate resolution reject nonexistent times and require a first/second occurrence for ambiguous times. Appointments can be up to 180 days ahead; at most 20 are scheduled per room and creation is rate-limited.

Activities support scheduled/running/ended/cancelled states. Owners can edit before starting, start early with confirmation, end, cancel, and copy an old activity to a new future appointment. The room can have only one running activity, enforced by a unique database index. Card selection opens and focuses the selected activity's actual content. Timed activities have focus and optional break phases and are finalised lazily on API access after their deadline; no email or push reminder is implied.

Members explicitly register with one private personal task and a shared subject. Starting an activity does not register anyone, start their timer or award time. A member must start their own activity timer; existing exclusive account leases, connection checks, 25-minute check-ins and eight-hour UTC cap remain. The activity links to the same room credit ledger; its summary is not a second source of global ranking credit and never modifies personal browser learning history. Valid credit is bounded by the focus interval, early end, withdrawal or check-out. Breaks, registration and unverified connection gaps do not earn activity credit.

Members pause, withdraw or save a check-out (completed/partial/not started), with an optional private reflection. Check-out pauses the associated timer and prevents restarting that activity; a saved result can be corrected without adding time. Task/result drafts retain their own version and show a conflict/reload option if another tab changes the participation. Withdrawal permits rejoining while registration is open, retaining already verified results. Leaving or removal withdraws active reservations without erasing verified time. Closing a room ends its running activity and cancels scheduled activities.

Summaries distinguish reservations, members who started a timer, combined verified time and check-outs. Completion is explicitly self-reported, and timer participation does not prove attention or learning. Retained participants, subject and result are shown to current room members. A JSON summary download includes member-visible data and the requester's own private task/reflection, not anyone else's private text. Account export also includes own participation and organised activities; existing account deletion cascades through the new tables.

## Privacy and safety

Activity task and reflection text are stored server-side only after an explicit save; this is separate from manual personal-workspace cloud sync. They are available through the application only to their author. Other members receive nickname, subject, verified seconds and completion state. Activities and check-outs are member-only even for public rooms. Existing room-name, nickname and room-total visibility is unchanged.

Without external review, public activity titles are generated from fixed subject/type options and pinned notices are presets. Private task/reflection input has bounded length and local abuse/contact checks and is not sent to a provider. If configured in the future, optional custom public titles use the same text-only safety review as chat and fail closed. An unchanged previously reviewed title can be retained during an edit without resubmitting it. Free-text chat remains paused while review is disabled; this feature does not create an unreviewed public text channel.

New records expire during existing daily housekeeping after the later of their scheduled or actual start/end is more than 90 days old. Future appointments are not purged merely because they were created 90 days ago. The active privacy policy and terms describe activity storage, visibility, export, credit, review and retention. Existing free room limits (three open rooms, ten memberships and maximum 24 members per room), age/profile rules, ranking opt-in, payment and personal synchronization behavior are preserved.

## API and schema

Additive migration: `app/migrations/0006_group_activities.sql`, SHA-256 `3888765f0352d90764e65824bf2d76668df02b6e9e52d34eaa3fe2f4c25b0500`. It adds room overview fields, activity/participation tables, nullable timer/credit associations, a credit aggregate trigger, a scheduled limit and a unique running-activity index. All six existing/new migrations were applied only to the isolated local fixture.

- `GET /api/community/rooms/:room/activities`: member-only current/future and retained activities, at most 100.
- `POST .../activities`: owner-only creation with idempotent request ID.
- `GET .../activities/:activity`: shared roster/summary plus requester's own private participation.
- `PATCH .../activities/:activity`: owner-only scheduled edit with version check.
- `POST .../activities/:activity/start|end|cancel`: owner-only state transition with version check.
- `PUT .../activities/:activity/participation`: own task/subject save, version check for existing participation.
- `POST .../activities/:activity/withdraw|checkout`: own participation mutation with version check.
- `PATCH /api/community/rooms/:room/home`: owner-only preset subject/notice and room version check.
- Existing `/timer/start` accepts a validated activity ID; heartbeat and pause settle the same credit ledger.

All mutations retain existing session/CSRF checks. Missing auth/profile/membership and another-room activity access are rejected. Insertion/update guards recheck room/membership/activity eligibility; stale edits and invalid transitions produce 409, validation 400, forbidden actions 403, concealed private resources 404. Review-disabled custom public text returns 503. APIs keep existing no-store/noindex response headers. Room/invitation/activity query variants are not indexable; no new public route or Sitemap entry was introduced.

Key files: `app/server/group-activities.mjs`, existing community/account handlers, `app/src/lib/group-activities.mjs`, `RoomActivities.jsx`, `room-activities.css`, Community integration and invitation helpers. Group guide content was updated to describe the actual workflow. No dependency, protected Sites adapter, OAuth implementation, secret, tracking configuration or production resource was changed.

## Verification and evidence

Final functional build passed 328 tests. After the last layout/navigation refinements, the final build passed 27 targeted activity/invitation/safety tests and 62 HTTP/robots/Sitemap/license checks. All checks are local, not production acceptance. Final noindex build has 56 routes plus 404, PWA `2f421c25cfb44f49`, 62 resources.

Twelve activity tests cover DST/date boundaries, independent two-person credit, no automatic timing, private task/reflection isolation, membership/CSRF/owner checks, missing-provider fail-closed behavior, idempotent creation, version conflicts, unique active activity, cancellation, UTC midnight, break exclusion, disconnected gaps, withdrawal/rejoin, closed-room readback, 90-day future-safe cleanup, account cascade, concurrent reservation/start/end, duplicate heartbeat credit and SQL scheduled limits. Invitation tests cover join-before-private-room access and preserving activity selection after joining.

`app/scripts/verify-group-activities-local.mjs` exercised the actual local Worker, D1 and Durable Object runtime with two independent synthetic accounts, private invitations, exclusive timers, a real WebSocket upgrade/notifications, check-out/end settlement, exports and review-disabled operation. The six integration groups passed. It is guarded to localhost-only and never authenticates with Google or calls Azure.

Actual in-app browser QA used separate 127.0.0.1 and localhost origins to keep the two synthetic sessions independent while sharing one isolated local Worker/database. It covered room creation, direction/notice save, appointment creation, invitation copying and joining, private task registration, owner start confirmation, both members independently starting and pausing, refresh persistence, check-out visibility, manual end, summary reopening and download, copying, editing, past-time validation and cancellation. The completed browser activity recorded 15 host seconds and 11 learner seconds, 26 combined, with two check-outs. The downloaded JSON contained the owner's task but not the learner's private note. No timer remains running.

Browser QA caught and fixed a private invitation dead end when links contained both room and activity. The final helper explicitly joins before private content access and preserves the selected activity. A download-event bridge response took about 40 minutes despite the bounded call; the returned file was later read and verified, rather than treating the initial action as proof. No further download-event waits were used. An early mobile viewport was applied to the other selected tab; that capture was rejected and overwritten after verifying the actual layout tab's innerWidth.

Final layouts at 1440/768/390/320 had no horizontal overflow; 320px actions stayed inside the screen, and the modal's bottom Save/Cancel actions were visible. Desktop room width was 1280px. Final warning/error log read was empty, viewport reset to 1280px and the preview tab marked deliverable. Accepted screenshots: `desktop-room.jpg`, `desktop-summary.jpg`, `phone-room.jpg`, `phone-activity.jpg`, `phone-form.jpg`. Screenshots and local integration/download evidence are ignored under `docs/development/evidence/group-activities-2026-11-17/`.

## Deferred and publishing requirements

External Azure review remains unconfigured by the user's explicit choice. Real semantic review, real Google two-person participation, real production moderation, forced browser network recovery, production load and full accessibility/offline acceptance were not performed. Existing independent production community/main-promotion gates remain. Repeating activities, multiple administrators, advanced weekly reports, automatic invitations/reminders and payment remain later stages.

On a future authorized release, preserve the production database recovery point, apply only the incremental migration 0006 to the correct production D1 before deploying the matching frontend/Worker, and verify bindings, artifacts and actual account/room paths. Do not deploy a fixture or reset/drop production tables. Additive schema should be retained on a code rollback; pause/clear activity timer associations as appropriate before returning to an older Worker that does not understand them. Runtime production remains the published V2.25.0 until a separate verified deployment.
