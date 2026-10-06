// Pure, DB-free slug helpers (STATIC-SITE-PLAN.md Step 3/4). Kept out of
// prismaData/staticData so importing a slug function never pulls in
// `@/lib/prisma`, which throws at load time without DATABASE_URL.
import { generateSlug } from "@/app/common/generate-slug";

// Today's form, used verbatim by prismaData/speakers/speakersUtils.ts and
// several public pages. Kept spaces/case exactly as today, which means it
// keeps commas, apostrophes and accented characters too -- URL-unsafe for
// about 18 speakers (STATIC-SITE-PLAN.md Step 4). Superseded by
// `speakerSlug()` below for anything built fresh.
export function generateSpeakerSlug(first: string, last: string, id: number): string {
  return `${first?.replace(" ", "-")?.toLowerCase()}-${last?.replace(" ", "-")?.toLocaleLowerCase()}-${id}`;
}

// Canonical, URL-safe speaker slug (STATIC-SITE-PLAN.md Step 4): runs the
// full name through generateSlug (ASCII, lowercase, ws/punctuation stripped)
// instead of a plain space/case replace, then appends the id. About 40
// speaker URLs differ from today's; all of them are broken or unsafe today.
export function speakerSlug(first: string, last: string, id: number): string {
  return `${generateSlug(`${first ?? ""} ${last ?? ""}`)}-${id}`;
}
