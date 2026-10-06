#!/usr/bin/env node
// Draws a 1200x630 social card for every event, track, speaker and news page, from static-data/*.json,
// into out/og/<type>/<key>.jpg. The keys are what src/lib/seo.ts puts in og:image:
//   event/<yearToken>.jpg   track/<yearToken>--<trackSlug>.jpg   speaker/<speakerId>.jpg
//   news/<codeCampYear>--<titleSlug>.jpg
// Sessions use their first speaker's card and listing pages their event's card, so they get none of their own.
// Runs as the last step of build:gh-pages / build:static, then checks out/ is still under the Pages size limit.
//
//   node scripts/og-card/make-page-cards.mjs [--only=event|track|speaker|news] [--limit=N]
//   OG_PAGE_OUT=/some/dir   write somewhere other than out/og (and skip the size check)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";
import { EVENTS, VENUES, WHO_YEAR_SLUGS, WHO_YEAR_LABELS, RING_COLORS } from "../../src/app/(public-site)/home/homeData.ts";
import { normalizeData } from "../../src/lib/staticData/normalize.ts";

const ROOT = path.resolve(import.meta.dirname, "../..");
const OUT_DIR = path.join(ROOT, "out");
const DEST = process.env.OG_PAGE_OUT ? path.resolve(process.env.OG_PAGE_OUT) : path.join(OUT_DIR, "og");
const MAX_OUT_MB = 900;
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const ONLY = arg("only");
const LIMIT = arg("limit") ? parseInt(arg("limit"), 10) : Infinity;

const TYPES = { ".html": "text/html", ".css": "text/css", ".woff2": "font/woff2" };
if (!fs.existsSync(path.join(ROOT, "styles/redesign-fonts.css"))) {
  console.error("styles/redesign-fonts.css is missing -- the cards need the site fonts");
  process.exit(1);
}

// ---------- data ----------
// Same clean-up the site applies as it reads the JSON (entities in titles, escaped HTML).
// Same name src/lib/staticData/sessions/trackDetail.ts gives a track that has a slug but no record.
const slugName = (slug) =>
  slug
    .split("-")
    .filter(Boolean)
    .map((w) => (w.length <= 3 && w !== "and" ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
const readJson = (p) => normalizeData(JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8")));
const global = readJson("static-data/global.json");
const tokens = global.codeCampYears.map((y) => y.urlPostToken);
const years = Object.fromEntries(tokens.map((t) => [t, readJson(`static-data/years/${t}.json`)]));
const eventOf = (token) => EVENTS.find((e) => e.slug === token);
const fmt = (n) => n.toLocaleString("en-US");
const attendees = Object.fromEntries(global.attendeeCountsByYear.map((r) => [r.CodeCampYearId, r._count._all]));
const NAMED = { quot: '"', amp: "&", lt: "<", gt: ">", apos: "'", nbsp: " " };
const plain = (s) =>
  String(s ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&(quot|amp|lt|gt|apos|nbsp);/g, (_, n) => NAMED[n])
    .replace(/\s+/g, " ")
    .trim();
const eventTitle = (e) => (e.v === "campfire" ? `Code Campfire: ${e.title}` : e.title);

function eventCards() {
  return tokens.map((t) => {
    const e = eventOf(t);
    const id = years[t].id ?? global.idByToken?.[t];
    const people = e.v !== "campfire" ? attendees[id] : null;
    const st = [];
    if (e.se != null) st.push([fmt(e.se), "sessions", "#f7931d"]);
    if (e.sp != null) st.push([fmt(e.sp), "speakers", "#23abe1"]);
    if (people) st.push([fmt(people), "people", "#39b449"]);
    return {
      key: `event/${t}`,
      d: { type: "event", rings: 4, kicker: e.v === "campfire" ? "Online event" : "Event", title: eventTitle(e), sub: e.v === "campfire" ? `${e.date} · Online` : `${e.date} · ${VENUES[e.v].name}`, stats: st },
    };
  });
}

// Same rule as track/[year]/[trackSlug]/page.tsx generateStaticParams: first slug wins, case-insensitively.
function trackCards() {
  const cards = [];
  for (const t of tokens) {
    const y = years[t];
    const seen = new Set();
    const sessionsById = new Map(y.sessions.map((s) => [s.id, s]));
    for (const ts of y.trackSlugs ?? []) {
      const k = ts.trackSlug?.toLowerCase();
      if (!k || seen.has(k)) continue;
      seen.add(k);
      const track = y.tracks.find((x) => x.id === ts.trackId);
      const ids = y.trackSessions?.[ts.trackId] ?? [];
      const n = ids.length;
      cards.push({
        key: `track/${t}--${ts.trackSlug}`,
        d: {
          type: "track",
          rings: 4,
          kicker: "Track",
          title: plain(track?.named ?? slugName(ts.trackSlug)),
          sub: `${n} ${n === 1 ? "session" : "sessions"} · ${eventTitle(eventOf(t))}`,
          list: ids.map((i) => sessionsById.get(i)).filter(Boolean).slice(0, 3).map((s) => plain(s.title)),
        },
      });
    }
  }
  return cards;
}

function speakerCards() {
  const byId = new Map();
  // newest event first, so the name and job shown are the latest ones
  for (const t of [...WHO_YEAR_SLUGS].reverse().concat(tokens.filter((t) => !WHO_YEAR_SLUGS.includes(t)))) {
    for (const p of years[t]?.uniquePresenters ?? []) {
      if (!byId.has(p.id)) byId.set(p.id, { p, per: new Map() });
      byId.get(p.id).per.set(t, p.sessionsList?.length ?? 0);
    }
  }
  const cards = [];
  for (const [id, { p, per }] of [...byId].sort((a, b) => a[0] - b[0])) {
    const events = per.size;
    const talks = [...per.values()].reduce((a, b) => a + b, 0);
    let on = 0;
    const yrs = WHO_YEAR_SLUGS.map((slug, i) => ({ label: WHO_YEAR_LABELS[i], color: per.has(slug) ? RING_COLORS[on++ % 4] : null }));
    const photoFile = path.join(ROOT, "public/static-images/speakers", `${id}.webp`);
    const job = [plain(p.principleJob), plain(p.company)].filter((s) => s && s.length > 1).join(" · ");
    cards.push({
      key: `speaker/${id}`,
      d: {
        type: "speaker",
        rings: Math.max(3, events),
        events,
        title: plain(`${p.userFirstName ?? ""} ${p.userLastName ?? ""}`),
        initials: [p.userFirstName, p.userLastName].map((s) => plain(s).charAt(0).toUpperCase()).join(""),
        sub: job,
        meta: `${events} ${events === 1 ? "event" : "events"} · ${talks} ${talks === 1 ? "session" : "sessions"}`,
        yrs,
        photo: fs.existsSync(photoFile) ? "data:image/webp;base64," + fs.readFileSync(photoFile).toString("base64") : null,
      },
    });
  }
  return cards;
}

function newsCards() {
  const seen = new Set();
  const cards = [];
  for (const n of global.allNewsData) {
    const key = `news/${n.codeCampYear}--${n.titleSlug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const date = new Date(n.postDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
    const e = eventOf(n.codeCampYear);
    cards.push({
      key,
      d: { type: "news", rings: 4, kicker: `News · ${date}`, title: plain(n.title), sub: [n.authors && `By ${plain(n.authors)}`, e && eventTitle(e)].filter(Boolean).join(" · ") },
    });
  }
  return cards;
}

const all = { event: eventCards, track: trackCards, speaker: speakerCards, news: newsCards };
const jobs = Object.entries(all)
  .filter(([type]) => !ONLY || type === ONLY)
  .flatMap(([, make]) => make().slice(0, LIMIT));

// ---------- render ----------
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  const file = url.startsWith("/repo/") ? path.join(ROOT, url.slice(6)) : null;
  if (!file || !file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));

const started = Date.now();
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${server.address().port}/repo/scripts/og-card/page-card.html`, { waitUntil: "networkidle" });
  for (const type of Object.keys(all)) fs.mkdirSync(path.join(DEST, type), { recursive: true });
  let done = 0;
  for (const { key, d } of jobs) {
    await page.evaluate((d) => window.render(d), d);
    await page.screenshot({ path: path.join(DEST, `${key}.jpg`), type: "jpeg", quality: 80 });
    if (++done % 200 === 0) console.log(`  ${done}/${jobs.length}`);
  }
} finally {
  await browser.close();
  server.close();
}
const counts = jobs.reduce((m, j) => ((m[j.key.split("/")[0]] = (m[j.key.split("/")[0]] ?? 0) + 1), m), {});
console.log(`og cards: ${jobs.length} written to ${path.relative(ROOT, DEST) || DEST} in ${((Date.now() - started) / 1000).toFixed(0)}s (${Object.entries(counts).map(([k, n]) => `${k} ${n}`).join(", ")})`);

// GitHub Pages' limit is 1 GB; prune-out.sh checks the same 900 MB before the cards are added.
if (!process.env.OG_PAGE_OUT && fs.existsSync(OUT_DIR)) {
  const mb = parseInt(execFileSync("du", ["-sm", OUT_DIR], { encoding: "utf8" }).split("\t")[0], 10);
  console.log(`out/ is now ${mb}MB.`);
  if (mb > MAX_OUT_MB) {
    console.error(`ERROR: out/ exceeds ${MAX_OUT_MB}MB (Pages limit is 1GB).`);
    process.exit(1);
  }
}
