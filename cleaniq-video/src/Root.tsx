import "./index.css";
import React from "react";
import { Composition } from "remotion";
import { MyComposition, TOTAL_DURATION } from "./Composition";
import { EndOfTenancyVideo, EOT_TOTAL } from "./eot/Video";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CleaniqPromo"
        component={MyComposition}
        durationInFrames={TOTAL_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="EndOfTenancy"
        component={EndOfTenancyVideo}
        durationInFrames={EOT_TOTAL}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
