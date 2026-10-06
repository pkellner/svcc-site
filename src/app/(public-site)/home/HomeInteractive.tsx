"use client";

import React, {useEffect, useRef} from "react";
import {initHome} from "./homeCanvases";

// REDESIGN-PLAN.md: the home page's interactive layer. The markup (children) is rendered on the
// server and never re-rendered here: this component has no state, so React never reconciles the
// nodes the script decorates. The script only binds behavior to them and draws the canvases, in
// init(root, signal) => dispose sections, so StrictMode's double effect and navigating away and
// back both start from a clean slate.
export default function HomeInteractive({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const ac = new AbortController();
    const dispose = initHome(root, ac.signal);
    return () => {
      ac.abort();
      dispose();
    };
  }, []);
  return (
    <div className="rd-home" ref={ref}>
      {children}
    </div>
  );
}
