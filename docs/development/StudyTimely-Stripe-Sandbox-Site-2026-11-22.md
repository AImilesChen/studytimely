# Isolated Stripe payment acceptance site — 22 November 2026

The user authorized deploying the existing checkout and membership code to a separate test site and proving payment → automatic Plus activation. Both monthly and annual hosted Checkout payments passed using Stripe's public test card; no real payment was made.

Source runtime commit: `2200979540954a313fe1120b8e6b67ae5d5a52a6`. The initial GitHub push was rejected by automatic approval review pending explicit source-transfer authorization; no alternate mechanism was attempted. The user subsequently explicitly authorized pushing the source. Runtime and handoff commit `a010ca5f34e1728c6753f8f36d1bac3c59730c22` were pushed to the existing `AImilesChen/studytimely` repository, branch `v2-google-community`, and exact remote SHA readback matched. This source backup does not change the deployed sandbox or enable production purchases.

## Deployed site

- Entry: https://studytimely-billing-sandbox.chenminjian08.workers.dev/pricing
- Account: https://studytimely-billing-sandbox.chenminjian08.workers.dev/account?view=settings#plus-membership
- Existing webhook preserved: `/api/billing/webhook`. Do not create a duplicate or use a local CLI signing secret.
- Worker: `studytimely-billing-sandbox`, final version `25f67609-f933-4ca5-bf55-46e634e80dad`, deployment `84b79e57-a042-4f54-b927-75d69723be73` (100%).
- Separate D1: `studytimely-billing-sandbox`, `1122e115-6b77-43db-aef8-ee0a0cca7e69`, migrations 0001–0017 already applied.
- Production stays at V2.52.3, Worker `e28c681d-5b93-4f60-a961-6c5a48e252da`; production data, migrations, OAuth, secrets, previews and payment closure unchanged.

## Actual acceptance results

| Plan | Test charge | Plus paid period ends | Result |
| --- | --- | --- | --- |
| Monthly | USD 4.99 | 2026-12-22 14:41:16 UTC | Hosted Checkout → automatic return → Plus active |
| Annual | USD 39.99 | 2027-11-22 14:50:40 UTC | Hosted Checkout → automatic return → Plus active; persisted after reload |

The accounts were different. Stripe canonical paid invoices, captured test charges, subscription/customer/account mapping and D1 grants were cross-checked. Grant expiry equals the invoice service period. Both invoice.paid and checkout.session.completed receipts for both payments were processed and checked against Stripe events. Annual invoice.paid opened Plus automatically before the Checkout notification finished; the concurrent Checkout notification was initially retryable. An official Stripe CLI resend to the existing endpoint was processed without a second grant or charge. Paid accounts unlock planning, analytics and the expanded library; AI allowance is 4/month. A separate unpaid control account stays Free with all three advanced feature gates closed. No membership was manually inserted or granted from a success URL.

## Authentication and data boundaries

This acceptance site uses private, operator-signed payment-test access codes at `/sandbox/sign-in`. Codes expire in seven days; sessions expire within eight hours and never outlive their code. The code is entered into a password form, not a URL. Same-origin submission, HMAC validation, rate limits, secure HttpOnly cookies and normal session/CSRF checks are enforced. The initial form Referrer-Policy was corrected to `same-origin` after actual browser testing found that `no-referrer` suppressed Origin on form submission. Cross-site forms are still rejected.

No production identity, Google subject or acceptance timestamp is copied or fabricated. Google OAuth, real DeepSeek generation and community rooms are disabled/not accepted in this environment. Successful sandbox payment is not evidence of live-payment readiness, actual Google registration, paid AI generation, 3DS or future renewal delivery.

Private access codes remain only in ignored `app/.wrangler/billing-site/access-monthly.txt` and `access-annual.txt`; never paste them into source, screenshots, URLs or public documents. The in-app browser is retained signed in to the annual test account. To renew codes locally while retaining identities, run `node scripts/issue-billing-sandbox-access.mjs` from app with the existing independent AUTH_HMAC private file. That CLI is never part of the deployed Worker. Do not deploy local fixture helpers.

## Build and verification

`node scripts/build-billing-sandbox-site.mjs` creates an isolated candidate under ignored `app/.wrangler/billing-site/`, archives the committed base, overlays an explicit integration file list and excludes unrelated FocusGuide changes and every local preview/sign-in fixture. The main site config remains unchanged. Candidate previews/tracking are off and all responses are noindex. The wrapper also hard-disables actual AI calls and requires Plus for sync writes. Deployed assets are served by ASSETS; existing four Stripe secrets were preserved and only an independent AUTH_HMAC added.

- 886 tests passed after the final source changes; includes 48 billing/auth/pricing/access/return tests.
- Public HTTP readback: 76 text assets exactly match the deployed candidate hashes, all noindex; private and fixture paths return 404.
- Frontend secret scan: 76 text assets, five configured secret values, zero matches.
- Compiled custom Worker SHA-256: `7927b55db10f590e8cb900b84048b0ae949f711160c53f554bdd1f70e5e71f8e`.
- Actual in-app browser monthly and annual payments used test card 4242, future expiry and fictional identities; payment-saving checkbox remained unchecked. No CAPTCHA or security warning bypass was used.
- Final annual Account reload still showed Plus active through 22 Nov 2027, accurate payment-test account label, no synthetic-local-preview label and no horizontal overflow. Native screenshot saved as `app/.wrangler/billing-site/annual-plus.jpg`.

Ignored evidence in `app/.wrangler/billing-site/`: deploy logs, source selection, artifact checks, complete test results, public HTTP hashes, D1 receipts, canonical provider verification and screenshots. Auth/credential/session/provider identifiers remain private. The first screenshot filename monthly-plus.png contains JPEG bytes; monthly-plus.jpg and annual-plus.jpg are the correctly named evidence.

## Rollback and next launch gates

If the full test site needs rollback, the prior receiver-only version is `06e2b27a-2a64-4027-a598-00275b5b1ae3`; restoring it stops checkout/sign-in pages but keeps the existing webhook receiver. Do not roll back or restore production DB. Preserve sandbox payment records for audit.

Real purchases remain closed on studytimely.com. Before a separately authorized commercial launch, verify production Google identity mapping, live Stripe activation/price IDs/endpoint secret and migrations, actual subscription lifecycle/3DS/renewals, billing policies and the preview exit plan. This task does not authorize swapping test keys for live ones or enabling production checkout.
