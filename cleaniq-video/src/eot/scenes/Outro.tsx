import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
  staticFile,
  Easing,
} from "remotion";
import { COLORS, FONT_STACK } from "../../constants";

const TRUST_BADGES = [
  "DBS-Checked Cleaners",
  "48-Hour Re-Clean Guarantee",
  "Fully Insured",
  "Manchester & Beyond",
];

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Ken Burns on background
  const photoScale = interpolate(frame, [0, 300], [1.06, 1.0], {
    extrapolateRight: "clamp",
  });

  // Logo spring entrance
  const logoSpring = spring({
    frame: frame - 18,
    fps,
    config: { damping: 13, mass: 0.5 },
  });
  const logoScale = interpolate(logoSpring, [0, 1], [0.65, 1]);
  const logoOpacity = interpolate(frame, [18, 42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // CTA text
  const ctaSpring = spring({
    frame: frame - 52,
    fps,
    config: { damping: 15, mass: 0.65 },
  });
  const ctaY = interpolate(ctaSpring, [0, 1], [55, 0]);
  const ctaOpacity = interpolate(frame, [52, 78], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const dividerW = interpolate(frame, [82, 120], [0, 320], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const contactOpacity = interpolate(frame, [90, 118], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const barY = interpolate(frame, [105, 135], [80, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const barOpacity = interpolate(frame, [105, 135], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: fadeIn, overflow: "hidden" }}>
      {/* Background photo — brighter so room detail shows */}
      <AbsoluteFill style={{ transform: `scale(${photoScale})` }}>
        <Img
          src={staticFile("photos/airbnb.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.28) saturate(0.8)",
          }}
        />
      </AbsoluteFill>
      {/* Brand tint */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(148deg, rgba(0,59,42,0.65) 0%, rgba(0,25,15,0.4) 55%, rgba(0,91,65,0.48) 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 38%, rgba(60,199,255,0.10) 0%, transparent 50%)",
        }}
      />
      {/* Main content */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          paddingBottom: 80,
          gap: 0,
        }}
      >
        {/* Real Cleaniq logo — NO filter invert, shown in full color */}
        <div
          style={{
            transform: `scale(${logoScale})`,
            opacity: logoOpacity,
            marginBottom: 40,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 8px 40px rgba(0,0,0,0.45)",
          }}
        >
          <Img
            src={staticFile("logo-dp.jpg")}
            style={{
              height: 100,
              objectFit: "contain",
              display: "block",
              translate: "-2.5px 2.6px",
            }}
          />
        </div>

        {/* CTA headline */}
        <div
          style={{
            transform: `translateY(${ctaY}px)`,
            opacity: ctaOpacity,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: FONT_STACK,
              fontSize: 78,
              fontWeight: 800,
              color: COLORS.white,
              letterSpacing: -2,
              lineHeight: 1.1,
              textShadow: "0 4px 32px rgba(0,0,0,0.6)",
            }}
          >
            Book Your Move-Out Clean
          </div>
          <div
            style={{
              fontFamily: FONT_STACK,
              fontSize: 78,
              fontWeight: 800,
              color: COLORS.secondary,
              letterSpacing: -2,
              lineHeight: 1.1,
              textShadow: `0 4px 32px rgba(60,199,255,0.35)`,
            }}
          >
            Today.
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            width: dividerW,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${COLORS.secondary}, transparent)`,
            margin: "36px 0",
          }}
        />

        {/* Contact */}
        <div
          style={{
            opacity: contactOpacity,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              fontFamily: FONT_STACK,
              fontSize: 42,
              fontWeight: 700,
              color: COLORS.white,
              letterSpacing: 0.5,
              textShadow: "0 2px 16px rgba(0,0,0,0.5)",
            }}
          >
            +44 7752 476368
          </div>
          <div
            style={{
              fontFamily: FONT_STACK,
              fontSize: 30,
              fontWeight: 400,
              color: "rgba(255,255,255,0.72)",
              letterSpacing: 1,
            }}
          >
            www.cleaniqservices.com
          </div>
        </div>
      </AbsoluteFill>
      {/* Bottom trust bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 76,
          background: "rgba(0,0,0,0.32)",
          borderTop: "1px solid rgba(60,199,255,0.22)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 64,
          transform: `translateY(${barY}px)`,
          opacity: barOpacity,
        }}
      >
        {TRUST_BADGES.map((t) => (
          <div
            key={t}
            style={{
              fontFamily: FONT_STACK,
              fontSize: 20,
              fontWeight: 500,
              color: "rgba(255,255,255,0.65)",
              letterSpacing: 0.8,
            }}
          >
            {t}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
