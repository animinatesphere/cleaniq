import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Switch, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Screen, ScreenHeader, BigTitle, Loading, usePreferences, G, styles as s } from "./common";

// Messages → Settings: the intro sent automatically to a new customer when you accept their job.
// {name} and {date} are filled in for you.
export default function AutoMessagesScreen({ navigation }) {
  const { prefs, error, saving, save } = usePreferences();
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (prefs) setText(prefs.autoIntro.text); }, [prefs]);
  if (!prefs) return <Screen><ScreenHeader title="Settings" navigation={navigation} />{error ? <Text style={[s.error, { padding: 20 }]}>{error}</Text> : <Loading />}</Screen>;

  return (
    <Screen>
      <ScreenHeader title="Settings" navigation={navigation} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
          <BigTitle sub="These messages are sent automatically on your behalf.">Automatic messages</BigTitle>
          {!!error && <Text style={s.error}>{error}</Text>}
          <Text style={st.h3}>Introduction</Text>
          <View style={st.row}>
            <Switch
              value={prefs.autoIntro.enabled}
              onValueChange={(v) => save({ autoIntro: { enabled: v, text } })}
              trackColor={{ true: G.green, false: "#E5E7EB" }}
              thumbColor="#fff"
            />
            <Text style={st.label}>Introduce yourself to new customers</Text>
          </View>
          <TextInput
            style={[st.bubble, !prefs.autoIntro.enabled && { opacity: 0.5 }]}
            value={text}
            onChangeText={(v) => { setText(v); setSaved(false); }}
            multiline
            maxLength={500}
            editable={prefs.autoIntro.enabled}
          />
          <Text style={st.hint}>{"{name}"} becomes your first name and {"{date}"} the date and time of the clean.</Text>
          {saved && <Text style={s.saved}>Saved</Text>}
          <TouchableOpacity
            style={[st.btn, (!prefs.autoIntro.enabled || saving) && { opacity: 0.5 }]}
            disabled={!prefs.autoIntro.enabled || saving}
            onPress={async () => setSaved(await save({ autoIntro: { enabled: true, text } }))}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={st.btnTxt}>Save message</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const st = StyleSheet.create({
  h3: { fontSize: 17, fontWeight: "900", color: G.text, marginTop: 8, marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 14 },
  label: { flex: 1, fontSize: 16, color: G.text },
  bubble: { marginLeft: 64, backgroundColor: G.soft, borderRadius: 18, padding: 16, fontSize: 15, color: G.text, lineHeight: 22, minHeight: 110, textAlignVertical: "top" },
  hint: { marginLeft: 64, fontSize: 12, color: G.sub, marginTop: 8, marginBottom: 16, lineHeight: 17 },
  btn: { backgroundColor: G.green, borderRadius: 16, paddingVertical: 15, alignItems: "center", marginTop: 4 },
  btnTxt: { color: "#fff", fontSize: 16, fontWeight: "900" },
});
