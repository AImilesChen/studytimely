# StudyTimely V2.52.3 — Pricing in the main navigation

Published 22 November 2026 after the user pointed out that the pricing page was missing from the top menu.

- Runtime source `17de37abb9b322db8ccffea07bc7889ba1482991`, tree `4e7368d86427ce5f75c2ef8ab48cfb4bff369e20`, branch `v2-google-community`. Push and independent remote readback verified.
- Worker `e28c681d-5b93-4f60-a961-6c5a48e252da`; deployment `1f71c065-ded0-4438-adce-7b21a1ea49aa`, created `2026-11-22T13:25:53.310677Z`, verified100% traffic.
- PWA `c9972835f796ac3e` /94 entries;58 pages plus404.
- Source inventory510 files, SHA256 `2bafcc1d3e053b36f9d06453b58aef1d7880823e3f243c305b9993b695cd1a72`; artifact inventory283 files, SHA256 `b501138489ce04eeab5f887f5f6204fb524605829b1dfeadfb8d6488269eecf6`.

The shared primary catalogue now puts Pricing between Leaderboards and Account/My Study Center on every page. The public link remains visible independently of account/community feature flags. The mobile explorer includes the same destination, description and a tag icon; its section label is Main pages, with two columns where appropriate and the existing one-column phone layout. Pricing receives the existing current-page treatment. This adds a navigation entry without changing prices, membership rights, payment activation or the prelaunch noindex policy.

Only six selected files changed in the isolated production build: navigation catalogue, header component, navigation CSS, navigation tests and the two package version files. All other candidate files matched the existing committed production source. Unfinished local Stripe/account/sync/Google changes, migrations0016/0017, fixtures and the unrelated FocusGuide edit remained excluded.

## Verification

- Release build,850 release-mode tests,Wrangler4.152.0 dry run and64 candidate HTTP/SEO/resource checks passed.
- Candidate and production navigation audits passed for all58 pages: four primary links, sixteen tool links, closed initial explorer and correct current-page state.64 production HTTP checks passed.
-216/216 public non-audio/video hashes matched. Seven existing pricing/AI/account/free-preview/payment-closure groups passed with no failures. All19 Cloudflare bindings and runtime settings compare identically to V2.52.2; upload used keep-vars. No migration, secret rotation, production-data write, domain change, payment or main promotion occurred.
- Actual live in-app desktop browser displayed Tools → Study Groups → Leaderboards → Pricing → My Study Center. The scoped desktop Pricing link was clicked successfully; location remained `/pricing`, aria-current was page, the primary navigation was displayed as flex and client/scroll widths both1265. `production-header.jpg` is an actual live1280px screenshot showing the new menu, active Pricing state and surrounding page.
- The390px mobile menu click/read attempt timed out, followed by a timed-out full accessibility recovery and browser-kernel resets. Do **not** claim a successful native mobile menu click, mobile screenshot or mobile geometry acceptance for this patch. Mobile presence is verified in rendered HTML and tests. Browser recovery eventually succeeded for viewport reset and retaining the live tab, but interactive phone acceptance remains unverified. No production console export was taken.
- Three configured sensitive values were checked across75 frontend text assets, with zero matches. Existing computer proxy was used per command; TLS verification and system settings were unchanged.

Evidence is ignored under `docs/development/evidence/pricing-nav-release-2026-11-22/`: source/artifact manifests, test/build/dry-run/HTTP/navigation logs, configuration/deployment receipts, exact asset hashes, safety checks and the real production header screenshot.

## Rollback

Previous Worker `ecc88acc-211a-4612-a63d-3bce6084d924`, previous runtime `8ebcb61d1c08a44095a08b4fc9a3dee6558aed0e`. Roll back Worker traffic if necessary; no database restore is needed. Pricing display stays public and real purchasing remains closed. Later documentation commits are not new runtime deployments.
