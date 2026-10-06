import React from "react";

export default function NewsHeader({ year }: { year?: string }) {
  return (
    <section className="rd-band rd-band--y rd-dots rd-pagehead">
      <i className="rd-deco rd-deco--a" aria-hidden="true" />
      <i className="rd-deco rd-deco--b" aria-hidden="true" />
      <div className="rd-wrap">
        <ul className="rd-nae-chips">
          <li>
            <span className="rd-chip rd-chip--paper">Silicon Valley Code Camp And Campfire</span>
          </li>
          {year ? (
            <li>
              <span className="rd-chip rd-chip--ink">{year}</span>
            </li>
          ) : null}
        </ul>
        <h1 className="rd-h1">All the News</h1>
        <p className="rd-sub">Announcements, recaps and updates from every Code Camp and Campfire, newest first.</p>
      </div>
    </section>
  );
}
