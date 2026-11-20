# Study activities visual guidance — local, 20 November 2026

Implemented the user-approved menu explanations, four screenshot steps and contextual instructions in the existing application. Not committed, pushed or deployed. Production remains V2.40.0. Earlier unrelated working changes are retained.

## Behaviour

- `RoomWorkspaceNav.jsx`: five existing destinations retain their IDs, panels and callbacks. Each tab has a visible purpose, accessible description and selected-view explanation. Arrow/Home/End keys work; modified keys keep normal browser behaviour. Phone tabs remain one horizontally scrollable row.
- `ActivityWalkthrough.jsx`: four permanently visible steps above the activity show real sample screens, the exact control name, who uses it and whether it opens a window or expands here. The current step and a context-aware shortcut lead to the existing activity without starting a timer. Screens open in the existing native Dialog; Escape/close return focus.
- Activity controls: Manage activity distinguishes the session from room management; Edit task or withdraw previews its contents. Participant names and a description of the detailed list are visible before expanding it. Result fields and the effect of saving are explained before opening. Check-in/start/resume describe personal timing independently from the group countdown.
- `room-activity-guide.css` preserves existing light/dark tokens and Phosphor icons. Desktop steps share aligned headings; phone steps stack in order with images beside their copy. Four JPEGs total 146,600 bytes, captured from synthetic local example UI. They contain no real account data. Dates, names and clocks are illustrative sample screens, not live room data.

## Verification

- Full 686-test suite passed after the main implementation; final label/modified-key refinements followed by 16 existing room UI tests passing.
- Final local noindex build: 56 pages plus 404; PWA 6bff7622bdbfd212 / 76 resources. Final 62 HTTP route/asset/robots/sitemap/license checks and diff check passed.
- Actual IAB: menu captions, light/dark desktop, 390px and 320px phone layouts, all four screenshot resources, screenshot modal/Escape/focus return, context shortcut, result opening/cancel and result draft preservation across Group progress → Study activities were checked. The shortcut/example modal never started a personal timer. Captured console warnings/errors empty.
- Width checks: document 375px in 390px viewport and 305px in 320px viewport (scrollbar excluded); no document overflow. The 320px example dialog is 288px with 286px scroll width. Tabs intentionally scroll inside their own container.
- A synthetic local session was created, joined with a sample task and started to capture the timer screen. Its personal timer was never started, no study time/result was submitted, and sample result draft was cleared. No production data or audio was touched.

Evidence: `G:/CodexHome/visualizations/2026/11/20/01a1f805-75b4-74d2-a8ea-bee79e06a206/activity-audit/`, especially 06-mobile-guide.jpg, 07-mobile-example.jpg, 08-phone-320-example.jpg, 10-desktop-dark.jpg and 11-final-desktop-guide.jpg. The final IAB tab is retained; temporary viewport override reset. Preview entry: http://127.0.0.1:4308/__test/group-preview (choose an identity, then Study activities).

## Visual review

Current-scope final result: passed.

Source: user screenshot `C:/Users/NINGMEI/AppData/Local/Temp/codex-clipboard-d1b596a9-31b9-46e6-93b5-316afc1d24f3.png` (1123 × 869) and the approved analysis. Implementation: final desktop screenshot (1265 × 889 content capture in 1280 × 900 CSS viewport, DPR 1). Both images were opened together in one comparison input. The source is a supplied crop, not a matching viewport; this is a scoped redesign review, not a claim of pixel-perfect cloning. Both show an activity in the focus phase; sample identity, date, task and personal timer state differ intentionally.

Typography uses the existing Inter family with 14–15px instructions and consistent heading/action hierarchy. Existing room surfaces, borders, radii and functional tones are retained. Real screenshots are clearly marked as examples, enlarge on demand and have descriptive alt text. Main permissions, privacy and timer handlers are preserved. The old lower text-only tutorial is replaced by top visual steps; legal/retention details remain below.

Review iterations: first desktop review found a wrapped third heading misaligning the image row; shortened to Start your timer and rechecked all four headings at 32px. First phone review found excessive guide height; changed each vertical step to an image/copy row, then inspected 390px and 320px. No current P0/P1/P2 issues remain. Keyboard focus/hover outlines in the evidence are intentional interaction states. Full assistive-technology/physical-device testing is outside this local visual pass.

The older planner visual acceptance and independent community/moderation/main-promotion gates remain separate. No backend/schema/API/entitlement/timer-engine/dependency/protected-adapter changes were introduced by this pass. Never deploy the local fixture Worker.
