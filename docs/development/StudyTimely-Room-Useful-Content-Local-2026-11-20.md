# Room useful content — local handoff, 20 November 2026

Implemented the user's approved room-footer and public-guide plan. Uncommitted, unpushed and undeployed. Production and package remain V2.39.0; no release build was published.

## Changes

- New RoomStudyGuide component, re-exported through RoomStudyAdditions, replaces the outer help disclosure with visible content: three compact routine steps, a 3:2 room-today/activity overview, three directly readable answers and four single-level disclosures. Invitation/access/timer shortcuts and related tools remain. The layout reuses existing theme tokens and restrained amber progress accents; overview stacks at small widths.
- Room today uses actual server totals and the actual room goal. Unknown totals/goal show Not available/Not set rather than invented zero data or a default goal. The progress bar has an accessible value description. It is a snapshot, not an additional ticking timer.
- Activity overview reuses the mounted RoomActivities list/detail subscription through an optional onOverview callback. Room-id matching prevents old-room summaries appearing after a room switch. Effects depend on data/meaningful shortcut fields and phase descriptions, not each clock tick; no extra request, heartbeat, timer engine or server credit stream is introduced. Loading, error, stale-data, existing activity and confirmed empty states are separate.
- View activities opens/focuses the activities view. Only the explicit Plan next activity action opens the owner's existing creation form. The previous shared callback could inadvertently open the plan form for a View action. A callback test now covers the distinction.
- Full guide opens a separate tab so the current room stays mounted. The duplicate guide link is hidden from the bottom context row in Study together. Room rules/safety remain available.
- Public guide adds a concise free-room introduction, a clearly labelled illustrative five-step revision routine, a semantic free/advanced comparison table, concrete assignment/reading/revision examples, and three directly visible essential answers. Remaining questions have one disclosure layer. Original public routes, feature marks, privacy/retention/safety/entitlement language and fourteen-question coverage remain. The example is text and interface content, not a new browser screenshot.
- Private room/invite/activity noindex/no-store, original four seats, independent timers, quick interaction, advanced additions, safety controls and activity checkout semantics are preserved. No backend/schema/migration/dependency/credentials/config/tracking/legal/protected-adapter changes. Unrelated FocusGuide.jsx status is retained.

## Verification

- Final local build: 56 pages plus 404, noindex preview; PWA `794e6a30c5d73a9c`, 76 resources.
- Final full suite: 684 tests passed. Earlier 28 focused checks passed; they overlap and are not additional unique tests.
- 62 final local HTTP/SEO/resource checks passed.
- Six compiled Worker/local D1/Durable Object activity scenario groups passed using disposable synthetic accounts: invitation/capacity, private task isolation/owner start, independent leases/checkout/end/no duplicate credit, private exports, entitlement/review gates and WebSocket updates. No audio, external review, real Google or production user-data operations.
- Actual served initial HTML includes the new public content without test-room names or private footer data. Returned JS and CSS match exact local artifact hashes: `/assets/index-Gq4OCTk0.js`, `/assets/index-BiGpqlvE.css`. Room/invite/activity query variants return noindex and no-store.
- Local service had stopped; restarted the existing isolated Wrangler fixture on 127.0.0.1:4308 after the required local registry-directory access. Retained existing fixture database; no production service or deployment was touched. Initial connection-refused checks were rerun successfully after restart.
- Fresh browser viewport, layout, clicks, focus and console acceptance are still unverified because the in-app browser control runtime is unavailable. Do not present CSS, SSR, callback or API checks as browser screenshot evidence. No new screenshots were fabricated.

## Preview and evidence

Local synthetic review entry: http://127.0.0.1:4308/__test/group-preview — choose the free-room owner to inspect the existing four-seat room. Public guide: http://127.0.0.1:4308/study-groups#group-overview. Never deploy fixture Workers.

Ignored evidence: `docs/development/evidence/room-useful-content-2026-11-20/` contains final build/tests/HTTP/API logs and served-content checks. Existing independent authenticated production community/moderation/main-promotion gates remain unchanged.
