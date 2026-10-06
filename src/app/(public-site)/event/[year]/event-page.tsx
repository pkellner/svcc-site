import React from "react";
import {getCodeCampYears} from "@/lib/staticData/codeCampYears/codeCampYears";
import {getCodeCampYearByYearOrCcyId} from "@/lib/utils";
import {withBasePath} from "@/lib/basePath";

export default async function EventPage({ year }: { year: string }) {
  const codeCampYears = await getCodeCampYears();
  const ccy = getCodeCampYearByYearOrCcyId(codeCampYears, year);

  return (
    <section className="rd-nae-body">
      <div className="rd-wrap rd-event">
        <div>
          <h2 className="rd-h2 rd-section-title">Details</h2>
          <ul className="rd-event-links">
            <li>
              <a className="rd-card rd-card--link rd-event-link" href={withBasePath(`/session/${year}`)}>
                <h3 className="rd-h3">Sessions</h3>
                <span className="rd-event-arrow" aria-hidden="true">&rarr;</span>
              </a>
            </li>
            <li>
              <a className="rd-card rd-card--link rd-event-link" href={withBasePath(`/presenter/${year}`)}>
                <h3 className="rd-h3">Speakers</h3>
                <span className="rd-event-arrow" aria-hidden="true">&rarr;</span>
              </a>
            </li>
            <li>
              <a className="rd-card rd-card--link rd-event-link" href={withBasePath(`/sponsor/${year}`)}>
                <h3 className="rd-h3">Sponsors</h3>
                <span className="rd-event-arrow" aria-hidden="true">&rarr;</span>
              </a>
            </li>
          </ul>
        </div>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element -- static export: plain img, basePath applied by hand */}
          <img className="rd-photo" width={450} src={withBasePath(`/images/eventimages/reduced/${ccy.id}.jpg`)} alt={`${parseInt(ccy.id) > 1000 ? "Silicon Valley Code Campfire: " : ""}${ccy.name} photo`} />
        </div>
      </div>
    </section>
  );
}
