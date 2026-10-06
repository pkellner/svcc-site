import XLogo from "@/app/common/XLogo";
import {jobLine} from "@/lib/displayText";
import React from "react";
import {Speaker} from "@/app/common/CodeCampInterfaces";
import {getCodeCampYears} from "@/lib/staticData/codeCampYears/codeCampYears";
import {getCodeCampNameWithDate, getCodeCampYearByYearOrCcyId} from "@/lib/utils";
import ImageWithFallback from "@/app/common/ImageWithFallback";
import {getBlueskyInUrl, getFacebookUrl, getLinkedInUrl, getTwitterUrl} from "@/lib/staticData/common/utils/socialSiteUtils";
import {withBasePath} from "@/lib/basePath";

// The static export's presenter record: Speaker plus these fields.
type HeaderSpeaker = Speaker & {
  hasImage?: boolean;
  twitterHandle?: string;
  facebookId?: string;
  linkedInId?: string;
  blueskyHandle?: string;
};

// Social links as small buttons. Same rules as the old RectSocial: skip empty
// urls and the "unassigned" placeholder.
function SocialLinks({ speaker }: { speaker: HeaderSpeaker }) {
  const present = (s: string | undefined) => s && s.trim();
  if (!(present(speaker.twitterHandle) || present(speaker.facebookId) || present(speaker.linkedInId) || present(speaker.blueskyHandle))) {
    return null;
  }

  const links = [
    { type: "twitter", label: "X", url: getTwitterUrl(speaker.twitterHandle ?? "") },
    { type: "facebook", label: "Facebook", url: getFacebookUrl(speaker.facebookId ?? "") },
    { type: "linkedin", label: "LinkedIn", url: getLinkedInUrl(speaker.linkedInId ?? "") },
    { type: "bluesky", label: "Bluesky", url: getBlueskyInUrl(speaker.blueskyHandle ?? "") },
  ].filter((l) => l.url && l.url.length > 0 && !l.url.includes("unassigned"));

  if (links.length === 0) return null;

  return (
    <ul className="rd-tags rd-spk-social" aria-label="Social Profiles">
      {links.map((l) => (
        <li key={l.type}>
          <a href={l.url} className="rd-btn rd-btn--sm">
            {l.type === "twitter" ? (
              <XLogo />
            ) : l.type === "bluesky" ? (
              // eslint-disable-next-line @next/next/no-img-element -- same static icon RectSocial uses
              <img src={withBasePath("/images/Bluesky_butterfly-logo.svg.png")} alt="" />
            ) : (
              <i className={`fa fa-${l.type}`} aria-hidden="true" />
            )}
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default async function SpeakerHeader({ speaker, year }: { speaker: HeaderSpeaker; year: string }) {
  const codeCampYears = await getCodeCampYears();
  const ccy = getCodeCampYearByYearOrCcyId(codeCampYears, year);
  const ccyName = getCodeCampNameWithDate(ccy);

  const imageUrl = speaker?.hasImage ? `/static-images/speakers/${speaker?.id}.webp` : "/images/404-not-found-error.jpg";
  const meta = jobLine(speaker.principleJob, speaker.company);

  return (
    <section className="rd-band rd-band--o rd-dots rd-pagehead">
      <i className="rd-deco rd-deco--a" aria-hidden="true" />
      <i className="rd-deco rd-deco--b" aria-hidden="true" />
      <div className="rd-wrap">
        <span className="rd-chip rd-chip--paper rd-chip--wrap">{ccyName}</span>
        <div className="rd-spk-head">
          <ImageWithFallback
            src={imageUrl}
            width={300}
            height={300}
            alt={`${speaker.userFirstName} ${speaker.userLastName}`}
            className="rd-avatar rd-avatar--lg"
            priority
          />
          <div>
            <h1 className="rd-h1">
              {speaker.userFirstName} {speaker.userLastName}
            </h1>
            {meta && <p className="rd-sub">{meta}</p>}
            <SocialLinks speaker={speaker} />
          </div>
        </div>
      </div>
    </section>
  );
}
