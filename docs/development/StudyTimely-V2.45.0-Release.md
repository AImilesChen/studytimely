# StudyTimely V2.45.0

Published 21 November 2026 at https://studytimely.com/study-groups. This supersedes the local-only group tools hub and direct-control follow-ups.

- Runtime source: d57bb5f483986cfe9ebc6cc939ceb8f314fead23, tree c587971dc15b4772f5f462f39a08e2201ef4c82f, branch v2-google-community. Remote branch readback matched this source after push.
- Worker version: db29e11e-da34-427d-882d-ef91ef7e1d43.
- Deployment: 262884ff-2d91-4e94-a5d7-19d84ab172de, created 2026-11-21T08:02:40.85493Z, 100% traffic.
- PWA build: f3a6ae195b84b7bc, 76 precached resources. Community pages stay online only.
- Rollback: V2.44.0 Worker 8953cf5e-c9de-4384-a3fc-0b00c7a208b9. No database restore is needed.

## Published behaviour

The group tools page uses an illustrated left tool list and one selected workspace on the right. The matching illustrated lesson follows the whole workspace. Public and room editorial content explains use cases, recorded progress and permission boundaries. Warm paper, coral controls and existing hand-painted artwork remain consistent. The public study-groups title and description describe the real shared tools; room and invitation variants remain private and noindex.

Room atmosphere shows background and music selectors, a preview, scene application, deliberate play/pause and volume directly. Personal controls require an active room place and do not require advanced access. Saving a recommendation for the whole room remains an explicit organiser action with the existing advanced access gate. Applying a scene never starts audio.

Group goal shows current progress and editable settings together. Organisers can update target and end date while preserving the original start date, metric and recorded study. The server enforces version checks, membership, organiser rights, advanced access and final-write session checks. Ending a goal has a separate confirmation. Eligible owners can copy the existing private room invitation from the goal pane. No public goal-sharing URL is created.

No schema migration, new dependency, OAuth, credentials, DNS, paid resource, tracking or protected adapter change occurred. The pre-existing unrelated FocusGuide.jsx working-tree status is preserved and excluded from the release commit.

## Verification

- Final release build completed with 56 pages plus 404. Wrangler dry run passed. All 710 release-mode tests passed.
- The compiled local synthetic Worker passed 13 D1 scenarios, including editable goals with preserved start/progress and rejection of stale versions. These scenarios ran only against the isolated local fixture database.
- Candidate and production each passed 62 HTTP checks. Six additional group-page checks passed in each environment, including initial HTML and private query headers/robots.
- All 175 public HTML/non-audio/video assets matched the exact release SHA256 hashes, including eight group-tools JPEGs. Protected APIs reject anonymous access, the existing Google provider remains available, and synthetic fixture URLs return 404.
- Deployment metadata confirms 100% traffic. All 12 bindings, handler names and runtime settings match the prior deployed Worker.
- Source was pushed to the existing release branch and read back at the exact runtime SHA. No main merge. GitHub direct connection reset; the existing system proxy succeeded. The restricted CLI could not use existing login; authorised normal execution reused the existing Cloudflare credentials.

Actual production in-app browser clickthrough, playback, clipboard interaction and final desktop/mobile visual acceptance remain unverified because browser interaction tools are unavailable in this session. The production preview-opening request was queued, which is not visual acceptance. Prior local checks and this release's HTTP/hash/API checks are recorded separately. No authenticated production timer, booking, task, goal, grant, message or preference mutation was initiated.

Ignored evidence: docs/development/evidence/group-tools-release-2026-11-21/. Source inventory: 468 files, SHA256 94c5a31a2f0dbca972a97b870f858e689df9065f9f8ca8b032dbcbfd3f442a00. Artifact inventory: 217 files, SHA256 73b7713eb23763eab55e5630d587ec59337658eba8cc2fab1becee62e3fde0b7. Later documentation commits do not redeploy runtime. Never deploy local fixture Workers. Existing independent planner/community/moderation/main-promotion gates remain separate.
