# StudyTimely nature scene library — 19 November 2026

Local implementation only. Production and package remain V2.34.0. No commit, push or deployment in this task.

## Result

Created and visually inspected 12 individual original photographic-style landscapes using the built-in `image_gen` tool, without downloading or copying the reference websites' wallpapers. The exact full prompts, names, groups and generator output paths are in [focus-nature-prompts-2026-11-19.json](focus-nature-prompts-2026-11-19.json). These are synthetic landscapes, not photographs of verified locations.

The final 1664×936 WebP assets are in `app/public/focus-scenes/*-generated-v1.webp`: 1,386,360 bytes combined, maximum 209,332 bytes. Generated source PNGs and the inspected contact sheet are retained under ignored `evidence/focus-nature-library-2026-11-19/`. `app/scripts/prepare-nature-wallpapers.py` reproducibly copies and encodes those reviewed outputs while keeping the original generator files intact. Four initially off-brief stills were replaced and archived in ignored `retired-stills`, and their original prompts retained in the prompt JSON.

The catalogue follows the user's four agreed study atmospheres, with exactly three scenes each:

| Atmosphere | Three scenes | Optional pairing using existing licensed recordings |
| --- | --- | --- |
| Morning reading | Morning mist, Misty hills, Bright bay | Meditation Impromptu 01 + gentle water |
| Afternoon study | Sunlit slopes, Open lakeshore, Blue-sky plains | Dream Culture + breeze |
| Rainy focus | Rainy lake, Valley drizzle, Rain-cleared meadow | Rain alone, or Evening Fall (Piano) + rain |
| Evening reading | Pastel sea, Warm lake, Dusk cloud sea | Water Prelude + gentle water |

These 12 scenes are explicitly still images. The existing silent real-footage Ocean waves and Rain on glass videos remain available under Live video, with their existing enable/reduced-motion/visibility/offscreen/retry controls. No simulated zoom is presented as real scene movement and no new video generation was performed.

## Interaction

The existing focus scene dialog now has All/the four study atmospheres/Live video filters, a three-column desktop/two-column narrow-screen grid, lazy thumbnails, selected checkmarks and a sticky selected-scene/action footer. First-time default is Morning mist. Existing saved coast/rain preferences and retired interior preset migration remain intact. The four replaced local scene IDs migrate without losing timing or custom sound preferences. Each atmosphere has an optional Sounds → Play pairing button using the existing licensed music catalogue and ambient controls. Rain alone remains available through Play sound. No music or sound starts on scene selection or new visits. Separate volumes and the existing global playback/error UI remain available. Timers and task linkage are unchanged.

Preview: http://127.0.0.1:4305/aesthetic-timer (native Node verified-build server).

## Verification

- Preview build: 56 routes + 404, noindex, PWA `547d0f81a1a5ca3f`, 76 mandatory public cache resources. Existing videos remain outside mandatory precache; all small still assets enter it.
- HTTP: 62 existing route/resource/metadata/license checks passed. All 14 scene images returned correct WebP MIME and exact source bytes; all 14 configurations survived saved-preset validation.
- Full regression: final 608/608 passed; see `evidence/focus-nature-library-2026-11-19/tests.log`. Added a requirement check for exactly four groups of three stills, valid music-catalogue pairings, and lossless migration from the four superseded local scene IDs. The earlier 607/607 pass predates the user's four-atmosphere correction.
- Individual generated images and final encoded contact sheet were visually inspected. Browser `cua.getState()` timed out after 25 seconds and reset; completion was reported. No alternative browser or OS capture used. Actual dialog filtering/clicks, desktop/mobile screenshots, native fullscreen, real playback and physical audio have not been accepted in-browser for this revision.

No dependency, DB, API, credentials, permission, paid plan, protected Sites adapter or production changes. Earlier unpublished focus work and independent release/community acceptance gates are preserved.
