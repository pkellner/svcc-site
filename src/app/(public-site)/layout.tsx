import {ReactNode} from "react";
import "../../../styles/App.scss";
// Section styles load after the design system so their overrides win at equal specificity.
import "../../../styles/redesign.css";
import "../../../styles/rd/home.css";
import "../../../styles/rd/sessions-tracks.css";
import "../../../styles/rd/speakers-sponsors.css";
import "../../../styles/rd/news-about-event.css";
import Footer from "@/app/common/Footer";
import {getCodeCampYears} from "@/lib/staticData/codeCampYears/codeCampYears";
import {getCurrentCodeCampYear} from "@/lib/staticData/common/utils/getCurrentCodeCampYear";
import GlobalNav from "@/app/(public-site)/global-nav";
import "@fortawesome/fontawesome-svg-core/styles.css";
import {config} from "@fortawesome/fontawesome-svg-core";

config.autoAddCss = false;

export default async function Layout({ children }: { children: ReactNode }) {
  const { year } = await getCurrentCodeCampYear();
  const codeCampYears = await getCodeCampYears();
  const validYears = codeCampYears?.map((rec: any) => rec.urlPostToken) ?? [];

  return (
    <div className="rd">
      <GlobalNav year={year} validYears={validYears} />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
