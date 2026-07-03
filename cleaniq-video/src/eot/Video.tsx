import React from "react";
import { Sequence, Audio, staticFile, interpolate, useCurrentFrame } from "remotion";
import { Intro } from "./scenes/Intro";
import { Problem } from "./scenes/Problem";
import { Transformation } from "./scenes/Transformation";
import { Features } from "./scenes/Features";
import { Outro } from "./scenes/Outro";

export const INTRO_DUR = 90;       // 3s
export const PROBLEM_DUR = 150;    // 5s
export const TRANSFORM_DUR = 360;  // 12s
export const FEATURES_DUR = 300;   // 10s
export const OUTRO_DUR = 300;      // 10s

export const EOT_TOTAL =
  INTRO_DUR + PROBLEM_DUR + TRANSFORM_DUR + FEATURES_DUR + OUTRO_DUR;
// 1200 frames = 40s @ 30fps

const AudioTrack: React.FC = () => {
  const frame = useCurrentFrame();
  const volume = interpolate(
    frame,
    [0, 20, EOT_TOTAL - 50, EOT_TOTAL],
    [0, 0.42, 0.42, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return <Audio src={staticFile("audio/background-music.mp3")} volume={volume} />;
};

export const EndOfTenancyVideo: React.FC = () => {
  let cur = 0;
  const introAt = cur;     cur += INTRO_DUR;
  const problemAt = cur;   cur += PROBLEM_DUR;
  const transformAt = cur; cur += TRANSFORM_DUR;
  const featuresAt = cur;  cur += FEATURES_DUR;
  const outroAt = cur;

  return (
    <>
      <AudioTrack />
      <Sequence from={introAt} durationInFrames={INTRO_DUR}>
        <Intro />
      </Sequence>
      <Sequence from={problemAt} durationInFrames={PROBLEM_DUR}>
        <Problem />
      </Sequence>
      <Sequence from={transformAt} durationInFrames={TRANSFORM_DUR}>
        <Transformation />
      </Sequence>
      <Sequence from={featuresAt} durationInFrames={FEATURES_DUR}>
        <Features />
      </Sequence>
      <Sequence from={outroAt} durationInFrames={OUTRO_DUR}>
        <Outro />
      </Sequence>
    </>
  );
};
