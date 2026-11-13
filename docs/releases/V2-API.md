# V2 API and data contract

All API responses are private/no-store/noindex. Mutations require JSON, same-origin and an authenticated session plus `x-csrf-token`, except the browser-bound Google entry/callback and legacy email recovery. Participation requires a Google-linked account and an explicitly accepted nickname profile. Errors are `{error:{code,message}}`; UI must handle 401, 403, 404, 409, 429 and 503.

| Method / route | Purpose |
|---|---|
| POST `/api/auth/google/start` | `{accepted,link?,returnTo?}` → Google URL and ten-minute binder cookie; link requires an existing live session/CSRF |
| GET `/api/auth/google/callback` | One-use state/binder, token exchange, signed ID-token validation, account/session creation and safe redirect |
| GET `/api/auth/me` | User Google-link flag, CSRF, Google readiness; no secret values |
| GET `/api/community/me` | Own profile/version, rooms, timer, blocks, last 30 rank snapshots and moderator availability |
| PUT `/api/community/profile` | `{nickname,publicRanking,accepted,version}`; compare-and-swap prevents stale opt-in |
| GET/POST `/api/community/rooms` | Anonymous public directory / authenticated idempotent create UUID, name, fixed visibility, capacity, goalMinutes |
| POST `/api/community/invite` | Rate-limited invite preview; invitation is not a login credential |
| GET `/api/community/rooms/:id` | Public metadata or member/private data; inviteCode only for owner/platform admin |
| POST `/api/community/rooms/:id/join` | `{accepted,code?}`; explicit nickname/time sharing, capacity and persisted ban checks |
| POST `/api/community/rooms/:id/leave` | Revoke member access and pause its room timer |
| PATCH `/api/community/rooms/:id/settings` | Owner/admin settings with version CAS, invitation rotation and irreversible closure |
| PATCH `/api/community/rooms/:id/members` | Owner/admin `{profileId,action:mute|unmute|remove|restore}` |
| POST `/api/community/rooms/:id/round` | Owner/admin optional shared finish, 0 to clear, maximum 25 minutes; never auto-starts members |
| GET `/api/community/rooms/:id/socket` | Same-origin authenticated upgrade into that room's Durable Object; revalidated membership/session |
| POST/DELETE `/api/community/rooms/:id/messages` | Idempotent UUID/plain text or author delete/owner hide |
| POST `/api/community/rooms/:id/reports` | Reason, optional details, reported message excerpt |
| POST `/api/community/blocks` | Own `{profileId,block}` filter for received chat |
| GET/POST `/api/community/moderation` | Owner-scoped/platform queue; hide/mute/remove/dismiss; owner reports platform-only |
| POST `/api/community/timer/start` | `{roomId,joinRound?}` → exclusive random lease and server timestamp |
| POST `/api/community/timer/heartbeat` or `/pause` | `{lease}`; server time only, atomic credit ledger/aggregate update |
| GET `/api/community/leaderboard?period=today|week|streak` | Up to 100 opted-in pseudonymous participants; equal scores share rank |
| GET `/api/account/export` | Existing workspace plus own community records; no other people's chat/private invitations |
| DELETE `/api/account` | Existing explicit deletion contract extended to own community data and owned rooms |

The room socket transports refresh signals, not chat payloads. The client re-fetches permission-filtered HTTP data. Presence pings are throttled before D1 access; metric broadcasts coalesce within 15 seconds. Per-room connection cap is 72 and per-account cap is three. Clients reconnect with backoff and visible errors, with a foreground poll fallback. Online is a recent-presence indicator, not proof of studying.

`0002` adds Google subject/state, profiles, rooms/members, single-account timers, credit ledger, UTC daily and room-daily totals, messages, blocks, reports and rank history. `0003` adds profile CAS/version and query indexes. D1 foreign keys, capacity triggers, idempotency IDs and transactions are part of the contract. Current implementation uses the existing D1 EU database for these records; Durable Objects route real-time signals at Cloudflare's edge.

Daily/room time is retained up to 365 days, not a lifetime achievement certificate. Existing user-controlled local history/cloud workspace has its own deletion/backup semantics. No migration copies local records into public scores. Moderation/report retention and closed-room behaviour are explained in the candidate release and public policies.
