# Privacy Policy

Effective date: 2026-11-13.

## 1. Who is responsible

StudyTimely at [studytimely.com](https://studytimely.com) is operated by mileschen, an individual based in mainland China (“we”, “us”). Privacy and support contact: [support@studytimely.com](mailto:support@studytimely.com).

This policy covers our free browser-based timers and local study records. You do not need an account. Using the website is not consent to optional tracking.

## 2. Your study data stays in your browser

Active timer state, study-session dates and durations, subject labels, goals and preferences are stored in your browser using IndexedDB. Anonymous use does not upload this database. Signing in alone does not upload records. Choosing Sync now merges saved sessions, subjects, goals, tasks, habits, schedules and exam progress with a private cloud snapshot. The active timer and analytics choice stay on this device. If you explicitly select Include and apply appearance and sound settings during sync, those selected preferences are also included in the cloud snapshot; they do not start audio automatically. JSON import reads a file locally; export downloads a file to your device.

Other people using the same browser profile may see these records. Avoid putting your full name, school, address, health information or other sensitive details in subject labels or messages.

StudyTimely provides optional Google sign-in and manual cloud sync, with email recovery for existing unlinked accounts. It has no payments or AI study feature. Optional study groups, community nicknames and member chat are described below. The free local tools do not require an account. Optional usage statistics are off by default. Google Analytics and Ahrefs load only after you enable them in Settings → Data; no advertising or remote error-reporting SDK is enabled.

## 3. Website requests and support messages

Visiting the site sends technical information to our hosting provider, Cloudflare, so it can deliver and protect the site. This can include your IP address, requested URL, request time, browser information and HTTP headers. Do not put private information in website URLs. Our application does not maintain its own visitor-request database, and persistent Workers application logging is disabled. Cloudflare may process security and operational information under its own service practices; this does not give it your local study-history database.

If you email us, we receive your email address, message, attachments and related delivery information to answer your enquiry or handle your request. You choose what to send. We do not need a complete study-history export or identity documents to answer a general question.

## Optional accounts and cloud sync

Google sign-in requests your OpenID identity and verified email, not access to your Google files, contacts or calendar. We store your stable Google subject identifier, email and account creation time. We do not use Google names or photos as public community profiles. Google processes the sign-in under its own privacy practices. Existing email accounts can use a one-time code to recover access and explicitly link the same verified Google email while signed in; matching emails alone do not merge accounts. During OAuth, a browser-bound state, nonce and PKCE transaction expire after ten minutes. If you use existing-account email recovery, the account service processes your email address to deliver a one-time code. Codes expire after ten minutes, allow at most five attempts, and are stored as keyed hashes. Rate-limit records use keyed hashes of email or network addresses with expiry. Account records contain an email, creation time and hashed session tokens. Sessions last up to 30 days unless revoked by sign-out or account deletion.

Cloudflare D1 stores private accounts and cloud snapshots in an EU-jurisdiction database. Cloudflare Email Service delivers sign-in mail. Website requests and mail may still use international infrastructure. The operator may access account information from mainland China to handle support and security requests. Optional accounts are available to users aged 16 and over; anonymous tools are intended for ages 13 and over.

Sync is an explicit choice. Snapshots support up to 1 MiB; use JSON backup for larger histories. Sync keeps deletion markers and checks cloud versions to avoid silent overwrites. In Account you can download a cloud backup, export account data, clear the cloud snapshot, sign out or delete the account and all its sessions. Local records and downloaded files remain separate. Account and cloud data remain until you delete them or we need to restrict an account for security or legal reasons. Deletion removes them from the active database. Provider recovery copies may remain for up to 30 days and are not used as active accounts. Expired codes, sessions and rate-limit records cannot be used after expiry and are removed during subsequent sign-in housekeeping. If a recovery copy is restored, applicable deletion requests must be reapplied.

## Optional study groups, chat and rankings

Participation is for users aged 16 and over and requires a Google-linked account plus explicit acceptance of the community rules. Anonymous visitors may browse public rooms and opted-in global rankings. Choose a nickname without your name, school, contact details or precise location. Public rooms expose their name, host nickname, member nicknames, online indicators and verified room-time totals to visitors. Private rooms require a valid invitation to join and member access to view; keep invitation codes confidential. Closing invitations or replacing the code prevents new joins but does not remove existing members. Room visibility cannot be changed from private to public.

Members can read room chat. Chat is text only, collapsed by default and hidden while your room timer runs. Members can report messages or hide another member's messages from their own chat view. Authors can delete their messages; room owners can hide messages, mute/remove members and close rooms. Authorised platform moderators can review reported excerpts and take action; reports about a room owner are withheld from that owner. Moderators are not promised to be continuously available. Contact support for an urgent privacy concern; do not share sensitive information in chat. A report retains its reason, optional details and a message excerpt for review, even if the original message or author account is deleted.

Your Google email and identifier are not published in room lists or rankings. Each room timer sends start/pause and periodic connection checks to the server. Server-checked intervals produce private account and room-time records; imported/local records do not affect community scores. Room members see room contributions even when you decline global rankings. Public global rankings are off by default. Opting in publishes your nickname and verified total from all rooms, including private rooms, for the selected UTC day/week or current streak; it does not reveal private room names. Opting out hides current global results and removes saved public-rank history; private verified records remain until expiry or account deletion. Rules describe the connection-gap, check-in and daily caps; these do not prove attention or eliminate every form of cheating.

Community profiles, rooms and memberships remain until deleted with the account or room. Leaving a room stops member access; prior contributions can remain in room totals. Closing a room stops timers and new messages/joins, but keeps retained records for its owner to review. Author account deletion removes that account's profile, messages, memberships, scores, and owned rooms. Other participants' independent aggregate time can remain after an owned room is removed. Report excerpts may remain for moderation for up to 90 days. Chat is excluded from member views after 30 days; daily cleanup removes expired chat/credit-detail records after 30 days, reports after 90 days, and daily totals/rank snapshots after 365 days. Cleanup timing can add up to one daily maintenance interval. Ordinary cloud/local JSON backups are separate from community records; Account → Export account data includes your own community data.

D1 stores community records alongside account data in the EU-jurisdiction database. Cloudflare Durable Objects/WebSockets coordinate live room connections; connection identifiers and metadata can be processed on international edge infrastructure. The operator and authorised moderators may access relevant records, including reported text, from mainland China. Optional analytics is excluded from study-group and leaderboard pages; community text, nicknames and invitation codes are not analytics payloads.

## Optional usage statistics

You can enable Google Analytics 4 and Ahrefs Web Analytics together in Settings → Data → Allow Google Analytics and Ahrefs. The choice is off by default and stays on this browser; it is not included in cloud sync. Declining or withdrawing does not restrict the free tools. Enabling it permits the providers to receive visits to public tool pages and basic timer actions (start, pause and saved-session events with a timer-mode label), along with request/device information such as IP address, browser, language and screen dimensions. Providers may derive approximate location from network information.

We send only approved public tool paths, without URL queries, fragments or referrers. We exclude account and legal pages, email, custom subject/task/chapter labels, record contents, study durations and identifiers from our event payloads. The analytics context is removed on account/private-page navigation. Google Signals, advertising personalisation and user-provided-data collection are disabled in our tag configuration. We use the verified GA4 measurement ID directly and do not also load a Tag Manager container.

Google Analytics can use first-party `_ga` and `_ga_*` cookies. Our tag sets their expiry to 30 days without extending it on each visit. Ahrefs describes its analytics as cookieless, with daily pseudonymous counting rather than a persistent cross-day visitor ID; this does not mean no information is processed. See [Google's partner-site information](https://policies.google.com/technologies/partner-sites), [Ahrefs Web Analytics data practices](https://help.ahrefs.com/en/articles/10247870-about-ahrefs-web-analytics) and [Ahrefs' privacy policy](https://ahrefs.com/legal/privacy-policy).

Turning the setting off removes the analytics context, stops further collection by this integration and expires this site's Google Analytics cookies. It does not erase measurements already received by providers. The GA4 property currently retains event-level data for 2 months and user-level data for 14 months, with user retention reset by new activity. These controls do not apply to most aggregate standard reports. Ahrefs records follow its provider retention practices. Contact us about applicable access or deletion rights. We do not promise that aggregate reports can be linked back to an individual. Providers may process analytics internationally; analytics data is not confined to the EU account database described above.

## 4. Providers and disclosures

Cloudflare, Inc. and its service infrastructure provide website hosting and network security. Support email is handled through our self-hosted Agentic Inbox on Cloudflare: Workers and Email Service handle delivery, Durable Objects store messages, and R2 stores attachments. The email client includes AI-assisted tools for handling correspondence. These tools are separate from the timers and cannot automatically access your browser's study-history database. Please avoid sending sensitive information in support messages.

See [Cloudflare's privacy policy](https://www.cloudflare.com/privacypolicy/) for its own practices. Our providers process information needed to operate these services. Information may also be disclosed where required by law or necessary to handle a lawful claim. We do not sell personal information or share it for cross-context behavioural advertising.

We do not acquire a right to publish your records or use a support message as a testimonial merely because you use the service or contact us.

## 5. Why information is processed

We use information only to provide the functions you request, deliver and secure the website, answer enquiries and meet applicable legal obligations. Where UK or EEA data protection law applies, we rely on performance of the requested service where necessary, legitimate interests in operating a reliable and secure service and responding to enquiries where appropriate, or a legal obligation. We balance those interests against your rights. We rely on your consent for optional usage statistics. Neither analytics provider is loaded before you enable the setting. You can withdraw through Settings → Data without losing access to the free tools.

The rules for storing information on your device are assessed separately from the legal basis for processing personal information. Accepting our Terms is not permission for unrelated data uses.

## 6. Retention and deletion

Local records remain until you delete them or your browser clears or evicts them. There is no automatic history expiry. Private browsing, storage restrictions, device loss or a browser change can make data unavailable. Local storage is not a guaranteed backup.

Open Settings → Data to export or import a JSON backup, or clear local study data. Clearing stops the active timer and removes saved sessions, subjects, the daily goal and preferences across this site's tabs in the same browser profile. You may also delete individual sessions in Study Tracker. A JSON backup also includes tasks, habits, schedules and exam plans. An ordinary local backup excludes the active timer, account session and appearance preferences; a cloud snapshot may include appearance and sound settings when you explicitly select that option. CSV exports saved study sessions and linked task/chapter labels. Import merges records by ID and keeps an existing daily goal.

Clearing browser data does not delete downloaded files, device backups, support emails or provider-held technical records. We cannot remotely recover or delete records held only in your browser.

Support messages and attachments are kept while needed to handle the enquiry, follow-up, security concerns or legal claims, and then removed when no longer needed. The mailbox has no automatic expiry, so deletion is handled by the operator. You can request deletion at the contact address above, subject to applicable retention obligations. Provider-held operational and security data follows the provider's retention practices; disabling our application logs does not delete those records.

## 7. International processing

The operator is based in mainland China and may access support correspondence there. Cloudflare uses international infrastructure, so technical request information and email may be processed outside your country, including in the United States and other countries where it operates. We do not promise storage exclusively in any one country. Browser-only records stay on your device unless you choose to export, send or sync them. Optional sync is a separate transfer and is never required for anonymous tools.

Contact us for information about the processing of a particular support request and applicable transfer safeguards. Where applicable law requires safeguards, additional notice or consent, those requirements apply separately; this notice does not itself replace them.

## 8. Your choices and rights

You can manage local data with the controls above or your browser's website-data settings. Blocking storage may prevent history, saved preferences or recovery from working; the app offers a labelled temporary mode if persistent storage is unavailable.

Depending on applicable law, you may request access, correction, deletion, portability or restriction of personal information we hold, object to processing based on legitimate interests, or withdraw consent where we rely on it. Withdrawal does not affect earlier lawful processing. Contact [support@studytimely.com](mailto:support@studytimely.com). We may need proportionate information to locate the relevant correspondence and verify the request, and will respond within applicable legal time limits.

You may complain to a competent data protection authority. UK visitors can contact the [Information Commissioner's Office](https://ico.org.uk/make-a-complaint/); EEA visitors may contact the authority in their country of residence, work or the alleged infringement. This does not limit other complaint channels available under local law.

## 9. Age and children's privacy

StudyTimely is intended for users aged 13 and over. No account is required, and we do not verify each visitor's age. If you are under 13, please do not use the service or send us personal information. Users below the age of legal adulthood should review this policy with a parent or guardian. Additional protections or parental consent may be required under applicable law. Optional accounts and cloud sync are available only to users aged 16 and over; younger visitors should use the anonymous local tools. We do not collect dates of birth for those tools. Users below legal adulthood must obtain parental permission where required by applicable law.

Parents or guardians can contact our privacy email with a concern. We will assess it and stop processing or delete information where required by applicable law.

## 10. Security and updates

We use HTTPS and restrict access to our support mailbox. No website or storage system is completely secure. Protect shared devices and exported backups.

We will update this policy when relevant practices change and display the effective date. Material changes will receive appropriate notice. An updated notice alone does not authorise new processing that requires prior consent or another legal step.

Page-performance measurements (LCP, INP and CLS) are computed locally in the current tab’s memory. They are not uploaded or persisted and do not create a visitor identifier.
