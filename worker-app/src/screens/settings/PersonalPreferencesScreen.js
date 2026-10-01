import React from "react";
import { View, Text, ScrollView, Switch, StyleSheet } from "react-native";
import { Screen, ScreenHeader, BigTitle, Loading, usePreferences, G, styles as s } from "./common";
import { tc, themed } from "../../theme/dark";

// "Offers" preferences — e.g. don't send me jobs at homes with pets.
export default function PersonalPreferencesScreen({ navigation }) {
  const { prefs, error, save } = usePreferences();
  if (!prefs) return <Screen><ScreenHeader title="Settings" navigation={navigation} />{error ? <Text style={[s.error, { padding: 20 }]}>{error}</Text> : <Loading />}</Screen>;
  return (
    <Screen>
      <ScreenHeader title="Settings" navigation={navigation} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <BigTitle sub="Customise the offers you'd like to receive.">Offers</BigTitle>
        {!!error && <Text style={s.error}>{error}</Text>}
        <Text style={st.h3}>Animals</Text>
        <View style={st.row}>
          <Switch
            value={prefs.refusePets}
            onValueChange={(v) => save({ refusePets: v })}
            trackColor={{ true: tc(G.green, "bg"), false: tc("#E5E7EB", "bg") }}
            thumbColor="#fff"
          />
          <Text style={st.label}>Refuse offers from customers with pets</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const st = themed(StyleSheet.create({
  h3: { fontSize: 17, fontWeight: "900", color: G.text, marginTop: 8, marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 16 },
  label: { flex: 1, fontSize: 16, color: G.text, lineHeight: 22 },
}));
