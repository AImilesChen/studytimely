# StudyTimely V2.5.0 city time guides

Implemented and verified locally on 2026-11-14. Production remains V2.4.0; this handoff does not represent a deployment or GitHub push.

## Result

All 32 existing city pages now include an individual introduction, regional clock-rule explanation, two local-topic sections, a study-planning example, three answered FAQs and relevant city comparisons. The 96 FAQ answers and stable explanations are included in the initial HTML. The original clock hero, date, colon separators, favourites and mode dock remain available. The directory adds a short guide to finding and comparing clocks.

Comparisons include the local date and date difference. Desktop keeps a semantic table; narrow screens use labelled city cards without dropping time, date or difference. Body text is 18px on desktop and 16px on phones, with left alignment and bounded reading widths. City-specific search titles/descriptions, self-canonical URLs and matching BreadcrumbList data are rendered initially and updated during client navigation. No FAQ rich-result claim or new city-pair URL is added.

## Time-zone consistency

The former host Intl rules calculated Vancouver as UTC−8 after its 2026 policy change. Supported-city calculations now share a generated IANA 2026f table covering 31 distinct identifiers for 32 cities, with transitions for 1970–2100. Vancouver retains its historical seasonal rules but stays UTC−7 after the 2026 change. Cairo, fractional offsets, and southern-hemisphere seasons use the same date-aware engine. The live next-change card shows the final second before and first second after an offset change.

The generator reads data only from a pinned Python Software Foundation tzdata 2026.6 wheel; it does not install or execute package code. Archive SHA-256 is `0a10eec6e13ef16b627fabed9a5f2ba61a62b1c67f327305f4e7e412a70b4aec`. Regeneration: `python scripts/update-time-zones.py` from app/. The generated table is tracked; normal builds do not need Python or network access. Attribution and the archive's Apache license are included in public notices.

Current time still comes from the device clock. Unlisted local-zone identifiers and dates outside the bundled range use host rules. Future legislation requires a reviewed table/content update. The current-time table is not a future-date converter or group scheduling system. These boundaries are intentional; sunrise/sunset and a date-selection converter remain outside this change.

## Verification

- Local noindex build: 55 pages plus 404; PWA `3c0fdcd2e283990d`, 61 precached resources.
- 128 tests passed, including eight new groups covering Vancouver's old/new rules, Egyptian midnight boundaries, austral seasons, fractional differences, table coverage, 32 editorial records, city metadata and initial-HTML FAQ content.
- 32-city HTTP checks passed with 96 complete FAQ answers, independent canonical/breadcrumb data and valid internal navigation links. Initial guide sections contain 572–665 words including shared supporting information; no word count threshold was used as a ranking claim.
- 61 existing route/resource, robots, Sitemap and license checks passed. Preview robots remain disallow-all and the preview Sitemap is empty.
- In-app browser checked six viewport sizes: 1440×900, 1280×720, 768×1024, 390×844, 320×740 and 900×500. No horizontal overflow was observed. New York and Sydney live states were checked again after initial storage hydration.
- Browser interactions verified section anchors, keyboard FAQ expansion, city navigation, Vancouver directory search at UTC−7, a New York favourite surviving reload, dark/light layouts and readable mobile comparison cards. Captured warning/error logs were empty.

Evidence is ignored under `docs/development/evidence/city-guides-2026-11-14/`. Local preview: http://127.0.0.1:4193/time/new-york#time-zone . The server must remain running to view it.

No dependency installation, database migration, secrets, OAuth implementation, account flow, analytics configuration, Cloudflare resources, protected Sites adapters or production records changed. Real GSC/Bing indexing and GA4 collection were not reverified in this local task. The separate authenticated community acceptance and main-promotion gate remain pending.
