"use client";

import {ReactNode, useContext} from "react";
import {FilterBarContext} from "@/app/contexts/FilterBarContext";

export default function SessionExpandedItemClientWrapper({
  speakerNames,
  sessionTitle,
  children,
}: {
  speakerNames: string; // these names are passed in from the rendered server component
  sessionTitle: string;
  children: ReactNode;
}) {
  const { query } = useContext(FilterBarContext);

  return (speakerNames.toLowerCase() + sessionTitle.toLowerCase()).includes(query.toLowerCase()) ? <>{children}</> : null;
}
