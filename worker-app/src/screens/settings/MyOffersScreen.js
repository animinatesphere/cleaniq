import React, { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ChevronRight, Sparkles, Repeat } from "lucide-react-native";
import axios from "axios";
import { API_URL } from "../../context/AuthContext";
import { Screen, ScreenHeader, Loading, usePreferences, G } from "./common";

// My offers: recent jobs that suited you, and whether they're still available.
const BADGE = {
  Available: { bg: "#DCFCE7", fg: "#166534" },
  "Accepted by you": { bg: "#E0F2FE", fg: "#075985" },
  Unavailable: { bg: "#FEE2E2", fg: "#B91C1C" },
};

export default function MyOffersScreen({ navigation }) {
  const { workerId } = usePreferences();
  const [offers, setOffers] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const load = async () => {
    try {
      const res = await axios.get(`${API_URL}/workers/${workerId}/offers-history`);
      setOffers(Array.isArray(res.data) ? res.data : []);
    } catch { setOffers([]); }
  };
  useFocusEffect(useCallback(() => { if (workerId) load(); }, [workerId])); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Screen>
      <ScreenHeader title="My offers" navigation={navigation} />
      {offers === null ? <Loading /> : (
        <FlatList
          data={offers}
          keyExtractor={(o) => String(o._id)}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
          ListEmptyComponent={<Text style={st.empty}>No offers in the last 60 days. Check your services, hours and travel area.</Text>}
          renderItem={({ item: o }) => {
            const regular = o.frequency && o.frequency !== "Once";
            const badge = BADGE[o.status] || BADGE.Unavailable;
            return (
              <TouchableOpacity style={st.row} onPress={() => navigation.navigate("OfferDetail", { offerId: o._id })}>
                <View style={[st.thumb, { backgroundColor: regular ? "#0F6B4C" : "#FDE68A" }]}>
                  {regular ? <Repeat size={26} color="#fff" /> : <Sparkles size={26} color="#78350F" />}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={st.top}>
                    <Text style={st.title} numberOfLines={1}>{o.service}</Text>
                    <Text numberOfLines={1} style={[st.badge, { backgroundColor: badge.bg, color: badge.fg }]}>{o.status}</Text>
                  </View>
                  <Text style={st.sub}>£{Number(o.pay?.total || 0).toFixed(2)} · {o.customerName}</Text>
                  <Text style={st.meta}>
                    {regular ? "Regular" : "One-off"} · {new Date(o.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                    {o.travelMinutes != null ? ` · ≈${o.travelMinutes} min` : ""}
                  </Text>
                </View>
                <ChevronRight size={20} color={G.text} />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </Screen>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: G.line },
  thumb: { width: 64, height: 64, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  top: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 17, fontWeight: "900", color: G.text, flexShrink: 1 },
  badge: { flexShrink: 0, fontSize: 11, fontWeight: "900", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, overflow: "hidden" },
  sub: { fontSize: 15, color: G.text, marginTop: 3, fontWeight: "600" },
  meta: { fontSize: 13, color: G.mute, marginTop: 2 },
  empty: { textAlign: "center", color: G.mute, marginTop: 40, fontSize: 15, lineHeight: 21 },
});
