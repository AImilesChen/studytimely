# DeepSeek real-provider local verification — 22 November 2026

The user configured `DEEPSEEK_API_KEY` in the ignored `app/.dev.vars` file and asked to continue. The key was read only by the local backend, never printed, embedded in browser code, committed or sent to a third party other than the official DeepSeek API. Production remains unchanged.

## Verified result

- Authenticated `GET https://api.deepseek.com/models`: HTTP 200; the configured `deepseek-flash` model is available.
- A real detailed report was generated using **fictional, anonymised study records**, through the existing authenticated/CSRF/quota API and actual browser controls. No personal study records were uploaded.
- Successful request: HTTP 200, `finish_reason=stop`, strict V2 validation passed, five nonempty evidence-linked findings plus the computed tables/charts and all eight displayed report parts.
- Provider/validation elapsed time: **14,725 ms**, within the unchanged 22-second timeout.
- Usage: **2,030 input tokens** (256 cache hits, 1,774 cache misses), **1,787 output tokens**, 3,817 total. The output ceiling stayed at 5,000.
- Browser confirmed private history import/save, `AI-generated with DeepSeek` identity, eight report sections and one used test allowance (`0 of 1 reports available`). Reload and direct PDF download retained that allowance state and did not call the provider again. Final browser warning/error log was empty.
- The real report's on-device PDF was captured: **seven A4 pages**, rendered and visually reviewed. The report is real AI output over fictional data; the earlier five-page deterministic fixture is a different artifact. Native final Downloads-folder save remains independently unverified.

## First request and correction

Two separately controlled real requests were made in total. The first was originally intended to be the sole request but returned an empty capacity-finding `interpretation` despite HTTP 200 and valid JSON. The existing validator correctly rejected it. It was not converted into a successful report or filled with invented prose. Its provider usage was 1,851 input and 1,961 output tokens, elapsed 17,142 ms.

Before the second request, the user was told why an additional bounded retest was needed. The prompt was tightened to require all **five nonempty** reasoning strings, perform a final completeness check and require a fresh checked preview after scheduling changes. No automatic paid retry was introduced. The validator remains strict, and regression tests cover rejecting a blank interpretation without a second provider call.

The first response also exposed an ambiguous blanket claim about backlog deadlines. E06 now supplies the exact known workload due by window end, separately from total known backlog. A regression test checks a backlog containing later-deadline work. The second real response correctly distinguished the known due workload and kept unknown work unscheduled.

This small test verifies connectivity and one complete real result; it does **not** establish a production success rate or broad advice quality. More representative rich/limited/changed-plan samples are needed before commercial activation. A valid schema does not prove every interpretation: tentative routine/estimate conclusions still require careful product wording and user review.

## Cost observation

The [official DeepSeek pricing page](https://api-docs.deepseek.com/quick_start/pricing/) was checked on 22 November 2026. At its published weekend/off-peak Flash rates, the first rejected request estimates to US$0.00145425 and the successful request to US$0.001339068: **US$0.002793318 combined**. This calculation uses the returned cache hit/miss and output counts; it is an estimate, not an independently reconciled billing debit. Failed output can still cost provider tokens even when the user's successful-report allowance is returned.

Do not derive commercial quota/pricing or a guaranteed cost/latency from two requests. No Stripe payment, subscription grant or production allowance was changed.

## Local test environment and evidence

- Real-provider preview: `http://127.0.0.1:4330/account?view=progress&preview=ai-weekly#cp-review-title`, in-app browser tab 9.
- Ignored helper: `app/.wrangler/ai-weekly-real-preview.mjs`; current local server session 94248. Bound to 127.0.0.1, disposable account/in-memory DB, one real provider request maximum per server run, one successful-report allowance, 25,000 shared daily token reservation ceiling, 5,000 output maximum. These are local test settings, not Plus terms. The original 4328 deterministic fixture remains separate.
- Secret file still contains the user's credential; test switches/limits are applied only in the isolated server. Adding the key alone does not enable an ordinary Wrangler environment without the required server configuration.
- Sanitised request receipts, raw AI replies over fictional data and accepted report are ignored under `app/.wrangler/ai-weekly-real-*`. No authorization header or secret is stored in those receipts. Attempt 1 has separate preserved files.
- Screenshot and rendered PDF evidence: `docs/development/evidence/ai-weekly-real-2026-11-22/` (ignored).
- Final build: 57 pages plus 404, local noindex, PWA `1d334bbd16fe4a4e`, 94 precache entries. **843 tests and 63 HTTP checks passed**, whitespace diff check passed.

## Remaining production steps

Production release has not been requested this turn. Before release, configure the production Worker secret and reviewed AI flags/allowances, apply the existing reviewed 0015 migration in the intended environment, verify paid/free/access-expiry flows and broaden real-provider quality tests. Never deploy local fixtures, fictional accounts or `.dev.vars`. Preserve the unrelated pre-existing `FocusGuide.jsx` status and earlier independent release gates.
