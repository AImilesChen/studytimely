# StudyTimely V2.2.0 release candidate

Prepared on 2026-11-14 for the user's explicit production publication request.

## Changes

- Expanded prerendered homepage guidance, study scenarios, timing comparisons and eight FAQs, preserving the free anonymous tools and explicit local/manual-sync behavior.
- Added visible Sounds, Alert, Themes and Focus controls above the mode dock. Reused the existing ambient engine, alert settings, theme picker and focus behavior.
- Unified homepage typography and content boundaries, desktop reading columns, phone labels for study intervals, and footer/FAQ text. Fixed narrow-page horizontal overflow with a homepage-only minimum-width adjustment.

## Validation and boundaries

The production build and all 95 existing tests pass. Local release verification passes 61 route/asset checks, robots, canonical URLs and Sitemap. Desktop, tablet and phone layouts and actual quick-tool interactions were checked during implementation. The four protected adapter files, Worker backend, database schema, OAuth implementation and Cloudflare resource configuration are unchanged.

Publish the exact GitHub `v2-google-community` source tree to the existing StudyTimely Worker. Keep the existing main-promotion gate for real community acceptance. No database migration, DNS change, payment or plan change is required. Preserve the current Worker version as the rollback target and verify the deployed bootstrap assets against the local build.

Deployment status and exact source/runtime identifiers will be recorded after production verification. At this candidate stage, Cloudflare reauthorization is pending explicit approval after the automatic approval reviewer rejected the OAuth authorization action. GitHub publication and local dry-run preparation can proceed independently.
