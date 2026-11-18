# V2.31.0 — Learning analytics, reviews and study calendar

Published at https://studytimely.com/study-tracker on 18 November 2026. This supersedes the local-only status of the analytics, chart/calendar and room-access handoffs dated 18 November.

## Release identity

- Runtime source: `8d8e0167d467cdde2a3baf32ef3da447788dcfe0`; tree `9184f3f0acf8fe9cd78079bcfbcfb97c8f914cc5`, branch `v2-google-community`.
- Worker: `6b31ee3f-0983-423a-b75d-4c5bc30f95a4`.
- Deployment: `a988f967-5ba0-42ea-a1ea-9011b455b9ef`, `2026-11-18T05:44:36.604224Z`, 100% traffic.
- PWA: `496d80ce7957dc5b`, 62 resources.
- Source inventory: 322 files, SHA-256 `5e164ecfe5f7e751e48b43100205ac8b5706b626eee51328a3757ea1f2137cd8`.
- Artifact inventory: 142 files, SHA-256 `477421f55f4b622ad612f74f30ebb3497f3b2388cb8f721313dc88743eb6b95c`.

## Published behavior

/study-tracker now has Overview, Analysis, Reviews and Records. Learning time and comparisons use recorded intervals and report time zones; legacy unknown planning history is not invented. Weekly/monthly review snapshots and private reflections, next-step planning and on-device report exports are available. Advanced analytics is explicitly a free preview; no billing, automatic charge or public entitlement-grant endpoint was activated. The existing free records, CSV and backup remain available.

Charts support line/area and bar views, shared subject colours, subject allocation and record drilldown. Bright mint/current and blue/previous values have stronger contrast on scoped cards, with a separate light theme. Overview now expands a Monday–Sunday month calendar with per-date durations and inline subjects/session detail. Month navigation applies the same month to global report filters. Outside-range dates are labelled outside the report, not zero; future dates are disabled. Backup/manual-sync footer text is compact. The read-only example URL remains explicitly synthetic and noindex; it saves no edits and is excluded from the Sitemap.

New workspace learning history/reviews participate in validated backup and optional manual cloud sync. Older clients cannot strip existing learning evidence from cloud documents. The existing 1MiB cloud snapshot limit remains. Reflections are not sent to AI. PDF uses raster pages; actual browser download/print behavior was not accepted in this release. Public guide retains ten complete FAQs and detailed practical instructions. Privacy copy describes these data flows, with Last updated 18 November 2026.

The earlier approved room policy is also published: free accounts own one participating four-person room, including its owner; a trusted active subscription permits up to ten owned rooms and configured 8/12/24-person capacities. After expiry, extra rooms/seats become read only with records and memberships retained. Owners choose the retained free room and three other participating places. Renewal restores eligible rights without starting timers or rejoining departed members. Server-side permission and timer-credit boundaries remain authoritative. No Stripe integration or real subscription was created.

## Production database and runtime

Confirmed the exact StudyTimely D1 binding and ten pre-existing migrations. Captured a production Time Travel recovery bookmark, schema and aggregate counts before applying only reviewed 0011 ownership triggers and additive 0012 room preferences/access fields. All twelve migrations, original columns/unaffected schema, unchanged old aggregate counts, new defaults and foreign keys were verified. No reset, fixture seed, account edit or database restore occurred. Recovery evidence is ignored and not published.

All twelve original binding definitions and script runtime settings read back unchanged. Automatic text review remains disabled, provider Cloudflare, configured daily budget 5000, no AI binding and no inference calls. No plan, DNS, OAuth, secret rotation, protected Sites adapter, dependency or tracking configuration change.

## Validation and limitations

- 443 release-mode regression tests passed. The subsequent privacy-date-only correction passed ten relevant page/SEO tests; no new full-suite claim for that one-line change.
- Final release build: 56 routes plus 404; deployment dry-run and 62 candidate checks passed.
- Final public verification: 62 page/resource, robots, Sitemap, canonical and redirect checks passed. All 136 public non-MP3 artifact hashes matched the final manifest, including 56 navigation pages. Licensed MP3 files were unchanged.
- Verified anonymous advanced-preview API access, no-store/noindex headers, real configured Google provider metadata, public room API, personal leaderboard 401, private tracker query noindex, ten FAQs and fixture 404 responses. No signed-in production account, room timer or community record was mutated.
- Existing CLI login was sufficient. A transient Cloudflare pre-deploy read failed once and a bounded retry succeeded, without requesting new permissions. Git pushes synchronized the actual commits to the previously authorized public repository without force updates.
- A first successful deployment was followed by a privacy-policy date correction. Final runtime/artifact identities above are authoritative; initial deployment evidence is retained separately.
- In-app browser controls were unavailable; no native/local Chrome substitute was used. Actual production screenshots, keyboard/mobile interactions, PDF/PNG downloads and full accessibility acceptance remain unverified. Model, SSR and HTTP checks do not replace those checks. The earlier real two-person community/moderation acceptance and main-promotion gates remain independent and pending.

## Recovery

The pre-release runtime was V2.30.0 Worker `92760710-e625-40a0-83ef-f764d616c065`. It lacks the new room expiry/seat restrictions: do not blindly roll back to it and re-enable paid participation. Prefer a forward fix or an access-preserving matched Worker/frontend rollback. Keep the additive schema and recorded data; a whole-database restore is a separate incident decision using the recorded recovery point, not a presentation rollback. Future release rollback can use this matched V2.31.0 runtime while retaining its access gates.

Evidence: ignored `docs/development/evidence/analytics-release-2026-11-18/` contains source/artifact manifest, build/tests, runtime before/after, database bookmark/schema/counts/migrations, dry-run/deploy and exact public checks. Later documentation-only commits do not imply another runtime deployment.
