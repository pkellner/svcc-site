import "server-only";

import React from "react";
import {getCodeCampYears} from "@/lib/staticData/codeCampYears/codeCampYears";
import {getCodeCampNameWithDate, getCodeCampYearByYearOrCcyId} from "@/lib/utils";
import {getTrackById} from "@/lib/staticData/sessions/trackDetail";
import {sanitizeBasicHtml} from "@/lib/sanitize";

export default async function TrackHeader({ year, trackId }: { year: string; trackId: number }) {
  const codeCampYears = await getCodeCampYears();
  const ccy = getCodeCampYearByYearOrCcyId(codeCampYears, year);
  const ccyName = getCodeCampNameWithDate(ccy);

  const track = await getTrackById(year, trackId);

  return (
    <section className="rd-band rd-band--g rd-dots rd-pagehead rd-ss-head rd-ss-head--detail">
      <i className="rd-deco rd-deco--a" aria-hidden="true" />
      <i className="rd-deco rd-deco--b" aria-hidden="true" />
      <div className="rd-wrap">
        <div className="rd-ss-chips">
          <span className="rd-chip rd-chip--paper">{ccyName}</span>
          <span className="rd-chip rd-chip--ink">Track</span>
        </div>
        <h1 className="rd-h1">
          <span className="rd-ss-sr">Track - </span>
          {track?.named}
        </h1>
        {track?.description && <div className="rd-sub" dangerouslySetInnerHTML={{ __html: sanitizeBasicHtml(track.description, true) }} />}
      </div>
    </section>
  );
}
