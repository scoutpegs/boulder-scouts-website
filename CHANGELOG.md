# Exact change log — Boulder Scout Group website bundle

The site retains the supplied burgundy brand accents, condensed headings, Barlow typography, card system, section identity, root-level file layout and shared navigation/footer. The current header is white with the supplied black Scout emblem and a matching text wordmark; dropdowns are opaque white and sit above page content. Functional edits are targeted around live calendars, evidence-labelled history, responsive behaviour, moderated submissions, article publishing, security, and setup clarity.

## Page and content files

- `index.html` — homepage shell; viewport, SEO/theme metadata, shared navigation/footer, and script references; uses the black horizontal header logo on white.
- `about.html` — history-page shell for sourced timeline.
- `joeys.html` — Joey Scout section-page shell with confirmed-event-only “Coming up” and a rotating section photo album.
- `cubs.html` — Cub Scout section-page shell with confirmed-event-only “Coming up” and a rotating section photo album.
- `scouts.html` — Scout section-page shell with confirmed-event-only “Coming up” and a rotating section photo album.
- `venturers.html` — Venturer section-page shell with confirmed-event-only “Coming up” and a rotating section photo album, including the Venturer-specific social link in shared configuration.
- `calendar.html` — confirmed-event agenda, term selector and section filter; no iframe embed.
- `news.html` — news listing page shell.
- `article.html` — full article page shell, reading the article slug from the URL.
- `share.html` — public photo/story submission shell; pending-review explanation, consent, honeypot, file limits and Turnstile slot.
- `admin.html` — login/review page shell; private actions require server authentication.
- `join.html` — how-to-join page shell.
- `contact.html` — contact page shell; the form creates an email draft rather than claiming to send mail.
- `resources.html` — Scouting resource links page shell.
- `events.html` — state-wide events information page shell.
- `training.html` — leader/youth training links page shell.
- `scoutmap.html` — ScoutMap guidance page shell.
- `privacy.html` — privacy, submission approval and calendar visibility explanation.
- `404.html` — accessible not-found page shell.
- `CNAME` — GitHub Pages custom-domain setting for `boulderscouts.com`.

## Application, API and deployment files

- `site.css` — shared visual system, light header and opaque dropdown layers, responsive timeline/galleries/forms, slideshow controls and reduced-motion styling.
- `site.js` — shared pages, content, nav/footer, confirmed-event lists, term/section filters and history timeline. Parses the five calendar feeds through `/api/calendar`, expands common recurring events, converts UTC timestamps to Australia/Perth, and never generates fallback schedule entries; additive route hooks keep dynamic modules refreshing correctly.
- `site-config.js` — public site configuration, correct group email/hall/social URLs and calendar IDs; no meeting fallback schedule is configured. `apiBase`/Turnstile site key are intentionally blank pending owner setup; no secrets or secret iCal links are included.
- `section-assets.js` — maps supplied section illustrations and logo assets to the section/card UI.
- `home.js` — loads approved-only photo slideshows when the API origin is configured; handles combined homepage photos and individual section albums with pause/play and next/previous controls.
- `calendar.js` — documents the confirmed-event schedule UI; no Google Calendar iframe is embedded.
- `news.js` — keeps article navigation as native shareable URLs; news data is fetched/rendered by the shared site code.
- `article.js` — loads a full article by slug, renders text safely via DOM text nodes, and does not inject unsanitised user HTML.
- `share.js` — submission form behaviour, client-side file validation, Turnstile integration and fail-closed configuration state.
- `admin.js` — admin login, 12-hour session client handling in `sessionStorage`, authenticated previews fetched with the bearer token, approve/reject actions and a full-article publishing form.
- `contact.js` — documents/retains mail-draft contact behaviour without claiming server-side email delivery.
- `worker.js` — Cloudflare Worker API for health checks, a fixed-list public Google Calendar feed proxy, approved-only photos, published news/articles, six RSS feeds, secure submission intake, admin login/session checks, moderation, article publishing, Turnstile and rate limiting. Pending R2 files are not directly public; review previews require an admin session. A schedule enforces 10 approved photos per section as a safety net.
- `schema.sql` — D1 schema for submissions, approved/pending media, articles, hashed admin sessions and rate-limit records, including constraints and indexes.
- `wrangler.toml` — Worker name, D1/R2 binding names, public variables, restricted origins and `0 18 * * *` UTC cleanup trigger. Real D1 ID and API origin are intentionally left for owner configuration.
- `README.md` — primary guide to architecture, setup, API routes and privacy/security boundaries.
- `SITE-PLAN.md` — page inventory, intended experience, navigation, data flows and content lifecycle.
- `HISTORY-SOURCES.md` — history research notes, source URLs and explicit distinctions between published reporting and group-supplied accounts.
- `SETUP-CHECKLIST.md` — ordered owner checklist for GitHub Pages, Google Calendar, Cloudflare, private secrets, moderation and post-launch checks.
- `TEST-RESULTS.md` — validation results and precise blocked/not-tested live checks.
- `WORKER-SMOKE-TEST-LOG.json` — machine-readable output from 26 local mocked Worker route checks; explicitly not evidence of live deployment.
- `CHANGELOG.md` — this file, including the purpose of every file in the archive.

## Supplied logo variants (kept at the root; reusable without moving assets)

- `logo-horizontal-black.svg` — supplied black horizontal logo asset, retained at root; the current header uses `logo-icon-black.svg` plus accessible text for clearer sizing.
- `logo-horizontal-white.png` — white horizontal mark in PNG format.
- `logo-horizontal-white@2x.png` — high-density white horizontal PNG.
- `logo-horizontal-white-on-burgundy.svg` — horizontal logo variant intended for burgundy background use.
- `logo-horizontal-white-on-burgundy.png` — PNG logo variant with burgundy background treatment.
- `logo-horizontal-white-on-burgundy@2x.png` — high-density PNG version of the white-on-burgundy logo.
- `logo-horizontal-white-on-burgundy.webp` — WebP version of that white-on-burgundy treatment.
- `logo-horizontal-black.svg` — black horizontal logo variant, retained as a supplied asset.
- `logo-horizontal-black.png` — black horizontal PNG.
- `logo-horizontal-black@2x.png` — high-density black horizontal PNG.
- `logo-horizontal-burgundy.svg` — burgundy horizontal logo variant.
- `logo-horizontal-burgundy.png` — burgundy horizontal PNG.
- `logo-horizontal-burgundy@2x.png` — high-density burgundy horizontal PNG.
- `logo-horizontal-burgundy.webp` — WebP burgundy horizontal logo.
- `logo-full-unit-white.svg` — white full-unit/crest logo variant.
- `logo-full-unit-white.png` — white full-unit/crest PNG.
- `logo-full-unit-white@2x.png` — high-density white full-unit PNG.
- `logo-full-unit-black.svg` — black full-unit/crest logo variant.
- `logo-full-unit-black.png` — black full-unit/crest PNG.
- `logo-full-unit-black@2x.png` — high-density black full-unit PNG.
- `logo-full-unit-burgundy.svg` — burgundy full-unit/crest logo variant.
- `logo-full-unit-burgundy.png` — burgundy full-unit/crest PNG.
- `logo-full-unit-burgundy@2x.png` — high-density burgundy full-unit PNG.
- `logo-icon-white.svg` — white icon-only mark.
- `logo-icon-white.png` — white icon-only PNG.
- `logo-icon-white@2x.png` — high-density white icon-only PNG.
- `logo-icon-black.svg` — black icon-only mark.
- `logo-icon-black.png` — black icon-only PNG.
- `logo-icon-black@2x.png` — high-density black icon-only PNG.
- `logo-icon-burgundy.svg` — burgundy icon-only mark.
- `logo-icon-burgundy.png` — burgundy icon-only PNG.
- `logo-icon-burgundy@2x.png` — high-density burgundy icon-only PNG.
- `logo-stacked-white.svg` — white stacked logo variant.
- `logo-stacked-white.png` — white stacked PNG.
- `logo-stacked-white@2x.png` — high-density white stacked PNG.
- `logo-stacked-black.svg` — black stacked logo variant.
- `logo-stacked-black.png` — black stacked PNG.
- `logo-stacked-black@2x.png` — high-density black stacked PNG.
- `logo-stacked-burgundy.svg` — burgundy stacked logo variant.
- `logo-stacked-burgundy.png` — burgundy stacked PNG.
- `logo-stacked-burgundy@2x.png` — high-density burgundy stacked PNG.
- `wordmark-white.svg` — white wordmark-only version.
- `wordmark-white.png` — white wordmark PNG.
- `wordmark-white@2x.png` — high-density white wordmark PNG.
- `wordmark-black.svg` — black wordmark-only version.
- `wordmark-black.png` — black wordmark PNG.
- `wordmark-black@2x.png` — high-density black wordmark PNG.
- `wordmark-burgundy.svg` — burgundy wordmark-only version.
- `wordmark-burgundy.png` — burgundy wordmark PNG.
- `wordmark-burgundy@2x.png` — high-density burgundy wordmark PNG.

## Supplied favicon assets (kept at the root)

- `favicon.ico` — browser-tab favicon bundle.
- `favicon.svg` — vector favicon.
- `favicon-transparent.svg` — transparent-background vector favicon.
- `favicon-16.png` — 16 px favicon.
- `favicon-32.png` — 32 px favicon.
- `favicon-48.png` — 48 px favicon.
- `favicon-64.png` — 64 px favicon.
- `favicon-128.png` — 128 px favicon.
- `favicon-180.png` — 180 px Apple touch icon.
- `favicon-192.png` — 192 px web-app icon.
- `favicon-256.png` — 256 px favicon/app icon.
- `favicon-512.png` — 512 px high-resolution icon.
- `favicon-transparent-512.png` — 512 px transparent-background icon.

## Key behaviour changes / safeguards

- The front end uses a fixed-list Worker proxy to read public Google Calendar feeds; no Google Calendar iframe is displayed.
- Home/calendar lists include confirmed events across all five calendars; each section “Coming up” list filters to its own section plus whole-group events.
- No recurring meeting placeholders or guessed dates are generated; empty/private calendars produce an honest status message.
- History content includes a sourced 2018 volunteer-award milestone plus the 2020 pandemic and 2022 Rotary milestones, with evidence-status labels and local archive research links for older group-supplied claims.
- Mobile menu state and Escape handling, opaque white dropdowns, responsive timeline and slideshow reduced-motion rules remain part of the shared design.
- News articles render full text safely; submission stories require review before publication.
- Public photo delivery checks database approval; pending image previews require an expiring session; rejected images are deleted from R2.
- Admin session tokens are hashed server-side, rate limiting and Turnstile fail closed, and no private key/value is placed in frontend config.
- Approval and scheduled cleanup maintain the newest ten approved photos in each section; the code does not run a month-end delete-all job.

## Not changed / owner action required

- No live deployment was performed. D1 ID, Worker origin, private secrets, Turnstile configuration, public calendar visibility, DNS and HTTPS must be configured by the site owner. See `TEST-RESULTS.md` for validation evidence and limits.

## Follow-up frontend polish

- Removed the malformed slideshow pause-button selector, forced dark-mode desktop navigation text to remain readable on the white header, and retested front-end JavaScript syntax.
- Ensured each section album target avoids nested album padding; approved photos are still loaded only from the API, with no decorative/demo images.
- Updated owner checklist wording so it tests confirmed-event cards, not Google Calendar embeds.
- Restored the light header styling and switched the top logo to `logo-horizontal-black.svg`.
- Made desktop dropdown panels opaque white and raised navigation/dropdowns above page content; mobile navigation uses the same readable light treatment.
- Removed public Google Calendar iframe embeds. Confirmed events load through the fixed-list Worker proxy at `/api/calendar`, with Australia/Perth display conventions and truthful empty/error states.
- Removed generated regular-meeting entries from schedule lists; no guessed event dates are shown.
- Replaced static photo grids with accessible rotating, pauseable photo albums powered only by approved `/api/photos` results, with reduced-motion support and an honest empty state.
- Added the Boulder unit logo to the footer and configured the Scouts WA white logo asset as root-level `whitelogo.png`.


## Frontend polish pass — 22 October 2026

- `site.css`: added phone/tablet-responsive spacing and grids, wider small-screen safeguards, calmer hover states, accessible focus states, understated wavy header/section/footer edges, history cards, album styling, and reduced-motion overrides.
- `site.js`: calendar status now includes useful partial-feed diagnostics and direct links to the source calendars; Venturers receives an Instagram profile embed; route content has a restrained entry transition.
- `home.js`: each photo album now includes a Share a photo link and a truthful empty-state message; no demo images are inserted.
- `share.js`: section album links preselect Joeys, Cubs, Scouts or Venturers on the submission form.
- `FRONTEND-POLISH-NOTES.md`: documents the changes and clarifies live calendar and Instagram prerequisites.


## Final responsive/header refinement

- All 19 HTML shells now use a black Scouts emblem plus a responsive text wordmark, avoiding the large transparent whitespace in the older horizontal SVG on phones.
- `site.css` now uses smooth SVG wave edges on the header, hero/section banner and footer, clearer focus/hover treatment, and explicit 320px header tuning while retaining the burgundy style.
- `site.js` avoids repeating the same calendar error sentence directly in the empty list; event dates are still only parsed from live calendar feeds, with no generated meeting schedule.
- `TEST-RESULTS.md` records the latest checks: 12 JavaScript syntax checks, zero CSS parser errors, 8 iCalendar parser cases, 16 viewport/page combinations with no horizontal overflow, mobile keyboard interactions and desktop dropdown stacking.
- The logo/header is visually checked in a Chromium fixture; live calendar permission, Cloudflare services, approved photo data and Instagram embed rendering remain owner/deployment checks.


## Latest refinement — history, dividers and mobile menu

- `site.js`: added a clearer introduction and labelled milestone strip for Our history, moved source-label guidance into a disclosure, and kept all 12 existing timeline entries and all source-status wording. Full-screen mobile navigation now restores focus on close and traps Tab navigation inside the open overlay.
- `site.css`: removed wave-shaped dividers from header, hero, section bands and footer, leaving straight burgundy accents. Improved timeline year chips, card rhythm, history link targets and phone spacing. On screens up to 1000px, the mobile menu fills the full viewport, respects device safe areas, offers a visible fixed Close control and scrolls internally.
- `FRONTEND-POLISH-NOTES.md`, `SITE-PLAN.md`, `TEST-RESULTS.md`: updated to document the current design and latest checks.
- `BROWSER-TEST-RESULTS.json`: current browser fixture covers 11 route/viewport combinations, full-screen navigation across six compact widths, desktop dropdown appearance and no-overflow/no-console-error checks.
