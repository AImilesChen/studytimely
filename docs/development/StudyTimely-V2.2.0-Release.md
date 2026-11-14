# StudyTimely V2.2.0 production release

Prepared on 2026-11-14 for the user's explicit production publication request.

## Changes

- Expanded prerendered homepage guidance, study scenarios, timing comparisons and eight FAQs, preserving the free anonymous tools and explicit local/manual-sync behavior.
- Added visible Sounds, Alert, Themes and Focus controls above the mode dock. Reused the existing ambient engine, alert settings, theme picker and focus behavior.
- Unified homepage typography and content boundaries, desktop reading columns, phone labels for study intervals, and footer/FAQ text. Fixed narrow-page horizontal overflow with a homepage-only minimum-width adjustment.

## Validation and boundaries

The production build and all 95 existing tests pass. Local release verification passes 61 route/asset checks, robots, canonical URLs and Sitemap. Desktop, tablet and phone layouts and actual quick-tool interactions were checked during implementation. The four protected adapter files, Worker backend, database schema, OAuth implementation and Cloudflare resource configuration are unchanged.

Publish the exact GitHub `v2-google-community` source tree to the existing StudyTimely Worker. Keep the existing main-promotion gate for real community acceptance. No database migration, DNS change, payment or plan change is required. Preserve the current Worker version as the rollback target and verify the deployed bootstrap assets against the local build.

## Production verification

Published to https://studytimely.com on 2026-11-14 at 03:35:04 UTC, serving 100% of traffic. The user explicitly approved the six Cloudflare CLI OAuth permissions after the initial automatic approval rejection; authentication was restored before deployment.

- Runtime source: e90f07506b97a3b3dc7e6c7ba7f887a973b0fbb9; source tree ac4de98c9686cc9fbb55a537aa7682e9f17956a2.
- Worker version: 2f17ae2d-1eb0-4def-a1a9-14b24f4f490e; deployment: 272502bc-cf9c-4610-a433-db4d0cae211e.
- PWA version: ec0944a0de15e658; 61 precached public resources.
- 95 existing tests and 61 local release checks passed. All 142 public release checks passed, covering 55 routes, redirects/404 responses, indexing, 48 Sitemap URLs, anonymous account/community readiness and exact hashes of 63 public assets.
- Production browser verified the visible quick toolbar, the six-sound panel, 17px desktop body text, 16px phone body text and no horizontal overflow at 320px. Captured browser error/warning logs were empty. No production personal study record or community action was created.
- All nine existing binding names/types remained present. No schema, OAuth implementation, secrets, account settings, DNS or plan configuration changed.
- Rollback target: prior Worker 113beef9-ca2a-459b-ba9d-408e8f3bdbe2 (V2.1.4).

Evidence is local under docs/development/evidence/homepage-release-2026-11-14/ and is excluded from Git. Existing authenticated room/chat/moderation acceptance and the main-promotion gate remain pending independently. Later documentation-only commits do not represent a new runtime deployment.
