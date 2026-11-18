# Study calendar — local revision, 18 November 2026

The Overview activity calendar is now an expanded month view with Monday–Sunday columns, recorded duration on included dates, and an inline selected-day panel. It replaces the collapsed selected-dates heatmap; the independent Records annual calendar is unchanged.

The month initially follows the end of the applied report range. Dates outside that range are labelled outside the report, not assigned invented zeroes. Selecting a past outside-range date, View month, or a month arrow applies that calendar month globally while retaining subject and mode filters. The current month ends at today; future dates are disabled. Previous comparisons use the previous calendar month. Report totals and calendar details share the existing time-zone-aware clipped recording model.

The day panel shows exact recorded time, subjects, and up to three session previews. View day records opens the existing Records drilldown. Empty days offer a navigation link to the study timer, without automatically starting it. Mobile duration labels explicitly use a plus sign for shortened hour values; full values remain in labels and details. The storage footer now has a short storage status and compact backup/manual-sync links, with the example backup action disabled.

Files: StudyCalendar.jsx, study-calendar.mjs, StudyAnalytics.jsx, study-analysis.mjs, study-analytics.css, TrackerGuide.jsx, and study-calendar.test.mjs.

Validation completed:

- Production-style local preview build: 56 prerendered routes plus 404, noindex; PWA b7df9070cbebb345, 62 resources.
- 36 related tests passed: calendar, analysis, charts and tracker page rendering. Includes leap years, month boundaries, report-range scope, cross-midnight clipping and half-hour time zones.
- Component server rendering passed for month, selected-week and empty-data states, with no React warnings.
- 62 local HTTP route/asset checks, robots, Sitemap and licenses passed.
- git diff --check passed.

Evidence logs are in ignored docs/development/evidence/study-calendar-2026-11-18. No actual browser screenshots, clicks, keyboard or viewport acceptance were performed because in-app browser tools are unavailable; no native-browser substitute was used.

Preview: http://127.0.0.1:4310/study-tracker?example=1 (isolated illustrative data, no saved edits). All changes remain uncommitted, unpushed and undeployed. Production/package remains V2.30.0. Preserve preceding analytics and group-access changes; whole-tree publication still requires their separate Worker/migration and release procedures. No dependency, storage schema, remote service, payment or production configuration changes in this revision.
