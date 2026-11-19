# Nature motion and fullscreen fixes — 19 November 2026

Local preview: http://127.0.0.1:4301/aesthetic-timer. Production/package remain V2.34.0. This is local development, not a deployment; no commit or push was performed.

## Final scope

The user's final direction supersedes the earlier multi-style and room-compositing proposals. Only two full-frame natural scenes remain selectable: **Ocean waves** (default) and **Rain on glass**. There is no added desk, room, picture frame, library or cafe. All discarded generated candidates and former scenes are archived in ignored evidence and excluded from public output. The user is not asked to choose an exclusive style before using the product.

Scene selection preserves the current timer. Old minimal/cabin/library/cafe presets migrate to coast while retaining their timing, audio, appearance and motion preferences. No local records are deleted or made into synthetic learning time.

## Fullscreen and legibility

The focus scene now provides both Expand view/Back to setup and Enter/Exit fullscreen controls. Native fullscreen changes from the existing header button and browser Esc feed the same scene presentation state. Native exit returns to setup; in-window expansion also keeps the fullscreen entry. Pending native operations are guarded against double clicks, failures retain usable controls, and an unsupported API falls back to expanded view with a notice. Component presentation does not command or reset the canonical timer.

Immersive digits are white with a dark outline/shadow and a soft local radial contrast layer, instead of dark-green text on foliage. The large opaque central timer card is not restored and the entire wallpaper is not darkened for this purpose. Actual rendered contrast, keyboard behaviour and mobile layout remain pending browser acceptance.

## Video implementation

Both scenes use locally served, silent 1600x900 H.264/yuv420p MP4 loops at 24fps, 16 seconds each. They are real moving footage, not simulated rain strokes or a displaced photograph. Source t=2 through t=18 is blended with t=0 through t=2 over the final two seconds for a continuous loop. Native loop playback is muted and plays inline; ambience remains in the existing independent sound engine. The videos have no audio track.

Video is loaded only for an eligible active scene. Explicit motion-off, app/OS reduced motion, hidden document and offscreen gates pause it; rejected playback/decoding reports unavailable with a retry action. A matching cached still poster remains available. Cleanup removes listeners and unloads the video. Playback state is reported from the player instead of merely echoing the checkbox.

Versioned video files are excluded from mandatory service-worker precaching. Poster images remain in the offline shell. Video bytes enter the release fingerprint. The existing streaming MP3 byte-range responder now accepts an optional content type (unchanged audio default) and also serves just the two known scene MP4s, including 206/suffix/416/HEAD behaviour. Local preview includes video MIME types. No external media host is requested by users at runtime.

## Media provenance and generation

Final footage uses the Pexels License, reviewed on 19 November 2026. The official license expressly allows website/app use and modification. This focus tool uses edited footage alongside its timer and study features, rather than redistributing a stock-footage collection.

- Rainy Day — Roberto Lee Cortes: https://www.pexels.com/video/rainy-day-26857124/
- Sea Waves on Beach — Dmitry Marchenkov: https://www.pexels.com/video/sea-waves-on-beach-14064348/
- License: https://www.pexels.com/license/

Public credits are in app/public/focus-scenes/CREDITS.txt. Sources were trimmed to 18 seconds, colour-adjusted and edited into loops by app/scripts/render-focus-scenes.py. Retained trim/source metadata, per-second decoded contact sheets and final frame-difference inspection are in ignored evidence. Exact original download URLs are the official download redirects with the public download query parameter; no private media URLs or credentials are used.

Built-in image_gen was used for proposed room/desk/space wallpapers during this revision. The user rejected those directions; none of those generated images is referenced by the final app. Original PNGs and the exact prompt sets are preserved in ignored evidence/rejected-generation-prompts.json and the corresponding candidate files. No paid video generation, plan upgrade or credit purchase was performed. The video-tool availability check showed a plan gate; final videos use licensed existing footage.

## Verification

607 tests passed, 0 failed. The final preview build rendered 56 pages plus 404 with noindex. PWA fingerprint is 6ed87a22e0b4b7d9 with 64 mandatory resources. All 62 HTTP route/asset checks passed, as did two poster requests and six video HEAD/byte-range requests. Fullscreen controller tests cover repeated cycles, header/native Esc state, unavailable API, failed exit and double-click/disposal. Video tests cover silent lazy loading, hidden/offscreen/reduced-motion, late play completion, autoplay/decode failures and retired-preset compatibility. Existing music range/type tests also pass. Git diff whitespace check passed.

Video contact sheets at one-second intervals and decoded frames were inspected. Measured frame differences confirm that both clips change over time; this is media evidence, not proof of playback in the app. Original material, versioned derivatives and inspection outputs are kept separate.

Actual browser acceptance remains blocked. In-app getTab timed out/reset; no alternate browser or OS capture was used. open_in_codex queued the local preview and does not prove rendering. No after UI screenshot, actual mobile/zoom layout, physical repeated fullscreen/Esc, audio/download, visible browser playback or full accessibility pass is claimed. Inspect 1440px and 390/320px, both appearances, long timers/task titles, native fullscreen return/re-entry, dialogs/focus, playback failure/retry and reduced/background behaviour before marking visual QA passed.

No backend account/community API, database migration, dependency, payment, AI runtime, permission, secret, tracking, protected adapter or production resource was changed. The local static-asset responder changes support these video files; existing release and independent authenticated community/moderation gates remain.

## Final shipped assets

- `app/public/focus-scenes/coast-nature-v1.mp4` — 5178706 bytes; SHA-256 `bff8c01e5432a4265be4f28a9877349a769f3182ef52edc5c6b3ce1f5ef330ed`.
- `app/public/focus-scenes/coast-nature-v1.webp` — 217106 bytes; SHA-256 `9df33b5d3a8142079b63521091f6cbf24bd75f9be498a5f4592abf170ac1ddc5`.
- `app/public/focus-scenes/CREDITS.txt` — 548 bytes; SHA-256 `bc763546c0fceb10b7c52147d158c0407681169bd7bc942a1bf44e2def357c57`.
- `app/public/focus-scenes/rain-nature-v1.mp4` — 1173734 bytes; SHA-256 `749b703e0e340fd1ed74159e1921226615981cceb9095d8fdcae8dae4a7f0569`.
- `app/public/focus-scenes/rain-nature-v1.webp` — 27358 bytes; SHA-256 `7e6f75dc9a262bd0566ff50abe9503297afa7e1e764d349be19ef19c6f83352b`.
