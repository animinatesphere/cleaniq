// Shared neumorphic surface tokens used across the worker-app.
export const NEU_BG = "#E7ECF3";

export const neuRaised = {
  backgroundColor: "#EEF2F8",
  borderWidth: 1,
  borderTopColor: "rgba(255,255,255,0.85)",
  borderLeftColor: "rgba(255,255,255,0.85)",
  borderRightColor: "rgba(163,177,198,0.45)",
  borderBottomColor: "rgba(163,177,198,0.45)",
  shadowColor: "#A3B1C6",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.5,
  shadowRadius: 10,
  elevation: 5,
};

export const neuRaisedSm = {
  ...neuRaised,
  shadowOffset: { width: 0, height: 3 },
  shadowRadius: 6,
  elevation: 3,
};

export const neuInset = {
  backgroundColor: "#DDE3EC",
  borderWidth: 1,
  borderTopColor: "rgba(163,177,198,0.5)",
  borderLeftColor: "rgba(163,177,198,0.5)",
  borderRightColor: "rgba(255,255,255,0.8)",
  borderBottomColor: "rgba(255,255,255,0.8)",
};

export const neuCircle = {
  ...neuRaisedSm,
  borderRadius: 999,
};

export const neuGreenRaised = {
  backgroundColor: "#0F6B4C",
  shadowColor: "#0A5C43",
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.4,
  shadowRadius: 9,
  elevation: 5,
};
