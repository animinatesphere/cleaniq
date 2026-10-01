import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { FileText, CheckCircle, AlertCircle, ChevronRight, Hash } from "lucide-react-native";
import axios from "axios";
import { API_URL } from "../../context/AuthContext";
import { Screen, ScreenHeader, BigTitle, Loading, usePreferences, G, styles as s } from "./common";
import { tc, themed } from "../../theme/dark";

// My documents: what the cleaner sent with their application (ID, right to work, DBS, CV).
const FILE_HOST = API_URL.replace(/\/api\/?$/, "");

export default function DocumentsScreen({ navigation }) {
  const { workerId } = usePreferences();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await axios.get(`${API_URL}/workers/${workerId}/documents`);
      setData(res.data);
      setError("");
    } catch (e) {
      setError(e.response?.data?.error || "Couldn't load your documents. Check your connection.");
    } finally {
      setRefreshing(false);
    }
  };
  useFocusEffect(useCallback(() => { if (workerId) load(); }, [workerId])); // eslint-disable-line react-hooks/exhaustive-deps

  if (!data) return <Screen><ScreenHeader title="" navigation={navigation} />{error ? <Text style={[s.error, { padding: 20 }]}>{error}</Text> : <Loading />}</Screen>;

  const docs = data.documents || [];
  const missing = docs.filter((d) => !d.path).length;
  const submitted = data.submittedAt ? new Date(data.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null;

  return (
    <Screen>
      <ScreenHeader title="" navigation={navigation} />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={tc(G.green)} />}
      >
        <BigTitle sub={submitted ? `Sent with your application on ${submitted}.` : "The documents you sent when you applied."}>My documents</BigTitle>
        {!!error && <Text style={s.error}>{error}</Text>}

        {missing > 0 && (
          <View style={st.notice}>
            <AlertCircle size={18} color={tc("#B45309")} />
            <Text style={st.noticeTxt}>
              {missing === docs.length
                ? "We couldn't find any documents for your account. If you sent them another way, Cleaniq may still have them."
                : `${missing} document${missing === 1 ? " is" : "s are"} missing.`}{" "}
              To send or update a document, contact Cleaniq from Contact us & help centre.
            </Text>
          </View>
        )}

        {docs.map((d) => (
          <TouchableOpacity
            key={d.key}
            style={st.row}
            disabled={!d.path}
            activeOpacity={0.7}
            onPress={() => Linking.openURL(`${FILE_HOST}/${d.path}`)}
          >
            <View style={[st.icon, !d.path && st.iconOff]}>
              <FileText size={20} color={tc(d.path ? G.green : G.mute)} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.label}>{d.label}</Text>
              <Text style={st.hint}>{d.hint}</Text>
            </View>
            {d.path ? (
              <View style={st.status}>
                <CheckCircle size={16} color={tc(G.green)} />
                <Text style={st.view}>View</Text>
                <ChevronRight size={18} color={tc(G.text)} />
              </View>
            ) : (
              <Text style={st.missing}>Not uploaded</Text>
            )}
          </TouchableOpacity>
        ))}

        {!!data.rightToWorkCode && (
          <View style={st.row}>
            <View style={st.icon}><Hash size={20} color={tc(G.green)} /></View>
            <View style={{ flex: 1 }}>
              <Text style={st.label}>Right to work share code</Text>
              <Text style={st.code}>{data.rightToWorkCode}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const st = themed(StyleSheet.create({
  notice: { flexDirection: "row", gap: 10, backgroundColor: "#FFFBEB", borderRadius: 14, padding: 14, marginBottom: 8 },
  noticeTxt: { flex: 1, fontSize: 13, color: "#78350F", lineHeight: 19 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: G.line },
  icon: { width: 44, height: 44, borderRadius: 12, backgroundColor: G.greenPale, alignItems: "center", justifyContent: "center" },
  iconOff: { backgroundColor: G.soft },
  label: { fontSize: 16, fontWeight: "800", color: G.text },
  hint: { fontSize: 12, color: G.sub, marginTop: 2 },
  status: { flexDirection: "row", alignItems: "center", gap: 4 },
  view: { fontSize: 14, fontWeight: "800", color: G.green },
  missing: { fontSize: 13, fontWeight: "700", color: G.mute },
  code: { fontSize: 15, fontWeight: "800", color: G.text, marginTop: 2, letterSpacing: 1 },
}));
