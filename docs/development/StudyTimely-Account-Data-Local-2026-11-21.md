# Account & data — local implementation, 21 November 2026

Implemented under the approved account/data plan and practical-visual-design skill. Local only: no commit, push or deployment. Production and package version remain V2.49.0. Preserve the unrelated FocusGuide.jsx working-copy status.

## Behaviour and layout

The account identity is a compact row. Actual sync status, explicit sync setup and learning-backup download/import lead the page. Backups, deleted items and sync browsers expose real lists or specific loading/error/unavailable states. Nickname/public-ranking preferences follow the tools; account-data export, legacy-snapshot controls where applicable, deletion and a visible illustrated guide follow. The old fake recovery menu, generic preview badge and duplicate settings introduction are removed. Principal instructions and controls are expanded by default.

Existing sync/CSRF/version/account boundaries and full-restore confirmations remain. Setup requires an explicit local/cloud merge choice; sign-in alone never uploads records. History reads load independently, reject stale account results and display failures without turning them into empty data. The browser list describes sync access accurately. No new backend endpoints, permissions or schema are introduced.

Learning-backup import reuses the actual model merge rules. Files are validated locally against the existing JSON/5 MiB limits; account-data exports are explicitly rejected. The preview shows user-facing before/after totals, without exposing internal-record counts as tasks. Merge respects IDs, existing goals and saved deletion records. Both the initial snapshot check and atomic import action reject changed revisions/epochs. Account changes, unfinished timers, temporary storage and pending local saves are guarded. Cancellation does not save. A committed import remains reported as saved even if the following sync-status refresh fails.

Local protection copies now precede changed imports/deletions even when automatic sync is off. The existing bounded protection mechanism is reused without enabling or queuing cloud sync. Local-only import and restoring its previous protection copy are covered by real IndexedDB tests.

The existing serif headings, warm surfaces, one local cat sticker and a few unboxed guide emoji are retained. Important buttons have 44px minimum height; import uses a distinct gold fill. Desktop backup tools share an aligned two-column workspace. Mobile uses a single column, readable account identity and a two-by-two account tab layout so the current section is visible. A legacy inherited account frame/padding and mobile email compression were corrected after browser inspection.

## Search content

`/help/sync-and-backup` is a new prerendered public guide with its own title, description, canonical, Article and BreadcrumbList metadata. It covers another-device use, learning-backup download/import, historical recovery, data scope and limits, with a labelled example and expanded answers. Study Timer and Study Tracker link to it. The guide is eligible for the public Sitemap in a release build; local previews remain noindex. Account/query pages remain noindex and their tools continue to require the existing authentication/authorisation rules.

## Verification

- Full local regression: **786 passed, zero failed**. This includes six new backup/import tests and six new account/data render/metadata cases, plus existing real sync/API/two-device/recovery regressions.
- After the final presentation changes, the relevant **22 tests passed**. Final build: 57 prerendered pages plus 404, local noindex, PWA `cebbeffaa85f95aa`, 77 resources. Existing bundle/import warnings remain.
- **63 HTTP route/resource checks** passed; the six existing group-page checks and the new guide initial HTML, canonical/structured data, public source links and private account indexing checks passed.
- Actual in-app browser: local synthetic account loaded the reordered controls. Sync setup showed real zero-count local/cloud comparisons, initially disabled Continue, enabled it only after selecting a choice, and cancelled without enabling sync. A generated one-task JSON file opened a real import preview; cancelling left zero protection copies and no imported task. Learning-backup download completed and showed its receipt. No cloud-enabling or destructive account action was submitted.
- Screenshots were captured and inspected in the in-app browser: final desktop dark, phone dark/light. Initial loading/stale-scroll captures were replaced. Geometry checks at 1280, 390 and 320 CSS pixels showed document widths 1265, 375 and 305 respectively, with no page-wide overflow; narrow-screen control/image bounds stayed inside the viewport. The current tab remains a deliverable; the original dark theme and default viewport override were restored.
- In-app console errors/warnings were empty at the final check. Source formatting checks passed. No new dependencies, credentials, OAuth, tracking settings, protected Sites adapters or production data changed.

Preview: `http://127.0.0.1:4318/account?view=settings&preview=account-data-ready`.

Ignored evidence: `docs/development/evidence/account-data-local-2026-11-21/`; test/build/HTTP logs are under ignored `app/.wrangler/account-data-*.log`. The local synthetic Worker and diagnostic proxy must never be deployed. Production login, real multi-device browser acceptance and external search-platform submission are not claimed by this local handoff.
