"use client";

import {ReactNode, useContext} from "react";
import {FilterBarContext} from "@/app/contexts/FilterBarContext";

export default function SessionListItemClientWrapper({
  speakerNames,
  sessionTitle,
  children,
}: {
  speakerNames: string; // these names are passed in from the rendered server component
  sessionTitle: string;
  sessionId: number;
  children: ReactNode;
}) {
  const { query } = useContext(FilterBarContext);

  const foundMatch = (speakerNames.toLowerCase() + sessionTitle.toLowerCase()).includes(query.toLowerCase());

  return foundMatch ? <div>{children}</div> : null;
}
