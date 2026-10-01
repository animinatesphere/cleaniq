// Shared surface tokens used across the worker-app: white pages, white cards with a hairline
// border and a soft shadow (Wecasa-style).
export const NEU_BG = "#FFFFFF";

export const neuRaised = {
  backgroundColor: "#FFFFFF",
  borderWidth: 1,
  borderColor: "#EEF1F4",
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 2,
};

export const neuRaisedSm = {
  ...neuRaised,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 6,
  elevation: 1,
};

export const neuInset = {
  backgroundColor: "#F4F6F8",
  borderWidth: 1,
  borderColor: "#EEF1F4",
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
