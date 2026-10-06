// Static mirror of src/lib/prismaData/sessions/sessionsUtils.ts
import { year } from "@/lib/staticData/load";
import type { Session } from "@/lib/staticData/sessions/sessionTypes";

export type { Session };

export async function getTrackSlugs(urlPostToken: string): Promise<{ trackId: number; trackSlug: string }[]> {
  return year(urlPostToken)?.trackSlugs ?? [];
}

export async function getSessionSlugs(urlPostToken: string): Promise<{ sessionId: number; sessionSlug: string }[]> {
  return year(urlPostToken)?.sessionSlugs ?? [];
}

// Static export only ever has one shape of call site left in the public
// tree: getSessionsData(urlPostToken). The sessionId/approvedOnly overloads
// existed for admin pages, which are parked, not mirrored.
export async function getSessionsData(urlPostToken: string | undefined = undefined): Promise<Session[] | undefined> {
  if (!urlPostToken) return undefined;
  return year(urlPostToken)?.sessions;
}
