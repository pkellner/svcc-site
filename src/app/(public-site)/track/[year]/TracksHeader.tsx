import "server-only";

import React from "react";
import {getCodeCampYears} from "@/lib/staticData/codeCampYears/codeCampYears";
import {getCodeCampNameWithDate, getCodeCampYearByYearOrCcyId} from "@/lib/utils";

export default async function TracksHeader({ year, count }: { year: string; count?: number }) {
  const codeCampYears = await getCodeCampYears();
  const ccy = getCodeCampYearByYearOrCcyId(codeCampYears, year);
  const ccyName = getCodeCampNameWithDate(ccy);

  return (
    <section className="rd-band rd-band--g rd-dots rd-pagehead rd-ss-head">
      <i className="rd-deco rd-deco--a" aria-hidden="true" />
      <i className="rd-deco rd-deco--b" aria-hidden="true" />
      <div className="rd-wrap">
        <div className="rd-ss-chips">
          <span className="rd-chip rd-chip--paper">{ccyName}</span>
        </div>
        <h1 className="rd-h1">Tracks</h1>
        <p className="rd-sub">
          Silicon Valley Code Camp has chosen a few subject areas that have been organized into tracks. These tracks are designed and scheduled so that if
          you have a specific interest in the track theme you can attend all the sessions associated with that track in an order that makes sense with
          minimal overlap. Tracks are always of the highest quality content and are organized by a track lead, typically from one of our top sponsors.
          This does not mean that there are not other sessions in the same theme as the track, but those other sessions may overlap.
        </p>
        {typeof count === "number" && count > 0 && (
          <ul className="rd-tags rd-ss-count">
            <li className="rd-tag rd-tag--y">
              {count} <i>{count === 1 ? "track" : "tracks"}</i>
            </li>
          </ul>
        )}
      </div>
    </section>
  );
}
