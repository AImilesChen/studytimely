# StudyTimely audio library — local handoff, 19 November 2026

Implemented locally. Production/package remains V2.34.0. No commit, push or deployment was requested or performed. Preview: http://127.0.0.1:4306/aesthetic-timer → Sounds. Earlier uncommitted focus/nature work is retained.

## Delivered behavior

- All original sound IDs remain supported. Nine former synthetic nature/room textures now use real, self-hosted CC0 field recordings: rain, brook, shore, breeze, forest, fireplace, fan, typing and distant café. All nine retain free access. White/pink/brown remain separate optional generators, off by default; failed recordings never fall back to hiss.
- Music library expands from five to 25 full Kevin MacLeod instrumental recordings under CC BY 4.0. Original five remain free. Twenty additions carry a planned expanded tier, currently fully open in the advanced free preview. There is no payment integration or runtime paywall.
- Shared Music / Nature & spaces / My mixes library in focus space, quick controls and Settings. Music categories, favorites, selected-category playlists, independent volumes, eight-second previews, global Pause all audio, clear credits and on-demand media loading. Favorites/queues respect Remember preferences and the existing explicit appearance/sound sync choice; playback intent/position never restore.
- Focus presets can retain scene, timer, mix and soundtrack. Selection does not play audio; Play saved music & sounds is explicit. No timer/study credit is created by playback or preset changes.
- Generation/abort guards prevent late fetch/decode/play promises from restarting stopped audio; loading can be cancelled. Workspace changes stop ambient playback. Full music playback fades in gently; ambient changes ramp gain.
- Corrected 320px photo-aspect/preset grid overflow found during actual browser checks; no page or dialog horizontal overflow after correction.

## Sources and processing

Source URLs, authors, source/derived hashes, changes and exact bytes live in public ambient/catalog.json and music/catalog.json. Public credits are under /ambient/CREDITS.txt and /music/CREDITS.txt. The original music license PDF and legacy five source files are retained. No external player or real-user data is used.

Acquisition helper: app/scripts/prepare-study-audio.py. It uses cached official metadata/license snapshots and explicitly supported HTTP byte ranges for resumable large downloads. Existing Python numpy/imageio_ffmpeg were used; no app dependency was added. Original files and snapshots stay in ignored evidence, not deployment output.

Natural loops: mono 32kHz/96kbps MP3, up to ~42 seconds, explicit blended loop boundary, high/low-pass and peak control, loudness target -25 LUFS. Wind source is shorter. Music: full recordings, 160kbps MP3, -23 LUFS target; no melodic edits. Nine loop files total 3,979,980 bytes; 25 music files total 175,402,887 bytes, each below the 25MiB static asset limit. They load only on a playback gesture and are excluded from mandatory offline precache.

## Verification and limits

- Final build: 56 pages plus 404, local noindex. PWA 173c7198540428e7, 76 precache resources.
- All 616 tests passed with test concurrency 4. Forty focused audio/preset tests passed after final hook/catalog refinement. A pre-existing concurrent-sync test had a nondeterministic gate: a fast retry could return from the receipt cache before reaching its second-batch gate. The fixture now waits for both initial lookups before writing; no production sync algorithm changed. Earlier hung runs are retained separately in evidence.
- 62 HTTP/metadata/robots/Sitemap checks; 34 audio files checked with HEAD, exact full hashes and initial/suffix ranges; complete public attribution; no mandatory audio precache.
- All 34 recordings decoded silently. All ambient peaks below -3 dBFS; music below -1 dBFS. See signal-checks.json. These are objective signal/file checks, not subjective listening acceptance.
- Actual in-app browser: 1280px desktop, 390px and 320px phone inspection; Music default, 25-track catalog, category/favorite changes and favorite persistence across reload, Nature/Spaces/Noise separation and My mixes; native Escape closes and returns focus to Sounds; warning/error logs empty. Final 320px page width 306 <= 320, dialog scroll/client width both 271.
- New Meditation Impromptu 02 playback was tested after verifying music mute; real brook loading was tested after verifying ambient master 0. Both were stopped immediately afterward, paused/off state observed, temporary viewport reset and agent tab closed. No audio is left playing. Eight-second auto-stop/race handling also has unit coverage.
- Browser screenshots: docs/development/evidence/sound-library-2026-11-19/audio-desktop.jpg and audio-mobile.jpg. Earlier scene/fullscreen/motion/physical multi-device and subjective audio taste remain separate acceptance items; this check does not retroactively verify them.

## Release boundary

Serve matching frontend and Worker together because music IDs and optional preferences are shared validation data. No migration, credentials, OAuth/scopes, paid resources, Stripe, tracking configuration or protected Sites adapter changes were made in this audio work. Existing independent community/moderation/main-promotion gates remain unchanged. User requested implementation, not publication, this turn.


## Approved color refinement, 19 November 2026

The music panel now assigns blue to Piano, lavender to Ambient, apricot to Gentle rhythm, green to Nature, rose to Favorites/My mixes and small gold tags to the expanded free preview. Water recordings use blue, forest/breeze green, fireplace/café warm apricot and typing lavender. Current player tint follows the track; selected rows show a border/tint plus Selected, actual playback shows Playing. Dark and light tokens share the same category roles. Labels, icons and aria states remain available independently of color.

Changed only MusicControls.jsx, SoundLibrary.jsx, AmbientControls markup in StudySpace.jsx and audio-library.css. No audio re-download/re-encode or engine/entitlement change.24 existing regression tests,62HTTP checks and local noindex build pass; PWA a5a5970fef3a2ca4/76. IAB desktop/day/night and320phone verified, sampled text contrast min5.13/6.10, no horizontal overflow, empty captured warning/error logs. Preview was muted and explicitly stopped; temporary viewport reset and test tab closed. Screenshot/contrast/build/test evidence: audio-colors-2026-11-19. See the scoped passed comparison in design-qa.md. Still not deployed.
