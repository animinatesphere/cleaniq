import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
  staticFile,
} from "remotion";
import { COLORS, FONT_STACK } from "../../constants";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Ken Burns on photo
  const photoScale = interpolate(frame, [0, 90], [1.0, 1.07], {
    extrapolateRight: "clamp",
  });
  const photoX = interpolate(frame, [0, 90], [0, -30], {
    extrapolateRight: "clamp",
  });

  // Logo entrance
  const logoSpring = spring({ frame: frame - 5, fps, config: { damping: 14, mass: 0.5 } });
  const logoOpacity = interpolate(frame, [5, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const logoScale = interpolate(logoSpring, [0, 1], [0.8, 1]);

  // "Moving Out?"
  const line1Spring = spring({ frame: frame - 18, fps, config: { damping: 14, mass: 0.6 } });
  const line1Y = interpolate(line1Spring, [0, 1], [70, 0]);
  const line1Opacity = interpolate(frame, [18, 36], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "Leave It Spotless."
  const line2Spring = spring({ frame: frame - 36, fps, config: { damping: 14, mass: 0.7 } });
  const line2Y = interpolate(line2Spring, [0, 1], [70, 0]);
  const line2Opacity = interpolate(frame, [36, 56], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lineWidth = interpolate(frame, [58, 82], [0, 240], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      {/* Background photo — bright living room */}
      <AbsoluteFill
        style={{
          transform: `scale(${photoScale}) translateX(${photoX}px)`,
          opacity: bgOpacity,
        }}
      >
        <Img
          src={staticFile("photos/residential.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.38) saturate(0.6)",
          }}
        />
      </AbsoluteFill>

      {/* Gradient overlay — lighter than before */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.05) 20%, rgba(0,0,0,0.55) 100%)",
          opacity: bgOpacity,
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(145deg, rgba(0,59,42,0.45) 0%, transparent 55%)`,
          opacity: bgOpacity,
        }}
      />

      {/* Logo — top-left corner */}
      <div
        style={{
          position: "absolute",
          top: 56,
          left: 72,
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          transformOrigin: "top left",
        }}
      >
        <Img
          src={staticFile("logo-dp.jpg")}
          style={{
            height: 80,
            objectFit: "contain",
            borderRadius: 12,
          }}
        />
      </div>

      {/* Text block */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            fontFamily: FONT_STACK,
            fontSize: 80,
            fontWeight: 300,
            color: "rgba(255,255,255,0.72)",
            letterSpacing: 8,
            transform: `translateY(${line1Y}px)`,
            opacity: line1Opacity,
            textShadow: "0 4px 32px rgba(0,0,0,0.7)",
          }}
        >
          Moving Out?
        </div>
        <div
          style={{
            fontFamily: FONT_STACK,
            fontSize: 110,
            fontWeight: 800,
            color: COLORS.white,
            letterSpacing: -3,
            lineHeight: 1.05,
            transform: `translateY(${line2Y}px)`,
            opacity: line2Opacity,
            textShadow: "0 4px 40px rgba(0,0,0,0.65)",
          }}
        >
          Leave It Spotless.
        </div>
        <div
          style={{
            width: lineWidth,
            height: 4,
            background: `linear-gradient(90deg, ${COLORS.secondary}, rgba(60,199,255,0.3))`,
            borderRadius: 2,
            marginTop: 12,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
