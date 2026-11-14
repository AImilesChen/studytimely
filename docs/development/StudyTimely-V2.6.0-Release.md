# StudyTimely V2.6.0 production release

Published at https://studytimely.com/ on 2026-11-14. Community, rankings and account access are now visible in the shared header across all 55 existing routes. Desktop shows Tools, Study Groups, Leaderboards and Account. At 1050px and below, Menu opens the same explorer with three featured destinations and sixteen tools grouped by purpose.

## Source and deployment

- Public repository: https://github.com/AImilesChen/studytimely/tree/v2-google-community
- Runtime source: `179111d1c4a462a67613e10386124ed1f5ac8a5d`.
- Exact runtime tree: `979d2cbf7be57d9102356a00b416e9031eda273b` (211 tracked files).
- Worker version: `7b30afbc-f65a-4092-9c5e-ea3f1de0630a`.
- Deployment: `12c61556-1db6-4d12-a476-7def98d21b65`, created `2026-11-14T12:19:44.489968Z`, confirmed serving 100%.
- PWA: `5e8a9f270dea11e5`, with 61 public precache resources. The existing idle browser applied the app update before acceptance.

GitHub's official Git Database API published the exact verified tree. The local branch and its remote-tracking ref were aligned to the canonical API-created commit. Main was not promoted. Later documentation-only commits do not represent another runtime deployment.

## Verification

The release build prerendered 55 pages plus 404. All 128 existing tests and the scoped Cloudflare deployment preflight passed. Release-candidate navigation checks passed on 55 pages, alongside the existing 61 local HTTP, SEO and resource checks. The production navigation verifier also passed on all 55 routes, checking three primary links and sixteen tool links per explorer.

All 151 public release checks passed, including 55 routes, canonical/robots behavior, 48 Sitemap URLs, 72 exact public asset hashes, PWA resources and anonymous API boundaries. Full music-file requests initially exceeded the short download timeout; a longer timeout completed successfully and all five unchanged complete recordings matched their local hashes. A 262144-byte audio range probe independently returned 206 with the expected length. This was a download-verification timeout, with no application change required.

The actual production in-app browser verified the desktop Tools explorer at 1440×900, the labelled mobile Menu at 320×740, all sixteen tool links and the three featured entries. Escape closed each menu and restored focus to its corresponding trigger. The phone viewport measured 305px client width and 305px scroll width. Selecting the Study Groups card navigated to `/study-groups`, displayed its heading and closed the explorer; that destination also had no horizontal overflow. Captured warning/error logs were empty. The viewport override was reset and the homepage left available with the timer idle at `00:00:00 elapsed`.

The active-timer switch confirmation was verified with synthetic local data during implementation acceptance. No production timer was started, reset or completed during release acceptance. No production records, profiles, rooms, opt-ins or rankings were created or changed.

Production evidence is ignored under `docs/development/evidence/navigation-release-2026-11-14/`, including deployment status, runtime GitHub receipt, HTTP reports, build/test logs, desktop/phone screenshots and browser observations. Implementation detail and earlier local acceptance are recorded in `StudyTimely-V2.6.0-Local.md`.

## Configuration and recovery

All nine runtime binding names/types match the before-release snapshot. There were no database migrations, secrets, OAuth, protected Sites adapter, resource, DNS, dependency or analytics configuration changes. Actual GSC, Bing and GA4 platform state was not reverified for this navigation release.

Rollback target is the preceding V2.5.0 Worker version `b030269b-ece4-48ee-a566-8d987c1f8ec6`, whose source is `c5ea18c2b1563cf2f43da38065abb91e22f6e744`. Retain the existing deployment tooling and bindings when selecting that version.

The independent acceptance gate for authenticated production rooms, shared timers, chat and moderation actions remains pending. This navigation release does not claim that acceptance or promote main.
