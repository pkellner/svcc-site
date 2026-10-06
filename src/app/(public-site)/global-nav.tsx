"use client";

import React, {useCallback, useEffect, useLayoutEffect, useRef, useState} from "react";
import {usePathname} from "next/navigation";
import Link from "next/link";
import {DOCK_EVENTS, DOCK_GROUPS, VENUE_NAMES, type DockEvent} from "./eventIndex";

// The event dock: a floating bar on every page except home (the home page already links into every
// event). It names the event you are in, switches between that event's sections, steps to the previous
// or next event, and has a plain "All events" way home. No login/profile/admin items: this is a static,
// no-auth static site (STATIC-SITE-PLAN.md Step 4).

type SectionKey = "session" | "presenter" | "track" | "sponsor" | "news" | "about";
// Icons show only on phones, where the six sections become an even tab bar (24x24, 2px strokes).
const SECTIONS: { key: SectionKey; label: string; count?: "session" | "presenter" | "track"; icon: string }[] = [
  { key: "session", label: "Sessions", count: "session", icon: "M4 5h16v15H4zM4 10h16M9 3v4M15 3v4" },
  { key: "presenter", label: "Speakers", count: "presenter", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6" },
  { key: "track", label: "Tracks", count: "track", icon: "M4 7h16M4 12h16M4 17h10" },
  { key: "sponsor", label: "Sponsors", icon: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" },
  { key: "news", label: "News", icon: "M5 4h11v16H6a1 1 0 0 1-1-1zM16 8h3v11a1 1 0 0 1-1 1h-2M8 8h5M8 12h5M8 16h3" },
  { key: "about", label: "About", icon: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5" },
];
const BY_TOKEN = new Map(DOCK_EVENTS.map((e, i) => [e.token, i]));

// Phones only: the bar can be dragged to dock at the bottom of the screen (centered, above the home
// indicator) and back to the top. The choice lives on <html> as .rd-dock-bottom, set before first paint
// by the root layout's inline script (DOCK_KEY), so a reload doesn't flash the bar at the top first.
export const DOCK_KEY = "rd-dock";
const PHONE_QUERY = "(max-width: 720px)";

function useDockDrag(barRef: React.RefObject<HTMLDivElement | null>, active: boolean) {
  useEffect(() => {
    const found = barRef.current;
    if (!found) return;
    const bar: HTMLDivElement = found;
    const html = document.documentElement;
    const phone = window.matchMedia(PHONE_QUERY);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ac = new AbortController();
    const on = { signal: ac.signal } as const;

    function setDock(bottom: boolean) {
      html.classList.toggle("rd-dock-bottom", bottom);
      try {
        localStorage.setItem(DOCK_KEY, bottom ? "bottom" : "top");
      } catch {}
    }
    // The spacer left at the top and the room kept at the bottom both match the bar's height.
    const ro = new ResizeObserver(() => html.style.setProperty("--rd-bar-h", bar.offsetHeight + "px"));
    ro.observe(bar);

    let drag: { id: number; y0: number; x0: number; on: boolean; s: { t: number; y: number }[] } | null = null;
    let swallowClick = false;

    bar.addEventListener(
      "pointerdown",
      (e) => {
        if (!phone.matches || e.button !== 0) return;
        drag = { id: e.pointerId, y0: e.clientY, x0: e.clientX, on: false, s: [{ t: e.timeStamp, y: e.clientY }] };
      },
      on,
    );
    bar.addEventListener(
      "pointermove",
      (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        const dy = e.clientY - drag.y0;
        if (!drag.on) {
          if (Math.abs(dy) < 8 || Math.abs(dy) < Math.abs(e.clientX - drag.x0)) return;
          drag.on = true;
          bar.setPointerCapture(e.pointerId);
          bar.classList.add("is-dragging");
        }
        drag.s.push({ t: e.timeStamp, y: e.clientY });
        while (drag.s.length > 2 && e.timeStamp - drag.s[0].t > 90) drag.s.shift();
        bar.style.transform = `translateY(${dy}px) scale(1.02)`;
      },
      on,
    );
    function end(e: PointerEvent) {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      if (!d.on) return;
      swallowClick = true;
      setTimeout(() => (swallowClick = false), 0);
      const a = d.s[0],
        b = d.s[d.s.length - 1],
        v = (b.y - a.y) / Math.max(16, b.t - a.t); // px per ms
      const before = bar.getBoundingClientRect();
      // Like iOS picture-in-picture, a flick counts for more than where the finger stops.
      const projected = before.top + before.height / 2 + v * 200;
      const bottom = projected > window.innerHeight / 2;
      bar.classList.remove("is-dragging");
      bar.style.transition = "none";
      bar.style.transform = "";
      setDock(bottom);
      const after = bar.getBoundingClientRect();
      bar.style.transform = `translateY(${before.top - after.top}px)`;
      void bar.offsetWidth;
      bar.style.transition = reduce.matches ? "none" : "transform 0.45s cubic-bezier(0.22, 1.25, 0.36, 1)";
      bar.style.transform = "";
      const clear = () => (bar.style.transition = "");
      bar.addEventListener("transitionend", clear, { once: true, signal: ac.signal });
      if (reduce.matches) clear();
    }
    bar.addEventListener("pointerup", end, on);
    bar.addEventListener(
      "pointercancel",
      (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        drag = null;
        bar.classList.remove("is-dragging");
        bar.style.transform = "";
      },
      on,
    );
    // A drag that started on a link must not also follow it.
    bar.addEventListener(
      "click",
      (e) => {
        if (swallowClick) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      { capture: true, signal: ac.signal },
    );
    return () => {
      ac.abort();
      ro.disconnect();
    };
  }, [barRef, active]);
}

function Tiles() {
  return (
    <span className="rd-dock-tiles" aria-hidden="true">
      <span>S</span>
      <span>V</span>
      <span>C</span>
      <span>C</span>
    </span>
  );
}

function Chevron({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path d={dir === "prev" ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The ticket: venue-colored stub with the stamp, then the event's name and date. Opens the event picker. */
function Ticket({ ev, open, onToggle }: { ev: DockEvent; open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={`rd-dock-ticket rd-v-${ev.venue}`}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls="rd-dock-picker"
      onClick={onToggle}
      title="Pick another event"
    >
      <span className="rd-dock-stub" aria-hidden="true">
        {ev.venue === "campfire" ? (
          <>
            <small>{ev.stamp.split(" ")[0]}</small>
            {ev.stamp.split(" ")[1]}
          </>
        ) : (
          ev.stamp
        )}
      </span>
      <span className="rd-dock-info" key={ev.token}>
        <small>{VENUE_NAMES[ev.venue]}</small>
        <b>{ev.title}</b>
        <span className="rd-dock-date">{ev.date}</span>
      </span>
      <span className="rd-dock-caret" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="12" height="12" focusable="false">
          <path d="M3.5 6 8 10.5 12.5 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}

function Picker({ section, current, onClose }: { section: SectionKey; current: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ac = new AbortController();
    document.addEventListener("keydown", (e) => e.key === "Escape" && onClose(), { signal: ac.signal });
    document.addEventListener(
      "pointerdown",
      (e) => {
        const t = e.target as Element;
        if (!ref.current?.contains(t) && !t.closest?.(".rd-dock-ticket")) onClose();
      },
      { signal: ac.signal },
    );
    ref.current?.querySelector<HTMLElement>("a[aria-current]")?.focus({ preventScroll: true });
    return () => ac.abort();
  }, [onClose]);
  const label = SECTIONS.find((s) => s.key === section)?.label ?? "Sessions";
  return (
    <div className="rd-dock-picker" id="rd-dock-picker" role="dialog" aria-label="Pick an event" ref={ref}>
      <p className="rd-dock-picker-head">
        <b>Pick an event</b>
        <span>Opens its {label.toLowerCase()}</span>
      </p>
      {DOCK_GROUPS.map((g) => (
        <section key={g.venue} className="rd-dock-group">
          <h3>
            {VENUE_NAMES[g.venue]}
            <small>{g.years}</small>
          </h3>
          <ul>
            {g.tokens.map((t) => {
              const ev = DOCK_EVENTS[BY_TOKEN.get(t) ?? 0];
              const on = t === current;
              return (
                <li key={t}>
                  <Link
                    href={`/${section}/${t}/`}
                    prefetch={false}
                    className={`rd-dock-yt rd-v-${ev.venue}${on ? " is-on" : ""}`}
                    aria-current={on ? "page" : undefined}
                    aria-label={`${ev.title}, ${ev.date}`}
                    onClick={onClose}
                  >
                    {ev.venue === "campfire" ? <small>{ev.stamp.split(" ")[0]}</small> : null}
                    {ev.venue === "campfire" ? ev.stamp.split(" ")[1] : ev.stamp.slice(1)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default function GlobalNav({ year, validYears }: { validYears: string[]; year: string }) {
  const pathName = usePathname() ?? "";
  const barRef = useRef<HTMLDivElement>(null);
  const segRef = useRef<HTMLUListElement>(null);
  const [picker, setPicker] = useState(false);
  const closePicker = useCallback(() => setPicker(false), []);
  const onHome = pathName === "/" || pathName === "";
  useDockDrag(barRef, !onHome);

  const segments = pathName.split("/");
  const sectionFromUrl = segments[1] ?? "";
  const section: SectionKey = (SECTIONS.some((s) => s.key === sectionFromUrl) ? sectionFromUrl : "session") as SectionKey;
  const isSection = SECTIONS.some((s) => s.key === sectionFromUrl);
  const yearFromUrl = segments.length > 2 && segments[2] ? segments[2].toLowerCase() : year;
  const token = validYears.includes(yearFromUrl) && BY_TOKEN.has(yearFromUrl) ? yearFromUrl : BY_TOKEN.has(year) ? year : "2019";
  const idx = BY_TOKEN.get(token) ?? DOCK_EVENTS.length - 1;
  const ev = DOCK_EVENTS[idx];
  const prev = DOCK_EVENTS[idx - 1];
  const next = DOCK_EVENTS[idx + 1];

  // Slide the ink highlight under the current section, and keep it in view in the phone's scrolling row.
  useLayoutEffect(() => {
    const seg = segRef.current;
    if (!seg) return;
    const place = () => {
      // Measure the <li>: links sit inside positioned list items, so their own offsetLeft is always 0.
      const on = seg.querySelector<HTMLElement>("a[aria-current]")?.parentElement;
      if (!on) {
        seg.style.setProperty("--hi-o", "0");
        return;
      }
      seg.style.setProperty("--hi-x", on.offsetLeft + "px");
      seg.style.setProperty("--hi-w", on.offsetWidth + "px");
      seg.style.setProperty("--hi-o", "1");
      if (seg.scrollWidth > seg.clientWidth) {
        seg.scrollTo({ left: on.offsetLeft - (seg.clientWidth - on.offsetWidth) / 2, behavior: "smooth" });
      }
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(seg);
    return () => ro.disconnect();
  }, [pathName, onHome]);

  if (onHome) return null;

  return (
    <header className="rd-top">
      <div className="rd-top-in rd-dock" ref={barRef}>
        <i className="rd-top-grip" aria-hidden="true" />
        <Link className="rd-dock-home" href="/" aria-label="All events: the Silicon Valley Code Camp home page">
          <Tiles />
          <span className="rd-dock-home-text">
            <span aria-hidden="true">←</span> All events
          </span>
        </Link>

        <div className="rd-dock-event">
          {prev ? (
            <Link className="rd-dock-step" href={`/${section}/${prev.token}/`} prefetch={false} aria-label={`Previous event: ${prev.title}`} title={prev.title}>
              <Chevron dir="prev" />
            </Link>
          ) : (
            <span className="rd-dock-step is-off" aria-hidden="true">
              <Chevron dir="prev" />
            </span>
          )}
          <Ticket ev={ev} open={picker} onToggle={() => setPicker((o) => !o)} />
          {next ? (
            <Link className="rd-dock-step" href={`/${section}/${next.token}/`} prefetch={false} aria-label={`Next event: ${next.title}`} title={next.title}>
              <Chevron dir="next" />
            </Link>
          ) : (
            <span className="rd-dock-step is-off" aria-hidden="true">
              <Chevron dir="next" />
            </span>
          )}
        </div>

        <nav className="rd-dock-nav" aria-label={`${ev.title} sections`}>
          <ul className="rd-dock-seg" ref={segRef}>
            {SECTIONS.map((s) => {
              const isCurrent = isSection && s.key === sectionFromUrl;
              const n = s.count ? ev.counts[s.count] : null;
              return (
                <li key={s.key}>
                  <Link
                    href={`/${s.key}/${token}/`}
                    prefetch={false}
                    className={n === 0 ? "is-empty" : undefined}
                    aria-current={isCurrent ? "page" : undefined}
                  >
                    <svg className="rd-dock-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d={s.icon} />
                    </svg>
                    <span>{s.label}</span>
                    {n ? <sup>{n}</sup> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {picker ? <Picker section={section} current={token} onClose={closePicker} /> : null}
        <i className="rd-top-bar" aria-hidden="true" />
      </div>
    </header>
  );
}
