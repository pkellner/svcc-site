# Silicon Valley Code Camp: static, read-only archive

An archive of the Silicon Valley Code Camp (SVCC) website: every year from 2006 to 2019 plus the three "campfire" events, about 3,900 pages covering 2,013 sessions, 930 speakers, tracks, sponsors and news. It is plain HTML, CSS and JavaScript files. There is no database, no server and no login.

| | |
|---|---|
| Live archive | https://pkellner.github.io/svcc-site/ |
| This repo (public) | `pkellner/svcc-site`, branch `gh-pages`: the built site plus this README, nothing else |
| **Source repo (private)** | **`pkellner/course-svcc-speaker-sessions-nextjs13`**, branch `github-pages-no-auth` |
| Original live site | https://www.siliconvalley-codecamp.com |

The site you see here is generated. The source code, the export script, the plan and the runbooks live only in the private repo named above, and the original database never leaves the machine that builds the site. Only the finished static output is published here.

## What this is, in one paragraph

SVCC ran for years as a Next.js 16 application backed by MySQL (through Prisma), Redis caching, next-auth logins, an admin area and some API routes. The event is over, so the site is being retired to a read-only archive that costs nothing to host and can't be hacked or break. This is done by a **one-time export of the database to JSON files**, a **data layer that reads those files instead of the database**, and a **static build (`next build` with `output: "export"`)** that turns every page into a file. The result is published to GitHub Pages at `pkellner.github.io/svcc-site/`. It stays there; there is no move to a custom domain (decided 2026-10-05).

## Theory of operation

### The core idea

The original pages are React server components that ask a data layer (`src/lib/prismaData/**`) for rows and render them. Nothing a visitor can see depends on who they are or on anything that changes after the event. So the database is only needed at *build* time, and only to produce data that never changes again. The strategy is to move the database out of the loop entirely:

```
 MySQL / MariaDB            (needed once, on the build machine only)
        |
        |  npm run export-data      scripts/export-static-data.ts
        |    - runs the app's own query helpers, so the data matches the live site
        |    - maps every record through a privacy whitelist
        |    - cleans up content (links, phone numbers, dead downloads)
        |    - converts photos and logos to WebP
        v
 web/static-data/*.json     (gitignored)  +  web/public/static-images/*.webp  +  public/sitemap.xml
        |
        |  npm run build:gh-pages   (or build:static)
        |    - src/lib/staticData/** reads the JSON instead of Prisma
        |    - every dynamic route lists its pages with generateStaticParams
        |    - next build, output: "export"
        |    - scripts/prune-out.sh removes files that must never be published
        v
 web/out/                   about 3,900 HTML pages, 25,000 files, about 810 MB
        |
        |  npm run test:gh-pages:local   (checks every link and reference)
        |  npm run deploy:gh-pages       (pushes out/ to this repo's gh-pages branch)
        v
 GitHub Pages (pkellner.github.io/svcc-site/)
```

After the export, the database can be shut off. The build and the deployed site never touch it.

### Strategy for converting a database-backed Next.js site to a static, no-database site

This is the full recipe, in the order it was carried out. Each step names the problem it solves.

1. **Branch from production, never from `main`.** Work happens on `github-pages-no-auth`, cut from the production branch. The old `main` branch is hundreds of commits behind and is not used.

2. **Take a complete local copy of the database.** The export runs against a local MariaDB loaded with a copy of production, so the live system is never queried or modified. Only `export-data` needs it.

3. **Export through the app's own query code, not new SQL.** `scripts/export-static-data.ts` calls the same `prismaData` helpers the live pages used, so the JSON holds exactly what the live site would have rendered. It needs a few environment tricks: `TZ=UTC` (news dates are formatted at export time and must not depend on the machine), `SHOW_ALL_EVENTS=true` (so past events are included), `USE_REDIS_CACHE=false`, and a small preload (`scripts/stub-server-only.mjs`) that lets server-only modules load outside Next.

4. **Key everything by id, not by URL token.** Each year has a URL token ("2014", "campfire-1003"). The export stores an `idByToken` map and per-year files, so a page can find its data from either, and the two years that share a token still resolve the way the live site did.

5. **Whitelist, don't blacklist.** Every record goes through an explicit field whitelist before it is written. Anything not named is dropped. This is what keeps private data (emails, zip codes, password hashes, payment amounts) out, including data nobody thought of. The privacy section below lists the result.

6. **Clean the content on the way out.** Free-text fields written by speakers and organisers get rewritten once, at export time: links to the live site's own domain become site-relative, links with changed capitalisation are fixed, old image URLs are pointed at the archived copy, phone numbers are replaced with "[phone number removed]", and a handful of personal email addresses in old news posts are replaced with a shared mailbox. Session "Download the materials" links were each checked over the network (`npm run check-session-materials`); dead ones are dropped and fixable ones repaired.

7. **Convert images once.** Speaker photos (300 px) and sponsor logos (400 px) are read from the database and written as WebP files under `public/static-images/`. The live site served these through an API route; now they are ordinary files. Photos are fetched by speaker id only, never with `SELECT *`, because the same table holds password hashes.

8. **Replace the data layer, not the pages.** `src/lib/staticData/**` has the same function names and return shapes as `src/lib/prismaData/**`, but reads `static-data/*.json` (resolved from the working directory, loaded once and cached). The public pages' imports were switched over, so the page components barely changed. Dates that used to fall back to "now" render blank or `null` instead, so the output is the same on every build.

9. **Give every dynamic route its list of pages.** Static export needs to know every URL ahead of time. Each of the dynamic routes (`[year]`, `[sessionSlug]`, `[presenterSlug]`, `[trackSlug]`, `[newsSlug]`, ...) has `generateStaticParams` fed from the exported data, and `dynamicParams = false`, so an unknown URL is a build-time impossibility rather than a runtime error. Slugs are asserted unique at export time. Speaker URLs end in the speaker id, and the page finds the record by that id, so the name part of the slug can change without breaking the lookup.

10. **Park everything that needs a server.** Login, account, admin and the API routes (`admin/`, `api/`, `account/`, sign-in, the contact form, etc.) were moved to `web/_server-only/`. They are not deleted; they simply aren't part of the build. The navigation lost its Login/Profile/Admin items. Nothing in the static site posts data anywhere.

11. **Configure static export.** `next.config.ts` sets `output: "export"` and `trailingSlash: true` (so `/session/2014/` is `session/2014/index.html`, which every static host serves). `NEXT_PUBLIC_BASE_PATH` sets `basePath` and `assetPrefix`; it is `/svcc-site` for the GitHub project site and empty for a real domain.

12. **Make the base path work everywhere.** GitHub project sites are served under `/svcc-site/`. Next's `Link` component and its `_next/` assets add that prefix automatically, but `next/image`, plain `<a>` and `<img>` tags, and URLs inside database HTML do not. `src/lib/basePath.ts` provides `withBasePath`, `withBasePathIfSiteRelative` and `prefixSiteRelativeUrls` for those places. Redirect targets are the exception: they must *not* be prefixed (the client router adds it, and adding it twice breaks the redirect).

13. **Keep every old URL working.** The bare section pages (`/session`, `/presenter`, `/track`, `/sponsor`, `/event`) use `permanentRedirect` to the newest year. A static site cannot do server redirects, so `not-found.tsx` renders `404.html` with a small script that recovers old links: it lowercases old capitalised URLs (`/Session/...`), maps old-style speaker URLs to the current slug by the trailing id (including the speaker whose name was corrected), and sends parked paths like `/login` and `/admin` to the home page.

14. **Build, then prune.** `next build` copies all of `public/` into `out/`. `scripts/prune-out.sh` then deletes files that must not ship: tax forms and signed agreements, data dumps, sponsorship and prospectus documents, scripts, unrenderable source images, and anything else identified in a manual review of `public/`.

15. **Test against a real server before publishing.** `npm run test:gh-pages:local` checks every reference in `out/`: that it has the base path, that the target file exists, and that it is not a link lost in conversion. It compares links against the original site to tell inherited dead links (404 on the original too) from new breakage.

16. **Publish to a separate public repo.** The private source repo is never made public. `scripts/deploy-gh-pages.mjs` pushes only `out/` to `pkellner/svcc-site` (branch `gh-pages`), including a `.nojekyll` file so GitHub does not strip `_next/`. It fetches the remote tip without file contents first, so a redeploy uploads only the files that changed.

17. **Verify the live site.** After deploying, `npm run test:gh-pages` fetches every page from the live site and compares it byte-for-byte with `out/`, and `npm run test:gh-pages:browser` loads all 3,900 pages in a headless browser, failing on console errors, failed requests or broken images (12,800+ images rendered in the last full run).

18. **No custom domain.** The archive stays on `pkellner.github.io/svcc-site/` (decided 2026-10-05). The root build (`npm run build:static`) and a `PAGES_CNAME` deploy remain possible, and the reviewed checklist is in the private repo's plan, but they are not planned.

### Why not crawl the live site instead?

A site crawler (wget, httrack) was considered and rejected as the main method: it misses lazily loaded chunks, breaks Next's client-navigation requests and saves image URLs with query strings under odd names. A one-off crawl is still worth doing as an insurance snapshot. Faking the Prisma client was also rejected, because it would have to imitate `select` and raw queries. Building directly against the database would make every future rebuild depend on it.

## What the archive exposes

The export only reads people who appear as a speaker (930 distinct people). The rest of the attendee table, which has tens of thousands of registrants, is **not** in the output: no names, no photos, and no per-person records. The only trace of other attendees is a head count per year.

For each speaker, these fields are published:

- name, company, job title and bio
- Twitter, Facebook, LinkedIn and Bluesky handles, and website, as the speaker entered them
- a photo if one exists (829 of 930), a URL slug and the database id
- the sessions they gave, and any Amazon books they listed

Not published, and checked for in the built site: email address fields, phone fields, password hashes, zip code, city, state, sign-up dates and sponsor donation amounts.

Known and accepted: some speakers typed an email address into their own bio (12 people) or session description (3 sessions). These are left as written, as on the original site. Phone numbers in free text are removed.

## Security review

The build output and both repositories were scanned for secrets (cloud, SendGrid, GitHub and Slack tokens, private keys, credentialed database URLs, reCAPTCHA secrets, internal IPs and hostnames), in the final files and in git history. No secrets are published. Specifics:

- The built site contains only static files: no `.env` files, no server code, no database URLs, no API keys. The only identifier present is public by design (the Google Analytics measurement id).
- The private repo's history on the working branch was scanned too, and no live credentials were found.
- Credentials for the local database used to run the export live in a local file outside git.

## Repository layout (private source repo)

```
web/
  scripts/export-static-data.ts     the one-time DB -> JSON/WebP export, with the whitelist and cleanup
  scripts/check-session-materials.ts  checks session download links
  scripts/prune-out.sh              removes files that must not be published
  scripts/deploy-gh-pages.mjs       pushes out/ to the public repo
  scripts/test-gh-pages*.mjs        local, live and in-browser checks
  src/lib/staticData/               data layer that reads static-data/*.json
  src/lib/basePath.ts               base-path helpers for GitHub project-site hosting
  src/app/(public-site)/            every public page
  src/app/not-found.tsx             404 page that recovers old URLs
  _server-only/                     parked login, account, admin and API code (not built)
  static-data/                      generated JSON (gitignored)
  public/static-images/             generated speaker and sponsor WebP images
STATIC-SITE-PLAN.md                 the plan, after two adversarial reviews
STATIC-SITE-HANDOFF.md              what was done, and why
REBUILD-STATIC-SITE.md              step-by-step runbook to regenerate and redeploy
```

## Rebuilding

From `web/` in the private repo, with a local copy of the database and `web/.env` containing `DATABASE_URL`:

```bash
npm ci
npm run export-data           # database -> JSON and images
npm run build:gh-pages        # basePath /svcc-site
npm run test:gh-pages:local   # check out/ before publishing
npm run deploy:gh-pages       # publish to this repo
npm run test:gh-pages         # check the live site matches
```

The full runbook, including the optional materials-link re-check and common changes, is `REBUILD-STATIC-SITE.md` in the private repo. If the database is reloaded from a dump, re-apply any manual data edits first (for example the speaker name correction), or the next export will undo them.

## Limits and notes

- **Content is frozen.** There are no forms, registration, comments or search; the contact form and logins were removed. External links (speaker sites, session materials) may rot. About 70 inherited dead links exist that were already dead on the original site.
- **Site size.** The built site is about 445 MB across 25,000 files, under GitHub Pages' recommended 1 GB limit. Most of the bulk is per-page data files that Next writes beside each page. Anything rendered by the root `not-found.tsx` is repeated in about 15,700 of them, which is why the 404 recovery script is served as `404-recover.js` rather than inline. A real static host has no such limit.
- **Analytics.** Pages load Google Analytics (measurement id hardcoded, because a static build has no runtime environment).
- **Search engines.** `sitemap.xml` and `og:image` still use absolute `https://www.siliconvalley-codecamp.com` URLs, and a `robots.txt` under `/svcc-site/` is ignored by crawlers, so search engines find the archive only through links to it.
