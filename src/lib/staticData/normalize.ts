// Cleans the stored text as static-data/*.json is read (src/lib/staticData/load.ts), and again in
// scripts/og-card/make-page-cards.mjs, so pages, metadata and social cards all show the same text.
// No path aliases here: the card script imports this file directly with Node.
//
// Two kinds of damage come from the original database:
//   - plain-text fields stored with HTML entities ("Mashups &amp; Mashlets"), which a page renders
//     as text and so shows the entity itself;
//   - HTML fields stored escaped ("&lt;p&gt;The August 2008 release..."), which even a sanitizing
//     HTML renderer shows as visible tags.

const NAMED: Record<string, string> = { quot: '"', amp: "&", lt: "<", gt: ">", apos: "'", nbsp: " " };

export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&(quot|amp|lt|gt|apos|nbsp);/g, (_, n) => NAMED[n]);
}

// Rendered as HTML (through src/lib/sanitize.ts).
const HTML_FIELDS = new Set(["contentData", "description", "userBio"]);
// One-line summaries, shown as text in some places and as HTML in others: made plain text.
const SUMMARY_FIELDS = new Set(["descriptionShort", "userBioShort"]);
// Rendered as text.
const TEXT_FIELDS = new Set(["title", "named", "userFirstName", "userLastName", "company", "principleJob", "sponsorName", "authors"]);

const ENTITY = /&(?:#\d+|#x[0-9a-f]+|quot|amp|lt|gt|apos|nbsp);/i;
const ESCAPED_TAG = /&lt;\/?[a-z][a-z0-9]*(?:\s[^&]*?)?\/?&gt;/i;

function clean(key: string, value: string): string {
  if (TEXT_FIELDS.has(key) && ENTITY.test(value)) return decodeEntities(value);
  if (HTML_FIELDS.has(key) && ESCAPED_TAG.test(value)) return decodeEntities(value);
  if (SUMMARY_FIELDS.has(key) && (ENTITY.test(value) || /<[a-z/!]/i.test(value))) {
    const html = ESCAPED_TAG.test(value) ? decodeEntities(value) : value;
    return decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
  }
  return value;
}

export function normalizeData<T>(value: T, key = ""): T {
  if (typeof value === "string") return clean(key, value) as T;
  if (Array.isArray(value)) return value.map((v) => normalizeData(v, key)) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = normalizeData(v, k);
    return out as T;
  }
  return value;
}
