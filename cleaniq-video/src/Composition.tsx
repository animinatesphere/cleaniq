import React from "react";
import { Sequence, Audio, staticFile, interpolate, useCurrentFrame } from "remotion";
import { Intro } from "./scenes/Intro";
import { SocialProof } from "./scenes/SocialProof";
import { Services, SERVICES_DURATION } from "./scenes/Services";
import { Trust } from "./scenes/Trust";
import { Outro } from "./scenes/Outro";

const INTRO_DURATION = 180; // 6s
const SOCIAL_PROOF_DURATION = 120; // 4s
const TRUST_DURATION = 180; // 6s
const OUTRO_DURATION = 240; // 8s

export const TOTAL_DURATION =
  INTRO_DURATION +
  SOCIAL_PROOF_DURATION +
  SERVICES_DURATION +
  TRUST_DURATION +
  OUTRO_DURATION;

const AudioTrack: React.FC = () => {
  const frame = useCurrentFrame();
  const volume = interpolate(
    frame,
    [0, 20, TOTAL_DURATION - 45, TOTAL_DURATION],
    [0, 0.55, 0.55, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return <Audio src={staticFile("audio/background-music.mp3")} volume={volume} />;
};

export const MyComposition: React.FC = () => {
  let cursor = 0;

  const introStart = cursor;
  cursor += INTRO_DURATION;
  const socialProofStart = cursor;
  cursor += SOCIAL_PROOF_DURATION;
  const servicesStart = cursor;
  cursor += SERVICES_DURATION;
  const trustStart = cursor;
  cursor += TRUST_DURATION;
  const outroStart = cursor;

  return (
    <>
      {/* Royalty-free track from Mixkit (mixkit.co) - swap public/audio/background-music.mp3 for your own if preferred. */}
      <AudioTrack />

      <Sequence from={introStart} durationInFrames={INTRO_DURATION}>
        <Intro />
      </Sequence>
      <Sequence from={socialProofStart} durationInFrames={SOCIAL_PROOF_DURATION}>
        <SocialProof />
      </Sequence>
      <Sequence from={servicesStart} durationInFrames={SERVICES_DURATION}>
        <Services />
      </Sequence>
      <Sequence from={trustStart} durationInFrames={TRUST_DURATION}>
        <Trust />
      </Sequence>
      <Sequence from={outroStart} durationInFrames={OUTRO_DURATION}>
        <Outro />
      </Sequence>
    </>
  );
};
