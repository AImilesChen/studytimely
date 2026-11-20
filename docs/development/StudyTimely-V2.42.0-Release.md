# StudyTimely V2.42.0

Published on 20 November 2026 at https://studytimely.com/study-groups. This supersedes the local-only Group progress handoff.

| Item | Value |
| --- | --- |
| Runtime commit | 10c3e01453f23183cac8df92455aa72d1b61a508 |
| Runtime Git tree | b0931e1b8433fbb53fa08b38e04a7ff0e8386d7a |
| Release branch | v2-google-community |
| Worker version | 57d73bb9-1842-4161-9b0e-52ea866d6282 |
| Deployment | 465e36e9-dbbd-496b-becf-1481e93f459b |
| Deployed at | 2026-11-20T12:52:17.864799Z |
| Traffic | 100% |
| PWA cache | bd951579b03efd7a, 76 resources |
| Rollback target | V2.41.0, Worker d9bf8059-0dbd-4d26-84e7-daf21c1f72fc |

## Published behaviour

Group progress now opens on a Today overview with a two-to-one shared-goal and personal-contribution layout, participation, member contributions, a contextual next action and recent activities. Functional surfaces distinguish the main goal, personal effort and actions. Three genuine synthetic screenshots explain the workflow below the working tools and enlarge in the existing dialog. Short durations stay precise; unknown totals are not invented. Owner goal editing and result shortcuts use the original controls and permissions. The five room destinations, independent timers and single mounted activity instance remain.

Weekly reports have their own view inside Progress, reusing the existing preview, retained-access and Advanced checks, twelve weeks, chart, daily table and CSV. Shared challenge remains in Advanced tools. Changing weeks clears stale report data before loading. Narrow layouts constrain the week selector and show readable metric rows and the complete date range.

The public planner calculates people × minutes, includes the proposed target in its copied agenda and passes it to the original unsaved creation form. The bounded target survives the existing ten-minute sign-in-return draft. Existing public guide content explains progress; no new SEO route was created. Private room, invitation and activity HTML and client metadata agree with the existing noindex/no-store headers, while the public release landing remains indexable.

The existing aggregate query adds recorded participant count and retained date bounds. No schema migration, credit-rule change, dependency, paid resource, OAuth scope, secret, DNS, tracking or protected adapter change was needed. All twelve bindings, handlers and runtime settings match the previous Worker. The local fixture was not deployed.

## Verification

- Final release build, Wrangler dry run and 696 release-mode tests passed. The initial local 694-test run and later focused checks are historical; 696 is the final release suite.
- 62 candidate and 62 production HTTP checks passed, covering robots, canonical, Sitemap and licenses.
- All 160 checked public HTML and non-audio/video resources matched the build hashes, including the three new example JPEGs. Served JS/CSS markers confirm progress controls, report-only rendering and the public target estimate. Private variants have matching HTML/header robots; fixtures return 404; protected advanced and workspace APIs reject anonymous access; Google remains available.
- Six compiled local Worker/D1/Durable Object activity scenarios passed using isolated disposable synthetic accounts. The release did not migrate or restore the production database.
- Actual local IAB desktop light/dark, 768px tablet, 390px and 320px phones passed the scoped visual and interaction review. Goal 120→80→120, matching result form/cancel, return without starting, free/retained report entry, Advanced week switching, daily table, real seven-row downloaded CSV, planner 3×35=105, invalid input, unsaved creation target and example dialog/Escape were checked. Ten sampled contrast pairs ranged from 5.47 to 13.07. This is not a complete assistive-technology audit.
- Production IAB opened the existing signed-in room and selected Group progress. Actual values were 2 min 30 sec / 120 min, 2.1%, one participating member and the member's pending-result action. The 1280px desktop document measured 1265px, all three example images loaded, hydrated robots was noindex,nofollow and captured warning/error logs were empty. An actual production screenshot is saved as production-progress-desktop.jpg in release evidence. Browser control was slow and reset during initial attempts; a later bounded rebind and screenshot succeeded. Production mobile, theme switching, saves and CSV download were not exercised; their acceptance remains local evidence.
- Runtime source was pushed to the existing release branch; GitHub independently returned package 2.42.0 at the exact runtime commit. No main merge.

Source inventory: 447 files, SHA-256 63384d8d9a853ec9e464b3666402a0a8d6000e16b29ecdb2dcd2fc0867db4081. Artifact inventory: 202 files, SHA-256 c8f67dd31e5bffc4718dcbc360a0c8bd2580f6a7d2233ccb1590d0a4a289954d. Ignored release evidence: docs/development/evidence/group-progress-release-2026-11-20/. Local evidence and detailed iterations are linked from StudyTimely-Group-Progress-Local-2026-11-20.md and design-qa.md.

No production timer, result, task, message, goal, room creation, advanced-preview, role, subscription or preference save was initiated for acceptance. Rollback selects the previous Worker version without restoring the database. The unrelated FocusGuide.jsx working-tree status is preserved. Independent planner, community/moderation and main-promotion gates remain separate. Later documentation-only commits do not imply a new runtime deployment. Never deploy the fixture Worker.
