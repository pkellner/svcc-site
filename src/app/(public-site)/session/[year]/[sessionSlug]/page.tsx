
import "server-only";
import React from "react";
import SessionDetail from "@/app/(public-site)/session/[year]/[sessionSlug]/SessionDetail";

import {getSessionsData, getSessionSlugs} from "@/lib/staticData/sessions/sessionsUtils";
import {getCodeCampYears} from "@/lib/staticData/codeCampYears/codeCampYears";
import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {eventCard, eventInfo, pageMetadata, plainText, speakerCard} from "@/lib/seo";
import {getSpeakerNames} from "@/lib/utils";

export async function generateStaticParams() {
  const years = await getCodeCampYears();
  const params: { year: string; sessionSlug: string }[] = [];
  for (const y of years) {
    const slugs = (await getSessionSlugs(y.urlPostToken)) ?? [];
    for (const s of slugs) {
      if (s.sessionSlug) params.push({ year: y.urlPostToken, sessionSlug: s.sessionSlug });
    }
  }
  return params;
}
export const dynamicParams = false;

export async function generateMetadata(props: { params: Promise<{ sessionSlug: string; year: string }> }): Promise<Metadata> {
  const { year, sessionSlug } = await props.params;
  const id = (await getSessionSlugs(year))?.find((s) => s.sessionSlug === sessionSlug)?.sessionId;
  const session = (await getSessionsData(year))?.find((s) => s.id === id);
  const e = await eventInfo(year);
  if (!session || !e) return {};
  const speakers = getSpeakerNames(session);
  const about = plainText(session.descriptionShort) || plainText(session.description);
  const firstSpeaker = session.sessionPresenter?.[0]?.attendeeId;
  return pageMetadata({
    title: `${plainText(session.title, 120)} · ${e.label}`,
    description: [speakers ? `${speakers} at ${e.label}.` : `A session at ${e.label}.`, about].filter(Boolean).join(" "),
    path: `/session/${year}/${sessionSlug}/`,
    image: firstSpeaker ? speakerCard(firstSpeaker) : eventCard(year),
    imageAlt: speakers || e.label,
    type: "article",
  });
}

export default async function Page(props: { params: Promise<{ sessionSlug: string; year: string }> }) {
  const params = await props.params;
  const sessionsData = await getSessionsData(params?.year);
  const sessionSlugs = await getSessionSlugs(params?.year);

  let found: boolean = false;
  let sessionId: string = "0";
  if (sessionSlugs && sessionSlugs.length > 0) {
    sessionSlugs.forEach(function (rec) {
      if (rec?.sessionSlug === params.sessionSlug) {
        found = true;
        sessionId = rec?.sessionId.toString() ?? "0";
      }
    });
  }

  if (!found) {
    notFound();
  }

  const session = sessionsData?.find((rec) => {
    return rec?.id === parseInt(sessionId);
  });
  return <SessionDetail year={params?.year} session={session} />;
}
