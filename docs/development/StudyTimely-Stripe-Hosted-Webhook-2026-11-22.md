# Stripe sandbox webhook — hosted and registered

Endpoint:

```text
https://studytimely-billing-sandbox.chenminjian08.workers.dev/api/billing/webhook
```

The user requested an actual deployable address rather than instructions with a missing endpoint. The isolated receiver is deployed, registered with the existing StudyTimely Stripe sandbox and signature-configured. **Do not create a duplicate endpoint for this URL.**

- Receiver source: `f142e729a9ad189e80393a482e7ab5de8429eefb`, tree `1d82ac478d295b8c50c07c10821c348be1079d15`, pushed to the existing release branch.
- Dedicated Worker: `studytimely-billing-sandbox`; version `06e2b27a-2a64-4027-a598-00275b5b1ae3`.
- Deployment `ae439350-28eb-47cb-8c9b-e67edbbc86c5`, created `2026-11-22T13:50:51.838126Z`, verified100% traffic.
- Compiled artifact SHA256: `4b1a890ab071b41af2db434e2791ae62b1e61584d5d70893ef638b6a1ce137b3`.
- Separate D1: `studytimely-billing-sandbox`, identified in `app/wrangler.billing-sandbox.jsonc`. Its identifier differs from production. All17 existing migrations applied only to this new isolated database; no production migration was applied.
- Nine bindings: four explicit sandbox flags/origin, four encrypted Stripe values and the separate D1. No production Google, DeepSeek, email, room or session-signing bindings were copied.

## Stripe configuration

Registered through the Stripe sandbox API using the user-configured test key after verifying both approved Price objects. The account endpoint is Snapshot, API `2026-11-18.endive`, status enabled, livemode false. Its description is `StudyTimely Sandbox Billing — isolated test receiver`.

```text
checkout.session.completed
checkout.session.async_payment_succeeded
checkout.session.expired
invoice.paid
invoice.payment_failed
customer.subscription.updated
customer.subscription.deleted
charge.refunded
charge.dispute.created
charge.dispute.closed
```

The newly issued endpoint signing secret was saved privately and uploaded directly to the isolated Worker's `STRIPE_WEBHOOK_SECRET`. The sandbox server key and two sandbox Price identifiers are also encrypted Worker secrets. The earlier local CLI signing secret was **not** reused or overwritten. No actual credential, signing secret or private checkout URL appears in this document or Git.

GET `/health` and GET/HEAD at the webhook URL provide noindex/no-store readiness information; Stripe sends signed POST requests. Other routes, including checkout, authentication and fixtures, return404. The wrapper rejects the main website hostnames; existing billing configuration rejects live keys and requires the isolated origin. This receiver exposes no synthetic sign-in, website or payment-creation UI.

## Verification

-20 local focused billing/receiver tests passed, including signature, sandbox/live isolation, invoice/grant protections and the new wrapper. The two wrapper tests and build script are committed; the18 previously created broader integration tests remain in the existing local draft work.
- `node scripts/build-billing-webhook.mjs` reproduced the exact deployed compiled artifact hash. Four configured values were checked against the compiled Worker, with zero secret matches.
- Public HTTPS GET200 and `ready:true` verified. Unsigned POST returns400/SIGNATURE; fixture, checkout and secret-file URLs return404.
- A real sandbox Checkout Session was created and immediately expired **without submitting a payment**, solely to generate `checkout.session.expired`. Stripe automatically delivered this event to the registered HTTPS endpoint. The isolated D1 receipt has the matching object ID and completed `ignored` status: an expected outcome for an unmapped test session.
- Stripe reports zero pending webhook deliveries for that event. The registered endpoint independently refetched as enabled, sandbox-only, correct version and all ten exact events.
- The isolated database contains zero accounts and zero membership grants. No subscription or charge was created by this smoke test. This demonstrates public delivery and signature processing, **not remote monthly/annual membership activation**.
- Deployment metadata verifies the new receiver at100% traffic. The main website remains at V2.52.3 Worker `e28c681d-5b93-4f60-a961-6c5a48e252da`, also100%; production purchasing remains closed. Production data, credentials, routes and DNS were not changed.

Ignored evidence is under `docs/development/evidence/stripe-webhook-hosted-2026-11-22/`. The endpoint creation receipt, per-endpoint secret file and uncharged session identifier remain private under `app/.wrangler/billing-webhook/`; do not commit them. Registration bootstrap is idempotent and refuses to create another endpoint at the same URL if its secret cannot be recovered locally.

## Next integration and operations

Use the existing registered endpoint for the later isolated checkout/account environment. Checkout customer mappings and account sessions must use this same test database before paid invoices can generate a matching test Plus grant. Native test login, remote paid monthly/annual activation, future renewal,3DS and refund acceptance are still separate work; the full payment website has not been deployed by this endpoint task.

Rebuild with `node scripts/build-billing-webhook.mjs`; deploy with the dedicated `wrangler.billing-sandbox.jsonc`, not the main Worker configuration. New0016/0017 migration files in Git are not permission to apply them to production. Preserve the unrelated local account/sync/Google/payment drafts and FocusGuide edit.

For an incident, disable only this endpoint in the StudyTimely Stripe sandbox before changing the receiver. Do not delete test receipts or rotate the main site's secrets. The initial receiver version `f0261b35-21cc-45ff-a318-cb354c322de6` predates origin/secret activation and is not a ready operational rollback. Main-site rollback is unrelated to this dedicated Worker.
