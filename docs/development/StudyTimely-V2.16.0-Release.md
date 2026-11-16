# StudyTimely V2.16.0 production release

Published on 16 November 2026 at <https://studytimely.com/time> and <https://studytimely.com/time/honolulu>. This supersedes the local-only directory redesign and Honolulu addition. Detailed local interaction evidence remains in StudyTimely-World-Directory-Local-2026-11-16.md.

## Published behavior

The world clock directory retains its Graphite theme, search/region filtering and six-favourite limit. An empty saved list is one compact hint rather than a large empty panel. City time/date cards appear earlier, with aligned and larger responsive type. Cards include local dates with years and explicit Yesterday/Tomorrow labels; actual saved cards also compare with the named device-local reference. The full initial-HTML guide has 2,132 normalized English words and eight answered FAQs covering operating steps, UTC/relative differences, cross-day examples, seasonal changes, international study arrangements, local preferences and accuracy. Metadata and BreadcrumbList describe the directory's own search intent.

Honolulu is city33 and completes the last desktop row beside Vancouver and Adelaide. Its real /time/honolulu page includes original regional content, three FAQs, four current city comparisons, reviewed date16November2026 and IANA northamerica/NIST sources. A hash-pinned cached tzdata2026.6/IANA2026f regeneration added only Pacific/Honolulu; all31 existing zone tables exactly retained their contents. Short dates use the shared bundled formatter. Tests cover Hawaii's year-round rule, winter/summer mainland differences, minute offsets and date/year boundaries. Counts/backlinks derive from city data. No future-date converter was added or advertised as available.

The isolated optional analytics bridge allowlist now includes the new public city route. Existing consent gates, private-page protections, SDK configuration and provider IDs remain unchanged. No database migration, backend API, authentication/OAuth/secret/resource binding/dependency/legal or protected Sites adapter changes were made.

## Exact source and runtime

- Repository/branch: <https://github.com/AImilesChen/studytimely/tree/v2-google-community>. No main promotion.
- Runtime commit: `d4a259af98264325eadce8eb6c9e2262c4f03306`.
- Git tree: `4f538cb9169e0b822a0ccfdadfc341207b3519da`.
- Worker: `f28c538f-2065-43f8-9dd0-9af3f9e07788`.
- Deployment: `92d9cddc-91cc-4b4a-8792-184b623d6424`, created `2026-11-16T02:04:20.145642Z`, read back serving100%.
- PWA: `619913360f02b593`,62 precache resources including /time/honolulu.
- Artifact inventory SHA-256: `698638ada72619dda254ee5e543c27e0ce56ca4895d5cc852a608d016f47af44`.

Native Git push returned a connection reset. The established in-memory credential helper and official GitHub Git-data API synchronized the exact commit/tree, checked the remote parent twice and read back the branch without force. The local helper's path guard was extended only for the three explicitly reviewed public/script files in this release. No credentials were logged or stored. Cloudflare used existing authorization and --keep-vars; before/after inventories confirm all nine binding names/types retained. Later documentation-only commits do not imply another runtime deployment.

## Verification

- Release build prerendered56 routes plus404. All241 regression tests with STUDY_TEST_RELEASE=1 passed. Wrangler preflight and62 release-candidate HTTP checks passed. The existing large-chunk advisory remains nonblocking.
- All62 public HTTP checks passed: routes/assets, unique headings, canonical/indexing, robots, Sitemap and licenses. The Honolulu URL is present in the production Sitemap.
- All125 public non-MP3 artifacts exactly match the release SHA-256 inventory. Five unchanged licensed MP3s have existing local license/build checks and were not downloaded again.
- Public HTML verifies33 cards, correct directory title/breadcrumb, eight complete FAQs/full guide and absence of the old large empty-state actions. Honolulu has the correct canonical, three FAQs, regional sources and updated33-city backlink. One validation assertion initially failed because React inserts comment boundaries in dynamic backlink text; stripping those comment boundaries fixed the validator. The application was unchanged and the complete validator then passed.
- Actual production in-app browser confirmed the33-city directory, new first-screen hierarchy/date information and the final row Vancouver/Adelaide/Honolulu. production-desktop.jpg and production-last-row.jpg were saved and inspected. The white outline on Honolulu is keyboard focus, not a different card theme.
- Opening the real Honolulu card reached its new clock, HST/UTC-10/date and relative-local display. At390x844, canonical/title/heading matched and numeric page geometry showed no horizontal overflow. production-honolulu-phone.jpg was saved and inspected. Final warning/error logs were empty, viewport reset and production tab marked deliverable.
- No production timer, saved favourite, preferences, history, account sync or community/profile/ranking data was changed. Star/search/filter/persistence, FAQ keyboard and broader directory responsive acceptance remain documented local evidence, not repeated production personal-state actions. Production screenshot/navigation inspection does not prove physical clock accuracy, sleep/offline behavior, native fullscreen, full accessibility compliance or authenticated preference sync. Search/analytics backend collection and rankings were not reverified.

Ignored evidence: docs/development/evidence/world-directory-release-2026-11-16/ contains build/tests/preflight/deploy logs, source/artifact manifest, exact GitHub synchronization, before/after runtime/readback/binding summary, candidate/public HTTP reports, public artifact verification and production screenshots.

## Recovery

Rollback Worker: `76f4e379-d3ea-4de0-b1e8-baba42c3b50c` (V2.15.0). No database restoration is needed. The old city whitelist does not include Honolulu, so rolling back removes that route and may discard the Honolulu favourite while keeping supported favourites. Finish active work before accepting a PWA update. Existing independent authenticated community acceptance and main-promotion gates remain unchanged.
