import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  interpolate,
} from "remotion";
import { COLORS, FONT_STACK } from "../constants";

export const ServiceItem: React.FC<{
  name: string;
  tag: string;
  photo: string;
  durationInFrames: number;
}> = ({ name, tag, photo, durationInFrames }) => {
  const frame = useCurrentFrame();

  const enter = interpolate(frame, [0, 14], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(
    frame,
    [0, 14, durationInFrames - 10, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const kenBurns = interpolate(frame, [0, durationInFrames], [1.05, 1.12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity }}>
      <Img
        src={staticFile(photo)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${kenBurns})`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(0,59,42,0.92) 0%, rgba(0,59,42,0.15) 55%, transparent 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          padding: 80,
          fontFamily: FONT_STACK,
        }}
      >
        <div style={{ transform: `translateY(${enter}px)` }}>
          <div
            style={{
              display: "inline-block",
              padding: "6px 18px",
              borderRadius: 999,
              backgroundColor: COLORS.secondary,
              color: COLORS.primaryDark,
              fontSize: 20,
              fontWeight: 800,
              marginBottom: 16,
            }}
          >
            {tag.toUpperCase()}
          </div>
          <div style={{ fontSize: 54, fontWeight: 800, color: COLORS.white }}>
            {name}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
