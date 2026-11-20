# Weekly report — local implementation, 20 November 2026

Implemented the user-selected graphite report direction with clearly different weekday bars. This is a local, uncommitted follow-up; package and production remain V2.42.0. No deployment, push, schema migration or entitlement change was performed.

## Design and behaviour

- Neutral report chrome follows the existing light/dark theme. Dark selection is white; chart colours are Mon cyan #38C7F3, Tue amber #FFB547, Wed rose #F36A97, Thu violet #AA8CFF and Fri lime #B9E45B. Weekend colours are orange and mint when those dates contain actual time. Today also has an outline and text label.
- Four flat metrics precede the seven-day chart and Week in review. Daily totals, activity attendance when present, and the lower reading instructions remain visible without disclosures.
- Actual reports retain the twelve-week selector, bounded previous/next controls and canonical daily CSV export. UTC ranges remain complete on phones. Unique weekly members come from the server, not a sum of daily counts.
- An active room with zero study shows genuine zeros, no invented busiest day, and original Study together / owner Plan a session callbacks. A missing saved report is a separate state, with export disabled rather than fabricated zeros.
- Unenabled rooms show a clearly labelled illustrative report plus the existing optional preview action. Example figures are never persisted, exported or merged with room records. The retained-report action appears only when saved week metadata exists.
- Retained snapshots state their cutoff. Dates after that cutoff are unknown, shown as dashes rather than confirmed zero. Existing CSV schema/values remain unchanged, including canonical zero rows.

## Source and implementation

Selected reference: generated exec-12259527-3f48-4068-a815-65ff50e243f9.png, actual size 1487×1058, copied unchanged into ignored evidence as reference-selected.png. It depicts illustrative 6h / 2 members / 5 days / 3 activities. These figures occur only in the explicitly marked sample.

New WeeklyReport.jsx and weekly-report.css provide shared actual/example rendering; lib/weekly-report.mjs derives dates, scale, durations and the review. GroupTools preserves request sequencing and the existing challenge/report APIs; RoomProgress supplies original navigation callbacks. The room GET response adds one member-only, bounded metadata query returning up to twelve saved report weeks. No report contents, private notes or extra permission are exposed by that addition. Existing advanced report retrieval may update its usual snapshot cache.

The existing weekly tutorial JPEG now uses a genuine light-mode screenshot of the advanced zero-data report, matching the new controls. The earlier compact Group progress changes, goal/member screenshots and unrelated FocusGuide.jsx status are preserved.

## Verification

- Full regression run: **701 passed**. After final date-range/axis/mobile refinements, **57 related tests passed**; the full run predates those final display refinements.
- Five new tests cover real member semantics, cutoff/future dates, zero/tied summaries, scale/date formatting, sample boundaries, and actual SQLite/community API member-only metadata plus retained access after entitlement removal.
- Final build: **56 pages + 404**, local noindex; PWA **7252617cf9ab934f**, 76 resources. Existing Vite mixed static/dynamic import warning remains non-fatal.
- Final HTTP verification after updating the screenshot asset: **62 checks passed**.
- Actual IAB desktop dark sample, light active zero report, retained 43-second snapshot, missing week, oldest/current selection bounds and loading transition inspected. CSV downloaded through the real button and read back: seven daily rows, Thursday 0.72 minutes / one member, unchanged canonical format.
- Active empty-state Study together navigation and owner Plan a session dialog worked; booking cancelled without saving and no timer started. No advanced preview grant was created by this pass.
- At 320px, document width 305px, table/chart 273px, seven daily rows and no duplicate IDs/page overflow. Both real zero and sample views inspected; full UTC range visible. Desktop sample colour fills match the seven-day mapping. Warning/error logs captured empty.
- Temporary viewport override reset; temporary test tabs closed, final dark sample tab retained. No audio played or production study records changed.

## Visual review and limits

Reference and actual 07-final-colour-report-dark.jpg were opened together. The reference is a full concept; the implementation screenshot is a scrolled 1280×720 report region within the existing shell. Intentional differences: a real permission banner and explicit sample disclaimer, no nonfunctional sample export/week controls, exact derived durations and visible reading instructions. Actual report controls were verified separately. This is scoped visual acceptance, not pixel-identical fidelity or complete accessibility certification.

Iterations fixed inherited table padding (about 50px rows to about 34px), reduced the desktop gate from roughly 170px to 115px, reduced chart plot height 180px to 150px, and compressed repeated mobile heading/date chrome while retaining the full week range and 44px control heights. Final comparison found no remaining P0/P1/P2 issue in this scope. Native captures in the free-room tab are compressed; a full-page screenshot call failed. Use observed DOM/state evidence and actual viewport images, not invented full-page evidence.

Evidence (ignored): docs/development/evidence/weekly-report-2026-11-20/; final desktop 09-final-preview.jpg, phone 08-sample-phone-320-final.jpg and 05-active-phone-320-final.jpg, actual light zero 04-active-empty-light.jpg, tutorial 06-current-week-example.jpg, retained-week-download.csv. Logs are weekly-report-{full-tests,tests,build,http}.log in the parent evidence directory. Earlier independent planner/community/moderation/main-promotion and production acceptance gates remain in force.

## Preview

Local compiled Worker fixture remains running on http://127.0.0.1:4308. Entry http://127.0.0.1:4308/__test/group-preview → free owner → Group progress → Weekly reports. The retained IAB tab is already on the dark illustrative report. All accounts/data are synthetic; never deploy the fixture Worker. No production version bump is included in this work.

## Approved navigation, guidance and public-content follow-up

Implemented after the user approved the menu/guidance/SEO plan. This supersedes the weekly-only monochrome navigation and the three short reading paragraphs above. Production and package remain V2.42.0; no commit, push or deployment.

Five room workspace tabs now use coral / gold / violet / cyan / berry roles in every room view. Each has a lightly tinted surface and coloured icon; the selected tab has a stronger fill, border and inset indicator. Only workspace navigation changes colour; report bars and the existing business controls retain their behaviour. Icons, labels, aria selection and focus outlines remain available independently of colour. The over-broad weekly CSS override was removed.

WeeklyReportActions reuses the existing room callbacks for Study together, owner Plan a session, and Study activities. The same actions work beneath the read-only example; access/owner restrictions determine which are present. No timer is started by navigation, and planning still uses the existing booking dialog. WeeklyReportGuide is shared with the public page, contains three always-visible numbered screenshot steps, four metric definitions, a unique-member example, and visible empty/dash/access answers. Native image dialogs enlarge each screenshot and return focus on Escape. The content stays below the actual daily table and next actions.

Two new JPEGs are exact real IAB viewport captures: weekly-read.jpg (clearly marked illustrative metrics/trend) and weekly-export.jpg (actual synthetic retained43-second report, date controls/CSV/daily table). The existing weekly.jpg shows a real active zero-data report. No screenshot values were modified or inserted into room records. Images are only teaching assets; example export remains unavailable. The browser clip API produced an incorrect crop during capture and was rejected; accepted native viewport captures were used instead.

The public /study-groups initial HTML now includes #group-weekly-reports, guide navigation, a Today-versus-weekly comparison, a realistic review scenario, the same three screenshots and visible answers, and a working session-planner anchor. The page description includes daily progress / weekly reports / CSV and keeps the truthful free-room/optional-preview scope. The existing canonical/WebApplication structure and private room/invite/activity noindex/no-store policy remain. Local preview is noindex. No GSC/Bing/GA4 settings, tracking, schema, credentials, entitlement rules or backend behaviour were changed in this follow-up; no new search rankings or indexing outcome is claimed.

Final verification: 36 existing related unit/SSR/API tests passed after the final implementation; 62 HTTP checks passed. Public guide initial HTML includes substantive content with no weekly disclosures; both new images returned HTTP200 and matched source bytes exactly (65,966 and74,046 bytes). Build56+404localnoindex, PWA d33beeb93c7cf7c8/76. The earlier701full run belongs to the preceding implementation and was not repeated for this UI/content follow-up. Diff check passed.

Actual IAB checks: light/dark five distinct menu fills; Study together navigation without starting a timer; next-step Plan a session opens the canonical dialog and cancels without saving; activities button opens the existing activity view. Three images load, enlarge and close with Escape/focus return. Public Weekly reports anchor lands at the intended section and its planner link lands on the existing planner. At320px the document is305px, guide images271px, no duplicate IDs and no report/weekly-guide disclosures; public weekly section273px. Fixed a phone-dialog edge-padding issue; final dialog288px with22px body padding and no overflow. Sampled fifteen menu text/background pairs have minimum contrast7.32:1; this is not full accessibility certification. Warning/error logs were empty for the room and public tabs. Temporary viewport overrides reset, final light Weekly reports tab kept at the top, temporary public tab closed. No audio, preview grant, study record or production-data write was initiated.

Source user screenshot1752×815 and actual12-menu-colours-light.jpg1280×900 were opened in one comparison input. This is intentional scoped colour/content refinement, not a same-size pixel clone. Dark menu11, light menu12, lower actions/steps13, public introduction14, fixed phone dialog15, phone guide16 and final1280×720menu/report17 are in the existing ignored evidence folder. The three-step guide is below the initial viewport by design; users reach tools before teaching. No remaining P0/P1/P2 issue found within this scope. Earlier independent planner/community/moderation/main/production acceptance gates and all prior dirty work remain unchanged.
