import React, {FunctionComponent} from "react";
import TrackListItem from "./TrackListItem";

interface Props {
  tracks: any;
}

const TrackListData: FunctionComponent<Props> = ({ tracks }) => {
  return (
    <ul className="rd-grid rd-ss-grid">
      {tracks.map((track: any) => (
        <TrackListItem track={track} key={track.id} />
      ))}
    </ul>
  );
};

export default TrackListData;
