# Planner learning-type colours and compact details

Local implementation on 18 November 2026 following the user's screenshot review and approval. Supersedes the preceding dark-blue drawer presentation. No commit, push or deployment; package and production remain V2.32.0. Earlier unpublished preparation/calendar/Plans changes are preserved.

## Changes

Study, review, mock and corrections now have stable blue, purple, orange and rose pastel surfaces, accompanied by existing Phosphor icons and visible type labels. Main topic rows show their included types, including mixed study/review and mock/correction groups. Completion is an independent green indicator; it does not replace the task type. Omitted work is excluded from included-type counts. Next-session content also displays its type.

The workspace and details use neutral surfaces in dark mode, and white/grey in light mode. Selection uses an outline and check rather than repainting every type blue. Both themes retain clearly coloured task surfaces; no appearance preference is overwritten. The next-session mint surface and blue primary action remain visibly separate from task categories.

The right-side dialog now fits short content and is capped by the viewport. Long details retain one scrolling middle above the footer. On narrow screens it uses the full width and the same content-height behaviour. Footer width and margins explicitly override shared website-footer rules, removing the accidental centred narrow footer. Actions follow short content instead of sitting at the bottom of an empty full-height panel. The backdrop is lighter and does not blur the main workspace.

Scheduled date, time, actual occurrence duration and time zone appear together. The caption retains total remaining work. This fixes the ambiguity where a split task's entire remaining workload appeared beside one shorter scheduled occurrence. Unarranged work is labelled explicitly. Completed tasks retain their completed label during paused preparation.

The five-topic pagination, search, canonical task/session handlers, task naming, demo isolation and existing suspended-drawer/edit-return flow are retained. No storage/schema, engine, timer credit, API, D1, AI, entitlement, dependency or protected Sites-adapter change in this pass. No competitor asset is published in the app.

## Verification

- Final `npm run build`: 56 pages plus 404, preview noindex, PWA `6392004a0ca0fb23`, 62 resources. Existing non-fatal storage chunk advisory remains.
- 24 affected tests passed: planning UI, task details and plan-view model. Includes mixed-type labels, preserving type on completion, excluding omitted work, paused/completed labels, canonical action identities, pagination/search, drawer suspension and split-session duration. The previous full-suite 526 pass predates this refinement; a fresh full suite was not run for these scoped frontend changes.
- Fresh matching preview HTTP verification: 62 route/asset checks, robots, Sitemap and licenses passed.
- `git diff --check` passed.
- Eight principal text colour pairs calculated at 5.72:1–13.17:1. See ignored evidence `planner-learning-colours-2026-11-18/contrast.json`. This does not establish full accessibility acceptance.

Preview: http://127.0.0.1:4346/study-planner?example=prep&view=plans ; process session 13483. Codex opening returned queued, not proof of rendering. The example remains in memory; no real study data was created.

## Visual acceptance remains blocked

The supplied before screenshot was inspected. The installed in-app browser runtime was attempted but did not expose `agent` (`agent is not defined`). No alternative browser or OS capture was used. The root `design-qa.md` records `final result: blocked`: no after screenshot, actual desktop/mobile geometry, visual comparison, focus/keyboard, editor return, primary click-through or console inspection is claimed. Browser comparison must be completed before calling the visual redesign accepted.

Ignored evidence contains final build/tests/HTTP logs and contrast calculations. Future publication still requires rebuilding and checking the entire dirty frontend/Worker tree together, retaining preparation version-2 and old-client guards. No migration is introduced by this pass. Existing independent production-community/moderation/main-promotion gates remain unchanged.
