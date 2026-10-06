import {getCodeCampYearByYearOrCcyId} from "@/lib/utils";
import {getCodeCampYears} from "@/lib/staticData/codeCampYears/codeCampYears";
import {notFound} from "next/navigation";

export default async function AboutHeader({ year }: { year: string }) {
  const codeCampYears = await getCodeCampYears();
  const codeCampYear = await getCodeCampYearByYearOrCcyId(codeCampYears, year);
  if (!codeCampYear) {
    notFound();
  }

  return (
    <section className="rd-band rd-band--ink rd-pagehead">
      <i className="rd-deco rd-deco--a" aria-hidden="true" />
      <i className="rd-deco rd-deco--b" aria-hidden="true" />
      <div className="rd-wrap">
        <ul className="rd-nae-chips">
          <li>
            <span className="rd-chip rd-chip--g">Silicon Valley Code Camp</span>
          </li>
          <li>
            <span className="rd-chip rd-chip--paper rd-chip--wrap">Current or Latest Event: {codeCampYear?.name}</span>
          </li>
        </ul>
        <h1 className="rd-h1">About Code Camp</h1>
        <p className="rd-sub">Run by volunteers, from the organizers to every speaker.</p>
      </div>
    </section>
  );
}
