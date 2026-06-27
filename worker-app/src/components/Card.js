import React from "react";
import { View, StyleSheet } from "react-native";
import { C, cardShadow } from "../theme/flat";

const Card = ({ children, style, radius = 20 }) => (
  <View style={[styles.base, cardShadow, { borderRadius: radius }, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  base: {
    backgroundColor: C.card,
    padding: 16,
  },
});

export default Card;
