# StudyTimely V2.25.0 — Study Center and sign-in navigation

Published at https://studytimely.com/account on 17 November 2026. The user authorized releasing the Study Center together with the improved global login entry.

## Published behavior

My Study Center brings Overview, My learning, Progress, Community and Settings into the existing private account route. The overview uses saved personal learning in this browser: today/week, goal, today's planned-or-due tasks, seven-day activity, recent records, exams, schedule, habits and syllabus topics. Tasks can start linked study, be completed without time credit, or be rescheduled while retaining the deadline. Existing timer-switch confirmation remains in force.

Community cards read existing memberships and ranking status without changing public participation. Room credit is separate from personal study records. The existing account controller retains Google sign-in, registration, legacy recovery, manual merge/sync, backup, export and deletion controls under Settings. No automatic upload or sync is added.

The desktop header and mobile menu show Sign in for an anonymous session and My Study Center for a signed-in session. The sign-in destination /account?view=signin opens the Google login area in Settings, including repeat clicks from the same account route. Session checks share only a transient boolean; the server-rendered label is neutral Account until the client resolves the session. The desktop entry reserves its width. Existing leaderboard and community sign-in calls use this entry. Google authorization still requires the user to click its existing button.

## Source and deployment

- Repository: https://github.com/AImilesChen/studytimely/tree/v2-google-community
- Runtime commit: `21603b6aeeb383c1191743393f8e241d1bfc8d45`
- Runtime Git tree: `fdcb23ee2d2d6ae3f71ad8476fb7179188edc7cd`
- Worker version: `acd628ee-c875-40ee-8ea1-32cb6251e10f`
- Deployment: `df1adb9f-2c8a-4d36-8ab1-e7b419bc3ab9`, `2026-11-17T02:41:50.480388Z`, 100%.
- PWA version: `61510a245f73947c`, 62 precache resources.
- Source inventory: 240 files, SHA-256 `9af74cfe4b6599376d3a0babb92dfc4735db4677e87715757a9148b78c524fd0`.
- Artifact inventory: 134 files, SHA-256 `5c432c02a6664c9e6b1c27d6ac8984ae8e78a705eea2793605938dc89c91ed41`.

All nine existing Cloudflare binding names/types and existing plain-text, D1 and Durable Object definitions were preserved. No remote migration, DNS, OAuth scope/configuration, secret, dependency, protected Sites adapter, policy or tracking change was made. Production was deployed from wrangler.jsonc, never a fixture Worker. Later documentation-only commits do not imply another runtime deployment.

## Verification

The final release build passed all 315 tests, 62 candidate HTTP checks, whitespace checking and Cloudflare dry-run. Local in-app browser QA covered anonymous desktop and 390px mobile sign-in entries, repeat same-route entry, synthetic sign-in/header change, Study Center navigation and sign-out/header change without reloading. Synthetic learning data remained local on sign-in and survived sign-out. Study Center task/timer/manual-sync scenarios and 1440/768/390/320 layouts are detailed in the local handoff.

After deployment, 62 public HTTP/SEO/resource checks passed. All 128 public non-MP3 files matched the candidate SHA-256 hashes, and all 56 initial HTML pages preserved the global navigation. The private account route and explicit sign-in query returned 200 with noindex,nofollow; /account stayed outside Sitemap. Anonymous auth status reported no user and Google configured. Three public ranking periods returned valid no-store responses; the personal ranking endpoint remained private with 401. PWA readback matched the candidate.

The production in-app browser retained the existing signed-in session and showed My Study Center, the five tabs, genuine empty local learning and the existing ranking opt-out/no joined rooms. Settings showed Google connected and manual sync controls. Mobile navigation visibly contained My Study Center linking to /account. Final browser state was Overview at the default viewport, no horizontal overflow, no captured warnings/errors, and the production tab marked deliverable. No real sign-in restart, registration acceptance, sync, deletion or community mutation was performed.

The browser bridge had several 30/60-second timeouts; after recovery the resulting DOM and screenshots were observed, rather than treating timed-out actions as proof. The first account metadata verification expected noindex,follow and failed because the existing correct policy is noindex,nofollow; the verifier expectation was corrected and the complete final verification passed. No production change was needed for that check.

Ignored evidence: `docs/development/evidence/study-center-release-2026-11-17/`. Accepted production captures: `production-desktop.jpg` and `production-phone.jpg` (mobile navigation). No credentials, private identity or raw account response is included in public evidence.

## Limits and rollback

This is the agreed first-stage Study Center. Automated recommendations, weekly review, exam workload checks, expanded plan-versus-actual reporting and optional automatic sync remain later work. Full multi-device concurrency, installation/offline, forced failures and a fresh real Google round-trip were not reverified. Existing independent production room/timer/chat/moderation acceptance and main-promotion gates remain pending.

Rollback target: previous V2.24.0 Worker version `8b43868a-2806-4a77-90c3-fd669057c609`. There was no schema migration, so a code rollback does not require restoring D1. Existing manual/local data safety requirements continue to apply.
