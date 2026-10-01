import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Switch, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Minus, Plus } from "lucide-react-native";
import { Screen, ScreenHeader, BigTitle, Loading, usePreferences, G, styles as s } from "./common";

// "When would you like to work?" — offers only arrive for jobs inside these hours.
const ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const label = (d) => d[0].toUpperCase() + d.slice(1);
const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const toTime = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export default function WorkingHoursScreen({ navigation }) {
  const { prefs, error, saving, save } = usePreferences();
  const [hours, setHours] = useState(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (prefs && !hours) setHours(prefs.workingHours); }, [prefs, hours]);
  if (!hours) return <Screen><ScreenHeader title="" navigation={navigation} />{error ? <Text style={[s.error, { padding: 20 }]}>{error}</Text> : <Loading />}</Screen>;

  const change = (day, field, delta) => {
    setSaved(false);
    setHours((h) => {
      const d = { ...h[day] };
      let start = toMin(d.start), end = toMin(d.end);
      if (field === "start") start = Math.min(Math.max(6 * 60, start + delta), end - 60);
      else end = Math.max(Math.min(22 * 60, end + delta), start + 60);
      return { ...h, [day]: { ...d, start: toTime(start), end: toTime(end) } };
    });
  };
  const Stepper = ({ day, field }) => (
    <View style={st.stepper}>
      <TouchableOpacity style={st.stepBtn} onPress={() => change(day, field, -30)}><Minus size={16} color={G.text} /></TouchableOpacity>
      <Text style={st.time}>{hours[day][field]}</Text>
      <TouchableOpacity style={[st.stepBtn, st.stepBtnDark]} onPress={() => change(day, field, 30)}><Plus size={16} color="#fff" /></TouchableOpacity>
    </View>
  );

  return (
    <Screen>
      <ScreenHeader title="" navigation={navigation} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <BigTitle sub="You'll only receive offers that fit these hours.">When would you like to work?</BigTitle>
        {ORDER.map((day) => {
          const d = hours[day];
          return (
            <View key={day} style={st.day}>
              <View style={st.dayTop}>
                <Text style={st.dayName}>{label(day)}</Text>
                <Text style={[st.range, !d.on && { color: G.mute }]}>{d.on ? `${d.start} – ${d.end}` : "Not working"}</Text>
                <Switch
                  value={d.on}
                  onValueChange={(v) => { setSaved(false); setHours((h) => ({ ...h, [day]: { ...h[day], on: v } })); }}
                  trackColor={{ true: G.green, false: "#E5E7EB" }}
                  thumbColor="#fff"
                />
              </View>
              {d.on && (
                <View style={st.steppers}>
                  <View style={{ flex: 1 }}><Text style={st.small}>From</Text><Stepper day={day} field="start" /></View>
                  <View style={{ flex: 1 }}><Text style={st.small}>To</Text><Stepper day={day} field="end" /></View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
      <View style={st.footer}>
        {!!error && <Text style={s.error}>{error}</Text>}
        {saved && <Text style={s.saved}>Saved. Your offers now follow these hours.</Text>}
        <TouchableOpacity style={st.saveBtn} disabled={saving} onPress={async () => setSaved(await save({ workingHours: hours }))}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={st.saveTxt}>Save working hours</Text>}
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const st = StyleSheet.create({
  day: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: G.line },
  dayTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  dayName: { width: 110, fontSize: 17, fontWeight: "900", color: G.text },
  range: { flex: 1, fontSize: 16, fontWeight: "800", color: G.text },
  steppers: { flexDirection: "row", gap: 16, marginTop: 12 },
  small: { fontSize: 12, color: G.sub, fontWeight: "700", marginBottom: 6 },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: G.soft, borderRadius: 24, padding: 4 },
  stepBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: G.text, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  stepBtnDark: { backgroundColor: G.text },
  time: { fontSize: 16, fontWeight: "900", color: G.text },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: 28, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: G.line },
  saveBtn: { backgroundColor: G.green, borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  saveTxt: { color: "#fff", fontSize: 16, fontWeight: "900" },
});
