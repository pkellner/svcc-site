import React from "react";
import "../../styles/App.scss";
import "../../styles/redesign.css";
import "../../styles/rd/home.css";
import "../../styles/rd/sessions-tracks.css";
import "../../styles/rd/speakers-sponsors.css";
import "../../styles/rd/news-about-event.css";
import Link from "next/link";
import Footer from "@/app/common/Footer";
import GlobalNav from "@/app/(public-site)/global-nav";
import { getCurrentCodeCampYear } from "@/lib/staticData/common/utils/getCurrentCodeCampYear";
import { getCodeCampYears } from "@/lib/staticData/codeCampYears/codeCampYears";
import { withBasePath } from "@/lib/basePath";

// STATIC-SITE-PLAN.md Step 4. Renders as out/404.html under static export.
// An async server component, like every other page, so it can read staticData
// and pass the same year/validYears GlobalNav needs elsewhere -- without this
// it renders outside the styled layout, as it does on the live site today.
export default async function NotFound() {
  const { year } = await getCurrentCodeCampYear();
  const codeCampYears = await getCodeCampYears();
  const validYears = codeCampYears?.map((rec: any) => rec.urlPostToken) ?? [];

  return (
    <div className="rd">
      <GlobalNav year={year} validYears={validYears} />
      <main>
        <section className="rd-band rd-band--y rd-dots rd-pagehead">
          <i className="rd-deco rd-deco--a" aria-hidden="true" />
          <i className="rd-deco rd-deco--b" aria-hidden="true" />
          <div className="rd-wrap">
            <span className="rd-chip rd-chip--paper">404</span>
            <h1 className="rd-h1">Page not found</h1>
            <p className="rd-sub">
              This is an archived, read-only copy of the Silicon Valley Code Camp site. The page you asked for doesn&apos;t exist here, or the link may be out of
              date.
            </p>
            <p style={{ marginTop: 28 }}>
              <Link className="rd-btn rd-btn--b" href="/">
                Go to the home page
              </Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
      {/* Old-link recovery (STATIC-SITE-PLAN.md Step 4): see app/404-recover.js/route.ts. */}
      <script src={withBasePath("/404-recover.js")} />
    </div>
  );
}
