#!/usr/bin/env node
// Loads pages of the deployed GitHub Pages site in real Chromium and fails on
// anything a visitor would see broken: images that don't render, same-origin
// requests that 404, client-side redirects that land in the wrong place, and
// the "Page not found" page where a real page was expected.
//
// Covers every year-level listing page, the bare section pages that redirect,
// legacy URL forms the 404 page recovers, and a sample of detail pages
// (BROWSER_SAMPLE=n, default 80; BROWSER_SAMPLE=all for every page).
import { readdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const OUT_DIR = path.resolve(import.meta.dirname, "..", "out");
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/svcc-site";
const SITE_URL = process.env.GH_PAGES_URL || `https://pkellner.github.io${BASE_PATH}`;
const ORIGIN = new URL(SITE_URL).origin;
const SAMPLE = process.env.BROWSER_SAMPLE || "80";
const CONCURRENCY = Number(process.env.BROWSER_CONCURRENCY || 4);

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

// Deterministic shuffle so a failing sample can be re-run.
function sample(items, n, seed = 42) {
  const a = [...items];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

function buildCases() {
  // /404/ and /_not-found/ are Next's own copies of the not-found page.
  const pages = listPages(OUT_DIR).filter((p) => p !== "/404/" && p !== "/_not-found/");
  const depth = (p) => p.split("/").filter(Boolean).length;
  const cases = [];
  const seen = new Set();
  const add = (c) => {
    if (seen.has(c.path)) return;
    seen.add(c.path);
    cases.push(c);
  };

  add({ path: "/", kind: "home" });
  // Bare section pages render a client-side redirect to the current year.
  for (const section of ["presenter", "session", "sponsor", "track", "event"]) {
    add({ path: `/${section}/`, kind: "redirect", expectPrefix: `/${section}/` });
  }
  // Every year-level page (/session/2018/, /about/2018/, ...).
  for (const p of pages.filter((p) => depth(p) <= 2)) add({ path: p, kind: "listing" });

  // Legacy URL forms recovered by the 404 page's script.
  const aSession = pages.find((p) => /^\/session\/\d{4}\/[^/]+\/$/.test(p));
  if (aSession) add({ path: aSession.replace("/session/", "/Session/"), kind: "legacy", expectPath: aSession });
  add({ path: "/presenter/2018/gaylelaakmann-mcdowell-8367", kind: "legacy", expectPath: "/presenter/2018/gayle-mcdowell-8367/" });
  add({ path: "/login", kind: "legacy", expectPath: "/" });

  const details = pages.filter((p) => depth(p) > 2);
  for (const p of SAMPLE === "all" ? details : sample(details, Number(SAMPLE))) add({ path: p, kind: "detail" });
  return cases;
}

async function checkCase(context, c) {
  const page = await context.newPage();
  const badResponses = [];
  const failedRequests = [];
  const consoleErrors = [];
  page.on("response", (res) => {
    const url = res.url();
    if (url.startsWith(ORIGIN) && res.status() >= 400 && !(c.kind === "legacy" && url === `${SITE_URL}${c.path}`)) {
      badResponses.push(`${res.status()} ${url}`);
    }
  });
  page.on("requestfailed", (req) => {
    // ERR_ABORTED is next/link prefetches cancelled by navigation/page close.
    const error = req.failure()?.errorText ?? "";
    if (req.url().startsWith(ORIGIN) && !error.includes("ERR_ABORTED")) failedRequests.push(`${error} ${req.url()}`);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 200));
  });

  const problems = [];
  try {
    await page.goto(`${SITE_URL}${c.path}`, { waitUntil: "load", timeout: 45000 });

    if (c.kind === "redirect" || c.kind === "legacy") {
      const expect = c.expectPath ?? c.expectPrefix;
      const want = `${SITE_URL}${expect}`;
      await page.waitForURL((u) => (c.expectPath ? u.href === want : u.href.startsWith(want) && u.href !== `${SITE_URL}${c.path}`), { timeout: 15000 }).catch(() => {});
      await page.waitForLoadState("load");
    }

    // next/image lazy-loads below the fold; force everything to load.
    await page.evaluate(() => document.querySelectorAll("img[loading=lazy]").forEach((img) => (img.loading = "eager")));
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});

    const finalUrl = page.url();
    const result = await page.evaluate(() => ({
      notFound: document.querySelector("h1")?.textContent?.trim() === "Page not found",
      brokenImages: [...document.images].filter((img) => img.src && img.complete && img.naturalWidth === 0).map((img) => img.src),
      imageCount: document.images.length,
    }));

    if (!finalUrl.startsWith(SITE_URL)) problems.push(`left the site: ended at ${finalUrl}`);
    if (c.kind === "legacy" && finalUrl !== `${SITE_URL}${c.expectPath}`) problems.push(`expected to land on ${c.expectPath}, ended at ${finalUrl}`);
    if (c.kind === "redirect" && (finalUrl === `${SITE_URL}${c.path}` || !finalUrl.startsWith(`${SITE_URL}${c.expectPrefix}`))) {
      problems.push(`redirect didn't go to ${c.expectPrefix}<year>/, ended at ${finalUrl}`);
    }
    if (result.notFound) problems.push(`rendered "Page not found" (at ${finalUrl})`);
    for (const src of result.brokenImages) problems.push(`broken image ${src}`);
    for (const r of badResponses) problems.push(`HTTP ${r}`);
    for (const r of failedRequests) problems.push(`request failed: ${r}`);
    return { ...c, finalUrl, imageCount: result.imageCount, problems, consoleErrors };
  } catch (err) {
    return { ...c, problems: [`ERROR ${err.message.split("\n")[0]}`], consoleErrors };
  } finally {
    await page.close();
  }
}

async function main() {
  const cases = buildCases();
  console.log(`Browser-testing ${cases.length} pages on ${SITE_URL} (concurrency ${CONCURRENCY}) ...`);
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const results = new Array(cases.length);
  let next = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < cases.length) {
        const i = next++;
        results[i] = await checkCase(context, cases[i]);
        if (++done % 25 === 0) console.log(`  ${done}/${cases.length}`);
      }
    }),
  );
  await browser.close();

  const failed = results.filter((r) => r.problems.length > 0);
  const byKind = {};
  for (const r of results) {
    byKind[r.kind] ??= { total: 0, ok: 0 };
    byKind[r.kind].total++;
    if (r.problems.length === 0) byKind[r.kind].ok++;
  }
  const images = results.reduce((n, r) => n + (r.imageCount ?? 0), 0);

  for (const r of failed.slice(0, 60)) {
    console.log(`\nFAIL ${r.path} [${r.kind}]`);
    for (const p of r.problems.slice(0, 8)) console.log(`  ${p}`);
    if (r.problems.length > 8) console.log(`  ... and ${r.problems.length - 8} more`);
  }
  if (failed.length > 60) console.log(`\n... and ${failed.length - 60} more failing pages`);

  console.log("\nBy page type:");
  for (const [kind, s] of Object.entries(byKind)) console.log(`  ${kind.padEnd(9)} ${s.ok}/${s.total} OK`);
  console.log(`${images} images rendered across ${results.length} pages.`);
  console.log(failed.length === 0 ? "PASS" : `FAIL: ${failed.length} pages with problems.`);
  process.exit(failed.length === 0 ? 0 : 1);
}

main();
