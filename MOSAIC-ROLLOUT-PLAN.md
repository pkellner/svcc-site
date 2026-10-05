# Project Mosaic: rolling the new design into every page of the SVCC static archive

Written 2026-10-05. Status: plan only, nothing built yet.

The home page prototype is approved in principle and lives at
https://claude.ai/artifact/CyRgNCMBZdW363JcxCsfsu (version 8). This plan covers how to
build that design into the real site, and how to carry its look to every other page the
static build produces.

## 1. Scope

**In scope:** every HTML page the static export emits. That is 3,920 pages, produced by
20 `page.tsx` files, which reduce to 13 distinct page designs plus the 404 page.

**Out of scope:**

- Anything parked in `web/_server-only/` (login, account, profile, admin, API routes).
- Re-running the database export. Everything below works from the JSON that already exists.
- URL changes. Every URL, the sitemap and the 404 link-recovery script stay as they are.

## 2. Where the work happens

This repo (`pkellner/svcc-site`) is only the published output. The pages are generated from
the private source repo, so all code changes go there:

- Repo: `/Users/peterkellner/repos/course-svcc-speaker-sessions-nextjs13`, app in `web/`
- Base branch: `origin/github-pages-no-auth` (tip `ca65c5a`, 2026-10-02)
- New working branch: `mosaic-redesign`, cut from that tip. Never from `main`.

### Two blockers to clear before any code

| # | Blocker | What I found | What is needed |
|---|---|---|---|
| B1 | Local source checkout is stale | Local `github-pages-no-auth` is 25 commits behind origin. The static data layer, the parked routes and the build scripts are all missing from the working tree. | Fast-forward, then branch. Five minutes. |
| B2 | The generated data is not on this Mac | `web/static-data/` does not exist here. It is gitignored and was produced on the Linux build machine. No build or dev server can render a page without it. | Either copy `web/static-data/` from the Linux machine to this Mac, or do the build work on the Linux machine. **This needs you.** |

## 3. Design rules carried over from the prototype review

These came out of the feedback rounds and apply to every page, not just the home page.

1. Say "people", never "registered" or "attended".
2. No per-year attendance comparisons. Nothing that reads as decline.
3. Newest first everywhere. Code Camps before Campfires.
4. Nothing scrolls sideways. Nothing makes the reader wait to see content.
5. Motion is smooth and eased, with no overshoot and no popping. Hover changes need a brief pause before they commit, clicks act at once.
6. Related things sit next to each other and drive each other (list and chart, tile and photo).
7. All motion is off for readers who ask for reduced motion.
8. Animated pieces watch their own frame rate and step down on slow machines.

## 4. Strategy: how to do this efficiently

**Build the shared layer once, then let each page be thin.** Today the 13 page designs are
styled by 56 SCSS partials (about 4,985 lines), Bootstrap 5 and Font Awesome 4, compiled into
a 313 KB stylesheet that every page loads, plus 11 separate "jumbo" header components. The
new system replaces all of that with one token file, about a dozen shared components and one
header component with a color per section.

**Home is the showpiece, interior pages are the calm version.** The canvas pieces (mosaic
logo, numbers, event photo, sponsor frame) ship only in the home page's own script file.
The other 3,919 pages get the same colors, type, tiles, hard shadows and eased hovers in
plain HTML and CSS, with no canvas. That keeps them fast and keeps the site under its size
limit.

**Watch bytes in the shared chrome.** The published site is 819 MB against a 900 MB limit
enforced by the prune script. Markup in the shared header and footer is repeated in about
four files per page, so each extra kilobyte there costs roughly 15 MB across the site.
Dropping Bootstrap's class-heavy markup should give some of that back, but the header and
footer get a byte budget and are measured after the first full build.

**Iterate on one page in the dev server, build the whole site only at checkpoints.**
`next dev` works against the static data, so a single page can be worked on with instant
reload. A full build is estimated at 4 to 10 minutes in the project docs (never measured),
the local link check adds a few minutes, and the full browser test takes about 45 minutes.

**Fixed sample matrix for checking each page design.** Rather than eyeballing random pages,
each design is checked on the same set: the newest year (2019), a peak year (2014), an
empty year (2006), a Campfire (campfire-1003), plus that design's worst cases (longest title,
speaker with no photo, session with several speakers, session with a video, news post with
legacy table markup).

## 5. Phase 0: setup (1 to 2 hours, after B1 and B2 are cleared)

| Step | Detail |
|---|---|
| 0.1 | Fast-forward the source repo and create `mosaic-redesign`. |
| 0.2 | Get `web/static-data/` in place. Run `npm ci`, then a baseline `npm run build:gh-pages`. Record the build time and the size of `out/`. These become the numbers to beat. |
| 0.3 | Save the prototype into the source repo at `web/design/mosaic-prototype/` (the published page plus its data files). The working copies currently sit in a temporary folder, so this is done first. |
| 0.4 | Read the Next.js 16 guides in `node_modules/next/dist/docs/` for fonts, client components and static export, as `web/AGENTS.md` requires before writing code. |
| 0.5 | Remove the one-second sleep in `web/src/lib/getYouTubeDetail.ts`. It is a stub awaited by every session card, so it likely dominates build time. Confirm the output is unchanged. |

## 6. Phase 1: the common layer (24 to 27 hours)

Everything in this phase is built before any page is restyled. Paths are under `web/`.

### 6.1 Styles

| Item | Replaces | Notes | Size | Hours |
|---|---|---|---|---|
| `styles/mosaic/tokens.css` | `sass/_settings.scss` | The four logo colors, yellow, ink, paper, type scale, radii, hard-shadow and easing values, straight from the prototype. | S | 1 |
| `styles/mosaic/base.css` | Bootstrap reboot, `_global-styles.scss` | Reset, body type, links, focus ring, the `.wrap` container, section bands. Keeps `overflow-x: clip` (the sticky header depends on it). | S | 1 |
| `styles/mosaic/prose.css` | scattered rules | Typography for database HTML: `p ul li b i em strong`, and for news bodies also `img iframe table font center h1 h2 u`. | M | 1.5 |
| Fonts | Handel Gothic, PT Sans | Unbounded, Hanken Grotesk and JetBrains Mono, self-hosted through `next/font` so nothing loads from Google at run time. | S | 1 |
| Icons | Font Awesome 4 webfont and the unused Font Awesome CSS import | About eight inline SVGs (YouTube, Twitter, Facebook, LinkedIn, Bluesky, link, arrow, search). | S | 1 |
| Remove old styling | `styles/App.scss`, 56 partials, Bootstrap imports | Done last in this phase, once no page depends on it. Must not define `.hide`: `SpeakerContent.tsx` carries that class on a block that currently shows, and defining it would hide "Speaking Sessions" on 1,641 pages. | M | 2 |

### 6.2 Shared components (new folder `src/app/common/mosaic/`)

| Component | Used by | Notes | Size | Hours |
|---|---|---|---|---|
| `SiteHeader` | every page | Rewrite of `global-nav.tsx`. Keeps the year-aware links, `aria-current`, and the whole mobile menu behavior (focus trap, Escape, scroll lock, auto-close at 992px). Adds the gliding color highlight and the scroll progress bar. | M | 2.5 |
| `SiteFooter` | every page | Moves into the layout so it appears everywhere (today it is missing from about, event, session detail, track detail and 404). Compact version for interior pages, large-tile version for home. | S | 1 |
| `PageHero` | all 12 interior designs | One component replaces the 11 jumbo headers. Props: section, title, event name and date, optional photo. Each section gets a band color: Sessions green, Speakers orange, Tracks blue, Sponsors purple, News yellow, About and Event white. | M | 2 |
| `YearSwitcher` | all year-based pages | A row of year tiles, newest first, Campfires last, linking to the same section in another year. New feature: today the only way to change year is to go back to the home page. | S | 1.5 |
| `Tile`, `Stamp`, `Button`, `Chip`, `Card` | everywhere | The rounded-square tile, the rotated year stamp, the chunky button, the track chip, the outlined card. | S | 1.5 |
| `SpeakerAvatar` | 5 designs | Photo with a designed fallback tile showing initials, replacing the "404 not found" JPEG now shown for 101 speakers. | S | 1 |
| `SessionCard` | session list, track detail, speaker detail | One card for all three. Replaces `SessionExpandedItem` and `SessionListItem`. | M | 2 |
| `SearchField`, `ViewToggle` | session list, speaker list | Restyled, same behavior and same filter contexts. | S | 1 |
| `SocialLinks`, `VideoEmbed`, `EmptyYear` | several | SVG social buttons, a responsive YouTube frame, and the "no data for this year" page that replaces `FirstYearsNoData`. | S | 1.5 |

### 6.3 Data for the home page (`src/lib/staticData/aggregates.ts`)

All of this can be computed at build time from the existing JSON. No database, no re-export.

| Aggregate | Source | Notes |
|---|---|---|
| Event list with venue, date, sessions, speakers, photo | `global.json` | Photo path is a naming rule (`/images/eventimages/reduced/{id}.jpg`), passed through `withBasePath`. |
| Totals: events, sessions, distinct speakers | `global.json` plus the 17 year files | Distinct speakers is the union of speaker ids across years. |
| Repeat speakers: events and session count per speaker | `uniquePresenters` in each year file, grouped by id | Feeds the speaker cluster and the "kept coming back" list. |
| Tracks per year with session counts | `tracks` and `trackSessions` | Counts must be intersected with approved sessions, as the track pages do. |
| Sponsor years | `sponsors` in each year file | Dedupe on `codeCampYearId`: tokens 2014 and 2018 each match two rows. |
| Curated files (hand-written JSON) | new | Track-to-theme map (87 tracks), the 44 featured sponsor ids, the one-line event notes. Small, reviewed by you once. |

Size: M. Hours: 3, including unit tests that pin the totals (17, 2,013, 930, 305 repeat speakers).

### 6.4 Canvas helpers (`src/lib/mosaic/`)

The frame-rate governor, the particle spring, the rounded-rectangle path and the visibility
watcher, lifted from the prototype and typed. Imported only by home page components.
Size: S. Hours: 1.

## 7. Phase 2: the home page (1 page, 13 to 16 hours)

Route: `/`. Files today: `page.tsx`, `home/Home.tsx`, `HomeHeader.tsx`, `home-past-events.tsx`.
Four unused home files are deleted (`HomeContainer`, `HomeSessionCount`, `HomeCTA`, `home-tool-tip`).

| Section | Component | Type | Size | Hours |
|---|---|---|---|---|
| Hero with the 2,013-tile logo | `HomeHero`, `MosaicLogo` | client canvas | M | 2 |
| Venue banner | `VenueRibbon` | server, links drive Events | S | 0.5 |
| Numbers: confetti, sessions, speaker rings, linked panel | `HomeNumbers`, `SpeakerCluster`, `SpeakerPanel` | client canvas | L | 3.5 |
| Events: tile photo and year wall | `HomeEvents`, `TilePhoto`, `YearWall` | client canvas | L | 2.5 |
| Tracks with themes | `HomeTracks` | small client piece | M | 1.5 |
| Sponsor wall with the tile frame | `SponsorWall` | client canvas plus DOM | M | 2 |
| About with the photo stack | `HomeAbout`, `PhotoStack` | small client piece | S | 1 |
| Wiring, cross-section links, reduced motion, phone layout | | | M | 1.5 |

Hard-coded prototype data is replaced by the aggregates from 6.3. The home page is the only
page that loads the canvas code.

## 8. Phase 3: the interior pages

Every row is a page design. "Pages" is the count in the published output.

| # | URL | Pages | Source files | What changes | Size | Hours |
|---|---|---|---|---|---|---|
| 1 | `/session/<year>/` | 17 | `session/[year]/page.tsx`, `SessionList`, `SessionFilterView`, `SessionsExpanded`, `SessionsNotExpanded`, 4 client wrappers, `SessionsHeader` | `PageHero` in green, `YearSwitcher`, restyled search and list/grid toggle, `SessionCard` grid. Search, count text and toggle behave as today. | L | 4.5 |
| 2 | `/session/<year>/<slug>/` | 2,012 | `[sessionSlug]/page.tsx`, `SessionDetail.tsx`, `SessionDetailHeader.tsx` | Title hero, description in `prose`, speaker block with `SpeakerAvatar` and social links, video frame, materials link, books. Gains the footer. The highest-volume page, so its markup is kept lean. | M | 3.5 |
| 3 | `/presenter/<year>/` | 17 | `presenter/[year]/page.tsx`, `SpeakersMain`, `SpeakerListMinimal`, `SpeakerListData`, `SpeakerListItem`, `SpeakersHeader` | `PageHero` in orange, `YearSwitcher`, search, speaker cards with avatar tiles. | M | 2.5 |
| 4 | `/presenter/<year>/<slug>/` | 1,641 | `[presenterSlug]/page.tsx`, `SpeakerHeader.tsx`, `SpeakerContent.tsx` | Photo and name hero, bio in `prose`, social links, their sessions as `SessionCard`s. Adds a strip of year squares showing every event they spoke at, the same device as the home page card, built from the repeat-speaker aggregate. | M | 3.5 |
| 5 | `/track/<year>/` | 17 | `track/[year]/page.tsx`, `TrackListData`, `TrackListItem`, `TracksHeader` | `PageHero` in blue, `YearSwitcher`, track cards with session count and description. | S | 2 |
| 6 | `/track/<year>/<slug>/` | 93 | `[trackSlug]/page.tsx`, `track-header.tsx`, `sessions-for-track.tsx` | Track hero, then `SessionCard`s. Gains the footer. Mostly free once row 1 is done. | S | 1.5 |
| 7 | `/sponsor/<year>/` | 17 | `sponsor/[year]/page.tsx`, `SponsorPage.tsx` | `PageHero` in purple, `YearSwitcher`, logos as tilted white tiles grouped by level, with the eased hover lift in CSS only. No canvas frame here. | M | 2.5 |
| 8 | `/news/` and `/news/<year>/` | 18 | `(news)/layout.tsx`, `news/page.tsx`, `news/[year]/page.tsx`, `NewsList.tsx`, `NewsHeader.tsx` | `PageHero` in yellow, post cards with date stamp. All 18 pages show the same 45 posts today; that stays as it is. | S | 2 |
| 9 | `/news/<year>/<slug>/` | 45 | `[newsSlug]/page.tsx`, `NewsDetail.tsx` | Article layout. The risk is the legacy HTML in old posts (tables, `font` and `center` tags, inline images, video frames), handled by `prose`. Every one of the 45 is looked at. | M | 2.5 |
| 10 | `/about/` and `/about/<year>/` | 18 | `about/page.tsx`, `about/[year]/page.tsx`, `AboutPage.tsx`, `AboutHeader.tsx` | Volunteer statement, photo, contact line. Fixes the bare `/about/` header, which currently reads "Current or Latest Event:" with nothing after it. Gains the footer. | S | 1.5 |
| 11 | `/event/<year>/` | 17 | `event/[year]/page.tsx`, `event-page.tsx`, `event-header.tsx` | Today this is three links and a photo. Becomes a proper event summary: photo, venue, date, session and speaker counts, that year's tracks as chips, links to sessions, speakers and sponsors. Gains the footer. | M | 2.5 |
| 12 | 2006 and 2007 pages for sessions, speakers, tracks and sponsors | 8 (already counted in rows 1, 3, 5 and 7) | `home/FirstYearsNoData.tsx` | `EmptyYear`: says plainly that the list for this year is not on record, with the event photo and links to other years. These pages currently have no header and no footer. | S | 1 |
| 13 | `/event/`, `/session/`, `/presenter/`, `/track/`, `/sponsor/` | 5 | the five redirect `page.tsx` files | Redirect-only pages. No design work; checked that they still redirect and that targets carry no base path. | XS | 0.5 |
| 14 | `404.html`, `404/`, `_not-found/` | 3 | `src/app/not-found.tsx` | Restyled with the tiles. The first `<h1>` must still read exactly "Page not found" (the browser test depends on it), and the inline link-recovery script is not touched. | S | 1.5 |

Interior pages total: 31.5 hours. The rows add up to 3,920 files: 3,919 pages plus the extra `404.html` copy. With the home page that is the full 3,920 pages.

### Order of work inside Phase 3

Chosen so each step reuses the one before it:

1. Session list (builds `SessionCard`, search, toggle)
2. Track detail (reuses `SessionCard`)
3. Session detail
4. Speaker detail (reuses `SessionCard` and the avatar)
5. Speaker list
6. Track list
7. Event
8. Sponsor
9. News list, then news detail
10. About
11. Empty-year pages, redirects, 404

## 9. Phase 4: checks, size and release (8.5 to 9.5 hours)

| Step | Detail | Hours |
|---|---|---|
| 9.1 | `npm run typecheck` and `npm run test:unit`. Update `sanitize.test.ts` only if allowed tags change (not planned). | 0.5 |
| 9.2 | Full `npm run build:gh-pages`. Compare `out/` size with the Phase 0 baseline. Must stay under 900 MB. | 1 |
| 9.3 | `npm run test:gh-pages:local`: every link and asset has the base path and exists. | 0.5 |
| 9.4 | Extra check the existing tests do not cover: image and data URLs built inside the canvas scripts, and `url()` inside CSS. | 1 |
| 9.5 | Sample-matrix pass on every page design at desktop and phone width, with reduced motion on and off. | 2.5 |
| 9.6 | Confirm the canvas code is only in the home page's script file and the stylesheet is well under the old 313 KB. | 0.5 |
| 9.7 | Deploy to the test site, then `npm run test:gh-pages` and the full browser test (about 45 minutes, unattended). | 1.5 |
| 9.8 | Fix what the checks find. | 1 to 2 |

The old Playwright suite under `web/tests/e2e/` already cannot run on this branch (it needs
the login API). It is left alone and not counted as a gate.

## 10. Totals

| Phase | Hours |
|---|---|
| 0. Setup | 1 to 2 |
| 1. Common layer | 24 to 27 |
| 2. Home page | 13 to 16 |
| 3. Interior pages | 31.5 |
| 4. Checks and release | 8.5 to 9.5 |
| **Total** | **about 78 to 86** |

These are estimates of focused build time with me doing the implementation, not
measurements. Calendar time depends mostly on how quickly you can look at each checkpoint.
With same-day reviews this is roughly two working weeks.

### Review checkpoints

| # | After | You look at |
|---|---|---|
| C1 | Phase 1 | A page of the shared components, and one session list page in the new look |
| C2 | Phase 2 | The real home page running on real data |
| C3 | Rows 1 to 6 of Phase 3 | Sessions, speakers and tracks, list and detail |
| C4 | Rows 7 to 14 | Event, sponsor, news, about, empty years, 404 |
| C5 | Phase 4 | The deployed test site |

Commits are made in logical chunks on `mosaic-redesign`, one per component group or page design.

## 11. Risks

| Risk | Why it matters | Guard |
|---|---|---|
| Site size | 819 MB today, 900 MB limit, shared markup multiplies by 3,920 | Byte budget for header and footer, size compared after every full build |
| Base path | Any site-relative URL without `withBasePath` fails the link test, and URLs built in script are not tested at all | One helper for all asset URLs, plus check 9.4 |
| `.hide` class | Defining it would hide the sessions list on every speaker page | Remove the class from the markup during the rewrite |
| 404 heading text | The browser test treats "Page not found" in an `h1` as the 404 marker | Kept verbatim |
| Legacy news HTML | 45 posts with table and font markup | Each one viewed in step 9 of the work order |
| Dev and build use different bundlers | Dev runs Turbopack, the build runs webpack | Full build at every checkpoint, not only at the end |
| Sticky header | Depends on `overflow-x: clip`, not `hidden` | Carried into `base.css` |
| Sponsor data | Tokens 2014 and 2018 each match two database rows | Dedupe in the aggregate, pinned by a unit test |
| Old machines | Home page animation cost | Governor from the prototype, canvas only on home, idle animation at half rate |

## 12. Decisions needed from you

| # | Question | My recommendation |
|---|---|---|
| D1 | Where do builds run: this Mac (needs `static-data` copied over) or the Linux machine? | This Mac, with the folder copied over, so pages can be checked in a browser as they are built. |
| D2 | Interior pages are the calm version, with no canvas animation. Agreed? | Yes. It keeps 3,919 pages light and makes the home page the event. |
| D3 | Add the year switcher to list pages? It is a new navigation element. | Yes. It fixes the biggest gap in the current site. |
| D4 | Bronze and Community sponsors have no logo files. Showing them as logos needs a database re-export. | Leave as is: show those levels as name tiles. |
| D5 | The 18 news list pages are identical. Keep, or filter each by year? | Keep. Changing it alters what existing URLs show. |
| D6 | The event page (row 11) grows from three links to a real summary. Agreed? | Yes. It gives the year tiles on the home page somewhere worth landing. |

## 13. Definition of done

- All 3,920 pages build, with the same URLs as today.
- No page loads Bootstrap, Font Awesome or the old stylesheet.
- The link test passes and the browser test passes on the deployed test site.
- `out/` is under 900 MB.
- Search and the list/grid toggle on session lists, search on speaker lists, the mobile menu and the 404 link recovery all work as before.
- The home page matches the approved prototype and runs on build-time data.
- Every page design has been viewed on the sample matrix at desktop and phone width.
