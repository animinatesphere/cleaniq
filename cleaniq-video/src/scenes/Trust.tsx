import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { COLORS, FONT_STACK, TRUST_POINTS, STATS } from "../constants";
import { SceneHeadline } from "../components/SceneHeadline";
import { StatBlock } from "../components/StatBlock";

export const Trust: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.white,
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_STACK,
        padding: 80,
      }}
    >
      <SceneHeadline color={COLORS.primaryDark} size={50}>
        A premium cleaning lifestyle.
      </SceneHeadline>

      <div
        style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 44 }}
      >
        {TRUST_POINTS.map((point, i) => {
          const start = 20 + i * 12;
          const opacity = interpolate(frame, [start, start + 16], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const x = interpolate(frame, [start, start + 16], [-40, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={point}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                opacity,
                transform: `translateX(${x}px)`,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  backgroundColor: COLORS.primary,
                  color: COLORS.white,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                ✓
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: COLORS.primaryDark }}>
                {point}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 56,
          backgroundColor: COLORS.primaryDark,
          borderRadius: 28,
          padding: "32px 56px",
          display: "flex",
          gap: 56,
        }}
      >
        {STATS.map((stat, i) => (
          <StatBlock
            key={stat.label}
            value={stat.value}
            label={stat.label}
            delay={75 + i * 8}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
