
import React from "react";

import {FirstYearsNoData} from "@/app/(public-site)/home/FirstYearsNoData";
import {getCodeCampYear} from "@/lib/staticData/common/utils/getCodeCampYear";
import CcyProvider from "@/app/contexts/CcyContext";
import {getCodeCampYearIdByYear} from "@/lib/staticData/common/utils/getCodeCampYearIdByYear";
import {getAllYearTokens} from "@/lib/staticData/allYearTokens";

export async function generateStaticParams() {
  return getAllYearTokens();
}
export const dynamicParams = false;

export async function generateMetadata(props: { params: Promise<{ year: string }> }): Promise<Metadata> {
  const { year } = await props.params;
  const id = await getCodeCampYearIdByYear(year);
  const tracks = id ? await getTracksForMeta(id) : [];
  return eventListingMetadata(year, "Tracks", "track", (e) =>
    tracks.length ? `The ${tracks.length} tracks at ${e.label}, ${e.date}: sessions grouped by topic.` : `Sessions by topic at ${e.label}, ${e.date}.`,
  );
}
import ConfigDataProvider from "@/app/contexts/ConfigDataContext";
import {getConfigDataDict} from "@/lib/staticData/configData";
import TracksHeader from "@/app/(public-site)/track/[year]/TracksHeader";
import TrackListData from "@/app/(public-site)/track/[year]/TrackListData";
import {notFound} from "next/navigation";
import {getTracks} from "@/lib/staticData/sessions/getTracks";
import type {Metadata} from "next";
import {eventListingMetadata} from "@/lib/seo";
import {getTracks as getTracksForMeta} from "@/lib/staticData/sessions/getTracks";

export default async function PageTrack(props: { params: Promise<{ year: string }> }) {
  const params = await props.params;
  const codeCampYearId = await getCodeCampYearIdByYear(params.year);
  if (!codeCampYearId) {
    notFound();
  }
  const configDataDict = await getConfigDataDict(codeCampYearId);

  if (params.year === "2006" || params.year === "2007") {
    return <FirstYearsNoData />;
  }

  const codeCampYearRec = await getCodeCampYear(codeCampYearId);
  const tracks = await getTracks(codeCampYearId);

  return (
    <CcyProvider year={params.year} value={codeCampYearRec}>
      {
        // @ts-ignore
        <TracksHeader year={params.year} count={tracks.length} />
      }
      <ConfigDataProvider year={params.year} value={configDataDict}>
        <section className="rd-band rd-band--tight rd-ss-list" aria-labelledby="rd-ss-tracks-title">
          <div className="rd-wrap">
            <h2 id="rd-ss-tracks-title" className="rd-h2 rd-section-title">
              Tracks
            </h2>
            {tracks.length === 0 ? (
              <div className="rd-card rd-ss-note">
                <p style={{ margin: 0 }}>
                  Not all of our events have multiple tracks. For our small events, we typically have just a single track, and for that, you can view it in
                  the sessions section.
                </p>
              </div>
            ) : (
              <TrackListData tracks={tracks} />
            )}
          </div>
        </section>
      </ConfigDataProvider>

    </CcyProvider>
  );
}
