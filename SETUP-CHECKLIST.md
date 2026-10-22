# Boulder Scout Group website — owner setup checklist

Use this alongside `README.md`. The bundle is the complete website source, not a deployed/live site. Do not paste passwords, secret keys, or private calendar subscription URLs into chat, HTML, `site-config.js`, or GitHub.

## A. Publish the website

- [ ] Back up the existing GitHub repository before making changes.
- [ ] Check the latest repository contents at https://github.com/scoutpegs/boulder-scouts-website. This bundle was prepared from the supplied HTML and assets because the public repository view available during preparation exposed only a README; merge carefully if the repository now contains additional work.
- [ ] Unzip the archive and upload its files directly into the repository root. Do not upload the ZIP itself and do not move the files into an assets subfolder.
- [ ] Commit to `main`, then configure **Settings → Pages → Deploy from a branch → `main` → `/(root)`**.
- [ ] Test `https://scoutpegs.github.io/boulder-scouts-website/` before changing DNS.
- [ ] In GitHub Pages settings set the custom domain to `boulderscouts.com`; keep the root `CNAME` file.
- [ ] If using Cloudflare DNS, add apex A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` and `www` CNAME → `scoutpegs.github.io`. Start with apex records DNS-only. Do not change nameservers or edit MX, SPF, DKIM, DMARC, or other email records.
- [ ] Once DNS and certificate status are ready, enable **Enforce HTTPS** and test both apex and `www` URLs.

## B. Confirm the calendars

- [ ] Sign into the Google account that owns the calendars.
- [ ] Review the privacy/child-safety implications before changing public visibility. For each calendar needed on the site, open **Settings and sharing → Access permissions for events** and configure visibility appropriately.
- [ ] Confirm that event titles, locations and attendee details are suitable for public display before publishing any calendar.
- [ ] Visit the homepage, Calendar page, and each Joey/Cub/Scout/Venturer section page. The homepage and main Calendar page should show confirmed-event cards from all five calendars; each section page should show whole-group events plus its section's events. Google Calendar itself should not appear as an embedded frame.
- [ ] If events are absent, check public/event visibility and the deployed `/api/calendar` service. Private or unavailable calendars must show an honest status message, not generated meeting dates.
- [ ] Confirm the timezone is `Australia/Perth`. Schedule lists must contain only events read from the five published calendars; no regular meeting dates are generated when a calendar has no event.

Calendar IDs are configured in `site-config.js`. They are public calendar identifiers, not secret iCal subscription URLs. Do not add private iCal links.

## C. Configure Cloudflare API, database and storage

Use the directory containing `worker.js`, `schema.sql` and `wrangler.toml`.

- [ ] Install Node.js LTS and Wrangler, then authenticate with `npx wrangler login`.
- [ ] Create D1: `npx wrangler d1 create boulder-scouts`.
- [ ] Replace `REPLACE_WITH_REAL_D1_DATABASE_ID` in `wrangler.toml` with the database ID reported by Wrangler.
- [ ] Create R2: `npx wrangler r2 bucket create boulder-scouts-photos`. Keep the bucket private; do not enable public bucket access or an R2 public domain.
- [ ] Initialise D1 once: `npx wrangler d1 execute boulder-scouts --remote --file=./schema.sql`.
- [ ] Verify `wrangler.toml` uses D1 binding `DB` and R2 binding `MEDIA_BUCKET` exactly as the Worker code expects.
- [ ] Deploy the Worker `boulder-scouts-api` with `npx wrangler deploy`. Record the exact `workers.dev` origin shown by Wrangler.
- [ ] Set `API_PUBLIC_URL` in `wrangler.toml` to the real Worker origin with no trailing slash, then redeploy. Set `apiBase` in `site-config.js` to the same public origin with no trailing slash.
- [ ] Create a Turnstile widget for `boulderscouts.com` and `www.boulderscouts.com` (and the real GitHub Pages test origin only if required). Put only the public **site key** into `site-config.js` as `turnstileSiteKey`.
- [ ] Keep `ALLOWED_ORIGINS` limited to the actual apex domain, `www` domain, GitHub Pages testing origin, and local development origins only when needed. Never use wildcard CORS on protected endpoints.

### Set these four secrets privately in Wrangler

Run each command and enter the value in Wrangler's private prompt; do not add values to a file or send them in chat:

```sh
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_SESSION_SECRET
npx wrangler secret put RATE_LIMIT_SALT
npx wrangler secret put TURNSTILE_SECRET
```

Use a strong, unique password and long random values for the session secret and rate-limit salt. Store recovery details in the group's approved password manager. `TURNSTILE_SECRET` is the secret key; the Turnstile **site key** is public and belongs in `site-config.js`.

- [ ] After configuring bindings, variables and secrets, verify `https://<real-worker-origin>/api/health`. Confirm `ok` is true and every item in the `configured` object is true before enabling submissions and admin use.
- [ ] Test the share form. It must remain disabled when its public API/site-key configuration is absent, and the server must reject submissions if Turnstile verification is missing or fails.
- [ ] Submit a test photo and story. Check that they are pending and not publicly reachable before approval.
- [ ] Sign into `admin.html`, view the private pending previews, approve one test submission, and reject another. Verify that approved content appears in the intended page/feed and rejected photo files return not found.
- [ ] Publish a test article. Confirm the news headline opens a full article at `article.html?slug=...`.
- [ ] Confirm the retention limit keeps the 10 newest approved photos per section and never deletes old news articles.

## D. Post-launch checks

- [ ] Test every page, navigation dropdown, footer link, social link and contact link.
- [ ] Test mobile widths 320, 360, 375, 390, 430, 768 and 1024 px, plus desktop. Confirm no horizontal page scrolling, clipped controls, distorted logos, or hidden content. Open/close the mobile menu with touch and keyboard; confirm Escape and link selection close it and `aria-expanded` updates.
- [ ] Test the event cards and empty/error states on phones. No Google Calendar iframe should be displayed.
- [ ] Test `/api/health`, photo/news APIs, all six RSS routes, admin expiry, review actions, and approved/rejected image access.
- [ ] Check RSS XML syntax, article links, publication dates, and enclosure URLs after `API_PUBLIC_URL` is set.
- [ ] Verify GitHub Pages custom domain, `www`, and HTTPS. Leave email-related DNS records untouched.
- [ ] Record actual deployment URLs and results in the group's maintenance notes. Do not describe an endpoint as live until you have verified it after deployment.

## Intended public/private boundary

**Public:** HTML/CSS/JavaScript, root logo/favicon assets, the five public Google Calendar identifiers, the public Turnstile site key, the deployed API base URL, approved photos/stories/articles, RSS output, and the contact email/address.

**Private:** `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `RATE_LIMIT_SALT`, `TURNSTILE_SECRET`, expiring admin session tokens, unapproved files and submissions, submitter email addresses and rate-limit records. R2 stays private; public image delivery is gated by the database's approved status.

## Calendar and footer assets

- [ ] Set each of the five Boulder group calendars to public visibility in Google Calendar (only if the owner is comfortable sharing the event details publicly).
- [ ] Deploy the updated Worker, including `GET /api/calendar`, and verify the endpoint returns calendar feeds or clear per-calendar visibility errors.
- [ ] Upload the Scouts WA white logo at the repository root as `whitelogo.png`. The footer also uses `logo-full-unit-white.svg` for the Boulder Scout Group unit logo.
- [ ] Confirm each section's 'Coming up' list shows published events only; no repeating placeholder meetings are generated.

## Test the visible schedule and albums

- [ ] Confirm `GET /api/calendar?calendars=whole,joeys,cubs,scouts,venturers` returns public feed data only for calendars that are actually public.
- [ ] Test `calendar.html` plus each section page: events should appear as cards in “Coming up” without an embedded calendar frame. Empty or private feeds must show a message, never guessed meetings.
- [ ] Add/approve at least one authorised test photo per section to verify each rotating album, pause/play, next/previous, alt text and the combined homepage slideshow. Remove the test photos after checking.
- [ ] Upload `whitelogo.png` to the repository root for the Scouts WA white logo in the footer.


## Calendar display troubleshooting (read before testing)

The site intentionally displays a live event list rather than a Google Calendar iframe. Deploy `worker.js` first, then put the real Worker origin (no trailing slash) in `site-config.js` as `apiBase`. The five `GET /api/calendar?calendars=...` feeds are fetched by that Worker. Check the on-page status message: it now identifies calendars that the Worker cannot read. If a calendar is privately shared, the public `.ics` feed will not be available. For a public-facing youth calendar, review the privacy of event titles, locations, attendees and notes before making it public. If those details should remain private, do not enable public access; use an authenticated server-side Calendar API connection and return only the event fields approved for publication. Google’s current sharing guide: https://support.google.com/calendar/answer/37082?hl=en

## Venturer Instagram embed

The Venturers page uses Instagram’s profile embed for `@boulder_venturers`; it has a direct profile-link fallback. Instagram content is third-party and may be blocked by privacy extensions or account embed settings.
