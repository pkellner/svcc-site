"use client";

import {createContext, ReactNode, useState} from "react";

export type FilterBarContent = {
  sessionListViewType: string; // [list, grid]
  setSessionListViewType: (c: string) => void;
  query: string;
  setQuery: (c: string) => void;
  sessionsFilteredCount: number;
  setSessionsFilteredCount: (c: number) => void;
};

export const FilterBarContext = createContext<FilterBarContent>({
  query: "",
  setQuery(): void {},
  setSessionListViewType(): void {},
  sessionListViewType: "list",
  sessionsFilteredCount: 0,
  setSessionsFilteredCount(): void {},
});

export default function FilterBarProvider({ children }: { children: ReactNode; year?: string | undefined }) {
  const [sessionListViewType, setSessionListViewType] = useState<string>("grid");
  const [query, setQuery] = useState<string>("");
  const [sessionsFilteredCount, setSessionsFilteredCount] = useState(0);

  return (
    <FilterBarContext.Provider
      value={{
        sessionListViewType,
        setSessionListViewType,
        query,
        setQuery,
        sessionsFilteredCount,
        setSessionsFilteredCount,
      }}
    >
      {children}
    </FilterBarContext.Provider>
  );
}
