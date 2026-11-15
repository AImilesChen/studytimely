# StudyTimely V2.10.0 production release

Published on 2026-11-15 at <https://studytimely.com/study-planner>. This supersedes the preceding Planner local-only status, including its alignment refinement. Functional and responsive local acceptance remains documented in `StudyTimely-Planner-Local-2026-11-15.md`.

## Published result

The Planner now has overview metrics, a seven-day strip, daily/weekly/unscheduled/completed views, quick task creation, an expanded editor, separate study dates and deadlines, rescheduling, and linked study timers. Saving reveals the task in its applicable view. Recorded study time remains separate from estimates and completion. The tool board and the complete guide share their outer left and right boundaries. The initial HTML includes 2,903 English guide words, six setup steps, worked examples and eight answered FAQs, with appropriate title, description, canonical and WebApplication/BreadcrumbList metadata.

## Exact source and deployment

- Repository: <https://github.com/AImilesChen/studytimely/tree/v2-google-community>. Existing release branch retained; no main promotion.
- Runtime commit: `48a893f9bc8751984acb2dafb88e9cf0583b2176`.
- Source tree: `725ff84478d1a7cbe16ca8f9f1ae54fcc889f46a`.
- Worker version: `d0ef1bfa-912b-4647-9824-41d6c02968ea`.
- Deployment: `5704f2d7-3615-4c35-b6e6-c72bf8f2fd03`, created `2026-11-15T07:50:56.527646Z`, read back serving 100%.
- PWA: `99794e78553d4dd5`, 61 precache resources.
- Artifact inventory SHA-256: `6b2fe8bbb8058835b621fe559422129f83600f22ab3edf97d49b4d51a942711a`.

Existing GitHub credentials successfully pushed the runtime commit and its preceding documentation commit. Existing Cloudflare credentials were reused. Sandbox credential access required the authorized commands to run outside the restricted process; no new account permission grant occurred. All nine binding names/types match before and after; deployment retained existing variables using `--keep-vars`. No database migration, production record mutation, new resource, dependency, OAuth, analytics configuration or protected adapter change was made. Later documentation commits do not imply another runtime deployment.

## Verification

- Production-mode build prepared 55 pages plus 404; all 173 tests passed with `STUDY_TEST_RELEASE=1`.
- Wrangler preflight, 61 local candidate checks and 61 public HTTP checks passed. The latter cover routes, metadata, canonical, robots, sitemap, assets and licenses.
- 124 public non-MP3 artifacts match exact local SHA-256 hashes. The unchanged licensed MP3 files passed local build/license verification and were not downloaded again. The public guide has 2,903 words, eight FAQs and the expected section IDs/schema. Public PWA version and privacy clarification passed verification.
- The real in-app browser opened the production Planner and returned a DOM snapshot showing the new overview, date strip, quick task form, views, example drafts and detailed guide. It showed zero tasks and zero saved task time in this browser.
- Subsequent viewport/geometry/screenshot and draft-check calls timed out and reset the browser session. Recovery found the production tab (ID16) but reading it also timed out. No production screenshot was saved, and desktop alignment measurements, phone layout, draft interactions, console-log inspection, viewport reset and persistent-tab marking were not verified in production this turn. The corresponding local functional/responsive evidence remains separate; it is not production proof. No Save, timer start, cloud sync, profile, room, message or ranking action was performed in production. A timed-out call may have opened an unsaved example draft; no submission was attempted.

Ignored evidence: `docs/development/evidence/planner-release-2026-11-15/` contains build/tests/preflight/deploy logs, before/after runtime metadata, runtime status, source/artifact inventory, public artifact hashes and public HTTP report. Browser work used only the in-app browser, with no native desktop input or forced PWA update.

## Recovery and remaining independent checks

Rollback Worker: `d0940339-0bf0-495c-a1e0-c0440b151345` (V2.9.0). A code rollback needs no database restoration; it removes the new Planner interface and guide while retaining the existing task schema and saved work. Existing tabs may need to accept the offered update after completing or resetting their current session.

GSC/Bing indexing and GA4/Ahrefs backend receipt were not reverified. Existing external community-review configuration, authenticated production-community acceptance and main-promotion gates remain unchanged.
