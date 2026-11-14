# StudyTimely V2.5.0 production release

Published to https://studytimely.com on 2026-11-14 at 09:07:29 UTC, serving 100% of traffic.

All 32 city time pages now provide individual regional introductions, clock rules, study-planning examples, date-aware city comparisons and 96 complete FAQ answers. Stable content is present in the initial HTML. Existing clock heroes, dates, favourites and mode navigation remain available. City metadata and matching BreadcrumbList data distinguish the pages without creating duplicate city-pair URLs.

Supported city clocks use pinned IANA 2026f rules for 31 identifiers representing 32 cities. This fixes Vancouver's 2026 move to year-round UTC−7 while preserving historical rules, Egyptian midnight changes, fractional offsets and southern-hemisphere seasons. Local device time still supplies the current instant; unsupported identifiers and dates outside 1970–2100 fall back to host rules. Future rule changes require a reviewed data/content update.

Desktop content uses 18px body text; phone content uses 16px text and labelled city cards that retain time, local date and relative difference. Sources, data licensing and clock limitations are visible. Future-date conversion, study-overlap planning and sunrise/sunset are not part of this release.

## Source and deployment

- Runtime source: `c5ea18c2b1563cf2f43da38065abb91e22f6e744`.
- Exact source tree: `c51518006ff2a27afe3731052fb75bcb2198996a`.
- Source: [public v2-google-community branch](https://github.com/AImilesChen/studytimely/tree/v2-google-community).
- Worker version: `b030269b-ece4-48ee-a566-8d987c1f8ec6`.
- Deployment: `4fe71424-61d3-4370-a87c-996a4e2496ff`.
- Release PWA: `838873d4bbda6e09`, 61 precached resources.

The official GitHub Git Database API was used with existing credentials because HTTPS Git transport was unavailable. The complete published source tree was verified identical to the local candidate. Later documentation-only commits do not represent a new runtime deployment.

## Verification

- Production build, Cloudflare dry run and all 128 tests passed in release mode.
- Local release checks passed for all 32 city guides/96 answers and 61 existing route/resource checks.
- All 151 public checks passed: 55 routes, canonical/indexing rules, redirects and 404s, 48 Sitemap URLs, anonymous account/community readiness, and exact hashes of all 72 public assets, including unchanged full music recordings.
- Production city-specific verification passed for 32 pages and 96 initial-HTML FAQ answers, metadata, breadcrumbs, valid internal links, directory content and the public data license.
- Actual production in-app browser verified New York's next transition with exact before/after seconds; 18px desktop text; 16px text and complete comparison cards at 320px; no horizontal overflow; keyboard FAQ expansion; section anchors and city navigation. Vancouver displayed Pacific Time and UTC−07:00 with no seasonal change. Captured warning/error logs were empty.

All nine binding names/types are unchanged. No database migration, secrets, OAuth implementation, protected Sites adapters, tracking configuration, DNS, paid plan or unrelated resource changed. Browser acceptance did not modify production favourites, study history, community data or account settings. GSC/Bing indexing and GA4 platform collection were not reverified by this release.

Rollback target: prior V2.4.0 Worker `6b4e96a4-2ab6-415e-a62f-bfac5b5ee836`, deployment `45e59770-74a9-4a30-b88a-09edfc65f028`. Local evidence is ignored under `docs/development/evidence/city-release-2026-11-14/`.

The independent authenticated production room/timer/chat/moderation acceptance and main-promotion gate remain pending. This content release does not claim to complete them.
