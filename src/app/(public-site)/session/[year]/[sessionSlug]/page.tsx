
import "server-only";
import React from "react";
import SessionDetail from "@/app/(public-site)/session/[year]/[sessionSlug]/SessionDetail";

import {getSessionsData, getSessionSlugs} from "@/lib/staticData/sessions/sessionsUtils";
import {getCodeCampYears} from "@/lib/staticData/codeCampYears/codeCampYears";
import {notFound} from "next/navigation";

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
