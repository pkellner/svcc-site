
import "server-only";
import React, {Suspense} from "react";

import {getTrackSlugs} from "@/lib/staticData/sessions/sessionsUtils";
import {getCodeCampYears} from "@/lib/staticData/codeCampYears/codeCampYears";
import SessionsForTrack from "@/app/(public-site)/track/[year]/[trackSlug]/sessions-for-track";
import TrackHeader from "@/app/(public-site)/track/[year]/[trackSlug]/track-header";

export async function generateStaticParams() {
  const years = await getCodeCampYears();
  const params: { year: string; trackSlug: string }[] = [];
  for (const y of years) {
    const slugs = (await getTrackSlugs(y.urlPostToken)) ?? [];
    const seen = new Set<string>();
    for (const t of slugs) {
      const key = t.trackSlug?.toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        params.push({ year: y.urlPostToken, trackSlug: t.trackSlug });
      }
    }
  }
  return params;
}
export const dynamicParams = false;

export default async function Page(props: { params: Promise<{ trackSlug: string; year: string }> }) {
  const params = await props.params;
  const trackSlugs = await getTrackSlugs(params.year);

  let found: boolean = false;
  let trackId: string = "0";
  if (trackSlugs && trackSlugs.length > 0) {
    trackSlugs.forEach(function (rec) {
      if (rec?.trackSlug?.toLowerCase() === params?.trackSlug?.toLowerCase()) {
        found = true;
        trackId = rec?.trackId.toString() ?? "0";
      }
    });
  }

  if (!found) {
    return (
      <section className="rd-band rd-band--g rd-dots rd-pagehead rd-ss-head">
        <div className="rd-wrap">
          <h1 className="rd-h1">Track Not Found ... {params.trackSlug}</h1>
        </div>
      </section>
    );
  }

  return (
    <>
      <TrackHeader year={params.year} trackId={parseInt(trackId)} />
      <Suspense
        fallback={
          <div className="rd-band rd-band--tight">
            <div className="rd-wrap">Loading...</div>
          </div>
        }
      >
        <SessionsForTrack trackId={parseInt(trackId)} year={params.year} />
      </Suspense>
    </>
  );
}
