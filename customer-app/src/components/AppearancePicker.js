// Light / Dark / Phone setting, remembered on this phone.
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Sun, Moon, Smartphone } from "lucide-react-native";
import { useTheme, THEME_MODES } from "../theme/ThemeContext";
import { C } from "../theme/flat";
import { tc, themed } from "../theme/dark";

const ICONS = { light: Sun, dark: Moon, system: Smartphone };

export default function AppearancePicker() {
  const { mode, setMode } = useTheme();
  return (
    <View style={st.row}>
      {THEME_MODES.map(({ id, label }) => {
        const Icon = ICONS[id];
        const on = mode === id;
        return (
          <TouchableOpacity key={id} style={[st.opt, on && st.optOn]} onPress={() => setMode(id)} activeOpacity={0.8}>
            <Icon size={18} color={on ? "#FFFFFF" : tc(C.textMed)} />
            <Text style={[st.txt, on && st.txtOn]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const st = themed(StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  opt: { flex: 1, alignItems: "center", gap: 6, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
  optOn: { backgroundColor: C.primary, borderColor: C.primary },
  txt: { fontSize: 12, fontWeight: "700", color: C.textMed },
  txtOn: { color: "#FFFFFF" },
}));
