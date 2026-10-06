"use client";
import React from "react";
import {NextPage} from "next";
import Image from "next/image";
import { withBasePath } from "@/lib/basePath";

type Sponsor = {
  id: number;
  sponsorSupportLevel: string;
  webSite: string;
  hasImage: boolean;
  sponsorListId: number;
  sponsorName: string;
};

type Props = {
  year: string;
  sponsorsList: Sponsor[];
  ccyName: string;
};

const MAILTO = "mailto:sponsorship@siliconvalley-codecamp.com";
const MAIL = "sponsorship@siliconvalley-codecamp.com";

// One tier: logos in white, slightly tilted tiles (the home prototype's sponsor
// pile, static). Image sizes are what each tier rendered at before.
function SponsorTier({
  sponsorsList,
  level,
  title,
  size,
  imgSize,
  band,
}: {
  sponsorsList: Sponsor[];
  level: string;
  title: string;
  size: "l" | "m" | "s";
  imgSize: number;
  band: string;
}) {
  const sponsors = sponsorsList.filter((sponsor) => sponsor.sponsorSupportLevel === level);
  if (sponsors.length === 0) return null;

  return (
    <section className={`rd-band rd-band--tight rd-sp-tier ${band}`} aria-labelledby={`rd-sp-${level}`}>
      <div className="rd-wrap">
        <div className="rd-section-title">
          <h2 className="rd-h2" id={`rd-sp-${level}`}>
            {title}
          </h2>
        </div>
        <ul className={`rd-sp-pile rd-sp-pile--${size}`}>
          {sponsors.map((sponsor) => (
            <li key={sponsor.id}>
              <a className="rd-sp-logo" href={sponsor.webSite} target="_blank">
                <Image
                  src={withBasePath(sponsor.hasImage ? `/static-images/sponsors/${sponsor.sponsorListId}.webp` : "/images/404-not-found-error.jpg")}
                  width={imgSize}
                  height={imgSize}
                  alt={`${sponsor.sponsorName}`}
                />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const SponsorPage: NextPage<Props> = ({ sponsorsList, ccyName }) => {
  return (
    <div>
      <section className="rd-band rd-band--p rd-dots rd-pagehead">
        <i className="rd-deco rd-deco--a" aria-hidden="true" />
        <i className="rd-deco rd-deco--b" aria-hidden="true" />
        <div className="rd-wrap">
          <span className="rd-chip rd-chip--paper rd-chip--wrap">{ccyName}</span>
          <h1 className="rd-h1">Our Sponsors</h1>
          <p className="rd-sub rd-sp-lede">
            Silicon Valley Code Camp appreciates our sponsors for their dedication and contribution to the conference and the feeling is mutual.
          </p>
          <p className="rd-sub">
            Bridging the gap between brand presence and brand involvement, Sponsors provide specific initiatives that benefit our attendees and registrants
            while enhancing the overall experience.
          </p>
        </div>
      </section>

      {sponsorsList.length === 0 && (
        <section className="rd-band rd-band--tight">
          <div className="rd-wrap">
            <div className="rd-card rd-sp-contact">
              <p>
                <b>
                  Some of our smaller events don&apos;t have any sponsors. If you know of any companies that might be interested in sponsoring these, please
                  contact us at{" "}
                </b>
                <a href={MAILTO}>{MAIL}</a>
              </p>
            </div>
          </div>
        </section>
      )}

      {sponsorsList.length > 0 && (
        <>
          <SponsorTier sponsorsList={sponsorsList} level="Platinum" title="Platinum Sponsors" size="l" imgSize={200} band="rd-band--p" />
          <SponsorTier sponsorsList={sponsorsList} level="Gold" title="Gold Sponsors" size="m" imgSize={150} band="rd-band--y rd-dots" />
          <SponsorTier sponsorsList={sponsorsList} level="Silver" title="Silver Sponsors" size="s" imgSize={100} band="rd-band--paper2" />
          <section className="rd-band rd-band--tight">
            <div className="rd-wrap">
              <div className="rd-card rd-sp-contact">
                <h2 className="rd-h3">Sponsor this event</h2>
                <p>
                  Mail to <a href={MAILTO}>{MAIL}</a>
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default SponsorPage;
