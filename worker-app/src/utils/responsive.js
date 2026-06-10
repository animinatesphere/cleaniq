import { Dimensions, Platform } from "react-native";

/**
 * Responsive Design Utility
 * Provides responsive helpers for React Native screens
 * Supports multiple device sizes: phone (< 600dp), tablet (600-900dp), large tablet (>900dp)
 */

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Breakpoints for different device sizes
export const BREAKPOINTS = {
  PHONE: 600,
  TABLET: 900,
  LARGE_TABLET: 1200,
};

// Determine device type
export const getDeviceType = () => {
  if (screenWidth >= BREAKPOINTS.LARGE_TABLET) return "large-tablet";
  if (screenWidth >= BREAKPOINTS.TABLET) return "tablet";
  return "phone";
};

// Responsive scaling function - scales values based on screen width
export const responsiveWidth = (baseValue = 1) => {
  const scale = screenWidth / 375; // 375 is iPhone standard width
  return baseValue * scale;
};

export const responsiveHeight = (baseValue = 1) => {
  const scale = screenHeight / 812; // 812 is iPhone standard height
  return baseValue * scale;
};

// Font size helper - ensures readable text across all devices
export const responsiveFontSize = (baseSize) => {
  const scale = screenWidth / 375;
  const newSize = baseSize * scale;

  // Clamp between min and max for readability
  if (newSize > baseSize * 1.3) return baseSize * 1.3;
  if (newSize < baseSize * 0.8) return baseSize * 0.8;
  return newSize;
};

// Get responsive padding based on device type
export const getResponsivePadding = () => {
  const deviceType = getDeviceType();
  switch (deviceType) {
    case "large-tablet":
      return 32;
    case "tablet":
      return 24;
    default:
      return 16;
  }
};

// Get responsive margins
export const getResponsiveMargin = () => {
  const deviceType = getDeviceType();
  switch (deviceType) {
    case "large-tablet":
      return 24;
    case "tablet":
      return 20;
    default:
      return 16;
  }
};

// Responsive gap for flex layouts
export const getResponsiveGap = (baseGap = 12) => {
  if (screenWidth < BREAKPOINTS.PHONE) return Math.max(baseGap - 4, 8);
  if (screenWidth >= BREAKPOINTS.TABLET) return baseGap + 4;
  return baseGap;
};

// Get number of columns for grid layouts
export const getGridColumns = () => {
  if (screenWidth >= BREAKPOINTS.LARGE_TABLET) return 4;
  if (screenWidth >= BREAKPOINTS.TABLET) return 3;
  return 2;
};

// Card/Component sizing
export const getCardWidth = (columnsCount = 1) => {
  const totalPadding = getResponsivePadding() * 2;
  const availableWidth = screenWidth - totalPadding;
  return availableWidth / columnsCount - getResponsiveGap();
};

// Responsive border radius
export const getResponsiveBorderRadius = (baseRadius = 12) => {
  if (screenWidth < BREAKPOINTS.PHONE) return Math.max(baseRadius - 2, 8);
  if (screenWidth >= BREAKPOINTS.TABLET) return baseRadius + 2;
  return baseRadius;
};

// Safe area insets helper (especially for notched devices)
export const isBigScreen = () => screenWidth >= BREAKPOINTS.TABLET;
export const isSmallScreen = () => screenWidth < BREAKPOINTS.PHONE;
export const isLandscape = () => screenHeight < screenWidth;

// Get optimal button size
export const getResponsiveButtonHeight = () => {
  if (isSmallScreen()) return 44;
  if (isBigScreen()) return 52;
  return 48;
};

// Responsive touch target minimum (WCAG guideline: 48x48dp)
export const MIN_TOUCH_TARGET = 48;

// Dynamic spacing scale
export const spacing = {
  xs: responsiveWidth(4),
  sm: responsiveWidth(8),
  md: responsiveWidth(12),
  lg: responsiveWidth(16),
  xl: responsiveWidth(20),
  xxl: responsiveWidth(24),
  xxxl: responsiveWidth(32),
};

// Common responsive values
export const responsive = {
  screenWidth,
  screenHeight,
  deviceType: getDeviceType(),
  isBigScreen: isBigScreen(),
  isSmallScreen: isSmallScreen(),
  isLandscape: isLandscape(),
  padding: getResponsivePadding(),
  margin: getResponsiveMargin(),
  gap: getResponsiveGap(),
  borderRadius: getResponsiveBorderRadius(),
  buttonHeight: getResponsiveButtonHeight(),
};

// Export for easy access
export default {
  responsiveWidth,
  responsiveHeight,
  responsiveFontSize,
  getDeviceType,
  getResponsivePadding,
  getResponsiveMargin,
  getResponsiveGap,
  getGridColumns,
  getCardWidth,
  getResponsiveBorderRadius,
  isBigScreen,
  isSmallScreen,
  isLandscape,
  getResponsiveButtonHeight,
  spacing,
  responsive,
  BREAKPOINTS,
  screenWidth,
  screenHeight,
};
