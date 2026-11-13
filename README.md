# StudyTimely

**V2.1.1 is deployed.** The [Flip Clock layout](https://studytimely.com/flip-clock) now has balanced cards, compact information spacing and a complete first-screen dock across the checked desktop/mobile sizes. [Latest release evidence](docs/releases/V2.1.1-2026-11-13.md). World Clock remains available: Browse [32 city clocks](https://studytimely.com/time), open independent city pages, compare time zones and save up to six favourites locally. The existing Flip Clock has a 12-city entry below the clock. 95 automated tests and 142 public HTTP checks passed, with production browser desktop/mobile checks. See [current release evidence](docs/releases/V2.1.0-2026-11-13.md). Real Google login, first community-profile save, public-ranking opt-out and moderator-queue loading were previously verified; production room/timer/chat and actual moderation actions remain pending, and main has not been promoted. [V2 scope and release gates](docs/releases/V2-CANDIDATE-2026-11-13.md), [V2 API contract](docs/releases/V2-API.md).

Free study timers, planning, habits and syllabus tracking at https://studytimely.com/ . React 19 / Vite 6 / Cloudflare Workers + D1.

## Features

Seven timing tools including a local-time alarm, local study history, task-linked sessions, daily/weekly habits and rest days, weekly schedules, exam plans and nested chapters, editable sourced starter outlines and personal outline reuse, eight static themes, six original synthesised sound textures, JSON/CSV export and PWA offline timers. V2 adds optional Google sign-in, public/private study rooms, invitations, server-checked timers, chat/moderation and opted-in global rankings. Existing unlinked email accounts retain recovery; explicit cloud sync and anonymous tools remain available. Anonymous use is intended for ages 13+, optional accounts for ages 16+.

## Development

Use Node 24. From `app`, run `npm ci`, `npm run dev`. Vite preview supports local tools; account integration needs a Worker/D1 environment.

Run `npm run build` then `npm test` for the local candidate and regression suite. `npm run build:release` creates the production-indexable build after configuration/policy checks. When testing a production build, set STUDY_TEST_RELEASE=1 before npm test. Current suite: 95 tests. `npm run test:sites` checks the protected Sites adapter.

For full local Worker integration, build and use official Wrangler:

```sh
wrangler d1 migrations apply studytimely-local-synthetic --local --config tests/fixtures/wrangler.local.jsonc --persist-to .wrangler/local-state
wrangler dev --local --config tests/fixtures/wrangler.local.jsonc --persist-to .wrangler/local-state --port 4181
```

The local fixture only delivers codes to synthetic @studytimely.invalid addresses and must never be deployed. Production entry is `app/dist/cloudflare/worker.mjs`; it does not import the test inbox. Tests explicitly check this separation. The fixed secret in the fixture is synthetic and is not the production Secret.

## V2 local community integration

```sh
npm run build
wrangler d1 migrations apply studytimely-v2-synthetic --local --config tests/fixtures/wrangler.v2-local.jsonc --persist-to .wrangler/v2-local-state
wrangler dev --local --config tests/fixtures/wrangler.v2-local.jsonc --persist-to .wrangler/v2-local-state --port 4184
node scripts/verify-v2-local.mjs
```

`/__test/sign-in` only exists in the localhost fixture and accepts synthetic `.invalid` accounts. It is not real Google authentication. Never deploy either local test fixture. For actual OAuth, use the Google project/client settings in the V2 release gates; keep local secrets in ignored `.dev.vars` and production secrets in Cloudflare. New registrations use Google; email recovery does not create new accounts.

## Deployment

`app/wrangler.jsonc` targets the existing StudyTimely Worker and domain. Configure DB, a cryptographically random AUTH_HMAC Secret (minimum 32 characters), EMAIL and SUPPORT_EMAIL through Cloudflare; never place credentials in Git, client code or config. Apply the versioned SQL migration to the intended database, then run production build, tests, dry run and deploy from the same commit. Production account storage uses EU jurisdiction. Public D1 identifiers are configuration, not credentials. Keep the prior Worker version for rollback; restoring a Worker does not restore or delete D1 data.

Google sign-in uses server-side OIDC with state/nonce/PKCE and verified ID tokens. Existing unlinked email accounts recover through Cloudflare Email Service, with per-IP/email rate limits, hashed one-time codes, HttpOnly sessions, CSRF and per-account data scope. Cloud sync is manual, uses optimistic versions and never uploads an active timer. Cloud snapshots are limited to 1 MiB. Clearing local data, deleting cloud data and deleting an account are separate actions. Back up local records before clearing browser storage.

Public policies are in `docs/compliance/v1.1`; generated third-party notices are in `app/dist/client/THIRD-PARTY-NOTICES.txt`, including the self-hosted web-vitals licence. Optional Google Analytics 4 and Ahrefs are configured, off by default and loaded only after explicit opt-in in Settings → Data. The integration uses GA4 measurement ID G-H523HGH13V directly; source container GTM-W5CTHLWP is not also loaded. Account/legal pages and personal study fields are excluded; withdrawal destroys the SDK context and expires first-party analytics cookies. Backend ingestion is reported separately from code tests. GSC and Bing ownership were verified and the production Sitemap submitted on 2026-11-13; submission does not establish indexing or search traffic.

Public source availability does not imply an additional open-source licence. Third-party dependencies and assets retain their respective licences.

Current deployed status: [V2.1.1 layout fix](docs/releases/V2.1.1-2026-11-13.md). Previous [V2.1.0 World Clock](docs/releases/V2.1.0-2026-11-13.md). [V2.0.1](docs/releases/V2.0.1-2026-11-13.md), [V2.0.0](docs/releases/V2-2026-11-13.md) and [V1.1.2, optional analytics](docs/releases/V1.1.2-2026-11-13.md) retain earlier release evidence. GA4 Realtime and the verified Ahrefs project previously received the controlled page visit; backend ingestion for new city URLs is not revalidated in V2.1. [V1.1.1 closure](docs/releases/V1.1.1-2026-11-13.md) and the [initial V1.1 report](docs/releases/V1.1-2026-11-13.md) record earlier verification states. The production deployment was performed from the verified source; automatic deploy-on-push is not configured.

V1.1 closure adds a wall-time alarm with snooze, study-time calculator, explicit opt-in presentation-settings sync and self-hosted web-vitals 5.1.0 readings that stay in tab memory. These are not site-wide CrUX percentiles.
