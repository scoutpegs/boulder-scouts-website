# Site plan and file map

## Visitor experience

- `index.html`: welcoming overview, Scout section cards, confirmed-event list and news. The combined approved-photo slideshow uses real API photos only. Approved group photographs populate only after the API is configured.
- `about.html`: the timeline and source labels. Published-source details and group-supplied oral history are clearly distinguished.
- `joeys.html`, `cubs.html`, `scouts.html`, `venturers.html`: section information, real confirmed-event-only “Coming up” list and that section’s approved, rotating photo album. No Google Calendar frame or fabricated meeting dates are shown.
- `calendar.html`: confirmed-event-only agenda with school-term and section filters. Events come through `/api/calendar` and display in Australia/Perth; empty/private calendars produce an honest notice.
- `news.html`: published titles/summaries only. Headlines lead to `article.html?slug=...`, which reads and safely inserts full plain-text article content.
- `share.html`: public photo/story submission. Every submission stays pending until an authenticated admin approves it.
- `admin.html`: login, private pending previews, approve and reject/delete. Tokens exist only in session storage and expire server-side.
- `join.html`, `contact.html`, `resources.html`, `events.html`, `training.html`, `scoutmap.html`, `privacy.html`, `404.html`: supporting pages; common header/footer is retained.

## Public/static files

`site.css`, `site.js`, `site-config.js`, the companion client scripts, favicons and logo files are served from the same root as every HTML file. `site-config.js` contains public identifiers and settings only. The logo variants are copied to the root to keep paths compatible with project GitHub Pages and custom-domain hosting.

## Private/server-side files

`worker.js` provides the API. `schema.sql` defines D1 schema. `wrangler.toml` binds the D1 database as `DB`, private R2 bucket as `MEDIA_BUCKET`, and the 18:00 UTC daily safety-net cron. Four secrets (`ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `RATE_LIMIT_SALT`, `TURNSTILE_SECRET`) must be set through Wrangler's secrets feature.

## Storage lifecycle

1. Submission → validate required fields, permissions, honeypot, Turnstile token, rate limit and image type/size.
2. Pending submission metadata goes to D1; uploaded images go to private R2 under a pending prefix. No public endpoint serves these files.
3. Authenticated admin approves or rejects. On approval, pending images are copied to an approved R2 prefix and their D1 rows marked approved; story submissions become published articles. On rejection, R2 objects and media records are removed.
4. After each photo approval, only that section is trimmed to the 10 newest approved images. Daily cron is a safety net; articles are never deleted by photo retention.
5. Public APIs and RSS include approved/published items only.

## Design and accessibility

The supplied Barlow fonts, burgundy/section accents, cards, illustrations, home structure, page order and spacing are retained. The header uses the supplied black Scout emblem alongside a bold text wordmark on white, so the brand remains legible on narrow screens; dropdowns are opaque white and layered above page content. Straight burgundy accent rules keep section boundaries crisp. Shared navigation uses real HTML page URLs; legacy hashes continue to be rendered where applicable. On phones and smaller tablets, the menu opens as a full-viewport white overlay with safe-area spacing, a visible Close control, internal scrolling, focus management, dropdown support, Escape and link closing, and body-scroll locking. Reduced-motion preferences are respected.

## Schedule and gallery behaviour

- The front end reads the five fixed calendar feeds through the Worker route `/api/calendar`. A calendar that is empty or not public contributes no fabricated events.
- Photo albums query `/api/photos?section=joeys|cubs|scouts|venturers|all`. Only approved media is accepted, with automatic rotation, previous/next controls and a pause/play button. `prefers-reduced-motion` disables automatic rotation.
- The footer shows `logo-full-unit-white.svg` plus a Scouts WA white mark expected at root-level `whitelogo.png`.
