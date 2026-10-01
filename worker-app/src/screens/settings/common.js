// Shared pieces for the Wecasa-style account screens (Services, Working hours, Travel area, …).
import React, { useCallback, useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, ActivityIndicator } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import axios from "axios";
import { AuthContext, API_URL } from "../../context/AuthContext";
import { tc, themed } from "../../theme/dark";

export const G = {
  green: "#0F6B4C",
  greenDark: "#083d2b",
  greenPale: "#E8F5EE",
  text: "#111827",
  sub: "#6B7280",
  mute: "#9CA3AF",
  line: "#EEF1F4",
  bg: "#FFFFFF",
  soft: "#F4F6F8",
};

export function ScreenHeader({ title, navigation, right }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <ChevronLeft size={24} color={tc(G.text)} />
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      <View style={{ width: 32, alignItems: "flex-end" }}>{right}</View>
    </View>
  );
}

export function Screen({ children }) {
  return <SafeAreaView style={styles.screen}>{children}</SafeAreaView>;
}

export function BigTitle({ children, sub }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.bigTitle}>{children}</Text>
      {!!sub && <Text style={styles.bigSub}>{sub}</Text>}
    </View>
  );
}

export function MenuRow({ icon: Icon, label, sub, onPress, last }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.menuRow, last && { borderBottomWidth: 0 }]}>
      {Icon && <Icon size={20} color={tc(G.green)} />}
      <View style={{ flex: 1 }}>
        <Text style={styles.menuLabel}>{label}</Text>
        {!!sub && <Text style={styles.menuSub}>{sub}</Text>}
      </View>
      <ChevronRight size={20} color={tc(G.text)} />
    </TouchableOpacity>
  );
}

export function SectionLabel({ children }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function Loading() {
  return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator size="large" color={tc(G.green)} /></View>;
}

// Loads and saves the cleaner's offer settings (GET/PUT /workers/:id/preferences).
export function usePreferences() {
  const { workerInfo } = useContext(AuthContext);
  const id = workerInfo?.id || workerInfo?._id;
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/workers/${id}/preferences`);
      setData(res.data);
      setError("");
    } catch (e) {
      setError(e.response?.data?.error || "Couldn't load your settings. Check your connection.");
    }
  }, [id]);
  useEffect(() => { if (id) load(); }, [id, load]);

  const save = async (patch) => {
    setSaving(true);
    try {
      const res = await axios.put(`${API_URL}/workers/${id}/preferences`, patch);
      setData((d) => ({ ...d, preferences: res.data.preferences }));
      setError("");
      return true;
    } catch (e) {
      setError(e.response?.data?.error || "Couldn't save. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  };
  return { data, prefs: data?.preferences, error, saving, save, reload: load, workerId: id };
}

export const styles = themed(StyleSheet.create({
  screen: { flex: 1, backgroundColor: G.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: Platform.OS === "android" ? 40 : 8, paddingBottom: 10 },
  back: { width: 32 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 20, fontWeight: "900", color: G.text },
  bigTitle: { fontSize: 24, fontWeight: "900", color: G.text, letterSpacing: -0.4 },
  bigSub: { fontSize: 15, color: "#374151", marginTop: 8, lineHeight: 21 },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: G.line },
  menuLabel: { fontSize: 17, fontWeight: "800", color: G.text },
  menuSub: { fontSize: 12, color: G.sub, marginTop: 2 },
  sectionLabel: { fontSize: 13, fontWeight: "800", color: G.mute, letterSpacing: 1, textTransform: "uppercase", marginTop: 26, marginBottom: 2 },
  error: { color: "#B91C1C", fontSize: 13, fontWeight: "600", marginBottom: 10 },
  saved: { color: G.green, fontSize: 13, fontWeight: "700", marginBottom: 10 },
}));
