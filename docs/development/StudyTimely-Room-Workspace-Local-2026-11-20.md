# Room workspace separation — local, 20 November 2026

The user approved separating room companionship, organised activities and progress after reviewing the activity mockups in the full dark room. This supersedes the earlier requirement to show the full activity workspace and progress below the four seats on the default Study together view. Existing functionality is retained; publication has not been requested for this change.

## Behaviour

- Study together preserves the four-seat board, independent room timer, invitations, quick messages, room guide and original safety/member/settings controls. A compact activity shortcut appears above the seats for the next appointment, running activity, or the selected participation awaiting a result. It contains no second ticking clock. No activity means no empty shortcut panel. Connection failures have a route to the existing retry controls.
- Study activities contains the existing activity list, organiser actions, personal tasks, one shared focus/break countdown, personal start/pause controls, result/reflection and participants. The personal elapsed clock is removed from this view; periodically settled personal seconds remain ordinary recorded-time text. Participant statistics are inside the details disclosure.
- Group progress alone shows the existing RoomProgress metrics, daily goal and calculation explanation. Advanced tools and Manage retain their existing panels and entitlement checks.
- The original RoomActivities instance remains mounted while its summary/full sections and the basic panels use native hidden attributes. Task/result fields keep their React state across tab switches. Timer ownership, heartbeat, settlement and interval-resume semantics remain in the original Community/server implementation; no new timer or study-credit submission is introduced.
- Direct activity URLs open the activity tab. Ordinary room entry opens Study together. Activity selection prefers the running activity, earliest appointment, or latest joined ended activity when no explicit deep link is present.
- The room shortcut opens the activity tab without joining or starting. Its result action requests the matching activity's result form and focuses the outcome field. The open request is scoped to that activity, so choosing another activity does not open an unrelated form.
- Owner/co-host End activity for everyone is in the existing Manage disclosure with a distinct confirmation. Personal Finish & add result remains a visible real button. Privacy and the irreversible participation consequence appear inside the result form before explicit submission. Cancel/hide do not submit; failed saves retain the form and entries.

## Visual scope

New room-workspace-flow.css uses the existing room theme variables and module widths. The default dark room no longer has a separate large white activity panel beneath the seats. The activity view uses a single familiar room surface, a small warm light task summary, readable 40–56px shared countdown and a light apricot main timer action. Planning, management, participants, editing and result controls use restrained outlines/text instead of multiple full-width coloured banners. Secondary explanations and counts are disclosed. Light mode follows the same theme roles. Controls stack at 700px and retain existing keyboard/focus semantics.

## Validation and limits

- 677 full Node tests passed, including the unchanged timer accounting/lease, free four-seat, activity permissions and privacy cases, plus nine new activity-navigation/shortcut cases. The shared clock SSR case now requires exactly one timer element and forbids the duplicate personal interval clock.
- Six compiled local Worker/D1/Durable Object activity scenario groups passed against localhost4308: membership, independent timers/exclusive leases, check-out settlement/no duplicate credit/no restart, private notes/export, safety/entitlement checks and WebSocket updates. Disposable synthetic accounts/rooms only; the verifier closes its room and leaves no test timers running.
- 62 local HTTP/asset/robots/Sitemap/license checks passed. Build produces 56 pages plus 404 in noindex preview mode. Existing chunk-size/dynamic-import advisories remain; no new dependencies were added.
- Fresh in-app browser screenshots, visual layout acceptance, pointer/keyboard interaction, and real mobile overflow checks are **not verified**: no browser-control runtime is available in this session. Model, SSR, build and API checks are not represented as browser visual proof. The UI request to open a Codex browser panel is separate from capture/acceptance.

Preview: http://127.0.0.1:4308/__test/group-preview — choose the free-host synthetic entry. The fixture is localhost-only and must never be deployed. No audio is started. The existing fixture configuration and local persistence are reused.

No backend/API/schema/entitlement policy, Google authentication, credentials, production data, paid resources, dependencies, protected adapters, tracking or public guide text changed. Production remains V2.38.0. Changes are local/uncommitted/unpushed/undeployed. The unrelated pre-existing FocusGuide.jsx status is preserved.
