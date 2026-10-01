import React, { useCallback, useContext, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ChevronRight } from "lucide-react-native";
import axios from "axios";
import { AuthContext, API_URL } from "../../context/AuthContext";
import { Screen, ScreenHeader, Loading, G } from "./common";

// My appointments: Upcoming / Delivered, with cancelled visits flagged.
const DONE = ["Completed", "Completed - Unpaid"];
const area = (b) => (b.details?.address || "").split(",").map((x) => x.trim()).filter(Boolean).slice(-2, -1)[0] || "";

export default function MyAppointmentsScreen({ navigation }) {
  const { workerInfo } = useContext(AuthContext);
  const [jobs, setJobs] = useState(null);
  const [tab, setTab] = useState("upcoming");
  const [refreshing, setRefreshing] = useState(false);
  const load = async () => {
    try {
      const res = await axios.get(`${API_URL}/workers/jobs/my-jobs/${workerInfo?.id}`);
      setJobs(Array.isArray(res.data) ? res.data : []);
    } catch { setJobs([]); }
  };
  useFocusEffect(useCallback(() => { load(); }, [])); // eslint-disable-line react-hooks/exhaustive-deps

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const list = (jobs || [])
    .filter((b) => (tab === "delivered" ? DONE.includes(b.status) : !DONE.includes(b.status) && new Date(b.schedule?.date) >= today))
    .sort((a, b) => (tab === "delivered" ? -1 : 1) * (new Date(a.schedule?.date) - new Date(b.schedule?.date)));

  return (
    <Screen>
      <ScreenHeader title="My appointments" navigation={navigation} />
      <View style={st.tabs}>
        {[["upcoming", "Upcoming"], ["delivered", "Delivered"]].map(([id, label]) => (
          <TouchableOpacity key={id} style={[st.tab, tab === id && st.tabOn]} onPress={() => setTab(id)}>
            <Text style={[st.tabTxt, tab === id && st.tabTxtOn]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {jobs === null ? <Loading /> : (
        <FlatList
          data={list}
          keyExtractor={(b) => b._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
          ListEmptyComponent={<Text style={st.empty}>{tab === "upcoming" ? "No upcoming appointments." : "No delivered jobs yet."}</Text>}
          renderItem={({ item: b }) => {
            const d = new Date(b.schedule?.date);
            const cancelled = b.status === "Cancelled";
            return (
              <TouchableOpacity style={st.row} onPress={() => navigation.navigate("AcceptedBookingDetail", { bookingId: b._id })}>
                <View style={st.dateBox}>
                  {cancelled && <Text style={st.cancelled}>Cancelled</Text>}
                  <Text style={st.date}>{d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</Text>
                  <Text style={st.time}>{b.schedule?.preferredTime || b.schedule?.timeSlot || ""}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.name}>{b.customer?.firstName} {(b.customer?.lastName || "").slice(0, 1)}</Text>
                  <Text style={st.sub}>{b.service}{area(b) ? ` - ${area(b)}` : ""}</Text>
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
  tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: G.line },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: "transparent" },
  tabOn: { borderBottomColor: G.green },
  tabTxt: { fontSize: 15, fontWeight: "700", color: G.text },
  tabTxtOn: { color: G.green },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingRight: 16, borderBottomWidth: 1, borderBottomColor: G.line },
  dateBox: { width: 110, alignItems: "center", paddingVertical: 14, backgroundColor: G.soft },
  cancelled: { alignSelf: "stretch", textAlign: "center", backgroundColor: "#DC2626", color: "#fff", fontWeight: "900", fontSize: 13, paddingVertical: 4, marginTop: -14, marginBottom: 8 },
  date: { fontSize: 17, fontWeight: "900", color: G.text },
  time: { fontSize: 15, fontWeight: "800", color: G.text, marginTop: 2 },
  name: { fontSize: 16, fontWeight: "900", color: G.text },
  sub: { fontSize: 14, color: "#374151", marginTop: 3 },
  empty: { textAlign: "center", color: G.mute, marginTop: 40, fontSize: 15 },
});
