# StudyTimely V2.23.0 production release

Published at <https://studytimely.com/> on 16 November 2026. This supersedes the local-only status in `StudyTimely-Shared-Layout-Local-2026-11-16.md`.

## Changes

The shared screen stylesheet now gives tool/community pages, below-fold guides, city/world directory content and footer a common actual content maximum of 1280px. Horizontal gutters are 32px on desktop, 24px at 651–1024px and 16px at 650px and below. Page frames no longer lose extra space to percentage padding. The Calculator guide's additional width cap is removed. Paragraph reading measures and internal form/dialog widths remain independent.

The timer/clock heroes, site navigation, presentation mode and print styles are outside the shared screen overrides. No timing/accounting, API, model/storage format, database migration, authentication, dependency, protected Sites adapter, tracking configuration, legal text, DNS or paid resource changes are included.

## Source and deployment

- Runtime source: `2c7d847fac4dd1b9600ba8eafa2e43933160deee`.
- Exact Git tree: `07f61f179b20397b3f452575307b4d8baf46db7b`.
- [Public source branch](https://github.com/AImilesChen/studytimely/tree/v2-google-community); six-file runtime commit synchronized with parent/ref/tree checks and no force. GitHub connector independently read version 2.23.0.
- Worker version: `e6bc1a5b-d758-4849-a831-a11a0331c700`.
- Deployment: `63de0a8a-c87e-496f-ac11-2869cf1ec3d6`, created `2026-11-16T13:21:14.91228Z`, read back serving 100%.
- PWA: `8abeb65f3115c7ae`, 62 precache resources.
- Source inventory SHA-256: `4395626359490ef62ead3ad97c5e0724a04886bd6f603d78cc4a99b939cd5312`.
- Artifact inventory SHA-256: `f502fa639dc5cd16914fb0f150d8317a466d7e6e3465b36017207564c96780dd`.

Existing Cloudflare authorization was refreshed without expanding permissions. Deployment used `--keep-vars`; all nine binding names/types and the plain/D1/Durable Object definitions were compared before and after. Main was not promoted; independent authenticated production-community acceptance remains pending.

## Verification

The release build produced 56 pages plus 404. All 299 release tests, Wrangler dry-run and 62 candidate HTTP checks passed. All 62 public HTTP checks passed, including redirects, robots, sitemap, metadata and resources. All 125 public non-MP3 artifacts exactly matched the release inventory; all 56 pages retained shared navigation and initially closed disclosures. Existing licensed MP3 files were not downloaded again. The existing bundle-size advisory remains.

Actual in-app browser observations confirmed the new CSS on public Groups: at 1280px viewport, content x=32px and width=1201px with a 1265px client width. Public Tracker at 1440px had a 1280px frame and footer, both x=72.5px. At 390px, frame/footer width=343px and x=16px; no document horizontal overflow. Production Groups desktop and Tracker phone screenshots were saved and inspected. Warning/error log read was empty. The viewport was reset and the final public Tracker tab marked deliverable; final 1280px measurement again matched the rule.

One batched production navigation read timed out and reset the browser runtime. Individual reads on the recovered same tab succeeded; no result from the unfinished batch is counted as evidence. The earlier local 120 route/viewport measurements, seven desktop hero baselines, guide-edge checks, Focus/Escape and panel checks remain documented in the local handoff. Real account/room/chat/sync, native fullscreen, physical audio, installation/offline operation, full accessibility and analytics backend collection were not reverified for this CSS release. No production study or community data or preferences were changed.

Ignored evidence: `docs/development/evidence/layout-release-2026-11-16/` contains build/tests/preflight/dry-run/deploy logs, exact source synchronization, artifact inventory, public file hashes, HTTP checks, browser measurements, screenshots and sanitized runtime summary. Raw runtime records must remain private. Later documentation-only commits do not imply another deployment.

## Recovery

Previous V2.22.0 Worker `be98f161-2da7-42bf-9ff6-828db1f363d0` is the rollback point. This CSS release does not change persisted data and requires no automatic database restore. Finish an active learning session before accepting a waiting app update.
