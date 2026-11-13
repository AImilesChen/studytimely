# Cookies and Local Storage Notice

Effective date: 2026-11-13.

StudyTimely is operated by mileschen, an individual based in mainland China. Website: [studytimely.com](https://studytimely.com). Contact: [support@studytimely.com](mailto:support@studytimely.com). See our [Privacy Policy](/privacy) for data processing, providers and your rights.

## 1. What these technologies do

Cookies are small pieces of information a browser may send with website requests. Local storage and IndexedDB store information in your browser. Information stored in them is not automatically included in every request, but website scripts may read it. The purpose of a technology matters as well as its name.

## 2. Storage used by the free tools

| Technology and item | Purpose | Duration and controls |
|---|---|---|
| IndexedDB: database `studytimely`, store `local-state`, key `v1` — active timer | Maintain the mode, timing intervals and pause state needed to restore the timer | Until replaced by the next timer state or removed. Finish/reset replaces the active state; saved history is managed separately. Settings → Data → Clear local study data stops and removes the current timer. |
| The same IndexedDB document — study history, tasks, habits, schedules, exam plans, subjects and goals | Show local records, progress and charts | Until you delete them or browser storage is cleared or evicted. No automatic history expiry is configured. Use Study Tracker to delete one record; Settings → Data to export/import a JSON backup or clear local study data. |
| The same IndexedDB document — appearance, sound, last-used tool and operational preferences | Apply the choices you request | Until changed or cleared. In Settings → Appearance, turning off Remember preferences on this device resets appearance, sound and clock-display choices on the next visit. Study records, the goal and operational timer settings remain separate. |

| Cache Storage `studytimely-shell-*` and service worker | Public app shell for offline use; no API responses or user records | Replaced on app update or removed through browser website-data controls. |
| `__Host-studytimely-session` (optional HTTPS sign-in) | Necessary random session token; Secure, HttpOnly, SameSite=Lax, Path=/ | Up to 30 days. Sign out revokes it; account deletion revokes all account sessions. |

No session token is placed in localStorage or study backups.

Saving timer or history information is separate from sending analytics events. We do not treat all browser storage as advertising tracking, or all local storage as automatically exempt from privacy requirements.

## 3. Analytics and advertising

This release does not load advertising trackers or optional analytics tools, and anonymous use sets no application cookie. Optional sign-in uses the necessary session cookie described above. The IndexedDB storage above supports the timer and the preferences and records you choose to save. Hosting and network-security processing by Cloudflare is described in our Privacy Policy; browser storage and network processing are separate.

If optional tracking is introduced, we will update this notice and provide the required choice before activation. Declining optional tracking will not prevent use of the basic timer.

## 4. Browser controls and deletion

Your browser can block cookies or clear this website's stored data. This may reset settings, remove study records or prevent timer restoration. It does not delete exported files, support emails or cloud snapshots. Manage cloud/account deletion separately in Account. Clearing only cookies may leave local storage or IndexedDB intact; choose the browser's website-data clearing option for those stores.

Open Settings → Data for the export, import and clear controls described above. Clear local study data removes saved sessions, subjects, the daily goal, active timer and saved preferences across this site's tabs in the same browser profile. A stale tab cannot write the cleared session back. Temporary mode, offered if storage is unavailable, instead keeps data only in that open tab and labels its clear action accordingly. Do not clear data you want to keep without first making a backup.

We update this notice when the actual storage or tracking setup changes. Contact our privacy email with questions.

Optional appearance and sound sync includes only the selected presentation preferences when you opt in from Account. Local page-performance readings stay in memory; they are not cookies, persisted records or remote analytics.
