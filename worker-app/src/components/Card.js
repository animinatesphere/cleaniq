import React from "react";
import { View, StyleSheet } from "react-native";
import { C, cardShadow } from "../theme/flat";
import { themed } from "../theme/dark";

const Card = ({ children, style, radius = 20 }) => (
  <View style={[styles.base, cardShadow, { borderRadius: radius }, style]}>
    {children}
  </View>
);

const styles = themed(StyleSheet.create({
  base: {
    backgroundColor: C.card,
    padding: 16,
  },
}));

export default Card;
