# StudyTimely V2.49.0

Published 21 November 2026 at https://studytimely.com/account?view=community, superseding the local My groups workspace and room-selector visibility follow-up.

- Runtime commit: `fc0bd18626ead9fe9945e253b93fe2ed64394164`; tree `6188e9c8c42b15bcffeecbdf45169e9b5373d3af`; branch `v2-google-community`.
- Worker version: `4a0f11dc-529b-48fb-865d-92eda776eb32`.
- Deployment: `fd61229d-99fc-420c-8d27-616f2dd7d911`, created `2026-11-21T14:38:18.106169Z`, 100% traffic.
- PWA cache: `a1d854b1a1eabf93`, 76 resources.
- Rollback: V2.48.0 Worker `0b130235-184e-4fa7-89d8-1563f8f243c1`; no database restore required.

## Published behaviour

My groups is an on-page study workspace. Selecting one room shows only that room's timer, confirmed daily credit, members, invitation controls and next activity. Actual start/pause/check-in actions reuse the full room's lease and heartbeat protocol. Browsing another room never silently moves or stops a timer; other-tab/device leases remain guarded. Activity reservation is separate from starting a timer, and private activity tasks stay private.

Desktop choices have distinct surfaces, full borders and separation. Selection is peach in dark mode or rust in light mode, marked “Viewing this room” with a decorative check. Other choices say “View room” with an arrow before hover. A “Choose a room” native selector serves narrow screens without a duplicate desktop list. Room readiness remains a separate status.

Invitation preview, explicit joining consent, preset-themed room creation and public-room discovery work on the same page. Read-only, closed, full and no-active-place states explain available actions. Free-room switching requires explicit confirmation. New profiles use a nickname and explicit acceptance, with public ranking off by default. Per-tab/account drafts and a bounded sign-in return preserve intended actions without implied membership consent.

Three visible guide steps, a labelled example and expanded answers explain the controls. Existing local illustrations and warm surfaces remain. The public study-groups guide adds a prerendered explanation of finding and returning to a group; account and private room/invitation variants remain noindex.

Backend additions are theme/effective-place fields in the existing member summary, optional validated preset-theme creation using existing columns, and an authoritative read-only invitation flag. Existing session, CSRF, membership, version and atomic-write checks remain. Frontend and Worker were published together; no endpoints, schema migrations, credit rules or access entitlements were introduced.

## Verification and limits

- Release build and Wrangler dry run passed; 56 prerendered pages plus 404.
- **774 release-mode tests passed**, zero failures. Six compiled local Worker scenarios also passed: synthetic profiles, themed creation, explicit private joining, real lease start/pause, private activity reservation and anonymous private-room rejection.
- Candidate and production each passed **62 HTTP route/resource checks** and six group-page checks, including robots, Sitemap, licences and private-query headers.
- **175/175 public non-audio/video files exactly match** release artifacts. Shipped code/styles contain the inline tools and final contrasting room choices. Public guidance is present in initial HTML. Anonymous API protection, existing Google provider availability and fixture/diagnostic endpoint absence passed.
- Deployment confirms 100% traffic, with all **12 bindings**, handlers and runtime settings unchanged. Keep-vars was used. No migration or scripted authenticated production mutation was performed.
- Source inventory: 503 files, SHA256 `80ad8f2b8becb9855cca0f15507cccf523db76704eaea4eac52e90bfe4109136`.
- Artifact inventory: 217 files, SHA256 `1c8163e71ba2701d2c2f6a9b747f38632d238b1a7ba7feeeba4cf3cf0a420d6e`.

The runtime commit was pushed and independently read back on the existing authorised public release branch. Direct Git transport reset; the existing system proxy completed synchronization. Production browser opening was queued. Direct browser-control tools remain unavailable: fresh production screenshots, authenticated click-through, clipboard behaviour and phone visual acceptance are not claimed. Earlier local diagnostics, handler/render tests and isolated API checks remain separate evidence.

No dependencies, credentials, OAuth implementation, DNS, paid resources, tracking configuration or protected Sites adapters changed. Fixtures and ignored diagnostic helpers were not deployed. The pre-existing FocusGuide.jsx working-copy status remains excluded. Independent planner/community/moderation/main-promotion gates remain separate. Later documentation commits do not redeploy runtime.

Ignored evidence: `docs/development/evidence/my-groups-release-2026-11-21/`.
