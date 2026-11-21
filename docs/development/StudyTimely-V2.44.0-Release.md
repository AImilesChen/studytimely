# StudyTimely V2.44.0

Published21November2026 at https://studytimely.com/study-groups. This supersedes the local-only weekly-guide, next-action contrast and emoji follow-ups.

- Runtime commit: a7116025d03eed0fc1608914aaca08ab6df7c146; tree1533c770d16b648130d58a6a3fef16bc643b25e4, branchv2-google-community.
- Worker:8953cf5e-c9de-4384-a3fc-0b00c7a208b9; deployment:e4c937a6-1689-4826-b31f-f1cbfa6f2ee0; deployed2026-11-21T01:31:02.834865Z at100%.
- PWA:26c1bafa2a38eeb0,76resources. Rollback:V2.43.0 Worker588aaa0f-da5b-466a-8f81-3f6cc13ae82a, no database restore required.

## Changes

Weekly teaching now uses three horizontal screenshot/instruction rows, a separate four-metric glossary and visible vertical answers. Room instructions are shorter; the public guide retains supplementary explanations. Two unmodified native synthetic screenshot assets support focused date/chart/CSV/table excerpts. These example records never become room records.

Three existing next actions have distinct coral/gold/lavender card surfaces, full-width46px filled buttons and brief destination explanations. Generic outline decorations and their square badges are replaced with native colour emoji🤓/🐧/🥳, aria-hidden because explicit action labels remain. This user preference is recorded in AGENTS.md. Conditional callbacks and owner-only planning are preserved.

No backend, schema, timer/credit, permission, CSV implementation, dependency, secret, OAuth, DNS, paid resource, tracking, protected adapter or Worker configuration changes. No fixture Worker deployed. The unrelated pre-existing FocusGuide.jsx working-tree status remains excluded.

## Verification

- Final release build56pages+404, Wrangler dry run and701release-mode tests passed. Two initial test invocations used preview-mode expectations against release HTML; the single robots-mode assertion failed. Correct STUDY_TEST_RELEASE=1 rerun passed all701 without runtime changes.
-62candidate and62production HTTP checks passed, including robots, canonical, Sitemap and licenses. All167public HTML/non-audio/video files matched exact build hashes, including10group-progress JPEGs. Public guide definitions/answers and private-query noindex/no-store verified. Synthetic endpoints404; protected APIs401; existing Google provider available.
- All12bindings, handlers and runtime settings equal the previous Worker. Deployment metadata confirms100% traffic.
- Runtime source pushed to existing release branch. Initial direct push was reset by network; retry through current system proxy succeeded. No main merge.
- Prior actual local light/dark/320px guide/dialog/focus/action checks and native dark emoji screenshot remain documented in the local handoff. Fresh production IAB tab creation timed out and reset its kernel, so no new production screenshot/mobile/clickthrough/console acceptance is claimed. HTTP/hash/configuration acceptance succeeded independently. No local image is labelled production.

No production timer, booking, result, message, goal, room, preview grant or preference save initiated. Earlier independent planner/community/moderation/main-promotion gates remain separate.

Ignored evidence: docs/development/evidence/weekly-guide-release-2026-11-21/ (build/tests/dryrun/deploy/configuration/exactassets); copied production HTTP result included. Source inventory449files SHA256edeff90edcf6fa81647d9280fc41a3c31bab9de0870d304cc133d7ab92bf27f0; artifact209files SHA25667a6a8a54597366d2ff37bb02e529aefdcc86460dbbdf1a98470f80b5140f3e0. Later documentation commits do not redeploy runtime. Never deploy local synthetic fixtures.
