import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Search, SlidersHorizontal } from "lucide-react-native";
import { C, cardShadow } from "../theme/flat";
import { tc, themed } from "../theme/dark";

// Light pill search field with a soft drop shadow + optional filter button,
// matching the reference design's home-screen search bar.
const SearchBar = ({ value, onChangeText, placeholder, onFilterPress }) => (
  <View style={styles.row}>
    <View style={[styles.field, cardShadow]}>
      <Search size={18} color={tc(C.textMuted)} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || "Search for service..."}
        placeholderTextColor={tc(C.textMuted)}
      />
    </View>
    {onFilterPress && (
      <View style={[styles.filterBtn, cardShadow]}>
        <SlidersHorizontal size={18} color={tc(C.primary)} onPress={onFilterPress} />
      </View>
    )}
  </View>
);

const styles = themed(StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  field: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.card,
    borderRadius: 999,
    paddingHorizontal: 18,
    height: 52,
  },
  input: {
    flex: 1,
    height: "100%",
    color: C.textDark,
    fontSize: 14,
    fontWeight: "500",
  },
  filterBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
}));

export default SearchBar;
