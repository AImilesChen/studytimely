# V2.30.0 — Study room flow and member management

Published at https://studytimely.com/study-groups on 17 November 2026. This release makes quick-message controls clearer, exposes member management and leaving at the top of a room, and simplifies scheduled-activity presentation.

- Runtime source commit: `6a5ae30dde60d844b7e794d53aaf7cfaf43b7682`.
- Exact source tree: `e566ef954fdbae8c1efa534a55676c818399c34e`, branch `v2-google-community`.
- Worker: `92760710-e625-40a0-83ef-f764d616c065`.
- Deployment: `1b6d52c7-bab8-4c3a-b660-64e00a729000`, `2026-11-17T15:38:02.334444Z`, 100% traffic.
- PWA: `60583b891c114282`, 62 resources.
- Source inventory: 297 files, SHA-256 `cea34b32f53255073cf5028e815561f6cb3b8ee9eae8197da28c04e5a7a574a2`.
- Artifact inventory: 142 files, SHA-256 `6de7e0b71ab7b53dbdfa063eebacdd8d09e25e87a528d483b3f123c19d6db1e1`.

## Behavior and data

Quick-message categories have a strong selected fill. Message buttons have clearer boundaries and larger targets. The five existing cat stickers remain unchanged. The room toolbar exposes Members, owner Room settings and ordinary-member Leave room. Owners can open a member's controls from the member card's labelled ellipsis. Mobile member actions use full-width rows.

Remove from room frees the place and permits a later normal invited return. Block rejoining prevents return until the owner chooses Allow rejoining. Allow rejoining does not add the member or restart a timer. Departure pauses the room timer and withdraws activity participation while preserving credited history. Legacy `remove` and `restore` actions retain their compatibility behavior. Final mutation checks atomically revalidate the session, active membership, current owner/admin role, target-owner protection, room closure and legacy restoration capacity.

Current members can see recent connection information and the latest retained UTC study day within that room. The new last-study-day field is withheld from public visitors. These records do not prove attention or learning. Privacy and public usage guidance explain the visibility and access behavior.

Activities have one heading, current-step guidance, the joined member's private task and compact ongoing progress. Task editing and participant details remain available on demand. Room settings now use a dialog, and a compact summary shows shared daily progress. Timer accounting, learning credit and daily-goal calculations are unchanged.

No database migration or data reset was required. Existing production migrations 0001–0010 remain sufficient. All twelve original binding definitions and script runtime settings were read back unchanged. Automatic review remains disabled, provider Cloudflare and configured daily budget5000; there is no AI binding or new inference call. Payments, larger subscription rooms and subscriber text chat were not activated. No DNS, secret rotation, new OAuth grant, dependency, tracking or protected Sites-adapter change.

## Acceptance and source synchronization

The final release build generated56routes+404. All383 release-mode tests passed, including eight new member-management tests. Deployment dry-run,62 candidate and62 final public HTTP/SEO/resource checks passed. After cutover,136 exact public non-MP3 resource hashes matched the manifest, including56 navigation pages, the updated member-management client/styles, guide and privacy text. Public PWA, account/leaderboard guards, room API metadata, private-query noindex and fixture404 checks passed. A transient EOF interrupted the first final HTTP pass; the same assertions then passed with bounded transport retries and five parallel route reads. Licensed MP3 files are unchanged from their earlier acceptance.

Cloudflare authentication initially failed in the sandbox; an authorized official CLI retry with IPv4 preference refreshed the existing login. The initial post-deploy readback also needed one network retry. No new permissions were requested. Git HTTPS attempts and a Node API connection timed out; the connected GitHub integration lacked repository write permission (403). The existing Git credential helper and official GitHub API through PowerShell then synchronized all15 changed files, including the already-authorized AGENTS.md and release records. Uploaded tree and commit hashes matched exactly; no force update or remote history rewrite occurred. Independent connector readback confirmed the exact runtime commit. No credentials were printed or written to source/evidence.

Node public HTTPS connections timed out, so public verification used a read-only PowerShell HTTPS transport with normal certificate validation and preserved HTTP status/headers. Production IAB navigation and same-URL recovery both timed out and reset the browser runtime. No production screenshot, console read, authenticated member removal/leave, message action or timer start is claimed. Detailed member lifecycle, permissions, activity join, settings save, keyboard and light/dark desktop/390/320 acceptance remains genuine local Worker/D1/DO evidence described in the local handoff. Real two-person production/moderation acceptance and the independent main-promotion gate remain pending.

## Recovery and evidence

Rollback target: V2.29.0 Worker `b7b1b7ea-18b7-4671-bfcc-45343137aefb`. No database rollback is required; retain existing schema and credited data. Roll back the matched frontend and Worker together. Older runtime lacks the new actions and UI; compatible legacy removal still blocks. Do not reset memberships or restore a whole database merely to revert presentation.

Ignored evidence: `docs/development/evidence/room-usability-release-2026-11-17/` contains build/tests, candidate/public HTTP reports, manifest, dry-run/deployment, before/after runtime metadata, exact public hashes and Git synchronization record. Local interaction screenshots remain in `room-usability-2026-11-17/`. Later documentation-only commits do not imply another runtime deployment.

CLI behavior was checked against the official [Wrangler documentation](https://developers.cloudflare.com/workers/wrangler/commands/).
