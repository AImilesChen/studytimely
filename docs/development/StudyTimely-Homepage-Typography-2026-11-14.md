# Whole-homepage typography revision — 2026-11-14

Implemented and verified locally. Not committed, pushed or deployed in this task. Preview: http://localhost:4185/.

The user clarified that the screenshot was an example and requested consistent treatment across the entire homepage. This revision covers the progress teaser, introduction, timer choices, instructions, learning scenarios, interval guidance, workspace, comfort controls, records, installation notice, FAQ and footer.

- Desktop primary body text is 17px with 1.8 line height; phone body text is 16px. Supporting text remains distinct at 14–16px. Main section headings use 32px desktop, 28px tablet and 26px phone. Text stays left aligned with natural word spacing.
- All ten content sections share the same outer boundaries. Introduction and records use two columns on desktop; comfort information has four labeled items in a two-column grid. Scenarios use rows with a heading column and a reading column. Each becomes a suitable single-column layout on phones.
- Examples and planning notes use deliberate full-width groupings. Interval explanations use two reading columns. The interval table becomes labeled stacked entries on phones, preserving its content and table headers.
- Workspace links, FAQ questions/answers, installation help, local-data note and footer links have matching readable type and spacing. Existing tool controls and expanded copy remain available.
- A homepage-only body minimum-width override fixes horizontal scrolling caused by the existing 320px body minimum plus a classic vertical scrollbar. Narrow toolbar padding also accommodates the playing badge. Other routes keep their existing body and typography rules.

Validation: final build passed; 10 existing site/PWA tests passed; 61 HTTP route/asset checks plus robots, Sitemap and licenses passed; `git diff --check` passed. No full engine/account regression was rerun for this presentation change. Existing Vite large-bundle advisory remains.

The final built preview was inspected in the in-app browser at 1440×1000, 768×1024, 390×844 and 320×740. Actual document scroll width equaled client width in all four checks, including the 305px usable width inside the 320px viewport. No tested paragraph, heading or FAQ summary overflowed. Desktop content sections all measured 1120px wide at the same left edge. Phone primary paragraphs all measured 16px. Captured browser warnings/errors were empty. FAQ expansion and the narrow playing-state toolbar were also checked.

Evidence is local under `evidence/home-typography-2026-11-14/`: `verification.json`, `http-checks.json`, `desktop-comfort.png`, `desktop-intro.png`, `mobile-comfort.png`, `mobile-footer.png`, `tablet-tools.png`, plus earlier section-layout inspection screenshots. Existing production community acceptance and main-promotion gates remain unchanged.
