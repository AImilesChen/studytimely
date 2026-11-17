# StudyTimely room sticker assets — 17 November 2026

Created locally for fixed learning messages. These static assets are self-hosted; sending a message never calls image generation. Existing `app/public/design-assets/awards/gold-trophy-v1.png` is reused for completion and congratulations.

Generator: built-in OpenAI image generation tool, three independent calls, `transparent_background: true`. No competitor artwork or personal reference image supplied. Generated outputs were visually inspected, original alpha preserved. Exported with existing Sharp to 256×256 WebP, quality 90, alpha quality 100, contain fit and transparent padding. No new runtime dependency.

Common prompt (replace `[subject]` with the exact subject below):

> Create a single polished premium 3D chat sticker asset for StudyTimely, a quiet study companion website. Subject: [subject]. Match the visual language of a realistic small gold trophy render: tactile physical object, carefully modeled details, warm studio lighting, restrained highlights, realistic but friendly proportions. Refined editorial 3D, not a flat line icon, not a cartoon mascot. Centered single object, three-quarter view, generous clear margins, composition legible at 80 pixels. Ivory, warm gold, soft teal and subtle coral accents. Genuinely transparent background, no background panel, no black backdrop, no drop shadow outside the object, no white sticker outline, no letters, words, logos, watermark or frame. Output only this individual object, not a sheet or collage.

Subjects:

- study: an open hardcover study book with layered cream pages, a dark teal cloth cover and a thin coral ribbon bookmark, slightly lifted pages suggesting turning a page
- encourage: one anatomically coherent sculpted human hand making a friendly thumbs-up gesture, five fingers total with four fingers curled naturally and the thumb raised, warm peach material, a small elegant golden four-point sparkle beside the thumb
- break: a small elegant ivory ceramic coffee cup on a warm beige saucer, visible coffee inside, two delicate curls of steam, a tiny sage-green leaf beside the saucer

Generated masters remain unchanged in ignored `docs/development/evidence/room-theme-stickers-2026-11-17/masters/`. Source generation IDs: `exec-e9fe3d32-0a16-41e3-92cf-d3799b5fa8f9` (study), `exec-02082a2c-3949-46fd-9e82-b6d80ac87a46` (encourage), `exec-beabab1e-b2bc-4cce-852a-51ee2bf033cc` (break).

| Public file | Bytes | SHA-256 |
|---|---:|---|
| app/public/design-assets/chat-stickers/study-v1.webp | 11422 | 127bddb06e01ebccd90380f82d873d8a2af2b73286ec49285f9dfcf85c7b575d |
| app/public/design-assets/chat-stickers/encourage-v1.webp | 13842 | 4e33028c35f8b8f9685a9e323f42e6bef86075699e2ba8de7bbd9d5c13c4e203 |
| app/public/design-assets/chat-stickers/break-v1.webp | 11236 | 88fafeee73681f693777d3d962d8ce597afbadd219d734175d231a01042a5203 |

Mapping is by the server-resolved fixed message ID only. Arbitrary text does not trigger stickers. Help uses the study book with a question badge. Images are decorative with message text retained for accessibility/fallback. Recent new messages get one subtle 600 ms animation, suppressed during the receiver’s focus and by reduced-motion preference; history is static. No sound, autoplaying video or third-party asset fetch.
