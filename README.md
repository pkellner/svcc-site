# Silicon Valley Code Camp: the SVCC site (static build)

The Silicon Valley Code Camp (SVCC) website: every year from 2006 to 2019 plus the three "campfire" events, about 3,900 pages covering 2,013 sessions, 930 speakers, tracks, sponsors and news. It is plain HTML, CSS and JavaScript files. There is no database, no server and no login.

| | |
|---|---|
| Live site | https://siliconvalley-codecamp.com/ |
| Source | this repo, branch `main`: the data (JSON), the page templates and the build |
| Publishing | GitHub Actions builds `main` on every push and deploys it to GitHub Pages |
| Before 2026-10-06 | the same address ran a Next.js app with a database; this static build replaced it |

This repo has everything needed to change and rebuild the site. Nothing else is required: no database, no other repository, no local build.

## How it gets published

Push to `main` and GitHub does the rest. The workflow in `.github/workflows/deploy.yml`:

1. checks out `main`, installs the packages (`npm ci`) and Playwright's Chromium (the social cards are drawn in a browser);
2. runs `npm run typecheck` and `npm run build:gh-pages`, which writes the whole site to `out/`;
3. runs `npm run test:gh-pages:local` and `npm run test:meta` against `out/`;
4. uploads `out/` and deploys it to GitHub Pages, which serves it at https://siliconvalley-codecamp.com/.

A run takes about ten minutes. If any step fails, nothing is deployed and the site stays as it was. Pushes to other branches run steps 1 to 3 only, so a change can be checked without publishing it. The Actions tab also has a "Run workflow" button for a manual deploy. Pushes that touch only `*.md` files don't trigger a run.

Your machine only pushes the source change. The build output (about 21,000 files, 600 MB) exists only on the GitHub runner and moves from there to Pages; nothing is built or uploaded from your computer. A one-line fix made in the GitHub web editor deploys like any other push.

**Branch `gh-pages`** held the built site until 2026-10-06, when Pages served that branch and a script pushed each build to it. Nothing writes to it any more. Once an Actions deploy has been confirmed, it can be deleted and `main` made the default branch.

## How it works

```
 static-data/*.json         the site's data: years, sessions, speakers, tracks, sponsors, news
 public/                    images and files served as they are
 src/                       Next.js page templates that turn the JSON into pages
        |
        |  npm run build:gh-pages
        |    - next build with output: "export" renders every page to a file
        |    - scripts/prune-out.sh removes files that must never be published
        |    - scripts/legacy-speaker-pages.mjs adds 20 forwarding pages for old speaker URLs
        |    - scripts/og-card/make-page-cards.mjs draws a social card for every page
        v
 out/                       about 3,900 HTML pages, 21,000 files, about 600 MB (not committed)
        |
        |  npm run test:gh-pages:local   checks every link and reference in out/
        |  npm run test:meta             checks titles, social tags and card images
        |  actions/deploy-pages          (in the workflow) publishes out/
        v
 GitHub Pages (siliconvalley-codecamp.com)
```

The JSON is the source of truth. It was exported once from the original MySQL database through a privacy whitelist, and the site no longer depends on that database. To change content, edit the JSON (or a template in `src/`), push, and the workflow rebuilds the site.

## Working locally

Publishing needs nothing on your machine, but to see a change before pushing it:

```bash
npm run setup                # once: installs the packages and Playwright's Chromium
npm run dev                  # http://localhost:3100; restart it after editing the JSON
```

To check the exact files the workflow will deploy, run the same steps it runs:

```bash
npm run build:gh-pages       # builds out/ (a few minutes)
npm run serve:out            # http://127.0.0.1:8787/ serves out/ the way Pages will
npm run test:gh-pages:local
npm run test:meta
```

The dev server doesn't produce the social cards or the 20 legacy forwarding pages; only the build does. [REBUILD-STATIC-SITE.md](REBUILD-STATIC-SITE.md) has the full checklist, including the browser test and how to add an event.

## Layout

```
static-data/global.json           events, news, per-year config and attendee counts
static-data/years/<token>.json    one file per event: sessions, speakers, tracks, sponsors
public/                           images, speaker and sponsor WebP files, misc pages
src/app/(public-site)/            every public page
src/app/not-found.tsx             404 page that recovers old URLs
src/lib/staticData/               reads static-data/*.json for the pages
src/lib/sanitize.ts               the HTML allowlist for news, session and bio text
src/lib/basePath.ts               base-path helpers (no-ops: the site is served from the root)
styles/                           stylesheets
scripts/prune-out.sh              removes files that must not be published
scripts/build-home-data.mjs       regenerates the home page galaxy data from the JSON
scripts/og-card/make-og-card.mjs  draws the social card public/images/og-svcc.jpg from the built home page
scripts/og-card/make-page-cards.mjs  draws the per-page social cards into out/og/ during the build
scripts/test-gh-pages*.mjs        local, live and in-browser checks
scripts/test-meta.mjs             checks every page's title, description and social tags
.github/workflows/deploy.yml      builds, tests and deploys on every push to main
```

## What the site exposes

The data covers only people who appear as a speaker (930 people). The original attendee table, with tens of thousands of registrants, is not included: no names, no photos and no per-person records. The only trace of other attendees is a head count per year.

For each speaker, these fields are published:

- name, company, job title and bio
- Twitter, Facebook, LinkedIn and Bluesky handles, and website, as the speaker entered them
- a photo if one exists (829 of 930), a URL slug and the database id
- the sessions they gave, and any Amazon books they listed

Not included: email address fields, phone fields, password hashes, zip code, city, state, sign-up dates and sponsor donation amounts. Some speakers typed an email address into their own bio or session description; these are left as written, as on the original site. Phone numbers in free text were removed at export.

## Limits and notes

- **Static: no forms, logins or search.** There is no registration, comments or search. External links (speaker sites, session materials) may rot; about 47 links were already dead on the original site.
- **Analytics.** Pages load Google Analytics (measurement id hardcoded, because a static build has no runtime environment).
- **Search engines.** `sitemap.xml`, canonical links and the social cards (`og:image`) all use absolute `https://siliconvalley-codecamp.com` URLs.
