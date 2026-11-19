# Daylight focus space — 19 November 2026

Local preview: http://127.0.0.1:4301/aesthetic-timer. This revision supersedes the earlier photographic-scene and sidebar presentation. Production and package remain V2.34.0. No commit, push or deployment was performed.

## Layout and behaviour

Normal mode puts the single canonical timer in the right light session panel, leaving the scene unobstructed. Immersive mode moves that same timer presentation into the scene without the large opaque rectangular card. Task, start/pause/finish, feedback, notes, presets and sound handlers are retained. Automated component checks confirm one timer and no timer card in the normal scene.

The focus space defaults to a warm-white day appearance with charcoal-green text, calm teal actions and pale mint selection. Its Day/Night setting is device-local and follows focus presets; the global saved theme is preserved. Old presets migrate to day appearance. The route header theme button controls the focus appearance on this route. Responsive rules stack the photo above the controls and keep compact labelled scene tools on narrow screens. Actual layout requires browser acceptance.

## New original wallpapers

Six new photographic-style scenes were generated with the built-in image_gen tool, inspected individually, and encoded to WebP at quality 87 without cropping or compositing. They are generated scenes, not verified real locations. No competitor or stock image is redistributed. All are 1672 × 941. Default is Morning garden; alternatives are Rainy garden, airy library, courtyard cafe, Lakeside retreat and coast. Previous public photos were archived into ignored local evidence and replaced. Stable scene IDs preserve existing preset compatibility.

- `app/public/focus-scenes/minimal-daylight.webp` — 323308 bytes; SHA-256 `11648197367a310fdcbdefd330637b1f9489f21b3af8ed2960022bf792f7e869`.
- `app/public/focus-scenes/rain-daylight.webp` — 332998 bytes; SHA-256 `fb9275a5cb28ba50ed3433875c8011e1adb59db7146f69398fe4ddace04a2f70`.
- `app/public/focus-scenes/library-daylight.webp` — 284484 bytes; SHA-256 `deff174f17f20e5287a25f1426100c60040a5c923eedf06b502d913a71c10ebb`.
- `app/public/focus-scenes/cafe-daylight.webp` — 315670 bytes; SHA-256 `1a20a5dbe13a036f5ed0ae33f485a66d88c5f22dfd4409cf843e331222f890ac`.
- `app/public/focus-scenes/cabin-daylight.webp` — 262738 bytes; SHA-256 `8cecb9b9616ea89c3d707060e2bae8e3204f27c442a58af1bf2493eabe7df862`.
- `app/public/focus-scenes/coast-daylight.webp` — 226830 bytes; SHA-256 `a094020d5c3e2729ce8358e3fa648e97b7f9d3d37e96c74e1c2762245aee6f89`.

Total public wallpaper bytes: 1746028.

Rain and cafe masks and coastal water displacement were relocated for these images. Motion remains a local effect over still images, not recorded video. Explicit off, app/OS reduced-motion, hidden/background/offscreen and cancellation protections remain. Motion never controls study credit, timers or audio.

## Verification and limits

594 tests passed, 0 failed. Preview build rendered 56 pages plus 404 with noindex; PWA fingerprint 1a0e7aba2182798c with 68 precache resources. All 62 HTTP route/resource checks and all six new WebP requests passed. Git diff whitespace check passed. Logs and implementation manifest remain in ignored focus-space evidence.

Visual acceptance remains blocked: the in-app browser inventory call timed out/reset. No after UI screenshot, actual desktop/mobile geometry, physical keyboard/focus, audio/download or visible motion acceptance is claimed. No alternate browser or OS screenshot was used. Before release, inspect 1440px and 390/320px, day/night, long tasks/hour timers, immersive enter/exit, scene cover crops, rain/sea masks, reduced motion, dialogs and console.

No dependency, backend/database/schema, account permissions, subscription, AI runtime, tracking, protected adapter or production resource change was made. Existing release and independent community/moderation gates remain.

## Exact generation prompts

Original PNGs, machine-readable prompt records and prior photos remain in ignored evidence. The following prompts document the generated assets delivered above.

### minimal

Use case: photorealistic-natural. Create ONE beautiful high-end photographic wallpaper for a calming study app, wide landscape 16:9. Bright, airy, fresh and restorative, with real natural light and authentic textures. Balanced natural colours: soft green, pale sky blue, warm ivory. Excellent editorial/travel photography with believable scale, sophisticated composition, fine detail and gentle highlights. The image must feel uplifting and spacious, not dark, gloomy, cluttered, heavily brown/orange, over-staged or artificially glossy. NO people, screens, UI, text, logos, watermarks, collage, illustration, anime or 3D-render style. No repeated desk-notebook-cup arrangement. A serene light-filled Mediterranean-style reading retreat opening onto a sunlit garden and a small reflecting pool. Large open window, softly sunlit white linen curtain only at one edge, warm ivory plaster, a quiet patch of sage-green foliage outside and soft blue sky. A simple pale stone window ledge at the lower edge, no desk in front. Elegant natural architectural photograph, mostly the beautiful luminous garden and light, soft morning atmosphere.

### rain

Use case: photorealistic-natural. Create ONE beautiful high-end photographic wallpaper for a calming study app, wide landscape 16:9. Bright, airy, fresh and restorative, with real natural light and authentic textures. Balanced natural colours: soft green, pale sky blue, warm ivory. Excellent editorial/travel photography with believable scale, sophisticated composition, fine detail and gentle highlights. The image must feel uplifting and spacious, not dark, gloomy, cluttered, heavily brown/orange, over-staged or artificially glossy. NO people, screens, UI, text, logos, watermarks, collage, illustration, anime or 3D-render style. No repeated desk-notebook-cup arrangement. Fresh green garden seen closely through a large clear window during gentle spring rain in bright overcast daylight. Beautiful living leaves and pale pink hydrangeas outdoors, delicate water droplets on the glass, soft luminous grey-white sky, an ivory window edge at the far side. Peaceful, clean and fresh, not night, not a city skyline. Garden and rainy glass fill most of the photograph; NO desk, candle, lamp or brown wooden interior.

### library

Use case: photorealistic-natural. Create ONE beautiful high-end photographic wallpaper for a calming study app, wide landscape 16:9. Bright, airy, fresh and restorative, with real natural light and authentic textures. Balanced natural colours: soft green, pale sky blue, warm ivory. Excellent editorial/travel photography with believable scale, sophisticated composition, fine detail and gentle highlights. The image must feel uplifting and spacious, not dark, gloomy, cluttered, heavily brown/orange, over-staged or artificially glossy. NO people, screens, UI, text, logos, watermarks, collage, illustration, anime or 3D-render style. No repeated desk-notebook-cup arrangement. A beautiful bright contemporary library reading room, pale ash wood shelves only along the side, soaring large windows opening toward a green courtyard, a few elegant comfortable ivory reading chairs, soft daylight across a clean light oak floor. Airy architectural photography, inviting and quiet, gentle cream and sage palette, not a dark old library, no foreground desk, no clutter or visible people.

### cafe

Use case: photorealistic-natural. Create ONE beautiful high-end photographic wallpaper for a calming study app, wide landscape 16:9. Bright, airy, fresh and restorative, with real natural light and authentic textures. Balanced natural colours: soft green, pale sky blue, warm ivory. Excellent editorial/travel photography with believable scale, sophisticated composition, fine detail and gentle highlights. The image must feel uplifting and spacious, not dark, gloomy, cluttered, heavily brown/orange, over-staged or artificially glossy. NO people, screens, UI, text, logos, watermarks, collage, illustration, anime or 3D-render style. No repeated desk-notebook-cup arrangement. A luminous quiet Japanese courtyard cafe on a gently rainy spring morning. Large glass window on the left two thirds overlooking fresh green bamboo and delicate rain, warm off-white walls and pale timber furnishings on the right, one empty cream chair at the edge, clean surfaces and natural soft daylight. Elegant calming interior photography, no dark bar, no staged coffee-and-notebook foreground, no neon signs.

### cabin

Use case: photorealistic-natural. Create ONE beautiful high-end photographic wallpaper for a calming study app, wide landscape 16:9. Bright, airy, fresh and restorative, with real natural light and authentic textures. Balanced natural colours: soft green, pale sky blue, warm ivory. Excellent editorial/travel photography with believable scale, sophisticated composition, fine detail and gentle highlights. The image must feel uplifting and spacious, not dark, gloomy, cluttered, heavily brown/orange, over-staged or artificially glossy. NO people, screens, UI, text, logos, watermarks, collage, illustration, anime or 3D-render style. No repeated desk-notebook-cup arrangement. View outward through the wide open window of a refined pale-wood lakeside retreat, tranquil soft turquoise lake and layered green mountains under a luminous morning sky, a few slender pine branches at the edges. Only a slim pale timber window frame and ivory linen curtain at the extreme right; the natural view fills almost all the frame. Peaceful realistic landscape photography with airy depth and clear light, not dense dark forest, no desk, no fire, no notebooks.

### coast

Use case: photorealistic-natural. Create ONE beautiful high-end photographic wallpaper for a calming study app, wide landscape 16:9. Bright, airy, fresh and restorative, with real natural light and authentic textures. Balanced natural colours: soft green, pale sky blue, warm ivory. Excellent editorial/travel photography with believable scale, sophisticated composition, fine detail and gentle highlights. The image must feel uplifting and spacious, not dark, gloomy, cluttered, heavily brown/orange, over-staged or artificially glossy. NO people, screens, UI, text, logos, watermarks, collage, illustration, anime or 3D-render style. No repeated desk-notebook-cup arrangement. A pristine quiet Mediterranean sandy cove in soft morning daylight, transparent pale turquoise water, subtle white ripples approaching an ivory sand beach, a distant low headland with fresh green vegetation and a soft luminous blue sky. No buildings, furniture, windows, desk or people. Open spacious beautiful seascape with horizon at upper third and water clearly filling the middle and lower thirds. Calm, natural, healing travel photography, no harsh saturation or dramatic sunset.
