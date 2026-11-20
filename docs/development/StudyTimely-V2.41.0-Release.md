# StudyTimely V2.41.0

Published on 20 November 2026 at https://studytimely.com/study-groups. This supersedes the local-only activity visual-guide, tools-first, visible-summary and functional-colour handoffs.

| Item | Value |
| --- | --- |
| Runtime commit | ab6e35c2f9872aa631c803be47c0b39653feb795 |
| Runtime Git tree | f3ba37cef04fa6aad641e587b37d56f5db5a3c01 |
| Release branch | v2-google-community |
| Worker version | d9bf8059-0dbd-4d26-84e7-daf21c1f72fc |
| Deployment | 75093c7d-7710-4965-9558-d8bdd2cf4e01 |
| Deployed at | 2026-11-20T11:48:58.171644Z |
| Traffic | 100% |
| PWA cache | e6e0c1ecd8a155d1, 76 resources |
| Rollback target | V2.40.0, Worker e157b7e5-8f56-40a2-b2d0-5e1bd54029a5 |

## Published behaviour

Study activities opens with its working controls and current session. Four illustrated instructions follow below the activity and records; each names the actual control, its role and what opens next. Their screenshots enlarge in the existing dialog. Workspace tabs have purpose captions. The activity summary is always visible, with green participation, blue recorded time and amber pending results; submitted results turn green when every nonempty reservation has a result. Member records and session dates use separate coordinated surfaces. Desktop, phone and dark-theme styles retain the existing interface system.

The matching frontend and Worker include the list's own pending-result flag and checkout's authoritative recorded-time fields, so pending results remain reachable and successful saves update the existing record. Existing permission checks, private task/reflection handling, timer engine, confirmed credit and retention remain in place. No database migration, dependency upgrade, new paid resource or OAuth change was needed. All 12 binding definitions, handlers and runtime settings matched V2.40.0; deployment used keep-vars. The local fixture Worker was not deployed.

## Verification

- Release build, Wrangler dry run and 686 release-mode tests passed.
- 62 candidate and 62 production HTTP checks passed, including robots, canonical, Sitemap and licenses.
- All 157 checked public HTML and non-audio/video resources matched their exact build hashes, including all four guide JPEGs. Served JS/CSS markers confirm the visible summary, tab captions and metric styles. Private query variants remain noindex/no-store; protected advanced/workspace APIs reject anonymous requests; Google remains available; fixture routes return 404.
- Six compiled local Worker/D1/Durable Object activity scenarios passed, including independent timers, checkout lock, no duplicate credit, private notes and WebSocket updates. These checks used isolated synthetic accounts.
- GitHub independently returned package version 2.41.0 at the exact runtime commit. Source was pushed to the existing release branch; no main merge.
- Production IAB loaded the public groups page and the existing signed-in room list. Opening the active room timed out and a subsequent tab rebind reset the control session. No fresh production activity-page screenshot, mobile layout or save interaction is claimed. Earlier actual local desktop/phone/light/dark, example dialog and result-draft checks remain local evidence.

The first build was invoked from the repository root and failed on an esbuild relative entry path; rerunning from app/ passed. The first targeted production script incorrectly expected 401 for a nonexistent activity route; it was corrected to the existing protected advanced endpoint. A redundant network content fetch and a later notice-file recheck timed out; all 157 first-pass hashes had already matched. Final targeted checks reuse that recorded hash proof, inspect the matching local bytes and repeat the relevant live privacy/API checks; all passed. No runtime code changed to bypass a check.

Artifact inventory: 199 files, SHA-256 971df05f45d390c7b6d0e3da69568ba039358917168fa384b45f4963f9fb766f. Source inventory: 442 files, SHA-256 b06f5db7b53add3a74bad675c4676f82524f38cccfabacb8a8431b86e829bf86. Ignored release evidence: docs/development/evidence/activity-guide-release-2026-11-20/.

No production timer, result, task, message, advanced-preview, role, subscription or preference save was initiated for acceptance. Existing accounts and records were retained. Rollback selects the previous Worker version without restoring the database. The unrelated FocusGuide.jsx working-tree status is preserved. Independent planner, authenticated community/moderation and main-promotion gates remain separate; later documentation-only commits do not imply a new runtime deployment.
