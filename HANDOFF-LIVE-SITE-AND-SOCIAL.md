# Handoff: present the site as the live SVCC site, and give every page its own social preview

Status: done (2026-10-06): phases 1–4 and the tests; phase 4 is the "Adding a future event" section of REBUILD-STATIC-SITE.md. While doing it, a site-wide raw-markup bug was found and fixed: 276 session, 378 speaker and 41 track pages showed stored HTML as text ("&amp;", "&lt;p&gt;", "<p>"). The JSON is now cleaned as it is read (`src/lib/staticData/normalize.ts`), stored HTML is always rendered sanitized (`src/gql/common/HtmlNotSafe.tsx`, track header), and `test:meta` fails on any visible markup. Written 2026-10-06. Work happens on branch `main` of `pkellner/svcc-site` (see the README's "Two branches — never merge"). Deploying to `gh-pages` needs Peter's say-so (`ALLOW_SVCC_SITE_DEPLOY=1`).

## Goals

1. **No "archive" framing anywhere.** The site must look and read like the real, full Silicon Valley Code Camp site in every regard. If there is another event, this site is the prototype the full event site is rebuilt from.
2. **Per-page titles and descriptions.** Every page gets its own `<title>`, description, `og:*` and `twitter:*` text, plus an `og:url` and a canonical link. Today all ~3,900 pages share the home page's.
3. **Per-page social images.** Events, tracks, speakers and news get their own 1200x630 card. Sessions use their first speaker's card. Listing pages use their event's card. The home page keeps the Douglas Crockford card.
4. **Tests.** Automated tests prove all of the above on every build and after every deploy.

Out of scope: changing the data in `static-data/` (genuine historical text that happens to say "archive", "retired" or "no longer" stays), adding forms or logins (the site is static), and the custom domain.

## Phase 1: remove the archive framing

### 1a. Visible text to change

| Where | Today | Change to |
|---|---|---|
| `src/app/common/Footer.tsx:38` (every page) | "Seventeen events. 930 speakers. One archive." | "Seventeen events. 930 speakers. One community." |
| `src/app/common/Footer.tsx:40` | "Browse the archive" | "Browse" |
| `src/app/common/Footer.tsx:79` | "Copyright © 2024 all rights reserved" | "Copyright © 2006–{build year}", year computed at build (`new Date().getUTCFullYear()`; builds run with `TZ=UTC`) |
| `src/app/(public-site)/home/Home.tsx:278` | chip "Read-only archive · 2006–2023" | "Since 2006 · 17 events" |
| `Home.tsx:280` | "Where developers learned from developers." | "Where developers learn from developers." |
| `Home.tsx:545` | "Read the news archive" | "Read the news" |
| `src/app/not-found.tsx:35` (404 pages) | "This is an archived, read-only copy of the Silicon Valley Code Camp site..." | a plain not-found message, e.g. "We couldn't find that page." plus the existing links |
| `session/[year]/[sessionSlug]/not-found.tsx:13` | "...isn't in this archive." | "We couldn't find that session." |
| `session/[year]/not-found.tsx:13` | "There are no sessions in this archive for that year." | "There are no sessions for that year." |
| `event/[year]/event-page.tsx:38` | `alt="past event image"` | `alt="{event name} photo"` |
| `scripts/og-card/card.html:47` (baked into `public/images/og-svcc.jpg`) | pill "2006–2023 · the whole archive" and tagline "learned" | pill "Since 2006 · 17 events", tagline "learn". Then `npm run og-card` and bump `OG_PATH`'s `?v=` |

Leave alone: counts and facts that are naturally past tense ("37,954 people came to a Code Camp", "Douglas Crockford, every year from 2008 to 2019"), and the event notes in `homeData.ts` ("The session list is not on record"). These are statements about past events, which a live site also shows.

### 1b. Comments, scripts and docs (not visible, but keep the repo consistent)

- Comments: `next.config.ts:5,9`, `src/app/layout.tsx:15`, `global-nav.tsx:11`, `eventIndex.ts:3`, `homeData.ts:1,3`, `staticData/common/utils/getUserProfile.ts:2`, `staticData/sessions/sessionInterest.ts:2`, `staticData/sessions/sessionsWithInterestLevelDict.ts:2`, `scripts/prune-out.sh:9,38`, `scripts/test-gh-pages.mjs:29`, `scripts/build-home-data.mjs:1`. Say "static site" instead of "archive", and drop "the event is over".
- `scripts/deploy-gh-pages.mjs:97`: change the commit message to "Deploy SVCC site". Keep `archive.siliconvalley-codecamp.com` in the line 7 comment, because that is a real hostname.
- `README.md` (title, intro, table, "What the archive exposes", "Content is frozen", search-engines note) and `REBUILD-STATIC-SITE.md:1`: describe it as "the SVCC site (static build)". Rewrite "Content is frozen" as "Static: no forms, logins or search".

### 1c. Decisions for Peter (the default applies if he doesn't answer)

- **Calls to action.** The home page offers "Explore the 17 events" and "Watch the videos", and session pages hard-code `showRegisterButton = false` (`SessionDetail.tsx:35`). With no upcoming event, a Register button would go nowhere. Default: leave them as they are. Phase 4 says how to turn them back on.
- **Footer events column.** It reads "Code Camp 2019 / Code Campfire 2023 / All 17 events". Default: keep it.

## Phase 2: per-page titles, descriptions and URLs

### 2a. One helper: `src/lib/seo.ts`

- `SITE_ORIGIN`: `https://pkellner.github.io` when `NEXT_PUBLIC_BASE_PATH` is set, otherwise `https://www.siliconvalley-codecamp.com`. Move the logic out of `OG_IMAGE` in `layout.tsx`.
- `absUrl(path)`: `SITE_ORIGIN + withBasePath(path)` (`src/lib/basePath.ts:8`). Pages use trailing slashes (`trailingSlash: true`).
- `plainText(html, max = 160)`: strip tags with `sanitizeBasicHtml(html, false)` (`src/lib/sanitize.ts:14`), decode entities (port `plain()` from `scripts/build-home-data.mjs:19-25`), collapse whitespace, and cut at a word boundary with "…".
- `OG_VERSION`: one cache-busting value for every card, appended as `?v=`.
- `pageMetadata({ title, description, path, image, type })` returns a Next `Metadata`:
  - `title`: `"{title} · Silicon Valley Code Camp"`; the home page uses just "Silicon Valley Code Camp".
  - `description`, `alternates.canonical`, `openGraph` (`title`, `description`, `url`, `type`, `siteName`, `images: [{url, width: 1200, height: 630, alt}]`) and `twitter` (`summary_large_image`, same fields).
- `layout.tsx` keeps site-wide defaults built from the same helper, and fixes the default text: "Silicon Valley Code Camp is a community event where developers learn from developers."

### 2b. `generateMetadata` in every route

| Route | Pages | Title | Description source | Image |
|---|---|---|---|---|
| `/` | 1 | Silicon Valley Code Camp | site description | `images/og-svcc.jpg` |
| `about`, `about/[year]` | 18 | About · {event} | fixed sentence | event card |
| `event/[year]` | 17 | {event name} | date, venue, session/speaker counts (`getCodeCampYearsWithSessions`, `getCodeCampYears`) | event card |
| `session/[year]` | 17 | Sessions · {event} | "{n} sessions at {event}" | event card |
| `session/[year]/[sessionSlug]` | 2012 | {session title} | `descriptionShort`, or else `description` (`plainText`). Note: only 919 of 2013 have `descriptionShort` | first speaker's card, else event card |
| `presenter/[year]` | 17 | Speakers · {event} | "{n} speakers at {event}" | event card |
| `presenter/[year]/[presenterSlug]` | 1641 | {first} {last} | `jobLine` (`src/lib/displayText.ts:8`) + `plainText(userBio)` | speaker card |
| `track/[year]` | 17 | Tracks · {event} | track count | event card |
| `track/[year]/[trackSlug]` | 93 | {track name} · {event} | track description or "{n} sessions" (`getTrackById`, `getSessionIdsForTrack`) | track card |
| `sponsor/[year]` | 17 | Sponsors · {event} | sponsor count | event card |
| `news`, `news/[year]` | 18 | News / News · {event} | fixed sentence | event card or home card |
| `news/[year]/[newsSlug]` | 45 | {news title} | `plainText(description)` | news card |
| `not-found` | 3 | Page not found | – | home card |

Notes:
- Each route loads its record in `generateMetadata` with the same data function the page already uses (listed per route in `src/lib/staticData/**`). Static export runs both functions at build time, so loading the record twice costs nothing.
- Speaker cards are keyed by speaker id, so the same person in several years shares one card.
- The 20 legacy forwarding pages (`scripts/legacy-speaker-pages.mjs`) are plain redirects. Give them `<meta name="robots" content="noindex">` and the target speaker's card, set in that script.
- The redirect-only routes (`session/`, `presenter/`, `track/`, `sponsor/`, `event/` without a year) need nothing.

## Phase 3: per-page social cards

### 3a. Generator: `scripts/og-card/make-page-cards.mjs`

- Reuse `make-og-card.mjs`'s local server and Playwright setup: one browser page, and for each card one `render()` call and one screenshot.
- Add a `renderPage(d)` mode to `card.html`, or a sibling `page-card.html` with the same fonts, colors and specks.
  - **Event card:** event name, date, venue, and the four counts for that event.
  - **Track card:** track name, event, session count.
  - **Speaker card:** photo (`public/static-images/speakers/<id>.webp`, mostly 300x300 and some as small as 71x75, so show it as a circle of 200–240 px at most), or the ring halo when there is no photo. Name, `jobLine`, and the year tiles exactly like the Crockford popup.
  - **News card:** headline (clamped to 3 lines), date, author.
- Output goes to `out/og/{event,track,speaker,news}/<key>.jpg` at JPEG quality 80. It is generated at build time and not committed; the main card stays committed at `public/images/og-svcc.jpg`.
- Add the step to `build:gh-pages` and `build:static` after `prune-out.sh`. The size guard runs inside `prune-out.sh`, so add a second `du` check at the end of the generator, or move the guard to run last.
- **Budget:** 17 + 93 + about 930 + 45 ≈ 1,085 cards at about 60–90 KB, which is about 70–100 MB. `out/` is 476 MB today, so it ends near 575 MB, under the 900 MB guard. Session cards would add about 2,012 × 80 KB ≈ 160 MB, which is why sessions reuse speaker cards.
- **Determinism:** cards are drawn only from the JSON and fonts, so specks are seeded and there is no animation. Rebuilding unchanged data gives byte-identical cards, and `test:gh-pages` byte-compares every live file.

### 3b. Cache-busting

Bump `OG_VERSION` in `src/lib/seo.ts` whenever card designs change. LinkedIn and Slack cache a preview by URL.

## Phase 4: prototype notes for a future event (write into `REBUILD-STATIC-SITE.md`)

This is a short section. It is not built now.
- **Adding an event:** a new `static-data/years/<token>.json`, entries in `global.json` (`codeCampYears`, `idByToken`, `codeCampYearRecById`, `configDictById`, `currentCodeCampYear`), speaker photos in `public/static-images/speakers/`, then `npm run home-data`.
- **Places that assume the event is in the past:** `showRegisterButton` (`SessionDetail.tsx:35`), home CTAs (`Home.tsx:286,293`), footer events column (`Footer.tsx:53-59`), nav items (`global-nav.tsx:9-11`).
- **Not in this repo:** registration, login and admin need a server. They existed in the old Next app (parked under `web/_server-only/` there). A future event needs them rebuilt, or a hosted form service.

## Tests

### New: `scripts/test-meta.mjs` (`npm run test:meta`, local, reads `out/`)

For every `index.html` in `out/` except the 20 forwarders and the 5 redirect pages:
1. Exactly one `<title>`, one `meta description`, `og:title`, `og:description`, `og:url`, `og:image` (+ width/height/alt), `twitter:card=summary_large_image`, and `link rel=canonical`.
2. `og:url` and canonical equal the page's own absolute URL (`SITE_ORIGIN` + basePath + path with trailing slash).
3. Titles are unique within each page type. The only allowed duplicates are listed in the test with a reason, for example two years sharing a track name, which is disambiguated by the event in the title.
4. Descriptions are 40–200 characters and contain no `<`, `&lt;`, `&amp;`, `&nbsp;` or `&#`. This catches the raw-HTML class of bug found in news leads.
5. The `og:image` URL is absolute and starts with `SITE_ORIGIN + basePath`. With the origin, base path and `?v=` removed, it names a file that exists in `out/`. That file is a JPEG of exactly 1200x630 (read the SOF header; no extra dependency needed).
6. Every card file under `out/og/` is referenced by at least one page, so there are no orphans.
7. **Archive guard:** the visible text and attribute text (alt, title, aria-label, meta content) of every page contain no `archive`, `archived`, `read-only` or `frozen`. The exceptions come from the data and are allowlisted by phrase: "HTTP Archive", "archive.msdn", "archive.org", "blogs.msdn…/archive/", "Libraries archive". `card.html` and `public/images/og-svcc.jpg` are covered by a source grep of `scripts/og-card/` in the same test.

Wire it into the workflow: `npm run build:gh-pages && npm run test:gh-pages:local && npm run test:meta`.

### Extend `scripts/test-gh-pages.mjs` (live)

`extractRefs` (`:70-78`) only reads `src`/`href` starting with `/`, so `og:image` is never checked today. After a deploy, fetch every unique `og:image` URL live and require a 200, `image/jpeg`, and bytes equal to the file in `out/`.

### Visual checks (Playwright screenshots, looked at by eye, before deploying)

- Home hero and chip, footer, 404 page, and the session not-found pages: no archive wording.
- A contact sheet of about 20 cards across all four types, including a speaker with no photo, a speaker with a tiny photo, the longest news headline and the longest track name. Check for overflow, clipping and contrast.
- `public/images/og-svcc.jpg` after the pill change.

### After deploy

- `npm run test:gh-pages` (byte-identical, plus the new `og:image` check) and `npm run test:gh-pages:browser`.
- Manually paste 4 URLs (home, a speaker, a session, a news post) into LinkedIn Post Inspector and an Open Graph previewer (for example opengraph.xyz), and check the preview shows the page-specific title and card.

## Suggested split for parallel agents

These three can run at the same time; each touches different files:
- **Agent A, Phase 1:** `Footer.tsx`, `Home.tsx`, the not-found files, `event-page.tsx`, `card.html` (pill and tagline only), comments, README and REBUILD. Then `npm run og-card` and bump `OG_PATH`'s `?v=`.
- **Agent B, Phase 2:** `src/lib/seo.ts`, `layout.tsx` metadata, and `generateMetadata` in each route.
- **Agent C, Phase 3:** `scripts/og-card/make-page-cards.mjs`, the page-card template, and the `package.json` build step. It agrees with B on the `out/og/<type>/<key>.jpg` path scheme above.

Then one agent writes `scripts/test-meta.mjs` and the live `og:image` check, runs the full test list, takes the screenshots, and reports. Only after that, and with Peter's say-so, comes the deploy.

## Definition of done

- `npm run typecheck`, `npm run build:gh-pages`, `npm run test:gh-pages:local` and `npm run test:meta` all pass. `out/` is under 900 MB.
- Screenshots reviewed: no archive wording, and the cards read well.
- Deployed with Peter's say-so. `npm run test:gh-pages` passes, including the `og:image` check, and the 4 manual previews show page-specific cards.
- `main` and `gh-pages` both pushed. This file updated with what was done, or deleted.
