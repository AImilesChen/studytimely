# StudyTimely V2.52.2 — annual-first pricing preview

Published 22 November 2026 at **https://studytimely.com/pricing**, following the user's instruction to publish the reviewed pricing page and discount treatment.

- Runtime source: `8ebcb61d1c08a44095a08b4fc9a3dee6558aed0e`, tree `ffc98a6a9314d81eeb3620c1d9d66eacba389003`, branch `v2-google-community`. Native Git push and independent remote readback match this runtime commit. Later documentation commits are not additional deployments.
- Worker version: `ecc88acc-211a-4612-a63d-3bce6084d924`.
- Deployment: `67493180-8e59-4817-aae1-117b6e4c4525`, created `2026-11-22T13:03:58.250943Z`, verified **100% traffic**.
- PWA: `f306639411647777`, 94 precache entries; 58 pre-rendered pages plus 404.
- Source inventory: 510 files, SHA256 `6ea9e3b172e5fdf2e45b2fbbf04562208cb7becb8c8f60ecafac242eb408ebcb`.
- Artifact inventory: 283 files, SHA256 `d9e3b136767e5f07e15da43f4fa2e93fbd99e02b95e4f1ee49f3d3a3615cb1e5`.

## Published behavior

Free and Plus appear side by side on desktop and vertically on mobile. Annual is the fresh-entry default: **USD39.99 per year**, charged upfront; the approximately USD3.33 monthly equivalent is secondary. Monthly remains USD4.99 and can be selected. A deliberate recent choice survives navigation. The accessible scalloped gold SAVE33% sticker compares annual billing with twelve monthly payments, has a one-time sheen, and respects reduced-motion preferences.

The page includes a semantic feature comparison, labelled illustrative AI report chart/table, three public scene thumbnails, planning/group/sync explanations and nine FAQs. It links from the footer without adding a top navigation menu. Prices, counts, AI allowances and cancellation/data explanations remain visible. The site explicitly discloses that advanced planning, analytics, the expanded library and sync are currently free previews.

**Purchasing is not open on production.** `/api/billing/options` is a new public, no-store discovery response with public prices and preview flags, always `enabled:false`, `ready:false`, `environment:null`. It performs no account/billing-table queries or Stripe calls. Pricing discovery does not wait for sign-in while purchasing is closed. The live purchase button is disabled and labelled “Plus checkout coming soon”. There is no production checkout, portal, webhook or payment grant endpoint in this release.

Pricing has canonical metadata and a breadcrumb but stays **noindex**, excluded from Sitemap and the offline precache until commercial activation. No Product/Offer claim, trial, urgent deadline or actual charge is introduced.

## Isolation and existing services

The release was built in an isolated source directory from the existing production repository, with eleven explicitly selected files. Canonical Git hashes for every tracked candidate file matched the committed source; no unrelated changes entered the build. Account, sync, AI, community entitlement and Google login backend changes from the ongoing payment experiment remain local, as do the billing implementation and migrations0016/0017. The existing production schema remains through0015.

The native upload used `--keep-vars`. All **nineteen bindings compare identically** to V2.52.1, including encrypted Google, AUTH_HMAC and DeepSeek bindings. Runtime configuration also compares identically. No secret upload/rotation, D1 migration, payment credentials, production data mutation, DNS/domain/paid-resource change, preview closure or main promotion was performed. The four protected Sites adapters and unrelated FocusGuide change were preserved.

## Verification

- Release build, Wrangler4.152.0 dry run and **849 release-mode tests passed**. Existing chunk-size and mixed dynamic-import warnings remain.
- **64 candidate and 64 production HTTP/SEO/resource checks passed**.
- **216/216 non-audio/video public artifact hashes match** the verified release. Seven production groups passed: annual/noindex/saving display; public prices and free previews; absent payment/synthetic endpoints; unchanged AI availability and four-report allowance; unchanged advanced free previews; existing account availability; and pricing exclusion from Sitemap/offline caches.
- Unknown GET endpoints return404. An attempted POST to the unimplemented checkout is rejected by the existing global method guard with405 and no redirect. The verifier initially expected404 for that POST; the correct405 expectation was applied and the entire denial group rechecked successfully. No checkout session, report, subscription or charge was created.
- Three configured local sensitive values were checked against75 frontend text files with **zero matches**. No local helpers or fixtures were included.
- Actual production in-app browser showed annual selected, USD39.99/year, the SAVE33% graphic, the disabled purchase action and free-preview notice. Desktop client/scroll widths1265 matched. Mobile390px had client/scroll widths375, annual still selected, no page alerts and no broken loaded images. `production-desktop.jpg` shows the real live plans and saving; `production-mobile.jpg` shows the real mobile Free section and closed-purchase notice. Temporary viewport override was reset, original dark appearance preserved and the production tab retained.
- No native production login, report generation, download delivery, live payment or authenticated account mutation was submitted. A separate production console export was not repeated. Existing independent acceptance gates remain unchanged.

Read-only verification and Git synchronization used the computer's existing proxy after direct connections timed out; TLS verification and system proxy settings were unchanged.

Ignored evidence: `docs/development/evidence/pricing-release-2026-11-22/` contains manifests, exact hashes, build/tests/HTTP/deploy logs, before/after binding/deployment metadata, denial results and actual production screenshots.

## Rollback and next payment work

Previous Worker: `98b65e94-5c7f-49d6-a5ca-a1e4e69fb6ca`, previous runtime `5d9aeb8d54c15c875b94a3d3aa57fea6dc3bff69`. Roll Worker traffic back if required; this pricing-only release needs no D1 restore. Preserve existing AI tables and encrypted provider settings.

Real purchases still require a separately reviewed payment deployment, commercial terms/refund/tax decisions, a decision about ending previews, and the remaining isolated HTTPS webhook/annual/renewal/3DS acceptance. The locally working Stripe sandbox is not production billing. Do not deploy its loopback helpers, synthetic sessions or signing fixtures.
