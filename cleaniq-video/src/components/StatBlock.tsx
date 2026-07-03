import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS, FONT_STACK } from "../constants";

export const StatBlock: React.FC<{
  value: string;
  label: string;
  delay?: number;
}> = ({ value, label, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 16, mass: 0.5 },
  });
  const opacity = interpolate(frame - delay, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        textAlign: "center",
        opacity,
        transform: `scale(${scale})`,
        fontFamily: FONT_STACK,
      }}
    >
      <div style={{ fontSize: 52, fontWeight: 900, color: COLORS.secondary }}>
        {value}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "rgba(255,255,255,0.75)",
          textTransform: "uppercase",
          letterSpacing: 1,
          marginTop: 6,
        }}
      >
        {label}
      </div>
    </div>
  );
};
