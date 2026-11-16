# Flip Clock content and SEO — local handoff

Implemented on 16 November 2026 in the existing release repository. This work is local only: no commit, GitHub push or production deployment was performed. Production and the package version remain V2.21.0. Preview: <http://127.0.0.1:4273/flip-clock> (noindex).

## Delivered changes

The accepted clock hero is preserved: heading/subtitle, three portrait panels, colon separators, external date, quick tools, dock, settings and presentation controls. The World clock panel retains its twelve destinations, including Beijing and Shanghai. The clock's learning-progress teaser and generic learning-data note are removed; the homepage keeps its study overview.

`FlipClockGuide.jsx` replaces the generic three-step/FAQ content on this route with 2,663 English words and 12 complete FAQ answers in initial HTML. It explains the actual settings paths, 12/24-hour notation, seconds/date, sizes/themes/reduced motion, Focus versus fullscreen, desk/second-screen/classroom setups, device time and zone, troubleshooting, remembered preferences, installation/offline limits and the right related tool. It does not claim internet/atomic synchronisation, a guaranteed always-on screen, automatic study credit or an operating-system screen saver.

Guide buttons open the existing Timer and Appearance settings panels and enter the existing Focus view. Contents and return anchors, city links and related-tool links use actual destinations. App readiness is placed within its installation section; the shared PwaStatus component has an optional clock-specific description, while other pages retain the existing default wording and update safeguards. No audio starts automatically.

SEO title is “Free Flip Clock with Seconds & Fullscreen — StudyTimely”; the existing “Free Online Flip Clock” H1 stays unchanged. The description reflects real display capabilities. Canonical and WebApplication remain, and BreadcrumbList matches the guide's visible breadcrumb. No ratings or unsupported FAQ-rich-result claims were added. Text is present before JavaScript; the clock continues to use loading placeholders until device settings are ready.

Scoped below-fold styles align the World clock panel and guide edges. Desktop text uses 18px, phone text 16px. Long sections place their headings beside the reading column on wider screens and stack on smaller screens. FAQ answers remain expandable, and the comparison table scrolls within its container on narrow devices rather than widening the document.

## Verification

- Local build: 56 routes plus 404, PWA `f315c8eeb223dd61`, 62 precache resources. Existing Vite large-bundle advisory remains.
- 299 tests passed, including the new clock/home intent regression and metadata checks. The test verifies that removing the clock teaser does not remove the homepage overview, that guide links are real, that twelve answers are in HTML, and that canonical/breadcrumb/free-app metadata are correct.
- 62 local HTTP checks passed for routes/assets, redirects, canonical, noindex robots/sitemap and license output. No GSC/Bing/analytics-backend configuration or verification was performed for this local change.
- Actual in-app browser before/after measurements at 1440×900, 1280×720, 768×1024, 390×844, 320×740 and 900×500: no document horizontal overflow; World clock/guide edges match; desktop/phone paragraph text is 18px/16px. Hero heading, face, date, quick tools and dock match the baseline within 0.6px for X/document-Y/width/height. Document coordinates account for scrolling. Saved before/after hero images and desktop/mobile guide screenshots were visually inspected.
- Actual interactions: guide opens Timer settings; seconds off gives two panels and restoring gives three; 12-hour format with hidden date shows PM; 24-hour/date defaults restored. Appearance opens its correct tab, Large/reduced-motion changes apply, and Medium/full-motion defaults were restored. Focus hides surrounding content, and Escape restores the workspace. FAQ opens its answer and closes with Enter. The Beijing link opens its existing city page. Captured application warning/error logs were empty.
- One native-fullscreen button request did not enter native fullscreen in the in-app browser. Fullscreen browser support, fullscreen exit behavior on real devices, installation/offline behavior, physical audio, screen sleep prevention and full assistive-technology coverage are not claimed as verified. The existing presentation hook and fullscreen implementation were not changed. Focus/Escape was observed separately.

Ignored evidence: `docs/development/evidence/flip-clock-2026-11-16/` includes `build.log`, `tests.log`, `seo.json`, `hero-before.json`, `responsive.json`, browser notes and saved screenshots. The preceding read-only production content inspection remains under `flip-clock-analysis-2026-11-16/`. Local evidence is not production evidence.

## Scope and next release

Application files changed: App.jsx, PwaStatus.jsx, routes.mjs, site.mjs; added FlipClockGuide.jsx, flip-clock-guide.css and flip-clock-page.test.mjs. No clock engine, timer accounting, model/storage format, API, database, dependency, credential, binding, paid resource, DNS, legal page, tracking configuration or protected Sites adapter was changed. Existing unrelated user features and the independent community/main-promotion acceptance gates remain intact.

Publication is a separate user-requested step. Rebuild in release mode, bind the artifact to the actual source commit, deploy the same verified source, and check public HTML/assets. The retained preview starts at the original clock hero with default display preferences, no open dialogs and no created learning records.
