# AI weekly study reports — local implementation

22 November 2026. Implements the user's approved Progress-integrated weekly review and visible explanation/sample. Provider selected by the user: DeepSeek. Local development only; production remains V2.51.0. No commit, push, deployment, production D1 migration, billing, price change, subscription provisioning, production preview change or actual model invocation has been performed.

## What the user can do

My Study Center → Progress now starts on the last complete calendar week. Existing date/subject/timer controls are reused. The weekly review follows the time and subject charts, ahead of outcomes and detailed records. No new top-level tab, separate AI tools page or extra page hop was added.

The generation area explains the result before asking for an action, displays the week/time zone/available records, and asks explicitly before sending summary data. The visible four-part illustrative example uses an editorial layout, existing cat art, warm apricot/paper colours and unboxed emoji. It is labelled as a written example, not the user's data or a live AI response. Personal reflection and the existing next-task form remain on the same page. Duplicate unsaved-snapshot metrics were removed from the initial review view.

Successful reports contain exact locally calculated overview figures plus grounded AI observations in four parts: overview, worth keeping, room to adjust, and up to three next actions. Each observation/action cites supplied evidence. A suggested action fills the existing title/day/minutes form; only the user's subsequent explicit save creates a task. No report, estimate, completion or import awards study minutes or ranking credit.

The week can be complete or in progress. Comparisons use the same elapsed previous period, with no percentage invented from an empty baseline. Missing estimates, goals and completion history remain unknown. Recorded time is not represented as attention, mastery, grades or a health assessment.

Reports are imported idempotently into the existing `workspace.learning.reviews` collection, as `snapshot.aiWeek`, using deterministic `ai-week-<job UUID>` IDs. Manual reflections remain separate and are not overwritten by regeneration. Existing local/cloud backup validation supports the AI snapshot. Deleted review markers prevent background retrieval from resurrecting a deleted local review. Server-backed reports can be retrieved after closing the generating page. Available reports remain readable even if generation is disabled, access expires or the provider credential is removed.

Readable, escaped, script-free HTML downloads contain the report and its evidence, without personal reflection text or raw task text. The user can read/print this file in a browser. This is not an implemented PDF-generation claim. Report deletion is explicit; server deletion does not erase downloaded files or offline browser copies. Account export includes server reports, and account deletion removes them by foreign-key cascade, settling pending reservations first.

## Data sent and privacy

`weeklyInput` computes the summary locally from existing study analysis. The server canonicalizes a bounded whitelist: week dates/time zone/cutoff, scope, saved seconds/session counts, per-day and per-subject totals, dated completion/planning/deadline counts, known completed-task estimate totals, and eligible goal counts. Names are replaced by Subject 1/2/etc unless explicitly included. Selected-subject/timer views do not misrepresent global goals as filtered targets.

Email, nickname, chat, private reflection text, task titles and raw timer intervals are not included. Generating a report does not enable automatic workspace sync or upload the rest of the workspace. Submitted aggregates and generated output are stored privately under the authenticated account. Optional labels remain untrusted input in the provider prompt; no tools, external browsing or automatic action execution is enabled.

Privacy and terms copy describe the optional DeepSeek data flow, independent generation allowance, storage/export/deletion and limitations. These changes document actual behavior; this is not a claim that an independent legal/vendor-contract review has been completed. Confirm applicable DeepSeek service/data-processing terms before production activation; do not claim zero retention or no training without provider-contract evidence.

## Backend and limits

Additive migration: `app/migrations/0015_ai_weekly_reports.sql`. It creates private report jobs and the shared daily reservation ledger. It has not been applied remotely.

| Route | Behavior |
| --- | --- |
| `GET /api/learning/weekly-reports/status` | Provider/configuration, own account/access, allowance, temporary reservations and UTC monthly reset |
| `GET /api/learning/weekly-reports` | Own retained ready/pending/failed jobs, with the account ID checked by the client against the authenticated scope |
| `POST /api/learning/weekly-reports` | Explicit consent, authenticated account/CSRF, independently enabled AI preview or trusted Plus, bounded facts, rate/allowance/shared budget, durable request identity |
| `GET /api/learning/weekly-reports/:id` | Own private report/status |
| `DELETE /api/learning/weekly-reports/:id` | Explicit own-report deletion; no refund of previously used successful-report allowance |

Responses are private/no-store/noindex. Identity, origin and CSRF use existing project guards. Ordinary advanced analytics preview alone never grants billable AI calls. Existing trusted subscription expiry is reused; no Stripe API/provisioning was added.

Reservation and settlement use D1 batches with conditional updates. A request key cannot refer to another snapshot; concurrent identical snapshots reuse one pending/ready result. At most one pending report runs per account. A successful valid output consumes one user report; failure, timeout or pending cancellation releases that user reservation exactly once. Reading, downloads and a cached unchanged summary do not spend another allowance. Deleted successful reports retain their quota receipt, preventing delete-to-refill abuse.

The shared daily budget reserves a conservative input-byte-based token upper bound plus 1,600 output tokens and overhead. Known successful usage is accounted; unknown timeout/failure usage conservatively spends the reservation. A failed user report can therefore still consume service capacity. This is a token safeguard, not a guaranteed currency-spend ceiling or a measured cost per report. No provider retry loops silently spend additional calls.

DeepSeek calls use a fixed official endpoint, `deepseek-flash`, JSON output, disabled thinking, no tools, no streaming, and a 22-second abort timeout including response reading. Returned content, evidence IDs, action counts/lengths and usage are validated; blank/truncated/malformed output is a failure. Results are rendered as text, never raw model HTML. The Worker uses `ctx.waitUntil` for bounded completion after response delivery. Stale jobs older than 90 seconds fail on later status/maintenance reads; late callbacks cannot resurrect them. No Queue/DO/R2 resource or new paid plan was created.

Up to 200 ready/pending reports per account are retained. The system rejects a new report at that capacity rather than silently deleting successful history. Failed/deleted summary clearing runs during maintenance; minimal receipt metadata is separate. Current-generation scopes are last week/this week; retained historical reports remain readable. Server authorization and current access are separate from synthetic/local fixture behavior.

## DeepSeek configuration — still required for real generation

Neither the project's local variable files nor this execution environment contained a configured `DEEPSEEK_API_KEY`. No secret was requested in chat, printed or invented. The real adapter is implemented; no successful real DeepSeek call is claimed.

Configure these only in the intended server environment. A local `.dev.vars` file must remain ignored; production uses the existing secret/configuration workflow at a separately authorized release.

```dotenv
DEEPSEEK_API_KEY=<set securely on the server; never PUBLIC or client-side>
AI_WEEKLY_ENABLED=true
AI_WEEKLY_MONTHLY_LIMIT=4
AI_WEEKLY_DAILY_TOKEN_LIMIT=100000
# ISOLATED TEST/PREVIEW ONLY, independently of analytics preview:
AI_WEEKLY_PREVIEW=true
AI_WEEKLY_PREVIEW_ENDS_AT=0
```

The example 4 reports and 100,000 daily tokens are **local test configuration**, not confirmed commercial Plus entitlements. Production generation remains off/unconfigured until explicit configuration. Final quotas and AI-inclusive pricing require actual usage/cost calibration; the earlier US$4.99/US$39.99 proposal did not include verified AI inference costs. Do not automatically end current previews or sell unverified unlimited AI.

Public API/schema references checked on 22 November 2026:

- [DeepSeek first-call endpoint and current model names](https://api-docs.deepseek.com/quick_start/)
- [DeepSeek Chat Completions](https://api-docs.deepseek.com/api/create-chat-completion/)
- [DeepSeek JSON output and blank/truncated-output caveats](https://api-docs.deepseek.com/guides/json_mode/)
- [DeepSeek thinking mode toggle](https://api-docs.deepseek.com/guides/thinking_mode/)
- [Cloudflare context / waitUntil lifecycle](https://developers.cloudflare.com/workers/runtime-apis/context/)

## Preview and evidence

Isolated functional UI preview: `http://127.0.0.1:4326/account?view=progress&preview=ai-weekly`. It uses a visibly labelled disposable synthetic account/data and deterministic synthetic provider output, never DeepSeek or production data. The fixture is ignored at `app/.wrangler/ai-weekly-preview.mjs`; never package, commit or deploy it. The production app contains no fixture credential or provider response.

Test/build/HTTP logs are ignored under `app/.wrangler/ai-weekly-*.log`. UI evidence and final verification outcomes are recorded below after execution. Source changes preserve the user's unrelated `FocusGuide.jsx` status and the earlier pricing documents. Package/production version has not been bumped.

Before any future production release: securely configure the selected DeepSeek account, validate one controlled real call and output quality, confirm provider terms and actual fees/usage, choose the allowance, apply the reviewed additive migration in the intended environment, verify private data and access transitions, then follow normal source/artifact/runtime release checks. Local tests or synthetic clicks are not evidence of a real paid AI report or a production deployment.

## Final verification

- Final full regression: **816 passed**, 0 failed. The final run followed the completed build; tests consume prerendered artifacts, so do not run this suite concurrently with a build that clears `dist`.
- Affected UI/model flow run: **27 passed** before final editorial layout changes; the final full suite also covers these files and the last layout/source changes.
- Final local build: 57 pages + 404, noindex; PWA `2b425e7e33e452b9`, 93 precache entries. Existing large-bundle and mixed static/dynamic-import warnings remain; no dependency was added. No DeepSeek key name/endpoint was found in the public client assets. `git diff --check` passed; existing line-ending notices are not a content change to FocusGuide.
- **63 HTTP route/asset checks** passed, including robots, Sitemap and licenses. The private account page remains noindex. No new public AI route or Sitemap destination was created.
- Real in-app browser, isolated synthetic fixture: explicit unchecked consent and disabled initial generation; successful synthetic generation; auto-import into existing review history; explicit suggestion-to-form transfer; separate task confirmation; preserved saved minutes; private reflection save; reload retaining both report and reflection; cached regeneration with allowance remaining **3 of 4**; existing report selected automatically after reload.
- Responsive UI visually inspected at 390 narrow width before the final enclosing-frame removal, and the final 1280 desktop layout in both themes. Final 320 geometry was checked, but its screenshot was an unusable scaled capture and is not visual acceptance evidence. At 320 override the measured client/scroll widths both equal 305 px (scrollbar excluded), with a 273 px report width; no document horizontal overflow. Desktop light client/scroll widths both 1265 px. Warm paper layout and readable action labels were observed; desktop findings use two columns and narrow CSS uses one column. The enclosing rose frame was removed after actual visual review. Viewport override was reset and the original dark theme restored.
- Screenshots, ignored: `docs/development/evidence/ai-weekly-2026-11-22/desktop.jpg`, `desktop-light.jpg`. The `mobile-light.jpg` file is a scaled capture artifact, not a usable screenshot of the final mobile layout. The marked deliverable tab is the synthetic preview at port 4326, not production and not a real DeepSeek result.
- Actual downloaded-file delivery remains **unverified**. A browser download-event wait stalled and ultimately returned an expired continuation; it was not repeated. HTML generation/escaping is verified in unit tests, but these do not prove a browser file was saved. No product download failure is inferred solely from the automation failure.
- No real Google sign-in/return-flow acceptance, real DeepSeek response/quality/cost, production D1 migration, commercial allowance, payment or production publication is claimed. The client sign-in return marker is unit-tested, short-lived and contains no private report data; the existing OAuth allowlist/protocol is unchanged.

Reproduce in `app/`: run `npm run build`, wait for completion, then `node --test tests/*.test.mjs`. For the currently running isolated preview: set `PREVIEW_ORIGIN=http://127.0.0.1:4326` and run `node scripts/verify-http.mjs`. Fixture processes and `.wrangler` logs never enter the release build. Configuration and real-model validation are still required before this feature can be presented as live AI generation.


## Visual follow-up — 22 November 2026

Implemented the user-approved compact report design locally; no deployment, price, entitlement, API credential, migration or dependency change in this follow-up.

- Report header now owns a prominent HTML download button and stays visible only while reading that report. Phone header uses a short localized date; at 320px it measured 98px high instead of the initial 205px.
- Saved-snapshot figures are shared by the screen and standalone HTML: exact daily bars, subject shares (top three plus other subjects, preserving totals), three primary metrics and an equal-period comparison. Zero bars stay zero; subject anonymity is preserved. Download remains script-free with escaped content and restrictive CSP.
- Apricot observations use short factual evidence; the honey-coloured next-action table retains explicit review/confirmation in the existing task form. The provider prompt now asks for concise prose, without changing stored-response limits or inventing data.
- Existing reports start with a compact update row. Updating expands the consent form in place, clears consent and refuses a second generation for unchanged current facts; first-generation explanation and explicit consent remain visible. Existing historical reports and private reflections are retained.
- Learning records default to five rows, show remaining records in place (bounded batches of thirty), can return to five and expose timing/timer details only when requested. Narrow-screen records stack without horizontal table scrolling.

Final local checks: **821 tests passed**, 0 failed; final build 57 pages +404, noindex, PWA `ed072ce8aa96624f` /93 precache entries; **63 HTTP checks passed** at PREVIEW_ORIGIN=http://127.0.0.1:4326. Diff whitespace check passed with existing line-ending notices. No new browser errors captured.

Actual in-app-browser synthetic verification: saved report and personal reflection survived refresh, update/cancel and initially-unchecked consent, unchanged-generation disabled, records 5→12→5 and inline interval detail. Light/dark desktop plus light 390px and 320px inspected; client/scroll widths matched at 1280, 390 and 320 (1265/375/305 excluding scrollbar), with mobile record width343 at390. Final viewport override reset and original dark theme restored; preview tab retained.

Ignored visual evidence: `docs/development/evidence/ai-weekly-layout-2026-11-22/desktop-light.jpg`, `mobile-records.jpg`, `mobile-actions-320.jpg`. Desktop capture shows report header, metrics and charts; it is not a full report capture. The fixture and generated output are explicitly synthetic. Actual DeepSeek configuration/call/quality/cost and production activation remain unverified. The new download lifecycle and standalone chart HTML pass unit checks; actual browser file-save delivery remains unverified (prior download-event automation stalled and was not repeated).


## AI identity and direct download follow-up — 22 November 2026

User-approved follow-up remains local and undeployed. The visible Progress entry is now **AI weekly study report**, with an up-front explanation that the downloaded copy contains the same charts, analysis and suggestions, with no extra AI generation. Report history contains AI reports only; personal review/history stays beside the reflection form and changing it no longer hides the AI report. Existing unsaved-note guards, saved reflections, explicit suggestion confirmation and historical snapshots remain intact.

The report itself shows AI identity plus provenance: normal provider reports say AI-generated with DeepSeek; the explicit synthetic fixture marker produces Example · not AI-generated in the page, HTML and PDF, including footer attribution. No real provider configuration or call is implied by this label change.

Download full report (PDF) is the primary in-place action, with compact scope text and an optional HTML copy. PDF uses the existing local image-page PDF writer and browser canvas/fonts; it sends no report to a PDF service, opens no new application route/window and does not deduct report allowance. Busy/error/retry feedback stays beside the report; it does not claim the user has saved the file. The PDF is a readable rasterized snapshot, so HTML remains available for selectable text. All reports are validated through the existing saved-AI contract and exclude personal reflections/raw session details. Source text, graphs and next steps remain complete, including multi-page output.

Checks: **826 tests passed**,0 failed; focused32 passed; final local noindex build57+404/PWA70220c9e30a118dc/94 precache entries; **63 HTTP checks passed**. Whitespace check passed with existing line-ending notices. No new dependency, schema, secret, billing/allowance, OAuth, protected adapter or production setting changed.

Actual browser verification used an additional disposable synthetic-only fixture on4327, ignored `.wrangler/ai-weekly-download-preview.mjs`. Its boot hook copies only the synthetic PDF Blob to its own loopback evidence endpoint; this instrumentation is absent from app source and must never deploy. Clicking the real built PDF button produced a valid393251-byte,two-page A4 PDF while the browser stayed at the same account URL and showed prepared-for-download feedback. Pypdf parsed both pages; Poppler rendered both, and both images were visually inspected for complete charts, prose, next actions, provenance and page numbering. The PDF file is captured from actual browser generation; final saving to the user's Downloads folder is not separately verified.

Further actual synthetic UI checks: initial AI entry/unchecked consent, generation, isolated AI-history list, new personal review saved without hiding/changing the AI report; main4326 retained the original existing private reflection. Desktop light screenshot and390px dark screenshot inspected;320 and390 client/scroll widths match305/375, and PDF button widths245/315. No new captured browser errors. Temporary viewport reset, original main dark theme restored, QA tab closed; main4326 deliverable retained. The disposable4327 fixture is not the user's main preview.

Ignored evidence folder: `docs/development/evidence/ai-weekly-clarity-2026-11-22/` contains desktop.jpg,mobile.jpg,pdf-page-1.png,pdf-page-2.png,and output/pdf/StudyTimely-AI-Weekly-Example.pdf. This deliverable is an explicitly synthetic example, not live DeepSeek output. Real-model key/call/quality/cost, production activation, actual Google authentication and paid entitlements remain unverified as previously recorded. No commit,push or deployment performed.


## Paid-report content standard draft — 22 November 2026

The user requested useful analytical sections and a concrete report format before a richer AI report. The design is in `docs/development/ai-weekly-v2/`: report-contract.json, report-output.schema.json, deepseek-report-prompt.txt, implementation-notes.txt, fictional example-data/example-report/example-model-output JSON and reproducible build_example.py/validate_example.py. It is a proposed V2 content/data contract, not a runtime implementation or a user-approved commercial quota.

The AI-written fictional sample has eight sections: decisions; goals versus actual; allocation versus upcoming priorities; plan/estimate execution; next-week capacity/deadlines; a reviewable next plan; action follow-through/multi-week view; evidence/limits. The same content is rendered to HTML and four-page PDF. Actual page figures: 420 recorded/480 target; three completed matched tasks90 estimated/135 recorded minutes; next task candidates420 versus300 available; proposed255 study+45 buffer, deferring165; Biology preparation before a date-only Friday exam. These are fictional inputs, not user records. Estimates and task status do not measure mastery or attention.

Evidence is ignored under `docs/development/evidence/ai-weekly-v2-2026-11-22/`, including report-example.html, output/pdf/StudyTimely-Detailed-AI-Weekly-Example.pdf, page1-4 renders and verification.json. All four pages were visually inspected; revised pages3/4 re-rendered/inspected. Arithmetic, slot/deadline/break and reference checks passed; all narrative blocks were checked for HTML/PDF prose parity. JSON files parse and manual structure/reference checks pass; full Draft2020-12 validation was not run because jsonschema is unavailable. No app tests were repeated because app source/runtime are unchanged by this design-only task.

The existing runtime remains the previous short V1 report with its826 passing tests from the previous implementation turn. Rich V2 generation still needs goal/baseline/task-pair/planner evidence integration, stable cross-week aliases, persistent adopted-action/task links, backward-compatible contracts and controlled real-provider output/cost/user-value validation. No real DeepSeek call, secret configuration, paid report, entitlement change, commit or deployment was performed for the sample. The report samples are AI-written by the assistant, not generated through the site's live model service. The machine-output JSON demonstrates structured reasoning; HTML/PDF are rendered from the reviewed example-report content model, not a claim that V2 runtime rendering is complete.
