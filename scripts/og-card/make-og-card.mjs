#!/usr/bin/env node
// Draws the social card, public/images/og-svcc.jpg (1200x630), from the built home page:
// the speaker cluster with the first returning speaker (Douglas Crockford) picked, and his card
// as a popup. Needs a build in out/ (npm run build:gh-pages) and Playwright's chromium.
// Run from the repo root: node scripts/og-card/make-og-card.mjs
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(import.meta.dirname, "../..");
const OUT = path.join(ROOT, "out");
const DEST = process.env.OG_OUT ? path.resolve(process.env.OG_OUT) : path.join(ROOT, "public/images/og-svcc.jpg");
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/svcc-site";

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".json": "application/json", ".txt": "text/plain" };

if (!fs.existsSync(path.join(OUT, "index.html"))) {
  console.error("out/index.html does not exist -- run `npm run build:gh-pages` first");
  process.exit(1);
}

// out/ under the base path, and the repo itself under /repo/ (card.html and the fonts)
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  let file;
  if (url.startsWith("/repo/")) file = path.join(ROOT, url.slice(6));
  else if (url === BASE || url.startsWith(BASE + "/")) file = path.join(OUT, url.slice(BASE.length));
  if (file && fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!file || !file.startsWith(ROOT) || !fs.existsSync(file)) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
try {
  // 1. The home page at a wide layout. Reduced motion stops the tour that tags random marks.
  const home = await browser.newPage({ viewport: { width: 2000, height: 1200 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  await home.goto(`${origin}${BASE}/`, { waitUntil: "networkidle" });
  await home.locator('[data-hm="gal"]').scrollIntoViewIfNeeded();
  await home.waitForTimeout(2500);

  const who = await home.evaluate(() => {
    const card = document.querySelector('[data-hm="who-card"]');
    return {
      name: card.querySelector('[data-hm="who-name"]').textContent,
      meta: card.querySelector('[data-hm="who-meta"]').textContent,
      svg: card.querySelector("svg").outerHTML,
      yrs: [...card.querySelectorAll("li a")].map((a) => ({ label: a.textContent.trim(), color: a.querySelector("i").style.backgroundColor || null })),
    };
  });

  // Hide the labels, and move the side card above the canvas so the wire to it is not drawn. The
  // canvas measures the card only when the gallery changes width, so nudge the width and put it back.
  await home.addStyleTag({ content: '.rd-hm-labs, [data-hm="tag"], [data-hm="lens"] { visibility: hidden !important; } [data-hm="who-card"] { position: fixed !important; top: -2000px !important; }' });
  const nudge = await home.addStyleTag({ content: '[data-hm="gal"] { width: 1090px !important; }' });
  await home.waitForTimeout(800);
  await nudge.evaluate((el) => el.remove());
  await home.waitForTimeout(2500);

  // The cluster disc, from the layout constants in homeCanvases.ts (WIDE.spk in an 860-wide design).
  const cv = await home.locator('[data-hm="gal-cv"]').boundingBox();
  const sc = cv.width / 860;
  const R = 250 * sc * 1.04;
  const clip = { x: cv.x + 590 * sc - R, y: cv.y + 360 * sc - R, width: 2 * R, height: 2 * R };
  const cluster = await home.screenshot({ clip, type: "png" });

  // 2. The card page: find the picked speaker's white ring in the capture, then lay out and shoot.
  const card = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await card.goto(`${origin}/repo/scripts/og-card/card.html`, { waitUntil: "networkidle" });
  const src = "data:image/png;base64," + cluster.toString("base64");
  const ring = await card.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const w = img.naturalWidth, h = img.naturalHeight;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const x = c.getContext("2d");
    x.drawImage(img, 0, 0);
    const px = x.getImageData(0, 0, w, h).data;
    // white pixels in the middle of the disc: the highlight ring (marks and specks are colored)
    const xs = [], ys = [];
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const k = (j * w + i) * 4;
        if (px[k] > 235 && px[k + 1] > 235 && px[k + 2] > 235 && Math.hypot(i - w / 2, j - h / 2) < w * 0.3) {
          xs.push(i);
          ys.push(j);
        }
      }
    const med = (a) => a.slice().sort((p, q) => p - q)[a.length >> 1];
    const mx = med(xs), my = med(ys);
    const r = med(xs.map((v, n) => Math.hypot(v - mx, ys[n] - my)));
    return { x: mx / w, y: my / h, r: r / w, n: xs.length };
  }, src);
  if (ring.n < 50) throw new Error(`could not find the highlight ring in the cluster capture (${ring.n} white pixels)`);

  await card.evaluate(
    (d) => window.render(d),
    {
      ...who,
      cluster: src,
      ring,
      stats: [
        ["37,954", "people", "#7fd3f5"],
        ["930", "speakers", "ring"],
        ["2,013", "sessions", "#f7931d"],
        ["17", "events", "#39b449"],
      ],
    },
  );
  await card.waitForTimeout(300);
  await card.screenshot({ path: DEST, type: "jpeg", quality: 88 });
  console.log(`wrote ${path.relative(ROOT, DEST)} (${who.name}, ring at ${ring.x.toFixed(3)},${ring.y.toFixed(3)})`);
} finally {
  await browser.close();
  server.close();
}
