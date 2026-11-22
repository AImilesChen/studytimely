# Original wallpaper collection — 22 November 2026

## Scope and research

The user requested popular wallpaper research, original related artwork and website integration for future Plus members. The initial interpretation required both likes and saves above 10,000. The user clarified that 5,000 likes is sufficient and that the search should move backwards in time when recent results are insufficient. Recency is a preference, not an exclusion rule. Do not claim these are the most popular wallpapers globally or that membership demand has been established.

The following rounded counts were directly observed on the signed-in Xiaohongshu wallpaper results on 21 November; the user also supplied screenshots on 22 November. Dates below are exactly what the UI displayed; an omitted year is not inferred. Counts are post likes, not saves or author totals.

| Reference | Displayed date | Likes | Style used as general inspiration |
|---|---|---|---|
| User screenshot: `tree tree tree`, overwater | 10-17 | 77,000 | Upward birch canopy, gold/blue contrast |
| User screenshot: `一棵树就是一场盛大的秋天。`, 穿过花园就到了 | 10-24 | 59,000 | Backlit orange leaves, asymmetric branches |
| [这张照片让我涨粉5万](https://www.xiaohongshu.com/explore/6a4b1f00000000001602432b) | 07-06 | 48,000 | Broad quiet water and a small focal point |
| [在等一个喜欢我照片的人](https://www.xiaohongshu.com/explore/6a5d9fcd000000000f0169ac) | 07-20 | 39,000 | Blue water and layered green shore |
| [视觉中国拒签的理由，却是我喜欢它们的原因](https://www.xiaohongshu.com/explore/6ad6e0890000000027017849) | 10-21 | 34,000 | Clear lake and distant snowy mountains |
| [Pingo 壁纸：治愈插画](https://www.xiaohongshu.com/explore/688c66990000000002000986) | 02-15 | 32,000 | Painted coastal streets and textured colour |
| [人类为何如此迷恋蓝色](https://www.xiaohongshu.com/explore/6a9ea6f2000000001001f24b) | 09-07 | 26,000 | Deep blue water and snow ridge layers |
| [大理是我的自然处方](https://www.xiaohongshu.com/explore/6aa7df3a000000002802c0b0) | 09-15 | 15,000 | Cream reeds, marsh islands and open water |
| [白花景深壁纸](https://www.xiaohongshu.com/explore/6aa7e81e0000000028039dae) | 11-06 | 12,000 | Small white foreground flowers and lake depth |
| [红鲤入网，金光落袋](https://www.xiaohongshu.com/explore/6aead873000000000e0343a5) | **Edited** four days ago | 12,000 | Vermilion, gold and paper texture |

The final reference's detail page was read on 22 November: **4,363 saves**, 1,695 comments. Its recent edit is not its publication date; comments predate that edit. It fails the earlier dual-10,000 criterion but meets the user's revised likes criterion. Saves for the other entries were not verified. Internal browser detail reads subsequently timed out. The public-web checks of Douyin, Bilibili and Reddit did not yield a stronger recent comparable wallpaper sample with verified counts; video plays, author total likes, ordinary photography videos and third-party rounded estimates were not substituted for qualifying wallpaper likes.

Additional cute/plush/animal/train-window images came from user-supplied references, often with likes below 5,000. They establish the user's requested visual direction, not a high-like finding. No branded character, author logo, quote layout, exact landscape or source composition was reproduced. No social-media original file was downloaded or used as an image-edit target.

## Six browsing categories and twelve new originals

| Website category | New scenes | Intended feeling |
|---|---|---|
| Landscapes | Cobalt horizon, Reedwater | Open, quiet distant views |
| Seasons & flowers | Cosmos shore, Golden birches, Amber canopy | Seasonal light and botanical framing |
| Illustrated escapes | Harbor bookshop | A painted place to settle into |
| Study companions | Daisy nap, Curious calves, Blanket capybara, Professor duck | Cute and gently humorous company |
| Cozy spaces | Coastal carriage | A quiet window-seat atmosphere |
| Ink & gold | Golden koi | Warm mineral-pigment and paper texture |

All twelve were generated with the built-in image_gen tool on 22 November 2026. They are still images, not live footage or literal photographs. The picker labels generated landscapes, illustrations, generated animals and felt illustrations accurately. Compositions keep the centre relatively quiet for the timer. Native outputs were inspected, then cropped by only a few pixels to a true 16:9 **1664×936** WebP, with **480×270** public previews. The full collection totals **2,226,382 bytes**. This is not a native 4K collection.

Full prompts are in `wallpaper-prompts-2026-11-22.json`; exact hashes, dimensions, public preview paths and full asset paths are in `wallpaper-assets-2026-11-22.json`. Original PNGs and the contact sheet remain in ignored `evidence/original-wallpapers-2026-11-22/`. The project does not claim exclusive copyright in generated art or commercial reuse rights in the social reference images.

## Integration and access

The shared catalogue now has **26 scenes: 4 free and 22 Plus**, including the existing two live scenes. The original four free scene IDs, default fallback, legacy preset migration, audio behaviour and timers are preserved. The new artwork appears first in All and can be filtered by six subject categories; Live remains a separate format filter. Ambient/music pairings continue to use the existing atmosphere model. Group atmosphere recommendations use the same catalogue and personal access checks.

Every new full image uses the existing server-verified `/library/full/` route and is also guarded at its raw asset path. Public thumbnails remain available without Plus. Full images are excluded from service-worker precaching. On access expiry the user's selection is retained while a free scene is shown. No payment, subscription price, entitlement-writing endpoint or production account grant is created. The current explicitly labelled free library preview remains on until the payment rollout is separately configured.

## Candidate verification

- Release build: 57 prerendered pages plus 404; PWA `5757cf53b28ec979`, 93 resources.
- **798/798 release-mode regression tests passed**, including image/hash/category/preset/access validation. An initial ordinary test invocation against release HTML produced an indexing-mode mismatch; the matching release-mode run passed without weakening that test.
- **63 candidate HTTP checks** passed for routes, canonical/robots/Sitemap and notices.
- **191 real-file access checks** passed across preview/free/synthetic grant/revocation/ranges. Both raw and private expanded media remain covered by the access regression suite.
- Wrangler 4.152.0 dry run passed. No dependencies, migrations, secrets, OAuth, resource bindings, DNS, paid resource or protected adapter files changed. The unrelated FocusGuide.jsx working-copy status is excluded.
- Fresh interactive browser acceptance is not claimed: the in-app browser repeatedly timed out during this task. The image outputs/contact sheet were visually inspected; candidate resources and access behaviour were tested directly.

Production release identifiers and verification will be recorded in the release handoff after deployment. Do not describe this candidate document alone as evidence of publication.
