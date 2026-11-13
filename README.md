# StudyTimely

Free study timers, planning, habits and syllabus tracking at https://studytimely.com/ . React 19 / Vite 6 / Cloudflare Workers + D1.

## Features

Seven timing tools including a local-time alarm, local study history, task-linked sessions, daily/weekly habits and rest days, weekly schedules, exam plans and nested chapters, editable sourced starter outlines and personal outline reuse, eight static themes, six original synthesised sound textures, JSON/CSV export and PWA offline timers. Optional email sign-in and explicit cloud sync; anonymous tools remain available. Anonymous use is intended for ages 13+, optional accounts for ages 16+.

## Development

Use Node 24. From `app`, run `npm ci`, `npm run dev`. Vite preview supports local tools; account integration needs a Worker/D1 environment.

Run `npm run build` then `npm test` for the local candidate and regression suite. `npm run build:release` creates the production-indexable build after configuration/policy checks. When testing a production build, set STUDY_TEST_RELEASE=1 before npm test. Current suite: 54 tests. `npm run test:sites` checks the protected Sites adapter.

For full local Worker integration, build and use official Wrangler:

```sh
wrangler d1 migrations apply studytimely-local-synthetic --local --config tests/fixtures/wrangler.local.jsonc --persist-to .wrangler/local-state
wrangler dev --local --config tests/fixtures/wrangler.local.jsonc --persist-to .wrangler/local-state --port 4181
```

The local fixture only delivers codes to synthetic @studytimely.invalid addresses and must never be deployed. Production entry is `app/dist/cloudflare/worker.mjs`; it does not import the test inbox. Tests explicitly check this separation. The fixed secret in the fixture is synthetic and is not the production Secret.

## Deployment

`app/wrangler.jsonc` targets the existing StudyTimely Worker and domain. Configure DB, a cryptographically random AUTH_HMAC Secret (minimum 32 characters), EMAIL and SUPPORT_EMAIL through Cloudflare; never place credentials in Git, client code or config. Apply the versioned SQL migration to the intended database, then run production build, tests, dry run and deploy from the same commit. Production account storage uses EU jurisdiction. Public D1 identifiers are configuration, not credentials. Keep the prior Worker version for rollback; restoring a Worker does not restore or delete D1 data.

Sign-in uses Cloudflare Email Service, with per-IP/email rate limits, hashed one-time codes, HttpOnly sessions, CSRF and per-account data scope. Cloud sync is manual, uses optimistic versions and never uploads an active timer. Cloud snapshots are limited to 1 MiB. Clearing local data, deleting cloud data and deleting an account are separate actions. Back up local records before clearing browser storage.

Public policies are in `docs/compliance/v1.1`; third-party asset notices are in `app/public/THIRD-PARTY-NOTICES.txt`. Analytics is disabled. GSC/Bing verification and submission are separate operational steps and are not claimed complete.

Public source availability does not imply an additional open-source licence. Third-party dependencies and assets retain their respective licences.

Production release notes: [V1.1, 2026-11-13](docs/releases/V1.1-2026-11-13.md). The production deployment was performed from the verified source; automatic deploy-on-push is not configured.

V1.1 closure adds a wall-time alarm with snooze, study-time calculator, explicit opt-in presentation-settings sync and self-hosted web-vitals 5.1.0 readings that stay in tab memory. These are not site-wide CrUX percentiles.
