import React from "react";
import RectSocial from "@/app/common/RectSocial";
import {
  getBlueskyInUrl,
  getFacebookUrl,
  getLinkedInUrl,
  getTwitterUrl,
} from "@/lib/staticData/common/utils/socialSiteUtils";

interface AllSocialProps {
  twitterHref?: string;
  twitterSize?: "small" | "medium" | "large";
  noLeftMarginTwitter?: boolean;
  facebookHref?: string;
  facebookSize?: "small" | "medium" | "large";
  linkedinHref?: string;
  linkedinSize?: "small" | "medium" | "large";
  blueskyHref?: string;
  blueskySize?: "small" | "medium" | "large";
}

export function AllSocial({
                            twitterHref = "",
                            twitterSize = "medium",
                            noLeftMarginTwitter = false,
                            facebookHref = "",
                            facebookSize = "medium",
                            linkedinHref = "",
                            linkedinSize = "medium",
                            blueskyHref = "",
                            blueskySize = "medium",
                          }: AllSocialProps) {



  return (
    <>
      <RectSocial href={getTwitterUrl(twitterHref)} type="twitter" size={twitterSize} noLeftMargin={noLeftMarginTwitter} />
      <RectSocial href={getFacebookUrl(facebookHref)} type="facebook" size={facebookSize} />
      <RectSocial href={getLinkedInUrl(linkedinHref)} type="linkedin" size={linkedinSize} />
      <RectSocial href={getBlueskyInUrl(blueskyHref)} type="bluesky" size={blueskySize} />
    </>
  );
}
