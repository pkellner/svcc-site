import type {Session} from "@/lib/staticData/sessions/sessionsUtils";
import {speakerSlug} from "@/lib/slugs";
import {withBasePath} from "@/lib/basePath";
import React from "react";

export function SpeakerNamesCsv({ session, year, className }: { session: Session; year: string; className: string }) {
  // still problem with speakers not wrapping as expected
  return (
    <>
      {session?.sessionPresenter?.map((sp) => {
        const firstName = sp?.attendees?.userFirstName || "";
        const lastName = sp?.attendees?.userLastName || "";

        return (
          <span className={className} key={`sp1-${sp.id}`}>
            &nbsp;&nbsp;
            <a href={withBasePath(`/presenter/${year}/${speakerSlug(firstName, lastName, sp.attendeeId)}`)}>
              <span style={{ whiteSpace: "nowrap" }}>
                {firstName} {lastName}
              </span>
              {/*{cnt !== speakers.length - 1 && ", "}*/}
            </a>
          </span>
        );
      })}
    </>
  );
}
