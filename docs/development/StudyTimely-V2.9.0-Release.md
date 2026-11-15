# StudyTimely V2.9.0 release candidate

Prepared on 2026-11-15 for the user's requested production publication. Deployment is pending; this document will be updated with the actual published source and runtime after verification.

## Scope

The Study Time Calculator now supports focused or elapsed daily budgets and remaining workload before a deadline. It counts selected calendar days, separates breaks, checks optional daily capacity and explains shortfalls. Results can be copied, reviewed as one editable first-day Planner draft, or used to prepare an idle Focus Timer after confirmation. Neither an estimate nor a draft creates recorded study time. Existing unfinished-timer protection remains in force.

The accepted layout uses equal desktop columns and matching card boundaries, a large daily result with four secondary figures, shared task/focus/copy actions below both columns, and collapsed calculation details. Phones stack the panels and actions. The approximately 1,390-word guide and eight FAQ answers enter initial HTML; canonical, metadata and WebApplication/BreadcrumbList describe the actual calculator. The privacy policy explains in-memory estimates and explicit task/preference saves.

## Candidate checks

Production-mode build prepared 55 pages plus 404, with PWA `989471e0d9fdfec6` and 61 precache resources. All 163 tests passed under `STUDY_TEST_RELEASE=1`; 61 release-mode HTTP/resource checks passed against the local built candidate. Existing local browser interaction and responsive acceptance is recorded in `StudyTimely-Calculator-Local-2026-11-15.md`.

The target remains the existing `studytimely` Cloudflare Worker and domain, sourced from `v2-google-community`. No main promotion, database migration, production data mutation, resource provisioning, dependency, OAuth, analytics configuration or protected Sites-adapter change is part of this release. Preserve all nine existing runtime bindings and existing variables/secrets.

## Recovery and remaining acceptance

Pre-release runtime/rollback version: `be846bab-8ffd-405c-86e7-2e614a92d23c` (V2.8.0). A code rollback needs no database restoration; it removes the new calculator UI and planning handoffs. Existing browser-only calculator estimates are ephemeral. Do not clear stored work or force an update during a running session.

Evidence is ignored under `docs/development/evidence/calculator-release-2026-11-15/`. Production deployment, public artifact/HTTP checks and production browser acceptance remain pending at candidate preparation. GSC/Bing indexing and GA4/Ahrefs backend receipt are not reverified. External community review and authenticated production-community/main-promotion gates remain independent and unchanged.
