import React, { useContext, useEffect, useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import axios from "axios";
import { AuthContext, API_URL } from "../../context/AuthContext";
import KeyboardSafeView from "../../components/KeyboardSafeView";
import { Screen, ScreenHeader, BigTitle, Loading, G, styles as s } from "./common";
import { tc, themed } from "../../theme/dark";

// Personal information: the cleaner's details as Cleaniq holds them. Phone and address can be
// changed here; name and email go through Cleaniq.
const EDITABLE = [
  { key: "phone", label: "Phone", keyboardType: "phone-pad" },
  { key: "address", label: "Address" },
  { key: "postcode", label: "Postcode", autoCapitalize: "characters" },
];

export default function PersonalInfoScreen({ navigation }) {
  const { workerInfo, updateWorkerInfo } = useContext(AuthContext);
  const id = workerInfo?.id || workerInfo?._id;
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    try {
      const res = await axios.get(`${API_URL}/workers/${id}/profile`);
      setInfo(res.data);
      setError("");
    } catch (e) {
      setError(e.response?.data?.error || "Couldn't load your details. Check your connection.");
    }
  };
  useEffect(() => { if (id) load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const startEdit = () => {
    setForm(Object.fromEntries(EDITABLE.map((f) => [f.key, info?.[f.key] || ""])));
    setSaved(false);
    setEditing(true);
  };
  const save = async () => {
    setSaving(true);
    try {
      const patch = Object.fromEntries(EDITABLE.map((f) => [f.key, String(form[f.key] || "").trim()]).filter(([, v]) => v));
      await axios.put(`${API_URL}/workers/${id}/profile`, patch);
      await updateWorkerInfo?.(patch);
      await load();
      setEditing(false);
      setSaved(true);
    } catch (e) {
      setError(e.response?.data?.error || "Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const header = (
    <ScreenHeader
      title=""
      navigation={navigation}
      right={info && !editing ? (
        <TouchableOpacity onPress={startEdit} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={st.editTxt}>Edit</Text>
        </TouchableOpacity>
      ) : null}
    />
  );
  if (!info) return <Screen>{header}{error ? <Text style={[s.error, { padding: 20 }]}>{error}</Text> : <Loading />}</Screen>;

  const since = info.createdAt ? new Date(info.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "";
  const rows = [
    ["Full name", `${info.firstName || ""} ${info.lastName || ""}`.trim()],
    ["Email", info.email],
    ...(!editing ? EDITABLE.map((f) => [f.label, info[f.key]]) : []),
    ["Cleaner ID", info.workerId],
    ["Role", info.role],
    ["Region", info.region === "UK" ? "United Kingdom" : info.region],
    ["Member since", since],
    ["Account status", info.status],
  ];

  return (
    <Screen>
      {header}
      <KeyboardSafeView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          <BigTitle sub="These are the details Cleaniq has for you.">Personal information</BigTitle>
          {!!error && <Text style={s.error}>{error}</Text>}
          {saved && <Text style={s.saved}>Your details have been updated.</Text>}

          {editing && (
            <View style={st.form}>
              {EDITABLE.map((f) => (
                <View key={f.key} style={{ marginBottom: 14 }}>
                  <Text style={st.label}>{f.label}</Text>
                  <TextInput
                    style={st.input}
                    value={form[f.key]}
                    onChangeText={(v) => setForm((x) => ({ ...x, [f.key]: v }))}
                    keyboardType={f.keyboardType}
                    autoCapitalize={f.autoCapitalize || "sentences"}
                    placeholderTextColor={tc(G.mute)}
                  />
                </View>
              ))}
              <View style={st.formBtns}>
                <TouchableOpacity style={[st.btn, st.btnGhost]} onPress={() => setEditing(false)} disabled={saving}>
                  <Text style={st.btnGhostTxt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={st.btn} onPress={save} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={st.btnTxt}>Save</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {rows.map(([label, value]) => (
            <View key={label} style={st.row}>
              <Text style={st.label}>{label}</Text>
              <Text style={st.value}>{value || "Not set"}</Text>
            </View>
          ))}
          <Text style={st.note}>To change your name or email, contact Cleaniq from Contact us & help centre.</Text>
        </ScrollView>
      </KeyboardSafeView>
    </Screen>
  );
}

const st = themed(StyleSheet.create({
  editTxt: { color: G.green, fontWeight: "900", fontSize: 15 },
  row: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: G.line },
  label: { fontSize: 12, color: G.sub, fontWeight: "700", marginBottom: 4 },
  value: { fontSize: 16, color: G.text, fontWeight: "700" },
  note: { fontSize: 13, color: G.sub, marginTop: 20, lineHeight: 19 },
  form: { backgroundColor: G.soft, borderRadius: 16, padding: 16, marginBottom: 10 },
  input: { borderWidth: 1.5, borderColor: G.line, backgroundColor: "#FFFFFF", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: G.text },
  formBtns: { flexDirection: "row", gap: 10, marginTop: 4 },
  btn: { flex: 1, backgroundColor: G.green, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  btnTxt: { color: "#FFFFFF", fontWeight: "900", fontSize: 15 },
  btnGhost: { backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: G.line },
  btnGhostTxt: { color: G.text, fontWeight: "900", fontSize: 15 },
}));
