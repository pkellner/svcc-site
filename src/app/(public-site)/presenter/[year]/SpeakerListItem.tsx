"use client";
import {jobLine} from "@/lib/displayText";

import React from "react";
import Link from "next/link";
import ImageWithFallback from "@/app/common/ImageWithFallback";
import { withBasePath } from "@/lib/basePath";
import type { Speaker } from "@/app/common/CodeCampInterfaces";

// Fields the static export adds to each presenter (see SpeakerListData).
type ListSpeaker = Speaker & { slug?: string; hasImage?: boolean; sessionsList?: unknown[] };

export default function SpeakerListItem({ speaker, year }: { speaker: ListSpeaker; year: string }) {
  const speakerName = `${speaker.userFirstName} ${speaker.userLastName}`;
  const srcUrl = speaker?.hasImage ? `/static-images/speakers/${speaker?.id}.webp` : "/images/404-not-found-error.jpg";

  // speaker.slug is the canonical speakerSlug(), precomputed by the export
  // script (STATIC-SITE-PLAN.md Step 4) -- not rebuilt here, so every link
  // builder agrees on the same form.
  const speakerUrl = `/presenter/${year}/${speaker?.slug}`;

  const sessionCount: number = Array.isArray(speaker?.sessionsList) ? speaker.sessionsList.length : 0;
  const hasBooks = speaker.attendeesAmazonBooks && speaker.attendeesAmazonBooks.length > 0;
  const meta = jobLine(speaker.principleJob, speaker.company);

  return (
    <li>
      <Link href={speakerUrl} className="rd-card rd-card--link rd-spk-card">
        <ImageWithFallback src={srcUrl} width={135} height={135} alt={speakerName} className="rd-avatar" />
        <div>
          <h3 className="rd-spk-name">{speakerName}</h3>
          {meta && <p className="rd-spk-meta">{meta}</p>}
          {(sessionCount > 0 || hasBooks) && (
            <span className="rd-tags">
              {sessionCount > 0 && (
                <span className="rd-tag rd-tag--y">
                  {sessionCount} {sessionCount === 1 ? "session" : "sessions"}
                </span>
              )}
              {hasBooks ? (
                <span className="rd-tag">
                  {/* eslint-disable-next-line @next/next/no-img-element -- tiny static icon, as before */}
                  <img src={withBasePath("/icons/icons8-book-22.png")} alt="" /> Author
                </span>
              ) : null}
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}
