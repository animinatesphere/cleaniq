import React from "react";
import { View, Text, ScrollView, Switch, StyleSheet } from "react-native";
import { Info } from "lucide-react-native";
import { Screen, ScreenHeader, BigTitle, Loading, usePreferences, G, styles as s } from "./common";
import { tc, themed } from "../../theme/dark";

// "What services do you offer?" — only switched-on services send you offers.
const isRegularService = (svc) =>
  ["weeklyRate", "fortnightlyRate", "monthlyRate", "quarterlyRate"].some((f) => Number(svc[f]) > 0) ||
  /regular|deep/i.test(svc.name);

export default function ServicesSettingsScreen({ navigation }) {
  const { data, prefs, error, save } = usePreferences();
  if (!data) return <Screen><ScreenHeader title="" navigation={navigation} />{error ? <Text style={[s.error, { padding: 20 }]}>{error}</Text> : <Loading />}</Screen>;

  const all = (data.services || []).filter((x) => x.type === "hourly").map((x) => x.name);
  const chosen = prefs.services.length ? prefs.services : all; // empty = everything
  const toggle = (name, on) => {
    const next = on ? [...new Set([...chosen, name])] : chosen.filter((n) => n !== name);
    save({ services: next.length === all.length ? [] : next });
  };
  const pay = (svc) => {
    const first = Number(svc.workerHourlyRate) || 0;
    const following = Number(svc.workerFollowingRate) || 0;
    if (!first) return "Pay set by Cleaniq";
    return following && following !== first ? `£${first.toFixed(2)}/h then £${following.toFixed(2)}/h` : `£${first.toFixed(2)}/h`;
  };
  const regular = data.services.filter((x) => x.type === "hourly" && isRegularService(x));
  const oneOff = data.services.filter((x) => x.type === "hourly");

  const Row = ({ svc, regularRow }) => (
    <View style={st.row}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={st.name}>{svc.name}</Text>
        <View style={st.payRow}>
          <Text style={st.pay}>{regularRow ? pay(svc) : `£${(Number(svc.workerHourlyRate) || 0).toFixed(2)}/h`}</Text>
          {/regular/i.test(svc.name) && regularRow && <Text style={st.popular}>Popular</Text>}
        </View>
        <Text style={st.desc}>{regularRow ? "Repeat cleans for the same customer, e.g. every week or month." : "A single clean, just the once."}</Text>
      </View>
      <Switch
        value={chosen.includes(svc.name)}
        onValueChange={(v) => toggle(svc.name, v)}
        trackColor={{ true: tc(G.green, "bg"), false: tc("#E5E7EB", "bg") }}
        thumbColor="#fff"
      />
    </View>
  );

  return (
    <Screen>
      <ScreenHeader title="" navigation={navigation} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <BigTitle>What services do you offer?</BigTitle>
        <View style={st.info}>
          <Info size={18} color={tc(G.green)} />
          <Text style={st.infoTxt}>You only get offers for the services switched on here. Pay is set by Cleaniq.</Text>
        </View>
        {!!error && <Text style={s.error}>{error}</Text>}
        {regular.length > 0 && (
          <>
            <Text style={st.group}>Regular</Text>
            {regular.map((svc) => <Row key={`r-${svc._id}`} svc={svc} regularRow />)}
            <View style={st.divider} />
          </>
        )}
        <Text style={st.group}>One-off</Text>
        {oneOff.map((svc) => <Row key={`o-${svc._id}`} svc={svc} />)}
      </ScrollView>
    </Screen>
  );
}

const st = themed(StyleSheet.create({
  info: { flexDirection: "row", gap: 10, alignItems: "center", backgroundColor: G.greenPale, borderRadius: 16, padding: 14, marginBottom: 10 },
  infoTxt: { flex: 1, fontSize: 14, color: G.text, lineHeight: 20 },
  group: { fontSize: 22, fontWeight: "900", color: G.text, marginTop: 18, marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: G.line },
  name: { fontSize: 17, fontWeight: "800", color: G.text },
  payRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 3 },
  pay: { fontSize: 14, color: G.text },
  popular: { backgroundColor: "#FDE68A", color: "#78350F", fontSize: 11, fontWeight: "900", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: "hidden" },
  desc: { fontSize: 13, color: G.sub, marginTop: 4, lineHeight: 18 },
  divider: { height: 8, backgroundColor: G.soft, marginHorizontal: -20, marginTop: 16 },
}));
