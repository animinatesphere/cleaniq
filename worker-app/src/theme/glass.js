// Shared glassmorphic design tokens for the worker app. Keep all
// glass-related colors/blur settings here so every screen looks consistent.

export const colors = {
  primary: "#0A5C43",
  primaryDark: "#063D2C",
  accent: "#6EE7B7",
  background: "#0A5C43",
  glassLight: "rgba(255,255,255,0.18)",
  glassBorder: "rgba(255,255,255,0.35)",
  glassDark: "rgba(15,23,42,0.35)",
  text: "#0F172A",
  textMuted: "#64748B",
  textOnDark: "#FFFFFF",
  textOnDarkMuted: "rgba(255,255,255,0.7)",
};

// Standard blur props for <BlurView>, tuned for iOS/Android parity.
export const blur = {
  intensity: 40,
  tint: "light",
};

export const radii = {
  sm: 12,
  md: 20,
  lg: 28,
  xl: 36,
};

export default { colors, blur, radii };
