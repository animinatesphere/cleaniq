import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { C, cardShadow } from "../theme/flat";

// Solid pill button (default) or outline variant — matches the reference
// design's "Get Started" / "Book Now" buttons.
const Button = ({
  title,
  icon,
  onPress,
  disabled,
  variant = "solid",
  style,
  textStyle,
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.85}
    style={[
      styles.base,
      variant === "solid" ? styles.solid : styles.outline,
      variant === "solid" ? cardShadow : null,
      disabled && styles.disabled,
      style,
    ]}
  >
    <View style={styles.content}>
      {title ? (
        <Text
          style={[
            variant === "solid" ? styles.solidText : styles.outlineText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      ) : null}
      {icon}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    paddingVertical: 15,
    paddingHorizontal: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  solid: {
    backgroundColor: C.primary,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: C.primary,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  solidText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  outlineText: {
    color: C.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Button;
