import { withBasePath } from "@/lib/basePath";
import { LAST_UPDATED_ISO, LAST_UPDATED_TEXT } from "@/lib/lastUpdated";

export default function AboutPage({}) {
  return (
    <section id="content" className="rd-nae-body">
      <div className="rd-wrap rd-about">
        <div className="rd-about-pic">
          {/* eslint-disable-next-line @next/next/no-img-element -- static export: plain img, basePath applied by hand */}
          <img className="rd-photo" src={withBasePath("/images/organize01.jpg")} alt="Silicon Valley Code Camp organizers" width="300" />
          <div className="rd-tiles" aria-hidden="true">
            <span>S</span>
            <span>V</span>
            <span>C</span>
            <span>C</span>
          </div>
        </div>
        <div className="rd-card rd-about-card">
          <h2 className="rd-h2">Organizers</h2>
          <div className="rd-prose">
            <p>
              Silicon Valley Code Camp is put on by a dedicated group of volunteers whose mission is to both provide the highest quality content built around
              the topic of computer code, as well as create an environment where shared knowledge is paramount. The volunteers not only include the organizers,
              but all the speakers in Addition!!
              {/*<br /> If you are interested in helping, send an email to:{' '}*/}
              {/*<a href="mailto:Volunteers@siliconvalley-codecamp.com">*/}
              {/*  Volunteers@siliconvalley-codecamp.com*/}
              {/*</a>*/}
            </p>
          </div>
          <h2 className="rd-h2">Contact</h2>
          <div className="rd-prose">
            <p>
              For Additional Information, please email: <a href="mailto:service2019@siliconvalley-codecamp.com">service2019@siliconvalley-codecamp.com</a>
            </p>
          </div>
          <p className="rd-about-updated">
            Site last updated <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED_TEXT}</time>
          </p>
        </div>
      </div>
    </section>
  );
}
