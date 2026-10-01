import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Sun, Moon, Smartphone, Check } from "lucide-react-native";
import { useTheme, THEME_MODES } from "../../theme/ThemeContext";
import { Screen, ScreenHeader, BigTitle, G } from "./common";
import { tc, themed } from "../../theme/dark";

// Light mode, dark mode, or follow the phone's setting.
const ICONS = { light: Sun, dark: Moon, system: Smartphone };
const SUBS = {
  light: "White background",
  dark: "Dark background, easier on the eyes at night",
  system: "Matches your phone's light or dark setting",
};

export default function AppearanceScreen({ navigation }) {
  const { mode, setMode } = useTheme();
  return (
    <Screen>
      <ScreenHeader title="" navigation={navigation} />
      <View style={{ padding: 20 }}>
        <BigTitle sub="Choose how the app looks.">Appearance</BigTitle>
        {THEME_MODES.map(({ id, label }) => {
          const Icon = ICONS[id];
          const on = mode === id;
          return (
            <TouchableOpacity key={id} style={[st.row, on && st.rowOn]} onPress={() => setMode(id)} activeOpacity={0.8}>
              <View style={[st.icon, on && st.iconOn]}>
                <Icon size={20} color={on ? "#FFFFFF" : tc(G.text)} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.label}>{label}</Text>
                <Text style={st.sub}>{SUBS[id]}</Text>
              </View>
              {on && <Check size={20} color={tc(G.green)} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </Screen>
  );
}

const st = themed(StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 16, borderWidth: 1.5, borderColor: G.line, marginBottom: 12 },
  rowOn: { borderColor: G.green, backgroundColor: G.greenPale },
  icon: { width: 42, height: 42, borderRadius: 21, backgroundColor: G.soft, alignItems: "center", justifyContent: "center" },
  iconOn: { backgroundColor: G.green },
  label: { fontSize: 16, fontWeight: "800", color: G.text },
  sub: { fontSize: 12, color: G.sub, marginTop: 2 },
}));
