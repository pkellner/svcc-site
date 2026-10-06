import { readFileSync } from "fs";
import path from "path";
import { normalizeData } from "./normalize";

// Resolved from process.cwd(), not __dirname, because webpack rewrites
// __dirname for server components under `next build`.
let _global: any;

// Twitter is X now. Links inside the exported content (news posts, bios, session descriptions,
// old share links) are rewritten to x.com as the JSON is read, so a re-export needs no extra step.
// Stored entities and escaped HTML are cleaned up at the same time (normalize.ts).
function readJson(p: string) {
  return normalizeData(
    JSON.parse(
      readFileSync(p, "utf8").replace(/(https?:\/\/)?(?<![\w.-])(?:www\.|mobile\.)?twitter\.com\//gi, (_m, proto) => (proto ? "https://x.com/" : "x.com/")),
    ),
  );
}
const _years: Record<string, any> = {};

export function global() {
  if (!_global) {
    const p = path.join(process.cwd(), "static-data", "global.json");
    _global = readJson(p);
  }
  return _global;
}

// Returns undefined for an unknown token rather than throwing; callers decide
// whether that means notFound().
export function year(token: string): any | undefined {
  if (!token) return undefined;
  if (!(token in _years)) {
    const p = path.join(process.cwd(), "static-data", "years", `${token}.json`);
    try {
      const y = readJson(p);
      // Each session's URL slug, as stored. Pages link with this rather than a slug made from the title:
      // the stored slugs were made from the original (sometimes entity-encoded) titles that
      // normalize.ts cleans up, so a slug made from the cleaned title can point at no page.
      const slugById = new Map<number, string>((y?.sessionSlugs ?? []).map((s: any) => [s.sessionId, s.sessionSlug]));
      for (const s of y?.sessions ?? []) s.slug = slugById.get(s.id);
      _years[token] = y;
    } catch {
      _years[token] = undefined;
    }
  }
  return _years[token];
}
