# StudyTimely V2.4.0 production release

Published to https://studytimely.com on 2026-11-14 at 07:30:40 UTC, serving 100% of traffic. This release includes the previously local V2.3 timer and ambient-sound improvements.

## Result

- Six local timer tools share responsive portrait hour/minute/second cards, colon separators and Small/Medium/Large display preferences.
- Sounds opens a 12-icon ambient mixer with independent levels, master volume, mute/resume and saved mixes.
- Music opens five complete instrumental recordings by Kevin MacLeod, free without login or payment. The shared toolbar/Settings/Study Space player supports pause/resume, previous/next, seeking, volume/mute and playlist/track repeat.
- Original recordings are self-hosted under the composer's public CC BY 4.0 grant. Attribution, original file hashes, source links and the license PDF are included. These are complete recordings, not previews. Music loads when played and is excluded from the initial offline precache.
- Audio byte ranges use a bounded streaming adapter. Remembered preferences retain the existing explicit presentation-sync contract; playback intent and position are not persisted, and refresh does not automatically play audio.

## Deployment and validation

- Runtime source: `be0a976e9f7e1dd5d509304511fec7eacb94b961`; exact source tree: `936a8a91272645a748a24809014cffcbe230b7d2`.
- Public source branch: [v2-google-community](https://github.com/AImilesChen/studytimely/tree/v2-google-community).
- Worker version: `6b4e96a4-2ab6-415e-a62f-bfac5b5ee836`; deployment: `45e59770-74a9-4a30-b88a-09edfc65f028`.
- Production build, 120 tests and Cloudflare deployment preflight passed. The local release candidate passed 61 route/resource checks and 25 music checks.
- All 150 production HTTP checks passed: 55 routes, redirects/404 responses, canonical/indexing rules, 48 Sitemap URLs, anonymous account/community readiness and exact hashes of 71 public assets.
- All 25 production music checks passed, including five complete original MP3 hashes, MIME/cache/length headers, initial/suffix/open-ended byte ranges, invalid-range responses, credits, license PDF and exclusion from the offline precache.
- In-app production browser verified actual playback advancing from 0:08 to 0:39, pause, keyboard seeking to 0:01, five-track credits, twelve ambient controls and refresh resetting playback to paused at 0:00. The idle study timer remained 00:00:00; no study or community record was created. Desktop and 320px phone layouts had no horizontal overflow. Captured browser warning/error logs were empty. Some browser automation calls timed out; results above were confirmed with subsequent fresh DOM observations.
- PWA version: `878b47276a575754`; 61 precached resources. Existing browser installations can use Update app when offered.

All nine existing binding names/types were retained. No database migration, credential, OAuth implementation, protected adapter, tracking configuration, DNS, paid plan or unrelated resource change was made. Existing Cloudflare authentication was refreshed without expanding permissions.

## Recovery and remaining acceptance

Rollback target is the prior V2.2.0 Worker `2f17ae2d-1eb0-4def-a1a9-14b24f4f490e`. Evidence is local under `docs/development/evidence/music-release-2026-11-14/` and excluded from Git.

The separate authenticated production room/timer/chat/moderation acceptance and main-promotion gate remain pending. This release does not claim to complete them. Later documentation-only commits do not represent another runtime deployment.
