# StudyTimely V2.6.1 production release

Published at https://studytimely.com/ on 2026-11-14. Timing pages now connect the header fullscreen button to the quiet timer presentation: navigation, heading, toolbars and below-fold content hide; the time, colons and optional date remain. Focus provides the same layout within the window, distinguished by an EyeSlash icon. Timer actions remain available, and exiting restores the ordinary interface and original workspace position.

## Source and deployment

- Repository: https://github.com/AImilesChen/studytimely/tree/v2-google-community
- Runtime source: `6cd434f81025fc4f50ddd0f3d3e276517882eebe`.
- Exact runtime tree: `16f60ae4cfb06bad608459d37f1ecbb532c326aa`, 215 tracked files.
- Worker version: `74dd9b67-dca3-4e03-90f4-d53e2abe73fe`.
- Deployment: `850fe24c-2eaa-4fd5-b933-57041531a069`, created `2026-11-14T13:04:14.50346Z`, confirmed serving 100%.
- PWA: `5f36fd2040e03573`, 61 public precache resources.

GitHub's official Git Database API published the exact verified tree and aligned the local branch to its canonical commit. Main was not promoted. Later documentation-only commits do not imply another deployment.

## Verification

The production build prerendered 55 pages plus 404. All 128 existing tests, the 61 release-candidate HTTP/SEO/resource checks and Cloudflare deployment preflight passed. Protected adapter files are unchanged.

All 146 scoped public checks passed, including all 55 routes, redirects/error pages, canonical/robots behavior, 48 Sitemap URLs, PWA resources, anonymous API boundaries and exact hashes for 67 public non-MP3 assets. The five unchanged licensed recordings were checked locally against the previously verified complete production file hashes. They were not downloaded again in this release check. A transient font download timeout passed on retry.

The production in-app browser first confirmed an idle `00:00:00 elapsed` timer and applied the available PWA update. On Flip Clock, selecting the header fullscreen button entered the quiet-layout fallback: header, heading and toolbar were hidden while both colons and the date remained. The resulting production screenshot was saved. Escape restored the header and toolbar, returning focus to the original fullscreen button; client width and scroll width both measured 1265px. The separate Focus control was checked at 320×740: the timer occupied the viewport, menus were hidden, scroll width remained 320px and the idle exit control faded. Captured warning/error logs were empty. The temporary viewport override was reset and the production tab retained as the deliverable.

All browser interactions used in-app browser webpage interfaces, with no desktop or other local application input control. No production timer was started, reset or completed, and no sign-in, profile, room or ranking mutations were performed. Timer/music continuity and workspace scroll restoration were verified with synthetic local data during implementation, as recorded in `StudyTimely-V2.6.1-Local.md`.

Native fullscreen is not permitted in this in-app browser environment. The screenshots and browser results demonstrate the quiet-layout fallback and window-only Focus; actual native fullscreen entry, browser-Escape exit and native screen resizing remain unverified in a supporting browser.

Evidence is ignored under `docs/development/evidence/presentation-release-2026-11-14/`, including deployment status, runtime GitHub receipt, HTTP report, build/test logs, browser observations and production desktop/phone screenshots.

## Recovery and configuration

All nine runtime binding names/types match the pre-release snapshot. There were no database migrations, dependencies, secrets, OAuth, DNS, analytics, protected adapter or Cloudflare resource changes. GSC, Bing and GA4 platform state was not reverified for this presentation release.

Rollback target is the preceding V2.6.0 Worker `7b30afbc-f65a-4092-9c5e-ea3f1de0630a`, runtime source `179111d1c4a462a67613e10386124ed1f5ac8a5d`. Preserve the current bindings when selecting that version.

The independent acceptance gate for authenticated production rooms, shared timers, chat and moderation actions remains pending. This release does not claim that acceptance or promote main.
