import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from "react-native";
import { Car, Bike, Bus, X, MapPin } from "lucide-react-native";
import { Screen, ScreenHeader, BigTitle, Loading, usePreferences, G, styles as s } from "./common";
import KeyboardSafeView from "../../components/KeyboardSafeView";

// "What is your travel area?" — offers come from within this distance of home, plus any extra
// postcode districts; blocked districts never send offers.
const MODES = [
  { id: "car", label: "Car", Icon: Car },
  { id: "bike", label: "Bike", Icon: Bike },
  { id: "transit", label: "Public transport", Icon: Bus },
];
const DISTANCES = [3, 5, 7, 10, 15, 20, 30];
const TABS = [
  { id: "area", label: "Area" },
  { id: "add", label: "Add postcode" },
  { id: "remove", label: "Remove postcode" },
];

export default function TravelAreaScreen({ navigation }) {
  const { prefs, error, saving, save } = usePreferences();
  const [tab, setTab] = useState("area");
  const [home, setHome] = useState("");
  const [entry, setEntry] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => { if (prefs) setHome(prefs.travel.homePostcode || ""); }, [prefs]);
  if (!prefs) return <Screen><ScreenHeader title="" navigation={navigation} />{error ? <Text style={[s.error, { padding: 20 }]}>{error}</Text> : <Loading />}</Screen>;

  const t = prefs.travel;
  const update = async (patch, msg) => {
    setNote("");
    if (await save({ travel: patch })) setNote(msg || "Saved");
  };
  const listKey = tab === "add" ? "addPostcodes" : "removePostcodes";
  const addToList = () => {
    const pc = entry.trim().toUpperCase();
    if (!pc) return;
    setEntry("");
    update({ [listKey]: [...(t[listKey] || []), pc] }, tab === "add" ? `${pc} added to your area` : `You won't get offers from ${pc}`);
  };

  return (
    <Screen>
      <ScreenHeader title="" navigation={navigation} />
      <View style={{ paddingHorizontal: 20 }}>
        <BigTitle>What is your travel area?</BigTitle>
      </View>
      <View style={st.tabs}>
        {TABS.map((x) => (
          <TouchableOpacity key={x.id} style={[st.tab, tab === x.id && st.tabOn]} onPress={() => { setTab(x.id); setNote(""); }}>
            <Text style={[st.tabTxt, tab === x.id && st.tabTxtOn]}>{x.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <KeyboardSafeView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          {!!error && <Text style={s.error}>{error}</Text>}
          {!!note && <Text style={s.saved}>{note}</Text>}
  
          {tab === "area" ? (
            <>
              <Text style={st.h2}>Your means of transport</Text>
              <View style={st.chips}>
                {MODES.map(({ id, label, Icon }) => (
                  <TouchableOpacity key={id} style={[st.chip, t.mode === id && st.chipOn]} onPress={() => update({ mode: id })}>
                    <Icon size={18} color={t.mode === id ? "#fff" : G.text} />
                    <Text style={[st.chipTxt, t.mode === id && { color: "#fff" }]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
  
              <Text style={st.h2}>Your home postcode</Text>
              <View style={st.inputRow}>
                <TextInput style={st.input} value={home} onChangeText={setHome} autoCapitalize="characters" placeholder="e.g. BL0 0HL" placeholderTextColor={G.mute} />
                <TouchableOpacity style={st.smallBtn} disabled={saving} onPress={() => update({ homePostcode: home }, "Home postcode saved")}>
                  {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={st.smallBtnTxt}>Save</Text>}
                </TouchableOpacity>
              </View>
  
              <Text style={st.h2}>Distance from your home</Text>
              <View style={st.chips}>
                {DISTANCES.map((mi) => (
                  <TouchableOpacity key={mi} style={[st.chip, Number(t.radiusMiles) === mi && st.chipOn]} onPress={() => update({ radiusMiles: mi })}>
                    <Text style={[st.chipTxt, Number(t.radiusMiles) === mi && { color: "#fff" }]}>{mi} mi</Text>
                  </TouchableOpacity>
                ))}
              </View>
  
              <View style={st.area}>
                <View style={[st.circle, { width: 70 + Number(t.radiusMiles) * 6, height: 70 + Number(t.radiusMiles) * 6, borderRadius: (70 + Number(t.radiusMiles) * 6) / 2 }]}>
                  <MapPin size={22} color={G.green} />
                  <Text style={st.circleTxt}>{t.homePostcode || "Home"}</Text>
                </View>
                <Text style={st.areaTxt}>
                  Offers within {t.radiusMiles} miles of {t.homePostcode || "your home"}
                  {(t.addPostcodes || []).length ? `, plus ${t.addPostcodes.join(", ")}` : ""}
                  {(t.removePostcodes || []).length ? `, never ${t.removePostcodes.join(", ")}` : ""}.
                </Text>
              </View>
            </>
          ) : (
            <>
              <Text style={st.help}>
                {tab === "add"
                  ? "Add postcode areas you're happy to travel to even if they're further than your distance, e.g. M14."
                  : "Add postcode areas you never want offers from, e.g. WN1."}
              </Text>
              <View style={st.inputRow}>
                <TextInput style={st.input} value={entry} onChangeText={setEntry} autoCapitalize="characters" placeholder="Postcode or area, e.g. M14" placeholderTextColor={G.mute} onSubmitEditing={addToList} />
                <TouchableOpacity style={st.smallBtn} disabled={saving} onPress={addToList}>
                  <Text style={st.smallBtnTxt}>{tab === "add" ? "Add" : "Block"}</Text>
                </TouchableOpacity>
              </View>
              {(t[listKey] || []).length === 0 ? (
                <Text style={st.empty}>{tab === "add" ? "No extra areas yet." : "No blocked areas."}</Text>
              ) : (
                (t[listKey] || []).map((pc) => (
                  <View key={pc} style={st.pcRow}>
                    <MapPin size={16} color={tab === "add" ? G.green : "#B91C1C"} />
                    <Text style={st.pcTxt}>{pc}</Text>
                    <TouchableOpacity onPress={() => update({ [listKey]: t[listKey].filter((x) => x !== pc) }, `${pc} removed`)}>
                      <X size={18} color={G.sub} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </>
          )}
        </ScrollView>
      </KeyboardSafeView>
    </Screen>
  );
}

const st = StyleSheet.create({
  tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: G.line },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: "transparent" },
  tabOn: { borderBottomColor: G.green },
  tabTxt: { fontSize: 14, fontWeight: "700", color: G.text, textAlign: "center" },
  tabTxtOn: { color: G.green },
  h2: { fontSize: 19, fontWeight: "900", color: G.text, marginTop: 16, marginBottom: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: G.soft, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  chipOn: { backgroundColor: G.green },
  chipTxt: { fontSize: 15, fontWeight: "700", color: G.text },
  inputRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: { flex: 1, borderWidth: 1.5, borderColor: G.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: G.text },
  smallBtn: { backgroundColor: G.green, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 14 },
  smallBtnTxt: { color: "#fff", fontWeight: "900" },
  area: { alignItems: "center", marginTop: 24, backgroundColor: G.soft, borderRadius: 18, paddingVertical: 24, paddingHorizontal: 16 },
  circle: { backgroundColor: "#0F6B4C22", borderWidth: 1.5, borderColor: G.green, alignItems: "center", justifyContent: "center", maxWidth: 260, maxHeight: 260 },
  circleTxt: { fontSize: 12, fontWeight: "900", color: G.green, marginTop: 4 },
  areaTxt: { fontSize: 14, color: G.text, textAlign: "center", marginTop: 14, lineHeight: 20 },
  help: { fontSize: 14, color: G.sub, lineHeight: 20, marginBottom: 12 },
  empty: { fontSize: 14, color: G.mute, marginTop: 16 },
  pcRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: G.line },
  pcTxt: { flex: 1, fontSize: 16, fontWeight: "800", color: G.text },
});
