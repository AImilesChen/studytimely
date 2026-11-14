# StudyTimely V2.7.0 study-group entry and guide

Implemented locally on 2026-11-14. Preview: http://127.0.0.1:4200/study-groups . Production remains V2.6.1. This task did not push GitHub or deploy Cloudflare.

The public group page now explains the shared-study workflow and exposes Create a free room, Join with a code and Browse public rooms in its hero. It replaces the duplicate workspace navigation on this page with a focused introduction and a three-step explanation. Empty directories provide useful creation, invitation and individual-study actions without inventing active rooms or participants. Existing community profile and moderation controls remain accessible in a secondary expandable area.

Creation and invitation use the existing accessible dialog component. Guests can choose their next action before going to Account; a bounded, ten-minute session-storage intent returns them to the same action after Google account setup. A first-time community profile is completed in that flow, while existing profiles do not repeat it. No account, profile, room or membership is created automatically. The existing Google/age/terms processing and consent are preserved. A room selected before sign-in can also be restored for explicit joining.

Invitation input accepts a code or trusted StudyTimely/current-origin invitation URL. Other origins, misleading hostnames, credentials and ambiguous invitation parameters are rejected. Editing the input clears the previous preview. Dialog validation stays in the dialog and does not replace directory status. Creation keeps its idempotency key until the subsequent refresh succeeds. Closing the dialog returns focus and clears the pending action.

A local study-agenda tool supports a topic, 5–120 study minutes and a 1–30 minute break, with explicit check-in/check-out stages, total duration and copy action. Its topic can seed the room-name draft. The agenda does not create a room, send invitations or record study time. It is not sent to analytics or cloud sync.

The page includes approximately 1,100 English words of editorial guidance and nine answered FAQs covering real functionality, limits, private/public rooms, shared rounds, scoring, disconnected time, text chat and privacy. Existing room timers and local study history remain separate and the copy explicitly explains that. New shared-task records, meeting scheduling and history unification were not introduced.

## SEO and privacy boundaries

The base `/study-groups` route is eligible for indexing in a release build, with updated title/description/H1 and initial-HTML guide content. It enters the existing Sitemap, increasing eligible URLs from 48 to 49. Local builds remain noindex and have an empty Sitemap. The route stays online-only and outside offline precache.

Requests containing `room` or `invite` parameters receive `X-Robots-Tag: noindex, nofollow`, `Cache-Control: no-store` and `Referrer-Policy: no-referrer`. Client metadata also switches to noindex for selected-room/invitation context and returns to the public-page setting after cancellation or returning to the directory. The canonical remains the public base URL. Community owns that client metadata update to prevent the App's generic page effect from overriding the private context. These settings complement existing authentication/room permissions; they are not access controls themselves.

## Validation

- Final release build and all 132 tests passed. Four added tests cover invitation origin boundaries, agenda arithmetic/limits, expiring account intent and public/private indexing plus cache headers.
- The six targeted group-page HTTP checks passed for both the release candidate and final local build: initial guide/actions/FAQ HTML, internal links, private-query headers, Sitemap eligibility and PWA exclusion.
- Existing 61 route/resource/robots/Sitemap/license checks passed. Final local PWA `98f28e4f648ae6c8` has 61 resources. The final release-candidate PWA is recorded in its build log.
- Seven existing localhost-only two-account integration checks passed against a fresh isolated Worker/D1/Durable Object fixture: independent synthetic sessions/profiles; private invitation and anonymous denial; actual WebSocket upgrade/broadcast; server-clock timer credit/exclusivity; report escalation/moderation; member removal/connection revocation; and authenticated export. The checker now writes its evidence inside the release repository's ignored evidence directory.
- The actual in-app browser verified anonymous actions, agenda adjustment and copying, return from the synthetic sign-in fixture to the original creation flow, restored topic, first profile setup and creation of a private test room. Profile ranking remained off. The local QA room is retained only in the isolated fixture for preview.
- Desktop 1280×720, tablet 768×1024, phone 390×844 and narrow phone 320×740 had equal document client/scroll widths. Guide text measures 18px desktop/tablet and 16px phone. At 320px, the invitation dialog was 288px wide with 16px input text.
- Keyboard Escape closed the invitation dialog and restored focus to Join with a code; Enter expanded an FAQ. Foreign invitation links produced an inline error without turning the directory into a failed-load state.
- In the release candidate, the browser observed public `index,follow`, private invitation/room `noindex,nofollow`, query removal and public metadata restoration after cancellation. The final preview was rebuilt with noindex.
- Final preview warning/error logs were empty. Temporary viewport tabs were closed or reset. The final desktop preview remains available in the in-app browser. Only browser webpage interfaces were used, with no desktop/local application input control.

Evidence: `docs/development/evidence/groups-page-2026-11-14/` (ignored), including screenshots, browser observations, HTTP reports, integration receipt and build/test logs. The fixture and its D1 data live under `app/.wrangler/groups-fixture` and must never be deployed. The four protected Sites adapter sources are unchanged.

No production accounts, profiles, rooms, messages, timers or rankings were changed. The integration identities are synthetic; this is not another real Google login or completed production two-account acceptance. The existing authenticated production-community acceptance/main-promotion gate remains pending. No schema, dependency, secrets, OAuth implementation, analytics configuration, DNS or Cloudflare resources changed; Account only recognises the bounded return intent through its existing allowed return path. GSC/Bing/GA4 platform status and actual search indexing were not reverified for this local change.
