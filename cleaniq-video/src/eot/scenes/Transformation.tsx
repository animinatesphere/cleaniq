import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  Img,
  staticFile,
} from "remotion";
import { COLORS, FONT_STACK } from "../../constants";

const W = 1920;

export const Transformation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [335, 360], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const outerOpacity = Math.min(fadeIn, fadeOut);

  const wipeX = interpolate(frame, [25, 230], [0, W], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 0.61, 0.36, 1),
  });

  const beforeScale = interpolate(frame, [0, 360], [1.0, 1.08], { extrapolateRight: "clamp" });
  const afterScale  = interpolate(frame, [0, 360], [1.08, 1.0], { extrapolateRight: "clamp" });
  const beforeX = interpolate(frame, [0, 360], [0, 40],  { extrapolateRight: "clamp" });
  const afterX  = interpolate(frame, [0, 360], [40, 0],  { extrapolateRight: "clamp" });

  const beforeLabelOpacity = interpolate(frame, [8, 28],  [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const afterLabelOpacity  = interpolate(frame, [55, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const titleSpring = spring({ frame: frame - 248, fps, config: { damping: 15, mass: 0.7 } });
  const titleY = interpolate(titleSpring, [0, 1], [48, 0]);
  const titleOpacity = interpolate(frame, [248, 278], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const wipeVisible = wipeX > 2 && wipeX < W - 2;

  return (
    <AbsoluteFill style={{ opacity: outerOpacity, overflow: "hidden" }}>

      {/* ── BEFORE panel — desaturated but readable ── */}
      <AbsoluteFill>
        <AbsoluteFill style={{ transform: `scale(${beforeScale}) translateX(${beforeX}px)` }}>
          <Img
            src={staticFile("photos/end_of_tenancy.jpg")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "grayscale(0.75) saturate(0.3) brightness(0.55) contrast(1.1)",
            }}
          />
        </AbsoluteFill>
        <AbsoluteFill
          style={{
            background: "linear-gradient(148deg, rgba(20,14,8,0.4) 0%, rgba(0,0,0,0.2) 100%)",
          }}
        />
        <AbsoluteFill
          style={{ display: "flex", alignItems: "flex-end", padding: "56px 80px" }}
        >
          <div
            style={{
              fontFamily: FONT_STACK,
              fontSize: 34,
              fontWeight: 600,
              color: "rgba(220,205,175,0.7)",
              letterSpacing: 8,
              textTransform: "uppercase",
              opacity: beforeLabelOpacity,
              textShadow: "0 2px 16px rgba(0,0,0,0.7)",
            }}
          >
            Before
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* ── AFTER panel — bright, vibrant, fresh ── */}
      <AbsoluteFill
        style={{ clipPath: `polygon(${wipeX}px 0, 100% 0, 100% 100%, ${wipeX}px 100%)` }}
      >
        <AbsoluteFill style={{ transform: `scale(${afterScale}) translateX(${afterX}px)` }}>
          <Img
            src={staticFile("photos/residential.jpg")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "brightness(1.18) saturate(1.25) contrast(1.05)",
            }}
          />
        </AbsoluteFill>
        {/* Subtle warm highlight */}
        <AbsoluteFill
          style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.08) 0%, transparent 50%)",
          }}
        />
        <AbsoluteFill
          style={{ display: "flex", alignItems: "flex-end", padding: "56px 80px", justifyContent: "flex-end" }}
        >
          <div
            style={{
              fontFamily: FONT_STACK,
              fontSize: 34,
              fontWeight: 600,
              color: COLORS.primary,
              letterSpacing: 8,
              textTransform: "uppercase",
              opacity: afterLabelOpacity,
              textShadow: "0 2px 16px rgba(255,255,255,0.5)",
            }}
          >
            After
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* Wipe edge glow */}
      {wipeVisible && (
        <div
          style={{
            position: "absolute",
            left: wipeX - 2,
            top: 0,
            width: 4,
            height: "100%",
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.96) 18%, rgba(255,255,255,0.96) 82%, transparent 100%)",
            boxShadow: "0 0 28px rgba(255,255,255,0.6), 0 0 60px rgba(255,255,255,0.25)",
          }}
        />
      )}

      {/* Post-wipe title card — brighter glass */}
      {frame > 248 && (
        <AbsoluteFill
          style={{ display: "flex", justifyContent: "center", alignItems: "center", opacity: titleOpacity }}
        >
          <div
            style={{
              background: "rgba(0,30,18,0.78)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderRadius: 24,
              padding: "44px 88px",
              textAlign: "center",
              transform: `translateY(${titleY}px)`,
              border: "1px solid rgba(60,199,255,0.28)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
            }}
          >
            <div
              style={{
                fontFamily: FONT_STACK,
                fontSize: 62,
                fontWeight: 800,
                color: COLORS.white,
                letterSpacing: -1.5,
                lineHeight: 1.1,
              }}
            >
              Professional End of Tenancy Clean
            </div>
            <div
              style={{
                fontFamily: FONT_STACK,
                fontSize: 30,
                fontWeight: 400,
                color: COLORS.secondary,
                marginTop: 14,
                letterSpacing: 0.5,
              }}
            >
              Guaranteed to meet your landlord's standards
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
