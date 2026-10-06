// Static replacement for the direct @/lib/prisma calls in
// track/[year]/[trackSlug]/track-header.tsx and sessions-for-track.tsx
// (STATIC-SITE-PLAN.md Step 3 hand-edits). Both only ever need data already
// exported for that year's tracks/trackSessions.
import { year } from "@/lib/staticData/load";

// A few tracks have a URL slug but no track record (2009 "java" and "test", for example); their name
// is made from the slug so the page still has a heading and a title.
export async function getTrackById(urlPostToken: string, trackId: number): Promise<{ id: number; named: string; description: string } | undefined> {
  const y = year(urlPostToken);
  const track = y?.tracks?.find((t: any) => t.id === trackId);
  if (track) return track;
  const slug: string | undefined = y?.trackSlugs?.find((t: any) => t.trackId === trackId)?.trackSlug;
  if (!slug) return undefined;
  const named = slug
    .split("-")
    .filter(Boolean)
    .map((w) => (w.length <= 3 && w !== "and" ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
  return { id: trackId, named, description: "" };
}

export async function getSessionIdsForTrack(urlPostToken: string, trackId: number): Promise<number[]> {
  return year(urlPostToken)?.trackSessions?.[trackId] ?? [];
}
