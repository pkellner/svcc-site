// Page metadata: title, description, canonical URL and the social card (og:* and twitter:*) for every page.
// Each route's generateMetadata calls pageMetadata(); layout.tsx holds the site-wide defaults.
import type { Metadata } from "next";
import { withBasePath } from "@/lib/basePath";
import { sanitizeBasicHtml } from "@/lib/sanitize";
import { getAttendeeCountsByYear, getCodeCampYears, getCodeCampYearsWithSessions, getCountByYearId } from "@/lib/staticData/codeCampYears/codeCampYears";

export const SITE_NAME = "Silicon Valley Code Camp";
export const SITE_DESCRIPTION = "Silicon Valley Code Camp is a community event where developers learn from developers.";

// Where the site is served: GitHub Pages on the custom domain (the CNAME the deploy writes).
export const SITE_ORIGIN = "https://siliconvalley-codecamp.com";

/** Absolute URL of a site path ("/session/2019/" -> "https://siliconvalley-codecamp.com/session/2019/"). */
export function absUrl(path: string): string {
  return SITE_ORIGIN + withBasePath(path);
}

// Bump when the per-page cards (scripts/og-card) change, so sites that cached the old ones fetch them again.
// scripts/legacy-speaker-pages.mjs reads this line.
export const OG_VERSION = "1";
// The home page card, public/images/og-svcc.jpg; its ?v= changes whenever `npm run og-card` redraws it.
export const HOME_CARD_PATH = "/images/og-svcc.jpg?v=3";
export const HOME_CARD_ALT = "Silicon Valley Code Camp: 37,954 people, 930 speakers, 2,013 sessions and 17 events. Douglas Crockford spoke at 12 of them.";

// Per-page cards are drawn at build time into out/og/<type>/<key>.jpg (scripts/og-card).
const card = (type: string, key: string) => absUrl(`/og/${type}/${key}.jpg?v=${OG_VERSION}`);
export const HOME_CARD = absUrl(HOME_CARD_PATH);
export const eventCard = (token: string) => card("event", token);
export const trackCard = (token: string, trackSlug: string) => card("track", `${token}--${trackSlug}`);
export const speakerCard = (speakerId: number | string) => card("speaker", String(speakerId));
export const newsCard = (codeCampYear: string, titleSlug: string) => card("news", `${codeCampYear}--${titleSlug}`);

const ENTITIES: Record<string, string> = { quot: '"', amp: "&", lt: "<", gt: ">", apos: "'", nbsp: " " };

/** Plain text from stored HTML: tags dropped, entities decoded, whitespace collapsed, cut at a word boundary. */
const decodeEntities = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&(quot|amp|lt|gt|apos|nbsp);/g, (_, n) => ENTITIES[n]);

export function plainText(html: string | null | undefined, max = 160): string {
  // Strip, decode, then strip and decode again: some session descriptions store their HTML escaped
  // ("&lt;p&gt;..."), which the first pass turns back into tags.
  const once = decodeEntities(sanitizeBasicHtml(html ?? "", false));
  const text = decodeEntities(sanitizeBasicHtml(once, false))
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return (space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.\-–—]+$/, "") + "…";
}

export interface EventInfo {
  token: string;
  label: string; // "Code Camp 2019" or "Code Campfire: Software Architecture"
  date: string;
  location: string;
  sessions: number;
  speakers: number;
  attendees: number | null;
}

/** What a page needs to say about an event, from its URL token ("2019", "campfire-1003"). */
export async function eventInfo(token: string): Promise<EventInfo | undefined> {
  const ccy: any = (await getCodeCampYears()).find((c: any) => c.urlPostToken === token);
  if (!ccy) return undefined;
  const id = Number(ccy.id);
  const counts: any = ((await getCodeCampYearsWithSessions()) as any[]).find((c: any) => c.codeCampYearId === id);
  const location = counts?.locationName ?? ccy.locationName ?? "Foothill College";
  return {
    token,
    label: id > 1000 ? `Code Campfire: ${ccy.name}` : `Code Camp ${token}`,
    date: ccy.codeCampDateString ?? "",
    location: location === "Virtual" ? "online" : location,
    sessions: counts?.totalSessions ?? 0,
    speakers: counts?.totalUniquePresenters ?? 0,
    attendees: getCountByYearId(await getAttendeeCountsByYear(), id),
  };
}

const n = (count: number, one: string) => `${count.toLocaleString("en-US")} ${count === 1 ? one : one + "s"}`;

/** "Code Camp 2019, October 19 & 20, 2019 at PayPal Town Hall: 154 sessions by 160 speakers." */
export function eventSentence(e: EventInfo): string {
  const where = e.location === "online" ? "online" : `at ${e.location}`;
  const what = e.sessions ? `: ${n(e.sessions, "session")} by ${n(e.speakers, "speaker")}` : "";
  return `${e.label}, ${e.date} ${where}${what}.`;
}

interface PageMeta {
  title?: string; // without the site name; omitted for the home page
  description: string;
  path: string; // site path with trailing slash, e.g. "/session/2019/"
  image: string; // absolute card URL
  imageAlt?: string;
  type?: "website" | "article" | "profile";
}

const MIN_DESCRIPTION = 40;
const MAX_DESCRIPTION = 200;

export function pageMetadata({ title, description, path, image, imageAlt, type = "website" }: PageMeta): Metadata {
  const fullTitle = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
  let desc = description.trim();
  if (desc.length < MIN_DESCRIPTION) desc = `${desc} ${SITE_DESCRIPTION}`.trim();
  if (desc.length > MAX_DESCRIPTION) desc = plainText(desc, MAX_DESCRIPTION);
  const url = absUrl(path);
  const images = [{ url: image, width: 1200, height: 630, alt: imageAlt ?? fullTitle }];
  return {
    title: { absolute: fullTitle },
    description: desc,
    alternates: { canonical: url },
    openGraph: { title: fullTitle, description: desc, url, type, siteName: SITE_NAME, images },
    twitter: { card: "summary_large_image", title: fullTitle, description: desc, images },
  };
}

/** Listing pages of one event ("Sessions · Code Camp 2019"), all on that event's card. */
export async function eventListingMetadata(token: string, section: string, pathPrefix: string, sentence: (e: EventInfo) => string): Promise<Metadata> {
  const e = await eventInfo(token);
  if (!e) return {};
  return pageMetadata({
    title: `${section} · ${e.label}`,
    description: sentence(e),
    path: `/${pathPrefix}/${token}/`,
    image: eventCard(token),
    imageAlt: `${e.label}, ${e.date}`,
  });
}
