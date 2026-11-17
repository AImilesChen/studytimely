# Study chat updates — local implementation, 17 November 2026

Implemented locally on the existing dirty working tree. No commit, push, production migration, release, plan change or additional external inference. Production remains V2.26.0 with free-text review paused. Earlier 32-call and 120-call synthetic evaluation scopes are exhausted; this work uses only local synthetic provider responses.

## Behaviour

- Four shared server-controlled message IDs resolve to fixed English study updates: Starting study, Goal completed, Taking a break and Need help. Unknown IDs are rejected. Added text goes through normal free-text rules and external-review handling, and is not stored as a trusted template. Client bypass flags confer no authority.
- Both paths require an accepted Google-linked member profile, configured platform moderator, a live session, an open room and unmuted membership. The same three-per-10-second-window and 30-per-UTC-hour limits apply. Publication rechecks room/session/member permissions. Request IDs are idempotent and conflicts include template identity.
- Fixed updates remain usable during review outages/capacity pauses. They never start/pause a timer, complete a task, create activity attendance or award credit. A latest visible fixed update can appear beside its author for 30 minutes, within the latest 50 retained/unhidden/unblocked messages; it is labelled Shared and is self-reported.
- Chat remains collapsed by default and closes while the member studies. Four icon-labelled actions replace draft-appending emoji buttons. Free text has a counter, preserves failed drafts, and uses clear status feedback. Rules, provider disclosure and quiet announcements live in a secondary disclosure. Exact capacity remains platform-moderator-only.
- Approved exact text can reuse a verdict for five minutes. Cache keys are HMACs over exact server-reviewed text, policy version, provider, model/API identifier and Azure resource origin. No raw text, account or room identifiers enter cache records. Local checks and size validation run before every cache lookup. Expired/malformed/wrong-policy entries and failed DB reads cannot approve text. Rejected, malformed and unavailable provider outcomes are not cached. Cache hits do not refresh TTL and do not bypass the CF capacity/circuit pause. Concurrent identical misses may still invoke more than one review; existing atomic reservations bound spend.
- `REVIEW_POLICY_VERSION` must change when local rules, prompt, response parsing or thresholds change. Model/provider/resource changes alter the key. Cache rows expire logically at five minutes and are physically removed by subsequent successful cache writes or daily maintenance, potentially one cleanup interval later. Privacy disclosure and group guide reflect these behaviours.

## Schema and configuration

New additive migration `0008_review_cache_templates.sql` adds nullable constrained `community_messages.template_id` and `community_review_cache` with expiry index/maximum five-minute TTL. SHA-256: `d01c450bc9532f93a6bfdd1be855cb996191f8da63f8c9004b4b95b5cca61585`.

Applied only to isolated local D1 `studytimely-cf-review-synthetic` (ID ending 0027), absolute persistence `app/.wrangler/cf-review-optimize-2026-11-17`. Production still has migrations 0001–0006; 0007 and 0008 remain unpublished. Daily CF app budget remains 5,000 Neurons with conservative reservation/circuit safeguards from the preceding local work. This is not an account-wide Cloudflare spending cap or a verified real-time free balance.

## Verification

- 351 automated tests passed, including ten new template/cache/authorization tests and the previous 200-case local-rule corpus. Covers two members, forged IDs, appended text, shared limits, retries, mute/removal/closed room/logout, no-credit semantics, safe cross-member reuse, expiry, policy/provider/model/secret invalidation, local-rule precedence and cache failures.
- Build passed: 56 routes + 404, local noindex, PWA `69913543e457500c`, 62 resources. 62 HTTP/asset/robots/sitemap/license checks passed. `git diff --check` passed (existing CRLF conversion warnings only).
- Real local Worker/D1/Durable Object integration passed seven groups using synthetic review binding: two members see safe text; exact repeated text causes no extra review attempt/spend; obfuscated contact is not published; capacity pause is enforced; semantic block/outage/circuit fail closed; fixed update still works and retries idempotently during outage; room timer remains independent. Script `app/scripts/verify-cf-review-local.mjs` is localhost-only and adjusts only isolated local test state. The script closes its temporary private room.
- In-app browser verified initial collapse, fixed status sending without credit, continued templates during simulated review outage, blocked contact draft retention, ordinary safe send/clear, desktop and 390px/320px responsive layout. No horizontal overflow and captured warning/error logs empty. All accounts/messages are synthetic; this is not independent real Google/production moderation acceptance.

Evidence: ignored `docs/development/evidence/cf-review-optimize-2026-11-17/`: `tests.log`, `build.log`, `http.log`, `local-integration.json`, `quick-updates-desktop.jpg`, `quick-updates-phone.jpg` and final narrow-screen evidence. Previous live evaluation files in that directory describe the earlier bounded experiment, not new calls in this turn.

Preview entry: http://127.0.0.1:4295/__test/group-preview . Choose the Chinese owner/member entry; a direct private room URL requires its matching synthetic session. Do not deploy any fixture Worker.

## Remaining before a future release

User publication instruction, normal backup/migration preflight for 0007/0008, matching frontend/Worker deployment and production binding/configuration verification. Real two-person Google room/chat/moderation acceptance remains independently pending. AI limitations remain; local rules, reports, mute/removal and fail-closed review supplement rather than guarantee safety. No manual review queue is introduced for capacity failures.
