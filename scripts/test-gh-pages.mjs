#!/usr/bin/env node
// Verifies every page of the static export against its deployed copy on
// GitHub Pages:
//   1. every page in out/ is served live, byte-identical to the local file
//      (and an unknown URL gets the site's own 404 page);
//   2. every same-origin src/href and every Next.js redirect target in every
//      page carries the basePath and resolves to a file that exists in out/;
//   3. every one of those unique targets (images, scripts, CSS, pages) is
//      fetched live and returns 200;
//   4. every og:image/twitter:image card is served live as a JPEG, byte-identical
//      to out/ (scripts/test-meta.mjs checks the tags themselves locally).
// A reference whose target isn't in out/ is compared with the original site
// (ORIGINAL_URL): if the original serves it, it's a FAIL (lost in the
// conversion); if the original 404s too, it's a dead link inherited from old
// content (WARN); files prune-out.sh removes on purpose are listed as such.
// `--local` skips the GitHub Pages checks (1, 3 and 4) -- use it as a pre-deploy
// gate after `npm run build:gh-pages`.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve(import.meta.dirname, "..", "out");
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const SITE_URL = process.env.GH_PAGES_URL || `https://siliconvalley-codecamp.com${BASE_PATH}`;
const ORIGIN = new URL(SITE_URL).origin;
const CONCURRENCY = Number(process.env.TEST_CONCURRENCY || 16);
const ORIGINAL_URL = process.env.ORIGINAL_URL || "https://www.siliconvalley-codecamp.com";
const LOCAL_ONLY = process.argv.includes("--local");
const MAX_REPORT = 100;

// Mirrors scripts/prune-out.sh: removed from the site on purpose.
const PRUNED = [
  /agreement/i,
  /w-?9/i,
  /efile/i,
  /sponsorship/i,
  /brochure/i,
  /prospectus/i,
  /AdvertiseJobOpenings/i,
  /\/miscpages\/(speakers|db|apod)\.json$/,
  /SamsungDeveloperConferencePromoCodeDetails/,
  /\.vcf$/,
  /\/ads\.txt$/,
  /getSpeakerIdsScript\.sh$/,
  /\.(psd|bmp)$/i,
  /\/blocked\.html$/,
  /^\/(pscourse|react-vis)\//,
];

function listPages(dir, pages = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listPages(full, pages);
    else if (entry.name === "index.html") {
      const rel = path.relative(OUT_DIR, dir).split(path.sep).join("/");
      pages.push(rel === "" ? "/" : `/${rel}/`);
    }
  }
  return pages;
}

function decodeEntities(s) {
  return s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

// Same-origin references in one page: HTML src/href attributes plus the
// targets of server-side redirect()/permanentRedirect(), which a static
// export only carries inside the RSC payload. Redirect targets are stored
// without the basePath (Next's client router adds it when it follows them),
// so a target that already has it would end up doubled.
function extractRefs(html) {
  const refs = new Set();
  for (const m of html.matchAll(/\s(?:src|href)="([^"]+)"/g)) refs.add(decodeEntities(m[1]));
  for (const m of html.matchAll(/NEXT_REDIRECT;(?:replace|push);([^;]+);/g)) {
    const target = m[1];
    refs.add(BASE_PATH && target.startsWith(`${BASE_PATH}/`) ? `doubled-basePath:${target}` : `${BASE_PATH}${target}`);
  }
  return [...refs].filter((r) => r.startsWith("doubled-basePath:") || (r.startsWith("/") && !r.startsWith("//")));
}

// Maps a site URL path to the file GitHub Pages would serve for it.
function fileForUrlPath(urlPath) {
  let p = urlPath.split("#")[0].split("?")[0];
  if (!p.startsWith(`${BASE_PATH}/`)) return null;
  p = p.slice(BASE_PATH.length);
  let decoded;
  try {
    decoded = decodeURIComponent(p);
  } catch {
    decoded = p;
  }
  for (const candidate of [decoded, p]) {
    const full = path.join(OUT_DIR, candidate);
    if (candidate.endsWith("/")) {
      if (existsSync(path.join(full, "index.html"))) return path.join(full, "index.html");
    } else if (existsSync(full)) {
      return statSync(full).isDirectory() ? (existsSync(path.join(full, "index.html")) ? path.join(full, "index.html") : null) : full;
    }
  }
  return null;
}

async function pool(items, worker, label) {
  const results = new Array(items.length);
  let next = 0;
  let done = 0;
  async function runner() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i]);
      if (++done % 1000 === 0) console.log(`  ${label}: ${done}/${items.length}`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, runner));
  return results;
}

async function fetchWithRetry(url, init, tries = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { redirect: "follow", ...init });
      if ((res.status >= 500 || res.status === 408 || res.status === 429) && attempt < tries) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      if (attempt >= tries) throw err;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
}

const sha = (buf) => createHash("sha256").update(buf).digest("hex");

function report(title, items, fmt) {
  if (items.length === 0) return;
  console.log(`\n${title} (${items.length}):`);
  for (const it of items.slice(0, MAX_REPORT)) console.log(`  ${fmt(it)}`);
  if (items.length > MAX_REPORT) console.log(`  ... and ${items.length - MAX_REPORT} more`);
}

async function main() {
  if (!existsSync(path.join(OUT_DIR, "index.html"))) {
    console.error(`${OUT_DIR} has no build -- run \`npm run build:gh-pages\` first`);
    process.exit(1);
  }

  const pages = listPages(OUT_DIR);
  console.log(`${pages.length} pages in out/, basePath "${BASE_PATH}"${LOCAL_ONLY ? " (local checks only)" : `, live site ${SITE_URL}`}`);

  // Check 2: every same-origin reference has the basePath and exists in out/.
  const missingBasePath = [];
  const brokenRefs = [];
  const uniqueRefs = new Map(); // ref path (no query/hash) -> first page that uses it
  const socialImages = new Map(); // absolute og:image/twitter:image URL -> first page that uses it
  for (const page of [...pages, "/404.html"]) {
    const file = page === "/404.html" ? path.join(OUT_DIR, "404.html") : path.join(OUT_DIR, page, "index.html");
    const html = readFileSync(file, "utf8");
    for (const ref of extractRefs(html)) {
      if (!ref.startsWith(`${BASE_PATH}/`)) {
        missingBasePath.push({ page, ref });
        continue;
      }
      if (!fileForUrlPath(ref)) brokenRefs.push({ page, ref });
      const key = ref.split("#")[0].split("?")[0];
      if (!uniqueRefs.has(key)) uniqueRefs.set(key, page);
    }
    // og:image and twitter:image are absolute URLs in <meta content>, which extractRefs doesn't see.
    for (const m of html.matchAll(/<meta\s+(?:property|name)="(?:og:image|twitter:image)"\s+content="([^"]+)"/g)) {
      const url = decodeEntities(m[1]);
      if (url.startsWith(`${SITE_URL}/`) && !socialImages.has(url)) socialImages.set(url, page);
    }
  }
  console.log(`${uniqueRefs.size} unique same-origin references checked against out/.`);

  // Classify references whose target isn't in out/ by asking the original site.
  const missingTargets = new Map(); // target path without basePath -> first page
  for (const { page, ref } of brokenRefs) {
    const target = ref.split("#")[0].split("?")[0].slice(BASE_PATH.length);
    if (!missingTargets.has(target)) missingTargets.set(target, page);
  }
  const pruned = [];
  const toAsk = [];
  for (const [target, page] of missingTargets) (PRUNED.some((re) => re.test(target)) ? pruned : toAsk).push({ target, page });
  const asked = await pool(
    toAsk,
    async (item) => {
      try {
        const res = await fetchWithRetry(`${ORIGINAL_URL}${item.target}`);
        const body = Buffer.from(await res.arrayBuffer()).toString("utf8");
        // The original answers unknown speakers/sessions with HTTP 200 and a
        // "Speaker Not Found" page -- a soft 404, not a live page.
        const softNotFound = res.status === 200 && /(Speaker|Session|Sponsor|Track|News|Page) Not Found|This page could not be found/i.test(body);
        return { ...item, originalStatus: softNotFound ? "200 but 'Not Found' page" : res.status };
      } catch (err) {
        return { ...item, originalStatus: 0, error: err.message };
      }
    },
    "original site",
  );
  const lostInConversion = asked.filter((a) => a.originalStatus === 200);
  const inheritedDead = asked.filter((a) => a.originalStatus !== 200);
  if (missingTargets.size > 0) {
    console.log(
      `${missingTargets.size} referenced targets aren't in out/: ${lostInConversion.length} served by the original site, ` +
        `${inheritedDead.length} dead on the original too, ${pruned.length} removed on purpose.`,
    );
  }

  let pageFailures = [];
  let liveRefFailures = [];
  let socialFailures = [];
  if (!LOCAL_ONLY) {
    // Check 1: every page live and byte-identical; unknown URL -> 404 page.
    const probes = [...pages.map((p) => ({ urlPath: p, file: path.join(OUT_DIR, p, "index.html"), expect: 200 }))];
    probes.push({ urlPath: "/this-page-does-not-exist-probe/", file: path.join(OUT_DIR, "404.html"), expect: 404 });

    const pageResults = await pool(
      probes,
      async (probe) => {
        const url = `${SITE_URL}${probe.urlPath}`;
        try {
          const res = await fetchWithRetry(url);
          const body = Buffer.from(await res.arrayBuffer());
          const identical = sha(body) === sha(readFileSync(probe.file));
          return { ...probe, url, status: res.status, ok: res.status === probe.expect && identical, identical };
        } catch (err) {
          return { ...probe, url, status: 0, ok: false, error: err.message };
        }
      },
      "pages",
    );
    pageFailures = pageResults.filter((r) => !r.ok);

    // Check 3: every unique same-origin reference resolves live.
    const refList = [...uniqueRefs.keys()];
    const refResults = await pool(
      refList,
      async (ref) => {
        const url = `${ORIGIN}${ref}`;
        try {
          const res = await fetchWithRetry(url, { method: "HEAD" });
          return { ref, url, status: res.status, ok: res.status === 200, usedOn: uniqueRefs.get(ref) };
        } catch (err) {
          return { ref, url, status: 0, ok: false, error: err.message, usedOn: uniqueRefs.get(ref) };
        }
      },
      "assets",
    );
    liveRefFailures = refResults.filter((r) => !r.ok);

    // Check 4: every social card is served live, as a JPEG, byte-identical to out/.
    const socialResults = await pool(
      [...socialImages.keys()],
      async (url) => {
        const file = fileForUrlPath(url.slice(ORIGIN.length));
        try {
          const res = await fetchWithRetry(url);
          const body = Buffer.from(await res.arrayBuffer());
          const type = res.headers.get("content-type") ?? "";
          const identical = !!file && sha(body) === sha(readFileSync(file));
          return { url, status: res.status, type, identical, ok: res.status === 200 && type.startsWith("image/jpeg") && identical, usedOn: socialImages.get(url) };
        } catch (err) {
          return { url, status: 0, ok: false, error: err.message, usedOn: socialImages.get(url) };
        }
      },
      "social cards",
    );
    socialFailures = socialResults.filter((r) => !r.ok);
  }

  report("References with a wrong basePath (missing, or doubled on a redirect target) -- will 404 on GitHub Pages", missingBasePath, (f) => `${f.ref}   (on ${f.page})`);
  report("FAIL: served by the original site but missing from out/", lostInConversion, (f) => `${f.target}   (linked from ${f.page})`);
  report("WARN: dead links inherited from old content (original site doesn't serve them either)", inheritedDead, (f) =>
    `${f.target} -> original ${f.error ? `ERROR ${f.error}` : `HTTP ${f.originalStatus}`}   (linked from ${f.page})`,
  );
  report("INFO: links to files removed on purpose by prune-out.sh", pruned, (f) => `${f.target}   (linked from ${f.page})`);
  report("Pages that failed live", pageFailures, (f) =>
    f.error ? `${f.urlPath} -> ERROR ${f.error}` : `${f.urlPath} -> HTTP ${f.status}, expected ${f.expect}${f.identical ? "" : ", content differs from out/"}`,
  );
  report("Social cards (og:image/twitter:image) that failed live", socialFailures, (f) =>
    f.error ? `${f.url} -> ERROR ${f.error}` : `${f.url} -> HTTP ${f.status} ${f.type}${f.identical ? "" : ", content differs from out/"}   (used on ${f.usedOn})`,
  );
  report("Assets/links that failed live", liveRefFailures, (f) => `${f.ref} -> ${f.error ? `ERROR ${f.error}` : `HTTP ${f.status}`}   (used on ${f.usedOn})`);

  // Live failures for targets already known to be absent from out/ are
  // covered by the classification above, not counted twice.
  const liveRealFailures = liveRefFailures.filter((f) => fileForUrlPath(f.ref));
  const failed = missingBasePath.length + lostInConversion.length + pageFailures.length + liveRealFailures.length + socialFailures.length;
  console.log("");
  if (!LOCAL_ONLY) {
    console.log(
      `Pages: ${pages.length + 1 - pageFailures.length}/${pages.length + 1} OK (byte-identical to out/).  ` +
        `Unique assets/links served live: ${uniqueRefs.size - liveRealFailures.length - missingTargets.size}/${uniqueRefs.size - missingTargets.size} OK.  ` +
        `Social cards: ${socialImages.size - socialFailures.length}/${socialImages.size} OK.`,
    );
  }
  console.log(
    `References missing basePath: ${missingBasePath.length}.  Lost in conversion: ${lostInConversion.length}.  ` +
      `Inherited dead links (warn): ${inheritedDead.length}.  Pruned on purpose: ${pruned.length}.`,
  );
  console.log(failed === 0 ? "PASS" : `FAIL: ${failed} problems.`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
