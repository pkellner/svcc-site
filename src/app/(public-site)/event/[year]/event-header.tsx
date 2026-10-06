import "server-only";

import React from "react";
import {getCodeCampYears} from "@/lib/staticData/codeCampYears/codeCampYears";
import {getCodeCampNameWithDate, getCodeCampYearByYearOrCcyId} from "@/lib/utils";

export default async function EventHeader({ year }: { year: string }) {
  const codeCampYears = await getCodeCampYears();
  const ccy = getCodeCampYearByYearOrCcyId(codeCampYears, year);
  const ccyName = getCodeCampNameWithDate(ccy);

  return (
    <section className="rd-band rd-band--b rd-dots rd-pagehead">
      <i className="rd-deco rd-deco--a" aria-hidden="true" />
      <i className="rd-deco rd-deco--b" aria-hidden="true" />
      <div className="rd-wrap">
        <ul className="rd-nae-chips">
          <li>
            <span className="rd-chip rd-chip--paper rd-chip--wrap">{ccyName}</span>
          </li>
          {ccy?.codeCampDateString ? (
            <li>
              <span className="rd-chip rd-chip--y rd-chip--wrap">{ccy.codeCampDateString}</span>
            </li>
          ) : null}
          {ccy?.locationName ? (
            <li>
              <span className="rd-chip rd-chip--ink rd-chip--wrap">{ccy.locationName}</span>
            </li>
          ) : null}
        </ul>
        <h1 className="rd-h1">{ccy.name}</h1>
      </div>
    </section>
  );
}
