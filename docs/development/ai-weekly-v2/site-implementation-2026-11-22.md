# Detailed weekly report — local website implementation

**Later update, 22 November:** the user has now configured the local key. One complete real DeepSeek report over fictional data passed V2 validation and browser save/reload/download checks after an initial rejected incomplete response. See [real-provider verification](../StudyTimely-DeepSeek-Live-Local-2026-11-22.md). The earlier configuration-unverified statements below describe the implementation handoff before that test; production activation and broader quality/entitlement testing remain outstanding.

The accepted eight-part standard is now wired into the existing **Account → Progress → AI weekly study report** flow. This is local, uncommitted and undeployed work. Production/package V2.51.0, pricing, commercial allowances and payment setup remain unchanged. The preceding design example is illustrative; it is not a real DeepSeek evaluation.

## Report content and source data

1. Decisions overview: up to three evidence-linked priorities, proposed adjustments and next-week checks.
2. Goals versus actual: saved study, comparable prior period and the positive weekly target observed at the start. Later target changes are disclosed. Scoped subject/timer reports do not pretend the global target belongs to that scope.
3. Subject allocation: subject totals alongside recorded upcoming exams; no invented mastery or ideal equal split.
4. Execution: observed week-start task baseline, first-observed additions, unknown completion dates and up to twelve completed estimate/effort matches. A match requires an estimate captured before its first recorded study, plus a dated completion. Actual effort covers saved lifetime effort through the cutoff. Small samples do not become calibration multipliers.
5. Capacity: the upcoming seven days from generation, not the already-finished report week. Entered availability, existing commitments, breaks, daily buffer and preserved sessions constrain focus capacity. Known backlog is separated from work due within the horizon. Missing remaining work stays unknown; an initial estimate is not reused after recorded task work without a remaining-work confirmation.
6. Proposed plan: application-generated slots, dated local times, anonymous task references, work not placed, replacement/preservation counts, AI explanation, tradeoffs and fallbacks. Date-only exams conservatively exclude preparation on the exam day.
7. Follow-through and trend: explicitly adopted task links through the report cutoff, with completed/open/removed/unknown/undone status; four equivalent weekly windows. No adoption history and no causal attribution are fabricated.
8. Evidence and limits: bounded source references, missing information and the distinction between saved effort and learning outcomes.

Figures and candidate slots are calculated on the device, normalized by the shared contract and shown in tables/charts. DeepSeek supplies structured interpretation. The validator checks shape, sizes, coverage, reference IDs and the exact candidate ID. It does not prove the truth of every natural-language interpretation; controlled real-provider quality review is still required.

## Readiness and interaction

The page shows analysis coverage before consent or quota use. Insufficient evidence blocks generation on both client and server. Limited reports have an explicit limited-evidence button/description and require `allowLimited: true`; successful generation uses the existing displayed allowance. The page offers inline future-target, available-window and remaining-work entry without adding navigation. New data cannot reconstruct a missing historical baseline.

Selecting a saved report does not mutate plans. Review and add schedule first resolves current task names locally, then requires confirmation. The command rechecks the stored fingerprint, reconstructs the entire deterministic candidate and rejects changed inputs, unreproducible candidates, passed start times and repeated adoption. Only eligible future unlocked sessions are replaced; locked/active sessions stay in place. Undo uses the existing revision-bound planner undo and restores replaced sessions. Other plan edits or an active linked timer can invalidate undo. A report cannot be reapplied after its adoption has been undone; use a fresh updated report.

Adding or undoing a schedule never starts timers, completes tasks or creates study minutes. Append-only adoption/undo events survive validation, backup and merge. Dates after the selected report cutoff do not enter historical follow-through.

V1 reports retain their original four-part reader/export and private notes. V2 uses distinct facts/output versions in the existing report JSON columns and review snapshots; no additional DB migration is needed beyond the previously implemented, still-local 0015 migration. Updated reports coexist, and duplicate-week history labels include generation time and edition.

## Privacy and downloads

Explicit consent covers four-window totals, original target/plan evidence, anonymous estimate matches, remaining workloads, deadline dates, daily capacity, proposed session times and adopted-task status. Raw task IDs/titles, private calendar event text, exact source availability windows, raw session logs, email, nickname, chats and personal reflections are excluded. Subject labels are optional; local task names appear only during the confirmation review.

The report toolbar offers direct PDF and HTML downloads. Both use the same saved eight-part content model, charts, reasoning, candidate and limits, without a new AI call or quota charge. On-screen long tables initially show ten rows with an inline expand; downloads contain every row. The PDF uses the existing on-device canvas/PDF writer, automatic pagination and repeated table headers. Synthetic fixtures are explicitly labelled **Example · not AI-generated** in every format.

## Provider activation and remaining release work

V1 configuration remains intact. V2 additionally requires:

- `AI_WEEKLY_DETAILED_ENABLED=true`
- `AI_WEEKLY_DETAILED_MAX_OUTPUT`: explicit integer from 2048 through 6000, chosen after real quality/cost tests.

The server reserves the bounded input/output budget, retains the existing successful-report allowance and returns allowance after invalid/failed output. The provider remains the fixed official DeepSeek endpoint with JSON response, disabled thinking and a 22-second timeout. No automatic retry amplifies cost. Reading existing reports survives configuration removal or access expiry.

The local preview uses a fake provider and four test reports, not a commercial offer. No real DeepSeek credential, generation, latency, token cost or paid entitlement flow has been verified. Do not place secrets in chat. Before release, configure the secret on the server, test representative rich/limited/invalid reports against DeepSeek, measure completion under the bounded timeout/output budget, finalize allowance economics, apply the existing migration in the authorized environment and separately authorize production deployment. Never deploy `.wrangler` fixtures or synthetic accounts.

## Implementation map

- `app/src/lib/ai-weekly-v2-contract.mjs`: shared bounded facts/reasoning contract and evidence.
- `app/src/lib/ai-weekly-detailed.mjs`: local history, privacy aliases, capacity and candidate extraction.
- `app/src/lib/weekly-detailed-view.mjs`: shared eight-part presentation model.
- `app/src/components/DetailedWeeklyReport.jsx`: report, readiness inputs and explicit plan review.
- Existing provider/API, weekly report entry, history, PDF/HTML, planner actions/schema and learning history are extended for V2 while retaining V1.
- `report-output.schema.json` and `example-model-output.json` are the earlier design proposal/example. The executable normalized runtime contract above is authoritative for API payloads. Its five reasoning groups plus overview, next plan and evidence/unknowns form the eight displayed parts.

Validation evidence and final browser checks are recorded in the thread and `docs/development/evidence/ai-weekly-v2-site-2026-11-22/` (ignored local artifacts). Preserve the unrelated pre-existing `FocusGuide.jsx` status and pricing documents.

## Final local acceptance, 22 November 2026

- Final build: 57 pages plus 404, local-preview noindex; PWA `a2d0ca7572296e91`, 94 precache entries.
- Final full suite: **841 passed**, zero failures. HTTP verification: **63 passed**. Whitespace diff check passed (existing line-ending warnings are not test failures).
- Actual in-app browser: synthetic generation twice; eight displayed parts; two same-week reports retained with distinct generation-time labels; old/new selection restored each report. Explicit plan review resolved local task names, confirmation added sessions, undo restored them. Provider fixture made no DeepSeek calls.
- Desktop light and dark inspected; 390px document 375px, 320px document 305px, no page-level horizontal overflow. Wider report tables scroll inside their own containers. Temporary viewport override reset and original dark theme restored. Final error/warning console was empty.
- Actual browser PDF captured from the on-device download flow: five A4 pages. All five rendered and visually reviewed, with full-size checks on dense table/evidence pages. Repeated headers, complete reasoning, provenance, charts and all eight parts retained. The native final Downloads-folder save was not independently verified; no popup/new window is needed by the implementation. Downloading left the test allowance at 2 of 4 after two generated reports.
- Deliverable preview: `http://127.0.0.1:4328/account?view=progress&preview=ai-weekly#cp-review-title`, in-app browser tab 8. Ignored fixture `.wrangler/ai-weekly-detailed-preview.mjs`, local server session 95518. Never ship this helper, fake provider or account.
- No production deployment, database write, real provider request, payment action or commercial activation occurred.
