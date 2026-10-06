
import React from "react";
import SpeakerContent from "@/app/(public-site)/presenter/[year]/[presenterSlug]/SpeakerContent";
import SpeakerHeader from "@/app/(public-site)/presenter/[year]/[presenterSlug]/SpeakerHeader";
import {getUniquePresenters} from "@/lib/staticData/speakers/speakersUtils";
import {getSessionsData} from "@/lib/staticData/sessions/sessionsUtils";
import {getCodeCampYears} from "@/lib/staticData/codeCampYears/codeCampYears";
import type {Metadata} from "next";
import {eventInfo, pageMetadata, plainText, speakerCard} from "@/lib/seo";
import {jobLine} from "@/lib/displayText";

// getUniquePresenters, not the unmirrored getSpeakerSlugs (STATIC-SITE-PLAN.md
// Step 4, BLOCKER): getSpeakerSlugs includes presenters whose sessions are
// all unapproved, which crashes the build when Next tries to render a page
// for a presenter getUniquePresenters would never have returned a slug for.
export async function generateStaticParams() {
  const years = await getCodeCampYears();
  const params: { year: string; presenterSlug: string }[] = [];
  for (const y of years) {
    const presenters = (await getUniquePresenters(y.urlPostToken)) ?? [];
    for (const p of presenters) {
      if (p.slug) params.push({ year: y.urlPostToken, presenterSlug: p.slug });
    }
  }
  return params;
}
export const dynamicParams = false;

export async function generateMetadata(props: { params: Promise<{ presenterSlug: string; year: string }> }): Promise<Metadata> {
  const { year, presenterSlug } = await props.params;
  const id = idFromSlug(presenterSlug);
  const speaker = (await getUniquePresenters(year)).find((rec) => rec.id === id);
  const e = await eventInfo(year);
  if (!speaker || !e) return {};
  const name = `${speaker.userFirstName ?? ""} ${speaker.userLastName ?? ""}`.trim();
  const job = jobLine(speaker.principleJob, speaker.company);
  return pageMetadata({
    title: `${name} · ${e.label}`,
    description: [`${name}${job ? `, ${job},` : ""} spoke at ${e.label}.`, plainText(speaker.userBio)].filter(Boolean).join(" "),
    path: `/presenter/${year}/${presenterSlug}/`,
    image: speakerCard(speaker.id),
    imageAlt: name,
    type: "profile",
  });
}

// Looks up by the trailing id, not by matching the full slug text
// (STATIC-SITE-PLAN.md Step 4) -- robust to the ~40 speakers whose canonical
// slug differs from whatever form a link was built with historically.
function idFromSlug(presenterSlug: string): number | undefined {
  const match = presenterSlug.match(/-(\d+)$/);
  return match ? parseInt(match[1], 10) : undefined;
}

export default async function Page(props: { params: Promise<{ presenterSlug: string; year: string }> }) {
  const params = await props.params;
  const speakerId = idFromSlug(params.presenterSlug);

  if (speakerId === undefined) {
    return (
      <section className="rd-band rd-band--tight">
        <div className="rd-wrap">
          <div className="rd-card">Speaker Not Found ... {params.presenterSlug}</div>
        </div>
      </section>
    );
  }

  const speakers = await getUniquePresenters(params.year);
  const speaker = speakers.find((rec) => rec.id === speakerId);

  if (!speaker) {
    return (
      <section className="rd-band rd-band--tight">
        <div className="rd-wrap">
          <div className="rd-card">Speaker Not Found ... {params.presenterSlug}</div>
        </div>
      </section>
    );
  }

  const sessionIdsForSpeaker = speaker?.sessionsList;

  // // get all sessions
  const sessions = await getSessionsData(params.year);
  //
  const sessionsForSpeaker = sessions?.filter((session) => {
    return sessionIdsForSpeaker?.includes(session.id);
  });

  speaker.presenterSessions = sessionsForSpeaker?.sort((a, b) => {
    if (a.sessionTime.startTime < b.sessionTime.startTime) return -1;
    if (a.sessionTime.startTime > b.sessionTime.startTime) return 1;

    // startTime is equal, sort by title
    return a.title.localeCompare(b.title);
  });

  return (
    <>
      <SpeakerHeader speaker={speaker} year={params.year} />
      <SpeakerContent speaker={speaker} sessionList={speaker.presenterSessions} sessionsAll={sessions} year={params.year} />
    </>
  );
}
