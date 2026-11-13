# V2 release candidate — 2026-11-13

Status: **2.0.0-rc.1 is implemented and tested locally. Production remains V1.1.2.** Google OAuth credentials have not been created. No V2 production database migration or deployment has been performed.

## Delivered scope

PRD sections 5.9–5.11 and the V2 phase are implemented: public/private rooms, owner-only invitation codes and share links, explicit joins, online presence, independent server-checked timers, optional shared finish rounds, daily and retained room totals, room rankings, owner settings/capacity/goals/invitation rotation/closure, mute/remove/restore, text/emoji chat, quiet mode and focus hiding, reports, personal message blocking, and an operator moderation queue. Public rooms and opt-in rankings can be browsed anonymously.

Google is the new-account sign-in method. Existing unlinked email accounts can recover access and explicitly link the same verified Google email. Matching emails alone never merge accounts. Cloud sync remains manual and keeps its existing conflict/deletion safeguards. Anonymous local tools and the sparse Graphite homepage remain available.

Global rankings cover the UTC day, Monday–Sunday week and current streak; one verified minute qualifies a streak day. Public participation defaults off. Opt-out hides current results and deletes rank snapshots. Daily rank history is recorded after midnight and displays up to 30 recent results; it is not invented for a newly created account.

## Validation

- 78 automated tests pass, including real RSA-signed OIDC fixtures, state/nonce/PKCE, explicit linking, CSRF, room permissions, concurrent timer and profile updates, ranking opt-out, moderation and account deletion.
- An isolated local Cloudflare Worker, D1 and SQLite Durable Object passed a two-session integration flow with actual WebSocket upgrade/broadcast, server-clock credit, exclusive timer lease, private invitation and access denial, owner-report escalation, member/socket revocation, and own-data export.
- Actual in-app-browser checks covered two independent browser origins, private joins, chat delivery without manual refresh, muting, reporting an owner, platform moderation, refreshing a room URL, timer start/pause/live seconds, public-room creation and Google-not-configured states.
- A 390×844 browser view showed one H1 and no horizontal document overflow (document width 375, viewport 390). This is responsive browser QA, not physical-phone installation/audio testing.
- Local preview HTTP checks cover 22 routes plus redirects/404 and assets (28 checks), noindex, empty preview Sitemap and third-party notices.

Evidence and screenshots are held in the workspace at `docs/development/evidence/v2/`, outside this public source repository. All community/browser integration accounts and time are explicitly synthetic. Real Google authentication and production V2 reception have **not** been verified.

## Data and operational limits

The API authenticates a 30-day HttpOnly session and validates same-origin/CSRF for mutations. Google requests only `openid email`; no Google name/photo is published and no refresh token is requested. An OAuth transaction has a browser binder, one-use hashed state, nonce, PKCE and ten-minute expiry.

Each account has at most one running community timer, three open owned rooms and ten active memberships. A room permits 2–24 members. Timers use server time, 30-second heartbeats, a 90-second maximum accepted gap, 25-minute check-ins and an eight-hour UTC daily credit cap. Imported/local records never contribute. These controls reduce duplicate submissions and abuse; they do not prove attention or guarantee bot prevention.

Chat is plain text, at most 500 characters, five messages per ten seconds and 200 per hour. It stays closed unless `COMMUNITY_ADMIN_EMAILS` is configured. The allowlist must contain an explicitly authorised operator's Google email; the first registered user does not become an admin. Reports about owners are not shown to those owners. Removing a reported owner closes their room. Moderation is manual, not continuous.

Daily maintenance at 00:05 UTC snapshots yesterday's opted-in ranks and removes expired records: chat/credit details after 30 days, reports after 90, daily totals/rank snapshots after 365. Cleanup can add one maintenance interval. Account deletion cascades its profile/messages/memberships/scores/owned rooms; retained report excerpts and other users' independent aggregates follow the documented limits. Private room identifiers and chat are excluded from analytics, Sitemap and PWA precache.

## Release prerequisites

1. Create a dedicated StudyTimely Google Cloud project/OAuth Web client; configure branding, audience, `openid email`, origin `https://studytimely.com`, callback `https://studytimely.com/api/auth/google/callback`, and the actual public policy URLs. Inspect publishing/verification requirements in the console. A Testing audience is not an unrestricted public launch.
2. Install `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and authorised `COMMUNITY_ADMIN_EMAILS` through Cloudflare encrypted secrets. Preserve `AUTH_HMAC`, `DB`, `EMAIL` and `SUPPORT_EMAIL`. Never commit `.dev.vars`, downloads, cookies or tokens.
3. Export/record a recoverable production D1 backup/bookmark and applied migration state. Apply additive migrations `0002_google_community.sql` and `0003_community_consistency.sql` to the existing StudyTimely database only. Keep `0001_accounts.sql` unchanged.
4. Build release, run release-mode checks, dry-run the existing Worker with its new SQLite `StudyRoom` binding and Cron, then deploy verified source. No unrelated project, DNS or paid plan change is authorised.
5. Verify real Google login/cancel/link/return flow, independent sessions and real production WebSockets, authorised moderation, account export/deletion with owned QA data, public/noindex metadata, analytics exclusion, and migration/Worker status. Close/remove only explicitly disposable QA resources.
6. Promote the candidate to main only when those gates pass, and record actual source tree, Worker version, deployment time and evidence. Until then, retain the working V1.1.2 production version.

Worker rollback alone does not roll back D1 or the Durable Object migration. The additive schema can remain with V1.1.2; preserve the previous build and bindings, and stop the V2 Cron on rollback. Do not run destructive schema-down scripts against live data.

## Remaining verification

Real Google credentials, public audience/branding readiness, authorised production moderator, production migration/deployment and real external login are pending. Sustained multi-room load/cost, independent penetration testing, physical phones, and field Core Web Vitals have not been certified. The earlier poor local INP sample and insufficient CrUX data remain open. V3 payments/AI and the wider SEO keyword candidate pool are outside this V2 request.
