# V2.32.0 — Advanced study planning and a complete Plans workspace

Published at https://studytimely.com/study-planner on 18 November 2026. This supersedes all advanced-planning local-only entries and previews in the preceding handoff.

- Runtime source: `c2288120eacae8d46bb61851529a15f4039127f5`, tree `50d910e229f573ac1ac8ca37915febbc96e27f6a`, branch `v2-google-community`.
- Worker: `45aad34d-1767-4ff1-b253-9dc3160c8691`.
- Deployment: `eb2601d1-e6f2-4136-b579-348c09e7c0ac`, `2026-11-18T08:13:25.101144Z`, 100% traffic.
- PWA: `8f2de0c6f7988c9a`, 62 resources.
- Source inventory: 339 files, SHA-256 `fc6f555b4bb88d8f2203380e2e3cf2cea3c1614555833c02c63c720a1b529a3d`.
- Artifact inventory: 142 files, SHA-256 `fd55fdb298e283c077a26af81102b27e08612da55d089146737ca0604c60e8c4`.

## Published behavior

Today shows the next learning session, an agenda and unarranged tasks, with the full basic task planner available separately. Week shows a dated time grid with explicit availability, commitments, duration-sized sessions and a readable narrow-screen agenda. Plans has a compact selectable plan list and a flexible detail workspace with deadline, completion, remaining work, upcoming arrangements, next-session actions and editable task rows. Mobile uses a plan selector and vertical task rows. Edit/archive are secondary actions; success notices no longer occupy persistent document space.

Users can create goals, link or create tasks and syllabus topics, set remaining estimates/prerequisites, choose study windows and exceptions, preview 7/14/30-day schedules, apply or undo generation, and lock/move/skip individual sessions. Spread work and Finish early policies retain deadlines and prerequisites; short tasks stay whole when a suitable slot exists, with an explained earlier arrangement when it reduces deadline risk. Linked real timers record actual intervals and require explicit work-completion feedback; planned minutes never create learning or leaderboard credit.

The editable example is an isolated in-memory workspace with three recognisable tasks. It supports editing, replanning and explicitly simulated start/finish/feedback. Reset/exit discard it; no example work enters the real repository, timer, study history, cloud or rankings. Own/example Plans variants are not indexed.

Planning records are validated, merged and backed up through the existing workspace. A same-store, reset-epoch-bound companion preserves plan fields against older local-tab rewrites without an IndexedDB version bump. The updated account API rejects cloud writes that strip retained plans; manual sync still requires an explicit user action and retains its 1 MiB limit. Privacy text now describes these actual data rules.

Advanced planning remains an anonymous **free preview** (`advancedPlanningPreview=true`, expiry0). No payment, subscription grant, AI call or new production resource was activated.

## Verification

Final release-mode suite: **486 passed**, after the release build completed. Earlier test invocations used the wrong release-test environment flag; this was corrected to `STUDY_TEST_RELEASE=1`, with no deployment before the final passing run. The candidate build generated 56 pages plus404; deployment dry-run, 62 candidate HTTP checks, 56-page navigation and planning/private-query API checks passed.

After publication, **62 public HTTP checks** passed, including robots, Sitemap, canonical, redirects and resources. All **136 non-MP3 public resource hashes** match the manifest. All56 public navigation pages, tracker ten-FAQ guide, planner detailed guide, deployed Plans controls/styles, planning/analytics free-preview policies, no-store/noindex API headers, planner and tracker query guards, privacy content, real Google-provider metadata and unavailable test fixtures were checked. Public room/leaderboard checks were read-only; no personal account, timer, plan, room, message, cloud or entitlement was mutated for acceptance.

Cloudflare readback confirms all12 original binding definitions and script runtime settings unchanged, 100% traffic on the new Worker. Review remains disabled with providerCloudflare/day5000 and no AI binding. No D1 migration or database restore was performed; the existing twelve migrations and room expiry/seat gates remain intact. Native Git pushed the exact29-file runtime commit; the GitHub connector independently read package2.32.0 from the authorised branch. Later documentation commits do not imply another deployment.

No in-app browser-control tool is exposed in this session, and no native browser substitute was used. Actual production click/focus/scroll/mobile/theme/manual-sync/download acceptance remains unverified. Model, component-event, SSR and HTTP checks do not establish browser visual acceptance. Independent real two-person community/moderation acceptance and main promotion remain pending.

## Recovery and evidence

Prefer a forward fix or an access-preserving matched build retaining the new planning schema, companion and cloud downgrade guards. Prior Worker `156a502d-d3a6-4073-876c-0a74738776cd` is the verified V2.31.1 baseline, but predates those planning guards: do not automatically revert and resume old-client sync after new planning data exists. Preserve current full backups, stop older-tab writes/manual sync and assess planning data before an emergency downgrade. Keep all existing room access gates and database schema/data; no automatic D1 rollback is required for this additive application change.

Ignored evidence: `docs/development/evidence/advanced-planning-release-2026-11-18/` contains final build/tests, manifest, reviewed source paths, runtime before/after, dry-run/deploy logs, candidate/public HTTP reports and exact public resource hashes. The local advanced-planning handoff records implementation bounds and later roadmap; recurring tasks, external calendars and payment integration remain future work.
