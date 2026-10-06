# Silicon Valley Code Camp: the SVCC site (static build)

The Silicon Valley Code Camp (SVCC) website: every year from 2006 to 2019 plus the three "campfire" events, about 3,900 pages covering 2,013 sessions, 930 speakers, tracks, sponsors and news. It is plain HTML, CSS and JavaScript files. There is no database, no server and no login.

| | |
|---|---|
| Live site | https://pkellner.github.io/svcc-site/ |
| Branch `main` | the data (JSON) and the source that builds the site |
| Branch `gh-pages` | the built site that GitHub Pages serves, plus this README |
| Original live site | https://www.siliconvalley-codecamp.com |

This repo has everything needed to change and rebuild the site. Nothing else is required: no database, no other repository.

## Two branches — never merge

| | `main` | `gh-pages` |
|---|---|---|
| Holds | the data (`static-data/*.json`, the source of truth) and the source that builds the site | the generated site, exactly as GitHub Pages serves it |
| Who changes it | you, by editing JSON, templates, styles or images | only the deploy script |
| Default branch on GitHub | no | yes |

**If you are looking at the `gh-pages` branch:** every file here except this README is generated. Don't edit it. A direct edit is overwritten by the next deploy. The data and source are on branch `main`.

**Why two branches.** GitHub Pages serves a branch as it is, so the published files have to sit on a branch of their own. Keeping the generated output, which is about 475 MB and changes in thousands of files on every build, off `main` keeps the source history readable. It also means the whole site can be rebuilt from `main` at any time.

**Never merge them.** The two branches have unrelated histories, because `main` was created as an orphan branch. Never merge either one into the other, never rebase or cherry-pick between them, and never open a pull request from one to the other. The only way changes on `main` reach `gh-pages` is a build followed by a deploy:

```bash
npm run build:gh-pages
ALLOW_SVCC_SITE_DEPLOY=1 npm run deploy:gh-pages    # only with Peter's say-so
```

The deploy copies this README from `main` onto `gh-pages`, which is why both branches show the same README.

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
        v
 out/                       about 3,900 HTML pages, 21,000 files, about 475 MB (not committed)
        |
        |  npm run test:gh-pages:local   checks every link and reference in out/
        |  npm run deploy:gh-pages       pushes out/ to the gh-pages branch
        v
 GitHub Pages (pkellner.github.io/svcc-site/)
```

The JSON is the source of truth. It was exported once from the original MySQL database through a privacy whitelist, and the site no longer depends on that database. To change content, edit the JSON (or a template in `src/`) and rebuild. Step-by-step instructions are in [REBUILD-STATIC-SITE.md](REBUILD-STATIC-SITE.md).

## Layout (branch `main`)

```
static-data/global.json           events, news, per-year config and attendee counts
static-data/years/<token>.json    one file per event: sessions, speakers, tracks, sponsors
public/                           images, speaker and sponsor WebP files, misc pages
src/app/(public-site)/            every public page
src/app/not-found.tsx             404 page that recovers old URLs
src/lib/staticData/               reads static-data/*.json for the pages
src/lib/sanitize.ts               the HTML allowlist for news, session and bio text
src/lib/basePath.ts               base-path helpers for hosting under /svcc-site/
styles/                           stylesheets
scripts/prune-out.sh              removes files that must not be published
scripts/build-home-data.mjs       regenerates the home page galaxy data from the JSON
scripts/og-card/make-og-card.mjs  draws the social card public/images/og-svcc.jpg from the built home page
scripts/deploy-gh-pages.mjs       pushes out/ to gh-pages
scripts/test-gh-pages*.mjs        local, live and in-browser checks
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
- **Search engines.** `sitemap.xml` uses absolute `https://www.siliconvalley-codecamp.com` URLs, and a `robots.txt` under `/svcc-site/` is ignored by crawlers, so search engines find the site at `pkellner.github.io/svcc-site/` only through links to it.
