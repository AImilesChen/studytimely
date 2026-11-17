# Study cat stickers — local refinement, 17 November 2026

The user requested younger, more expressive chat stickers after reviewing the first object-based version. This revision replaces the chat art with five poses of one original cream kitten in a mint hoodie: studying, cheering, celebrating, taking a break and asking for help. Existing awards elsewhere in the application keep their established assets.

Implemented locally, not committed, pushed or deployed. Production remains V2.28.1. Earlier pending custom-theme work is preserved. No new backend, schema, permission, payment, analytics, dependency or production changes in this refinement. A later combined release still needs the prior additive 0010 migration and matching Worker/frontend; review activation remains separate.

Preview: http://127.0.0.1:4300/__test/group-preview . Choose the host identity to enter the existing private synthetic room. This localhost-only preview uses no real Google account or external moderation provider calls.

## Art and provenance

Used the built-in image_gen tool, transparent_background true. The study pose was generated first; its original output was the character/style reference for four separate generation calls. No third-party artwork was downloaded or incorporated. Messenger sticker expression/pose conventions were considered using this author’s study-sticker presentation: https://note.com/fast_human6004/n/nc6146279d12f . This is design inspiration only; the delivered kitten is newly generated.

Complete exact prompts and built-in settings: [StudyTimely-Study-Cat-Prompts-2026-11-17.json](StudyTimely-Study-Cat-Prompts-2026-11-17.json).

Saved asset directory: `G:/Website Project/StudyTimely/release-repository/app/public/design-assets/chat-stickers/`. Original PNG masters remain unchanged in ignored evidence; final files below are project-bound transparent 256×256 WebPs, exported using existing Sharp with contain fit, quality90 and alphaQuality100. Older sibling assets are retained. No runtime image generation.

| Pose | File | Bytes | SHA-256 |
|---|---|---:|---|
| study | app/public/design-assets/chat-stickers/study-cat-v2.webp | 22624 | 1114dee940003d35ace543d2ce9665ce2fd90f50d18bd6da2df4f71c5d6389d2 |
| encourage | app/public/design-assets/chat-stickers/encourage-cat-v2.webp | 24456 | 50107a531cd49f0f9d96126874cbdba1a3f8ddcc2685bfdd8845ad9ae0b3be7a |
| complete | app/public/design-assets/chat-stickers/complete-cat-v2.webp | 25230 | 990f1ac91b97661556a4666b0a25a4c83c4c73bd32d02df4a92ad5b33b0fc6d7 |
| break | app/public/design-assets/chat-stickers/break-cat-v2.webp | 22410 | 3014e8859385f331828feafde4f0a04850e979227b6397031104433f95afcf7f |
| help | app/public/design-assets/chat-stickers/help-cat-v2.webp | 21078 | fd1d2858636fb49cc6db776bde0cd4e3a2eb876d39d6414c3deb1a8474e6b086 |

## Interaction

Fixed message IDs select artwork. Arbitrary messages never acquire a sticker by keyword matching. Click or keyboard-activate a message sticker to replay its short silent motion on this device: study wobble, encouragement sway, celebration jump, relaxed break sway or puzzled head tilt, with three restrained particle accents. This uses a static illustrated pose plus CSS motion; it is not a frame-animated GIF or a generated video. Replaying does not send a message, call AI, alter another member’s state or change credit.

New recent messages animate once, then stop. Existing history is static until explicitly played. Replays and automatic movement are suppressed during the recipient’s own study timer and by Reduce motion. CSS also honours the system reduced-motion preference. Replay buttons have an accessible name, keyboard activation and visible focus. Decorative images retain the fixed message text. Compact thumbnails remain inside the existing send buttons, without nested buttons. The recent area’s cap rises from380px to420px so three desktop sticker rows fit without clipping; phones size the stickers to72px.

## Actual verification

- Final preview build: 56 routes +404, noindex, PWA e7902bb3a12fb8d9 /62 resources.
- Existing affected checks:13 room-theme tests and18 site/companion tests passed (31 total). The previous375-test full run predates this art refinement and is not claimed as a fresh full run here. No new tests mirroring cosmetic CSS were added.
- Final62 route/asset/robots/Sitemap/licence checks passed; five new WebP responses additionally matched exact hashes and image/webp MIME. No GSC/Bing/GA4 configuration or result claims.
- Actual in-app browser: all five assets loaded, click replay + Enter replay, automatic arrival of a new help message, one animation iteration and cleanup after completion, no replay on refresh, application Reduce motion hides replay controls and keeps a newly received fixed message still. Restoring the setting returned keyboard playback. System preference CSS exists but was not separately emulated.
- Actual start/pause of the synthetic host room timer confirmed that focus removes recent replay controls and stops current motion. Only one real connected second was recorded in the isolated fixture, then the timer was paused and presence restored to ready; no fake learning time or production data was added.
- Desktop1440 light/dark and390/320 phone layouts had no horizontal overflow; sticker width88/72px. Final recent area measured409px client/409px scroll on desktop and367px/367px at320px, so all three rows fit. App warning/error logs read empty. Viewport reset successfully and tab27 marked deliverable.
- The browser’s checkbox helper briefly reported an unchecked-state failure; a fresh DOM read showed Reduce motion unchecked and data-motion=full, and keyboard replay then worked. Control+Home input also timed out once; browser scroll operations recovered. Neither is reported as an application failure.
- Final screenshots were saved and visually inspected: room-light-1440.jpg, room-dark-1440.jpg, room-390.jpg and room-320.jpg in the ignored evidence directory. The final light/320 screenshots use the420px cap; dark/390 were captured before that small cap adjustment.

No new real moderation/inference calls, production release, public repository sync, real two-person production acceptance or full accessibility audit occurred. Existing production-community/main-promotion gates remain pending.
