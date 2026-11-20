# StudyTimely V2.43.0

Published on 20 November 2026 at https://studytimely.com/study-groups. This supersedes the local-only compact Group progress, weekly report and navigation/guidance follow-ups.

| Item | Value |
| --- | --- |
| Runtime commit | fe9e68fc0c23645227b50799e328e208300c596e |
| Runtime Git tree | ae38cc6f4e59107649b2c645924aeda6eb051d7e |
| Release branch | v2-google-community |
| Worker version | 588aaa0f-da5b-466a-8f81-3f6cc13ae82a |
| Deployment | 4196d10d-3150-4f5b-87ff-2fd9aa694897 |
| Deployed at | 2026-11-20T15:24:48.909824Z |
| Traffic | 100% |
| PWA cache | 7f15195795c696fb, 76 resources |
| Rollback target | V2.42.0, Worker 57d73bb9-1842-4161-9b0e-52ea866d6282 |

## Published behaviour

Five room workspace menus now have consistent coral/gold/violet/cyan/berry roles in light and dark themes, coloured icon backgrounds and a stronger selected state. The report-only monochrome override no longer removes those colours. The earlier compact progress header, visible calculation rules and corrected screenshot examples ship with this release.

Weekly reports have four flat metrics, distinct weekday bars, derived Week in review, an always-visible daily table and activity attendance when present. The twelve-week selector, bounded arrows and original CSV format remain. Real zero study, missing reports and retained snapshots have separate truthful states; snapshots show their cutoff. Weekly participants are unique people, not a sum of daily counts. Unenabled rooms show an explicitly labelled illustrative sample that is not persisted or exported. The saved-report link appears only when member-only bounded week metadata is present.

Below the report, three permission-aware next steps reuse the existing Study together, owner booking and activities callbacks. Three screenshot examples explain selecting a week, reading the four metrics and exporting/reviewing daily figures. Empty-data, dash and access explanations are directly visible. Image dialogs enlarge the screenshots, with Escape focus return. Teaching remains below working tools.

The public /study-groups initial HTML includes a weekly-report section, guide anchor, Today-versus-week comparison, review scenario, the shared screenshot guide and visible answers. Its description names daily progress and weekly CSV reports within the existing optional-preview scope. Public canonical/indexability and private room/invite/activity noindex/no-store behaviour remain. No new public route or search-ranking claim is included.

Room GET adds one member-only query for up to twelve saved week identifiers in the existing reports table. No schema migration, timer/credit/entitlement rule, dependency, secret, OAuth scope, DNS, paid resource, tracking, protected adapter or Worker binding change was needed. No fixture Worker was deployed.

## Verification

- Final release build, Wrangler dry run and **701 release-mode tests passed**.
- Six compiled local Worker/D1/Durable Object activity scenarios passed using isolated synthetic accounts.
- **62 candidate and 62 production HTTP checks passed**, including robots, canonical, Sitemap and licenses.
- All **165 public HTML/non-audio/video files** checked against the build matched their exact hashes. Five updated/new group-progress JPEGs and three preserved original JPEGs are present. No extra audio/video was introduced.
- Public weekly content is indexable in the release, private query HTML and headers agree on noindex/no-store, test fixture routes return404, protected anonymous APIs reject access, and the existing Google provider remains available.
- All **12 bindings**, script handlers and runtime settings equal the previous Worker. Deployment metadata confirms the new version receives100% traffic. Existing variables were preserved.
- The runtime commit was pushed to the existing release branch. An independent GitHub raw-file read returned package2.43.0 at that exact commit. No main merge.

Local IAB acceptance from the approved implementation remains valid: light/dark menus, three next-action callbacks, original booking/cancel, existing activity navigation, visible three-step guide and images, native image modal/Escape focus, public guide/planner anchors,320px document305px/images271px/dialog288px, no duplicate IDs or weekly disclosures, and empty warning/error capture. Fifteen sampled menu text/background contrasts were at least7.32:1; this is not full accessibility certification. Earlier weekly zero/retained/missing/selection-boundary/CSV tests and the existing four-seat/timer checks remain documented in the local handoffs.

Fresh production IAB read the existing signed-in private room, its five destinations and default Study together view. Initial native tab binding and fresh-tab capture repeatedly timed out; DOM access later succeeded, but the subsequent Group progress click timed out/reset again. No fresh production menu-colour screenshot, weekly visual/mobile/clickthrough, save/export or console acceptance is claimed. No local screenshot is labelled as production evidence. The browser limitation does not replace the successful production HTTP/hash/configuration checks or the actual local interaction evidence.

No production timer, result, message, task, goal, room creation, preview, role, subscription or preference save was initiated for acceptance. No database migration or restore was performed. Rollback selects the previous Worker version without database restoration. Independent planner/community/moderation/main-promotion gates remain separate, and the unrelated FocusGuide.jsx working-tree status was preserved.

## Evidence and recovery notes

Ignored evidence: docs/development/evidence/weekly-report-release-2026-11-20/. It includes release build/tests, dry run, source push, source/artifact manifest, before/after Worker metadata, deployment equality result, candidate/public HTTP results and asset hashes.

The first build invocation from the repository directory failed to resolve its generated entry; rerunning from app/ produced the accepted release build without changing runtime source. The restricted CLI context could not use the existing Cloudflare login; normal authorised execution with IPv4 ordering refreshed it successfully. A scene-image request and later private-page read timed out over the direct network. Bounded retries using the current system proxy passed, with all assertions retained. The release verifier initially expected only five group-progress images; inspection confirmed those five plus three preserved originals, so the evidence-only count was corrected to eight. All165 hashes then matched. No certificate bypass or new credentials/scopes were used.

Source inventory:449files, SHA-256 c3c4420a9f9c689dc9c75f16eb73d27dc9891c2f2d88fe11c740c6b276a154a8. Artifact inventory:207files, SHA-256 8fd3b83f80f93b88586c81222bec19320ca4c24d01f77535c4c5f5392ba64604. Later documentation commits do not redeploy the runtime. Never deploy tests/fixtures.
