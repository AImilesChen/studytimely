# Shared page layout — local implementation

The site's tool and community pages previously combined different maximum widths (1120–1480px) with percentage or fixed inner padding. This made the actual content edges vary even on the same screen.

`app/src/page-layout.css`, imported last by `main.jsx`, now owns the screen layout for page frames and footer:

- Actual content maximum: 1280px, without additional frame padding.
- Horizontal gutters: 32px above 1024px, 24px at 651–1024px, 16px at 650px and below.
- Headings, tool areas, guides and FAQs use the same outer frame. The Calculator guide's extra 1180px cap is removed.
- Paragraph reading measures and internal form/card/dialog widths remain independent. Legal prose has an 80ch measure inside the common frame.
- Timer/clock heroes, navigation, presentation mode and print layout are outside these screen overrides.

## Validation

- Local noindex build: 56 routes plus 404, PWA `7508fbb522a2b657`, 62 resources.
- Existing 299 tests passed; 62 local HTTP route/asset checks passed.
- Actual in-app browser: 24 representative routes at 1440, 1024, 768, 390 and 320px (120 measurements). All frames matched the shared width/gutter rule; footer edges matched; no document horizontal overflow.
- Desktop heading/clock face/dock geometry compared before and after on Home, Flip Clock, Focus Timer, Pomodoro, Stopwatch, Countdown and Beijing time; no changes exceeding 1px.
- Guide outer edges checked across tool/community templates. Long paragraphs retain their existing reading measures.
- Focus/Escape restored the normal workspace; Focus hid header/guide. The Focus session settings panel remained 280px wide. Calculator calculation and expanded options fit at 390px.
- Saved and inspected desktop Groups, Tracker, world directory, Groups guide and phone Groups screenshots. Browser warning/error log read was empty. Final viewport reset to 1280×720; Groups preview marked deliverable.

Evidence is ignored under `docs/development/evidence/layout-2026-11-16/`. Baseline and responsive JSON retain exact measurements. The local Groups preview displays local account availability notices; no real sign-in or community mutation was attempted. Native fullscreen, physical audio and a full accessibility audit were not reverified for this CSS change.

## Delivery state

Local preview: http://127.0.0.1:4275/study-groups (also `/study-tracker`, `/time` and other routes).

Changes are uncommitted, unpushed and undeployed. Production remains V2.22.0. No version, timing/accounting logic, API, storage model, database, auth, dependencies, protected Sites adapters, tracking or legal text changes. Independent community acceptance/main-promotion gates remain unchanged. Publication is a separate user request.
