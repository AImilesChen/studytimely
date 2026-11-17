# StudyTimely V2.27.0 — Study updates and clearer rooms

Published at https://studytimely.com/study-groups on 17 November 2026, following the user's publication instruction.

## Published behaviour

Members can send four server-resolved fixed study updates without an external AI call: Starting study, Goal completed, Taking a break and Need help. Added text is never trusted as a template. Messages still require accepted profiles, unmuted room membership, an open room, a configured platform moderator and a valid session; shared rate limits and idempotency apply. A shared status is self-reported and does not start a timer, complete a task, create attendance or award credit.

Room activities now show one detail panel for a sole selected upcoming activity, compact selectors for multiple activities, 16px task labels/inputs and 15px help. Repeated headings, dates and default instructional prose have been removed. Owner management, group statistics, saved forms and detailed guidance expand on demand. Inline private-task retention and irreversible checkout notices remain. Public SEO guidance remains substantive.

The release includes local filtering, explicit review adapters, a 5,000-Neuron daily application budget, conservative reservations/circuit protection and five-minute exact-text safe-verdict caching. **Free-text review and custom public titles remain disabled.** The candidate's unverified AI binding was removed before deployment; no additional OAuth permission or model call was made. Fixed updates work in the paused state. Production activation of free text still requires a separately scoped official AI binding acceptance and review decision. The application budget is not an account-wide spending cap.

## Source and deployment

- Branch: https://github.com/AImilesChen/studytimely/tree/v2-google-community
- Runtime commit: `3bc842568e8b0addd8e0c1d0d79186efc983332d` (feature commit `0cc8a30d6103246ff85c8b6013cd8a1daf7241b7`, followed by removal of the paused/unverified AI binding).
- Runtime tree: `a2488b8fa3b4cd33de2340737acbeed2cb0c231d`.
- Worker: `ec09afb5-d348-4016-9ea6-66f8102c7b84`.
- Deployment: `86108e76-e89e-48d2-ba07-cd45b6d58d6a`, `2026-11-17T09:24:25.104652Z`, 100% traffic.
- PWA: `4eab5f374863a6d9`, 62 resources.
- Source inventory: 274 files, SHA-256 `dba724bdb59dcf06d13317b3bf81c2e3e95c9fbb524b574f5441ea9a31e63b81`.
- Artifact inventory: 134 files, SHA-256 `cdbaeffb63c44db60542aa4ebf64e06f27a7629eb7505cf336fd3d2970c44ebb`.

All original nine binding definitions and script runtime settings were preserved. Three plain-text review configuration variables were added: provider cloudflare, enabled false and daily Neurons 5000. No AI binding, dependency change, secret rotation, DNS change, paid resource or protected adapter change. Existing Google sign-in and manual sync remain unchanged. Later documentation-only commits do not redeploy this runtime.

## Database and login

Verified the actual production D1 binding, existing six migrations, schema, counts and foreign keys. Captured a private Time Travel recovery bookmark before applying only `0007_review_budget.sql` and `0008_review_cache_templates.sql`. Readback verified all eight migrations, the nullable constrained template column, new tables/indexes, unchanged existing data counts and valid foreign keys. No reset, seed or restore. Review/cache tables were empty before release and the final readback showed zero rooms, review attempts and cache rows; no production QA room or model activity was created.

Migration SHA-256 values:

- 0007: `652e520729469ffe0e3de1a8bdba5c57ac03a34ddf9eef7bbdb70f91bf6d4f0b`.
- 0008: `d01c450bc9532f93a6bfdd1be855cb996191f8da63f8c9004b4b95b5cca61585`.

Restricted execution initially could not read the encrypted Wrangler credentials, which was mistaken for an expired login. A device flow was started; the browser timed out and that code expired without completing a new grant. Elevated read-only checking then confirmed the existing official Wrangler login remained valid. The user was told no further device action was needed. Existing permissions sufficed for deployment and D1. No newly approved scope was used. The separate old cf-client authorization remained unavailable; final deployment/readback used the already-authorized official Wrangler and system keyring. Credentials were never printed or committed.

## Verification and limits

- Final 351 tests, production build and deployment dry-run passed. 56 routes + 404 built for the release environment. 62 candidate HTTP/SEO/asset checks passed.
- Production: 62 HTTP checks, 128 exact non-MP3 artifact hashes, 56 shared-navigation pages, expected PWA version, robots/canonical/Sitemap, privacy review/cache disclosure and room guide passed. Anonymous review-status/personal-ranking endpoints remain 401/no-store/noindex. Fixture routes are 404. Private room/activity/invite variants remain noindex.
- Local evidence from the preceding handoffs covers two synthetic members and actual local Worker/D1/Durable Object checks, templates, cache reuse/expiry, outage/capacity, permissions and no-credit semantics. Actual local desktop/390px/320px checks verified the simplified forms and full activity flow, including 18 connected QA seconds, saved checkout and ended activity. No QA timer was left running.
- The production in-app browser successfully loaded the real signed-in public group page, including current quick-update guidance and empty room directory. A subsequent create-dialog check and recovery read timed out/reset. No production screenshot, console result or authenticated room workflow is claimed. No production room was created. The private room UI is verified locally plus exact published bundle hashes. Independent real two-person Google room/chat/moderation acceptance and main promotion remain pending.
- No new model inference was made. Earlier bounded 32-call and 120-call evaluation approvals are exhausted and are not reused by this release.

Ignored evidence: `docs/development/evidence/group-chat-release-2026-11-17/`, including exact build manifest, test/build/dry-run logs, candidate/public checks, version/deployment metadata, database pre/post checks, recovery bookmark and final aggregate counts. Local room screenshots are in the prior `cf-review-optimize-2026-11-17` folder and are not production screenshots.

## Recovery

Code rollback target: V2.26.0 Worker `485060ef-801f-4528-8f5b-469bba911aee`. Retain additive migrations 0007/0008 on code rollback; they do not remove existing fields or data. An older Worker does not perform cleanup for the new review metadata, so monitor/clean that data if remaining on old code. Keep free-text review paused. A full Time Travel restore would overwrite later data and requires a separate incident decision; do not restore blindly. Main promotion and later commercial features are independent of this publication.
