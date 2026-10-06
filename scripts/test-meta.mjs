#!/usr/bin/env node
// Checks the built site's per-page metadata and wording (HANDOFF-LIVE-SITE-AND-SOCIAL.md, "Tests"):
//   - every page has its own title, description, canonical, og:* and twitter:* tags
//   - og:url and canonical are the page's own address
//   - titles are unique within each kind of page
//   - descriptions are plain text (no tags or double-escaped entities)
//   - og:image is an absolute address of a 1200x630 JPEG that exists in out/, and no card in out/og/ is unused
//   - no page shows raw markup (escaped entities or tags as text)
//   - no visible text frames the site as an archive (data that genuinely says "archive" is allowlisted)
// Run after a build, from the repo root: node scripts/test-meta.mjs
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "out");
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const ORIGIN = "https://siliconvalley-codecamp.com";
const SITE = ORIGIN + BASE;

// Text in the data (bios, session descriptions, links) that really does say these words.
const WORDING = /\b(archive[sd]?|read-only|frozen)\b/i;
// Escaped entities or formatting tags showing as text (the stored-HTML bugs in news leads, bios and descriptions).
const RAW_MARKUP = /&amp;(?:amp|lt|gt|quot|nbsp|#\d+|#x[0-9a-f]+);|&lt;\/?(?:p|br|div|span|ul|ol|li|font|strong|b|i|em|a|img|table|tr|td)(?:\s[^&]*)?\/?&gt;/i;
const WORDING_ALLOW = [/http archive/i, /archive\.msdn/i, /archive\.org/i, /\/archive\//i, /libraries archive/i, /msdn archives/i, /read-only objects/i];

if (!existsSync(path.join(OUT, "index.html"))) {
  console.error("out/index.html does not exist -- run `npm run build:gh-pages` first");
  process.exit(1);
}

const failures = [];
const fail = (page, msg) => failures.push(`${page}: ${msg}`);

function walk(dir, files = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== "_next") walk(p, files);
    } else files.push(p);
  }
  return files;
}

function decode(s) {
  return s.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

// <meta name|property="k" content="v"> and <link rel="canonical">, values decoded once
function headTags(html) {
  const head = html.slice(0, html.indexOf("</head>") + 1 || undefined);
  const meta = new Map();
  for (const m of head.matchAll(/<meta\s+([^>]*?)\/?>/g)) {
    const attrs = Object.fromEntries([...m[1].matchAll(/([\w:-]+)="([^"]*)"/g)].map((a) => [a[1], decode(a[2])]));
    const key = attrs.property ?? attrs.name;
    if (key && attrs.content !== undefined) meta.set(key, [...(meta.get(key) ?? []), attrs.content]);
  }
  const titles = [...head.matchAll(/<title>([^<]*)<\/title>/g)].map((m) => decode(m[1]));
  const canon = [...head.matchAll(/<link\s+[^>]*rel="canonical"[^>]*>/g)].map((m) => decode(m[0].match(/href="([^"]*)"/)?.[1] ?? ""));
  return { meta, titles, canon };
}

function jpegSize(file) {
  const b = readFileSync(file);
  if (b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    const len = b.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    i += 2 + len;
  }
  return null;
}

function visibleText(html) {
  const body = html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ");
  const attrs = [...body.matchAll(/\s(?:alt|title|aria-label|placeholder|content)="([^"]*)"/g)].map((m) => m[1]);
  return decode(body.replace(/<[^>]+>/g, " ") + " " + attrs.join(" ")).replace(/\s+/g, " ");
}

const legacy = new Set(JSON.parse(readFileSync(path.join(ROOT, "scripts/legacy-speaker-urls.json"), "utf8")).map(([y, slug]) => `/presenter/${y}/${slug}/`));
const pages = walk(OUT).filter((f) => f.endsWith("/index.html"));
const titlesByKind = new Map();
const usedImages = new Set();
const sizeCache = new Map();
let checked = 0;

for (const file of pages) {
  const rel = "/" + path.relative(OUT, path.dirname(file)).split(path.sep).join("/") + "/";
  const page = rel === "//" ? "/" : rel;
  const html = readFileSync(file, "utf8");
  if (legacy.has(page) || /http-equiv="refresh"/.test(html) || /NEXT_REDIRECT;/.test(html)) continue;
  const notFound = page === "/404/" || page === "/_not-found/";
  checked++;

  const { meta, titles, canon } = headTags(html);
  const one = (k) => {
    const v = meta.get(k) ?? [];
    if (v.length !== 1) fail(page, `${v.length} × ${k}`);
    return v[0] ?? "";
  };
  if (titles.length !== 1) fail(page, `${titles.length} × <title>`);
  const desc = one("description");
  one("og:title");
  const ogDesc = one("og:description");
  const ogUrl = notFound ? "" : one("og:url"); // a not-found page has no address of its own
  const ogImage = one("og:image");
  one("og:image:alt");
  if (one("og:image:width") !== "1200" || one("og:image:height") !== "630") fail(page, "og:image width/height is not 1200x630");
  if (one("twitter:card") !== "summary_large_image") fail(page, "twitter:card is not summary_large_image");
  one("twitter:image");

  if (!notFound) {
    const self = SITE + page;
    if (ogUrl !== self) fail(page, `og:url is ${ogUrl}, expected ${self}`);
    if (canon.length !== 1 || canon[0] !== self) fail(page, `canonical is ${canon.join(", ") || "missing"}, expected ${self}`);
    const kind = page.split("/").filter(Boolean).map((s, i) => (i === 0 ? s : "*")).join("/") || "home";
    const t = titles[0];
    if (!titlesByKind.has(kind)) titlesByKind.set(kind, new Map());
    const seen = titlesByKind.get(kind);
    seen.set(t, [...(seen.get(t) ?? []), page]);
  }

  for (const [k, v] of [["description", desc], ["og:description", ogDesc]]) {
    if (v.length < 30 || v.length > 200) fail(page, `${k} is ${v.length} characters: "${v.slice(0, 60)}"`);
    if (/<\/?[a-z][^>]*>|&(lt|gt|amp|nbsp|quot|#\d+|#x[0-9a-f]+);/i.test(v)) fail(page, `${k} has markup or escaped entities: "${v.slice(0, 80)}"`);
  }

  if (!ogImage.startsWith(SITE + "/")) fail(page, `og:image is not under ${SITE}/: ${ogImage}`);
  else {
    const imgRel = ogImage.slice(SITE.length).split("?")[0];
    const imgFile = path.join(OUT, imgRel);
    usedImages.add(imgRel);
    if (!sizeCache.has(imgFile)) sizeCache.set(imgFile, existsSync(imgFile) ? jpegSize(imgFile) : "missing");
    const sz = sizeCache.get(imgFile);
    if (sz === "missing") fail(page, `og:image file ${imgRel} is not in out/`);
    else if (!sz || sz.w !== 1200 || sz.h !== 630) fail(page, `og:image ${imgRel} is not a 1200x630 JPEG (${sz ? sz.w + "x" + sz.h : "unreadable"})`);
  }

  // Markup a visitor would see: in the HTML source, a visible "&amp;" is "&amp;amp;" and a visible "<p>" is "&lt;p&gt;".
  const sourceText = html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ");
  const raw = sourceText.match(RAW_MARKUP);
  if (raw) fail(page, `visible markup: "…${sourceText.slice(Math.max(0, raw.index - 40), raw.index + 50).replace(/\s+/g, " ")}…"`);

  const text = visibleText(html);
  for (const m of text.matchAll(new RegExp(WORDING.source, "gi"))) {
    const ctx = text.slice(Math.max(0, m.index - 50), m.index + 50);
    if (!WORDING_ALLOW.some((re) => re.test(ctx))) fail(page, `archive wording: "…${ctx}…"`);
  }
}

// Two different speaker records with the same name in the same year (separate ids, separate pages).
const SHARED_TITLES = new Set(["Todd McLeod · Code Camp 2015 · Silicon Valley Code Camp", "David McCarter · Code Camp 2017 · Silicon Valley Code Camp"]);
for (const [kind, seen] of titlesByKind)
  for (const [t, list] of seen) if (list.length > 1 && !SHARED_TITLES.has(t)) fail(list[0], `title "${t}" is shared by ${list.length} ${kind} pages (also ${list.slice(1, 3).join(", ")})`);

const ogDir = path.join(OUT, "og");
if (existsSync(ogDir))
  for (const f of walk(ogDir)) {
    const rel = "/" + path.relative(OUT, f).split(path.sep).join("/");
    if (!usedImages.has(rel)) fail(rel, "card is not used by any page");
  }

for (const f of readdirSync(path.join(ROOT, "scripts/og-card")).filter((n) => n.endsWith(".html"))) {
  const text = visibleText(readFileSync(path.join(ROOT, "scripts/og-card", f), "utf8"));
  const m = text.match(WORDING);
  if (m) fail(`scripts/og-card/${f}`, `archive wording: "${m[0]}"`);
}

console.log(`Checked ${checked} pages, ${usedImages.size} distinct og:images, ${sizeCache.size} image files.`);
if (failures.length) {
  const shown = failures.slice(0, 60);
  console.log(shown.join("\n"));
  if (failures.length > shown.length) console.log(`... and ${failures.length - shown.length} more`);
  console.log(`FAIL: ${failures.length} problems`);
  process.exit(1);
}
console.log("PASS");
