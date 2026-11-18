# Account: preserve the learning center and integrate sync locally

Implemented 18 November 2026. Local-only revision of the existing unpublished automatic-sync feature. Production/package remain V2.33.0; no deployment or source push was requested or performed.

## Accepted scope

Preserve the published account page’s Overview, My learning, Progress, Community and Settings; keep the existing learning metrics, task actions, charts, exams, topics and community content. Add a compact data/sync entry at the end of Overview. Keep the complete recovery center inside Settings. Fix the reported anonymous status error, consolidate duplicate downloads and update stale copy. This is a local integration revision, not a whole-account redesign.

## Changes

- Overview adds `StudyCenterData` after the existing learning/community content. It shows a concise data status, Download backup, and Manage sync & recovery. Normal account navigation opens Overview.
- The top learning context remains a date/device line; detailed sync status no longer competes with the learning header. The five existing tabs and their learning content are retained.
- Manage opens Settings and focuses its sync section. Explicit `/account?view=sync` remains supported. The synthetic fixture now returns to ordinary `/account`, so its default demonstration starts with learning content.
- Settings places account identity/sign-in/account actions before the complete Sync & recovery section. Legacy manual-snapshot operations remain a disclosure; existing legacy cloud clear is retained there when applicable.
- Removed the extra “This browser / Download browser backup” panel. A single local backup download remains within the recovery section; Overview has its own contextual quick action.
- Inactive sync shows a compact introduction instead of empty history and preview columns. Local protection history remains available without cloud enablement. For configured workspaces, preview appears after selecting a backup; browsing alone uses the full width.
- One shared `sync-view.mjs` defines status labels and tones. A real error has one actionable status, avoiding stacked warning panels. Checking/anonymous/paused/offline/conflict/temporary/pending-local-save states have separate meanings.
- The actual wake/reconnect/manual-exchange path calls `syncContext`. Disabled/anonymous/held workspaces stop before sync authentication checks. After a session switches to guest, the exchange returns a normal local state. Enabled mismatched identities remain blocked.
- Replaced the obsolete manual-only footer sentence. Existing task/session data rules, storage, sync transport, migration 0013, recovery safeguards and community credit remain unchanged in this revision.
- Scoped light/dark CSS keeps the compact card aligned with existing content; small screens stack its actions. No new dependency, image asset, resource, credential, OAuth scope or payment integration.

## Verification

Nine focused checks passed: real rendered components retain all learning sections and position the data card below them; inactive recovery has one download and no vacant columns; configured history omits the empty preview; real errors have a single retry presentation. Shared state-path tests cover anonymous wake, paused/held states, expired sessions becoming guest, correct/wrong account and meaningful status tones.

Final build: 56 routes + 404, local noindex, PWA `07f3a21d99e88452`, 62 precache resources. Existing nonfatal bundle-size/dynamic-import advisories remain. Full regression: **574 tests passed**. Native local Workerd/D1: **67 checks passed**, including both synthetic login redirects to ordinary `/account`. **62 HTTP route/resource checks passed**. A separate final account HTML check confirms the original learning sections, the compact card after recent study, and no full recovery center on the default homepage. `git diff --check` passed.

Evidence: `docs/development/evidence/account-sync-layout-2026-11-18/`. Preview uses the existing isolated local Workerd/D1 fixture at port4298, with migration0013 already applied only locally. No production database was touched. Backend API behavior is also covered by the prior automatic-sync integration suite.

## Browser evidence limits

Source grounding is the user-provided screenshots and the published-version account component, plus the approved narrow integration plan. Only in-app-browser opening is available; there is no usable screenshot/control tool in this session and the installed browser skill directory is empty. No alternate browser or OS capture was used. Server rendering, state tests and HTTP checks establish their specific checks, not visual/mobile/keyboard/download/real-Google acceptance. `design-qa.md` remains blocked pending actual in-app browser review.

Review Overview-to-Settings navigation/focus, all five existing tabs, anonymous focus/reconnect, enabled/paused/conflicting sync, first-use setup, backup selection/restoration and mobile wrapping on the current build before production release. Keep the existing independent community/main-promotion gate.
