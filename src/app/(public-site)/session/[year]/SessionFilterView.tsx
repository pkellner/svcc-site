"use client";

import {useContext} from "react";
import {FilterBarContext} from "@/app/contexts/FilterBarContext";
import type {Session} from "@/lib/staticData/sessions/sessionsUtils";
import ShowFilterCountAndTotal from "@/app/(public-site)/session/[year]/show-filter-count-and-total";

export default function SessionFilterView({ sessions }: { sessions: Session[] }) {
  const { sessionListViewType, setSessionListViewType, query, setQuery } = useContext(FilterBarContext);

  const listViewActive = sessionListViewType === "list";
  const gridViewActive = sessionListViewType === "grid";

  const handleButtonClick = (id: string) => {
    setSessionListViewType(id);
  };

  return (
    <div className="rd-card rd-ss-filter">
      <form role="search" onSubmit={(event) => event.preventDefault()}>
        <ShowFilterCountAndTotal sessions={sessions} />

        <div className="rd-ss-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            value={query}
            type="text"
            className="rd-input js-events-text-search"
            placeholder="Search sessions or speakers..."
            aria-label="Search sessions by title or speaker"
          />
        </div>

        <div className="rd-ss-switch" role="group" aria-label="Session view">
          <button
            type="button"
            onClick={() => {
              handleButtonClick("list");
            }}
            className={"rd-btn rd-btn--sm js-list-view-button" + (listViewActive ? " active" : "")}
            aria-pressed={listViewActive}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
            List
          </button>

          <button
            type="button"
            className={"rd-btn rd-btn--sm js-grouped-view-button" + (gridViewActive ? " active" : "")}
            onClick={() => {
              handleButtonClick("grid");
            }}
            aria-pressed={gridViewActive}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
            Grid
          </button>
        </div>
      </form>
    </div>
  );
}
