import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { COLORS, SERVICES } from "../constants";
import { ServiceItem } from "../components/ServiceItem";

const PER_SERVICE = 48; // frames each service card is shown

export const Services: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.primaryDark }}>
      {SERVICES.map((service, i) => (
        <Sequence
          key={service.name}
          from={i * PER_SERVICE}
          durationInFrames={PER_SERVICE}
        >
          <ServiceItem
            name={service.name}
            tag={service.tag}
            photo={service.photo}
            durationInFrames={PER_SERVICE}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const SERVICES_DURATION = SERVICES.length * PER_SERVICE;
