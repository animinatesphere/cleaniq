import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS } from "../constants";
import { SceneHeadline } from "../components/SceneHeadline";
import { Badge } from "../components/Badge";

export const SocialProof: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.primaryDark,
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
      }}
    >
      <SceneHeadline color={COLORS.white} size={64}>
        4.9/5 from 2,000+ users
      </SceneHeadline>
      <div style={{ marginTop: 4 }}>
        <Badge delay={20} variant="outline">
          JOIN 2,000+ HAPPY CUSTOMERS TODAY
        </Badge>
      </div>
    </AbsoluteFill>
  );
};
