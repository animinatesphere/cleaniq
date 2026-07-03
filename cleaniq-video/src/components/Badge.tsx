import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS, FONT_STACK } from "../constants";

export const Badge: React.FC<{
  children: React.ReactNode;
  delay?: number;
  variant?: "accent" | "outline";
}> = ({ children, delay = 0, variant = "accent" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, mass: 0.5 },
  });
  const opacity = interpolate(frame - delay, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const isOutline = variant === "outline";

  return (
    <div
      style={{
        display: "inline-block",
        padding: "10px 26px",
        borderRadius: 999,
        backgroundColor: isOutline ? "transparent" : COLORS.secondary,
        border: isOutline ? `2px solid ${COLORS.secondary}` : "none",
        color: isOutline ? COLORS.secondary : COLORS.primaryDark,
        fontFamily: FONT_STACK,
        fontSize: 22,
        fontWeight: 800,
        letterSpacing: 1,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      {children}
    </div>
  );
};
