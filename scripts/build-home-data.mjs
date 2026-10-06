// Home page galaxy data, generated from static-data/years/*.json (the past events' data doesn't change, so the
// output is committed):
//   - public/home/sessions.json: one [title, slug, first speaker, time, room] row per session,
//     oldest event first. That is the order of the session tiles, so tile k is row k.
//   - the SPEAKERS block in src/app/(public-site)/home/homeData.ts: each row gains the speaker's
//     slug, their sessions per event and whether they have a photo. The order of the rows is kept.
// Run from the repo root: node scripts/build-home-data.mjs

import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOKENS = ["2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "campfire-1001", "campfire-1002", "campfire-1003"];
const dataFile = path.join(web, "src/app/(public-site)/home/homeData.ts");

// some titles were stored with HTML entities; the home page shows them as plain text
const NAMED = { quot: '"', amp: "&", lt: "<", gt: ">", apos: "'", nbsp: " " };
const plain = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&(quot|amp|lt|gt|apos|nbsp);/g, (_, n) => NAMED[n])
    .replace(/\s+/g, " ")
    .trim();

// the home page places session tiles by each event's session count in homeData.ts (EVENTS), so
// those counts and the rows written here must agree event by event
const dataSrc = fs.readFileSync(dataFile, "utf8");
const expected = new Map();
for (const m of dataSrc.matchAll(/\bcamp\((\d{4}), "\w+", "[^"]*", (\d+),/g)) expected.set(m[1], +m[2]);
for (const m of dataSrc.matchAll(/\bfire\((\d{4}), "\w+", "\d+", "[^"]*", "[^"]*", (\d+)/g)) expected.set("campfire-" + m[1], +m[2]);

const speakers = new Map();
const sessions = [];
TOKENS.forEach((token, bit) => {
  const year = JSON.parse(fs.readFileSync(path.join(web, "static-data/years", token + ".json"), "utf8"));
  const slugs = new Map(year.sessionSlugs.map((s) => [s.sessionId, s.sessionSlug]));
  if (expected.get(token) !== year.sessions.length)
    throw new Error(`${token}: static-data has ${year.sessions.length} sessions, EVENTS in homeData.ts says ${expected.get(token)}`);
  for (const p of year.uniquePresenters) {
    const name = `${p.userFirstName.trim()} ${p.userLastName.trim()}`.trim();
    const s = speakers.get(p.id) ?? { name, slug: p.slug, mask: 0, talks: 0, per: "", photo: 0 };
    const n = new Set(p.sessionsList ?? []).size; // a few lists repeat a session id
    if (s.slug !== p.slug) throw new Error(`speaker ${p.id} has two slugs: ${s.slug}, ${p.slug}`);
    if (!p.slug.endsWith("-" + p.id)) throw new Error(`speaker ${p.id}: slug ${p.slug} does not end in the id`);
    if (n > 35) throw new Error(`speaker ${p.id} has ${n} sessions in ${token}`);
    s.mask |= 1 << bit;
    s.talks += n;
    s.per += n.toString(36);
    if (p.hasImage && fs.existsSync(path.join(web, "public/static-images/speakers", p.id + ".webp"))) s.photo = 1;
    speakers.set(p.id, s);
  }
  for (const s of year.sessions) {
    const a = s.sessionPresenter?.[0]?.attendees;
    const who = a ? `${(a.userFirstName ?? "").trim()} ${(a.userLastName ?? "").trim()}`.trim() : "";
    const slug = slugs.get(s.id);
    if (!slug) throw new Error(`session ${s.id} in ${token} has no slug`);
    // the database holds placeholders ("Not Available x", "Not Assigned") where a slot or room was never set
    let when = (s.sessionTime?.startTimeFriendly ?? "").trim();
    if (!/^\d{1,2}:\d\d [AP]M \w+day$/.test(when)) when = "";
    let room = (s.lectureRoom?.number ?? "").trim();
    if (room === "Not Assigned") room = "";
    sessions.push([plain(s.title), slug, plain(who), when, plain(room)]);
  }
});

fs.writeFileSync(path.join(web, "public/home/sessions.json"), JSON.stringify(sessions) + "\n");

// keep the committed order of the rows: match each one by name and mask
const pool = new Map();
for (const s of speakers.values()) {
  const key = `${s.name}|${s.mask}`;
  if (!pool.has(key)) pool.set(key, []);
  pool.get(key).push(s);
}
const src = fs.readFileSync(dataFile, "utf8");
const head = "export const SPEAKERS: readonly SpeakerRow[] = [\n";
const start = src.indexOf(head);
const end = src.indexOf("\n];", start);
if (start < 0 || end < 0) throw new Error("SPEAKERS block not found in homeData.ts");
const rows = [];
for (const m of src.slice(start + head.length, end).matchAll(/\["((?:[^"\\]|\\.)*)",(\d+),(\d+)[^\]]*\]/g)) {
  const s = pool.get(`${JSON.parse(`"${m[1]}"`)}|${m[2]}`)?.shift();
  if (!s) throw new Error(`no speaker in static-data for row ${m[0]}`);
  rows.push(`[${JSON.stringify(s.name)},${s.mask},${s.talks},"${s.slug}","${s.per}",${s.photo}]`);
}
if (rows.length !== speakers.size) throw new Error(`homeData.ts has ${rows.length} speakers, static-data has ${speakers.size}`);
const lines = [];
for (let i = 0; i < rows.length; i += 3) lines.push("  " + rows.slice(i, i + 3).join(", ") + ",");
fs.writeFileSync(dataFile, src.slice(0, start + head.length) + lines.join("\n") + src.slice(end));

console.log(`sessions.json: ${sessions.length} sessions. homeData.ts: ${rows.length} speakers, ${rows.filter((r) => r.endsWith(",1]")).length} with a photo.`);
