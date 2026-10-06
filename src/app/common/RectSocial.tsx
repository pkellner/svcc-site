import React, { FunctionComponent } from "react";
import { withBasePath } from "@/lib/basePath";
import XLogo from "@/app/common/XLogo";

interface Props {
  href: string;
  type: string;
  size?: string;
  mono?: boolean;
  noLeftMargin?: boolean;
}



const ImageOverlay: FunctionComponent<Props> = ({ href, type, size, mono, noLeftMargin }) => {
  {
    //console.log("/common/RectSocial.tsx  type: ", type, href);

    if (href && href.includes("unassigned")) {
      return null;
    }

    if (type === "bluesky" && href.length > 0) {
      return (
        <a
          href={href}
          className={`
      rect-social rect-social--myblueksy
      ${size ? `rect-social--${size}` : ""}
      ${mono ? "rect-social--mono" : ""}
      ${noLeftMargin ? "rect-social--no-left-margin" : ""}
    `}
          style={{
            backgroundColor: "#F7F7F7",
            display: "inline-block",
            padding: "5px",
            borderRadius: "10px 0 10px 0" // Upper-left and lower-right rounded
          }}
        >
          <img
            src={withBasePath("/images/Bluesky_butterfly-logo.svg.png")}
            alt="Bluesky"
            style={{ width: "24px", height: "24px" }}
          />
        </a>
      );

    }


    return href && href.length > 0 ? (
      <a
        href={href}
        className={`
        rect-social rect-social--${type}
        ${size ? `rect-social--${size}` : ""}
        ${mono ? "rect-social--mono" : ""}
        ${noLeftMargin ? "rect-social--no-left-margin" : ""}
      `}
      >
        {type === "twitter" ? <XLogo size={16} /> : <i className={`fa fa-${type}`} aria-hidden="true" />}
      </a>
    ) : null;
  }
};

export default ImageOverlay;
