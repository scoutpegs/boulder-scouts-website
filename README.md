# Boulder Scout Group Website — Updated Bundle

This is a root-level GitHub Pages website with the existing Boulder Scouts design retained from the supplied `index.html`, its original section illustrations and styling system, plus a Cloudflare Worker API for moderated photos/stories and news. The website is **not deployed by this ZIP**. Cloudflare bindings, credentials, Turnstile and Google Calendar visibility require the owner to finish setup.

## First, know what is public and what is private

- `index.html`, the other `.html` pages, `site.css`, `site.js`, `site-config.js`, the logo files and `CNAME` are public website files. Never put passwords, Cloudflare secrets, private admin tokens or secret calendar iCal URLs in them.
- The five calendar IDs in `site-config.js` are public calendar identifiers. Confirmed events are retrieved by the fixed-list Worker endpoint `GET /api/calendar`; the website does not embed Google Calendar. A calendar must be made public for this endpoint to read its events.
- `worker.js`, `schema.sql` and `wrangler.toml` are the API implementation and deployment config. `wrangler.toml` intentionally contains a placeholder D1 ID until you create the database.
- Cloudflare Worker **secrets** must be set privately with `npx wrangler secret put ...`; do not ask people to paste secrets into the website or chat.
- Public photo/story submissions remain pending. Only an authorised admin can approve them. R2 should remain private; public media is served only by `/api/media/<id>` after the database marks it approved.

## Setup checklist

### 1. Publish the static website to GitHub Pages

1. Download and unzip this archive. Keep all website files together in the repository root; do not upload the ZIP as a single file.
2. Back up the current repository first. The visible GitHub repository currently contains only a `README.md`, so this bundle is based on the separately supplied `index.html` and logo assets.
3. Copy the bundle's root-level site files to `https://github.com/scoutpegs/boulder-scouts-website` and commit them to `main`. Do not replace any newer content if the repository changes after this bundle was created.
4. In GitHub, go to **Settings → Pages → Build and deployment → Deploy from a branch → `main` → `/(root)`**.
5. Before changing DNS, test `https://scoutpegs.github.io/boulder-scouts-website/`. It should show the homepage and navigation pages.
6. In **Settings → Pages**, set the custom domain to `boulderscouts.com`. Keep the root `CNAME` file.
7. If DNS is managed through Cloudflare, add the four apex A records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, and `185.199.111.153`. Initially use DNS-only/grey-cloud records. Add `CNAME` `www` → `scoutpegs.github.io` (no scheme or path). Do not change nameservers or touch MX, SPF, DKIM or DMARC records.
8. Wait for GitHub Pages to issue the certificate, then enable **Enforce HTTPS**. Verify both the apex and `www` domains; arrange the preferred redirect in GitHub Pages/DNS settings if needed.

Official docs: [GitHub Pages quickstart](https://docs.github.com/en/pages/quickstart) · [Custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-github-pages/managing-a-custom-domain-for-github-pages-site).

### 2. Enable the Google Calendars

The homepage, Calendar page and four section pages use the Worker endpoint `GET /api/calendar?calendars=whole,joeys,cubs,scouts,venturers`. The Worker proxies only these five supplied calendar identifiers and returns public ICS data for the front end to parse. The page never embeds Google Calendar and never generates regular-meeting placeholders.

1. Sign in to the Google account that owns each group calendar.
2. Open each calendar's **Settings and sharing → Access permissions for events** and enable public visibility only after checking the group's child-safety and privacy policy. If public visibility is not appropriate, do not enable it; a restricted calendar architecture will be needed instead.
3. Check that event titles, locations, descriptions, attendance notes and any other details are appropriate for public viewing before making a calendar public.
4. Deploy the updated Worker, set `site-config.js` `apiBase` to the real Worker origin, and visit `calendar.html`. If a feed cannot be read, the page should display a clear notice and no guessed dates.
5. Dates are displayed in `Australia/Perth`. The section pages list only events found in the calendars; no typical-time fallbacks are turned into schedule items.

No secret iCal subscription URL is stored in the public site. The Worker fetches the known public feed format server-side; the five calendar names are the only accepted keys.

Official help: https://support.google.com/calendar/answer/41207?hl=en

### 3. Create the Cloudflare resources

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com/) and install Node.js LTS locally if it is not already installed.
2. In the extracted site folder, run `npm install --save-dev wrangler` if Wrangler is not installed globally, then sign in with `npx wrangler login`.
3. Create the D1 database: `npx wrangler d1 create boulder-scouts`.
4. Copy the real `database_id` from the command output into `wrangler.toml` at `[[d1_databases]].database_id`. Replace the `REPLACE_WITH_REAL_D1_DATABASE_ID` placeholder only with that ID.
5. Create the private R2 bucket: `npx wrangler r2 bucket create boulder-scouts-photos`. Do **not** enable public bucket access or attach a public R2 custom domain.
6. Initialise the database: `npx wrangler d1 execute boulder-scouts --remote --file=./schema.sql`.
7. Confirm the `binding = "DB"` and `binding = "MEDIA_BUCKET"` names exactly match the Worker code.
8. Deploy the Worker: `npx wrangler deploy`. The first deploy normally provides a `workers.dev` origin. Set `API_PUBLIC_URL` in `wrangler.toml` to that exact origin with no trailing slash, and redeploy. Then place the same origin in `site-config.js` as `apiBase` (no trailing slash), commit that public, non-secret URL, and redeploy GitHub Pages.
9. Set the secrets below, then deploy/test again. If Turnstile is not fully configured, submissions intentionally fail closed.
10. Verify `https://<your-worker-origin>/api/health`; `ok` should be `true` once D1 and R2 are bound. `configured` flags must all be `true` before activating submissions/admin.

Official docs: [Workers](https://developers.cloudflare.com/workers/) · [D1](https://developers.cloudflare.com/d1/) · [R2](https://developers.cloudflare.com/r2/) · [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/) · [Turnstile](https://developers.cloudflare.com/turnstile/get-started/).

### 4. Set private secrets — do not add these to site-config.js

Run each command from the folder containing `wrangler.toml`, and type the secret into Wrangler's prompt:

```sh
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_SESSION_SECRET
npx wrangler secret put RATE_LIMIT_SALT
npx wrangler secret put TURNSTILE_SECRET
```

Choose a strong, unique admin password. Use long random values for `ADMIN_SESSION_SECRET` and `RATE_LIMIT_SALT`. Keep recovery information in the group’s approved password manager. Do not commit secret values, put them in `site-config.js`, or paste them into chat.

### 5. Turn on Turnstile and submissions

1. In Cloudflare, create a Turnstile widget allowed for `boulderscouts.com` and `www.boulderscouts.com` (add the actual GitHub Pages testing origin only if it is needed for testing).
2. Put only the **public site key** in `site-config.js` as `turnstileSiteKey`. Set the **secret key** privately as `TURNSTILE_SECRET` using Wrangler.
3. Confirm `apiBase` is the deployed Worker origin, not a placeholder, and `API_PUBLIC_URL` in Wrangler matches the same origin.
4. Open `share.html`: the form should become usable only when both `apiBase` and the public Turnstile key are set. A missing Worker secret still causes the server to reject submissions safely.
5. Test a photo submission and a story submission. Both must remain pending until approval. Open `admin.html`, log in, inspect previews and approve/reject a test submission. Rejected images must no longer be retrievable.
6. Configure CORS using `ALLOWED_ORIGINS` in `wrangler.toml`. Keep only the live site origins, the real GitHub Pages origin and localhost if required. Do not use wildcard CORS for admin routes.

## Owner checks after deployment

- `GET /api/health` — health/binding/configuration state (never returns secret values).
- `GET /api/photos?section=all` — at most 40 newest approved photos, max 10 per section.
- `GET /api/news?limit=20` — published news JSON.
- `GET /api/news?slug=...` — one published full article.
- RSS: `/api/feed/news.xml`, `/api/feed/photos/joeys.xml`, `/api/feed/photos/cubs.xml`, `/api/feed/photos/scouts.xml`, `/api/feed/photos/venturers.xml`, `/api/feed/photos/all.xml`.
- Only public approved media responds at `/api/media/<id>`. Pending previews need an expiring admin session at `/api/admin/media/<id>`.
- `/api/admin/login` creates a 12-hour session. The browser stores it in `sessionStorage`, not `localStorage`.
- Scheduled cleanup runs daily at `0 18 * * *` UTC as a safety net. Approval also enforces the 10-approved-photos-per-section limit immediately. It never clears all photos at month-end and never removes news articles.

## Important limitations

This archive is not connected to any Cloudflare account and has not been deployed. The actual Worker origin, D1 ID, private bucket state, secrets, Turnstile keys, DNS and HTTPS cannot be supplied or verified from the source files alone. Replace only the explicit placeholders after setting up your own account. Live event lists depend on the owner configuring public calendar access and deploying the Worker calendar proxy. Contact form is a `mailto:` draft; it opens the visitor's email app and does not send mail from the website.

## Validation files included in the archive

- `SETUP-CHECKLIST.md` — ordered owner setup and post-launch checklist.
- `TEST-RESULTS.md` — tested, blocked, and untested items.
- `WORKER-SMOKE-TEST-LOG.json` — local mocked route-test output; it is not a live-deployment result.
- `CALENDAR-PARSER-TEST-LOG.json` — eight local iCalendar parser test results; they do not verify live Google permissions.
- `CHANGELOG.md` — file-by-file inventory and change notes.

## Confirmed group schedule

The front end loads event data through `GET /api/calendar?calendars=whole,joeys,cubs,scouts,venturers` on the Worker. The Worker only proxies the five known Google Calendars; it is not an arbitrary URL proxy. Events are displayed only when the corresponding calendar can be read publicly. If no confirmed event is returned, the website explicitly says so and never creates regular-meeting placeholder entries. Set all five calendars to public visibility before treating the schedule as live.

The footer expects the Scouts WA white logo to be uploaded as `whitelogo.png` in the repository root. Relative root-level paths are used so the image also works on the GitHub Pages project URL.


## Responsive galleries and social embed

Each section has a rotating approved-photo slideshow. The Share a photo link preselects the chosen section, and uploads remain disabled until the secure API and Turnstile settings are ready. The Venturers page embeds `@boulder_venturers` with a direct-link fallback. The site lists events from the calendar service rather than embedding a Google Calendar iframe. See `FRONTEND-POLISH-NOTES.md` for details.

- `BROWSER-TEST-RESULTS.json` — local Chromium fixture results for 16 viewport/page combinations plus mobile/desktop navigation interactions; Instagram live rendering and deployed APIs are not tested.
