# Group progress compact layout and visible guidance

Implemented locally on 20 November 2026, following the user's three screenshots and approved follow-up plan. Production and package remain V2.42.0. No commit, push or deployment was performed in this pass.

## Changes

Progress removes its repeated marketing eyebrow/subtitle and compresses the room header, actions and switch. The room-shell adjustment is scoped to the progress destination through data-room-view; the other destinations keep their existing layout. The shared-goal/personal cards and contextual action retain their existing data and original handlers. Five room destinations, independent timers, the single mounted activity instance, goal permissions, report gates and privacy rules remain.

How this is calculated is a labelled section, not a disclosure. Three visible groups explain counted time, excluded actions and UTC updates. The retained-total/date information stays visible below. The existing See how time is counted shortcut now scrolls to and focuses the section heading. Weekly daily totals are also always visible, and the export button is explicitly labelled Download CSV. No export data or report API changed.

Three newly captured, genuine synthetic local screenshots show the goal, member contributions and weekly report. They total 94,205 bytes, with no generated artwork or new dependency. The previous cross-feature timer/activity tutorial is replaced in Progress. Owners and Advanced access are explained beside the appropriate example. Every example enlarges in the existing dialog; phones now show a full-width image above its instructions.

The public guide exposes the existing session planner directly, adds a Group progress anchor to its guide navigation and reuses the three matching examples. A labelled four-person scenario distinguishes a planned 120-minute target from an actual 110-minute total and 91.7% completion. Five essential questions, including camera/sign-in and missing time, are directly visible; the remaining existing support questions keep their original disclosures. No new route, fabricated live result, tracking or search-platform change was added.

## Verification

- Final local build rendered 56 pages plus 404; PWA b160425fb726a387 / 76 resources, noindex preview.
- 48 relevant progress, room UI, public-content and advanced tests passed. Two existing checks were updated for visible explanations and five essential answers; no test framework was added. A command initially named an absent content-test file; the final recorded run explicitly includes the existing group-page-content.test.mjs.
- 62 HTTP route/asset/robots/canonical/Sitemap/license checks passed against the actual 4308 fixture. The first check used the default, inactive 4181 port; correcting PREVIEW_ORIGIN resolved the connection error without runtime changes.
- Actual IAB 1280px light and 1710×870 dark desktop checks show the goal at y381 and the next-action button bottom at y844. The user's original 1710×870 dark screenshot places the goal around y554. Both reference and final screenshot were opened together in one comparison input. Different room name, membership and synthetic 32-second value are deliberate; no production values were manufactured.
- At 390px, actual document width375 and goal y546; at320, document305 and example image273×180 with no page overflow. The 800px capture named 05-phone-390.jpg is not phone evidence; use 05-phone-390-final.jpg. The weekly320 capture validates report content and export, and predates the later compact room-toolbar refinement.
- The calculation section has zero disclosures; three desktop columns reflow to visible phone sections. All three final images load. A 320px weekly-example dialog loaded, Escape closed it and focus returned to the correct example button.
- The original See how time is counted shortcut selected Progress and focused rp-calculation-title. Add your study result selected the matching original activity/result form; Cancel returned without saving. No timer, task, result, goal, message, room creation or subscription was saved for acceptance; no audio played.
- Advanced reports showed seven daily rows without disclosure. Download CSV produced a real downloaded 2026-11-16 report, read back with the correct seven dates, header and zero-valued existing synthetic records. No study time was invented to populate the chart.
- Public planner 3×35=105 and copied agenda target were verified; the planner has no disclosure ancestor. The public progress anchor works. Desktop1280/document1265 and phone390/document375 have no page overflow or duplicate IDs. The public page has one H1, the established title/canonical and three loaded screenshots. Local preview deliberately remains noindex; existing public-release indexing and private-query noindex/no-store are covered by the relevant tests. GSC, Bing and GA4 were not changed or revalidated.
- Captured warnings/errors were empty on the final room and public tabs. Scoped visual review passed after the phone-image and toolbar refinements; no full accessibility or physical-device conformance is claimed.

Evidence is ignored under docs/development/evidence/group-progress-followup-2026-11-20/. Accepted captures include 02-desktop-compact-final.jpg, 08-desktop-dark-final.jpg, 09-rules-dark-visible.jpg, 05-phone-390-final.jpg, 06-phone-cases-320.jpg, 07-phone-weekly-example-dialog.jpg, 11-public-progress.jpg and 12-public-phone-390.jpg. The exported synthetic CSV is retained there. Logs with the same evidence prefix sit alongside that folder.

Preview entry: http://127.0.0.1:4308/__test/group-preview. Select the free owner, then Group progress. The active synthetic room and public guide tabs are retained in IAB; temporary viewport overrides were reset and the local light theme restored. The isolated Wrangler process is kept running. Its initial sandbox attempt could not access Wrangler's registry directory; the approved local execution started successfully. Never deploy this fixture Worker.

No backend/schema/credit/entitlement/storage-format/credential/OAuth/binding/dependency/protected-adapter change. Unrelated FocusGuide.jsx status and independent planner/community/moderation/main-promotion gates are preserved.
