# Advanced focus space — local implementation, 19 November 2026

Preview: http://127.0.0.1:4301/aesthetic-timer (verified built-app HTTP server). Production remains V2.34.0; this work is uncommitted, unpushed and undeployed. Package version is unchanged.

## Implemented

- Reused /aesthetic-timer as the focus space, with a landscape stage and adjacent setup panel. Preset editing and secondary options are on demand. Study/Focus/Pomodoro quick tools expose Space; opening it preserves the current timer/task/block. Existing classic Focus Mode, free colour themes, saved sound mixes and music remain.
- Six original self-hosted, code-native SVG illustrations: rainy night, quiet library, corner café, forest cabin, coast and minimal desk. Explicit scene choice never starts a timer or plays audio. Static scenes are included in the public offline shell and its content fingerprint. No competitor assets or third-party imagery.
- Atomic studio-start validates a configuration and current unfinished task, optionally creates one new task, and starts the existing canonical timer in one repository transaction. Active timers block a second start. Existing ownership, pending-save, time-review and stale-epoch checks apply. Starting a fresh session does not reuse old task links.
- Up to 20 device presets store scene, mode, study/break duration, sound mix/volume, explicit playback and ending policy. Save, rename/update, copy, remove and validation are implemented. Preset selection is preview only. Remember preferences controls persistence.
- Current task is shown over a stable high-contrast timer panel. Expand/back, pause/resume, finish, timer-size preferences, reduced-motion preference and sound/music controls work through canonical handlers. Native dialogs hold scene/sound/preset/note settings; immersive layout uses Escape, focus restoration and keyboard containment. Browser geometry and native interaction still need actual acceptance.
- Existing ambient synthesis is retained. Playback requires a click; sound controls report errors. A new end policy is captured on the active device timer and carried into Pomodoro phases; the global app observes its actual saved session and fades ambient sound / pauses music, including after leaving the focus page. A new play cancels a pending fade stop. No preference volume is overwritten by fading.
- Up to 50 device notes of 1,000 characters, explicit save/remove/download. Full note remains local; explicit Add as task uses a stable canonical task ID and keeps the full original note. Conversion retries/reloads cannot create duplicates or revive a deleted task. Display makes the 140-character task-title bound clear through retained full-note feedback. Device documents are epoch-scoped; Web Locks plus revision checks prevent concurrent stale saves. Storage failures keep drafts. Without Web Locks, focus device data is temporary; its status says so. Clear local study data removes all focus device namespaces and fences pending writes.
- A real saved interval opens session feedback. Task completion and remaining work update the existing planner, independently from elapsed time. A real countdown break can follow a standalone session; Pomodoro uses its existing break. Breaks never create learning credit. Continue later/history actions remain available.
- Privacy/local-storage facts document device notes/presets, separate note downloads, explicit task conversion and exclusion from cloud/study backups. No new camera, attention inference, website blocking, remote AI, billing, permissions, backend route or database migration.

## Verification

Final full suite: 588 tests, 0 failures. Includes concurrent real IndexedDB repository starts, repeated note conversion, task links, pause accounting, invalid start rollback, generation/ownership review guards, break exclusion, device bounds/isolation/stale saves and fade behavior. Two rendered-component/asset checks verify initial content and six bounded offline scene assets. The test-only icon externalisation problem was fixed by matching the existing bundled render harness; no production dependency change.

Final local build: 56 routes + 404 with preview noindex; 68 public precache resources. Final HTTP verification: 62 page/asset/SEO/license checks passed, plus all six SVG resources returned correct status/type. Exact PWA version and hashes are in ignored evidence/focus-space-2026-11-19/implementation-manifest.json. Source/generated files remain matched after the final build.

## Unverified and deferred

The in-app browser create/select calls timed out and reset their kernels; open_in_codex returned queued only. No alternate browser/OS capture was used. No actual UI screenshots, desktop/mobile geometry, keyboard/dialog focus, audible audio/download, sleep/reconnect or physical two-device acceptance is claimed. One scene SVG was rendered separately to inspect the artwork, not the product UI. Root design-qa.md remains blocked pending those checks.

The local preview is functional code, not a seeded fake workspace; use your own disposable local tasks if testing. PiP, video/dynamic scenes, custom image upload, cross-device preset sync and subscriptions are later-stage work, outside this approved six-feature first version. No subscription charge or production publication was performed. Keep all existing independent production community/moderation/main-promotion gates.


## Later photographic/motion revision

The illustrations and original panel described above were superseded at user request by photographic-style generated backgrounds, a grouped softer session panel and optional rain/water motion. See StudyTimely-Photographic-Scenes-2026-11-19.md for the final scope,593 tests, prompt set and pending browser acceptance.
