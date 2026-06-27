// Shared flat/card design tokens — soft drop shadows on white cards over a
// light background, deep green accent. Matches the brand's reference design.
export const C = {
  primary: "#0F6B4C",
  primaryDark: "#0A5C43",
  primaryLight: "#E8F5EE",
  bg: "#F4F6F8",
  card: "#FFFFFF",
  textDark: "#1A1A1A",
  textMed: "#6B7280",
  textMuted: "#9CA3AF",
  border: "#EEF1F4",
};

// Soft drop shadow used on every card/button — never embossed/inset, just
// a gentle lift off the page.
export const cardShadow = {
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 12,
  elevation: 3,
};

export default { C, cardShadow };
