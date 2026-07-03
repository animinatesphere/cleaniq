import React from "react";
import { useCurrentFrame, spring, useVideoConfig } from "remotion";
import { COLORS, FONT_STACK } from "../constants";

export const CTAButton: React.FC<{
  children: React.ReactNode;
  delay?: number;
}> = ({ children, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, mass: 0.5 },
  });
  const pulse = frame - delay > 20 ? 1 + Math.sin((frame - delay) / 8) * 0.02 : 1;

  return (
    <div
      style={{
        padding: "22px 56px",
        borderRadius: 999,
        backgroundColor: COLORS.secondary,
        color: COLORS.primaryDark,
        fontFamily: FONT_STACK,
        fontSize: 32,
        fontWeight: 800,
        transform: `scale(${scale * pulse})`,
      }}
    >
      {children}
    </div>
  );
};
