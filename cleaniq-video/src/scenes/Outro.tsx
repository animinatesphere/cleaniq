import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  interpolate,
} from "remotion";
import { COLORS, FONT_STACK } from "../constants";
import { CTAButton } from "../components/CTAButton";

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.primaryDark,
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_STACK,
      }}
    >
      <Img
        src={staticFile("logo-dp.jpg")}
        style={{ width: 130, opacity: fadeIn, marginBottom: 28 }}
      />
      <div
        style={{
          fontSize: 56,
          fontWeight: 800,
          color: COLORS.white,
          opacity: fadeIn,
          marginBottom: 36,
        }}
      >
        Book in 60 Seconds
      </div>
      <CTAButton delay={15}>Book Now</CTAButton>
      <div
        style={{
          marginTop: 30,
          fontSize: 22,
          color: "rgba(255,255,255,0.7)",
          opacity: fadeIn,
          letterSpacing: 1,
        }}
      >
        cleaniqservices.com · +44 7752 476368
      </div>
      <div
        style={{
          marginTop: 14,
          fontSize: 16,
          color: "rgba(255,255,255,0.45)",
          opacity: fadeIn,
          letterSpacing: 1,
        }}
      >
        NO HIDDEN FEES · FULLY INSURED · MANCHESTER
      </div>
    </AbsoluteFill>
  );
};
