# Rebuilding and redeploying the SVCC archive

How to change the site and publish it. Everything runs from the root of branch `main` of this repo.

| | |
|---|---|
| Data and source | `pkellner/svcc-site`, branch `main` |
| Published site | https://pkellner.github.io/svcc-site/ (branch `gh-pages`) |

## 0. One-time setup

- `npm ci`, then `npx playwright install chromium` (only the browser test needs it).
- `gh auth login` with push access to `pkellner/svcc-site`.

No database and no `.env` are needed.

## 1. Make the change

- **Content** (a news post, a session, a speaker bio): edit `static-data/global.json` (events and news, key `allNewsData`) or `static-data/years/<token>.json` (sessions, speakers, tracks, sponsors for one event).
- **A page's layout or wording**: edit the template under `src/app/(public-site)/`.
- **An image**: replace the file under `public/`.

If a session or speaker changed, also run `npm run home-data`. It regenerates the home page galaxy data (`public/home/sessions.json` and the speaker rows in `src/app/(public-site)/home/homeData.ts`) from the JSON. On unchanged data it changes nothing.

For code changes, run `npm run typecheck` too.

## 2. Build

```bash
npm run build:gh-pages     # for https://pkellner.github.io/svcc-site/ (served under /svcc-site/)
```

This writes `out/` (about 3,900 pages, 21,000 files, about 475 MB), runs `scripts/prune-out.sh` to remove files that must never be published, and adds 20 forwarding pages for speaker addresses the original sitemap spelled differently (`scripts/legacy-speaker-urls.json`).

`npm run build:static` is a root build for a custom domain. It is not used (decided 2026-10-05), and its deploy needs `PAGES_CNAME`. The base path is compiled in, so use the build that matches where you deploy.

## 3. Check before deploying

```bash
npm run test:gh-pages:local
```

This must end in `PASS`. It checks that every link, image and redirect in every page carries the base path and points at a file that exists in `out/`. Links that don't exist are compared with the original site: it fails if the original serves them, and warns if they're dead there too.

## 4. Deploy

Peter may edit the `gh-pages` branch directly, and a deploy replaces it with `out/`. So before deploying, check that the remote `gh-pages` head is still the last deploy, and deploy only with Peter's say-so:

```bash
ALLOW_SVCC_SITE_DEPLOY=1 npm run deploy:gh-pages
```

This pushes `out/` to `gh-pages`. It's incremental: unchanged files (all the images) aren't re-uploaded. GitHub Pages then publishes in about a minute:

```bash
gh api repos/pkellner/svcc-site/pages/builds/latest --jq '.status+" "+.commit'
```

## 5. Verify the live site

```bash
npm run test:gh-pages            # every page byte-identical to out/ + every image/script/link loads
npm run test:gh-pages:browser    # real Chromium on a sample of pages: broken images, redirects, 404s
BROWSER_SAMPLE=all BROWSER_CONCURRENCY=8 npm run test:gh-pages:browser   # every page (~45 min)
```

GitHub's CDN caches pages for up to 10 minutes. If `test:gh-pages` reports "content differs from out/" right after a deploy, wait and re-run.

## 6. Commit

Commit the JSON and source changes on `main`. The deploy step publishes the built site to `gh-pages` separately.

## Gotchas

- **Don't add the base path to `redirect()`/`permanentRedirect()` targets.** Next adds it itself, so adding it doubles the prefix.
- **Do add it everywhere else that isn't `next/link`.** That covers `next/image` `src`, plain `<a>`/`<img>`, and URLs inside HTML stored in the JSON. Use the helpers in `src/lib/basePath.ts`.
- **HTML stored in the JSON** (news bodies and leads, session descriptions, bios) is rendered through `src/lib/sanitize.ts`. Render new HTML fields the same way, never as plain text, or the tags show on the page.
- **`npm run dev` doesn't see JSON edits.** It caches `static-data/` in memory, so restart it.
- **"Corrupted" `.next/` after killing a build mid-write:** fix with `rm -rf .next`.
