# StudyTimely V2.51.0 — original wallpapers and library access

Published 22 November 2026 at https://studytimely.com/aesthetic-timer. Choose **Scenes** to browse the collection. This publication includes the previously local library membership rules and twelve new original wallpapers.

- Runtime commit: `07f282bfad079edb5e1dca87001755fa15a7dcbe`; exact tree `17cc81df56a3efdbb8a6fa5d71a7e191dd139bab`; branch `v2-google-community`.
- Worker version: `3b43d63d-7b94-45d1-8da2-b840ad261c7d`.
- Deployment: `7b3b5c6b-24ac-4ef4-9ddf-2ffffa161281`, created `2026-11-22T02:07:47.323012Z`, **100% traffic**.
- PWA: `5757cf53b28ec979`, 93 precache resources.
- Rollback: V2.50.0 Worker `fdbeceb4-8149-4ca0-adec-19f9ff9928d8`; no database restore required.

## Published behaviour

The scene picker now offers Landscapes, Seasons & flowers, Illustrated escapes, Study companions, Cozy spaces and Ink & gold, plus All and the existing Live format filter. Twelve new AI-generated still images cover blue alpine water, reeds, white cosmos, golden birches, amber leaves, a painted seaside bookshop, a sleepy kitten, curious calves, a felt capybara, Professor duck, a coastal train seat and golden koi. New images appear first. Each full WebP is 1664×936 with a 480×270 public preview; the twelve full images total 2,226,382 bytes. These are not native 4K assets. Prompts, source/image hashes and bounded research claims are in the dated original-wallpaper handoff and JSON manifests. Source social images/IP characters were not copied into the collection.

The shared library now contains 26 scenes: 4 free and 22 Plus, including the two existing real live scenes. The original 8 themes, 5 music tracks, all nature sounds/mixes and four starter scenes retain the agreed free floor. Twenty additional tracks and three new palettes also use the shared Plus rule. Existing defaults, legacy presets, timers, favourites, saved setups and personal/group access distinctions are preserved.

Full expanded media requests use server-verified access, private full-media URLs and private/no-store responses. Raw expanded-media paths are guarded too. Public scene previews and separate eight-second audio samples remain accessible without a grant. The service worker caches public previews and free full posters, not full Plus media. Expiry pauses expanded music and shows free scene/colour alternatives without stopping a timer or deleting settings. Restoring access does not start audio.

The explicitly labelled **free library preview remains enabled**. No payment, price, subscription purchase, grant provisioning, production account mutation or payment-webhook acceptance is claimed. This release prepares and publishes the access boundary; payment integration remains separate. Previously downloaded copies cannot be recalled. Existing licensed recordings remain CC BY 4.0; membership does not grant exclusive ownership.

## Verification and limits

- Release build: 57 prerendered routes plus 404; matching Wrangler 4.152.0 dry run passed.
- **798 release-mode regression tests passed**, plus 18 final affected checks after the package/version-only build. The first ordinary test invocation against release HTML failed the expected indexing-mode assertion; the proper release-mode run passed without changing that assertion.
- **63 candidate HTTP checks** passed, including indexing, canonical, Sitemap and notices.
- **191 real-file candidate access checks** passed for preview/free/synthetic grant/revocation/ranges.
- **214/214 production public non-audio/video files exactly match** the release artifacts. Fifteen additional production check groups passed: explicit preview discovery; every new full image/thumbnail/raw-path cache rule; image bytes with an optional Range header; free/PWA/category boundaries; a real licensed sample hash; private account/API protection and absence of fixtures. Still images legally return the full 200 response when Range is ignored; streaming audio/video retain their separately tested 206 contract. An initially over-strict image-range verifier was corrected; application code was unchanged.
- Cloudflare confirms **100% traffic and all 12 existing bindings/handlers/runtime settings unchanged**, with keep-vars. No schema, migration, dependency, credentials, OAuth, DNS, paid resource, tracking or protected adapter changes. Ignored fixtures and source PNG/evidence files were not deployed.
- Source inventory: 518 files, SHA256 `4d1950aacceffee9b8bee42e304615fab49d6392dcda057a2fa335195cc37e30`.
- Artifact inventory: 281 files, SHA256 `2dd3a7ca793772e7b28d527ab58c41258172e7cdad8b7c6453504f989e67a4fa`.

Generated artwork and the contact sheet were visually inspected. Fresh in-app browser interaction/phone acceptance was not completed because repeated browser reads timed out; no new production screenshot or authenticated purchase/grant acceptance is claimed. The production page was opened through Codex's native handoff. Earlier local library-interaction evidence remains in the 21 November handoff; the new classification/artwork is additionally covered by catalogue/hash/access tests and live file checks. External search submissions and analytics-event acceptance were not rerun. Independent authenticated community/moderation/main-promotion gates remain unchanged.

Evidence is ignored under `docs/development/evidence/original-wallpapers-2026-11-22/`. The unrelated FocusGuide.jsx status remains excluded. Later documentation commits do not imply a new runtime deployment.
