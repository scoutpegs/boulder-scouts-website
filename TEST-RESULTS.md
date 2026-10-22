# Boulder Scout Group website — validation report

**Revision checked:** 22 October 2026 (Australia/Perth). **Deployment status:** not deployed. Browser tests use an in-memory copy of the actual HTML/CSS/JavaScript so they can run in this environment without a local web server. They are not a substitute for checking the deployed domain and real services.

## Results

| Check | Result | Notes |
|---|---|---|
| JavaScript syntax | **PASS — 12 files** | `node --check` passed for all site scripts and the local calendar parser test harness. The parser harness is a validation aid and is not included in the website release ZIP. |
| CSS parsing | **PASS** | 294 CSS rules parsed; zero stylesheet parser errors. |
| HTML shells | **PASS — 19 pages** | Every page has a viewport declaration, the shared header/footer, and the updated header brand lock-up. Local static asset references exist except the deliberate owner-supplied `whitelogo.png`. |
| D1 schema | **PASS — local SQLite** | `schema.sql` executed against a temporary in-memory SQLite database. No Cloudflare account was accessed. |
| Calendar parser | **PASS — 8 local tests** | Checks recurring Wednesday dates, section key, local meeting start/end, all-day events, cancellations, exception dates and UTC-to-Perth conversion. The tests use sample iCalendar input, not the live Boulder feeds. See `CALENDAR-PARSER-TEST-LOG.json`. |
| Responsive browser fixture | **PASS — 11 page/viewport combinations plus menu/dropdown checks** | The current follow-up fixture checks home at 320, 360, 375, 390, 430, 768, 1024 and 1280px and Our history at 320, 390 and 1280px. No horizontal document/body overflow was measured; the header logo loads. See `BROWSER-TEST-RESULTS.json`. |
| Mobile menu | **PASS — full viewport** | At widths 320, 360, 375, 390, 430 and 768px, the menu opened to the full viewport, set `aria-expanded=true`, showed a Close control, locked body scroll and closed on Escape. Tab focus is kept inside the open navigation. |
| Desktop dropdown | **PASS** | Browser-computed style was opaque white (`rgb(255, 255, 255)`), visible on hover and stacked at z-index 3004. |
| Console/page errors in local browser fixture | **PASS — none recorded** | The Instagram script request is deliberately blocked in the offline browser test; its live third-party rendering is not tested. The profile link fallback remains in the page. |
| Header and divider finish | **PASS — browser fixture** | The supplied black horizontal logo loads, header and footer accents are straight burgundy rules, and the decorative wave edges are removed. Timeline cards/source labels and reduced-motion overrides render without browser errors. |
| Worker route tests | **PASS — 26 mocked checks** | Existing `WORKER-SMOKE-TEST-LOG.json` documents local mocked checks for health, photo/news API routes, six RSS routes, moderation/security checks and CORS. These checks do not exercise live bindings. No Worker code changed during this final visual-only pass. |
| RSS XML | **PASS — local samples** | Six local sample RSS responses parsed as XML. Deployed route URLs and real item data remain unverified. |
| Photo albums | **PASS — source and UI checks** | Homepage combined album and all four section album targets are present. Albums request approved photos through the API, offer slide navigation/pause, and provide section-specific photo submission links. They intentionally show an honest setup/empty state until approved photos and the live API are available. |
| Venturer Instagram | **PARTIAL — markup/fallback checked** | The profile embed markup and direct `@boulder_venturers` link are present. Actual rendering depends on Instagram being available and the account’s public/embed settings; the real third-party request was not tested. |
| Confirmed events / Google Calendar | **BLOCKED — live API not configured** | The frontend reads `GET /api/calendar` from the configured Cloudflare Worker, but `site-config.js` `apiBase` is intentionally blank until the owner deploys the Worker. The browser fixture confirms the no-placeholder empty state; it does not prove the five live calendars are readable. |
| Cloudflare Worker, D1, R2, Turnstile, submissions and admin | **NOT LIVE-TESTED** | Requires the owner’s real Cloudflare resources, private secrets, deployed Worker origin and API configuration. Do not paste secrets into chat or commit them to GitHub. |
| Custom domain, DNS and HTTPS | **NOT LIVE-TESTED** | Requires GitHub Pages/domain access and DNS verification. Existing email DNS records must be left untouched. |

## Why events may exist in Google Calendar but not appear here

The website deliberately shows a compact “Coming up” event list instead of a Google Calendar iframe. Its browser client fetches `GET /api/calendar` from the Cloudflare Worker; it does not read Google’s iCalendar feed directly from the browser. `site-config.js` has `apiBase: ''` until the real Worker origin is available, so the calendar loader remains in its not-connected state. After Worker deployment, configure `apiBase` to the real Worker origin (no trailing slash), then verify `/api/calendar?calendars=whole,joeys,cubs,scouts,venturers`. Each feed must be readable by the Worker. Google’s instructions say a public calendar can be shared with other applications and websites, but review privacy/child-safety implications before making youth event details public: https://support.google.com/calendar/answer/37083?hl=en-CA. If the event details should not be public, use authenticated server-side access and only return the fields approved for public display; never place secret iCal URLs in browser code.

## Remaining owner actions

1. Upload the approved Scouts WA white logo as `whitelogo.png` at repository root.
2. Deploy and configure Cloudflare D1, private R2 bucket, Turnstile and the Worker; set private secrets in Cloudflare/Wrangler only.
3. Put the actual Worker origin into `site-config.js` `apiBase`, and set `API_PUBLIC_URL` privately/publicly as described in `SETUP-CHECKLIST.md` (the value is an origin, not a secret).
4. Verify the five live calendar feeds and confirm that public titles/locations are appropriate for youth privacy.
5. Add and approve one authorised test photo for each section, verify all slideshows/RSS, then remove those test images.
6. Test the published domain, forms, moderation, feeds, mobile interactions and HTTPS with live services before announcing launch.

A local or mocked pass is not a deployment pass. This bundle does not claim the website is online, that real photo uploads succeed, or that real calendar data currently appears.


## Latest history/menu refinement — 22 October 2026

- Reworked the `Our history` introduction with an editorial-style intro panel and three explicitly labelled, evidence-grounded milestones. Moved guidance about source labels into an expandable disclosure while preserving all 12 timeline entries and the existing source caveats.
- Improved year labels, card spacing, source badges, link touch targets and phone reading rhythm.
- Removed wave-shaped header, hero, section and footer dividers; straight burgundy accent rules remain.
- The mobile menu is full-viewport at 320, 360, 375, 390, 430 and 768px. Browser checks confirm the overlay matches viewport width/height, the Close button is visible, scroll is locked, Escape closes it, and no page errors or horizontal overflow were observed.
- Live calendars, uploads/moderation, Instagram’s remote content, Cloudflare deployment and the custom domain remain unverified/blockers as described above.
