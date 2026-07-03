import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  Easing,
  Img,
  staticFile,
} from "remotion";
import { FONT_STACK } from "../../constants";

const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x: (i * 137.508) % 100,
  y: (i * 73.191) % 100,
  size: 3 + (i % 6),
  speed: 0.25 + (i % 5) * 0.12,
  phase: (i * 47) % 100,
  opacity: 0.12 + (i % 5) * 0.05,
}));

export const Problem: React.FC = () => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [132, 150], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(fadeIn, fadeOut);

  const photoScale = interpolate(frame, [0, 150], [1.06, 1.0], {
    extrapolateRight: "clamp",
  });
  const photoY = interpolate(frame, [0, 150], [0, 20], {
    extrapolateRight: "clamp",
  });

  const easeOut = Easing.out(Easing.cubic);

  const text1Opacity = interpolate(frame, [22, 42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const text1Y = interpolate(frame, [22, 42], [35, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const text2Opacity = interpolate(frame, [50, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const text2Y = interpolate(frame, [50, 70], [35, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  return (
    <AbsoluteFill style={{ opacity, overflow: "hidden" }}>
      {/* Moving-out photo — brighter than before so detail is visible */}
      <AbsoluteFill
        style={{
          transform: `scale(${photoScale}) translateY(${photoY}px)`,
        }}
      >
        <Img
          src={staticFile("photos/end_of_tenancy.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "grayscale(0.6) saturate(0.45) brightness(0.52) contrast(1.1)",
          }}
        />
      </AbsoluteFill>

      {/* Dust particles */}
      {PARTICLES.map((p) => {
        const drift = Math.sin((frame * p.speed + p.phase) * 0.055) * 18;
        const rise = ((frame * p.speed * 0.35 + p.phase * 3.2) % 115) - 12;
        return (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: `${p.x + drift * 0.18}%`,
              top: `${p.y - rise * 0.28}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: `rgba(220, 205, 178, ${p.opacity})`,
              filter: "blur(1.5px)",
            }}
          />
        );
      })}

      {/* Light vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.58) 100%)",
        }}
      />
      {/* Bottom gradient */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)",
        }}
      />

      {/* Text */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "0 180px",
          gap: 28,
        }}
      >
        <div
          style={{
            fontFamily: FONT_STACK,
            fontSize: 62,
            fontWeight: 700,
            color: "rgba(230, 215, 192, 0.95)",
            textAlign: "center",
            opacity: text1Opacity,
            transform: `translateY(${text1Y}px)`,
            textShadow: "0 4px 32px rgba(0,0,0,0.85)",
            lineHeight: 1.25,
          }}
        >
          Stubborn stains. Grime build-up.
          <br />
          Years of wear.
        </div>
        <div
          style={{
            fontFamily: FONT_STACK,
            fontSize: 38,
            fontWeight: 400,
            color: "rgba(185, 170, 150, 0.85)",
            textAlign: "center",
            opacity: text2Opacity,
            transform: `translateY(${text2Y}px)`,
            textShadow: "0 3px 24px rgba(0,0,0,0.8)",
          }}
        >
          Getting your deposit back feels impossible.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
