import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { colors, blur, radii } from "../theme/glass";

// Frosted-glass card. Falls back to a translucent solid fill on Android
// where heavy blur can be expensive — still reads as "glass" visually.
const GlassCard = ({ children, style, radius = radii.lg, intensity = blur.intensity, tint = blur.tint }) => {
  const content = (
    <View style={[styles.content, { borderRadius: radius }]}>{children}</View>
  );

  if (Platform.OS === "android") {
    return (
      <View style={[styles.androidFallback, { borderRadius: radius }, style]}>
        {content}
      </View>
    );
  }

  return (
    <BlurView
      intensity={intensity}
      tint={tint}
      style={[styles.container, { borderRadius: radius }, style]}
    >
      {content}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassLight,
  },
  androidFallback: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  content: {
    flex: 1,
  },
});

export default GlassCard;
