# Cloudflare content review evaluation — 17 November 2026

The user requested a Cloudflare test before choosing a moderation provider and reported a USD5 Workers subscription. The user explicitly approved adding AI read/write and account-analytics read to the existing official CLI OAuth grant. Authorization completed manually after the in-app browser timed out. Current grant names were checked; no credential values were printed or committed. No plan, production Worker binding, database schema, room, chat switch or public policy was changed.

## Free allocation and scope

Cloudflare's current official pricing lists 10,000 Neurons per UTC day for both Workers Free and Workers Paid, with Workers Paid overage at USD0.011 per1,000 Neurons. This is shared across the account's Workers AI usage, not a separate per-site allowance. It is a daily included allocation rather than a30-day trial. The USD5 plan was reported by the user, not independently verified via billing access. Sources checked on17November2026:

- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/workers-ai/models/llama-guard-3-8b/
- https://huggingface.co/meta-llama/Llama-Guard-3-8B

The initial model-directory request returned403 because the existing grant lacked AI permissions. After authorization the exact Llama Guard3 8B model was found via the account API. Its live schema accepted alternating user/assistant messages, max_tokens, temperature and JSON response format. Model version: @cf/meta/llama-guard-3-8b, hosted by Cloudflare. Meta's published supported language list has English/French/German/Hindi/Italian/Portuguese/Spanish/Thai, without Chinese; Chinese observations here are experimental.

## Actual test

Exactly32 bounded direct REST inference calls were performed, all using synthetic short texts and no real user data. The initial24 balanced normal study/harm/community cases were followed by8 challenge cases after the small initial consumption was observed. No inference calls failed and none were automatically retried. A local persistent ledger enforced the32-request approval cap, reserved a conservative300Neurons per request and checked aggregate headroom before each batch. Inputs were below512UTF8bytes; outputs were limited to16tokens, temperature0, with strict JSON safe/category parsing. A dummy study-writing user prompt followed by the synthetic post as an assistant message exercised the model's documented output-classification format. This tests a candidate adapter pattern, not a native ready-made community-chat policy.

The classification was combined offline with the existing localContentIssue rules. It did not invoke or modify production chat. Normal messages included history violence, biology reproduction, self-harm support and the Linux kill-process expression. Prohibited cases included threats, sexual solicitation, hate, self-harm encouragement, contact sharing, dating, exam-answer advertising and a prompt-injection variant.

| Sample group | Cases | Combined policy result matched | Raw model blocked |
|---|---:|---:|---:|
| Normal learning, expected allow | 12 | 12 | 0 |
| Safety violations, expected block | 11 | 10 | 10 |
| Community rules, expected block | 9 | 7 | 2 |

Overall29of32 combined decisions matched the hand-authored expectations. This is a small purposive smoke test, not a statistically representative accuracy estimate or proof of production safety. Every normal case was allowed. Three challenge misses were a euphemistic Chinese sexual/nude-image solicitation, a Chinese contact handle with an inserted separator, and an alternative Chinese dating solicitation. The model and existing local rules both missed these; do not enable chat based on the24-case baseline alone. The raw model caught only2of9 community-rule violations, demonstrating the need for separate study-space rules.

## Measured latency and consumption

Median end-to-end latency:462ms; p95:2325ms; maximum:2392ms; minimum:322ms. This was one sequential run from the local machine to the direct API, including network/cold-start effects. It does not measure deployed Worker latency, throughput, concurrency or a service guarantee.

The provider returned usage.neurons for each call, totaling 319.998493 Neurons, about3.20% of the10,000 daily allocation. Response cf-ai-neurons headers and token-based estimates agreed within rounding. The official token conversion used44003Neurons per million inputtokens and2730 per million outputtokens. At this particular short-text distribution the average is about10Neurons/call, implying roughly1,000 similar calls per10,000Neurons, before other account usage or a safety reserve. Longer text and different prompts/models change that figure; it is not an entitlement to1,000messages.

The account GraphQL aggregate query reported0requests/0Neurons both before and shortly after the run, while live inference responses reported the consumption above. Aggregate ingestion/visibility is therefore not validated as real-time. Do not treat its zero value as a verified current balance or final bill, and do not use this analytics query alone as a hard spending cap. This run itself is much smaller than the included daily allowance, but account-wide free/paid accounting was not independently reconciled with the bill.

## Decision and next steps

Cloudflare is an accessible low-consumption candidate; it is not accepted as a complete replacement yet. Keep production chat paused and retain Azure as an unconfigured option. Before adoption: expand server-side normalization/contact/dating detection, evaluate a separate study-community policy where needed, validate Chinese obfuscation and neutral educational contexts with a larger labeled set, and preserve fail-closed behavior on timeout/invalid output/limit exhaustion. A deployed adapter must explicitly manage per-account shared usage uncertainty and a conservative app budget on the Paid plan; an app request count alone cannot guarantee zero account-wide overage. Review provider disclosures before enabling actual user-message processing. No additional inference should run under this32-call approval; a broader test is a separate scope.

Ignored evidence and reproducible harness: docs/development/evidence/cf-review-2026-11-17/, including permission-probe, model-catalog/schema, usage-before/after, test-ledger, synthetic-samples and final-summary. The fixture samples are synthetic and no production activity was created. No frontend build or unrelated regression suite was run because no application source changed. Production remains V2.26.0.
