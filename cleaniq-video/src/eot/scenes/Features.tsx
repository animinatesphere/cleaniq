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

const FEATURES = [
  {
    title: "Deep Kitchen Clean",
    detail: "Oven, surfaces & appliances — immaculate",
    photo: "photos/deepclean.jpg",
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        <line x1="12" y1="12" x2="12" y2="16"/>
        <line x1="10" y1="14" x2="14" y2="14"/>
      </svg>
    ),
  },
  {
    title: "Bathroom Sanitization",
    detail: "Tiles, grout & fixtures — spotlessly hygienic",
    photo: "photos/airbnb.jpg",
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h16M4 12a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5z"/>
        <line x1="6" y1="20" x2="6" y2="22"/>
        <line x1="18" y1="20" x2="18" y2="22"/>
      </svg>
    ),
  },
  {
    title: "Carpet & Floor Care",
    detail: "Vacuumed, mopped & refreshed throughout",
    photo: "photos/residential.jpg",
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="3" y1="15" x2="21" y2="15"/>
        <line x1="9" y1="3" x2="9" y2="21"/>
        <line x1="15" y1="3" x2="15" y2="21"/>
      </svg>
    ),
  },
  {
    title: "Guaranteed Deposit Return",
    detail: "We meet the strictest inventory standards",
    photo: "photos/end_of_tenancy.jpg",
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
  },
];

const CARD_DUR = 75;

const PhotoBackground: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {FEATURES.map((f, i) => {
        const start = i * CARD_DUR;
        const end = start + CARD_DUR;
        const photoOpacity = interpolate(
          frame,
          [start, start + 20, end - 20, end],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        const photoScale = interpolate(frame, [start, end], [1.0, 1.06], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <AbsoluteFill key={f.title} style={{ opacity: photoOpacity }}>
            <AbsoluteFill style={{ transform: `scale(${photoScale})` }}>
              <Img
                src={staticFile(f.photo)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  // Brighter — details visible through the dark overlay
                  filter: "brightness(0.42) saturate(0.75)",
                }}
              />
            </AbsoluteFill>
          </AbsoluteFill>
        );
      })}
    </>
  );
};

const FeatureCard: React.FC<{
  feature: (typeof FEATURES)[0];
  delay: number;
}> = ({ feature, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardSpring = spring({ frame: frame - delay, fps, config: { damping: 18, mass: 0.65 } });
  const x = interpolate(cardSpring, [0, 1], [-90, 0]);
  const cardScale = interpolate(cardSpring, [0, 1], [0.93, 1]);
  const cardOpacity = interpolate(frame, [delay, delay + 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 36,
        padding: "28px 48px",
        borderRadius: 20,
        background: "rgba(0,15,8,0.65)",
        border: "1px solid rgba(60,199,255,0.22)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        transform: `translateX(${x}px) scale(${cardScale})`,
        opacity: cardOpacity,
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ color: COLORS.secondary, flexShrink: 0 }}>
        {feature.icon}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: FONT_STACK,
            fontSize: 38,
            fontWeight: 700,
            color: COLORS.white,
            lineHeight: 1.2,
          }}
        >
          {feature.title}
        </div>
        <div
          style={{
            fontFamily: FONT_STACK,
            fontSize: 24,
            fontWeight: 400,
            color: "rgba(255,255,255,0.65)",
            marginTop: 4,
          }}
        >
          {feature.detail}
        </div>
      </div>
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          backgroundColor: COLORS.secondary,
          flexShrink: 0,
          boxShadow: `0 0 14px ${COLORS.secondary}`,
        }}
      />
    </div>
  );
};

export const Features: React.FC = () => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [278, 300], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const headingOpacity = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headingY = interpolate(frame, [0, 22], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut), overflow: "hidden" }}>
      {/* Cycling real photos */}
      <PhotoBackground />

      {/* Lighter dark overlay — photos visible */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(0,8,4,0.80) 0%, rgba(0,8,4,0.50) 55%, rgba(0,8,4,0.22) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 92% 50%, rgba(60,199,255,0.08) 0%, transparent 45%)",
        }}
      />

      {/* Content */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 160px",
          gap: 20,
        }}
      >
        <div
          style={{
            fontFamily: FONT_STACK,
            fontSize: 32,
            fontWeight: 500,
            color: COLORS.secondary,
            letterSpacing: 5,
            textTransform: "uppercase",
            marginBottom: 12,
            opacity: headingOpacity,
            transform: `translateY(${headingY}px)`,
          }}
        >
          What's Included
        </div>
        {FEATURES.map((f, i) => (
          <FeatureCard key={f.title} feature={f} delay={i * 42} />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
