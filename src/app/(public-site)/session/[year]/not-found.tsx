import Link from "next/link";

export default function YearNotFound() {
  return (
    <section className="rd-band rd-band--b rd-dots rd-pagehead rd-ss-head">
      <i className="rd-deco rd-deco--a" aria-hidden="true" />
      <i className="rd-deco rd-deco--b" aria-hidden="true" />
      <div className="rd-wrap">
        <div className="rd-ss-chips">
          <span className="rd-chip rd-chip--paper">404</span>
        </div>
        <h1 className="rd-h1">No sessions found</h1>
        <p className="rd-sub">There are no sessions for that year.</p>
        <p style={{ marginTop: 28 }}>
          <Link className="rd-btn" href="/">
            Go to the home page
          </Link>
        </p>
      </div>
    </section>
  );
}
