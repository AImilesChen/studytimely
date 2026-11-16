# StudyTimely V2.24.0 production release

Published at <https://studytimely.com/leaderboard> on 16 November 2026. This supersedes the local-only status and earlier visual revisions in `StudyTimely-Leaderboard-Local-2026-11-16.md`.

## Published behavior

The board precedes personal participation/history. The first three participants use metallic gold trophy/silver medal/bronze medal assets in 2–1–3 visual order. Awards follow actual competition ranks in a tie. Empty seats say Open place with no score; there are no invented users or repeated vacancy rows. With at most three entries, the default table is omitted. Otherwise it continues after the participants already showcased; ties retain actual ranks. Search covers all provided Top 100 entries, including leaders. Twenty-row pagination follows the remaining or searched population and hides one-page controls.

The empty-board action performs the next step directly: sign-in/link Google opens Account, profile setup or ranking review opens the existing dialog, and opted-in participants open Study Groups. Loading/error states retain status/retry. Participation remains optional, with no automatic public opt-in or acceptance of declarations.

Personal participation, exact rank beyond the Top 100 and up to 30 recent private daily results are available. New Google-authenticated GET `/api/community/leaderboard/me` scopes data to the requester and retains private/no-store/noindex headers. Public/personal rankings share scoring queries; public metadata includes UTC periods/boundaries, update time and participant count. Existing timer credit, daily cap, opt-out/history and tie rules remain. Groups disclosure wording now explains public/search visibility and inclusion of retained/private-room time; behavior is unchanged.

Initial HTML contains the original 2,644-word guide, 12 answered FAQs, contents/related links, canonical, WebPage and BreadcrumbList. The public leaderboard is indexable and included in the release Sitemap. Public visibility is disclosed without promising nickname exclusion from search engines. No migration, stored format, dependency, credential, auth implementation, resource binding, tracking configuration, legal policy, protected Sites adapter, DNS or paid resource changes were made.

## Source and deployment

- Runtime source: `4fb2003b598463f99f4547c0e36f578f5f27b741`.
- Git tree: `1bed887bc4ccfbf5daba548409cf8f49f6d7b97f`.
- [Public GitHub commit](https://github.com/AImilesChen/studytimely/commit/4fb2003b598463f99f4547c0e36f578f5f27b741): 18 reviewed files pushed natively to `v2-google-community`, without force. GitHub connector independently read version 2.24.0.
- Worker version: `8b43868a-2806-4a77-90c3-fd669057c609`.
- Deployment: `3a449728-d21a-4e50-b503-df89a08b3138`, created `2026-11-16T15:49:04.30924Z`, read back serving 100%.
- PWA: `2c34ea2b0ef69990`, 62 precache resources. Online award PNGs are separate; no new offline availability is claimed.
- Source inventory SHA-256: `edae854bbe985e948f5451749840ace31dbc7a1566a11b916b0edd8c8912886f`.
- Artifact inventory SHA-256: `6ac8c69fdc2ac0eda8b7769ba99e5546039d4d5bd09dff8124228a49b8867ec7`.

Existing Cloudflare authorization was refreshed with previously approved permissions. Deployment used `--keep-vars`; all nine binding names/types and plain/D1/Durable Object definitions were compared before/after. No fixture Worker was deployed. Main was not promoted.

## Verification and limits

The release build produced 56 pages plus 404. All 308 regression tests, Wrangler dry-run, 62 candidate and 62 public HTTP checks passed. All 128 public non-MP3 files exactly matched the release inventory, including three award PNGs and all 56 pages/navigation. The first exact-file pass encountered a transient `/stopwatch` mismatch shortly after deployment; a follow-up read and complete final run matched. Three public ranking periods returned 200 with valid metadata and zero public participants at verification time. Anonymous personal-endpoint access returned 401 with private/no-store/noindex headers. No fake data was published.

Actual production IAB showed the new award seats, no duplicate empty table, and the existing signed-in account with public ranking off. Review public ranking opened the real dialog directly; Cancel closed it. No nickname, ranking setting or declaration was submitted. Personal score/participation/history loaded through the production endpoint. Google sign-in was not restarted. At 390px, there was no horizontal overflow and all three award images loaded. Actual desktop/phone screenshots were saved and inspected. Warning/error logs were empty, viewport reset and production tab marked deliverable.

Populated lists, search/paging, ties, first-profile setup and opt-out/history retain the local/model evidence in the local handoff; these were not tested by mutating production users. No production rooms, learning, messages, rankings or cloud data were created or altered. Production room/timer/chat/moderation acceptance and main promotion remain independent pending work. Load, full accessibility, native fullscreen, installation/offline, physical audio and analytics backend outcomes were not reverified.

Ignored evidence: `docs/development/evidence/leaderboard-release-2026-11-16/` contains build/tests/preflight/dry-run/deploy/public checks, inventory, sanitized runtime summary and accepted `leaderboard-production-desktop.jpg`/`leaderboard-production-phone.jpg`. Raw runtime records remain private. Later documentation commits are not runtime deployments.

## Recovery

Previous V2.23.0 Worker `e6bc1a5b-d758-4849-a831-a11a0331c700` is the rollback point. No automatic D1 restore is needed: this release adds no migration and retains formats. Rollback removes the new UI/personal endpoint together; room contributions and profiles are retained. Finish active learning before accepting a waiting app update.
