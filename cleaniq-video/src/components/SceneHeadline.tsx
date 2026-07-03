import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { FONT_STACK } from "../constants";

export const SceneHeadline: React.FC<{
  children: React.ReactNode;
  color: string;
  size?: number;
  delay?: number;
}> = ({ children, color, size = 56, delay = 0 }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame - delay, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame - delay, [0, 18], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        fontFamily: FONT_STACK,
        fontSize: size,
        fontWeight: 800,
        color,
        textAlign: "center",
        lineHeight: 1.15,
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      {children}
    </div>
  );
};
