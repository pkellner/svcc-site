"use client";

import React, {useState} from "react";

import Image from "next/image";
import { withBasePath } from "@/lib/basePath";

export default function ImageWithFallback(props: { src: string; width: number; height: number; alt: string; className?: string; priority?: boolean }) {
  const [imgSrc, setImgSrc] = useState(withBasePath(props.src));

  // next/image does not prepend basePath to src itself (unlike next/link) --
  // see next.config.ts.
  const fallbackSrc = withBasePath("/images/404-not-found-error.jpg");

  // return (
  //   <img
  //     width={props.width}
  //     height={props.height}
  //     alt={props?.alt ?? "Image"}
  //     className={props.className}
  //     style={{
  //       objectFit: "cover",
  //     }}
  //     src={imgSrc ?? "Image"}
  //     onError={() => {
  //       setImgSrc(fallbackSrc ?? "/images/404-not-found-error.jpg");
  //     }}
  //   />
  // );

  return (
    <Image
      src={imgSrc ?? "Image"}
      alt={props.alt}
      onError={() => {
        setImgSrc(fallbackSrc);
      }}
      width={props.width}
      height={props.height}
      className={props.className}
      priority={props?.priority ?? false}
    />
  );
}
