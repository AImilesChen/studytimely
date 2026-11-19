# Focus page controls and guide — local implementation, 19 November 2026

Status: local only; no commit, push or deployment. Production and package remain V2.34.0. Preview: http://127.0.0.1:4306/aesthetic-timer . This revision preserves all earlier unpublished focus, scene and audio work.

## Implemented

The normal sidebar now has a pale blue-grey shell, a clearly blue timer/action card, white task controls and a green environment card. Task labels, active mode, duration units and saved-setup counts are readable. Idle sessions show setup before Start; running/paused sessions show the actual timer and a collapsible read-only summary instead of a disabled form. More settings retains display options. The normal scene dock has Scenes / Music & sounds / Notes; immersive display adds Display. Header spacing now reserves the shared absolute navigation height.

The aesthetic route replaces duplicate global/recovery/inline ownership prompts with one inline notice. Continue here uses the existing canonical claim command, preserving timer ID and intervals and leaving the session paused. Resume remains explicit. Unrelated active tools show a real return link rather than a fake new clock. Memory-error protection and all recording/review guards remain. Other timer routes retain their existing notices and classic FocusGuide content.

Static scenes show Photo scene and Browse moving scenes. The latter opens the scene dialog pre-filtered to the existing two real silent videos. Still images do not expose a nonfunctional motion switch. No new media was generated or downloaded for this revision.

New FocusSpaceGuide is rendered in initial HTML below the normal workspace: three usage steps, four actionable scene/duration suggestions, actual mode comparison, music/setups/notes controls, eight truthful FAQs and three real related-tool links. Suggestions prepare existing scenes and timer settings only, preserve other preferences, disable ambience-on-start and never issue a timer/start/play command. Active sessions prevent applying a replacement timing setup. Sound recommendations remain optional. No health, ranking or subscription availability claims were invented. Title/H1/description reflect the real tool; canonical URL stays /aesthetic-timer. Native FAQ rows have labelled text and library chevrons.

## Verification observed

- Full regression suite: 621 passed. After the final placeholder-contrast/FAQ-chevron refinement, 19 focused tests passed again. This includes SSR states, false-loading-warning absence, starter config purity and canonical claim identity/interval/no-credit guards.
- Final build: 56 pages plus 404, local noindex; PWA 15996cde311f06db / 76 resources. Final 62 HTTP route/asset/robots/Sitemap/license checks passed.
- Initial HTML check: exact title, one H1, description, production canonical, six guide sections, four setup buttons and eight FAQ answers; local robots remains noindex,nofollow.
- Actual in-app browser: 1280x720 and 1440x1000 desktop; 390x844 and 320x740 phones; day/night, scene suggestion, live-filter entry, FAQ expansion, Music dialog/Escape focus return. At 320px, document/body widths306px and comparison table client/scroll widths271px; 390px live-scene dialog client/scroll widths356px. No document content width exceeds viewport. Captured warning/error logs empty.
- Isolated preview origin4307: Afternoon suggestion prepared 50 minutes without starting audio or timer; an empty-task session was started, paused and viewed from a second tab. Only one inline ownership notice appeared. Continue here retained49:34, stayed paused and showed Resume. The unsaved synthetic period was discarded through the canonical Reset confirmation; no task was created and no history was intentionally saved. Test tabs closed and viewport reset.
- No audio playback was used during this task. No audio elements were playing at final inspection.
- Nine sampled text pairs all exceed4.5:1 (minimum4.67:1); contrast.json records exact CSS values. This is a scoped sample, not an accessibility certification.
- git diff --check passed. A temporary new-guide/classic-guide filename collision was detected by regression tests and fixed by using separate FocusSpaceGuide; classic FocusGuide has no content diff.

## Evidence and boundaries

Ignored evidence: docs/development/evidence/focus-page-2026-11-19/ . Key captures: desktop-final.jpg, desktop-other-tab.jpg, desktop-guide.jpg, desktop-faq.jpg, desktop-night.jpg, phone-panel.jpg, phone-modes.jpg. Source user screenshot and rendered after were opened in the same comparison input; the supplied source is a cropped active/foreign-tab state, while desktop-final is an idle Afternoon setup at a different viewport. It is a design critique comparison, not a pixel-clone assertion; foreign-tab behavior has its own actual screenshot.

No dependencies, credentials, permissions, paid resources, billing, database/schema, protected Sites adapters or production data changed in this revision. Earlier media licenses and matching frontend/Worker release requirements still apply. Native fullscreen, subjective listening, physical multi-device sync and independent production community/moderation/main-promotion acceptance are not claimed by this scope.
