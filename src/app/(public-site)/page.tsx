import Home from "@/app/(public-site)/home/Home";
import type {Metadata} from "next";
import {HOME_CARD, HOME_CARD_ALT, SITE_DESCRIPTION, pageMetadata} from "@/lib/seo";

// function showEnvs() {
//   console.log("process.env.DATABASE_URL", process.env?.DATABASE_URL ?? "not set");
//   console.log("process.env.USE_REDIS_CACHE", process.env?.USE_REDIS_CACHE ?? "not set");
//   console.log("process.env.REDISHOST", process.env?.REDISHOST ?? "not set");
// }

export const metadata: Metadata = pageMetadata({ description: SITE_DESCRIPTION, path: "/", image: HOME_CARD, imageAlt: HOME_CARD_ALT });

export default function MainPage() {
  //showEnvs();
  return <Home />;
}
