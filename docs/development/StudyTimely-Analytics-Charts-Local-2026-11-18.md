# Learning analytics chart polish — local

18 November 2026. Local-only visual and chart-interaction revision, not published. Production/package remain V2.30.0; all earlier dirty analytics and group-access work is preserved.

## Changes

- Extracted Trend and SubjectChart into AnalyticsCharts.jsx with a shared, dependency-free chart geometry model. Overview defaults to a softly filled SVG line curve; Line/Bars controls keep the same data groups and drill-down actions. Current period is solid green; previous period is a subdued dashed line, or lightly filled columns. Numeric duration ticks, readable date labels, point values, focus indicators and keyboard activation are included. ResizeObserver keeps SVG label sizes aligned with actual container width; a clientWidth fallback is present.
- Curved controls stay within adjacent recorded endpoints and cannot invent higher or lower peaks. Long date ranges group to at most31 columns without losing time. Missing prior-month dates remain null/not comparable, not invented zero-time days. Tooltip/data table retain exact values and date bounds. Today is labelled clearly, and its tooltip says so far.
- Up to five subjects use a segmented ring with total/selected time and a labelled interactive legend. More subjects retain horizontal bars. Ring and legend both filter the existing report; the saved-review version is read-only. Existing stable subject colours are shared with record markers. Empty and one-subject cases are supported.
- Four overview metrics have consistent Phosphor line icons and larger figures. Legends, dates, captions and other supporting text are generally14–16px instead of the earlier9–12px labels. Desktop aligns trend and subject panels; tablet uses a horizontal ring/legend arrangement before the phone single column. Light/dark theme variables and reduced-motion rules are included.
- Public guide now describes line/bar switching and ring/bar subject presentation. No storage, computation engine, entitlement, billing, schema, API, dependency or production changes were made by this visual revision.

## Checks

-32 focused tests passed: six new chart-geometry checks,20 analysis tests,3 transactional learning-storage tests and3 tracker metadata/SSR tests. Tests verify grouped totals, missing prior dates, readable scale bounds, narrow/wide coordinates, no overshoot and stable colours, plus existing learning/report behaviour.
-Final local build56routes+404/noindex/PWA895bbe51417728ab/62resources. Existing bundle-size warning remains.
-62 local HTTP/asset/SEO checks passed at localhost4310, using the matching current frontend files.
-Real React chart components rendered on the server for0/1/2/5/6 subjects; ring/bar/empty selection, line controls, labelled keyboard points and no React warnings checked. Initial title-child warning was fixed with one string child.
-Standalone SVG geometry renders were inspected for the trend and ring. They are not full-page browser screenshots; the ring centre/legend use HTML and are not part of the standalone SVG image. An initial QA renderer failed because the icon package's CommonJS entry was interpreted as ESM; bundling icons for that QA script resolved it without changing app dependencies or production code.
-In-app Browser is not listed/available; no native Windows or local Chrome substitute used. Full page screenshots, actual hover/click/toggle/keyboard behaviour, responsive browser measurements and full accessibility acceptance remain unverified. Compiled/SSR/geometry/HTTP checks do not replace those checks.

Preview: http://127.0.0.1:4310/study-tracker?example=1 . Existing preview process15361 reads the current static frontend; Worker API/config were not changed in this revision. Synthetic example remains isolated and clearly labelled. The earlier advanced-analytics handoff remains authoritative for data/exports/access and future publication requirements.

Ignored evidence: docs/development/evidence/analytics-charts-2026-11-18/ (build.log, tests.log, http.log, component-checks.json, final-component-checks.json, component-markup.html, standalone geometry SVG/PNG). No screenshots or competitor assets were added to public application assets. Not committed, pushed or deployed.

## Follow-up: brighter data colours

User screenshot feedback: previous-period columns blended into the dark card. Locally increased current mint to#79e1bd and previous blue to#9bb8f4; previous bars opacity.24→.78 and previous lines/dots.95. Stable subject palette is now brighter mint/blue/lilac/amber/cyan/pink. Cards use a lifted#242a27 surface, clearer#465047 border and brighter captions; light mode uses a light card with darker plot colours and toned subject hues. No data or layout/interaction changes. Calculated bar/background contrast: old previous1.53:1, new dark previous5.08:1/current9.28:1; light previous4.15:1/current5.06:1. These are colour calculations, not full accessibility or browser acceptance.

Nine existing chart/metadata/SSR tests and62HTTP checks passed; final local build56+404noindex/PWA432c548ab2e06e16/62resources. Evidence analytics-contrast-2026-11-18 contains contrast.json,build.log,tests.log,http.log. In-app browser remains unavailable and no whole-page visual/interaction check is claimed. Preview4310 uses the updated frontend. Not committed, pushed or published.
