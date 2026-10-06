// The original site's sitemap listed 20 speaker pages under slugs that keep apostrophes, commas,
// periods and spaces (scripts/legacy-speaker-urls.json: [year, old slug, slug on this site], taken
// from https://www.siliconvalley-codecamp.com/sitemap.xml on 2026-10-06). The static site uses one
// URL-safe slug per speaker, so those addresses would answer 404 and rely on the 404 page's script
// to forward them. This writes a real page at each old address that forwards to the new one, so a
// crawler that does not run scripts gets a page and a redirect instead of "not found".
// Runs after `next build` (see the build:* scripts); out/ is wiped by every build.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const WEB_DIR = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.resolve(process.argv[2] ?? path.join(WEB_DIR, "out"));
const rows = JSON.parse(readFileSync(path.join(import.meta.dirname, "legacy-speaker-urls.json"), "utf8"));

if (!existsSync(path.join(OUT_DIR, "index.html"))) {
  console.error(`legacy-speaker-pages: ${OUT_DIR}/index.html does not exist -- run next build first`);
  process.exit(1);
}
// the base path is compiled into the build ("/svcc-site" on project pages, "" at a domain root)
const basePath = readFileSync(path.join(OUT_DIR, "index.html"), "utf8").match(/"(\/[^"\s]*?)?\/_next\/static\//)?.[1] ?? "";
const esc = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
// Same origin and card URLs as src/lib/seo.ts, so a shared old link previews with the speaker's card. The
// page is a redirect, so it is kept out of search results and points them at the speaker's page.
const origin = "https://siliconvalley-codecamp.com";
const ogVersion = readFileSync(path.join(WEB_DIR, "src/lib/seo.ts"), "utf8").match(/OG_VERSION = "([^"]+)"/)?.[1];
if (!ogVersion) throw new Error("legacy-speaker-pages: OG_VERSION not found in src/lib/seo.ts");

let written = 0;
for (const [year, oldSlug, newSlug] of rows) {
  const target = path.join(OUT_DIR, "presenter", year, newSlug, "index.html");
  if (!existsSync(target)) throw new Error(`legacy-speaker-pages: ${year}/${newSlug} is not in the build, so ${oldSlug} has nowhere to go`);
  // the speaker's name as the new page prints it (already HTML-escaped; React leaves comments between the parts)
  const name = readFileSync(target, "utf8").match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]*>/g, "").trim() || "This speaker";
  const href = `${basePath}/presenter/${year}/${newSlug}/`;
  const speakerId = newSlug.match(/-(\d+)$/)?.[1];
  if (!speakerId) throw new Error(`legacy-speaker-pages: ${newSlug} does not end in a speaker id`);
  const card = `${origin}${basePath}/og/speaker/${speakerId}.jpg?v=${ogVersion}`;
  const dir = path.join(OUT_DIR, "presenter", year, oldSlug);
  if (existsSync(path.join(dir, "index.html"))) throw new Error(`legacy-speaker-pages: ${year}/${oldSlug} already exists in the build`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    path.join(dir, "index.html"),
    `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${name} | Silicon Valley Code Camp</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${esc(origin + href)}">
<meta property="og:title" content="${name} · Silicon Valley Code Camp">
<meta property="og:url" content="${esc(origin + href)}">
<meta property="og:image" content="${esc(card)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${esc(card)}">
<meta http-equiv="refresh" content="0; url=${esc(href)}">
<script>location.replace(${JSON.stringify(href)} + location.search + location.hash);</script>
</head>
<body>
<p>${name}'s page has moved to <a href="${esc(href)}">${esc(href)}</a>.</p>
</body>
</html>
`,
  );
  written++;
}
console.log(`legacy-speaker-pages: wrote ${written} forwarding pages under ${path.relative(WEB_DIR, OUT_DIR)}/presenter (base path "${basePath}")`);
