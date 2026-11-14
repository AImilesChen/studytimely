# StudyTimely V2.7.0 production release

Published to https://studytimely.com/study-groups on 2026-11-14. The learning-group landing, create/join entry, invitation handling, local session agenda, regional-independent guide and ten FAQs are live. Rooms default to eight members including the owner, with 4/8/12/24 shortcuts and custom capacity 2–24. Offline memberships retain places. Attendance distinguishes membership, online presence and fresh active study timers.

## Source and runtime

- Public repository: https://github.com/AImilesChen/studytimely/tree/v2-google-community
- Runtime source: `16b954d4e7acb01ca00f7ac88a6d4b4871f20071`.
- Exact Git tree: `40b6d1694c15cbafc20d857d9b8e834e63216516`.
- Worker version: `d5052831-304a-4337-af8c-63ab88e57495`.
- Deployment: `f093383d-137d-4167-ad1e-8f28fda0baa5`, created `2026-11-14T16:29:59.101838Z`, verified serving 100%.
- PWA: `bee0e1191341484a`, 61 precache resources. Community pages remain online-only and outside offline precache.
- Artifact inventory SHA-256: `ae47d4b44f8d50369d25493b07962e69329f107935f38a6d5b5bda5e7768190e`.

The normal GitHub connector denied tree writes, and sandboxed Windows credential access was unavailable. Normal user execution successfully reused the existing GitHub and encrypted Cloudflare credentials without new account grants. The runtime commit was pushed and independently read back from the GitHub branch. Main was not promoted. Subsequent documentation-only commits do not indicate another runtime deployment.

## Safety availability

The service now applies conservative server-side contact/link/solicitation/threat rules and requires configured external safety review before publishing free-text chat. Review happens before database insertion and broadcast. Rejected text is retained only in the sender's editable draft with a `*** Message blocked; it was not shared` notice, rather than being temporarily exposed or broadcast as repeated placeholders. Membership, mute, room and session permissions are rechecked after review. Human reports and owner/moderator actions remain available.

**Real Azure review is not configured or enabled. Free-text chat sending is therefore paused in production.** Retained messages, rooms and their timers remain usable. The production anonymous community status confirmed `chatReviewAvailable=false` and `moderationAvailable=true`. No real external moderation request or classifier-accuracy acceptance was performed. No Azure resource, paid plan or fallback inference was created. Configure an eligible dedicated F0 resource, its region/notice and server-side credentials before enabling and testing real traffic. See `community-review.env.example` and `StudyTimely-V2.7.0-Community-Safety-Local.md`.

## Database and compatibility

The production D1 recovery bookmark was recorded privately before changes. Read-only preflight found zero invalid or over-capacity rooms. Only pending migration `0005_community_capacity_guards.sql` was applied; its two new triggers and migration receipt were read back. The migration adds capacity validation for inserts/updates and atomic rejection of reductions below existing membership; no user rows were rewritten or deleted.

All nine runtime binding names/types exactly match the preceding deployment. Existing secrets, OAuth implementation, DNS, dependencies, analytics configuration and Cloudflare resource definitions were preserved. Optional analytics remains excluded from group/private pages. The public base group route is indexable and included in the 49-URL Sitemap; room/invitation query contexts remain noindex, no-store and no-referrer. Search-engine indexing or ranking is not implied. GSC/Bing/GA4 backend state was not reverified for this release.

## Verification

- Release build prerendered 55 pages plus 404; all 142 tests and the Wrangler deployment preflight passed. The test environment flag was corrected to release mode before recording the successful final suite.
- All 61 public route/resource/SEO checks and six group-specific HTTP checks passed.
- Exact SHA-256 checks passed for 124 public non-MP3 files, including generated HTML, application JS/CSS, fonts, policies and PWA resources. Initial network timeouts passed on retry using the same verified artifacts. Five unchanged licensed MP3s were validated locally during the release build and were not downloaded again in this release check.
- Production anonymous API and published policy checks passed; fixture routes, fake review keys and synthetic classifier markers are absent from the deployed Worker bundle.
- The in-app browser opened the new production page and observed the full create dialog with default eight members, capacity shortcuts, custom input and the 24-person limit. It did not submit the form or modify production accounts, profiles, rooms, timers, chat or rankings. Further browser interaction/screenshot attempts timed out and reset the automation session; **production phone-layout and screenshot capture were not completed**. Local 1280/390/320 responsive and safety-flow acceptance remains recorded separately and is not relabelled as production browser proof.

Evidence is ignored under `docs/development/evidence/groups-release-2026-11-14/`, including build/test logs, exact artifact/source inventory, deployment metadata, private recovery bookmark, migration receipts, public HTTP results and resource hashes. The production user-data mutation flag excludes the authorised additive schema migration itself.

## Recovery and remaining acceptance

Previous Worker: `74dd9b67-dca3-4e03-90f4-d53e2abe73fe` (V2.6.1). The additive triggers can remain for a code rollback; do not restore the whole database automatically and lose intervening user writes. Keep existing bindings. The old Worker predates the automatic-review gate, so reverting it also restores the older chat behaviour; preserve a chat restriction separately if a rollback becomes necessary. The private recovery bookmark is for a deliberate database recovery only.

Real Azure configuration/calibration, authenticated multi-account production room/chat/moderation acceptance, and the existing independent main-promotion gate remain pending. This release does not assert those outcomes.
