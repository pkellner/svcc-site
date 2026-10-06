"use client";
import React, {useContext} from "react";
import {FilterBarContext} from "@/app/contexts/FilterBarContext";

export function SessionListViewClientWrapper({ children }: { children: React.ReactNode }) {
  const { sessionListViewType } = useContext(FilterBarContext);

  return sessionListViewType === "list" ? <>{children}</> : null;
}
