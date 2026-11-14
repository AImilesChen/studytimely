# Homepage content update — 2026-11-14

Historical local-validation snapshot. These changes were subsequently released as V2.2.0; see [production release record](StudyTimely-V2.2.0-Release.md).

Status: implemented and verified locally; not committed, pushed or deployed in this task. Production remains V2.1.4.

Scope: the below-fold content on `/`. Existing timer controls, heading, progress data, other tool pages and legal policies are preserved.

## Content and layout

- Six purpose-based timer cards distinguish study records, laps, general countdowns and a display-only clock.
- Three usage steps follow the actual Start, Pause and Finish session controls.
- One compact table offers 25/5, 50/10 and custom/count-up examples, without claiming an optimal schedule.
- Workspace links are grouped into planning, exam preparation and progress review. Auxiliary tools remain available; Study Space introduces themes and manually started ambient sound.
- The existing dynamic PWA status remains functional, moved below the workspace into a compact card. Its homepage heading is H2; other uses retain H3.
- Eight FAQs preserve local-data loss, explicit manual sync, free anonymous tools and browser-alert limitations, and add offline use, duration settings and sound/theme guidance.
- Existing title, description, canonical, robots, schema and Sitemap behavior are unchanged. The new content is present in prerendered HTML, with one H1.

## Verification

- `npm run build`: passed; 55 pages plus 404 prerendered, preview is noindex. Vite reports its existing large-bundle advisory.
- `npm test`: 95 passed, 0 failed.
- `PREVIEW_ORIGIN=http://127.0.0.1:4174 npm run check:http`: 61 route/asset checks passed, including robots, Sitemap and licenses. The initial attempt used the script's default unused port 4181; rerunning against the actual preview port passed.
- In-app browser: desktop 1280px, phone 390px and narrow 320px had no horizontal document overflow. Desktop uses two timer-card columns; phone uses one. The interval table and workspace groups remain readable.
- FAQ expansion shows the actual local/manual-sync answer. Focus Mode and Back to workspace work.
- A local-only study session started, paused at 55 seconds, and finished; Today then displayed 55 sec and the timer reset to zero. No production account or community action was used.
- Browser error/warning logs were empty for the inspected local tab.
- `git diff --check`: passed.

Preview: http://127.0.0.1:4174/ (requires the local preview process).

Evidence: `evidence/home-content-2026-11-14/desktop.png`, `mobile-choices.png`, `mobile-rhythm.png`, and `http-checks.json`. Evidence remains local under the repository's existing ignore rules.

No search-ranking, indexing or conversion improvement has been measured. Existing production community acceptance and main-promotion gates remain unchanged.
