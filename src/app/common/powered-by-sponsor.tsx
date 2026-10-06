import React from "react";
import { withBasePath } from "@/lib/basePath";

export default function PoweredBySponsor() {
  return (
    <a href="https://sherweb.com/" target="_blank" rel="noreferrer">
      <h5 style={{ fontSize: "1.2rem" }}>Powered By</h5>
      <img src={withBasePath("/images/sherweb-logo.png")} width={120} alt="Logo" />
    </a>
  );
}
