// Light / dark / phone-setting theme for the worker app, remembered on the device.
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setDarkMode } from "./dark";

const KEY = "@theme_mode";
export const THEME_MODES = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "Phone setting" },
];

const ThemeContext = createContext({ mode: "light", dark: false, setMode: () => {} });
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => setModeState(THEME_MODES.some((m) => m.id === v) ? v : "light"))
      .catch(() => setModeState("light"));
  }, []);

  const dark = mode === "dark" || (mode === "system" && system === "dark");
  // Set before children render so every colour helper reads the right theme.
  setDarkMode(dark);

  const value = useMemo(() => ({
    mode: mode || "light",
    dark,
    setMode: (m) => {
      setModeState(m);
      AsyncStorage.setItem(KEY, m).catch(() => {});
    },
  }), [mode, dark]);

  if (mode === null) return null; // a few ms while the saved choice loads
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
