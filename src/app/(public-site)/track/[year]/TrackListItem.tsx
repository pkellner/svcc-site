import React from "react";
import Link from "next/link";

import sanitizeHtml from "sanitize-html";

function TrackListItem({ track }: any) {
  const createMarkup: (rawHtml: string) => { __html: any } = (rawHtml) => ({
    __html: rawHtml,
  });

  const trackSessions = track && track.sessions && track.sessions.length > 0 ? track.sessions : [];

  // console.log(
  //   `TrackListItem: track.id:${track.id}  year:${track.year}`,
  // );

  // Allow only a super restricted set of tags and attributes
  const cleanDescription = sanitizeHtml(track?.description ?? "", {
    allowedTags: ["b", "i", "em", "strong", "p", "br"],
    // allowedAttributes: {
    //   'a': [ 'href' ]
    // },
    //allowedIframeHostnames: ['www.youtube.com']
  });

  return (
    <li className="rd-card rd-ss-track">
      <h3 className="rd-h3 rd-ss-title">
        <Link href={`/track/${track.year}/${track.trackUrl}`}>{track.named}</Link>
      </h3>

      {cleanDescription && <div className="rd-prose rd-ss-desc" dangerouslySetInnerHTML={createMarkup(cleanDescription)} />}

      {trackSessions.length > 0 && (
        <ul>
          {trackSessions.map((item: any, index: number) => (
            <li key={index}>{item.title}</li>
          ))}
        </ul>
      )}

      <p style={{ margin: "auto 0 0", paddingTop: 6 }}>
        <Link className="rd-btn rd-btn--sm rd-btn--g" href={`/track/${track.year}/${track.trackUrl}`} aria-label={`View the ${track.named} track`}>
          View track
        </Link>
      </p>
    </li>
  );
}

export default TrackListItem;
