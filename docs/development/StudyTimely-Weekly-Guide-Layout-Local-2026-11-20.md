# Weekly report guidance layout — local, 20 November 2026

Implemented the user-approved practical-visual-design plan for the crowded weekly-report explanation. Local only, uncommitted and not pushed/deployed. Production/package remain V2.43.0. Preserve the unrelated pre-existing FocusGuide.jsx working-tree status.

## Result

- Three equal tutorial columns become three ordered horizontal rows: a short action caption and two instructions on the left, corresponding screenshot details on the right. Desktop tracks are36:64 with40px gap and common top edges; smaller screens stack them in reading order.
- Four metric definitions move to a semantic, separate definition list: four columns on desktop, two on medium widths and one on phones. The two-people/five-days example is a small supporting strip.
- The three questions become vertical question/answer rows, with short conclusions before supporting rules. The large lavender FAQ container is removed. All content remains directly expanded.
- Room instructions omit six supplementary paragraphs; the public guide retains those full step/rule explanations. Both keep the key time source, UTC, unique-member, CSV privacy, unavailable/zero and access meanings. Existing public guide and room navigation links remain.
- Section title24px, step titles20px, body16px/1.7, secondary paths13px; metric/FAQ sections separated by48px. Existing typography, themes, menus and chart palette remain. Actions and tools still precede teaching.

Only WeeklyReportGuide.jsx and weekly-report-guide.css change runtime code. No backend, timer, report calculation, CSV export implementation, permission, schema, dependency, metadata/indexing or protected adapter changes.

## Genuine screenshot sources

Two new JPEGs are unmodified native local-IAB viewport captures, both785×889 in the same light theme: weekly-guide-select.jpg is the actual synthetic saved43-second report; weekly-guide-trend.jpg is the explicitly illustrative weekly example. No data was seeded, changed or credited for these captures. The guide labels the figures as examples.

The three tutorial steps reuse these sources through CSS focus windows. Step1 shows the real report header/date controls. Step2 shows real metrics/chart/review. Step3 displays two details from the same saved-report capture: its actual CSV button and daily table. These are screenshot excerpts, not a redesigned or fabricated report. Original JPEG pixels stay unchanged; CSS crops remove irrelevant page areas and the captured browser scrollbar. Phone date/CSV focus windows enlarge the relevant controls. The image dialogs reuse the existing Dialog and expose the full explanatory copy; they do not start or export anything.

## Verification

-26 existing related unit/SSR/API/UI tests passed after the content/component changes. Final subsequent CSS-only crop/title refinements were checked in the browser and final HTTP/build; the full701-test release suite was not rerun for this low-impact layout pass.
- Final local build56pages+404, noindex, PWA11b6e03958c0afcf/76.62HTTP route/asset/robots/Sitemap/license checks passed after the final build. Both new images returned200 and exact source bytes. Definitions, visible answers and the member-count example occur in the initial public HTML.
- Actual IAB checked light desktop1280, dark/tablet800 and phone320. Observed document widths1265/785/305 respectively. Desktop guide tracks approximately418/743px; medium glossary has two columns, phone glossary and answers one column. Body16px, title24px; public title24px confirmed after resolving its inherited heading override. No duplicate IDs or weekly-guide disclosures.
- Room extra-note count0 and public extra-note count6 verified. Public images loaded, native enlarge/Close worked; room enlarge/Escape returned focus to its exact trigger. Phone dialog288px fits the305px document. Final room warning/error logs empty. No timer, audio, booking, result, message, preview grant or production record write initiated.
- Temporary viewport overrides reset; an intermediate test tab stayed at its previous800px width despite resize requests, so evidence uses its observed dimensions rather than intended sizes. That tab was closed. A fresh visible default1280px preview was retained in light Weekly reports mode, with the explanation heading at about50px from the viewport top. Public temporary tab closed.

## Visual review and evidence

The user-supplied1548×846 screenshot (codex-clipboard-8671cba4-edfd-4804-bb1b-3486f5d0bfba.png), final07-final-desktop-steps.jpg and08-final-metrics-and-answers.jpg1280×720 were opened together in one comparison input. This is an intentional information-layout change, not pixel-identical cloning. Reading order, hierarchy, short copy, aligned image/caption edges and visible questions were reviewed. No remaining scoped P0/P1/P2 issue found; no full accessibility or production acceptance claim.

Iterations fixed an inherited public20px section title, removed source-scrollbar edges from screenshot excerpts and adjusted phone focus windows. Early screenshots01/02 document intermediate layout; final desktop07/08 are the current layout.03 is actual dark800px glossary/FAQ, not1280;04/05 show320px dialog and vertical steps.06 is the public body before the final title-size-only correction; the final24px public title was separately measured. Native screenshots can lag an immediately preceding click, so the stale modal capture was rejected and recaptured after DOM confirmed closure and image loading.

Ignored evidence: docs/development/evidence/weekly-guide-layout-2026-11-20/. Existing independent planner/community/moderation/main and production-release gates remain unchanged.

Local entry: http://127.0.0.1:4308/__test/group-preview → free owner → Group progress → Weekly reports. The retained preview is already at the revised explanation. This fixture uses synthetic accounts; never deploy it. No publication is included in this request.

## Next-action cards follow-up — 20 November 2026

Addressed the supplied dark-theme screenshot in the “Turn your review into a next step” section. The three existing actions now have distinct coral, gold and lavender surfaces, accent edges, filled icon badges and full-width 46px-high filled buttons. Explicit heading margins remove inherited empty space. Each card includes a short explanation of its destination. Existing callbacks, conditional action availability and owner-only planning remain unchanged; no timer, permission, API or export implementation changed.

Final local build: 56 pages plus 404, preview noindex, PWA 9ab565401d2e71e6 with 76 resources. All 21 related content/room UI tests and 62 HTTP checks passed. Full release suite not repeated for this scoped presentation change. Normal and hover button text contrast is at least 7.32:1; checked description contrast is at least 6.67:1.

Actual IAB checks covered dark/light desktop, 320px phone, native Tab focus, all three destinations, and cancelling the existing booking dialog. Study navigation did not start a timer. Phone document width305px, cards273px and buttons231×46px, with no page overflow. Warning/error logs were empty. Theme restored to light, viewport override reset and default1280px preview retained. No booking, result, grant, timer or production record was saved.

The supplied screenshot and actual 01-actions-dark.jpg were opened together for scoped comparison. Evidence: ignored docs/development/evidence/weekly-next-actions-2026-11-20/ contains dark/light/phone native captures, build/tests/HTTP logs and contrast.json. This is a hierarchy and contrast improvement, not a pixel clone or full accessibility audit. Local only, uncommitted/unpushed/undeployed; production/package remain V2.43.0. Existing independent release gates remain unchanged.

## Playful emoji follow-up — 20 November 2026

User requested fewer generic outline/AI-looking icons and allowed cute emoji or humorous images. Replaced only the three decorative action symbols with native colour emoji: 🤓 for studying, 🐧 for gathering partners, 🥳 for recording an outcome. Removed the square badge background; consistent44px boxes/36px emoji maintain alignment. Decorative spans are aria-hidden and titles/buttons retain the actual action meaning. No image download/generation/dependency or callback/permission change. Arrow and zoom functional symbols elsewhere stay unchanged.

Build passed:56pages+404, local noindex, PWA7178259fd755b723/76.21existing related tests passed. Native IAB dark desktop visibly shows all three emoji, aligned headings and filled buttons; light theme DOM checked and original light theme restored. No horizontal overflow at actual1265px document width. Existing21/62 previous checks are historical; no new62HTTP or phone check claimed for this emoji-only pass. Source screenshot and native04-actions-emoji-dark.jpg compared together. Existing action navigation verification remains from the preceding pass; no timer/data writes. Evidence emoji-build.log,emoji-tests.log,04-actions-emoji-dark.jpg under weekly-next-actions-2026-11-20/. Preference recorded prominently in AGENTS.md. Local only, productionV2.43.0 unchanged.
