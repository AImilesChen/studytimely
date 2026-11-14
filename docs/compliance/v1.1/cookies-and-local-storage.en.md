# Cookies and Local Storage Notice

Effective date: 2026-11-13. Last updated: 2026-11-14.

StudyTimely is operated by mileschen, an individual based in mainland China. Website: [studytimely.com](https://studytimely.com). Contact: [support@studytimely.com](mailto:support@studytimely.com). See our [Privacy Policy](/privacy) for data processing, providers and your rights.

## 1. What these technologies do

Cookies are small pieces of information a browser may send with website requests. Local storage and IndexedDB store information in your browser. Information stored in them is not automatically included in every request, but website scripts may read it. The purpose of a technology matters as well as its name.

## 2. Storage used by the free tools

| Technology and item | Purpose | Duration and controls |
|---|---|---|
| IndexedDB: database `studytimely`, store `local-state`, key `v1` — active timer | Maintain the mode, timing intervals and pause state needed to restore the timer | Until replaced by the next timer state or removed. Finish/reset replaces the active state; saved history is managed separately. Settings → Data → Clear local study data stops and removes the current timer. |
| The same IndexedDB document — study history, tasks, habits, schedules, exam plans, subjects and goals | Show local records, progress and charts | Until you delete them or browser storage is cleared or evicted. No automatic history expiry is configured. Use Study Tracker to delete one record; Settings → Data to export/import a JSON backup or clear local study data. |
| The same IndexedDB document — appearance, sound (including music track, volume and repeat), saved world-clock cities, last-used tool and operational preferences | Apply the choices you request | Until changed or cleared. In Settings → Appearance, turning off Remember preferences on this device resets appearance, sound, saved world-clock cities and clock-display choices on the next visit. Study records, the goal and operational timer settings remain separate. |

| Cache Storage `studytimely-shell-*` and service worker | Public app shell for offline use; no API responses or user records | Replaced on app update or removed through browser website-data controls. |
| `__Host-studytimely-session` (optional HTTPS sign-in) | Necessary random session token; Secure, HttpOnly, SameSite=Lax, Path=/ | Up to 30 days. Sign out revokes it; account deletion revokes all account sessions. |

| `__Host-studytimely-oauth` (Google sign-in) | Necessary browser binding for an OAuth transaction; Secure, HttpOnly, SameSite=Lax, Path=/ | Up to 10 minutes; cleared after callback. Server state includes nonce and PKCE verifier with matching expiry. |
| `__Host-studytimely-registration` (first account setup) | Necessary random browser-bound proof of a verified Google identity; Secure, HttpOnly, SameSite=Lax, Path=/; it does not grant account access | Usable for up to 10 minutes; cleared on completed/cancelled setup or when an expired transaction is revisited. Server records use a hashed token and are cleaned on setup or daily maintenance. |
| sessionStorage `studytimely-room-lease` | Remember which tab controls a server-checked room timer; not an account/session credential | For the tab session. It does not permit access without the authenticated session and CSRF validation. |
| sessionStorage `studytimely-room-invite` | Carry an invitation through sign-in | Used for up to 10 minutes, removed after joining; the invite is stripped from the current page URL. |

No account session token is placed in localStorage, sessionStorage or study backups. Temporary room-control/invitation values serve different purposes and do not sign you in. Study groups and rankings require a network connection and are not included in offline caching.

Saving timer or history information is separate from sending analytics events. We do not treat all browser storage as advertising tracking, or all local storage as automatically exempt from privacy requirements.

## 3. Analytics and advertising

Optional Google Analytics 4 and Ahrefs usage statistics are off by default. Enable them together in Settings → Data → Allow Google Analytics and Ahrefs. No analytics script or measurement is sent by this integration before you enable it; declining leaves the free tools available. Account/private and legal pages are excluded. Hosting and network-security requests remain separate from analytics.

| Item | Purpose | Duration and controls |
|---|---|---|
| IndexedDB setting `analytics` | Remember this browser's optional statistics choice | Until changed or local site data is cleared; excluded from cloud sync. |
| Google Analytics `_ga` / `_ga_*` cookies, only after opt-in | Basic usage and visitor/session measurement | Our tag sets up to 30 days without refreshing that expiry on each visit. Turn the setting off to stop collection and expire this site's analytics cookies. |
| Ahrefs analytics script and requests, only after opt-in | Public tool page visits and basic timer actions | No analytics cookies set by Ahrefs; it uses daily pseudonymous counting. Provider-side retention is separate from browser storage. |

Only approved tool paths without query strings, fragments or referrers and allowlisted timer-mode events are sent. Email, account details, labels, study records and durations are excluded from our payloads. Reopen Settings → Data to withdraw at any time. Withdrawal does not erase prior provider-held data; see our Privacy Policy and the linked provider notices. Advertising storage and personalisation remain disabled.

## 4. Browser controls and deletion

Your browser can block cookies or clear this website's stored data. This may reset settings, remove study records or prevent timer restoration. It does not delete exported files, support emails or cloud snapshots. Manage cloud/account deletion separately in Account. Clearing only cookies may leave local storage or IndexedDB intact; choose the browser's website-data clearing option for those stores.

Open Settings → Data for the export, import and clear controls described above. Clear local study data removes saved sessions, subjects, the daily goal, active timer and saved preferences across this site's tabs in the same browser profile. A stale tab cannot write the cleared session back. Temporary mode, offered if storage is unavailable, instead keeps data only in that open tab and labels its clear action accordingly. Do not clear data you want to keep without first making a backup.

We update this notice when the actual storage or tracking setup changes. Contact our privacy email with questions.

Optional appearance and sound sync includes only the selected presentation preferences when you opt in from Account. Local page-performance readings stay in memory; they are not cookies, persisted records or remote analytics.
