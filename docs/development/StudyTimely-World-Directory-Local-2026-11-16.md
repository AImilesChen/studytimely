# World clock directory local redesign — 16 November 2026

Implemented locally at http://127.0.0.1:4252/time (noindex). Production remains V2.15.0 runtime ebe22b2c2b0933fd99e464e162a30bf1b192beca. No version bump, commit, push or deployment was performed.

## Delivered scope

- Preserved the existing Graphite theme, 32 supported cities, search/region filters, six-favourite limit and separate city guides. The empty saved-clocks panel is now one short star hint. An actual saved list appears only when it contains cities.
- Directory layout has a shared 1120px maximum boundary, tighter hierarchy/spacing, 16px search text, 18px city names/36px clock digits and 18px guide text on desktop. Phones use 16px search/body/city names, 28px clock digits (32px on single-column narrow phones), and a local-time/date reference below the title. Default desktop first row fits the 1280x720 screen.
- Cards display full short local dates including year, explicitly relative Yesterday/Tomorrow labels and current offsets. Saved cards additionally compare each city with the named device-local reference. Short-date year formatting uses the existing bundled-rule formatter, not a separate host-rule calculation. The original time-zone engine and timing/accounting behavior are unchanged.
- New guide contains 2,131 normalized English words and eight fully answered FAQs: operating steps, UTC offsets versus relative differences, minute offsets, a dated cross-midnight example, DST/recurrence cautions, a practical study-session checklist, grouped links to all 32 actual city pages, device-clock accuracy/local storage/manual preference sync and privacy explanation. Future-date conversion is explicitly unavailable; no new converter/calendar/invitation functionality is implied. The dated example and date/year/minute boundaries are tested.
- Data-derived city count in metadata/guide/empty-search instructions; directory-specific title/description and BreadcrumbList. Static instructions/FAQ/city destinations appear in initial HTML; local robots remains noindex. No FAQ rich-result or search ranking promise.

Changed application files: WorldClock.jsx, WorldClockGuide.jsx, world-directory.css, world-clock.mjs, routes.mjs, site.mjs and world-directory.test.mjs. No new dependencies, schema/backend/API/auth/credentials/bindings/tracking/legal changes. The four protected Sites adapter files remain unchanged. City-detail/page layout, homepage clocks and timer screens are outside the CSS scope.

## Actual validation

- Local build: 55 routes plus404; PWA77ee50552a22f73e with61 resources. All240 regression tests passed. After final spacing/heading-only refinements, rebuilt and reran seven targeted tests successfully.
- Final61 HTTP checks passed, covering routes/assets/robots/Sitemap/canonical/license behavior. Git diff check passed.
- Initial HTML assertions verify meaningful guide/answers, all city and guide-anchor destinations, unique H1, metadata/breadcrumb, absence of old empty-panel actions and separation from city-detail guides.
- In-app browser verified China search returning Beijing/Shanghai, adding both favourites, refresh persistence, both showing8h ahead of the Europe/London reference, combined China/Europe empty state and Clear filters recovery. Both synthetic favourites were removed; final page has an empty saved list and32 cities. No timer, study record, account, cloud or community action was performed.
- Actual Beijing guide navigation and browser Back succeeded. Guide contents anchor and keyboard Enter opening the first FAQ succeeded. Final screenshots desktop-final.jpg, phone-final.jpg and guide-phone.jpg were saved and inspected; they show current local output rather than a mock or production state.
- Final five viewports1440x900,1280x720,768x1024,390x844,320x740 have no body horizontal overflow and equal directory/guide boundaries. First city time is visible in each viewport. Measured search font16px everywhere, guide18px desktop/16px phone, city18px desktop/16px phone, digits36px desktop/28px phone/32px narrow. Phone390 uses two columns;320 uses one. Desktop first card bottom714.22px at720px height. Final runtime logs empty, viewport reset to default1280, scroll restored to0 and preview marked deliverable.

Ignored evidence: docs/development/evidence/world-directory-2026-11-16/ (build/test/targeted/HTTP logs, responsive.json, saved-clocks.jpg, final desktop/phone/guide screenshots). Earlier initial/before-spacing screenshots are development evidence, not final layout. Original production audit screenshots are in the separate world-directory-audit-2026-11-16 folder.

## Limits and later release

Native device clock/time-zone changes, full screen-reader/contrast compliance, 12-hour preferences across every width, forced storage failure/temporary mode, physical offline disconnection and real authenticated preference sync were not exercised. Existing six-city capacity/storage contracts were preserved; the real UI exercise used two cities. Broad crawler/analytics/search-console behavior and indexing outcomes are not implied by local checks.

Future-date converter remains phase2. Publishing requires the user's later explicit release request, fresh release build/source sync/deployment/public verification. No database migration is required. Independent production-community acceptance/main-promotion gates remain unchanged.

## Honolulu addition — supersedes the 32-city local snapshot

Current final local preview: http://127.0.0.1:4253/time; dedicated page /time/honolulu. Noindex PWA730cd56698e44f29 has62 resources;56 routes plus404 prerender. Package/production remainV2.15.0; no commit/push/deploy.

Appended Honolulu (United States,Pacific region,Pacific/Honolulu) as city33, completing the last desktop row beside Vancouver and Adelaide. Added original city-specific overview, current HST/year-round rule, two regional explanations, cross-Pacific study guidance, four comparisons and three answered FAQs. New editorial date16November2026 and IANA northamerica/NIST source links apply only to Honolulu; existing reviewed dates remain unchanged. New long zone name is Hawaii Standard Time. Counts in directory/guide/metadata/backlinks and validators derive from current data.

Regenerated the existing transition table using the same hash-pinned cached tzdata2026.6/IANA2026f wheel, without installing or running package code. All31 existing zone tables exactly match their previous contents; only Pacific/Honolulu was added, using UTC-600minutes/HST/no seasonal transition across the supported1970–2100 interval. No prior clock engine behavior changed. Sources checked: https://data.iana.org/time-zones/tzdb/northamerica and https://www.nist.gov/pml/time-and-frequency-division/popular-links/daylight-saving-time-dst .

Initial regression exposed the new route missing from the isolated analytics bridge's explicit public-route allowlist. Added only /time/honolulu; SDK settings/consent/private-page protections unchanged. Final build and all241 tests passed. Honolulu tests cover bundled offset/label/no scheduled change,winter/summer Los Angeles differences and Tokyo date boundary. All62 HTTP checks and33 city-page/99 answer/canonical/breadcrumb/link/license checks passed; old verification script now derives counts and recognises the new directory guide.

IAB verified33 cards,last row Vancouver/Adelaide/Honolulu on the same document row,search+Pacific filter yielding one Honolulu entry,star add/refresh persistence and10h behind Europe/London,removal,real city-page navigation/HST/UTC-10/date/canonical/source review,390px city+directory without overflow,and All cities return. Test favourite removed,no learning or production mutation. Final width1280,viewport reset,logs empty,tab marked and last row left visible with keyboard focus outline on the new card. Saved and inspected last-row-final.jpg and honolulu-phone.jpg under ignored evidence/honolulu-2026-11-16. Earlier last-row.jpg captured a stale first-screen paint and is not row evidence.

No backend/schema/API/dependency/auth/credentials/bindings/legal/protected-adapter changes. Real authenticated sync,external analytics collection,native fullscreen/offline/physical clock changes were not retested. Existing directory limitations and independent community/main gates remain. This city is local only until a later explicit release request.
