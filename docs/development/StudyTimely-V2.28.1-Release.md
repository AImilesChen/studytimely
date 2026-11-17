# V2.28.1 — Shared daily study-goal wording

Published at https://studytimely.com/study-groups on 17 November 2026. Creation and owner settings now use “Daily shared study goal (minutes)” with a short cumulative-time/non-stopping explanation. Both inputs retain the default/range and have separate aria-describedby IDs. The 14px hint sits 8px below its field. Progress and public guidance include the four-times-thirty example and UTC day boundary. No timer/accounting, API, database or entitlement logic changed.

- Runtime local commit: `9ae1ddc8cb00540ea646d2181dda74440e14894b`; tree `5772d5ee10f41f92c81393d91df75dbb4df7f936`.
- Worker: `5fbc41eb-d5d7-47c4-bd0d-2e84f8ffc380`.
- Deployment: `ba7bf40e-cff5-4f54-ab03-efd1f909acd0`, `2026-11-17T12:04:36.664069Z`, 100%.
- PWA: `f091a4b28b2d85c1`, 62 resources.
- Source inventory: 286 files, SHA-256 `1662d0ba88b60cef64644b8ad7e57144a7f67558e9611cbe54b733ccf392131c`.
- Artifact inventory: 134 files, SHA-256 `48c318fc086c751d77b4ea15b9198a433bb046c3963aeb91664645f0d432923f`.

Final release build, seven existing release-mode site tests, deployment dry-run, 62 candidate and 62 production HTTP checks passed. Exact hashes matched 128 public non-MP3 artifacts. The public checker explicitly verified the new form label/help in the published client bundle, absence of the old label, scoped hint CSS and the public 120-minute example. It also checked 56 navigation pages, PWA, robots/Sitemap/canonical, authentication/privacy guards and fixture routes remaining 404. The preceding local in-app-browser checks covered creation/settings/progress, accessible descriptions, default120, 8px/14px hint placement, desktop and 390px phone layout without horizontal overflow. Screenshots were inspected. No new tests were added for this copy-only revision; the V2.28.0 full-suite/companion acceptance record remains the broader baseline.

All twelve existing bindings and runtime settings were verified unchanged. Review remains disabled with no AI binding; payments remain unavailable. No database migration, secret rotation, new grant, production room/message/timer write, paid resource, tracking or protected adapter change. No new production in-app-browser room interaction is claimed for this copy-only release; form interaction evidence is local, and published bytes are verified exactly.

## GitHub synchronisation at publication

At the time of website publication, the runtime commit was local and had not been pushed. Git HTTPS pushes failed three times (low-speed timeout, connection reset, then connection failure). A GitHub connector read confirmed the existing public `AImilesChen/studytimely` branch remains at `5d78c76e3497c62a102dfb4b6f27b09f9edb48bb`; its existing AGENTS blob matches the local parent exactly.

Automatic approval rejected a fallback GitHub create-tree operation including six changed files because it contained the full internal AGENTS record. A safer retry restricted to five application files was also rejected: the review required explicit confirmation that this public repository is a trusted destination for the source contents. Neither rejected operation created a remote tree/commit/ref. The user subsequently explicitly approved synchronising this source, dependency lockfile and release records (including AGENTS.md) to the existing public repository. This resolves the repository-confirmation requirement; synchronisation is separate from deployment. Keep the full verified local source and manifest. Website publication was independently authorised and completed through the existing Cloudflare target; internal records were not uploaded as website assets.

Ignored evidence: `docs/development/evidence/shared-goal-release-2026-11-17/` (manifest, before/after runtime metadata, dry-run/deploy logs and public hash verification); build/test logs in `app/.wrangler/shared-goal-release-*.log`. Local UI evidence: `docs/development/evidence/shared-goal-copy-2026-11-17/`.

Rollback target is V2.28.0 Worker `c20c9054-dd0c-4fae-872a-fd9ecfd6f9f2`. No database restore is required. Real two-person production acceptance and main promotion remain independent and pending.

The user's subsequent questions about quick-message stickers and custom room themes are analysis requests. Current room overview saves predefined subject/notice IDs and broadcasts changes; custom themes and rich stickers are not implemented by this release. Do not claim otherwise or silently send new content for external review.
