# StudyTimely V2.52.0 — detailed AI weekly reports

Published 22 November 2026 at https://studytimely.com/account?view=progress#cp-review-title. This supersedes the local-only AI implementation and content-standard status in earlier dated handoffs. It does not change the independent main-promotion gate or claim Stripe purchase acceptance.

- Runtime commit: `cf0adf10436b9272cf241f68211fd44ea34ccae9`; tree `bd28282cd4abe94320dc11613a58edc3a33e3172`; existing branch `v2-google-community`.
- Worker version: `2a6c7df8-5745-49ba-bbf9-2619f7b3dc69`.
- Deployment: `d35b4955-b2f9-4106-9143-abf0c51ada1f`, created `2026-11-22T08:49:08.622083Z`, verified **100% traffic**.
- PWA: `057cc58c18cc40ed`, 94 precache entries; 57 prerendered pages plus 404.
- Source inventory: 539 files, SHA256 `dd6548b44b50e28cce434e5a33b0058817bf7cdb4807d8ea8514083931e6ad8c`.
- Artifact inventory: 282 files, SHA256 `ba1cd85a00313a37f9bcbc7fddd8209a17dc329ef8dc5054cc64466c6e742714`.

## Published experience and access

Progress contains one AI weekly entry, evidence preflight, visible eight-part format guide and personal reflections kept separate. The full report covers decisions, goals versus actual, subject allocation and deadlines, plan/estimate execution, seven-day capacity, a checked proposed plan and fallback, follow-through/four equivalent weekly windows, and evidence/limits. Deterministic calculations and validated schedules constrain the AI interpretation. Missing evidence stays missing; an inadequate input is blocked before spending an allowance. Explicit limited-report consent is required when applicable.

Free users can inspect explanations/examples without a provider call. Personal generation requires authenticated, server-verified valid Plus access; global AI preview is **off**. Existing unrelated free library/planning/analytics previews remain unchanged. The launch allowance is four successful new reports per UTC month; unchanged inputs reuse their saved report, failed reports return the user allowance, and reading/downloads use no allowance. This operational cap is not a new Stripe product or revised price.

Generated analysis is fully readable on the page. Direct PDF and optional HTML contain the same full analysis, charts and tables, without additional generation, payment or private reflections. Download is a copy, not a separate paid unlock. Records initially show ten rows; extra details expand on demand. Proposed actions require review and confirmation before entering plans. Changed/stale/repeated proposals are rejected; revision-bound undo and append-only adoption history preserve accounting. No timer starts or study credit/task completion is inferred automatically.

The server receives a minimized anonymous weekly summary only after consent. Subject names are optional; raw task titles/session logs, email, nickname, chats and private reflections are excluded. Saved reports remain readable/exportable/deletable after access expiry. Older report formats and personal notes are retained. Account export/deletion includes AI report data.

## Production configuration and database

Applied only additive migration `0015_ai_weekly_reports.sql`, creating report jobs/allowances and the daily provider budget tables/indexes. A D1 Time Travel bookmark was recorded privately before applying it; remote receipt/schema and no-pending-migration state were verified. Existing tables and rows were not replaced.

Preserved all twelve existing bindings, routes, handlers, Durable Object migration configuration and runtime date `2026-11-12`. Added six nonsecret AI variables and one encrypted Secret (nineteen bindings total):

```
AI_WEEKLY_ENABLED=true
AI_WEEKLY_MONTHLY_LIMIT=4
AI_WEEKLY_DAILY_TOKEN_LIMIT=100000
AI_WEEKLY_DETAILED_ENABLED=true
AI_WEEKLY_DETAILED_MAX_OUTPUT=5000
AI_WEEKLY_PREVIEW=false
DEEPSEEK_API_KEY=[Cloudflare encrypted Secret; value not recorded]
```

The ignored local key was uploaded narrowly through official Wrangler's encrypted Secret handling. Temporary secret JSON was deleted afterwards. No secret, local fixture or .dev.vars was committed/deployed. No OAuth, DNS, paid resource, Stripe charge, entitlement grant or production personal-study mutation occurred.

Provider calls use the fixed official DeepSeek endpoint, bounded JSON output and timeout, with no automatic paid retry. Workers requires `redirect:manual`; redirects/non-2xx are rejected and never followed with credentials. This corrects a Node-versus-Workers compatibility gap found before launch.

## Verification and limits

- Release build and matching Wrangler 4.152.0 dry run passed; **844 release-mode tests passed**.
- **63 candidate and 63 production HTTP/SEO/resource checks passed**.
- Eight compiled Worker/D1 scenario groups passed: Plus discovery, free/CSRF blocking without provider calls, stream/contract/settlement, idempotent reuse, account isolation, redirect rejection/returned allowance, expired-access reads/new-generation denial, deletion with usage retained. The isolated cached workerd supports `2026-10-26`; the harness used that supported date. This is not claimed as an exact production compatibility-date simulation.
- **215/215 public non-audio/video artifacts exactly match** the release manifest. Five production behavior groups passed: live bounded detailed discovery, anonymous private read/generation denial, noindex static account shell, absence of secrets/test endpoints, and unchanged library preview. The license PDF needed a longer focused retry; 214 previously verified hashes were retained, then the last file matched.
- The static account HTML intentionally keeps the existing `no-cache` policy and robots meta `noindex,nofollow`; personal AI APIs use `no-store, private` and `X-Robots-Tag`. An initial verifier incorrectly demanded private-response headers from the static shell; corrected to the existing source policy without changing runtime behavior.
- Native Git push succeeded to the existing authorized public branch; independent `git ls-remote` confirmed exact runtime SHA. An initial auto-review rejected source publication; the same Git action was approved after citing the pre-existing public-repository authorization in AGENTS.md. No alternate upload route was used. A separate optional raw GitHub HTTP read failed with ECONNRESET and is not claimed as successful.
- Actual in-app production screenshot and DOM showed the AI entry, zero personal study, disabled generation, unchecked data consent, no-allowance evidence gate and all eight format descriptions. Later browser interaction timed out; production desktop/phone breakpoint, console and actual saved-download acceptance were not completed, and no production screenshot file is delivered. The observed narrow viewport was the browser's existing size; no new viewport override was set. No production example data was seeded or report generated.
- Earlier local real DeepSeek verification used fictional/anonymized records: one strict-validation rejection followed by one valid eight-part result, with no automatic paid retry. Earlier synthetic export verification covers the complete multi-page report; these are **local**, not production user-generation or download proof. A live authenticated Plus generation and Stripe purchase remain unverified in production.

Ignored evidence: `docs/development/evidence/ai-weekly-release-2026-11-22/`, including manifests, migration receipt, binding/deployment metadata, compiled scenarios, exact live hashes and final five-group result. Logs remain local; credentials and D1 recovery bookmark must stay private. Unrelated FocusGuide.jsx and pricing drafts were excluded.

## Recovery

Previous V2.51.0 Worker: `3b43d63d-7b94-45d1-8da2-b840ad261c7d`, runtime commit `07f282bfad079edb5e1dca87001755fa15a7dcbe`. Roll back Worker traffic if needed; keep additive AI tables and saved records. Do not routinely restore the whole D1 database, which would discard unrelated later writes. Disable AI generation independently with the enable flag if provider service must pause. Retain the new learning-field compatibility guards and back up before moving between old clients; older code may not preserve new planning/adoption metadata. Later documentation-only commits do not imply a different deployed runtime.
