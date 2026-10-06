// Static replacement for the direct @/lib/prisma calls in
// track/[year]/[trackSlug]/track-header.tsx and sessions-for-track.tsx
// (STATIC-SITE-PLAN.md Step 3 hand-edits). Both only ever need data already
// exported for that year's tracks/trackSessions.
import { year } from "@/lib/staticData/load";

export async function getTrackById(urlPostToken: string, trackId: number): Promise<{ id: number; named: string; description: string } | undefined> {
  return year(urlPostToken)?.tracks?.find((t: any) => t.id === trackId);
}

export async function getSessionIdsForTrack(urlPostToken: string, trackId: number): Promise<number[]> {
  return year(urlPostToken)?.trackSessions?.[trackId] ?? [];
}
