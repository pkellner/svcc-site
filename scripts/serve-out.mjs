#!/usr/bin/env node
// Serves out/ the way GitHub Pages does (under the base path, trailing-slash redirects, 404.html for
// unknown paths), so the in-browser test can run against a build before it is deployed:
//   npm run serve:out          (in one terminal)
//   npm run test:browser:local (in another)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve(import.meta.dirname, "..", "out");
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/svcc-site";
const PORT = Number(process.env.PORT || 8787);
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".jpg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".json": "application/json", ".txt": "text/plain", ".ico": "image/x-icon", ".pdf": "application/pdf", ".xml": "application/xml" };

if (!fs.existsSync(path.join(OUT, "index.html"))) {
  console.error("out/index.html does not exist -- run `npm run build:gh-pages` first");
  process.exit(1);
}

http
  .createServer((req, res) => {
    let p;
    try {
      p = decodeURIComponent(req.url.split("?")[0]);
    } catch {
      p = req.url;
    }
    if (p !== BASE && !p.startsWith(BASE + "/")) {
      res.writeHead(404);
      return res.end();
    }
    let file = path.join(OUT, p.slice(BASE.length) || "/");
    if (!file.startsWith(OUT)) {
      res.writeHead(403);
      return res.end();
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      if (!p.endsWith("/")) {
        res.writeHead(301, { location: req.url.replace(/(\?|$)/, "/$1") });
        return res.end();
      }
      file = path.join(file, "index.html");
    }
    if (!fs.existsSync(file)) {
      res.writeHead(404, { "content-type": "text/html" });
      return fs.createReadStream(path.join(OUT, "404.html")).pipe(res);
    }
    res.writeHead(200, { "content-type": TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  })
  .listen(PORT, "127.0.0.1", () => console.log(`Serving out/ at http://127.0.0.1:${PORT}${BASE}/`));
