import "server-only";

import React from "react";
import {getCodeCampYears} from "@/lib/staticData/codeCampYears/codeCampYears";
import {getCodeCampNameWithDate, getCodeCampYearByYearOrCcyId} from "@/lib/utils";

export default async function SessionsHeader({ year, count }: { year: string; count?: number }) {
  const codeCampYears = await getCodeCampYears();
  const ccy = getCodeCampYearByYearOrCcyId(codeCampYears, year);
  const ccyName = getCodeCampNameWithDate(ccy);

  return (
    <section className="rd-band rd-band--b rd-dots rd-pagehead rd-ss-head">
      <i className="rd-deco rd-deco--a" aria-hidden="true" />
      <i className="rd-deco rd-deco--b" aria-hidden="true" />
      <div className="rd-wrap">
        <div className="rd-ss-chips">
          <span className="rd-chip rd-chip--paper">{ccyName}</span>
        </div>
        <h1 className="rd-h1">The Sessions</h1>
        <p className="rd-sub">
          Silicon Valley Code Camp is the perfect place to watch engaging and entertaining talks given by industry experts and luminaries, and meet with
          developers for engaging and motivating conversations around specific topics.
        </p>
        {typeof count === "number" && count > 0 && (
          <ul className="rd-tags rd-ss-count">
            <li className="rd-tag rd-tag--y">
              {count} <i>sessions</i>
            </li>
          </ul>
        )}
      </div>
    </section>
  );
}
