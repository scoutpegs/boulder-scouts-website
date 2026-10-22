# Frontend polish pass — 22 October 2026

This is a targeted finish pass on the existing Boulder Scout Group site, not a replacement template. It keeps the burgundy/white/black palette, Barlow typography, cards, multi-page layout, section pages and existing content hierarchy.

- Rebuilt the shared top lock-up from the supplied black Scout emblem plus a crisp text wordmark. This avoids the oversized whitespace in the old horizontal SVG and stays legible on 320px phones.
- The earlier visual pass added burgundy/cream wave dividers; the latest refinement removes those wave shapes and restores straight burgundy accent rules.
- Consolidated the calendar empty state so the same unavailable feed message isn't repeated. Empty lists never create sample/placeholder meetings.
- Retained individual photo slideshow areas for Joeys, Cubs, Scouts and Venturers, plus the combined homepage gallery. Published content is requested from the backend; visitor submissions must be reviewed and approved before appearing.
- Venturers includes an Instagram profile embed and a direct profile fallback link. Third-party embed rendering depends on Instagram availability, account/embed settings and browser privacy controls.
- Responsive CSS targets narrow phones, tablets and desktop, including 320px widths.

## Calendar setup note

The client now uses the `/api/calendar` endpoint at the configured Cloudflare Worker; it does not embed Google's calendar UI. The existing IDs identify the five configured calendars, but the Worker proxy can only read each source if it is published/readable in a way the feed endpoint permits. Set `site-config.js` `apiBase` to the real Worker origin (no trailing slash) after deploying. Then test the live endpoint and permissions. Google’s current sharing instructions: https://support.google.com/calendar/answer/37082?hl=en. Because these are youth activities, only expose calendar details approved for public viewing. Never copy a private iCal secret into browser code or the repository.

## Footer image

The Scouts WA footer logo expects `/whitelogo.png` at the root. Add the real supplied/approved logo there before publishing; do not use a guessed logo file.

## Honest validation boundary

Local syntax, schema, parser, mocked route and browser fixture checks are separate from real live-service checks. Calendar visibility, Instagram's third-party iframe, Cloudflare deployment, uploaded-media workflow, custom domain and DNS remain unverified until deployed and tested with the owner’s real configuration.


## History and mobile navigation follow-up
- Reworked the history introduction into a restrained Goldfields editorial panel, added three accurately labelled highlights, and moved source-status guidance into a disclosure so it remains available without crowding the timeline.
- Improved timeline year labels, source badges, card rhythm, body line length and link/touch target spacing on phone screens. Existing source-attribution text and uncertainty labels are preserved.
- Removed all wave-shaped divider treatments from the header, hero, section bands and footer; retained straight burgundy accent rules so the existing brand remains recognisable.
- On mobile widths up to 1000px, opening the menu now creates a full-viewport white overlay with safe-area padding, a visible fixed Close control, internal scrolling, dropdown support, body-scroll lock and Escape/link closing behaviour.
