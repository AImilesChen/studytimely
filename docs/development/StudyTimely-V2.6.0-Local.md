# StudyTimely V2.6.0 global navigation

Implemented and verified locally on 2026-11-14. Production remains V2.5.0; this task does not represent a publication or GitHub push.

Community, rankings and account links previously appeared deep within homepage guidance and workspace pages. The shared header now shows Tools, Study Groups, Leaderboards and Account on desktop. At 1050px and below a labelled Menu button opens the same explorer. It includes prominent community/account cards and sixteen links grouped as Timers, Plan & track, and More tools. The header appears on all 55 existing routes, including timers, world clocks and legal pages.

The explorer uses the existing native dialog component for keyboard focus containment, Escape dismissal, backdrop dismissal and trigger-focus restoration. Page changes close it. Links retain ordinary modified-click behavior and reuse the existing navigation handler, including active-timer switch confirmation. Primary links respect the existing community/account feature flags. Account remains a neutral entry and does not fetch an identity or start sign-in automatically. Focus Mode continues to hide surrounding navigation.

The original timer hero, mode dock, quick sound/music controls, data and authentication flows are preserved. A scoped minimum-width adjustment removes the former 320px body floor when this header is present, allowing the content viewport to fit a narrow screen with a scrollbar.

## Validation

- Local noindex build prerendered 55 pages plus 404. PWA c27a5e864dfea30f precaches 61 public resources.
- All 128 existing tests passed. A subsequent CSS-only minimum-width correction was checked in the actual browser.
- Navigation HTTP verification passed on 55 pages: primary links, closed initial explorer, sixteen valid tool routes, active primary-page labels and one H1.
- All 61 existing route/resource, robots, Sitemap and license checks passed. Preview indexing remains disabled; real public canonical addresses remain unchanged.
- Browser checked eight route/viewport combinations: home 1440×900, Flip Clock 1280×720, New York 1051×800, Planner 1024×768, Beijing 768×1024, Pomodoro 390×844, Privacy 320×740 and Focus Timer 900×500. No horizontal overflow was observed after correction.
- Real UI checks covered desktop/mobile menu opening, a planner link closing the explorer and navigating correctly, Escape returning focus to the appropriate trigger, light/dark appearance, and Focus Mode hiding the header.
- A synthetic local study timer continued while the explorer was open. Choosing Pomodoro prompted the existing finish/switch confirmation; cancelling left the original timer running. The synthetic run was discarded afterwards, leaving 00:00:00 and zero saved study time. No real records or production data were used.
- Captured browser warning/error logs were empty. Protected Sites adapter files are unchanged.

Evidence is ignored under docs/development/evidence/navigation-2026-11-14/. Preview: http://127.0.0.1:4195/ . It requires the local preview server to remain running.

Reproduce HTTP checks with `PREVIEW_ORIGIN=http://127.0.0.1:4195 node app/scripts/verify-navigation.mjs` and the existing check:http command, using the environment-variable syntax of the selected shell.

No dependency installation, backend, schema, secrets, OAuth, account policy, Cloudflare resource or tracking configuration changed. Production community acceptance and the independent main-promotion gate remain pending. Actual GSC/Bing/GA4 platform state was not reverified for this navigation change.
