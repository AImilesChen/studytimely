# Photographic focus scenes and session panel — 19 November 2026

Local preview: http://127.0.0.1:4301/aesthetic-timer. This revision supersedes the SVG illustrations and original sidebar styling in the preceding focus-space handoff. No publication, package bump, commit or remote resource change was performed.

## Scene assets

Six original photographic-style images were generated with the **built-in image_gen tool**, then copied into this workspace and encoded as WebP at quality87 without cropping or compositing. They are generated scenes, not photographs of verified real locations. All six 1672×941 results were visually inspected as images. No external stock, competitor assets, UI or named people were used. Source PNGs and superseded SVGs remain in ignored evidence for provenance. Public app assets are the six WebP files below, about1.45MB total; image bytes enter the existing public offline-shell fingerprint. Old illustration files are no longer referenced or distributed.

- `app/public/focus-scenes/rain.webp` — 208946 bytes; SHA-256 `0ba596f5e0cde4c148ef78da1dfc3e77397a688511a00514849e63c3be84f170`.
- `app/public/focus-scenes/library.webp` — 279584 bytes; SHA-256 `18b710ef6ec4b1451f61ec70981a4260e5ec8359f62381e53c993643acf2559f`.
- `app/public/focus-scenes/cafe.webp` — 330256 bytes; SHA-256 `52013618022a33b64dc28423fb41044342aecd2700a2d8feddf6456d8d7d7011`.
- `app/public/focus-scenes/cabin.webp` — 295846 bytes; SHA-256 `b5b5b9bb9c15464bff71e16c94f8fa3a13f86268934560be016286053dd5f08e`.
- `app/public/focus-scenes/coast.webp` — 178712 bytes; SHA-256 `f9df66f02c9fc8258fa97b1e590f793e30f58d4e81553f7cd58b1a52d1f62c52`.
- `app/public/focus-scenes/minimal.webp` — 160170 bytes; SHA-256 `666130cbf765a94952cff337ae0f6ccfdf8057f9da12f1f3e7f50612be73859b`.

## Session panel

A quieter neutral-green panel replaces the hard blue-grey outline and repeated separator lines. A compact header, task/timing groups, one scene-and-sound card, native toggle controls, collapsed options/preset entries and a one-line device note create distinct roles. All canonical timer, task, sound, preset, note and feedback handlers remain. Light and dark palettes, responsive spacing and explicit selected-state ticks are defined; actual browser geometry remains unverified.

## Gentle scene motion

Rainy night and café use clipped procedural rain. The coast uses small water-only image displacement and soft highlights inside the scene’s photographed window region. They are local effects over photographic stills, not prerecorded video. A visible Gentle scene motion control is part of the device preset, with backward-compatible defaults for earlier presets. Static scenes clearly show Still scene.

A cancellable animation loop limits drawing to20fps and device pixel ratio1.5. Explicit disable, app/OS reduced motion, document hiding and off-screen IntersectionObserver state stop animation and clear the overlay; unsupported Canvas or image errors keep the static background. Resize/cover mapping maintains masks on narrow/tall displays. Motion never commands the timer, produces study minutes, requests camera access or plays sound. Old preset migration and timer-patch equality are tested.

## Checks and limits

Final build56routes+404/previewnoindex/68precache;593 full tests and62 HTTP checks passed, plus correct200/type for six photographic assets. Focused18 model/render/asset/motion checks include reduced/background/offscreen gating, deterministic particles, cover mapping, frame throttling/cancellation and old-preset compatibility. This is logical/rendered-component verification, not observed browser motion or a performance benchmark.

The in-app browser getTab request timed out/reset; no screenshot/mobile geometry/native clicks/audio/download or actual animated-frame acceptance is claimed. No other browser or OS capture was used. design-qa.md remains blocked for actual UI verification. Source/evidence: ignored focus-space-2026-11-19 photo-panel logs and photographic manifest. All original timer/accounting/storage/backend/paid-plan and independent production acceptance gates remain.

## Generation prompt set

Rainy night:

> Use case: photorealistic-natural. Create a premium photorealistic landscape environmental photograph, wide16:9 composition, for a calm study-focus website background. A real cozy wooden study desk beside a large rain-streaked window at blue hour, warm amber reading lamp glowing on the left, an open blank notebook, a ceramic tea cup, a small living plant, distant softly defocused city lights behind wet glass. Healing, deeply peaceful, quietly lived-in, tactile wood and linen textures, realistic natural lighting, subtle film grain and soft highlights, muted midnight blue with warm cream light. Real architectural/lifestyle photograph, not illustration, anime, painting, stylized3D or game graphics. Middle third relatively quiet for a timer card; details around edges, enough detail to crop for portrait view. No people, readable text, logos, watermarks, interface, timer or numbers. Single finished photograph, not a collage.

Other five prompts:

**library**

> Use case: photorealistic-natural. A single premium real-looking architectural/environmental photograph for a calm study website background. Wide landscape 16:9 composition. Healing, cozy, quiet and believable; natural light, tactile materials, subtle photographic grain, realistic depth. Keep the middle third relatively calm for a timer overlay, interesting detail around edges, suited to portrait crop. No people, readable text, logos, watermarks, interface, timer, illustration, anime, drawing, 3D rendering, or collage. An inviting real quiet library reading nook, tall oak bookshelves on either side, beautiful arched window looking onto a green garden, one empty wooden reading table with a blank open book and ceramic cup, afternoon sunlight and soft shadows, warm honey oak and muted sage hues, cozy and refined rather than grandiose.

**cafe**

> Use case: photorealistic-natural. A single premium real-looking architectural/environmental photograph for a calm study website background. Wide landscape 16:9 composition. Healing, cozy, quiet and believable; natural light, tactile materials, subtle photographic grain, realistic depth. Keep the middle third relatively calm for a timer overlay, interesting detail around edges, suited to portrait crop. No people, readable text, logos, watermarks, interface, timer, illustration, anime, drawing, 3D rendering, or collage. A serene real corner cafe by a large window on a gently rainy morning, an empty comfortable seat at a natural wooden table, ceramic cappuccino and notebook near the edge, warm pendant lights, a few plants, softly defocused old street outside, soothing cream, caramel and sage colors. Intimate editorial interior photography, no people.

**cabin**

> Use case: photorealistic-natural. A single premium real-looking architectural/environmental photograph for a calm study website background. Wide landscape 16:9 composition. Healing, cozy, quiet and believable; natural light, tactile materials, subtle photographic grain, realistic depth. Keep the middle third relatively calm for a timer overlay, interesting detail around edges, suited to portrait crop. No people, readable text, logos, watermarks, interface, timer, illustration, anime, drawing, 3D rendering, or collage. View from inside a real quiet Scandinavian forest cabin, enormous clear window facing a lush misty green woodland, a warm wooden desk and closed notebook along the lower edge, soft linen, a small lit wood stove off to the side, early morning diffuse light, peaceful authentic interior, deep fresh greens and warm pale wood.

**coast**

> Use case: photorealistic-natural. A single premium real-looking architectural/environmental photograph for a calm study website background. Wide landscape 16:9 composition. Healing, cozy, quiet and believable; natural light, tactile materials, subtle photographic grain, realistic depth. Keep the middle third relatively calm for a timer overlay, interesting detail around edges, suited to portrait crop. No people, readable text, logos, watermarks, interface, timer, illustration, anime, drawing, 3D rendering, or collage. A serene real coastal retreat, an empty simple pale wood writing desk by a large open window looking out over a calm turquoise ocean and soft sandy beach, sheer cream curtain at one side, a ceramic tea cup near the edge, gentle early morning sun, natural textures, airy and restorative. Architectural editorial photo, no people.

**minimal**

> Use case: photorealistic-natural. A single premium real-looking architectural/environmental photograph for a calm study website background. Wide landscape 16:9 composition. Healing, cozy, quiet and believable; natural light, tactile materials, subtle photographic grain, realistic depth. Keep the middle third relatively calm for a timer overlay, interesting detail around edges, suited to portrait crop. No people, readable text, logos, watermarks, interface, timer, illustration, anime, drawing, 3D rendering, or collage. A real peaceful minimalist home study corner in soft morning sunlight, pale oak desk beside a large window, gently moving-looking linen curtain but a still photo, matte ceramic cup, small plant, blank notebook, delicate leaf shadows on warm white plaster, muted sand, cream and soft sage palette. Clean and calming yet warmly lived in, editorial photography, no people.
