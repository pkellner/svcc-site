import "server-only";
import React from "react";
import {getCodeCampNameWithDate, getCodeCampYearByYearOrCcyId} from "@/lib/utils";
import {getCodeCampYears} from "@/lib/staticData/codeCampYears/codeCampYears";

export default async function SpeakersHeader({ year }: { year: string }) {
  const codeCampYears = await getCodeCampYears();
  const ccy = getCodeCampYearByYearOrCcyId(codeCampYears, year);
  const ccyName = getCodeCampNameWithDate(ccy);

  return (
    <section className="rd-band rd-band--o rd-dots rd-pagehead">
      <i className="rd-deco rd-deco--a" aria-hidden="true" />
      <i className="rd-deco rd-deco--b" aria-hidden="true" />
      <div className="rd-wrap">
        <span className="rd-chip rd-chip--paper rd-chip--wrap">{ccyName}</span>
        <h1 className="rd-h1">The Speakers</h1>
        <p className="rd-sub">
          SVCC is the perfect place to watch engaging and entertaining talks given by industry experts and luminaries, and meet with developers for engaging
          and motivating conversations around specific topics.
        </p>
      </div>
    </section>
  );
}
