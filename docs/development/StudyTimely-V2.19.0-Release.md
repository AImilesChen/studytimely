# StudyTimely V2.19.0 production release

Published on 16 November 2026 at <https://studytimely.com/study-habit-tracker>. This supersedes the local-only Habit Tracker implementation and post-setup layout refinement. Detailed local interaction evidence remains in StudyTimely-Habits-Local-2026-11-16.md.

## Published behavior

The page supports subject-scoped saved minutes, distinct local learning days, saved sessions and separate self-reported check-ins. Daily and Monday–Sunday weekly goals, planned rest, current/best runs, recent completion fractions, monthly calendar/date details, manual correction/undo and dated rule history are available. Weekly achievement does not mark future dates complete. Legacy unscoped habits continue to accept all subjects. Timer preparation applies the relevant subject, waits for explicit Start and protects unfinished learning. Manual checks do not create learning records or ranking credit.

The overview is a compact desktop strip. A single visible habit fills the row with larger progress and a prominent action; multiple habits retain two columns. Mobile headings, labels and action placement are adjusted for the available width. History starts collapsed: View history selects the habit, opens and scrolls to its native disclosure and focuses its summary. Calendar, dated rules and text alternatives remain inside it.

The initial HTML includes approximately2,662 English guide words and ten complete FAQs covering setup, goal selection, worked examples, evidence accounting, rest/history rules, troubleshooting, backup and manual sync. Revised title/description, canonical, free WebApplication and BreadcrumbList metadata remain indexable. No ratings or search-result guarantees were added.

## Exact runtime

- Repository/branch: <https://github.com/AImilesChen/studytimely/tree/v2-google-community>. Main was not promoted.
- Runtime commit: `dc2eff7af77228c24006f718a9fcc152d6c88ff0`.
- Git tree: `8678e172c9e211326517726aeb07e59fca03f211`.
- Worker version: `4135d4d5-b3e8-40dd-b5db-c3b9d7f23c23`.
- Deployment: `1cd7d722-c312-4b2d-bcfd-08286c7932a8`, created `2026-11-16T07:52:14.836582Z`, read back serving100%.
- PWA: `c014c5d0e7606d05`,62 precache resources.
- Source inventory SHA-256: `7b7843c385d8182d65d33c54b890a31a8012fbe8dba75f52896d59ee52981259`.
- Artifact inventory SHA-256: `86968c99316a2749de04679377349ecc0420cc8a0d8a2485fb45ad6d04ad0896`.

The established existing-credential Git-data API helper synchronized the exact18-file commit/tree without force and independently checked the parent/head. The GitHub connector subsequently read back the same commit/tree and branch contents. Cloudflare --keep-vars preserved all nine binding names/types; plain variables and D1/Durable Object binding definitions were compared before and after.

The prior Cloudflare login had expired. Automatic localhost and device sign-in attempts encountered repeated in-app browser timeouts. The user completed the official device login in the in-app browser, with the same six previously approved scopes. CLI success, the browser's You're signed in page and authenticated runtime reads were observed. No broader permissions or new credentials were requested or recorded in Git. Authorization logs remain ignored.

## Verification and limits

- Fresh release build rendered56 routes plus404. All268 tests with STUDY_TEST_RELEASE=1, Wrangler dry-run and62 candidate HTTP checks passed. The existing bundle-size advisory is nonblocking.
- All62 public HTTP checks passed for route/assets, heading/canonical/indexability, robots, Sitemap and licenses. All125 public non-MP3 artifacts exactly match the release inventory. Five unchanged licensed MP3s retain existing build/license checks and were not downloaded again. All56 pages retain the unified header without legacy navigation bars. Public Habit Tracker guide, ten FAQ answers, section anchors, metadata and current PWA version were verified.
- Actual production in-app browser loaded the new page with zero habits/learning, three editable starters and compact overview. The learning-days starter opened an unsaved draft with measure days, weekly period, target3, all-subject scope and weekday choices. Real title, canonical, index,follow, ten FAQ elements and desktop no-overflow were observed. No production Save or timer action was performed.
- At390×844 the production dialog bounds were x2.5–372.5/y12–832, the48px Save button ended at829px and the document had no horizontal overflow. production-settings-desktop.jpg and production-settings-phone.jpg were saved and inspected. Cancel and viewport reset commands returned successfully.
- Subsequent final desktop/scroll/dialog/reset-state/log/tab-marking verification repeatedly timed out and reset the browser runtime. The last observed viewport was390×844; reset was issued but its final state was not independently observed. No final desktop hero screenshot or new production deliverable-tab mark was completed. Do not substitute local single-card/history screenshots for production acceptance.
- Single populated-card layout, corresponding-habit history, keyboard disclosure, check/undo, actual saved-learning accounting, draft error/cancel, refresh/IndexedDB and unfinished-timer protection remain local acceptance evidence in the earlier handoff. Real authenticated cloud sync, production populated-card history, external moderation/community, analytics backend collection, physical sound/sleep, cross-device time-zone changes and complete accessibility compliance were not exercised by this publication.

Ignored evidence: `docs/development/evidence/habits-release-2026-11-16/` contains build/tests/preflight/deploy logs, candidate/public HTTP results, manifest, exact GitHub synchronization, before/after binding and deployment readbacks,125-file public verification and inspected production screenshots. User data, OAuth/device codes and raw authorization/runtime logs were not added to Git. Later documentation commits do not imply another runtime deployment.

## Data compatibility and recovery

New optional habit scope, planVersion2, dated policies and the days measure are preserved by the shared client/Worker validator. The existing authenticated workspace PUT rejects an older snapshot that would strip modern habit history with UPDATE_REQUIRED; authentication, CSRF and optimistic concurrency remain. Explicit cloud clear remains a separate existing action. No new endpoint or database migration was added.

Update every device before editing or manually syncing these new habits, and retain a current backup. Older clients can reject or drop new local fields/measures; the new server guard cannot protect local edits made by an old frontend or writes to a rolled-back older server. Deploy frontend and Worker together.

Rollback Worker: `34d2bfbc-d825-4fd9-a694-e6ad6224eea1` (V2.18.0). No automatic D1 restore is needed, but the older build's habit-format limitations apply. Avoid editing/syncing modern habits through that old version; retain the newer-format backup. Finish active learning before accepting a PWA update.

No dependency, OAuth implementation, secret values, bindings, paid resources, DNS, protected Sites adapters, legal terms or tracking configuration changed. Existing external-review configuration and independent authenticated community/main-promotion gates remain pending.
