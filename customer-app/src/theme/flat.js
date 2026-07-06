import { Platform } from "react-native";

export const C = {
  primary:       "#0F6B4C",
  primaryDark:   "#083d2b",
  primaryLight:  "#DCFCE7",
  primaryMid:    "#14A66B",
  bg:            "#F8FAFC",
  surface:       "#FFFFFF",
  surfaceAlt:    "#F1F5F9",
  textDark:      "#0F172A",
  textMed:       "#475569",
  textMuted:     "#94A3B8",
  border:        "#E2E8F0",
  borderDark:    "#CBD5E1",
  success:       "#10B981",
  successBg:     "#ECFDF5",
  warning:       "#F59E0B",
  warningBg:     "#FFFBEB",
  error:         "#EF4444",
  errorBg:       "#FEF2F2",
  info:          "#3B82F6",
  infoBg:        "#EFF6FF",
  purple:        "#8B5CF6",
  purpleBg:      "#F5F3FF",
  orange:        "#EA580C",
  orangeBg:      "#FFF7ED",
};

export const cardShadow = Platform.select({
  ios:     { shadowColor: "#0F172A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10 },
  android: { elevation: 3 },
  default: {},
});

export const shadow = {
  sm: Platform.select({
    ios:     { shadowColor: "#0F172A", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
    android: { elevation: 1 },
    default: {},
  }),
  lg: Platform.select({
    ios:     { shadowColor: "#0F172A", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24 },
    android: { elevation: 8 },
    default: {},
  }),
};
