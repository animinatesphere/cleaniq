import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { COLORS, FONT_STACK } from "../constants";
import { Badge } from "../components/Badge";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.6 },
  });

  const taglineOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [25, 45], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subheadOpacity = interpolate(frame, [55, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.primaryDark,
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_STACK,
        padding: 100,
      }}
    >
      <Badge delay={0}>TOP-RATED CLEANERS IN MANCHESTER</Badge>
      <Img
        src={staticFile("logo-dp.jpg")}
        style={{
          width: 160,
          marginTop: 30,
          transform: `scale(${logoScale})`,
        }}
      />
      <div
        style={{
          marginTop: 26,
          fontSize: 50,
          fontWeight: 800,
          color: COLORS.white,
          textAlign: "center",
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
        }}
      >
        Professional Cleaning Services
        <br />
        in Manchester
      </div>
      <div
        style={{
          marginTop: 22,
          fontSize: 22,
          fontWeight: 500,
          color: "rgba(255,255,255,0.75)",
          textAlign: "center",
          maxWidth: 760,
          lineHeight: 1.5,
          opacity: subheadOpacity,
        }}
      >
        Reliable End of Tenancy Cleaning, regular weekly cleans, and
        specialized Airbnb turnovers — handled by our vetted pros.
      </div>
    </AbsoluteFill>
  );
};
