import "server-only";
import React from "react";
import {Session} from "@/app/common/CodeCampInterfaces";
import {getCodeCampNameWithDate, getCodeCampYearByYearOrCcyId} from "@/lib/utils";
import {getCodeCampYears} from "@/lib/staticData/codeCampYears/codeCampYears";
import {getConfigDataDict} from "@/lib/staticData/configData";
import ImageWithFallback from "@/app/common/ImageWithFallback";
import {speakerSlug} from "@/lib/slugs";
import {withBasePath} from "@/lib/basePath";

type HeaderPresenter = {
  attendeeId: number;
  attendees?: { userFirstName?: string; userLastName?: string; hasImage?: boolean };
};

export default async function SessionDetailHeader({ session, year }: { session: Session; year: string | undefined }) {
  const codeCampYears = await getCodeCampYears();
  const ccy = getCodeCampYearByYearOrCcyId(codeCampYears, year ?? "");
  const ccyName = ccy ? getCodeCampNameWithDate(ccy) : "";
  const configDataDict = ccy ? await getConfigDataDict(ccy?.id) : {};

  const showWhen = !session?.sessionTime?.startTimeFriendly?.includes("Not Available");

  const showWhere = !session?.lectureRoom?.number?.includes("Not Assigned");

  const renderWhen = showWhen && configDataDict["ShowAgendaOnSchedule"] === "true";
  const renderWhere = showWhere && configDataDict["ShowRoomOnSchedule"] === "true";

  // The static session records carry their speakers on sessionPresenter (see SessionDetail).
  const presenters: HeaderPresenter[] = (session as unknown as { sessionPresenter?: HeaderPresenter[] })?.sessionPresenter ?? [];

  return (
    <section className="rd-band rd-band--b rd-dots rd-pagehead rd-ss-head rd-ss-head--detail">
      <i className="rd-deco rd-deco--a" aria-hidden="true" />
      <i className="rd-deco rd-deco--b" aria-hidden="true" />
      <div className="rd-wrap">
        <div className="rd-ss-chips">
          {ccyName && <span className="rd-chip rd-chip--paper">{ccyName}</span>}
          <span className="rd-chip rd-chip--ink">Session</span>
        </div>
        <h1 className="rd-h1">{session?.title}</h1>
        {session?.descriptionShort && <p className="rd-sub">{session?.descriptionShort}</p>}

        {presenters.length > 0 && (
          <ul className="rd-ss-speakers" aria-label="Speakers">
            {presenters.map((sp) => {
              const firstName = sp?.attendees?.userFirstName || "";
              const lastName = sp?.attendees?.userLastName || "";
              const imageUrl = sp?.attendees?.hasImage ? `/static-images/speakers/${sp?.attendeeId}.webp` : "/images/404-not-found-error.jpg";
              return (
                <li key={`hd-sp-${sp?.attendeeId}`}>
                  <ImageWithFallback src={imageUrl} width={88} height={88} alt="" className="rd-avatar rd-avatar--sm" />
                  <a href={withBasePath(`/presenter/${year}/${speakerSlug(firstName, lastName, sp?.attendeeId)}`)}>
                    {firstName} {lastName}
                  </a>
                </li>
              );
            })}
          </ul>
        )}

        {(renderWhen || renderWhere) && (
          <ul className="rd-tags">
            {renderWhen && (
              <li className="rd-tag">
                <i>When</i> {session?.sessionTime?.startTimeFriendly}
              </li>
            )}
            {renderWhere && (
              <li className="rd-tag">
                <i>Where</i> {session?.lectureRoom?.number}
              </li>
            )}
          </ul>
        )}
      </div>
    </section>
  );
}
