# StudyTimely V2.28.0 — Study companions

Published on 17 November 2026 after the user's instruction to release the approved companion-room revision. Open https://studytimely.com/study-groups and enter an existing room.

## Behaviour

The room opens with four companion seats, visible personal timer controls and a recent-message/quick-communication panel. Connected timer, ready, break, check-in-needed and offline states describe server records rather than proof of attention. Activity planning, overview, totals and moderation remain available in secondary expandable sections. Activity invitations still open their relevant activity. Phone layouts have short timer controls and a quick-message anchor.

Ten fixed quick messages and silent tap, cheer and celebration effects are free and require no external AI review. Effects respect focus, offline state, receiver opt-out, blocks, mute, membership, session and CSRF. Atomic rolling cooldowns protect the sender, recipient and pair. Messages/effects cannot start another member's timer or earn credit.

Free rooms have up to four members, including the owner and offline members. Existing larger rooms keep their members while new joins/restores respect the current owner entitlement. Existing three-open-room and ten-membership limits are unchanged. Free guests can join an entitled larger room. Free-text sending requires the author's entitlement and normal safety review, including a final expiry check after review. Subscription provisioning is trusted groundwork only: **no payment, checkout, public grant endpoint or real entitlement grant was enabled**. Production AI review remains disabled with no AI binding. Current free users have fixed communication rather than an unusable text composer or purchase button.

## Deployment and source

- Branch: https://github.com/AImilesChen/studytimely/tree/v2-google-community
- Runtime commit: `daccd0878da2b861459b8655d620d19fab42d45f`.
- Runtime tree: `e99c2b9aad44a65f03966f366d12d39ce671afd0`.
- Worker version: `c20c9054-dd0c-4fae-872a-fd9ecfd6f9f2`.
- Deployment: `3c6b7506-9b18-431f-a728-384215d6a374`, `2026-11-17T11:14:12.183461Z`, 100% traffic.
- PWA: `4fda3df6809f66a3`, 62 resources.
- Source inventory: 286 files, SHA-256 `1f9ecd0395426720e6027fb07e81585817260e133a766e5b284bc1078058591b`.
- Artifact inventory: 134 files, SHA-256 `ee50ea6862e3d026ac0d8068df975dbdad68a0b887116277b0f98a5c6e0cd22a`.

All twelve original binding definitions and script runtime settings were preserved. Existing encrypted Wrangler authorization worked without a new device flow or scope. Review provider remains cloudflare, enabled false, daily application budget 5000. No AI binding, dependency, DNS, secret rotation, paid resource, protected adapter or analytics change. Source was pushed before deployment. Later documentation commits do not redeploy the runtime.

## Database

Verified the actual production D1 binding, eight old migrations and foreign keys, then captured schema, aggregate counts and a private Time Travel recovery bookmark. Applied only additive `0009_study_companions.sql`, SHA-256 `b0490c87ad70b22f89c01d3dcf3af4de03bf356f288eca824d9a9b5441c6ced5`.

Readback verified all nine migrations, unchanged existing counts, new preference columns/defaults, nullable catalogue column retaining the legacy message constraint, entitlement/interaction tables, indexes, cooldown triggers and valid foreign keys. New entitlement and interaction tables were empty at migration acceptance. Post-release readback confirmed valid foreign keys and zero entitlement grants. No reset, seed, restore or production QA record was created.

Own account export includes preferences, retained interaction metadata and entitlement records; deletion cascades them. Interaction events expire after ten minutes and are physically purged on subsequent interaction writes or daily maintenance. Guide, FAQ and policies describe actual state/communication behaviour and deferred subscriptions.

## Acceptance

- Final production build and CLI deployment dry-run passed. 56 routes plus 404, correct release robots/canonical/Sitemap, no fixture Worker in deployment.
- Final `STUDY_TEST_RELEASE=1 npm test`: **362/362 passed**. The initial suite invocation used the preview indexing expectation against release output; it was rerun with the correct release flag without a source change.
- Candidate: **62 HTTP checks passed**. Production: **62 HTTP checks, 128 exact non-MP3 file hashes and 56 shared-navigation pages passed**. Verified PWA, private query noindex, anonymous authentication/privacy guards, fixture routes 404, guide/FAQ/policy content, public directory effective capacity and no public entitlement grant.
- Local pre-release evidence covers independent synthetic sessions against actual Worker/D1/Durable Objects: capacity/forgery/concurrency, quick messages without AI, arbitrary-text gate, peer timer, real elapsed credit, break, focus suppression, recipient-only realtime effect, cooldown/opt-out, own export and socket-close offline state. Eleven focused companion tests include expiry, final-write authorization, export isolation and deletion integrity.
- In-app browser before release verified desktop, 1920px, 390px and 320px layouts, no page horizontal overflow, controls, actual received celebration, owner limits and member moderation. Inspected screenshots and clean final browser logs are in the local handoff. All local QA timers were paused; local foreign keys passed.
- Production in-app browser loaded the real signed-in public Groups page, current guide and existing room entry. Opening that existing room changed the tab URL, but the click/read and recovery read timed out and reset the browser kernel. **No production room screenshot, room console result or complete authenticated room interaction is claimed.** No production message, invitation, room creation or timer action was performed. Private-room code is covered by local interaction evidence, exact published asset hashes and production database/API checks. Real two-person production acceptance and main promotion remain independent and pending.
- No model inference or new inference-budget approval was used.

Ignored evidence: `docs/development/evidence/study-companions-release-2026-11-17/` (manifest, runtime/binding checks, pre/post database state, recovery bookmark, migration/deployment logs, public file checks and final readback). Final build/test logs are in `app/.wrangler/companions-release-*.log`. Local screenshots and synthetic integration results are described in `StudyTimely-Study-Companions-Local-2026-11-17.md`.

## Recovery

Code rollback target: V2.27.0 Worker `ec09afb5-d348-4016-9ea6-66f8102c7b84`. Retain additive migration 0009 on rollback; do not reset or blindly restore data. An older Worker lacks new entitlement enforcement, catalogue/effect support and interaction-metadata cleanup, so assess those differences and arrange cleanup if remaining on old code. Keep payment and AI review disabled. A Time Travel restore would overwrite later legitimate data and needs a separate incident decision.
