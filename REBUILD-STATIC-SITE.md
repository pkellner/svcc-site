# Rebuilding and redeploying the SVCC site (static build)

How to change the site and publish it. Everything runs from the root of branch `main` of this repo.

| | |
|---|---|
| Data and source | `pkellner/svcc-site`, branch `main` |
| Published site | https://siliconvalley-codecamp.com/ (GitHub Pages, deployed by GitHub Actions from `main`) |

Publishing is just pushing `main` (step 4). Steps 2 and 3 are local checks you can run first; the workflow runs the same build and tests on GitHub either way.

## 0. One-time setup

- `npm run setup`: installs the packages and Playwright's Chromium (the per-page social cards and the browser test need the browser).
- Optional: the `gh` CLI, to watch a deploy from the terminal.

No database and no `.env` are needed.

## 1. Make the change

- **Content** (a news post, a session, a speaker bio): edit `static-data/global.json` (events and news, key `allNewsData`) or `static-data/years/<token>.json` (sessions, speakers, tracks, sponsors for one event).
- **A page's layout or wording**: edit the template under `src/app/(public-site)/`.
- **An image**: replace the file under `public/`.
- **The social card** (`public/images/og-svcc.jpg`): edit `scripts/og-card/card.html` if needed, run `npm run build:gh-pages` then `npm run og-card` (it draws the card from the built home page), bump the `?v=` in `HOME_CARD_PATH` in `src/lib/seo.ts` so sites that cached the old card fetch the new one, and build again.

If a session or speaker changed, also run `npm run home-data`. It regenerates the home page galaxy data (`public/home/sessions.json` and the speaker rows in `src/app/(public-site)/home/homeData.ts`) from the JSON. On unchanged data it changes nothing.

For code changes, run `npm run typecheck` too.

## 2. Build

```bash
npm run build:gh-pages     # for https://siliconvalley-codecamp.com/ (served from the root)
```

This writes `out/` (about 3,900 pages, 21,000 files, about 475 MB), runs `scripts/prune-out.sh` to remove files that must never be published, and adds 20 forwarding pages for speaker addresses the original sitemap spelled differently (`scripts/legacy-speaker-urls.json`).

`npm run build:static` is the same build. The site moved to the custom domain on 2026-10-06; the old `pkellner.github.io/svcc-site/` test address is gone. Never set `NEXT_PUBLIC_BASE_PATH` for a real build.

## 3. Check before deploying

```bash
npm run test:gh-pages:local
npm run test:meta
npm run serve:out              # leave running, then in another terminal:
npm run test:browser:local     # every page in real Chromium against the local build (~20 min)
```

All three tests must end in `PASS`.

- `test:gh-pages:local` checks that every link, image and redirect in every page carries the base path and points at a file that exists in `out/`. Links that don't exist are compared with the original site: it fails if the original serves them, and warns if they're dead there too.
- `test:browser:local` loads every page of the local build in Chromium and fails on broken images, links that 404 and wrong redirects. It catches what the file checks can't: links the browser builds after the page loads. Run it before every deploy; on 2026-10-06 a deploy without it published 404 session links.
- `test:meta` checks every page's title, description, canonical, `og:*` and `twitter:*` tags, that every `og:image` is a 1200x630 JPEG in `out/`, that no page shows raw markup (`&amp;`, `<p>` as text), and that no page calls the site an archive.

The build also draws a social card for every event, track, speaker and news page into `out/og/` (`scripts/og-card/make-page-cards.mjs`, about a minute). Card URLs carry `?v=` + `OG_VERSION` from `src/lib/seo.ts`; bump it when the card design changes.

## 4. Deploy: commit and push `main`

Commit the JSON and source changes on `main` and push. GitHub Actions (`.github/workflows/deploy.yml`) checks out `main`, runs `typecheck`, builds `out/`, runs `test:gh-pages:local` and `test:meta`, and deploys `out/` to GitHub Pages. It takes about ten minutes, and the live site changes only if every step passes. Watch it in the repo's Actions tab, or:

```bash
gh run watch
```

Nothing is built or uploaded from your machine. To redeploy without a code change, use "Run workflow" on the Actions tab. Pushes to other branches build and test but don't deploy, and pushes that change only `*.md` files don't start a run.

## 5. Verify the live site

```bash
npm run test:gh-pages            # every page byte-identical to out/ + every image/script/link loads
npm run test:gh-pages:browser    # real Chromium on a sample of pages: broken images, redirects, 404s
BROWSER_SAMPLE=all BROWSER_CONCURRENCY=8 npm run test:gh-pages:browser   # every page (~45 min)
```

GitHub's CDN caches pages for up to 10 minutes. If `test:gh-pages` reports "content differs from out/" right after a deploy, wait and re-run. These compare the live site with your local `out/`, so build locally from the same commit first.

Branch `gh-pages` is a leftover from before 2026-10-06 and is no longer used; don't build on it or merge it.

## Adding a future event

This site is the prototype for the next event's site. Adding one:

1. **Data:** add `static-data/years/<token>.json` (same shape as the other year files: `sessions`, `sessionSlugs`, `trackSlugs`, `tracks`, `trackSessions`, `uniquePresenters`, `sponsors`), and add the event to `static-data/global.json`: `codeCampYears`, `codeCampYearsWithSessions`, `idByToken`, `codeCampYearRecById`, `configDictById`, and point `currentCodeCampYear` at it.
2. **Photos:** speaker photos go in `public/static-images/speakers/<id>.webp`, sponsor logos in `public/static-images/sponsors/`.
3. **Home page:** `npm run home-data`, then add the event to `EVENTS` (and `WHO_YEAR_SLUGS` if speakers should show it) in `src/app/(public-site)/home/homeData.ts`.
4. **Places that assume every event is in the past:** the Register button (`showRegisterButton` in `src/app/(public-site)/session/[year]/[sessionSlug]/SessionDetail.tsx`), the home page calls to action (`Home.tsx`, "Explore the 17 events" / "Watch the videos"), the footer's Events column (`src/app/common/Footer.tsx`), the nav (`src/app/(public-site)/global-nav.tsx`), and the counts written into copy ("17 events", "930 speakers" in `Home.tsx`, `Footer.tsx`, `scripts/og-card/card.html`).
5. **Not in this repo:** registration, login, profiles and admin need a server. They existed in the old Next.js app; a new event needs them rebuilt or a hosted form service.

## Gotchas

- **Don't add the base path to `redirect()`/`permanentRedirect()` targets.** Next adds it itself, so adding it doubles the prefix.
- **Do add it everywhere else that isn't `next/link`.** That covers `next/image` `src`, plain `<a>`/`<img>`, and URLs inside HTML stored in the JSON. Use the helpers in `src/lib/basePath.ts`.
- **HTML stored in the JSON** (news bodies and leads, session descriptions, bios) is rendered through `src/lib/sanitize.ts`. Render new HTML fields the same way, never as plain text, or the tags show on the page.
- **`npm run dev` doesn't see JSON edits.** It caches `static-data/` in memory, so restart it.
- **"Corrupted" `.next/` after killing a build mid-write:** fix with `rm -rf .next`.
