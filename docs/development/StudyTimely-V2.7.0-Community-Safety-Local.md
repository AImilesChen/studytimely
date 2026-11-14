# StudyTimely V2.7.0 — group capacity and chat safety (local)

Date: 2026-11-14. This extends the uncommitted V2.7.0 study-group landing work. Nothing in this handoff is a production deployment or a successful real Azure moderation test. Production remains V2.6.1.

## Behaviour

- Rooms default to eight memberships including the owner, with 4/8/12/24 shortcuts and a custom 2–24 input. Offline members retain places. Members, online members and fresh active study timers are separate counts. Expired check-ins do not show as studying.
- Full public rooms and invitation previews show their capacity; join actions disable when full. The server/database remain authoritative under concurrent joins. New migration `0005_community_capacity_guards.sql` also rejects invalid capacity writes and reductions below current membership. Restore/rejoin still uses existing atomic membership guards. This migration was applied only to the isolated local fixture, never production.
- Learning-only rules prohibit dating/sexual solicitation, threats, hate, harassment, advertisements, external links and contact exchange. Nicknames/room names get conservative local checks. These local checks are deliberately limited and do not establish complete semantic review of names.
- Free-text chat checks member/Google session/CSRF/mute permissions, then rate limits, local rules, external review and final permissions again before inserting/broadcasting. A mute, removal, room closure or session revocation during review prevents publication. Idempotent concurrent retries do not create duplicate messages.
- Rejected text never enters the chat/report tables or broadcasts. The sender sees `*** Message blocked; it was not shared` and keeps an editable draft. Other members do not receive a stream of masked placeholders. Human reports, hide/block, mute and removal remain available.
- Chat allows at most three send attempts per ten seconds and 30 per hour per profile. Review attempts have an additional application-wide four/second gate and an atomic UTC monthly budget, default 4,500; operators can lower it but this integration cannot raise it above 4,500. Failed provider calls also consume the budget. These are application controls, not a promise about all activity on a shared Azure resource or hosting costs.
- Missing configuration, provider failure/429/redirect, timeout, malformed/incomplete category output or exhausted review budget all stop free-text publication. Existing messages and study timers remain usable. Text is not temporarily broadcast while awaiting a later filter.

## External service and remaining setup

The implemented adapter is **Microsoft Azure AI Content Safety**, REST API `2024-09-01`, `text:analyze`, FourSeverityLevels for Hate/SelfHarm/Sexual/Violence. Sexual severity >=2 and other categories >=4 reject the message. These starting thresholds need live English/Chinese educational-context calibration; no classifier or local ruleset guarantees complete detection of harmful, disguised or off-topic content.

Official reference: https://learn.microsoft.com/en-us/rest/api/contentsafety/text-operations/analyze-text?view=rest-contentsafety-2024-09-01

Create a **dedicated F0 (Free)** resource only after confirming operator eligibility and available region. F0 currently includes 5,000 transactions/month and throttles at its limit; this implementation does not provision resources, upgrade a plan, buy credits or automatically fall back to paid inference. Its internal 4,500-attempt cap is a conservative ceiling, not independent verification that the selected resource is F0. Do not use this service with a paid resource while describing it as guaranteed free.

Configuration names and non-secret examples: `community-review.env.example` beside this report. Store the real `AZURE_CONTENT_SAFETY_KEY` in local `.dev.vars` / Cloudflare Worker Secrets, never chat, Git, client configuration or logs. Set `AZURE_CONTENT_SAFETY_ENDPOINT`, `COMMUNITY_REVIEW_MONTHLY_LIMIT` and explicit `COMMUNITY_REVIEW_ENABLED=true` only when ready. Endpoint validation allows only an HTTPS root on a Cognitive Services Azure hostname; redirects are not followed. Production review is currently unconfigured.

Only proposed message text, category selection and output format enter the provider payload. No Google email, profile ID, room name, invitation, local history or study record is sent. Application logs contain neither review text nor provider error bodies. The provider still receives text submitted for review, including text it rejects; provider processing is distinct from our database retention. The local privacy/terms source and chat notice have been updated conditionally for this path. Confirm the chosen resource region, applicable provider terms and any required additional notice before enabling real traffic.

## Verification

- Final local noindex build generated 55 pages plus 404 and PWA `ec6ef9e2dfe67a87` (61 precache entries). Groups remain outside offline precache.
- 142 tests passed after the final build. The first broad run was started before build completion and failed seven artifact-dependent tests due to missing output files; it was discarded and rerun after build completion. Final evidence: `evidence/groups-page-2026-11-14/safety-tests.log` (ignored).
- Six group HTTP checks and 61 existing HTTP/resource/SEO checks passed.
- Five localhost Worker/D1 safety scenarios passed: concurrent final-place joins, invitation full metadata, rejected/failed review non-publication, approved message visibility to a second member, and room timer independence. External review was simulated. Evidence: `safety-integration.json` in the same ignored evidence directory.
- Seven existing localhost two-account Worker/Durable Object scenarios passed, including real local WebSocket refresh, permission revocation, reports and account export. Real Google sign-in and real Azure service classification were not exercised.
- In-app browser observed a custom two-member room, separate attendance counts, contact-rule and simulated semantic rejection with an empty shared log, simulated provider failure, and successful publication of a normal study update. At 390px and 320px the capacity dialog has no horizontal overflow; its fixed title stays visible while the body scrolls. The 1280px room also has no horizontal overflow. Screenshots `06-chat-contact-blocked.png`, `07-chat-phone.png`, `08-capacity-phone.png` are local synthetic evidence. Expected rejection/failure network responses and a preview-server restart are not evidence of an empty browser error log.
- Local migration used the explicitly synthetic `studytimely-v2-synthetic` database and `.wrangler/groups-fixture`. Never deploy `tests/fixtures/v2-worker.mjs`, its fake review responses/keys, or its data.

Preview: http://127.0.0.1:4200/study-groups . Fixture UI is labelled as synthetic accounts and simulated review. Browser QA details and screenshots are retained separately under the ignored evidence directory. Local runtime latency varied considerably; this session is not a production performance benchmark.

Protected Sites adapters, dependencies, production resources, secrets, OAuth implementation, DNS, analytics configuration and the independent real production-community/main-promotion gates are unchanged. No push or deployment was requested for this turn.
