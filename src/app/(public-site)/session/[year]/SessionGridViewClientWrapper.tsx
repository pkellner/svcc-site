"use client";

import {ReactNode, useContext} from "react";
import {FilterBarContext} from "@/app/contexts/FilterBarContext";

export function SessionGridViewClientWrapper({ children }: { children: ReactNode }) {
  const { sessionListViewType } = useContext(FilterBarContext);

  return sessionListViewType === "grid" ? <>{children}</> : null;
}
